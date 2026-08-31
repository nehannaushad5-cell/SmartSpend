from ml.anomaly_detection.predict import detect_transaction_anomalies
from ml.recurring.detector import detect_recurring_expenses

def test_anomaly_detection_outlier():
    expenses = [
        {'id': 1, 'amount': 450.0, 'category': 'Shopping', 'description': 'T-Shirt', 'date': '2026-08-01'},
        {'id': 2, 'amount': 500.0, 'category': 'Shopping', 'description': 'Jeans', 'date': '2026-08-05'},
        {'id': 3, 'amount': 600.0, 'category': 'Shopping', 'description': 'Shoes', 'date': '2026-08-10'},
        {'id': 4, 'amount': 12500.0, 'category': 'Shopping', 'description': 'Designer Watch Outlier', 'date': '2026-08-15'}
    ]
    anomalies = detect_transaction_anomalies(expenses)
    assert len(anomalies) >= 1
    outlier = anomalies[0]
    assert outlier['amount'] == 12500.0
    assert 'higher than your average' in outlier['reason']

def test_recurring_expense_detection():
    expenses = [
        {'amount': 649.0, 'category': 'Subscriptions', 'description': 'Netflix Subscription', 'date': '2026-06-01'},
        {'amount': 649.0, 'category': 'Subscriptions', 'description': 'Netflix Subscription', 'date': '2026-07-01'},
        {'amount': 649.0, 'category': 'Subscriptions', 'description': 'Netflix Subscription', 'date': '2026-08-01'}
    ]
    res = detect_recurring_expenses(expenses)
    assert res['total_monthly_recurring'] == 649.0
    assert len(res['recurring_expenses']) == 1
    assert res['recurring_expenses'][0]['title'] == 'Netflix Subscription'
