import React, { useState } from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MobileMenuProvider } from './context/MobileMenuContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import ImportCSV from './pages/ImportCSV';
import Forecast from './pages/Forecast';
import Anomalies from './pages/Anomalies';
import Recurring from './pages/Recurring';
import Budgets from './pages/Budgets';
import Savings from './pages/Savings';
import Login from './pages/Login';
import Register from './pages/Register';
import Simulator from './pages/Simulator';
import Assistant from './pages/Assistant';
import PlaceholderPage from './pages/PlaceholderPage';

const GlobalLoading = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    color: 'var(--text-main)',
    gap: '16px',
    fontFamily: 'var(--font-main)'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '3px solid rgba(99, 102, 241, 0.2)',
      borderTopColor: '#6366f1',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
      Loading SmartSpend AI...
    </span>
  </div>
);

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <GlobalLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MobileMenuProvider>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          {children}
        </div>
      </div>
    </MobileMenuProvider>
  );
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <GlobalLoading />;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/expenses" element={<ProtectedLayout><Expenses /></ProtectedLayout>} />
      <Route path="/import" element={<ProtectedLayout><ImportCSV /></ProtectedLayout>} />
      <Route path="/budgets" element={<ProtectedLayout><Budgets /></ProtectedLayout>} />
      <Route path="/forecast" element={<ProtectedLayout><Forecast /></ProtectedLayout>} />
      <Route path="/anomalies" element={<ProtectedLayout><Anomalies /></ProtectedLayout>} />
      <Route path="/recurring" element={<ProtectedLayout><Recurring /></ProtectedLayout>} />
      <Route path="/savings" element={<ProtectedLayout><Savings /></ProtectedLayout>} />
      <Route path="/simulator" element={<ProtectedLayout><Simulator /></ProtectedLayout>} />
      <Route path="/assistant" element={<ProtectedLayout><Assistant /></ProtectedLayout>} />

      <Route path="/settings" element={
        <ProtectedLayout>
          <PlaceholderPage title="User Settings" phaseName="Phase 8" description="Configure profile preference, currency symbol, security credentials, and system parameters." />
        </ProtectedLayout>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
