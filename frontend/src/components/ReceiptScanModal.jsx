import React, { useState } from 'react';
import { expenseAPI } from '../services/api';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  X, 
  Loader2, 
  FileText,
  AlertCircle
} from 'lucide-react';

const ReceiptScanModal = ({ isOpen, onClose, onExpenseAdded, categories, paymentMethods }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  
  // Extracted telemetry preview state
  const [scannedData, setScannedData] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
    payment_method: 'Credit Card',
    notes: ''
  });

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    scanFile(file);
  };

  const scanFile = async (file) => {
    setScanning(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);

      const res = await expenseAPI.scanReceipt(data);
      if (res.data.success) {
        const r = res.data.receipt;
        setScannedData(r);
        setFormData({
          amount: r.amount || '',
          description: r.description || 'Scanned Receipt Merchant',
          date: r.date || new Date().toISOString().split('T')[0],
          category: r.category || 'Other',
          payment_method: 'Credit Card',
          notes: r.raw_text ? `Extracted via Receipt OCR Scanner` : ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scan receipt image.');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0 || !formData.description) return;

    try {
      await expenseAPI.createExpense({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      onExpenseAdded();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense.');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScannedData(null);
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera color="#818cf8" size={22} />
            <span>AI Receipt Image Scanner</span>
          </h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        {!selectedFile ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
            style={{
              border: '2px dashed rgba(99, 102, 241, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px 20px',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
            onClick={() => document.getElementById('receiptFileInput').click()}
          >
            <div style={{ padding: '14px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Upload size={28} />
            </div>

            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>Upload or Drop Receipt Image</p>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Supports JPG, PNG, WEBP store receipts & invoices</span>
            </div>

            <input
              id="receiptFileInput"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Image Preview Card */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)' }}>
              {previewUrl && (
                <img src={previewUrl} alt="Receipt preview" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              )}
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>{selectedFile.name}</span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button className="btn-secondary" onClick={() => setSelectedFile(null)} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>Change</button>
            </div>

            {scanning ? (
              <div style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#818cf8' }}>
                <Loader2 size={32} className="animate-spin" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Extracting OCR text & predicting category...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {scannedData && (
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} />
                      Receipt parsed via OCR
                    </span>
                    <span>Conf: {Math.round((scannedData.confidence || 0.8) * 100)}%</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Date *</label>
                    <input
                      type="date"
                      className="input-field"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Merchant / Description *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Predicted Category</label>
                    <select
                      className="input-field"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Payment Method</label>
                    <select
                      className="input-field"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    >
                      {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={handleClose}>Cancel</button>
                  <button type="submit" className="btn-primary">
                    <Check size={16} />
                    <span>Confirm & Add Expense</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptScanModal;
