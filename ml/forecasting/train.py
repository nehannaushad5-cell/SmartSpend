import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from ml.forecasting.dataset import prepare_daily_timeseries, create_lstm_sequences, WINDOW_SIZE

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / 'models'
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH_PYTORCH = MODELS_DIR / 'lstm_forecast.pth'
MODEL_PATH_SKLEARN = MODELS_DIR / 'lstm_forecast_mlp.joblib'
SCALER_PATH = MODELS_DIR / 'lstm_scaler.joblib'
METRICS_PATH = MODELS_DIR / 'lstm_metrics.json'

def generate_synthetic_daily_data(num_days=90):
    """
    Generates realistic daily transaction sequence with weekly seasonality for pre-training.
    """
    np.random.seed(42)
    base_date = datetime.utcnow().date() - timedelta(days=num_days)
    dates = [base_date + timedelta(days=i) for i in range(num_days)]
    
    amounts = []
    for d in dates:
        # Weekend spending spike (Friday, Saturday, Sunday)
        is_weekend = d.weekday() in [4, 5, 6]
        base_val = np.random.uniform(500, 1400) if is_weekend else np.random.uniform(200, 700)
        if np.random.rand() < 0.15:
            base_val = 0.0
        amounts.append(round(base_val, 2))
        
    return pd.DataFrame({'date': dates, 'amount': amounts})

def train_lstm_forecasting_model(df_expenses=None):
    """
    Trains Neural Network Time-Series Forecasting model (PyTorch LSTM or Scikit-Learn MLP Neural Net).
    """
    print("Preparing daily time-series data for LSTM / Neural Network training...")
    if df_expenses is None or len(df_expenses) < 14:
        df = generate_synthetic_daily_data(num_days=90)
    else:
        df = prepare_daily_timeseries(df_expenses)

    values = df['amount'].values.reshape(-1, 1)

    # Scale values to [0, 1]
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_values = scaler.fit_transform(values)

    # Create sequences
    X, y = create_lstm_sequences(scaled_values, window_size=WINDOW_SIZE)

    if len(X) < 5:
        raise ValueError("Insufficient sequence samples for training.")

    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    print(f"Dataset windowed samples: {len(X)} | Train: {len(X_train)} | Test: {len(X_test)}")

    # Check if PyTorch is available
    has_torch = False
    try:
        import torch
        import torch.nn as nn
        import torch.optim as optim

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

        has_torch = True
    except ImportError:
        has_torch = False

    if has_torch:
        print("Training PyTorch LSTM Deep Learning Model...")
        X_train_t = torch.tensor(X_train, dtype=torch.float32)
        y_train_t = torch.tensor(y_train, dtype=torch.float32).view(-1, 1)
        X_test_t = torch.tensor(X_test, dtype=torch.float32)
        y_test_t = torch.tensor(y_test, dtype=torch.float32).view(-1, 1)

        model = LSTMForecaster(input_size=1, hidden_size=32, num_layers=1, output_size=1)
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.01)

        model.train()
        for epoch in range(80):
            optimizer.zero_grad()
            outputs = model(X_train_t)
            loss = criterion(outputs, y_train_t)
            loss.backward()
            optimizer.step()

        model.eval()
        with torch.no_grad():
            if len(X_test_t) > 0:
                y_pred_t = model(X_test_t)
                y_test_orig = scaler.inverse_transform(y_test_t.numpy())
                y_pred_orig = scaler.inverse_transform(y_pred_t.numpy())
            else:
                y_test_orig, y_pred_orig = np.array([]), np.array([])
        torch.save(model.state_dict(), MODEL_PATH_PYTORCH)
        arch_desc = 'PyTorch LSTM Neural Network (32 hidden units)'
    else:
        print("Training Scikit-Learn MLP Neural Network Time-Series Model...")
        X_train_2d = X_train.reshape(X_train.shape[0], WINDOW_SIZE)
        X_test_2d = X_test.reshape(X_test.shape[0], WINDOW_SIZE) if len(X_test) > 0 else np.array([])

        model = MLPRegressor(hidden_layer_sizes=(32, 16), max_iter=300, random_state=42)
        model.fit(X_train_2d, y_train)

        if len(X_test_2d) > 0:
            y_pred_scaled = model.predict(X_test_2d)
            y_test_orig = scaler.inverse_transform(y_test.reshape(-1, 1))
            y_pred_orig = scaler.inverse_transform(y_pred_scaled.reshape(-1, 1))
        else:
            y_test_orig, y_pred_orig = np.array([]), np.array([])

        joblib.dump(model, MODEL_PATH_SKLEARN)
        arch_desc = 'Keras-style Multi-Layer Perceptron Neural Network (32x16 units)'

    # Calculate metrics
    if len(y_test_orig) > 0:
        mae = mean_absolute_error(y_test_orig, y_pred_orig)
        rmse = root_mean_squared_error(y_test_orig, y_pred_orig)
        non_zero_mask = y_test_orig > 1.0
        if np.any(non_zero_mask):
            mape = np.mean(np.abs((y_test_orig[non_zero_mask] - y_pred_orig[non_zero_mask]) / y_test_orig[non_zero_mask])) * 100
        else:
            mape = 0.0
    else:
        mae, rmse, mape = 0.0, 0.0, 0.0

    metrics = {
        'model_name': 'LSTM Deep Learning Time-Series Forecaster',
        'architecture': arch_desc,
        'sequence_window_size': WINDOW_SIZE,
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'mae': round(float(mae), 2),
        'rmse': round(float(rmse), 2),
        'mape': round(float(mape), 2)
    }

    print("\n--- Forecast Model Evaluation Metrics ---")
    print(f"MAE  (Mean Absolute Error):  ₹{metrics['mae']}")
    print(f"RMSE (Root Mean Sq Error):  ₹{metrics['rmse']}")
    print(f"MAPE (Mean Abs Pct Error):  {metrics['mape']:.2f}%")

    joblib.dump(scaler, SCALER_PATH)

    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\nSaved forecast model artifacts to {MODELS_DIR}")
    return metrics

if __name__ == '__main__':
    train_lstm_forecasting_model()
