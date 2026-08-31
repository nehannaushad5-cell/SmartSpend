# SmartSpend AI — Technical System Architecture

## Overview
SmartSpend is an end-to-end AI-based personal budget tracking web application built with Python Flask, SQLite/SQLAlchemy, React.js (Vite), and four machine learning models (TF-IDF + Logistic Regression, PyTorch LSTM, Multi-class Logistic Risk Classifier, and Isolation Forest).

---

## Architectural Diagram

```
                 ┌──────────────────────────────────────────────┐
                 │       React 18 + Vite Frontend Dashboard     │
                 │   (Glassmorphism CSS, Recharts, Lucide)      │
                 └──────────────────────┬───────────────────────┘
                                        │
                                 HTTP REST APIs
                               (JWT Bearer Token)
                                        │
                 ┌──────────────────────▼───────────────────────┐
                 │          Flask Backend Application           │
                 │    (Python 3.11+, SQLAlchemy ORM, Flask)     │
                 └──────┬───────────────┬───────────────┬───────┘
                        │               │               │
      ┌─────────────────▼──┐   ┌────────▼────────┐   ┌──▼──────────────────┐
      │   SQLite Database  │   │  CSV Data Service│   │  AI Assistant NLP   │
      │  (Expenses, User,  │   │ (Date Norm, Fuzzy│   │ (Database Telemetry │
      │   Budgets, Goals)  │   │ Header Mapping) │   │   Query Parser)     │
      └────────────────────┘   └─────────────────┘   └─────────────────────┘
                                        │
                 ┌──────────────────────▼───────────────────────┐
                 │         Machine Learning Layer (`ml/`)       │
                 ├──────────────────────────────────────────────┤
                 │ 1. Categorization (TF-IDF + Logistic Reg)    │
                 │ 2. LSTM Time-Series Daily Forecast (PyTorch) │
                 │ 3. Overspending Risk Classifier (LogReg)     │
                 │ 4. Isolation Forest Anomaly Detector         │
                 │ 5. Recurring Expense Pattern Engine          │
                 └──────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Frontend Architecture
- **Framework**: React.js 18 initialized with Vite.
- **Routing**: `react-router-dom` with `ProtectedLayout` routing guard enforcing JWT token validation.
- **State Management**: React state hooks (`useState`, `useContext`, `useEffect`) and Axios API abstractions (`src/services/api.js`).
- **Styling**: Custom Vanilla CSS design system (`index.css`) featuring sleek dark glassmorphism, HSL color tokens, micro-animations, and responsive CSS grid.

### 2. Backend Architecture
- **Framework**: Flask WSGI application with modular Blueprint routing structure:
  - `auth_bp`: Registration, JWT authentication, current user context (`/api/auth`).
  - `expenses_bp`: CRUD operations, filtering, category prediction helper (`/api/expenses`).
  - `import_bp`: CSV parsing, fuzzy column normalization, deduplication (`/api/expenses/import`).
  - `forecast_bp`: PyTorch LSTM recursive multi-step time-series forecasting (`/api/forecast`).
  - `risk_bp`: Overspending risk level classification & factor explanations (`/api/budget-risk`).
  - `anomalies_bp`: Isolation Forest outlier flagging & status feedback (`/api/anomalies`).
  - `recurring_bp`: Monthly subscription pattern recognition (`/api/recurring-expenses`).
  - `budgets_bp`: Category budgets & volatility-based recommendations (`/api/budgets`).
  - `savings_bp`: Savings goals tracking & completion date calculators (`/api/savings-goals`).
  - `simulator_bp`: What-If percentage spending cut simulator (`/api/what-if`).
  - `assistant_bp`: Conversational NLP query interface (`/api/assistant/chat`).

### 3. Database Layer
- **Storage Engine**: SQLite 3 managed via SQLAlchemy ORM.
- **Models**:
  - `User`: Id, Username, Email, Password Hash (`werkzeug.security`).
  - `Expense`: Id, User_Id, Amount, Description, Category, Date, Payment Method, Predicted Category, Category Confidence, User Corrected.
  - `Budget`: Id, User_Id, Category, Amount, Month (`YYYY-MM`).
  - `SavingsGoal`: Id, User_Id, Name, Target Amount, Current Savings, Target Date, Notes.
  - `Anomaly`: Id, User_Id, Expense_Id, Anomaly Score, Reason, Status (`Pending`, `Expected`, `Unexpected`).
