export const runEquityAnalysis = async (ticker, financialData, mdaText, onProgress) => {
  onProgress('Running analysis engine...');

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker, financialData, mdaText }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 429) throw new Error(data.error);
    throw new Error(data.error || 'Analysis failed. Please retry.');
  }

  return data;
};
