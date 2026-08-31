# SmartSpend AI — REST API Documentation

All API requests (except `/api/auth/register` and `/api/auth/login`) require a valid JWT Bearer token in the `Authorization` HTTP header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 🔑 Authentication Endpoints

### 1. Register Account
- **`POST /api/auth/register`**
- **Request Body**:
  ```json
  {
    "username": "user1",
    "email": "user1@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "access_token": "eyJhbGci...",
    "user": { "id": 1, "username": "user1", "email": "user1@example.com" }
  }
  ```

### 2. Login User
- **`POST /api/auth/login`**
- **Request Body**:
  ```json
  {
    "email": "user1@example.com",
    "password": "Password123!"
  }
  ```

---

## 💸 Expense CRUD Endpoints

### 1. List Expenses
- **`GET /api/expenses?category=Shopping&search=watch&start_date=2026-08-01`**
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 15,
    "expenses": [ ... ]
  }
  ```

### 2. Create Expense
- **`POST /api/expenses`**
- **Request Body**:
  ```json
  {
    "amount": 450.0,
    "description": "Starbucks Coffee",
    "date": "2026-08-30",
    "category": "Food & Dining",
    "payment_method": "Credit Card"
  }
  ```

### 3. Predict Category (NLP Helper)
- **`POST /api/expenses/predict-category`**
- **Request Body**: `{ "description": "Swiggy lunch delivery" }`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "predicted_category": "Food & Dining",
    "confidence": 0.892
  }
  ```

---

## 📊 Analytics & ML Endpoints

### 1. LSTM Forecast (`GET /api/forecast`)
- Returns 7-day, 30-day, and next-month forecasts alongside daily projections array.

### 2. Overspending Risk (`GET /api/budget-risk`)
- Returns overall risk tier (**Low**, **Medium**, **High**), probability score, and factor explanations.

### 3. Anomaly Detection (`GET /api/anomalies`)
- Returns flagged Isolation Forest outliers with status feedback buttons.

### 4. What-If Simulator (`POST /api/what-if`)
- Accepts category percentage reductions and returns simulated monthly/annual savings.

### 5. AI Assistant (`POST /api/assistant/chat`)
- Accepts `{ "message": "How much did I spend on Food this month?" }` and returns natural language reply.
