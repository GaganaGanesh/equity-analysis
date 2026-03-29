const FMP_BASE = 'https://financialmodelingprep.com/stable';
const FMP_KEY = process.env.FMP_API_KEY;

const fmpFetch = async (endpoint) => {
  const url = `${FMP_BASE}/${endpoint}&apikey=${FMP_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`FMP ${res.status} on ${endpoint}: ${body}`);
  }
  return res.json();
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Ticker required' });

  const symbol = ticker.toUpperCase().trim();

  try {
    const [
      incomeStatements,
      cashFlowStatements,
      balanceSheets,
      ratios,
      profile,
      keyMetrics,
    ] = await Promise.allSettled([
      fmpFetch(`income-statement?symbol=${symbol}&limit=4`),
      fmpFetch(`cash-flow-statement?symbol=${symbol}&limit=4`),
      fmpFetch(`balance-sheet-statement?symbol=${symbol}&limit=4`),
      fmpFetch(`ratios?symbol=${symbol}&limit=4`),
      fmpFetch(`profile?symbol=${symbol}`),
      fmpFetch(`key-metrics?symbol=${symbol}&limit=4`),
    ]);

    const extract = (result, fallback = []) =>
      result.status === 'fulfilled' ? result.value : fallback;

    const profileData = extract(profile, [{}])[0] || {};

    if (!profileData.companyName) {
      return res.status(404).json({
        error: `Ticker "${symbol}" not found. Please verify the ticker symbol and try again.`
      });
    }

    const incomeData = extract(incomeStatements);
    const cashFlowData = extract(cashFlowStatements);
    const balanceData = extract(balanceSheets);

    return res.status(200).json({
      incomeStatements: incomeData,
      cashFlowStatements: cashFlowData,
      balanceSheets: balanceData,
      ratios: extract(ratios),
      keyMetrics: extract(keyMetrics),
      currentPrice: profileData.price || null,
      marketCap: profileData.mktCap || null,
      beta: profileData.beta || null,
      companyName: profileData.companyName || symbol,
      sector: profileData.sector || null,
      sharesOutstanding: profileData.sharesOutstanding || null,
      dataQuality: {
        hasIncomeStatement: incomeData.length > 0,
        hasCashFlow: cashFlowData.length > 0,
        hasBalanceSheet: balanceData.length > 0,
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
