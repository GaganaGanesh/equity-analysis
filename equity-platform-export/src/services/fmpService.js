const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

const fmpFetch = async (endpoint, apiKey) => {
  const url = `${FMP_BASE}${endpoint}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP error on ${endpoint}: ${res.status}`);
  return res.json();
};

export const fetchAllFinancialData = async (ticker, fmpKey) => {
  const [
    incomeStatements,
    cashFlowStatements,
    balanceSheets,
    ratios,
    profile,
    segmentData,
    keyMetrics,
  ] = await Promise.allSettled([
    fmpFetch(`/income-statement/${ticker}?limit=4`, fmpKey),
    fmpFetch(`/cash-flow-statement/${ticker}?limit=4`, fmpKey),
    fmpFetch(`/balance-sheet-statement/${ticker}?limit=4`, fmpKey),
    fmpFetch(`/ratios/${ticker}?limit=4`, fmpKey),
    fmpFetch(`/profile/${ticker}?`, fmpKey),
    fmpFetch(`/revenue-product-segmentation?symbol=${ticker}&structure=flat&period=annual`, fmpKey),
    fmpFetch(`/key-metrics/${ticker}?limit=4`, fmpKey),
  ]);

  const extract = (result, fallback = []) =>
    result.status === 'fulfilled' ? result.value : fallback;

  const profileData = extract(profile, [{}])[0] || {};

  return {
    incomeStatements: extract(incomeStatements),
    cashFlowStatements: extract(cashFlowStatements),
    balanceSheets: extract(balanceSheets),
    ratios: extract(ratios),
    keyMetrics: extract(keyMetrics),
    segments: extract(segmentData),
    currentPrice: profileData.price || null,
    marketCap: profileData.mktCap || null,
    beta: profileData.beta || null,
    companyName: profileData.companyName || ticker,
    sector: profileData.sector || null,
    sharesOutstanding: profileData.sharesOutstanding || null,
  };
};

export const SUPPORTED_TICKERS = [
  { ticker: 'AAPL', name: 'Apple', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft', sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon', sector: 'Technology / Retail' },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Technology' },
  { ticker: 'NVDA', name: 'NVIDIA', sector: 'Semiconductors' },
  { ticker: 'TSLA', name: 'Tesla', sector: 'Automotive / Energy' },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financials' },
  { ticker: 'NFLX', name: 'Netflix', sector: 'Media / Technology' },
  { ticker: 'UBER', name: 'Uber Technologies', sector: 'Technology / Transport' },
];
