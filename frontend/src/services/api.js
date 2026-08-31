import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartspend_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global 401 auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('smartspend_token');
      localStorage.removeItem('smartspend_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper API functions
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const expenseAPI = {
  getCategories: () => api.get('/expenses/categories'),
  predictCategory: (description) => api.post('/expenses/predict-category', { description }),
  scanReceipt: (formData) => api.post('/expenses/scan-receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getExpenses: (params) => api.get('/expenses', { params }),
  createExpense: (data) => api.post('/expenses', data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
};

export const importAPI = {
  uploadCSV: (formData) => api.post('/expenses/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const forecastAPI = {
  getForecast: () => api.get('/forecast'),
};

export const riskAPI = {
  getBudgetRisk: () => api.get('/budget-risk'),
};

export const anomaliesAPI = {
  getAnomalies: () => api.get('/anomalies'),
  updateStatus: (expenseId, status) => api.put(`/anomalies/${expenseId}/status`, { status }),
};

export const recurringAPI = {
  getRecurring: () => api.get('/recurring-expenses'),
};

export const budgetAPI = {
  getBudgets: () => api.get('/budgets'),
  setBudget: (data) => api.post('/budgets', data),
  getRecommendations: () => api.get('/budgets/recommendations'),
};

export const savingsAPI = {
  getGoals: () => api.get('/savings-goals'),
  createGoal: (data) => api.post('/savings-goals', data),
  deleteGoal: (id) => api.delete(`/savings-goals/${id}`),
};

export const simulatorAPI = {
  runWhatIf: (data) => api.post('/what-if', data),
};

export const assistantAPI = {
  sendMessage: (message) => api.post('/assistant/chat', { message }),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard'),
};

export default api;
