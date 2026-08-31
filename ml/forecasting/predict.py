import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta

from ml.forecasting.dataset import prepare_daily_timeseries, WINDOW_SIZE

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / 'models'
MODEL_PATH_PYTORCH = MODELS_DIR / 'lstm_forecast.pth'
MODEL_PATH_SKLEARN = MODELS_DIR / 'lstm_forecast_mlp.joblib'
SCALER_PATH = MODELS_DIR / 'lstm_scaler.joblib'
METRICS_PATH = MODELS_DIR / 'lstm_metrics.json'

_model = None
_model_type = None
_scaler = None

def _load_forecasting_artifacts():
    global _model, _model_type, _scaler
    if _model is None or _scaler is None:
        if SCALER_PATH.exists():
            _scaler = joblib.load(SCALER_PATH)

        # 1. Try PyTorch
        if MODEL_PATH_PYTORCH.exists():
            try:
                import torch
                import torch.nn as nn
                class LSTMForecaster(nn.Module):
                    def __init__(self, input_size=1, hidden_size=32, num_layers=1, output_size=1):
                        super(LSTMForecaster, self).__init__()
                        self.hidden_size = hidden_size
                        self.num_layers = num_layers
                        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
                        self.fc = nn.Linear(hidden_size, output_size)

                    def forward(self, x):
                        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
                        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
                        out, _ = self.lstm(x, (h0, c0))
                        out = self.fc(out[:, -1, :])
                        return out

                m = LSTMForecaster(input_size=1, hidden_size=32, num_layers=1, output_size=1)
                m.load_state_dict(torch.load(MODEL_PATH_PYTORCH, weights_only=True))
                m.eval()
                _model = m
                _model_type = 'pytorch'
                return True
            except Exception:
                pass

        # 2. Try Scikit-Learn MLP Neural Net
        if MODEL_PATH_SKLEARN.exists():
            try:
                _model = joblib.load(MODEL_PATH_SKLEARN)
                _model_type = 'sklearn'
                return True
            except Exception:
                pass

        return False
    return True

def forecast_user_spending(expenses_list, days_ahead=30):
    """
    Given a list of user expense dicts, computes recursive LSTM forecast for future days.
    """
    if not expenses_list or len(expenses_list) == 0:
        return {
            'data_sufficient': False,
            'message': 'You need at least 14 days of historical transaction data to generate a reliable forecast.'
        }

    df_expenses = pd.DataFrame(expenses_list)
    df_daily = prepare_daily_timeseries(df_expenses)

    if len(df_daily) < 14:
        return {
            'data_sufficient': False,
            'days_available': len(df_daily),
            'message': f'You have {len(df_daily)} days of historical transaction history. You need at least 14 days to generate a reliable forecast.'
        }

    if not _load_forecasting_artifacts():
        avg_daily = df_daily['amount'].mean()
        f_7 = round(avg_daily * 7, 2)
        f_30 = round(avg_daily * 30, 2)
        return {
            'data_sufficient': True,
            'days_analyzed': len(df_daily),
            'forecast_7_days': f_7,
            'forecast_30_days': f_30,
            'forecast_next_month': f_30,
            'daily_forecast': [],
            'category_forecasts': [],
            'disclaimer': 'Forecast based on historical spending patterns.'
        }

    recent_series = df_daily['amount'].values[-WINDOW_SIZE:].reshape(-1, 1)
    if len(recent_series) < WINDOW_SIZE:
        pad_len = WINDOW_SIZE - len(recent_series)
        pad_val = np.mean(recent_series) if len(recent_series) > 0 else 100.0
        recent_series = np.pad(recent_series, ((pad_len, 0), (0, 0)), mode='constant', constant_values=pad_val)

    scaled_seq = _scaler.transform(recent_series)
    curr_seq = list(scaled_seq.flatten())
    daily_predictions = []

    last_date = pd.to_datetime(df_daily['date'].iloc[-1]).date()

    for i in range(days_ahead):
        x_input_window = curr_seq[-WINDOW_SIZE:]
        
        if _model_type == 'pytorch':
            import torch
            x_input = np.array(x_input_window).reshape(1, WINDOW_SIZE, 1)
            x_tensor = torch.tensor(x_input, dtype=torch.float32)
            with torch.no_grad():
                pred_scaled = _model(x_tensor).item()
        else: # sklearn MLP
            x_input = np.array(x_input_window).reshape(1, WINDOW_SIZE)
            pred_scaled = float(_model.predict(x_input)[0])

        pred_scaled = max(0.0, pred_scaled)
        pred_orig = float(_scaler.inverse_transform([[pred_scaled]])[0][0])
        pred_orig = max(0.0, round(pred_orig, 2))

        next_date = last_date + timedelta(days=i + 1)
        daily_predictions.append({
            'date': next_date.strftime('%Y-%m-%d'),
            'predicted_amount': pred_orig
        })

        curr_seq.append(pred_scaled)

    forecast_7 = sum(p['predicted_amount'] for p in daily_predictions[:7])
    forecast_30 = sum(p['predicted_amount'] for p in daily_predictions[:30])

    # Category proportions
    cat_totals = df_expenses.groupby('category')['amount'].sum()
    total_hist = cat_totals.sum()

    cat_forecasts = []
    if total_hist > 0:
        for cat_name, cat_amt in cat_totals.items():
            prop = cat_amt / total_hist
            cat_forecasts.append({
                'category': str(cat_name),
                'predicted_amount': round(forecast_30 * prop, 2),
                'percentage': round(prop * 100, 1)
            })
        cat_forecasts.sort(key=lambda x: x['predicted_amount'], reverse=True)

    metrics_data = {}
    if METRICS_PATH.exists():
        try:
            with open(METRICS_PATH, 'r') as f:
                metrics_data = json.load(f)
        except Exception:
            pass

    return {
        'data_sufficient': True,
        'days_analyzed': len(df_daily),
        'forecast_7_days': round(forecast_7, 2),
        'forecast_30_days': round(forecast_30, 2),
        'forecast_next_month': round(forecast_30, 2),
        'daily_forecast': daily_predictions,
        'category_forecasts': cat_forecasts,
        'metrics': metrics_data,
        'disclaimer': 'Forecast based on historical spending patterns.'
    }
