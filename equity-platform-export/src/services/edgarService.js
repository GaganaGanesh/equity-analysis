const EDGAR_BASE = 'https://data.sec.gov/submissions';
const EDGAR_SEARCH = 'https://efts.sec.gov/LATEST/search-index';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getCIK = async (ticker) => {
  const res = await fetch(
    `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&dateRange=custom&startdt=2023-01-01&forms=10-K`,
    { headers: { 'User-Agent': 'EquityAnalysisPlatform student@example.com' } }
  );
  const data = await res.json();
  const hit = data.hits?.hits?.[0];
  if (!hit) return null;
  return hit._source?.entity_id || null;
};

const getLatest10K = async (cik) => {
  const paddedCIK = String(cik).padStart(10, '0');
  const res = await fetch(
    `${EDGAR_BASE}/CIK${paddedCIK}.json`,
    { headers: { 'User-Agent': 'EquityAnalysisPlatform student@example.com' } }
  );
  const data = await res.json();
  const filings = data.filings?.recent;
  if (!filings) return null;

  const idx = filings.form.findIndex(f => f === '10-K');
  if (idx === -1) return null;

  const accessionRaw = filings.accessionNumber[idx].replace(/-/g, '');
  const accessionFormatted = filings.accessionNumber[idx];
  const primaryDoc = filings.primaryDocument[idx];

  return {
    accessionNumber: accessionFormatted,
    accessionRaw,
    primaryDoc,
    filingDate: filings.filingDate[idx],
    cik: paddedCIK,
  };
};

const extractMDAText = async (filing) => {
  const { cik, accessionRaw, primaryDoc } = filing;
  const docUrl = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accessionRaw}/${primaryDoc}`;

  const res = await fetch(docUrl, {
    headers: { 'User-Agent': 'EquityAnalysisPlatform student@example.com' }
  });
  const html = await res.text();

  // Strip HTML tags to get plain text
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const text = doc.body?.innerText || doc.body?.textContent || '';

  // Find MD&A section — look for Item 7 marker
  const mdaStart = text.search(/item\s+7[\.\s]+management.{0,50}discussion/i);
  const mdaEnd = text.search(/item\s+7a[\.\s]+quantitative/i);

  if (mdaStart === -1) {
    return text.substring(0, 8000); // fallback: return first 8000 chars
  }

  const end = mdaEnd > mdaStart ? mdaEnd : mdaStart + 20000;
  return text.substring(mdaStart, end).trim();
};

export const fetchEdgarMDA = async (ticker) => {
  try {
    // EDGAR search by ticker directly
    const searchRes = await fetch(
      `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&forms=10-K&dateRange=custom&startdt=2024-01-01`,
      { headers: { 'User-Agent': 'EquityAnalysisPlatform contact@equityplatform.com' } }
    );
    await sleep(300); // be polite to EDGAR

    const searchData = await searchRes.json();
    const hit = searchData.hits?.hits?.[0];

    if (!hit) {
      return { text: null, filingDate: null, error: 'No 10-K found on EDGAR' };
    }

    const entityId = hit._source?.entity_id;
    if (!entityId) return { text: null, error: 'Could not resolve CIK' };

    const filing = await getLatest10K(entityId);
    if (!filing) return { text: null, error: 'Could not retrieve 10-K filing index' };

    await sleep(300);
    const mdaText = await extractMDAText(filing);

    return {
      text: mdaText,
      filingDate: filing.filingDate,
      error: null
    };
  } catch (err) {
    console.error('EDGAR fetch failed:', err);
    return { text: null, error: err.message };
  }
};
