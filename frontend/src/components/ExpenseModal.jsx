import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../services/api';
import { X, Sparkles, Check, AlertCircle } from 'lucide-react';

const ExpenseModal = ({ isOpen, onClose, onSave, initialData = null, categories = [], paymentMethods = [] }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Auto',
    payment_method: 'UPI',
    notes: ''
  });

  const [predictedCategory, setPredictedCategory] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount || '',
        description: initialData.description || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        category: initialData.category || 'Auto',
        payment_method: initialData.payment_method || 'UPI',
        notes: initialData.notes || ''
      });
      setPredictedCategory(initialData.predicted_category || null);
      setConfidence(initialData.category_confidence || null);
    } else {
      setFormData({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Auto',
        payment_method: 'UPI',
        notes: ''
      });
      setPredictedCategory(null);
      setConfidence(null);
    }
    setError('');
  }, [initialData, isOpen]);

  // Live Auto-Predict Category on description change with debouncing
  useEffect(() => {
    if (!formData.description || formData.description.trim().length < 3) {
      setPredictedCategory(null);
      setConfidence(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingPrediction(true);
        const res = await expenseAPI.predictCategory(formData.description);
        if (res.data.success) {
          setPredictedCategory(res.data.predicted_category);
          setConfidence(res.data.confidence);
        }
      } catch (err) {
        console.error('Category prediction failed', err);
      } finally {
        setLoadingPrediction(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.description]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || !formData.description || !formData.date) {
      setError('Amount, description, and date are required fields.');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', border: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {initialData ? 'Edit Expense' : 'Add Manual Expense'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Amount & Date Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="450.00"
                className="input-field"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Date *
              </label>
              <input
                type="date"
                className="input-field"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy dinner, Uber ride"
              className="input-field"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* AI Category Prediction Banner */}
          {predictedCategory && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#818cf8" />
                <span style={{ fontSize: '0.82rem' }}>
                  Predicted: <strong style={{ color: '#ffffff' }}>{predictedCategory}</strong> {confidence && `(${Math.round(confidence * 100)}% conf)`}
                </span>
              </div>
              {formData.category === 'Auto' && (
                <span className="badge badge-indigo">
                  Auto Selected
                </span>
              )}
            </div>
          )}

          {/* Category & Payment Method Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Category
              </label>
              <select
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Auto">✨ Auto Predict ({predictedCategory || 'AI'})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Payment Method
              </label>
              <select
                className="input-field"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                {paymentMethods.map((pm) => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Notes (Optional)
            </label>
            <textarea
              placeholder="Additional tags or notes..."
              className="input-field"
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : initialData ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
