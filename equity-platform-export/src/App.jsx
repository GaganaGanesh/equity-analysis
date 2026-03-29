import { useState } from 'react';
import ApiKeySetup from './components/ApiKeySetup.jsx';
import TickerSelector from './components/TickerSelector.jsx';
import AnalysisReport from './components/AnalysisReport.jsx';
import LoadingState from './components/LoadingState.jsx';
import { fetchAllFinancialData } from './services/fmpService.js';
import { fetchEdgarMDA } from './services/edgarService.js';
import { runEquityAnalysis } from './services/geminiService.js';

const STEPS = {
  SETUP: 'setup',
  SELECT: 'select',
  LOADING: 'loading',
  REPORT: 'report',
  ERROR: 'error',
};

export default function App() {
  const [step, setStep] = useState(STEPS.SETUP);
  const [keys, setKeys] = useState({ gemini: '', fmp: '' });
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [missingDataChoice, setMissingDataChoice] = useState(null);
  const [pendingMissingData, setPendingMissingData] = useState(null);

  const handleKeysSubmit = (geminiKey, fmpKey) => {
    setKeys({ gemini: geminiKey, fmp: fmpKey });
    setStep(STEPS.SELECT);
  };

  const handleTickerSelect = async (ticker) => {
    setSelectedTicker(ticker);
    setStep(STEPS.LOADING);
    setError('');

    try {
      setLoadingMessage(`Fetching financial data for ${ticker}...`);
      const financialData = await fetchAllFinancialData(ticker, keys.fmp);

      setLoadingMessage('Retrieving 10-K filing from SEC EDGAR...');
      const edgarResult = await fetchEdgarMDA(ticker);

      // Check for missing segment data
      const hasSegments = financialData.segments && financialData.segments.length > 0;
      const hasMDA = !!edgarResult.text;

      if (!hasSegments || !hasMDA) {
        // Pause and ask user what to do
        setPendingMissingData({ financialData, edgarResult, missingSegments: !hasSegments, missingMDA: !hasMDA });
        setStep('missing_data');
        return;
      }

      await runAnalysis(ticker, financialData, edgarResult.text);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.ERROR);
    }
  };

  const handleMissingDataChoice = async (choice) => {
    // choice: 'skip' = skip missing sections, 'infer' = let Gemini infer
    const { financialData, edgarResult } = pendingMissingData;
    const mdaText = choice === 'infer' ? (edgarResult.text || 'NOT AVAILABLE - INFER FROM FINANCIAL DATA') : edgarResult.text;
    setMissingDataChoice(choice);
    setPendingMissingData(null);
    setStep(STEPS.LOADING);
    await runAnalysis(selectedTicker, financialData, mdaText, choice);
  };

  const runAnalysis = async (ticker, financialData, mdaText, missingDataHandling = 'available') => {
    try {
      setLoadingMessage('Running Orient stage analysis...');
      await new Promise(r => setTimeout(r, 400));
      setLoadingMessage('Running Diagnose stage — calculating ratios...');
      await new Promise(r => setTimeout(r, 400));
      setLoadingMessage('Running Value stage — SOTP and RIM models...');

      const result = await runEquityAnalysis(
        keys.gemini,
        ticker,
        financialData,
        mdaText,
        setLoadingMessage
      );

      setReport({ ...result, _meta: { filingSource: 'SEC EDGAR', missingDataHandling, ticker } });
      setStep(STEPS.REPORT);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.ERROR);
    }
  };

  const handleReset = () => {
    setReport(null);
    setSelectedTicker(null);
    setError('');
    setStep(STEPS.SELECT);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f0f0f0',
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #222',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#666', marginBottom: 4 }}>EQUITY ANALYSIS PLATFORM</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
            ORIENT → DIAGNOSE → VALUE → CONCLUDE
          </div>
        </div>
        {step !== STEPS.SETUP && (
          <button
            onClick={() => setStep(STEPS.SELECT)}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: '#888',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 12,
              letterSpacing: 2,
            }}
          >
            NEW ANALYSIS
          </button>
        )}
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px' }}>
        {step === STEPS.SETUP && (
          <ApiKeySetup onSubmit={handleKeysSubmit} />
        )}

        {step === STEPS.SELECT && (
          <TickerSelector onSelect={handleTickerSelect} />
        )}

        {step === STEPS.LOADING && (
          <LoadingState message={loadingMessage} ticker={selectedTicker} />
        )}

        {step === 'missing_data' && pendingMissingData && (
          <MissingDataPrompt
            missing={pendingMissingData}
            onChoice={handleMissingDataChoice}
          />
        )}

        {step === STEPS.REPORT && report && (
          <AnalysisReport report={report} onReset={handleReset} />
        )}

        {step === STEPS.ERROR && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ color: '#ff4444', fontSize: 14, marginBottom: 24 }}>ERROR</div>
            <div style={{ color: '#ccc', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>{error}</div>
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: '1px solid #444',
                color: '#ccc',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: 13,
                letterSpacing: 2,
              }}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1a1a1a',
        padding: '20px 40px',
        textAlign: 'center',
        color: '#444',
        fontSize: 11,
        letterSpacing: 1,
      }}>
        DATA: SEC EDGAR · FINANCIAL MODELING PREP · ANALYSIS: GOOGLE GEMINI FLASH
        &nbsp;·&nbsp; YOUR API KEY IS STORED LOCALLY AND NEVER SENT TO OUR SERVERS
      </footer>
    </div>
  );
}

function MissingDataPrompt({ missing, onChoice }) {
  return (
    <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
      <div style={{ color: '#f59e0b', fontSize: 11, letterSpacing: 4, marginBottom: 16 }}>DATA GAP DETECTED</div>
      <div style={{ color: '#ccc', marginBottom: 12 }}>
        {missing.missingSegments && <div style={{ marginBottom: 8 }}>· Segment-level data not available from FMP for this company</div>}
        {missing.missingMDA && <div style={{ marginBottom: 8 }}>· MD&A text could not be retrieved from SEC EDGAR</div>}
      </div>
      <div style={{ color: '#888', fontSize: 13, marginBottom: 40 }}>
        How would you like to proceed?
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button
          onClick={() => onChoice('infer')}
          style={{
            background: 'none',
            border: '1px solid #555',
            color: '#ccc',
            padding: '14px 28px',
            cursor: 'pointer',
            fontSize: 12,
            letterSpacing: 1,
          }}
        >
          LET GEMINI INFER<br />
          <span style={{ color: '#666', fontSize: 11 }}>Gemini estimates and discloses assumptions</span>
        </button>
        <button
          onClick={() => onChoice('skip')}
          style={{
            background: 'none',
            border: '1px solid #333',
            color: '#888',
            padding: '14px 28px',
            cursor: 'pointer',
            fontSize: 12,
            letterSpacing: 1,
          }}
        >
          SKIP MISSING SECTIONS<br />
          <span style={{ color: '#555', fontSize: 11 }}>Sections flagged as N/A in report</span>
        </button>
      </div>
    </div>
  );
}
