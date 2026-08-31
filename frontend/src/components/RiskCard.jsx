import React from 'react';
import { AlertTriangle, ShieldCheck, AlertCircle, Info, TrendingUp } from 'lucide-react';

const RiskCard = ({ riskData, title = 'Overall Budget Risk' }) => {
  if (!riskData) return null;

  const {
    risk_level,
    overspending_probability,
    current_spending,
    budget_amount,
    pct_budget_used,
    days_remaining,
    projected_end_of_month,
    contributing_factors = []
  } = riskData;

  const getRiskStyle = () => {
    if (risk_level === 'High Risk') {
      return {
        badgeClass: 'badge-rose',
        borderColor: 'rgba(244, 63, 94, 0.4)',
        bgGradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(18, 24, 39, 0.8) 100%)',
        icon: AlertTriangle,
        iconColor: '#f43f5e',
        progressColor: 'linear-gradient(90deg, #fb7185 0%, #f43f5e 100%)'
      };
    } else if (risk_level === 'Medium Risk') {
      return {
        badgeClass: 'badge-amber',
        borderColor: 'rgba(245, 158, 11, 0.4)',
        bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 24, 39, 0.8) 100%)',
        icon: AlertCircle,
        iconColor: '#fbbf24',
        progressColor: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
      };
    } else {
      return {
        badgeClass: 'badge-emerald',
        borderColor: 'rgba(16, 185, 129, 0.4)',
        bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(18, 24, 39, 0.8) 100%)',
        icon: ShieldCheck,
        iconColor: '#34d399',
        progressColor: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)'
      };
    }
  };

  const style = getRiskStyle();
  const Icon = style.icon;

  return (
    <div className="glass-panel" style={{
      padding: '24px',
      background: style.bgGradient,
      border: `1px solid ${style.borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            padding: '8px',
            borderRadius: '10px',
            background: `${style.iconColor}20`,
            color: style.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{title}</h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {days_remaining} days remaining in month
            </span>
          </div>
        </div>

        <span className={`badge ${style.badgeClass}`} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
          {risk_level} ({overspending_probability}% Prob)
        </span>
      </div>

      {/* Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Spent: <strong>₹{current_spending?.toLocaleString()}</strong> of ₹{budget_amount?.toLocaleString()}
          </span>
          <span style={{ fontWeight: 700 }}>{pct_budget_used}% Used</span>
        </div>

        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(pct_budget_used, 100)}%`,
            height: '100%',
            background: style.progressColor,
            borderRadius: '4px',
            transition: 'all 0.3s ease'
          }} />
        </div>
      </div>

      {/* Projected End of Month */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={15} color={style.iconColor} />
          Projected Month-End:
        </span>
        <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>
          ₹{projected_end_of_month?.toLocaleString()}
        </strong>
      </div>

      {/* Contributing Factors Explanation List */}
      {contributing_factors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Risk Factor Analysis
          </span>
          {contributing_factors.map((factor, idx) => (
            <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: style.iconColor, fontWeight: 700 }}>•</span>
              <span>{factor}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RiskCard;
