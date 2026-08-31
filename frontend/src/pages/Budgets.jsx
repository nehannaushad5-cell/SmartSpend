import React, { useState, useEffect } from 'react';
import { budgetAPI, expenseAPI } from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { 
  PieChart, 
  Sparkles, 
  Check, 
  Plus, 
  AlertTriangle, 
  Info, 
  Layers, 
  CheckCircle,
  X
} from 'lucide-react';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Overall');
  const [budgetAmount, setBudgetAmount] = useState('');

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const [bRes, rRes, cRes] = await Promise.all([
        budgetAPI.getBudgets(),
        budgetAPI.getRecommendations(),
        expenseAPI.getCategories()
      ]);

      if (bRes.data.success) setBudgets(bRes.data.budgets);
      if (rRes.data.success) setRecommendations(rRes.data.recommendations);
      if (cRes.data.success) setCategories(cRes.data.categories);
    } catch (err) {
      console.error('Failed to load budget data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) return;

    try {
      await budgetAPI.setBudget({
        category: selectedCategory,
        amount: parseFloat(budgetAmount)
      });
      setShowModal(false);
      setBudgetAmount('');
      fetchBudgetData();
    } catch (err) {
      alert('Failed to set budget');
    }
  };

  const handleApplyRecommendation = async (rec) => {
    try {
      await budgetAPI.setBudget({
        category: rec.category,
        amount: rec.recommended_budget
      });
      fetchBudgetData();
    } catch (err) {
      alert('Failed to apply recommendation');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Monthly Budget Management" />

      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              Monthly Budgets & Smart Targets
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Set category limits and receive AI-driven recommendations based on spending variability.
            </p>
          </div>

          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            <span>Set Budget Limit</span>
          </button>
        </div>

        {/* Smart Recommendations Section */}
        {recommendations?.recommendations?.length > 0 && (
          <div className="glass-panel" style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#818cf8" />
                <span>AI Budget Recommendations</span>
              </h3>
              <span className="badge badge-indigo">Statistical Volatility Model</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {recommendations.disclaimer}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {recommendations.recommendations.slice(0, 3).map((rec) => (
                <div key={rec.category} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>{rec.category}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#818cf8' }}>
                      ₹{rec.recommended_budget?.toLocaleString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {rec.reason}
                  </p>

                  <button 
                    className="btn-secondary" 
                    onClick={() => handleApplyRecommendation(rec)}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', justifyContent: 'center', marginTop: '4px' }}
                  >
                    <Check size={14} />
                    <span>Apply ₹{rec.recommended_budget} Target</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budgets Progress Grid */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="#818cf8" />
            <span>Active Monthly Category Budgets</span>
          </h3>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading active budgets...</div>
          ) : budgets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Layers size={40} color="var(--text-dim)" />
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>No monthly budgets configured for this month.</p>
              <span style={{ fontSize: '0.85rem' }}>Click <strong>Set Budget Limit</strong> or apply one of the AI recommendations above!</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {budgets.map((b) => {
                const isOver = b.percentage_used > 100;
                const isWarn = b.percentage_used > 85;

                return (
                  <div key={b.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{b.category}</span>
                      <span className={`badge ${isOver ? 'badge-rose' : isWarn ? 'badge-amber' : 'badge-emerald'}`}>
                        {b.percentage_used}% Used
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Spent: <strong>₹{b.current_spending?.toLocaleString()}</strong>
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Limit: <strong>₹{b.amount?.toLocaleString()}</strong>
                        </span>
                      </div>

                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(b.percentage_used, 100)}%`,
                          height: '100%',
                          background: isOver 
                            ? 'linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)' 
                            : isWarn 
                            ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)' 
                            : 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: isOver ? '#fb7185' : 'var(--text-dim)', textAlign: 'right' }}>
                      {isOver ? `Exceeded by ₹${Math.abs(b.remaining_amount).toLocaleString()}` : `₹${b.remaining_amount?.toLocaleString()} remaining`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Set Budget Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '440px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Set Monthly Budget</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSetBudget} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
                  <select
                    className="input-field"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="Overall">Overall Monthly Budget</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Monthly Budget Amount (₹) *</label>
                  <input
                    type="number"
                    step="500"
                    placeholder="7000"
                    className="input-field"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Budget</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budgets;
