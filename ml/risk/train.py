import os
import json
import joblib
import numpy as np
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score

from ml.risk.dataset import generate_synthetic_risk_dataset

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / 'models'
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODELS_DIR / 'risk_model.joblib'
SCALER_PATH = MODELS_DIR / 'risk_scaler.joblib'
METRICS_PATH = MODELS_DIR / 'risk_metrics.json'

def train_overspending_risk_model():
    """
    Trains Logistic Regression model to classify overspending risk into 3 tiers.
    """
    print("Generating training dataset for Overspending Risk Classifier...")
    X, y = generate_synthetic_risk_dataset(num_samples=800)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Logistic Regression Classifier
    classifier = LogisticRegression(C=5.0, max_iter=500, random_state=42)
    classifier.fit(X_train_scaled, y_train)

    # Predict & Evaluate
    y_pred = classifier.predict(X_test_scaled)
    y_proba = classifier.predict_proba(X_test_scaled)

    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='macro', zero_division=0)
    
    try:
        roc_auc = roc_auc_score(y_test, y_proba, multi_class='ovr', average='macro')
    except Exception:
        roc_auc = 0.0

    metrics = {
        'model_name': 'Logistic Regression Overspending Risk Classifier',
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'accuracy': round(float(acc), 4),
        'precision_macro': round(float(prec), 4),
        'recall_macro': round(float(rec), 4),
        'f1_score_macro': round(float(f1), 4),
        'roc_auc_macro': round(float(roc_auc), 4)
    }

    print("\n--- Overspending Risk Model Evaluation Metrics ---")
    print(f"Accuracy:        {metrics['accuracy'] * 100:.2f}%")
    print(f"Macro Precision: {metrics['precision_macro'] * 100:.2f}%")
    print(f"Macro Recall:    {metrics['recall_macro'] * 100:.2f}%")
    print(f"Macro F1-Score:  {metrics['f1_score_macro'] * 100:.2f}%")
    print(f"ROC-AUC:         {metrics['roc_auc_macro']:.4f}")

    # Persist artifacts
    joblib.dump(classifier, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\nSaved Overspending Risk model artifacts to {MODELS_DIR}")
    return metrics

if __name__ == '__main__':
    train_overspending_risk_model()
