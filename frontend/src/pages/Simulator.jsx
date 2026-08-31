import React, { useState, useEffect } from 'react';
import { simulatorAPI, expenseAPI } from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { 
  SlidersHorizontal, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  Target, 
  Layers, 
  RefreshCw,
  Zap
} from 'lucide-react';

const Simulator = () => {
  const [categories, setCategories] = useState([]);
  const [reductions, setReductions] = useState({});
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const cRes = await expenseAPI.getCategories();
      if (cRes.data.success) {
        setCategories(cRes.data.categories);
        const initialReductions = {};
        cRes.data.categories.forEach(c => { initialReductions[c] = 0; });
        // Default example preset
        initialReductions['Food & Dining'] = 15;
        initialReductions['Shopping'] = 20;
        initialReductions['Transportation'] = 10;
        setReductions(initialReductions);

        const simRes = await simulatorAPI.runWhatIf({ percentage_reductions: initialReductions });
        if (simRes.data.success) setSimulation(simRes.data.simulation);
      }
    } catch (err) {
      console.error('Failed to initialize simulator', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSliderChange = async (cat, value) => {
    const updated = { ...reductions, [cat]: parseInt(value, 10) };
    setReductions(updated);

    try {
      const simRes = await simulatorAPI.runWhatIf({ percentage_reductions: updated });
      if (simRes.data.success) setSimulation(simRes.data.simulation);
    } catch (err) {
      console.error('Simulation update failed', err);
    }
  };

  const handleReset = async () => {
    const resetReductions = {};
    categories.forEach(c => { resetReductions[c] = 0; });
    setReductions(resetReductions);
    const simRes = await simulatorAPI.runWhatIf({ percentage_reductions: resetReductions });
    if (simRes.data.success) setSimulation(simRes.data.simulation);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="What-If Spending Simulator" />

      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
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
              <SlidersHorizontal color="#818cf8" size={24} />
              <span>Interactive Spending Reduction Simulator</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Simulate spending cuts across categories and calculate real-time monthly and annual savings impact on your goals.
            </p>
          </div>

          <button className="btn-secondary" onClick={handleReset}>
            <RefreshCw size={16} />
            <span>Reset Sliders</span>
          </button>
        </div>

        {/* Results Stat Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <StatCard
            title="Monthly Savings"
            value={`₹${simulation?.monthly_savings?.toLocaleString() || 0}`}
            subtitle="Estimated monthly cash flow gain"
            icon={Zap}
            color="#10b981"
            badgeText="Extra Cash"
            badgeType="emerald"
          />
          <StatCard
            title="Annual Savings"
            value={`₹${simulation?.annual_savings?.toLocaleString() || 0}`}
            subtitle="12-month accumulated savings"
            icon={TrendingUp}
            color="#0ea5e9"
          />
          <StatCard
            title="Simulated Spending"
            value={`₹${simulation?.simulated_monthly_spending?.toLocaleString() || 0}`}
            subtitle={`Down from ₹${simulation?.baseline_monthly_spending?.toLocaleString() || 0}/mo`}
            icon={DollarSign}
            color="#a855f7"
          />
        </div>

        {/* Content Layout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          {/* Sliders Area */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={18} color="#818cf8" />
              <span>Category Spending Cut Sliders (%)</span>
            </h3>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Initializing simulation controls...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {categories.map((cat) => {
                  const val = reductions[cat] || 0;
                  const catImpact = simulation?.category_impacts?.find(i => i.category === cat);
                  const saved = catImpact?.monthly_savings || 0;

                  return (
                    <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ fontWeight: 600 }}>{cat}</span>
                        <span style={{ color: val > 0 ? '#34d399' : 'var(--text-muted)' }}>
                          <strong>-{val}%</strong> {saved > 0 && `(Save ₹${saved.toLocaleString()}/mo)`}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={val}
                        onChange={(e) => handleSliderChange(cat, e.target.value)}
                        style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Goal Acceleration Summary */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="#c084fc" />
              <span>Savings Goal Acceleration</span>
            </h3>

            {simulation?.goal_impacts?.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No active savings goals found. Create a goal under the <strong>Savings Goals</strong> menu to see milestone acceleration!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {simulation?.goal_impacts?.map((g, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700 }}>{g.goal_name}</span>
                      <span className="badge badge-emerald">
                        ~{g.months_earlier} Mos Earlier
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {g.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
