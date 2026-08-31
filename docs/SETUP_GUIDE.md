# SmartSpend AI — Local Development & Setup Guide

This guide describes how to set up, run, and verify **SmartSpend** locally on your machine.

---

## Prerequisites
- **Python 3.11+**
- **Node.js 18+** & `npm`
- **Git**

---

## 1. Backend Setup (Flask + PyTorch + Scikit-Learn)

```bash
# Navigate to workspace root
cd smartspend

# Create virtual environment inside backend/
python3 -m venv backend/venv

# Activate virtual environment
source backend/venv/bin/python

# Install dependencies
./backend/venv/bin/pip install -r backend/requirements.txt
```

---

## 2. Train Machine Learning Models

Run training scripts to generate model artifacts in `models/`:

```bash
# 1. NLP Categorization Model (TF-IDF + Logistic Regression)
PYTHONPATH=. ./backend/venv/bin/python ml/categorization/train.py

# 2. LSTM Time-Series Forecasting Model (PyTorch / Scikit-Learn)
PYTHONPATH=. ./backend/venv/bin/python ml/forecasting/train.py

# 3. Overspending Risk Model (Logistic Regression Risk Classifier)
PYTHONPATH=. ./backend/venv/bin/python ml/risk/train.py

# 4. Anomaly Detection Model (Isolation Forest)
PYTHONPATH=. ./backend/venv/bin/python ml/anomaly_detection/train.py
```

---

## 3. Run Backend Server

```bash
cd backend
PORT=5001 ./venv/bin/python run.py
```

The Flask server will start on `http://127.0.0.1:5001`.

---

## 4. Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend dev server will launch on `http://localhost:5173`.

---

## 5. Run Automated Test Suite

Run full Pytest suite covering all 8 development phases:

```bash
PYTHONPATH=. ./backend/venv/bin/pytest backend/tests
```

Expect output: `33 passed in ~4s`.
