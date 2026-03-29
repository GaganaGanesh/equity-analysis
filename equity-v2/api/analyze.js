import { EQUITY_ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from '../src/prompts/systemPrompt.js';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ticker, financialData, mdaText } = req.body;
  if (!ticker || !financialData) return res.status(400).json({ error: 'ticker and financialData required' });

  const { currentPrice, marketCap, beta } = financialData;

  const userPrompt = buildAnalysisPrompt(
    ticker,
    financialData,
    mdaText,
    currentPrice,
    marketCap,
    beta
  );

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{
          text: EQUITY_ANALYSIS_SYSTEM_PROMPT + '\n\n' + userPrompt
        }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 65536,
    }
  };

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      if (geminiRes.status === 429) return res.status(429).json({ error: 'Analysis service busy. Please wait 60 seconds and retry.' });
      if (geminiRes.status === 400) return res.status(400).json({ error: `Request error: ${errBody}` });
      return res.status(geminiRes.status).json({ error: `Gemini error: ${errBody}` });
    }

    const data = await geminiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) return res.status(500).json({ error: 'Empty response from analysis engine. Please retry.' });

    // Extract JSON from response
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(500).json({ error: 'Analysis output malformed. Please retry.' });
    }

    const jsonOnly = cleaned.substring(jsonStart, jsonEnd + 1);

    let parsed;
    try {
      parsed = JSON.parse(jsonOnly);
    } catch {
      return res.status(500).json({ error: 'Could not parse analysis output. Please retry.' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
