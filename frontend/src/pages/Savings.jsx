import React, { useState, useEffect } from 'react';
import { savingsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { 
  Target, 
  Plus, 
  Trash2, 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  TrendingUp,
  X
} from 'lucide-react';

const Savings = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_savings: '0',
    target_date: '',
    notes: ''
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await savingsAPI.getGoals();
      if (res.data.success) {
        setGoals(res.data.savings_goals);
      }
    } catch (err) {
      console.error('Failed to load savings goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.target_amount || !formData.target_date) return;

    try {
      await savingsAPI.createGoal({
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_savings: parseFloat(formData.current_savings || 0)
      });
      setShowModal(false);
      setFormData({ name: '', target_amount: '', current_savings: '0', target_date: '', notes: '' });
      fetchGoals();
    } catch (err) {
      alert('Failed to create savings goal.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await savingsAPI.deleteGoal(id);
      fetchGoals();
    } catch (err) {
      alert('Failed to delete savings goal.');
    }
  };

  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalCurrent = goals.reduce((acc, g) => acc + g.current_savings, 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Savings Goals & Milestones" />

      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              Savings Goals Tracker
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Set financial targets, track completion dates, and calculate required monthly savings.
            </p>
          </div>

          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            <span>Create Savings Goal</span>
          </button>
        </div>

        {/* Stat Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <StatCard
            title="Total Savings Target"
            value={`₹${totalTarget.toLocaleString()}`}
            subtitle="Accumulated target across all goals"
            icon={Target}
            color="#6366f1"
          />
          <StatCard
            title="Current Savings"
            value={`₹${totalCurrent.toLocaleString()}`}
            subtitle="Saved towards milestones"
            icon={TrendingUp}
            color="#10b981"
            badgeText={totalTarget > 0 ? `${Math.round((totalCurrent / totalTarget) * 100)}%` : undefined}
            badgeType="emerald"
          />
          <StatCard
            title="Remaining Balance"
            value={`₹${Math.max(totalTarget - totalCurrent, 0).toLocaleString()}`}
            subtitle="Required to complete all targets"
            icon={Calendar}
            color="#a855f7"
          />
        </div>

        {/* Goals List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="#818cf8" />
            <span>Active Financial Milestones</span>
          </h3>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading savings goals...</div>
          ) : goals.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Target size={40} color="var(--text-dim)" />
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>No savings goals created yet.</p>
              <span style={{ fontSize: '0.85rem' }}>Click <strong>Create Savings Goal</strong> to set your first target (e.g. Emergency Fund, Car, Home)!</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {goals.map((g) => (
                <div key={g.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{g.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Date: {g.target_date}</span>
                    </div>

                    <button className="btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDelete(g.id)} title="Delete goal">
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Saved: <strong style={{ color: '#ffffff' }}>₹{g.current_savings?.toLocaleString()}</strong></span>
                      <span style={{ color: 'var(--text-muted)' }}>Target: <strong style={{ color: '#818cf8' }}>₹{g.target_amount?.toLocaleString()}</strong></span>
                    </div>

                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(g.percentage_completed, 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Remaining:</span>
                      <strong style={{ color: '#ffffff' }}>₹{g.remaining_amount?.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Required Monthly Savings:</span>
                      <strong style={{ color: '#34d399' }}>₹{g.required_monthly_savings?.toLocaleString()}/mo</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '460px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Create Savings Goal</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Goal Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Emergency Fund, New Laptop"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Amount (₹) *</label>
                    <input
                      type="number"
                      placeholder="100000"
                      className="input-field"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Current Savings (₹)</label>
                    <input
                      type="number"
                      placeholder="35000"
                      className="input-field"
                      value={formData.current_savings}
                      onChange={(e) => setFormData({ ...formData, current_savings: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Date *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create Goal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Savings;
