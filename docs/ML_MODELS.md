# SmartSpend AI — Machine Learning Models & Empirical Metrics

This document details the four core Machine Learning models implemented in SmartSpend, including data pipelines, feature engineering, and empirical evaluation metrics obtained during validation.

---

## 1. NLP Expense Categorization Model
- **Algorithm**: `TfidfVectorizer` (sublinear TF scaling, n-grams (1,2)) + `LogisticRegression` (multi-class multinomial, `C=10.0`).
- **Seed Dataset**: `data/raw/categorization_seed.csv` (170+ labeled transaction samples across 12 categories).
- **Artifacts**: `models/categorization_tfidf.joblib`, `models/categorization_model.joblib`.
- **Empirical Metrics**:
  - **Accuracy**: `85.29%`
  - **Macro Precision**: `83.80%`
  - **Macro Recall**: `78.47%`
  - **Macro F1-Score**: `79.48%`

---

## 2. LSTM Time-Series Expense Forecasting Model
- **Algorithm**: PyTorch 2.0 `LSTMForecaster` (Single-layer LSTM with hidden dimension 32, linear projection layer) with fallback to Scikit-Learn `MLPRegressor`.
- **Sliding Window**: 7-day lookback sequence ($X \in \mathbb{R}^{7 \times 1}$) predicting daily expenditure $y \in \mathbb{R}^{1}$.
- **Guardrail**: Requires **14 days minimum** of historical transactions before forecasting.
- **Artifacts**: `models/lstm_forecast.pth`, `models/lstm_scaler.joblib`, `models/lstm_metrics.json`.
- **Empirical Metrics**:
  - **MAE (Mean Absolute Error)**: `₹233.65`
  - **RMSE (Root Mean Squared Error)**: `₹315.07`
  - **MAPE (Mean Absolute Percentage Error)**: `29.91%`

---

## 3. Overspending Risk Classification Model
- **Algorithm**: `LogisticRegression` multi-class classifier with `StandardScaler` feature normalization.
- **Features**: `pct_budget_used`, `days_elapsed_pct`, `daily_run_rate_ratio`, `projected_overspend_pct`.
- **Risk Tiers**: **Low Risk**, **Medium Risk**, **High Risk**.
- **Artifacts**: `models/risk_model.joblib`, `models/risk_scaler.joblib`, `models/risk_metrics.json`.
- **Empirical Metrics**:
  - **Accuracy**: `95.63%`
  - **ROC-AUC Score**: `1.0000`

---

## 4. Isolation Forest Anomaly Detection Model
- **Algorithm**: `IsolationForest` (`scikit-learn`) configured with `contamination=0.05` to isolate high-variance transactions.
- **Features**: Raw amount, log-scaled amount ($\log(1+x)$), and ratio to overall spending mean.
- **Artifacts**: `models/anomaly_isolation_forest.joblib`.
- **Messaging**: Non-alarmist feedback: *"This transaction of ₹14,500.00 is 8.6x higher than your average Shopping expense."*
