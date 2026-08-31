from ml.risk.predict import predict_overspending_risk
from ml.risk.train import train_overspending_risk_model

def test_risk_model_training():
    metrics = train_overspending_risk_model()
    assert 'accuracy' in metrics
    assert metrics['accuracy'] >= 0.85
    assert metrics['roc_auc_macro'] >= 0.80

def test_low_risk_scenario():
    # User spent 20% of 10,000 budget
    res = predict_overspending_risk(current_spending=2000.0, budget_amount=10000.0)
    assert res['risk_level'] == 'Low Risk'
    assert res['overspending_probability'] < 50.0

def test_high_risk_scenario():
    from datetime import date
    # User spent 9,200 of 10,000 budget with 10 days left (Aug 21)
    res = predict_overspending_risk(current_spending=9200.0, budget_amount=10000.0, current_date=date(2026, 8, 21))
    assert res['risk_level'] == 'High Risk'
    assert res['overspending_probability'] >= 70.0
    assert len(res['contributing_factors']) > 0
