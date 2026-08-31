import React, { useState, useRef, useEffect } from 'react';
import { assistantAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  TrendingUp, 
  ShieldAlert, 
  DollarSign, 
  HelpCircle,
  Zap
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "How much did I spend on Food this month?",
  "What is my projected expense for next month?",
  "Am I on track with my budget?",
  "Show my biggest expenses",
  "Did I have any unusual transactions?",
  "What are my monthly subscriptions?"
];

const Assistant = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am your AI Financial Assistant powered by SmartSpend ML models. Ask me anything about your spending, forecasts, budgets, or savings goals!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText = inputQuery) => {
    const textToSend = queryText.strip ? queryText.strip() : queryText;
    if (!textToSend) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (queryText === inputQuery) setInputQuery('');
    setLoading(true);

    try {
      const res = await assistantAPI.sendMessage(textToSend);
      if (res.data.success) {
        const aiMsg = {
          sender: 'assistant',
          text: res.data.reply,
          intent: res.data.intent,
          data: res.data.data,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: 'Sorry, I encountered an error retrieving your financial telemetry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="AI Financial Assistant" />

      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 120px)' }}>
        {/* Header */}
        <div className="glass-panel" style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#ffffff' }}>
              <Bot size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>Conversational AI Assistant</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Ask queries in natural language connected directly to your SQLite database & ML models.</p>
            </div>
          </div>

          <span className="badge badge-indigo">NLP Query Engine</span>
        </div>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              className="btn-secondary"
              onClick={() => handleSend(prompt)}
              style={{
                fontSize: '0.78rem',
                padding: '6px 12px',
                whiteSpace: 'nowrap',
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.1)'
              }}
            >
              <Sparkles size={13} color="#818cf8" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Chat Messages Stream */}
        <div className="glass-panel" style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';

            return (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: '12px'
              }}>
                {!isUser && (
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <Bot size={18} />
                  </div>
                )}

                <div style={{
                  maxWidth: '75%',
                  padding: '14px 18px',
                  borderRadius: isUser ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  background: isUser 
                    ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' 
                    : 'rgba(30, 41, 59, 0.7)',
                  border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  boxShadow: isUser ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                }}>
                  <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--text-dim)', marginTop: '6px', textAlign: 'right' }}>
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Bot size={18} />
              </div>
              <div className="glass-panel" style={{ padding: '12px 18px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Evaluating live database telemetry...
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Ask AI Assistant (e.g., How much did I spend on Food this month?)"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            <Send size={18} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;
