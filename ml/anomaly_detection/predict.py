import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / 'models'
MODEL_PATH = MODELS_DIR / 'anomaly_isolation_forest.joblib'

_model = None

def _load_anomaly_model():
    global _model
    if _model is None:
        if MODEL_PATH.exists():
            try:
                _model = joblib.load(MODEL_PATH)
                return True
            except Exception as e:
                print(f"Failed to load anomaly model: {e}")
                return False
        else:
            return False
    return True

def detect_transaction_anomalies(expenses_list):
    """
    Scans a list of user expense dicts using Isolation Forest + category statistical z-score.
    Returns list of detected anomalies.
    """
    if not expenses_list or len(expenses_list) == 0:
        return []

    df = pd.DataFrame(expenses_list)
    if 'amount' not in df.columns or df.empty:
        return []

    # Calculate overall and category-level averages
    overall_mean = df['amount'].mean()
    category_means = df.groupby('category')['amount'].mean().to_dict()

    _load_anomaly_model()

    anomalies = []
    
    for idx, exp in df.iterrows():
        amt = float(exp['amount'])
        cat = exp.get('category', 'Other')
        cat_avg = category_means.get(cat, overall_mean)

        is_anomaly = False
        reason = ""
        anomaly_score = 0.0

        # Feature vector for model prediction: [amount, log_amount, ratio_to_mean]
        log_amt = np.log1p(amt)
        ratio_to_mean = amt / overall_mean if overall_mean > 0 else 1.0
        feature_vec = np.array([[amt, log_amt, ratio_to_mean]])

        if _model is not None:
            try:
                # Isolation Forest decision_function returns negative values for anomalies
                score = float(_model.decision_function(feature_vec)[0])
                pred = int(_model.predict(feature_vec)[0])
                anomaly_score = round(float(score), 4)

                if pred == -1 or amt >= max(cat_avg * 3.0, 3500.0):
                    is_anomaly = True
            except Exception:
                if amt >= max(cat_avg * 3.2, 3500.0):
                    is_anomaly = True
        else:
            if amt >= max(cat_avg * 3.2, 3500.0):
                is_anomaly = True

        if is_anomaly:
            ratio = round(amt / cat_avg, 1) if cat_avg > 0 else 1.0
            reason = f"This transaction of ₹{amt:,.2f} is {ratio}x higher than your average {cat} expense (₹{round(cat_avg, 2):,.2f})."
            
            anomalies.append({
                'expense_id': exp.get('id'),
                'amount': amt,
                'description': exp.get('description', ''),
                'category': cat,
                'date': exp.get('date'),
                'anomaly_score': anomaly_score,
                'reason': reason,
                'status': exp.get('anomaly_status', 'Pending')  # 'Pending', 'Expected', 'Unexpected'
            })

    # Sort anomalies by amount descending
    anomalies.sort(key=lambda x: x['amount'], reverse=True)
    return anomalies
