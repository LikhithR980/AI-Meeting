require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');

// ── App setup ────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,                   // max 50 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/analyze', limiter);
app.use('/ask', limiter);

// ── Anthropic client ─────────────────────────────────────────────────────────
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.APP_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract the first JSON object from a string, even if wrapped in markdown.
 */
function extractJson(raw) {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : cleaned;
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /analyze
 * Analyzes a meeting transcript and returns structured JSON.
 */
app.post('/analyze', requireApiKey, async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim().length < 10) {
      return res.status(400).json({ error: 'Transcript is too short or missing.' });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system:
        'You are a meeting analyst. Return ONLY a valid JSON object with no additional text, explanation, or markdown formatting.',
      messages: [
        {
          role: 'user',
          content: `Analyze the following meeting transcript and return a JSON object with exactly these fields:

{
  "summary": "A concise paragraph summarising the meeting",
  "actionItems": ["Action 1", "Action 2"],
  "decisions": ["Decision 1", "Decision 2"],
  "risks": ["Risk 1", "Risk 2"],
  "speakers": ["Name 1", "Name 2"]
}

Transcript:
${transcript}`,
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    const raw = textBlock?.text ?? '';

    let data;
    try {
      data = JSON.parse(extractJson(raw));
    } catch {
      // Graceful fallback so the client always gets a usable response
      data = {
        summary: raw || 'Could not parse AI response.',
        actionItems: [],
        decisions: [],
        risks: [],
        speakers: [],
      };
    }

    return res.json(data);
  } catch (err) {
    console.error('[/analyze]', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

/**
 * POST /ask
 * Answers a question strictly from the provided transcript.
 */
app.post('/ask', requireApiKey, async (req, res) => {
  try {
    const { transcript, question } = req.body;

    if (!transcript || transcript.trim().length < 10) {
      return res.status(400).json({ error: 'Transcript is too short or missing.' });
    }
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is missing or empty.' });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system:
        'You answer questions strictly based on the meeting transcript provided. If the answer is not in the transcript, reply with exactly: "Not mentioned in meeting"',
      messages: [
        {
          role: 'user',
          content: `Transcript:
${transcript}

Question: ${question}`,
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    const answer = textBlock?.text?.trim() || 'Not mentioned in meeting';

    return res.json({ answer });
  } catch (err) {
    console.error('[/ask]', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MeetAI Backend running on port ${PORT}`);
});
