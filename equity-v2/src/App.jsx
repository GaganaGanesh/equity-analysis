import { useState } from 'react';
import TickerSelector from './components/TickerSelector.jsx';
import AnalysisReport from './components/AnalysisReport.jsx';
import LoadingState from './components/LoadingState.jsx';
import { fetchAllFinancialData } from './services/fmpService.js';
import { fetchEdgarMDA } from './services/edgarService.js';
import { runEquityAnalysis } from './services/geminiService.js';

const STEPS = { SELECT: 'select', LOADING: 'loading', REPORT: 'report', ERROR: 'error' };

export default function App() {
  const [step, setStep] = useState(STEPS.SELECT);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');

  const handleTickerSelect = async (ticker) => {
    setSelectedTicker(ticker);
    setStep(STEPS.LOADING);
    setError('');

    try {
      setLoadingMessage(`Fetching financial data for ${ticker}...`);
      const financialData = await fetchAllFinancialData(ticker);

      setLoadingMessage('Retrieving SEC 10-K filing...');
      const edgarResult = await fetchEdgarMDA(ticker);

      setLoadingMessage('Running Orient → Diagnose → Value → Conclude...');
      const result = await runEquityAnalysis(
        ticker,
        financialData,
        edgarResult.text,
        setLoadingMessage
      );

      setReport({
        ...result,
        _meta: {
          ticker,
          edgarAvailable: !!edgarResult.text,
          filingDate: edgarResult.filingDate,
        }
      });
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
      <header style={{
        borderBottom: '1px solid #1a1a1a',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#555', marginBottom: 4 }}>EQUITY ANALYSIS PLATFORM</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
            ORIENT → DIAGNOSE → VALUE → CONCLUDE
          </div>
        </div>
        {step !== STEPS.SELECT && (
          <button
            onClick={handleReset}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: '#888',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 11,
              letterSpacing: 2,
              fontFamily: 'inherit',
            }}
          >
            NEW ANALYSIS
          </button>
        )}
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px' }}>
        {step === STEPS.SELECT && <TickerSelector onSelect={handleTickerSelect} />}
        {step === STEPS.LOADING && <LoadingState message={loadingMessage} ticker={selectedTicker} />}
        {step === STEPS.REPORT && report && <AnalysisReport report={report} onReset={handleReset} />}
        {step === STEPS.ERROR && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ color: '#ff4444', fontSize: 12, letterSpacing: 3, marginBottom: 20 }}>ERROR</div>
            <div style={{ color: '#ccc', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7 }}>{error}</div>
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: '1px solid #444',
                color: '#ccc',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: 11,
                letterSpacing: 2,
                fontFamily: 'inherit',
              }}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </main>

      <footer style={{
        borderTop: '1px solid #1a1a1a',
        padding: '20px 40px',
        textAlign: 'center',
        color: '#333',
        fontSize: 11,
        letterSpacing: 1,
      }}>
        DATA: SEC EDGAR · FINANCIAL MODELING PREP
        &nbsp;·&nbsp; ANALYSIS: GOOGLE GEMINI 2.5 FLASH
        &nbsp;·&nbsp; NOT FINANCIAL ADVICE
      </footer>
    </div>
  );
}
