import numpy as np
import pandas as pd

def generate_synthetic_risk_dataset(num_samples=600):
    """
    Generates realistic budget telemetry features for training the Overspending Risk Model.
    Features:
      - pct_budget_used: % of budget consumed so far (0 - 150%)
      - days_elapsed_pct: % of month passed (3 - 97%)
      - daily_run_rate_ratio: (current_daily_avg / target_daily_avg)
      - projected_overspend_pct: (projected_end_month / budget_amount * 100)
    Target labels:
      - 0: Low Risk
      - 1: Medium Risk
      - 2: High Risk
    """
    np.random.seed(42)
    
    pct_budget_used = np.random.uniform(10, 140, num_samples)
    days_elapsed_pct = np.random.uniform(10, 95, num_samples)
    
    # Calculate daily run rate ratio
    daily_run_rate_ratio = (pct_budget_used / np.maximum(days_elapsed_pct, 1.0))
    
    # Projected EOM %
    projected_overspend_pct = (pct_budget_used / np.maximum(days_elapsed_pct, 1.0)) * 100.0
    
    labels = []
    for p_eom, pct_used, days_pct in zip(projected_overspend_pct, pct_budget_used, days_elapsed_pct):
        if p_eom > 105 or (pct_used > 85 and days_pct < 80):
            labels.append(2)  # High Risk
        elif p_eom > 90 or (pct_used > 70 and days_pct < 75):
            labels.append(1)  # Medium Risk
        else:
            labels.append(0)  # Low Risk

    X = pd.DataFrame({
        'pct_budget_used': pct_budget_used,
        'days_elapsed_pct': days_elapsed_pct,
        'daily_run_rate_ratio': daily_run_rate_ratio,
        'projected_overspend_pct': projected_overspend_pct
    })
    
    y = np.array(labels)
    return X, y
