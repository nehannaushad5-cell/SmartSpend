import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
import calendar
from datetime import datetime

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / 'models'
MODEL_PATH = MODELS_DIR / 'risk_model.joblib'
SCALER_PATH = MODELS_DIR / 'risk_scaler.joblib'
METRICS_PATH = MODELS_DIR / 'risk_metrics.json'

_classifier = None
_scaler = None

def _load_risk_artifacts():
    global _classifier, _scaler
    if _classifier is None or _scaler is None:
        if MODEL_PATH.exists() and SCALER_PATH.exists():
            try:
                _classifier = joblib.load(MODEL_PATH)
                _scaler = joblib.load(SCALER_PATH)
                return True
            except Exception as e:
                print(f"Failed to load risk model artifacts: {e}")
                return False
        else:
            return False
    return True

def predict_overspending_risk(current_spending, budget_amount, current_date=None):
    """
    Computes overspending risk classification, probability, and contributing factor explanations.
    """
    if current_date is None:
        current_date = datetime.utcnow().date()
        
    year = current_date.year
    month = current_date.month
    day = current_date.day
    
    total_days_in_month = calendar.monthrange(year, month)[1]
    days_elapsed = max(day, 1)
    days_remaining = max(total_days_in_month - days_elapsed, 0)
    
    pct_budget_used = round((current_spending / budget_amount * 100.0), 1) if budget_amount > 0 else 0.0
    days_elapsed_pct = round((days_elapsed / total_days_in_month * 100.0), 1)
    
    current_daily_avg = current_spending / days_elapsed
    target_daily_avg = budget_amount / total_days_in_month if budget_amount > 0 else 1.0
    
    daily_run_rate_ratio = current_daily_avg / target_daily_avg if target_daily_avg > 0 else 1.0
    projected_eom = current_spending + (current_daily_avg * days_remaining)
    projected_overspend_pct = round((projected_eom / budget_amount * 100.0), 1) if budget_amount > 0 else 0.0

    risk_level = "Low Risk"
    risk_probability = 15.0
    
    if _load_risk_artifacts():
        try:
            X_df = pd.DataFrame([{
                'pct_budget_used': pct_budget_used,
                'days_elapsed_pct': days_elapsed_pct,
                'daily_run_rate_ratio': daily_run_rate_ratio,
                'projected_overspend_pct': projected_overspend_pct
            }])
            X_scaled = _scaler.transform(X_df)
            probs = _classifier.predict_proba(X_scaled)[0]
            pred_class = int(np.argmax(probs))
            
            # Map classes: 0 -> Low, 1 -> Medium, 2 -> High
            tier_names = ["Low Risk", "Medium Risk", "High Risk"]
            risk_level = tier_names[pred_class]
            
            # High/Medium risk probability
            if pred_class == 2:
                risk_probability = round(probs[2] * 100, 1)
            elif pred_class == 1:
                risk_probability = round(probs[1] * 100, 1)
            else:
                risk_probability = round((1 - probs[0]) * 100, 1)
        except Exception as e:
            print(f"Risk model inference fallback: {e}")

    # Explicit threshold fallback rules if probabilities feel misaligned
    if pct_budget_used >= 95 or projected_overspend_pct >= 115:
        risk_level = "High Risk"
        risk_probability = max(risk_probability, 85.0)
    elif pct_budget_used >= 80 or projected_overspend_pct >= 100:
        if risk_level == "Low Risk":
            risk_level = "Medium Risk"
            risk_probability = max(risk_probability, 60.0)

    # Construct contributing factor explanations
    factors = []
    if pct_budget_used > 80:
        factors.append(f"You have used {pct_budget_used}% of your budget with {days_remaining} days remaining.")
    else:
        factors.append(f"Budget utilization is currently at {pct_budget_used}%.")

    if daily_run_rate_ratio > 1.2:
        factors.append(f"Your daily burn rate (₹{round(current_daily_avg, 2)}/day) is {round(daily_run_rate_ratio * 100 - 100, 1)}% higher than the target run rate (₹{round(target_daily_avg, 2)}/day).")
    else:
        factors.append(f"Your daily burn rate is ₹{round(current_daily_avg, 2)}/day.")

    if projected_eom > budget_amount:
        over_amt = round(projected_eom - budget_amount, 2)
        factors.append(f"At your current trend, you are projected to exceed your budget by ₹{over_amt} by month-end.")

    return {
        'risk_level': risk_level,
        'overspending_probability': risk_probability,
        'current_spending': round(current_spending, 2),
        'budget_amount': round(budget_amount, 2),
        'pct_budget_used': pct_budget_used,
        'days_elapsed': days_elapsed,
        'days_remaining': days_remaining,
        'current_daily_avg': round(current_daily_avg, 2),
        'projected_end_of_month': round(projected_eom, 2),
        'contributing_factors': factors
    }
