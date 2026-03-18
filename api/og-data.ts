import type { VercelRequest, VercelResponse } from '@vercel/node';
import { companies, categories } from '../src/data/companies.js';

function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const ranked = [...companies]
  .filter(c => c.arr !== null)
  .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

export default function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string;

  if (!slug) {
    return res.status(400).json({ error: 'Missing slug' });
  }

  const company = companies.find(c => getSlug(c.name) === slug);
  if (!company) {
    return res.status(404).json({ error: 'Not found' });
  }

  const rank = ranked.findIndex(c => c.name === company.name) + 1;
  const cat = categories.find(c => c.id === company.category);

  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
  return res.json({
    company: {
      name: company.name,
      domain: company.domain,
      category: company.category,
      categoryName: cat?.name || 'Other',
      categoryColor: cat?.color || '#71717a',
      headcount: company.headcount,
      arr: company.arr,
      arrPerEmployee: company.arrPerEmployee,
      valuation: company.valuation,
      headquarters: company.headquarters,
      founded: company.founded,
    },
    rank,
  });
}
