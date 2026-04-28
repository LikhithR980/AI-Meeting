require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MeetAI Backend is running',
  });
});

app.post('/analyze', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim().length < 10) {
      return res.status(400).json({
        error: 'Transcript too short or missing',
      });
    }

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a professional meeting intelligence AI.

Return ONLY valid JSON.

{
  "summary": "string",
  "actionItems": [],
  "decisions": [],
  "risks": [],
  "speakers": []
}

Transcript:
${transcript}`,
        },
      ],
    });

    const raw = response.content[0].text;

    const clean = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

   let data;

try {
  data = JSON.parse(clean);
} catch (e) {
  console.log("RAW AI RESPONSE:", raw);

  data = {
    summary: raw.slice(0, 200),
    actionItems: [],
    decisions: [],
    risks: [],
    speakers: [],
  };
}

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: 'AI processing failed',
      details: err.message,
    });
  }
});

app.post('/ask', async (req, res) => {
  try {
    const { transcript, question } = req.body;

    if (!transcript || !question) {
      return res.status(400).json({
        error: 'Missing transcript or question',
      });
    }

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Answer ONLY from the transcript.

If not found, say: "Not mentioned in meeting"

Transcript:
${transcript}

Question: ${question}

Answer:`,
        },
      ],
    });

    const answer = response.content[0].text.trim();

    res.json({
      answer: answer || 'Not mentioned in meeting',
    });
  } catch (err) {
    res.status(500).json({
      error: 'AI Q&A failed',
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`MeetAI Backend running on port ${PORT}`);
});
