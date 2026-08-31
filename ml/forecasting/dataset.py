import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler

WINDOW_SIZE = 7  # 7 days sequence length

def prepare_daily_timeseries(expenses_df, date_col='date', amount_col='amount'):
    """
    Resamples raw expense transactions into a continuous daily time-series.
    Fills days with no expenses as 0.0.
    Returns: pandas DataFrame with columns ['date', 'amount']
    """
    if expenses_df.empty:
        return pd.DataFrame(columns=['date', 'amount'])

    df = expenses_df.copy()
    df[date_col] = pd.to_datetime(df[date_col])
    df[amount_col] = pd.to_numeric(df[amount_col], errors='coerce').fillna(0.0)

    # Group by date
    daily_series = df.groupby(date_col)[amount_col].sum().reset_index()

    # Reindex to continuous date range
    min_date = daily_series[date_col].min()
    max_date = daily_series[date_col].max()

    full_date_range = pd.date_range(start=min_date, end=max_date, freq='D')
    daily_series = daily_series.set_index(date_col).reindex(full_date_range, fill_value=0.0).reset_index()
    daily_series.columns = ['date', 'amount']

    return daily_series

def create_lstm_sequences(series_data, window_size=WINDOW_SIZE):
    """
    Converts 1D array of daily spending into sliding window sequences (X, y) for LSTM.
    X shape: (samples, window_size, 1)
    y shape: (samples,)
    """
    X, y = [], []
    for i in range(len(series_data) - window_size):
        X.append(series_data[i:i + window_size])
        y.append(series_data[i + window_size])
        
    X = np.array(X)
    y = np.array(y)
    
    if len(X) > 0:
        X = X.reshape((X.shape[0], X.shape[1], 1))
        
    return X, y
