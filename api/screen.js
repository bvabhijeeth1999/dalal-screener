export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { stocks } = req.body;
  if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
    return res.status(400).json({ error: 'Please provide a list of stocks.' });
  }
  if (stocks.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 stocks per request.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const SYSTEM_PROMPT = `You are a precise Indian stock market analyst with deep knowledge of NSE/BSE listed companies.

The user will give you a list of Indian stock names or NSE tickers. For EACH stock, analyze it against these 4 criteria using your training knowledge of publicly available financial data:

1. AUM / Market Cap >= 1000 Crore (for mutual funds: AUM; for stocks: Market Cap)
2. Revenue/Earnings CAGR >= 12% (3-year CAGR, use revenue or EPS CAGR)
3. P/E Ratio < Industry P/E (compare company P/E to sector/industry average P/E)
4. Promoter Holding % — is it increasing QoQ (quarter-over-quarter)?

For each stock, provide:
- Full company name
- NSE symbol
- Sector/Industry
- One line description (what the company does)
- Criterion 1: Market Cap value in Crores, pass/fail
- Criterion 2: CAGR % value, pass/fail
- Criterion 3: Company P/E, Industry P/E, pass/fail
- Criterion 4: Latest promoter %, QoQ change (e.g. +0.5% or -0.3%), pass/fail/neutral
- Score (0-4 criteria passed)
- A brief 2-3 sentence analyst commentary on the stock's fundamentals
- An overall verdict: STRONG BUY / MODERATE / AVOID

IMPORTANT: Base your responses on the most recent data available in your training. If a stock is unknown or not listed in India, say so clearly. Be specific with numbers, not vague.

Respond ONLY with a valid JSON array, no markdown, no preamble, no backticks:
[
  {
    "symbol": "RELIANCE",
    "name": "Reliance Industries Ltd",
    "sector": "Conglomerate",
    "description": "India's largest conglomerate with interests in O2C, telecom, retail",
    "marketCap": 1850000,
    "marketCapPass": true,
    "cagr": 14.2,
    "cagrPass": true,
    "companyPE": 28.4,
    "industryPE": 32.1,
    "pePass": true,
    "promoterPct": 50.3,
    "promoterQoQChange": 0.2,
    "promoterPass": true,
    "score": 4,
    "verdict": "STRONG BUY",
    "analysis": "Reliance continues to demonstrate strong fundamentals with robust Jio subscriber growth and retail expansion. The O2C segment remains resilient. Promoter confidence remains high with consistent holding increase."
  }
]`;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Screen these Indian stocks and rank them:\n${stocks.join(', ')}`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error('Anthropic API error:', err);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data = await anthropicRes.json();
    const rawText = data.content.map((c) => c.text || '').join('');
    const clean = rawText.replace(/```json|```/g, '').trim();

    let results;
    try {
      results = JSON.parse(clean);
    } catch {
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) results = JSON.parse(match[0]);
      else throw new Error('Failed to parse AI response');
    }

    if (!Array.isArray(results)) throw new Error('Unexpected AI response format');

    // Sort: score desc, then CAGR desc
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.cagr || 0) - (a.cagr || 0);
    });

    return res.status(200).json({ results });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
}
