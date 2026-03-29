const EDGAR_HEADERS = {
  'User-Agent': 'EquityAnalysisPlatform contact@equityplatform.com',
  'Accept': 'application/json',
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const findCIK = async (ticker) => {
  const res = await fetch(
    `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&forms=10-K&dateRange=custom&startdt=2023-01-01`,
    { headers: EDGAR_HEADERS }
  );
  const data = await res.json();
  const hit = data.hits?.hits?.[0];
  return hit?._source?.entity_id || null;
};

const getLatest10K = async (cik) => {
  const paddedCIK = String(cik).padStart(10, '0');
  const res = await fetch(
    `https://data.sec.gov/submissions/CIK${paddedCIK}.json`,
    { headers: EDGAR_HEADERS }
  );
  const data = await res.json();
  const filings = data.filings?.recent;
  if (!filings) return null;

  const idx = filings.form.findIndex(f => f === '10-K');
  if (idx === -1) return null;

  return {
    accessionRaw: filings.accessionNumber[idx].replace(/-/g, ''),
    primaryDoc: filings.primaryDocument[idx],
    filingDate: filings.filingDate[idx],
    cik: parseInt(cik),
  };
};

const extractMDA = async (filing) => {
  const { cik, accessionRaw, primaryDoc } = filing;
  const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionRaw}/${primaryDoc}`;

  const res = await fetch(url, { headers: EDGAR_HEADERS });
  const html = await res.text();

  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // Find Item 7 MD&A section
  const mdaStart = text.search(/item\s+7[\.\s]+management.{0,60}discussion/i);
  const mdaEnd = text.search(/item\s+7a[\.\s]+quantitative/i);

  if (mdaStart === -1) return text.substring(0, 12000);

  const end = mdaEnd > mdaStart ? mdaEnd : mdaStart + 25000;
  return text.substring(mdaStart, end).trim().substring(0, 20000);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Ticker required' });

  const symbol = ticker.toUpperCase().trim();

  try {
    const cik = await findCIK(symbol);
    if (!cik) return res.status(200).json({ text: null, error: 'Company not found on EDGAR' });

    await sleep(300);

    const filing = await getLatest10K(cik);
    if (!filing) return res.status(200).json({ text: null, error: 'No 10-K filing found' });

    await sleep(300);

    const mdaText = await extractMDA(filing);

    return res.status(200).json({
      text: mdaText,
      filingDate: filing.filingDate,
      error: null,
    });
  } catch (err) {
    // EDGAR failure is non-fatal — return null so analysis continues
    return res.status(200).json({ text: null, error: err.message });
  }
}
