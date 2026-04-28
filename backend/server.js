require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MeetAI Backend is running ✅' });
});

// ─── Analyze Meeting Transcript ──────────────────────────────────────────────
app.post('/analyze', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'No transcript provided' });

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a professional meeting intelligence AI. Analyze the following meeting transcript.

Return ONLY a valid JSON object — no markdown, no extra text, no code fences.

Required JSON structure:
{
  "summary": "2-3 sentence executive summary of the meeting",
  "actionItems": ["action item 1", "action item 2", "action item 3"],
  "decisions": ["decision 1", "decision 2"],
  "risks": ["risk 1", "risk 2"],
  "speakers": [
    {
      "name": "Speaker Name",
      "role": "Their inferred role or title",
      "responsibilities": ["responsibility 1", "responsibility 2"]
    }
  ]
}

Meeting Transcript:
${transcript}`,
        },
      ],
    });

    const raw = message.content[0].text;
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(clean);
    res.json(data);
  } catch (err) {
    console.error('❌ /analyze error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Ask AI About Transcript ─────────────────────────────────────────────────
app.post('/ask', async (req, res) => {
  try {
    const { transcript, question } = req.body;
    if (!transcript || !question)
      return res.status(400).json({ error: 'Missing transcript or question' });

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are a helpful meeting assistant. Answer the question below using ONLY information from the meeting transcript. Be concise and direct.

Meeting Transcript:
${transcript}

Question: ${question}

Answer:`,
        },
      ],
    });

    res.json({ answer: message.content[0].text.trim() });
  } catch (err) {
    console.error('❌ /ask error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ MeetAI Backend running → http://localhost:${PORT}`);
});
