export const fetchAllFinancialData = async (ticker) => {
  const res = await fetch(`/api/financials?ticker=${ticker}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch financial data');
  return data;
};

export const SUGGESTED_TICKERS = [
  { ticker: 'AAPL', name: 'Apple', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft', sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon', sector: 'Technology / Retail' },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Technology' },
  { ticker: 'NVDA', name: 'NVIDIA', sector: 'Semiconductors' },
  { ticker: 'TSLA', name: 'Tesla', sector: 'Automotive / Energy' },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financials' },
  { ticker: 'NFLX', name: 'Netflix', sector: 'Media' },
  { ticker: 'UBER', name: 'Uber', sector: 'Technology' },
];
