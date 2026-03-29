export default function LoadingState({ message, ticker }) {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <div style={{ fontSize: 11, letterSpacing: 4, color: '#555', marginBottom: 24 }}>ANALYZING {ticker}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
        {['ORIENT', 'DIAGNOSE', 'VALUE', 'CONCLUDE'].map((s, i) => (
          <div key={s} style={{
            padding: '6px 14px',
            border: '1px solid #222',
            fontSize: 10,
            letterSpacing: 2,
            color: '#444',
          }}>{s}</div>
        ))}
      </div>
      <div style={{ color: '#888', fontSize: 13 }}>{message}</div>
      <div style={{ marginTop: 24, color: '#444', fontSize: 11 }}>This takes 20–40 seconds</div>
    </div>
  );
}
