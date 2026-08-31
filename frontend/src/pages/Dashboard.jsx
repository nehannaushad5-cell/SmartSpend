import React, { useState, useEffect } from 'react';
import { dashboardAPI, riskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import RiskCard from '../components/RiskCard';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Receipt, 
  Target, 
  Plus, 
  ArrowRight,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ onToggleMobileMenu }) => {
  const [data, setData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, riskRes] = await Promise.all([
        dashboardAPI.getSummary(),
        riskAPI.getBudgetRisk()
      ]);

      if (dashRes.data.success) {
        setData(dashRes.data);
      }
      if (riskRes.data.success) {
        setRiskData(riskRes.data.overall_risk);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = data?.metrics || {};

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Smart Dashboard" onToggleMobileMenu={onToggleMobileMenu} />

      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Banner */}
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
              <Sparkles color="#818cf8" size={24} />
              <span>SmartSpend AI Core Active</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Real-time analytics and category categorization powered by live database telemetry.
            </p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/expenses')}>
            <Plus size={18} />
            <span>Add New Expense</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <StatCard
            title="Total Spending"
            value={`₹${metrics.total_spending?.toLocaleString() || 0}`}
            subtitle="All-time accumulated transactions"
            icon={DollarSign}
            color="#6366f1"
          />
          <StatCard
            title="This Month"
            value={`₹${metrics.monthly_spending?.toLocaleString() || 0}`}
            subtitle="Current calendar month spending"
            icon={TrendingUp}
            color="#0ea5e9"
            badgeText={metrics.budget_used_percentage > 0 ? `${metrics.budget_used_percentage}% Budget` : undefined}
            badgeType={metrics.budget_used_percentage > 85 ? 'rose' : 'emerald'}
          />
          <StatCard
            title="Top Category"
            value={metrics.top_category || 'None'}
            subtitle={metrics.top_category_amount ? `₹${metrics.top_category_amount.toLocaleString()} spent` : 'No category data yet'}
            icon={PieChart}
            color="#a855f7"
          />
          <StatCard
            title="Total Expenses"
            value={metrics.total_transactions_count || 0}
            subtitle="Recorded transaction count"
            icon={Receipt}
            color="#10b981"
          />
        </div>

        {/* Content Layout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Recent Transactions List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="#818cf8" />
                <span>Recent Expenses</span>
              </h3>
              <button 
                onClick={() => navigate('/expenses')}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading transactions...</div>
            ) : data?.recent_transactions?.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Receipt size={40} color="var(--text-dim)" />
                <p>No expenses recorded yet. Click <strong>Add New Expense</strong> to get started!</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recent_transactions?.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.description}</td>
                        <td>
                          <span className="badge badge-indigo">{item.category}</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.date}</td>
                        <td style={{ fontWeight: 700, color: '#f8fafc' }}>
                          ₹{item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Overspending Risk & Category Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {riskData && <RiskCard riskData={riskData} title="Monthly Overspending Risk" />}

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#c084fc" />
                <span>Category Distribution</span>
              </h3>

            {data?.category_breakdown?.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No monthly expense breakdown available yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data?.category_breakdown?.map((cat) => {
                  const percent = metrics.monthly_spending > 0 
                    ? Math.round((cat.amount / metrics.monthly_spending) * 100)
                    : 0;

                  return (
                    <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600 }}>{cat.category}</span>
                        <span style={{ color: 'var(--text-muted)' }}>₹{cat.amount.toLocaleString()} ({percent}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default Dashboard;
