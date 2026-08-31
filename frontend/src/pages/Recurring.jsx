import React, { useState, useEffect } from 'react';
import { recurringAPI } from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { 
  Repeat, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  Layers, 
  CheckCircle,
  CreditCard
} from 'lucide-react';

const Recurring = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const res = await recurringAPI.getRecurring();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recurring expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const recurringList = data?.recurring_expenses || [];
  const totalMonthly = data?.total_monthly_recurring || 0.0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Recurring Expenses & Subscriptions" />

      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Banner */}
        <div className="glass-panel" style={{
          padding: '24px 32px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Repeat color="#818cf8" size={24} />
              <span>Pattern Detection: Fixed Subscriptions</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Automatic identification of repeating monthly bills, memberships, and fixed obligations.
            </p>
          </div>

          <span className="badge badge-indigo" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            ✨ Pattern Recognition Engine
          </span>
        </div>

        {/* Stat Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <StatCard
            title="Monthly Fixed Commitment"
            value={`₹${totalMonthly.toLocaleString()}`}
            subtitle="Estimated total recurring expenses"
            icon={DollarSign}
            color="#6366f1"
          />
          <StatCard
            title="Detected Subscriptions"
            value={recurringList.length}
            subtitle="Active recurring merchant patterns"
            icon={Repeat}
            color="#0ea5e9"
          />
          <StatCard
            title="Annual Fixed Commitment"
            value={`₹${(totalMonthly * 12).toLocaleString()}`}
            subtitle="Yearly projected commitment"
            icon={Calendar}
            color="#a855f7"
          />
        </div>

        {/* Recurring List Table Container */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} color="#818cf8" />
            <span>Detected Recurring Subscriptions</span>
          </h3>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Scanning transaction history for recurring patterns...
            </div>
          ) : recurringList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Repeat size={40} color="var(--text-dim)" />
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>No recurring subscriptions detected yet.</p>
              <span style={{ fontSize: '0.85rem' }}>As you record multiple monthly expenses with consistent amounts (e.g. Netflix, Rent, Broadband), they will automatically appear here.</span>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Merchant / Title</th>
                    <th>Category</th>
                    <th>Frequency</th>
                    <th>Occurrences</th>
                    <th>Last Detected</th>
                    <th style={{ textAlign: 'right' }}>Monthly Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringList.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: '#ffffff' }}>{item.title}</td>
                      <td>
                        <span className="badge badge-indigo">{item.category}</span>
                      </td>
                      <td>
                        <span className="badge badge-emerald">{item.frequency}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.occurrences} months</td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.last_detected}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>
                        ₹{item.amount?.toLocaleString()}/mo
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recurring;
