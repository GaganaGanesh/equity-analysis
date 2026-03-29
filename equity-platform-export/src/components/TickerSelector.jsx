import { SUPPORTED_TICKERS } from '../services/fmpService.js';

export default function TickerSelector({ onSelect }) {
  return (
    <div style={{ maxWidth: 800, margin: '40px auto' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#555', marginBottom: 8 }}>SELECT COMPANY</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Which company do you want to analyze?</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {SUPPORTED_TICKERS.map(({ ticker, name, sector }) => (
          <button
            key={ticker}
            onClick={() => onSelect(ticker)}
            style={{
              background: 'none',
              border: '1px solid #222',
              color: '#f0f0f0',
              padding: '20px 24px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#555'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
          >
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{ticker}</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{name}</div>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 2 }}>{sector.toUpperCase()}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
