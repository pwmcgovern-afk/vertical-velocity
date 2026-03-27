import type { VercelRequest, VercelResponse } from '@vercel/node';
import { companies, categories } from '../src/data/companies.js';

// Build compact dataset summary at module scope (cold-start only)
const datasetSummary = buildDatasetSummary();

function buildDatasetSummary(): string {
  const ranked = [...companies]
    .filter(c => c.arr !== null)
    .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

  const lines: string[] = [
    `Vertical Velocity tracks ${companies.length} vertical AI companies across ${categories.length} categories.`,
    `Categories: ${categories.map(c => `${c.name} (${c.id})`).join(', ')}`,
    '',
    'Companies (ranked by ARR/employee):',
  ];

  ranked.forEach((c, i) => {
    const parts = [
      `#${i + 1} ${c.name}`,
      `cat:${c.category}`,
      c.arr !== null ? `ARR:$${c.arr}M` : 'ARR:N/A',
      `HC:${c.headcount}`,
      c.arrPerEmployee !== null ? `ARR/emp:$${c.arrPerEmployee}K` : '',
      c.valuation !== null ? `val:$${c.valuation}B` : '',
      `HQ:${c.headquarters}`,
      `founded:${c.founded}`,
      `funding:${c.lastFunding}`,
      c.trending ? `trending:${c.trending.direction}` : '',
    ].filter(Boolean);
    lines.push(parts.join(' | '));
  });

  // Add companies without ARR
  const noArr = companies.filter(c => c.arr === null);
  if (noArr.length > 0) {
    lines.push('', 'Companies without public ARR data:');
    noArr.forEach(c => {
      lines.push(`${c.name} | cat:${c.category} | HC:${c.headcount} | HQ:${c.headquarters} | founded:${c.founded} | funding:${c.lastFunding}`);
    });
  }

  return lines.join('\n');
}

const SYSTEM_PROMPT = `You are the Vertical Velocity AI assistant. You answer questions about vertical AI companies tracked on verticalvelocity.co.

You have access to the full dataset below. Use it to answer questions about rankings, comparisons, revenue, headcount, funding, categories, and trends.

RULES:
- Only answer questions about vertical AI companies and the Vertical Velocity dataset
- If asked about something unrelated, politely decline and suggest asking about the companies instead
- Be concise and use data from the dataset to back up your answers
- Format numbers clearly (e.g., "$100M ARR", "473 employees")
- When comparing companies, use tables or bullet points
- If asked about a company not in the dataset, say so clearly

DATASET:
${datasetSummary}`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { messages } = req.body as { messages?: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Forward last 10 turns only
    const recentMessages = messages.slice(-10);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: recentMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (response.status === 429) {
      return res.status(429).json({ error: 'Too many requests, try again in a moment' });
    }

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', response.status, errBody);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text;

    if (!text) {
      return res.status(502).json({ error: 'Unexpected response format' });
    }

    return res.status(200).json({ response: text });
  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
