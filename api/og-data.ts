import type { VercelRequest, VercelResponse } from '@vercel/node';
import { companies, categories } from '../src/data/companies.js';

// Mirrors getCompanySlug() in src/data/companies.ts — keep in sync
function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const ranked = [...companies]
  .filter(c => c.arr !== null)
  .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

export default function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string;
  const categoryParam = req.query.category as string;

  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');

  // Handle category request for vertical OG cards
  if (categoryParam && !slug) {
    const cat = categories.find(c => c.id === categoryParam);
    if (!cat) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryCompanies = ranked.filter(c => c.category === categoryParam);
    const top5 = categoryCompanies.slice(0, 5).map((c, i) => ({
      name: c.name,
      domain: c.domain,
      arrPerEmployee: c.arrPerEmployee,
      arr: c.arr,
      rank: ranked.findIndex(r => r.name === c.name) + 1,
      categoryRank: i + 1,
    }));

    return res.json({
      category: {
        id: cat.id,
        name: cat.name,
        color: cat.color,
      },
      totalInCategory: categoryCompanies.length,
      topCompanies: top5,
    });
  }

  if (!slug) {
    return res.status(400).json({ error: 'Missing slug or category' });
  }

  const company = companies.find(c => getSlug(c.name) === slug);
  if (!company) {
    return res.status(404).json({ error: 'Not found' });
  }

  const rank = ranked.findIndex(c => c.name === company.name) + 1;
  const cat = categories.find(c => c.id === company.category);

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
