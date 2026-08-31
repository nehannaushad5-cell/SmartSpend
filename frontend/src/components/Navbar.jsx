import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Wallet, Menu } from 'lucide-react';

const Navbar = ({ title, onToggleMobileMenu }) => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Hamburger Menu Toggle Button for Mobile */}
        <button 
          onClick={onToggleMobileMenu}
          className="mobile-menu-toggle"
          title="Open menu"
        >
          <Menu size={22} />
        </button>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
          {title || 'Dashboard'}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Currency Indicator */}
        <div className="navbar-currency-pill">
          <Wallet size={15} color="#818cf8" />
          <span>Currency: <strong>{user?.currency || '₹'}</strong></span>
        </div>

        {/* User Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#ffffff',
            flexShrink: 0
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={18} />}
          </div>
          <div className="navbar-user-text" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{user?.name || 'User'}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="btn-secondary"
          style={{ padding: '8px 12px', fontSize: '0.82rem' }}
          title="Log out"
        >
          <LogOut size={16} />
          <span className="navbar-logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
