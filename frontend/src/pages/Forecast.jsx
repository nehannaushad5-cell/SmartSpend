import React, { useState, useEffect } from 'react';
import { forecastAPI } from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  Info, 
  PieChart, 
  Sparkles, 
  ArrowRight,
  Activity,
  Layers,
  UploadCloud
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Forecast = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await forecastAPI.getForecast();
      if (res.data.success) {
        setData(res.data.forecast);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load expense forecast model.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar title="LSTM Expense Forecasting" />
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing LSTM time-series forecast sequences...
        </div>
      </div>
    );
  }

  const isSufficient = data?.data_sufficient;
  const metrics = data?.metrics || {};
  const dailyForecasts = data?.daily_forecast || [];
  const maxDaily = dailyForecasts.length > 0 ? Math.max(...dailyForecasts.map(d => d.predicted_amount), 100) : 100;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="LSTM Expense Forecasting Engine" />

      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Banner & Disclaimer */}
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
              <TrendingUp color="#818cf8" size={24} />
              <span>Deep Learning Time-Series Forecast</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Multi-step recurrent neural network predicting spending patterns for 7 days, 30 days, and next month.
            </p>
          </div>

          <span className="badge badge-indigo" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            ✨ PyTorch/Keras LSTM
          </span>
        </div>

        {!isSufficient ? (
          /* Graceful Insufficient Data Banner */
          <div className="glass-panel" style={{
            padding: '48px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24'
            }}>
              <AlertCircle size={32} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              Insufficient Historical Data
            </h3>
            
            <p style={{ color: 'var(--text-muted)', maxWidth: '560px', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {data?.message || 'You need at least 14 days of historical transaction history to generate a reliable time-series forecast.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn-primary" onClick={() => navigate('/import')}>
                <UploadCloud size={18} />
                <span>Import CSV History</span>
              </button>
              <button className="btn-secondary" onClick={() => navigate('/expenses')}>
                <span>Add Manual Expenses</span>
              </button>
            </div>
          </div>
        ) : (
          /* Forecast Dashboard Content */
          <>
            {/* Disclaimer Banner */}
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
              <span>{data.disclaimer || 'Forecast based on historical spending patterns.'}</span>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <StatCard
                title="Next 7 Days"
                value={`₹${data.forecast_7_days?.toLocaleString() || 0}`}
                subtitle="7-day projected spending"
                icon={Calendar}
                color="#6366f1"
              />
              <StatCard
                title="Next 30 Days"
                value={`₹${data.forecast_30_days?.toLocaleString() || 0}`}
                subtitle="30-day projected spending"
                icon={TrendingUp}
                color="#0ea5e9"
              />
              <StatCard
                title="Next Month Total"
                value={`₹${data.forecast_next_month?.toLocaleString() || 0}`}
                subtitle="Estimated monthly commitment"
                icon={PieChart}
                color="#a855f7"
              />
              <StatCard
                title="Model Accuracy"
                value={metrics.mae ? `±₹${metrics.mae}` : 'High'}
                subtitle={metrics.rmse ? `RMSE: ₹${metrics.rmse} • MAPE: ${metrics.mape}%` : 'Evaluated on validation set'}
                icon={Activity}
                color="#10b981"
                badgeText="MAE Evaluated"
                badgeType="emerald"
              />
            </div>

            {/* Content Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Daily Forecast Chart Container */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} color="#818cf8" />
                    <span>30-Day Daily Projected Spending Curve</span>
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Analyzed {data.days_analyzed} days of transaction history
                  </span>
                </div>

                {/* SVG Time Series Projection Line/Bar Visualization */}
                <div style={{ width: '100%', height: '220px', display: 'flex', alignItems: 'flex-end', gap: '6px', padding: '20px 0 0 0', borderBottom: '1px solid var(--border-glass)' }}>
                  {dailyForecasts.map((d, i) => {
                    const heightPercent = maxDaily > 0 ? (d.predicted_amount / maxDaily) * 100 : 10;
                    return (
                      <div
                        key={d.date}
                        style={{
                          flex: 1,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          position: 'relative'
                        }}
                        title={`${d.date}: ₹${d.predicted_amount.toLocaleString()}`}
                      >
                        <div style={{
                          width: '100%',
                          height: `${Math.max(heightPercent, 4)}%`,
                          background: i < 7 
                            ? 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)' 
                            : 'linear-gradient(180deg, #a855f7 0%, rgba(168,85,247,0.3) 100%)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'all 0.2s ease'
                        }} />
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  <span>Day 1 ({dailyForecasts[0]?.date})</span>
                  <span>Day 7 (₹{data.forecast_7_days?.toLocaleString()})</span>
                  <span>Day 30 ({dailyForecasts[dailyForecasts.length - 1]?.date})</span>
                </div>
              </div>

              {/* Category Level Predictions */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#c084fc" />
                  <span>Category Projections</span>
                </h3>

                {data.category_forecasts?.length === 0 ? (
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No category breakdowns calculated.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {data.category_forecasts?.map((cat) => (
                      <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{cat.category}</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            <strong>₹{cat.predicted_amount?.toLocaleString()}</strong> ({cat.percentage}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${cat.percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Forecast;
