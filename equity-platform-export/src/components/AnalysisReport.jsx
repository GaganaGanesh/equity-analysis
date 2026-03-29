const Section = ({ stage, label, children }) => (
  <div style={{ marginBottom: 48 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid #1a1a1a' }}>
      <div style={{ fontSize: 11, letterSpacing: 4, color: '#555' }}>STAGE {stage}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{label}</div>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, flag }) => {
  const flagColors = { red: '#ff4444', orange: '#f59e0b', yellow: '#eab308', green: '#22c55e' };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid #111' }}>
      <div style={{ fontSize: 12, color: '#666', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 13, color: flag ? flagColors[flag] || '#f0f0f0' : '#f0f0f0', textAlign: 'right', maxWidth: '60%' }}>
        {value === null || value === undefined ? <span style={{ color: '#333' }}>N/A</span> : String(value)}
      </div>
    </div>
  );
};

const Pill = ({ text, color }) => {
  const colors = {
    BUY: { bg: '#052e16', border: '#166534', text: '#22c55e' },
    SELL: { bg: '#2e0505', border: '#6d1b1b', text: '#ff4444' },
    HOLD: { bg: '#1a1500', border: '#5a4e00', text: '#eab308' },
  };
  const c = colors[text] || { bg: '#111', border: '#333', text: '#888' };
  return (
    <span style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      padding: '4px 14px',
      fontSize: 12,
      letterSpacing: 3,
      fontWeight: 700,
    }}>{text}</span>
  );
};

export default function AnalysisReport({ report, onReset }) {
  if (!report) return null;

  const { orient, diagnose, value, conclude, company } = report;

  const fmtPct = (n) => n != null ? `${(n * 100).toFixed(1)}%` : 'N/A';
  const fmtMoney = (n) => n != null ? `$${Number(n).toFixed(2)}` : 'N/A';
  const fmtX = (n) => n != null ? `${Number(n).toFixed(1)}x` : 'N/A';

  const accrualFlagColor = {
    green: 'green', yellow: 'yellow', orange: 'orange', red: 'red'
  }[diagnose?.earnings_quality?.accruals_flag?.toLowerCase()] || null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Report header */}
      <div style={{ marginBottom: 48, paddingBottom: 24, borderBottom: '1px solid #222' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 4, color: '#555', marginBottom: 8 }}>EQUITY ANALYSIS REPORT</div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{company?.ticker}</div>
            <div style={{ color: '#888', fontSize: 14 }}>{company?.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 12 }}>
              <Pill text={conclude?.recommendation} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{fmtMoney(conclude?.price_target_12m)}</div>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 2 }}>12-MONTH TARGET</div>
          </div>
        </div>

        {company?.data_gaps?.length > 0 && (
          <div style={{ marginTop: 16, padding: '10px 16px', background: '#1a1200', border: '1px solid #3d2e00' }}>
            <div style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 2, marginBottom: 4 }}>DATA GAPS</div>
            {company.data_gaps.map((g, i) => (
              <div key={i} style={{ fontSize: 12, color: '#888' }}>· {g}</div>
            ))}
          </div>
        )}
      </div>

      {/* Stage 1: Orient */}
      <Section stage="1" label="ORIENT — What business is this?">
        <div style={{ color: '#ccc', fontSize: 15, lineHeight: 1.7, marginBottom: 24, padding: '16px', background: '#111', borderLeft: '2px solid #333' }}>
          {orient?.business_description}
        </div>
        {orient?.headline_insight && (
          <div style={{ color: '#f59e0b', fontSize: 13, lineHeight: 1.6, marginBottom: 24, padding: '12px 16px', background: '#1a1200', border: '1px solid #3d2e00' }}>
            ⚡ {orient.headline_insight}
          </div>
        )}

        {/* Segment table */}
        {orient?.segments?.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: '#555', fontSize: 11, letterSpacing: 2, fontWeight: 400 }}>SEGMENT</th>
                  {['2021','2022','2023','2024'].map(y => (
                    <th key={y} style={{ textAlign: 'right', padding: '8px 12px', color: '#555', fontSize: 11, letterSpacing: 2, fontWeight: 400 }}>{y}</th>
                  ))}
                  <th style={{ textAlign: 'right', padding: '8px 0', color: '#555', fontSize: 11, letterSpacing: 2, fontWeight: 400 }}>TREND</th>
                </tr>
              </thead>
              <tbody>
                {orient.segments.map((seg, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: '12px 0', color: '#ccc' }}>{seg.name}</td>
                    {['2021','2022','2023','2024'].map(y => (
                      <td key={y} style={{ textAlign: 'right', padding: '12px', color: seg.margins?.[y] != null ? '#f0f0f0' : '#333' }}>
                        {seg.margins?.[y] != null ? `${(seg.margins[y] * 100).toFixed(1)}%` : '—'}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', padding: '12px 0', color: seg.trend === 'improving' ? '#22c55e' : seg.trend === 'declining' ? '#ff4444' : '#888', fontSize: 11, letterSpacing: 1 }}>
                      {seg.trend?.toUpperCase() || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Stage 2: Diagnose */}
      <Section stage="2" label="DIAGNOSE — Financial health">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#555', marginBottom: 12 }}>CASH FLOW</div>
            <Field label="OCF Growing?" value={diagnose?.cash_flow?.ocf_growing ? 'YES' : 'NO'} flag={diagnose?.cash_flow?.ocf_growing ? 'green' : 'red'} />
            <Field label="Normalized FCF" value={diagnose?.cash_flow?.normalized_fcf ? `$${(diagnose.cash_flow.normalized_fcf / 1e9).toFixed(1)}B` : null} />
            <Field label="FCF Yield" value={diagnose?.cash_flow?.fcf_yield != null ? fmtPct(diagnose.cash_flow.fcf_yield) : null} />
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#555', marginBottom: 12 }}>EARNINGS QUALITY</div>
            <Field label="Accruals Ratio" value={diagnose?.earnings_quality?.accruals_ratio != null ? fmtPct(diagnose.earnings_quality.accruals_ratio) : null} flag={accrualFlagColor} />
            <Field label="Quality Flag" value={diagnose?.earnings_quality?.accruals_flag} flag={accrualFlagColor} />
            <Field label="A/R Growing Faster?" value={diagnose?.earnings_quality?.ar_growing_faster_than_revenue != null ? (diagnose.earnings_quality.ar_growing_faster_than_revenue ? 'YES ⚠' : 'NO') : null} flag={diagnose?.earnings_quality?.ar_growing_faster_than_revenue ? 'orange' : null} />
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#555', marginBottom: 12 }}>KEY RATIOS</div>
            <Field label="ROIC vs WACC" value={diagnose?.ratios?.roic_vs_wacc} flag={diagnose?.ratios?.roic_vs_wacc?.toLowerCase().includes('exceeds') ? 'green' : 'red'} />
            <Field label="Net Debt / EBITDA" value={fmtX(diagnose?.ratios?.net_debt_ebitda)} flag={diagnose?.ratios?.net_debt_ebitda_flag?.toLowerCase()} />
            <Field label="Current Ratio" value={fmtX(diagnose?.ratios?.current_ratio)} flag={diagnose?.ratios?.current_ratio > 1.5 ? 'green' : diagnose?.ratios?.current_ratio < 1 ? 'red' : 'yellow'} />
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#555', marginBottom: 12 }}>MARGINS</div>
            {Object.entries(diagnose?.ratios?.gross_margins || {}).map(([y, v]) => (
              <Field key={y} label={`Gross Margin ${y}`} value={fmtPct(v)} />
            ))}
          </div>
        </div>
        {diagnose?.overall_health && (
          <div style={{ marginTop: 24, padding: '14px 16px', background: '#111', borderLeft: '2px solid #333', color: '#ccc', fontSize: 13, lineHeight: 1.7 }}>
            {diagnose.overall_health}
          </div>
        )}
      </Section>

      {/* Stage 3: Value */}
      <Section stage="3" label="VALUE — What is it worth?">
        {/* Comps */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#555', marginBottom: 12 }}>COMPARABLE COMPANY ANALYSIS</div>
          {value?.comps?.peer_tickers?.length > 0 && (
            <div style={{ marginBottom: 12, fontSize: 12, color: '#666' }}>
              Peers used: {value.comps.peer_tickers.join(' · ')}
            </div>
          )}
          <Field label="EV/EBITDA Multiple Applied" value={fmtX(value?.comps?.ev_ebitda_multiple_used)} />
          <Field label="Implied Price (Comps)" value={fmtMoney(value?.comps?.implied_price)} />
          <Field label="Upside / Downside" value={value?.comps?.upside_downside_pct != null ? `${value.comps.upside_downside_pct > 0 ? '+' : ''}${value.comps.upside_downside_pct.toFixed(1)}%` : null} flag={value?.comps?.upside_downside_pct > 0 ? 'green' : 'red'} />
        </div>

        {/* SOTP */}
        {value?.sotp?.applicable && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#555', marginBottom: 12 }}>SUM OF THE PARTS (SOTP)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {[['BEAR', value?.sotp?.bear_price, '#ff4444'], ['BASE', value?.sotp?.base_price, '#888'], ['BULL', value?.sotp?.bull_price, '#22c55e']].map(([label, price, color]) => (
                <div key={label} style={{ padding: '16px', background: '#111', border: '1px solid #1a1a1a', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: '#555', marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color }}>{fmtMoney(price)}</div>
                </div>
              ))}
            </div>
            {value.sotp.hidden_value_segment && (
              <div style={{ fontSize: 12, color: '#888' }}>Key insight: {value.sotp.hidden_value_segment}</div>
            )}
          </div>
        )}

        {/* RIM */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#555', marginBottom: 12 }}>RESIDUAL INCOME MODEL</div>
          <Field label="Intrinsic Value (RIM)" value={fmtMoney(value?.rim?.implied_intrinsic_value)} />
          <Field label="Cost of Equity" value={fmtPct(value?.rim?.cost_of_equity)} />
          <Field label="Beta Used" value={value?.rim?.beta_used} />
        </div>

        {/* Triangulation */}
        {value?.triangulation && (
          <div style={{ marginTop: 24, padding: '16px', background: '#111', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#555', marginBottom: 8 }}>TRIANGULATION</div>
            <Field label="Methods Agree?" value={value.triangulation.methods_agree ? 'YES' : 'NO — see reasoning'} flag={value.triangulation.methods_agree ? 'green' : 'yellow'} />
            <Field label="Conviction" value={value.triangulation.conviction?.toUpperCase()} />
            <Field label="Blended Target" value={fmtMoney(value.triangulation.blended_price_target)} />
            {value.triangulation.reasoning && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#888', lineHeight: 1.6 }}>{value.triangulation.reasoning}</div>
            )}
          </div>
        )}
      </Section>

      {/* Stage 4: Conclude */}
      <Section stage="4" label="CONCLUDE — Recommendation">
        <div style={{ padding: '24px', background: '#111', border: '1px solid #222', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <Pill text={conclude?.recommendation} />
            <div style={{ fontSize: 22, fontWeight: 700 }}>{fmtMoney(conclude?.price_target_12m)}</div>
            <div style={{ fontSize: 13, color: conclude?.upside_downside_pct > 0 ? '#22c55e' : '#ff4444' }}>
              {conclude?.upside_downside_pct != null ? `${conclude.upside_downside_pct > 0 ? '+' : ''}${conclude.upside_downside_pct.toFixed(1)}% from current ${fmtMoney(conclude?.current_price)}` : ''}
            </div>
          </div>
          <div style={{ fontSize: 15, color: '#ccc', lineHeight: 1.7 }}>{conclude?.thesis}</div>
        </div>

        {conclude?.key_assumptions?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#555', marginBottom: 12 }}>KEY ASSUMPTIONS</div>
            {conclude.key_assumptions.map((a, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #111', fontSize: 13, color: '#ccc' }}>· {a}</div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ padding: '16px', background: '#052e16', border: '1px solid #166534' }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#22c55e', marginBottom: 8 }}>BULL CASE</div>
            <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>{conclude?.bull_case}</div>
          </div>
          <div style={{ padding: '16px', background: '#2e0505', border: '1px solid #6d1b1b' }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#ff4444', marginBottom: 8 }}>BEAR CASE</div>
            <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>{conclude?.bear_case}</div>
          </div>
        </div>

        {conclude?.catalyst && (
          <div style={{ marginBottom: 16, padding: '14px 16px', background: '#111', borderLeft: '2px solid #555' }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#555', marginBottom: 6 }}>CATALYST</div>
            <div style={{ fontSize: 13, color: '#ccc' }}>{conclude.catalyst}</div>
          </div>
        )}

        {conclude?.falsifiability_condition && (
          <div style={{ padding: '14px 16px', background: '#0a0a1a', border: '1px solid #1a1a3a' }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#6666ff', marginBottom: 6 }}>FALSIFIABILITY CONDITION</div>
            <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>We would reverse this recommendation if: {conclude.falsifiability_condition}</div>
          </div>
        )}
      </Section>

      {/* Reset */}
      <div style={{ textAlign: 'center', paddingTop: 40, borderTop: '1px solid #1a1a1a' }}>
        <button
          onClick={onReset}
          style={{
            background: 'none',
            border: '1px solid #333',
            color: '#888',
            padding: '12px 32px',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: 3,
            fontFamily: 'inherit',
          }}
        >
          ANALYZE ANOTHER COMPANY
        </button>
        <div style={{ marginTop: 16, fontSize: 11, color: '#333' }}>
          Analysis generated using Google Gemini Flash · Data: FMP + SEC EDGAR · {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
