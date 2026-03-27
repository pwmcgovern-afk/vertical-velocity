import type { VercelRequest, VercelResponse } from '@vercel/node';
import { companies, categories } from '../src/data/companies.js';

function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const ranked = [...companies]
  .filter(c => c.arr !== null)
  .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const trending = companies
    .filter(c => c.trending && c.arr !== null)
    .map(c => {
      const rank = ranked.findIndex(r => r.name === c.name) + 1;
      const cat = categories.find(cat => cat.id === c.category);
      return {
        slug: getSlug(c.name),
        name: c.name,
        domain: c.domain,
        category: c.category,
        categoryName: cat?.name,
        arr: c.arr,
        arrPerEmployee: c.arrPerEmployee,
        headcount: c.headcount,
        rank,
        trending: c.trending,
      };
    })
    .sort((a, b) => {
      // New companies first, then by rank
      if (a.trending!.direction === 'new' && b.trending!.direction !== 'new') return -1;
      if (b.trending!.direction === 'new' && a.trending!.direction !== 'new') return 1;
      return a.rank - b.rank;
    });

  return res.json({
    count: trending.length,
    lastUpdated: '2026-03-27',
    companies: trending,
  });
}
