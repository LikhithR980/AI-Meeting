# 🎙️ MeetAI — Smart Meeting Intelligence

> AI-powered meeting assistant: live transcription, speaker detection, action items, decisions, risks, and interactive Q&A.

---

## 🚀 Quick Start (Local)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
PORT=3001
```

Get your key at → https://console.anthropic.com/

Start the backend:
```bash
npm start
# ✅ MeetAI Backend running → http://localhost:3001
```

### 2. Frontend Setup

No build step needed! Just open in browser:

```bash
# Option A — Open directly
open frontend/index.html

# Option B — Serve with any static server
npx serve frontend
# or
python3 -m http.server 8080 --directory frontend
```

---

## 🌐 Production Deployment

### Backend → Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your repo → select the `backend/` folder
4. Set **Environment Variable**: `ANTHROPIC_API_KEY=sk-ant-...`
5. Start command: `node server.js`
6. Copy your Render URL (e.g. `https://meetai-backend.onrender.com`)

### Frontend → Vercel

1. Open `frontend/index.html`
2. Find this line at the top of the `<script>` tag:
   ```js
   const BACKEND_URL = 'http://localhost:3001';
   ```
3. Replace with your Render URL:
   ```js
   const BACKEND_URL = 'https://meetai-backend.onrender.com';
   ```
4. Push to GitHub → [vercel.com](https://vercel.com) → **Import Project**
5. Done! ✅

---

## 🗂️ Project Structure

```
meeting-ai/
├── frontend/
│   └── index.html          # Complete React SPA (CDN, no build step)
├── backend/
│   ├── server.js           # Express + Anthropic API
│   ├── package.json
│   └── .env.example
├── vercel.json             # Vercel deploy config
└── README.md
```

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🎤 **Live Transcription** | Real-time speech-to-text via Web Speech API |
| 🧠 **AI Analysis** | Summary, action items, decisions, risks |
| 👥 **Speaker Detection** | Identifies speakers and their roles |
| 💬 **Ask AI** | Chat with AI about your meeting |
| 🎬 **Demo Mode** | Works without a mic — great for demos |
| 🔐 **Auth** | Login with any email/password (stored in localStorage) |

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/health`   | Health check |
| POST | `/analyze`  | Analyze transcript → summary, actions, decisions, risks, speakers |
| POST | `/ask`      | Ask a question about the meeting |

---

## 🏆 10-Second Pitch

> "User logs in, starts a meeting, AI transcribes it live, analyzes speakers, extracts decisions and tasks, and allows interactive questioning."

---

## 💡 Demo Tips

- Click **Load Demo Meeting** → then **Analyze Meeting** to see everything in action instantly
- Use quick-question buttons in the Ask AI panel for fast demos
- For live recording: use **Chrome** or **Edge** (Web Speech API support required)

---

## 🔑 Tech Stack

- **Frontend**: React 18 (CDN), Tailwind CSS
- **Backend**: Node.js, Express, Anthropic SDK
- **AI Model**: Claude claude-3-5-haiku (fast, accurate)
- **Deploy**: Vercel (frontend) + Render (backend)
