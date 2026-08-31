import React, { useState } from 'react';
import { importAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ImportCSV = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please upload a valid .csv file.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please upload a valid .csv file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await importAPI.uploadCSV(formData);
      if (res.data.success) {
        setResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process CSV import pipeline.');
    } finally {
      setUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!result?.failed_records || result.failed_records.length === 0) return;

    const errorContent = result.failed_records.map(rec => ({
      Row: rec.row,
      Reason: rec.reason,
      Raw_Data: JSON.stringify(rec.raw_data)
    }));

    const blob = new Blob([JSON.stringify(errorContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartspend_import_error_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleCSV = () => {
    const sample = `Date,Description,Amount,Category,Payment Method
2026-08-25,Amazon Electronics,1299.50,Shopping,Credit Card
2026-08-26,Uber ride to airport,240.00,Transportation,UPI
2026-08-27,Swiggy dinner,450.00,,UPI
2026-08-28,Starbucks Coffee,320.00,Food & Dining,Debit Card
2026-08-29,Blinkit Groceries,850.00,Groceries,UPI`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_expenses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="CSV Data Import Engine" />

      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              Bulk Transaction Import
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Automated data cleaning, date/amount normalization, duplicate detection, and NLP categorization.
            </p>
          </div>

          <button className="btn-secondary" onClick={downloadSampleCSV}>
            <Download size={16} />
            <span>Download Sample CSV</span>
          </button>
        </div>

        {/* Upload Container */}
        {!result ? (
          <div className="glass-panel" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '2px dashed #818cf8' : '2px dashed var(--border-glass)',
                background: dragActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
              onClick={() => document.getElementById('csvInput').click()}
            >
              <input
                id="csvInput"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}>
                <UploadCloud size={32} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {file ? file.name : 'Drag & drop your CSV file here'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {file ? `${(file.size / 1024).toFixed(1)} KB • Click to change file` : 'Supports standard CSV format with Date, Description, Amount, Category'}
                </p>
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Supported headers info banner */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Info size={20} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <strong>Intelligent Column Mapping Active:</strong> SmartSpend automatically detects variations of header names like <em>Date, Transaction Date, Particulars, Details, Amount, Cost, Category, Payment Method</em>. Missing categories will be auto-populated using AI.
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="btn-primary"
                disabled={!file || uploading}
                onClick={handleUpload}
                style={{ padding: '12px 24px' }}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    <span>Processing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Run CSV Import Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Import Result Summary Card */
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle color="#34d399" size={24} />
                <span>Import Batch Summary</span>
              </h3>
              <span className="badge badge-emerald">Import Finished</span>
            </div>

            {/* Stat Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(16,185,129,0.3)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', uppercase: 'true' }}>Successful Records</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                  {result.summary?.imported_count || 0}
                </h4>
              </div>

              <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(245,158,11,0.3)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', uppercase: 'true' }}>Duplicates Skipped</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
                  {result.summary?.duplicate_count || 0}
                </h4>
              </div>

              <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(99,102,241,0.3)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', uppercase: 'true' }}>AI Categorized</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8', marginTop: '4px' }}>
                  {result.summary?.auto_categorized_count || 0}
                </h4>
              </div>

              <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(244,63,94,0.3)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', uppercase: 'true' }}>Failed Records</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fb7185', marginTop: '4px' }}>
                  {result.summary?.failed_count || 0}
                </h4>
              </div>
            </div>

            {/* Error Report Download Section */}
            {result.failed_records && result.failed_records.length > 0 && (
              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle color="#fb7185" size={20} />
                  <span style={{ fontSize: '0.88rem', color: '#fb7185', fontWeight: 600 }}>
                    {result.failed_records.length} invalid rows were flagged and separated from DB insertion.
                  </span>
                </div>
                <button className="btn-secondary" onClick={downloadErrorReport} style={{ borderColor: 'rgba(244,63,94,0.4)', color: '#fb7185' }}>
                  <Download size={16} />
                  <span>Download Error Report (JSON)</span>
                </button>
              </div>
            )}

            {/* Footer Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button className="btn-secondary" onClick={() => setResult(null)}>
                Import Another CSV File
              </button>
              <button className="btn-primary" onClick={() => navigate('/expenses')}>
                <span>View Imported Expenses</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportCSV;
