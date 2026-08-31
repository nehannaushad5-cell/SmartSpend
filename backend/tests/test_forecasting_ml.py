from ml.forecasting.predict import forecast_user_spending
from ml.forecasting.train import train_lstm_forecasting_model

def test_lstm_training():
    metrics = train_lstm_forecasting_model()
    assert 'mae' in metrics
    assert 'rmse' in metrics
    assert metrics['sequence_window_size'] == 7

def test_forecast_insufficient_data():
    expenses = [{'amount': 100, 'date': '2026-08-01', 'category': 'Food & Dining'}]
    res = forecast_user_spending(expenses)
    assert res['data_sufficient'] is False
    assert 'message' in res

def test_forecast_sufficient_data():
    expenses = []
    # 20 days of data
    for i in range(1, 21):
        expenses.append({
            'amount': 200.0 + (i * 10),
            'date': f'2026-08-{i:02d}',
            'category': 'Food & Dining' if i % 2 == 0 else 'Shopping'
        })
    res = forecast_user_spending(expenses, days_ahead=30)
    assert res['data_sufficient'] is True
    assert res['forecast_7_days'] > 0
    assert res['forecast_30_days'] > 0
    assert len(res['daily_forecast']) == 30
    assert len(res['category_forecasts']) == 2
