import { EQUITY_ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from '../prompts/systemPrompt.js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const runEquityAnalysis = async (
  geminiKey,
  ticker,
  financialData,
  mdaText,
  onProgress
) => {
  const { currentPrice, marketCap, beta } = financialData;

  onProgress('Sending data to Gemini Flash...');

  const userPrompt = buildAnalysisPrompt(
    ticker,
    {
      incomeStatements: financialData.incomeStatements,
      cashFlowStatements: financialData.cashFlowStatements,
      balanceSheets: financialData.balanceSheets,
      ratios: financialData.ratios,
      keyMetrics: financialData.keyMetrics,
      segments: financialData.segments,
      sharesOutstanding: financialData.sharesOutstanding,
      sector: financialData.sector,
    },
    mdaText,
    currentPrice,
    marketCap,
    beta
  );

  const payload = {
    system_instruction: {
      parts: [{ text: EQUITY_ANALYSIS_SYSTEM_PROMPT }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.1, // low temp = more consistent, less hallucination
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    }
  };

  const res = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    if (res.status === 400) throw new Error('Invalid Gemini API key. Check your key and try again.');
    if (res.status === 429) throw new Error('Gemini rate limit hit. Wait 60 seconds and retry.');
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  onProgress('Parsing analysis output...');

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) throw new Error('Gemini returned empty response. Try again.');

  // Clean potential markdown fences even with responseMimeType set
  const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini output was not valid JSON. This is rare — please retry.');
  }

  return parsed;
};

export const validateGeminiKey = async (key) => {
  // Lightweight validation — send a minimal request
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
  );
  if (res.status === 400 || res.status === 403) return false;
  return res.ok;
};
