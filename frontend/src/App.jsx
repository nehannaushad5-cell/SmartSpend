import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import ImportCSV from './pages/ImportCSV';
import Forecast from './pages/Forecast';
import Anomalies from './pages/Anomalies';
import Recurring from './pages/Recurring';
import Budgets from './pages/Budgets';
import Savings from './pages/Savings';
import Simulator from './pages/Simulator';
import Assistant from './pages/Assistant';
import PlaceholderPage from './pages/PlaceholderPage';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-main)'
      }}>
        Initializing SmartSpend Engine...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
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

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
