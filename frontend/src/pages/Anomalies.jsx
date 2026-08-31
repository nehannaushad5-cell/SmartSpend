import React, { useState, useEffect } from 'react';
import { anomaliesAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Sparkles, 
  ShieldAlert,
  ArrowRight,
  Clock
} from 'lucide-react';

const Anomalies = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await anomaliesAPI.getAnomalies();
      if (res.data.success) {
        setAnomalies(res.data.anomalies);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load anomaly detection records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleStatusUpdate = async (expenseId, newStatus) => {
    try {
      await anomaliesAPI.updateStatus(expenseId, newStatus);
      fetchAnomalies();
    } catch (err) {
      alert('Failed to update anomaly status.');
    }
  };

  const filtered = filterStatus === 'All' 
    ? anomalies 
    : anomalies.filter(a => a.status === filterStatus);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Isolation Forest Anomaly Detection" />

      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Banner */}
        <div className="glass-panel" style={{
          padding: '24px 32px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 24, 39, 0.9) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert color="#fbbf24" size={24} />
              <span>Unusual Spending Detection</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Isolation Forest model flagging statistical outliers based on historical transaction variance.
            </p>
          </div>

          <span className="badge badge-amber" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            ✨ Isolation Forest (Scikit-Learn)
          </span>
        </div>

        {/* Non-Alarmist Disclaimer */}
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(14, 165, 233, 0.12)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          color: '#38bdf8',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Info size={18} />
          <span>This module flags unusual transaction amounts compared with your historical spending. Flagged items are not assumed to be fraudulent.</span>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {['All', 'Pending', 'Expected', 'Unexpected'].map(status => (
            <button
              key={status}
              className={filterStatus === status ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilterStatus(status)}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Anomalies List */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Running Isolation Forest anomaly scan...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={44} color="#34d399" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>No Anomalies Flagged</h3>
            <p style={{ fontSize: '0.88rem' }}>All your recent expenses fall within normal statistical variance bounds.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map((item) => (
              <div key={item.expense_id} className="glass-panel" style={{
                padding: '20px 24px',
                borderLeft: item.status === 'Expected' 
                  ? '4px solid #34d399' 
                  : item.status === 'Unexpected' 
                  ? '4px solid #fb7185' 
                  : '4px solid #fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '600px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                      {item.description}
                    </span>
                    <span className="badge badge-indigo">{item.category}</span>
                    <span className={`badge ${item.status === 'Expected' ? 'badge-emerald' : item.status === 'Unexpected' ? 'badge-rose' : 'badge-amber'}`}>
                      {item.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    {item.reason}
                  </p>

                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Date: {item.date} • Anomaly Score: {item.anomaly_score}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                      ₹{item.amount?.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleStatusUpdate(item.expense_id, 'Expected')}
                      style={{
                        borderColor: item.status === 'Expected' ? '#34d399' : undefined,
                        color: item.status === 'Expected' ? '#34d399' : undefined,
                        padding: '8px 14px',
                        fontSize: '0.82rem'
                      }}
                    >
                      <CheckCircle size={15} />
                      <span>Expected</span>
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => handleStatusUpdate(item.expense_id, 'Unexpected')}
                      style={{
                        borderColor: item.status === 'Unexpected' ? '#fb7185' : undefined,
                        color: item.status === 'Unexpected' ? '#fb7185' : undefined,
                        padding: '8px 14px',
                        fontSize: '0.82rem'
                      }}
                    >
                      <XCircle size={15} />
                      <span>Unexpected</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Anomalies;
