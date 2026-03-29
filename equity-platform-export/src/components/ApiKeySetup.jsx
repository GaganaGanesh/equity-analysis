import { useState, useEffect } from 'react';
import { validateGeminiKey } from '../services/geminiService.js';

export default function ApiKeySetup({ onSubmit }) {
  const [geminiKey, setGeminiKey] = useState('');
  const [fmpKey, setFmpKey] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load saved keys from localStorage on mount
    const savedGemini = localStorage.getItem('eq_gemini_key') || '';
    const savedFmp = localStorage.getItem('eq_fmp_key') || '';
    setGeminiKey(savedGemini);
    setFmpKey(savedFmp);
  }, []);

  const handleSubmit = async () => {
    if (!geminiKey.trim()) { setError('Gemini API key is required'); return; }
    if (!fmpKey.trim()) { setError('FMP API key is required'); return; }

    setValidating(true);
    setError('');

    const geminiValid = await validateGeminiKey(geminiKey.trim());
    if (!geminiValid) {
      setError('Gemini API key appears invalid. Check it at aistudio.google.com');
      setValidating(false);
      return;
    }

    // Save keys to localStorage
    localStorage.setItem('eq_gemini_key', geminiKey.trim());
    localStorage.setItem('eq_fmp_key', fmpKey.trim());

    setValidating(false);
    onSubmit(geminiKey.trim(), fmpKey.trim());
  };

  const inputStyle = {
    width: '100%',
    background: '#111',
    border: '1px solid #333',
    color: '#f0f0f0',
    padding: '12px 16px',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    marginBottom: 12,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    letterSpacing: 3,
    color: '#666',
    marginBottom: 8,
  };

  return (
    <div style={{ maxWidth: 560, margin: '60px auto' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#555', marginBottom: 12 }}>SETUP</div>
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
          Add your API keys<br />to begin analysis
        </div>
        <div style={{ color: '#666', fontSize: 13, lineHeight: 1.7 }}>
          Both keys are stored only in your browser's local storage.
          They are never sent to any server other than Google and FMP directly.
          You can verify this in your browser's Network tab.
        </div>
      </div>

      {/* Gemini Key */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>GEMINI API KEY (FREE)</label>
        <input
          type="password"
          value={geminiKey}
          onChange={e => setGeminiKey(e.target.value)}
          placeholder="AIza..."
          style={inputStyle}
        />
        <div style={{ fontSize: 11, color: '#555' }}>
          Get free key → <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#888', textDecoration: 'underline' }}
          >aistudio.google.com</a> → Create API Key (takes 2 min)
        </div>
      </div>

      {/* FMP Key */}
      <div style={{ marginBottom: 32 }}>
        <label style={labelStyle}>FINANCIAL MODELING PREP KEY (FREE)</label>
        <input
          type="password"
          value={fmpKey}
          onChange={e => setFmpKey(e.target.value)}
          placeholder="your-fmp-key"
          style={inputStyle}
        />
        <div style={{ fontSize: 11, color: '#555' }}>
          Get free key → <a
            href="https://financialmodelingprep.com/developer/docs"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#888', textDecoration: 'underline' }}
          >financialmodelingprep.com</a> → Sign up → Dashboard → API Key
        </div>
      </div>

      {error && (
        <div style={{ color: '#ff4444', fontSize: 12, marginBottom: 16 }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={validating}
        style={{
          width: '100%',
          background: validating ? '#1a1a1a' : '#f0f0f0',
          color: validating ? '#555' : '#0a0a0a',
          border: 'none',
          padding: '16px',
          fontSize: 12,
          letterSpacing: 3,
          cursor: validating ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          fontWeight: 700,
        }}
      >
        {validating ? 'VALIDATING KEY...' : 'START ANALYZING →'}
      </button>
    </div>
  );
}
