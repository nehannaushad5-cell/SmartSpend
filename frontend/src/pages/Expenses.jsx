import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../services/api';
import Navbar from '../components/Navbar';
import ExpenseModal from '../components/ExpenseModal';
import ReceiptScanModal from '../components/ReceiptScanModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpDown,
  Download,
  Camera
} from 'lucide-react';

const Expenses = ({ onToggleMobileMenu }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Delete Confirm Modal
  const [deletingId, setDeletingId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await expenseAPI.getCategories();
      if (res.data.success) {
        setCategories(res.data.categories);
        setPaymentMethods(res.data.payment_methods);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        category: categoryFilter,
        start_date: startDate,
        end_date: endDate,
        sort_by: sortBy
      };
      const res = await expenseAPI.getExpenses(params);
      if (res.data.success) {
        setExpenses(res.data.expenses);
        setTotalAmount(res.data.total_amount);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [search, categoryFilter, startDate, endDate, sortBy]);

  const handleSaveExpense = async (formData) => {
    try {
      if (editingExpense) {
        await expenseAPI.updateExpense(editingExpense.id, formData);
      } else {
        await expenseAPI.createExpense(formData);
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    try {
      await expenseAPI.deleteExpense(id);
      setDeletingId(null);
      fetchExpenses();
    } catch (err) {
      alert('Failed to delete expense.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Expense Management" onToggleMobileMenu={onToggleMobileMenu} />

      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              Expenses Directory
            </h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Showing {expenses.length} records • Total: <strong style={{ color: '#818cf8' }}>₹{totalAmount.toLocaleString()}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-secondary"
              onClick={() => setIsReceiptModalOpen(true)}
              style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}
            >
              <Camera size={18} />
              <span>Scan Receipt Image</span>
            </button>

            <button 
              className="btn-primary" 
              onClick={() => {
                setEditingExpense(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={18} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Filter Bar Panel */}
        <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '14px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search description or notes..."
                className="input-field"
                style={{ paddingLeft: '36px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Select */}
            <div>
              <select
                className="input-field"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                className="input-field"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Date (Newest First)</option>
                <option value="date_asc">Date (Oldest First)</option>
                <option value="amount_desc">Amount (Highest First)</option>
                <option value="amount_asc">Amount (Lowest First)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading expenses directory...</div>
          ) : expenses.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Filter size={44} color="var(--text-dim)" />
              <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>No expenses matched your filter criteria.</p>
              <span style={{ fontSize: '0.85rem' }}>Try clearing your search query or add a new manual expense.</span>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>ML Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{exp.date}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{exp.description}</span>
                          {exp.notes && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{exp.notes}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-indigo">{exp.category}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{exp.payment_method}</td>
                      <td style={{ fontWeight: 800, fontSize: '0.98rem', color: '#ffffff' }}>
                        ₹{exp.amount.toLocaleString()}
                      </td>
                      <td>
                        {exp.is_user_corrected ? (
                          <span className="badge badge-amber" title="Corrected by user - feedback saved for AI retraining">
                            User Corrected
                          </span>
                        ) : exp.predicted_category ? (
                          <span className="badge badge-emerald" title={`AI auto-predicted with ${Math.round((exp.category_confidence || 0.9) * 100)}% confidence`}>
                            ✨ AI Categorized
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Manual</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setEditingExpense(exp);
                              setIsModalOpen(true);
                            }}
                            className="btn-secondary"
                            style={{ padding: '6px 10px' }}
                            title="Edit expense"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingId(exp.id)}
                            className="btn-danger"
                            style={{ padding: '6px 10px' }}
                            title="Delete expense"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expense Modal (Add/Edit) */}
        <ExpenseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
          initialData={editingExpense}
          categories={categories}
          paymentMethods={paymentMethods}
        />

        <ReceiptScanModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          onExpenseAdded={() => {
            fetchExpenses();
          }}
          categories={categories}
          paymentMethods={paymentMethods}
        />

        {/* Delete Confirmation Dialog */}
        {deletingId && (
          <div className="modal-overlay">
            <div className="glass-panel modal-content" style={{ maxWidth: '400px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '12px' }}>
                Confirm Delete
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Are you sure you want to delete this expense record? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn-secondary" onClick={() => setDeletingId(null)}>Cancel</button>
                <button className="btn-danger" onClick={() => handleDelete(deletingId)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
