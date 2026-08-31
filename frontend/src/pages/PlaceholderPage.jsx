import React from 'react';
import Navbar from '../components/Navbar';
import { Construction, Sparkles } from 'lucide-react';

const PlaceholderPage = ({ title, phaseName, description }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title={title} />
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{
          padding: '60px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8'
          }}>
            <Sparkles size={32} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            {title} Module
          </h2>
          <span className="badge badge-indigo" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            Scheduled for {phaseName}
          </span>
          <p style={{ color: 'var(--text-muted)', maxWidth: '540px', fontSize: '0.95rem' }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
