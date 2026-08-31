import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMobileMenu } from '../context/MobileMenuContext';
import { 
  LayoutDashboard, 
  Receipt, 
  UploadCloud, 
  PieChart, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  SlidersHorizontal, 
  Bot, 
  Settings,
  Sparkles,
  Repeat,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { isOpen: contextIsOpen, closeMobileMenu } = useMobileMenu();

  const activeIsOpen = isOpen !== undefined ? isOpen : contextIsOpen;
  const activeClose = onClose || closeMobileMenu;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Expenses', path: '/expenses', icon: Receipt },
    { label: 'Import CSV', path: '/import', icon: UploadCloud },
    { label: 'Budgets', path: '/budgets', icon: PieChart },
    { label: 'Forecast (LSTM)', path: '/forecast', icon: TrendingUp },
    { label: 'Anomalies', path: '/anomalies', icon: AlertTriangle },
    { label: 'Recurring', path: '/recurring', icon: Repeat },
    { label: 'Savings Goals', path: '/savings', icon: Target },
    { label: 'What-If Simulator', path: '/simulator', icon: SlidersHorizontal },
    { label: 'AI Assistant', path: '/assistant', icon: Bot },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {activeIsOpen && (
        <div 
          onClick={activeClose}
          className="mobile-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 99
          }}
        />
      )}

      <aside className={`sidebar-drawer ${activeIsOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 24px 8px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0 }}>
                Smart<span style={{ color: '#818cf8' }}>Spend</span>
              </h1>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Budget Engine
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button 
            onClick={activeClose} 
            className="mobile-close-btn"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={activeClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  background: isActive ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)' : 'transparent',
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease'
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Status Footer */}
        <div className="glass-panel" style={{ padding: '12px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Engine Active</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>v1.0.0 (Local DB)</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
