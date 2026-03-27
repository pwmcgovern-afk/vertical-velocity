import type { VercelRequest, VercelResponse } from '@vercel/node';
import { companies, categories } from '../src/data/companies.js';

function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const ranked = [...companies]
  .filter(c => c.arr !== null)
  .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const q = (req.query.q as string || '').toLowerCase().trim();
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter: q' });
  }

  const results = ranked
    .filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.headquarters.toLowerCase().includes(q) ||
      c.founders.some(f => f.toLowerCase().includes(q))
    )
    .slice(0, 20)
    .map(c => {
      const cat = categories.find(cat => cat.id === c.category);
      const rank = ranked.findIndex(r => r.name === c.name) + 1;
      return {
        slug: getSlug(c.name),
        name: c.name,
        domain: c.domain,
        category: c.category,
        categoryName: cat?.name,
        arr: c.arr,
        arrPerEmployee: c.arrPerEmployee,
        headcount: c.headcount,
        headquarters: c.headquarters,
        rank,
        trending: c.trending || null,
      };
    });

  return res.json({
    query: q,
    count: results.length,
    companies: results,
  });
}
