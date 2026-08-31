import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = '#6366f1', badgeText, badgeType = 'indigo' }) => {
  const badgeClasses = {
    indigo: 'badge-indigo',
    emerald: 'badge-emerald',
    amber: 'badge-amber',
    rose: 'badge-rose'
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow accent */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: color,
        filter: 'blur(50px)',
        opacity: 0.25,
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            padding: '8px',
            borderRadius: '10px',
            background: `${color}18`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {value}
        </h3>
        {badgeText && (
          <span className={`badge ${badgeClasses[badgeType] || 'badge-indigo'}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};

export default StatCard;
