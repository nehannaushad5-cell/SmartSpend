import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import IsolationForest

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / 'models'
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODELS_DIR / 'anomaly_isolation_forest.joblib'

def generate_synthetic_anomaly_training_data(num_samples=500):
    """
    Generates realistic distribution of transaction amounts and z-score features to train Isolation Forest.
    """
    np.random.seed(42)
    # 95% normal expenses between 100 and 2500
    normal_amounts = np.random.exponential(scale=500, size=int(num_samples * 0.95)) + 50
    
    # 5% outlier expenses between 8000 and 35000
    anomalous_amounts = np.random.uniform(8000, 35000, size=int(num_samples * 0.05))
    
    all_amounts = np.concatenate([normal_amounts, anomalous_amounts])
    np.random.shuffle(all_amounts)
    
    # Feature 1: Log Amount, Feature 2: Relative ratio to mean
    mean_val = np.mean(all_amounts)
    log_amt = np.log1p(all_amounts)
    ratio_to_mean = all_amounts / mean_val
    
    X = np.column_stack([all_amounts, log_amt, ratio_to_mean])
    return X

def train_anomaly_detection_model():
    """
    Trains Isolation Forest for unsupervised anomaly detection.
    """
    print("Training Isolation Forest Anomaly Detection Model...")
    X = generate_synthetic_anomaly_training_data(num_samples=600)

    clf = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    )
    clf.fit(X)

    joblib.dump(clf, MODEL_PATH)
    print(f"Saved Isolation Forest anomaly model to {MODEL_PATH}")
    return clf

if __name__ == '__main__':
    train_anomaly_detection_model()
