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
  res.json({ status: 'ok' });
});

app.post('/analyze', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim().length < 10) {
      return res.status(400).json({ error: 'Transcript too short' });
    }

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a meeting AI. Return ONLY valid JSON.

{
  "summary": "",
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

    const textBlock = response.content.find(c => c.type === 'text');
    const raw = textBlock ? textBlock.text : '';

    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;

    try {
      data = JSON.parse(clean);
    } catch {
      data = {
        summary: raw || 'AI response could not be parsed',
        actionItems: [],
        decisions: [],
        risks: [],
        speakers: [],
      };
    }

    res.json(data);
  } catch (err) {
    console.error('ANALYZE ERROR:', err);
    res.status(500).json({
      error: err.message || 'Internal server error',
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

    const textBlock = response.content.find(c => c.type === 'text');
    const answer = textBlock ? textBlock.text.trim() : '';

    res.json({
      answer: answer || 'Not mentioned in meeting',
    });
  } catch (err) {
    console.error('ASK ERROR:', err);
    res.status(500).json({
      error: err.message || 'Internal server error',
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`MeetAI Backend running on port ${PORT}`);
});