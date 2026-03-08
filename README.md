# 🇮🇳 Dalal Street Screener
**AI-powered Indian stock screener — ranks NSE/BSE stocks by 4 fundamental criteria**

Built with Claude AI (Anthropic) + Vercel serverless functions.

---

## 📊 Screening Criteria
1. **Market Cap / AUM ≥ ₹1000 Crore**
2. **Revenue CAGR ≥ 12%** (3-year)
3. **P/E Ratio < Industry P/E**
4. **Promoter Holding % increasing QoQ**

---

## 🚀 Deploy to Vercel (5 minutes)

### Step 1 — Get an Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Navigate to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

### Step 2 — Deploy to Vercel

**Option A: Via Vercel CLI (recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Go into the project folder
cd dalal-screener

# Deploy (follow the prompts — choose your account, new project)
vercel

# When asked about settings, just press Enter for defaults
# Framework: Other
# Root directory: ./
# Build command: (leave empty)
# Output directory: public
```

**Option B: Via Vercel Dashboard (drag & drop)**
1. Zip the entire `dalal-screener` folder
2. Go to [vercel.com/new](https://vercel.com/new)
3. Drag and drop the zip file
4. Click Deploy

### Step 3 — Add your API Key as an Environment Variable
1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings** → **Environment Variables**
3. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-your-key-here`
   - **Environment:** Production, Preview, Development (check all)
4. Click **Save**

### Step 4 — Redeploy
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment → **Redeploy**
3. Your site is live! 🎉

---

## 📁 Project Structure
```
dalal-screener/
├── api/
│   └── screen.js        ← Serverless function (calls Anthropic API securely)
├── public/
│   └── index.html       ← Frontend
├── vercel.json          ← Vercel routing config
├── package.json
└── README.md
```

---

## 💡 How It Works
```
User Browser (index.html)
    ↓  POST /api/screen  { stocks: [...] }
Vercel Serverless Function (api/screen.js)
    ↓  Uses ANTHROPIC_API_KEY (secret, server-side only)
Anthropic Claude API
    ↓  Returns ranked JSON analysis
User sees ranked stock cards
```

The API key **never touches the browser** — it lives only in Vercel's secure environment variables.

---

## ⚠️ Disclaimer
Numbers are AI-estimated from training data and may not reflect real-time market values.
Always verify on [screener.in](https://screener.in), NSE, or BSE before investing.
Not SEBI-registered investment advice.
