import type { VercelRequest, VercelResponse } from '@vercel/node';
import { companies, categories } from '../src/data/companies.js';

function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const ranked = [...companies]
  .filter(c => c.arr !== null)
  .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const categoryId = req.query.id as string | undefined;

  if (categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return res.status(404).json({ error: 'Sector not found' });

    const sectorCompanies = ranked.filter(c => c.category === categoryId);
    const totalARR = sectorCompanies.reduce((sum, c) => sum + (c.arr || 0), 0);
    const avgARRPerEmp = sectorCompanies.length > 0
      ? Math.round(sectorCompanies.reduce((sum, c) => sum + (c.arrPerEmployee || 0), 0) / sectorCompanies.length)
      : 0;

    return res.json({
      sector: {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        companyCount: sectorCompanies.length,
        totalARR,
        avgARRPerEmployee: avgARRPerEmp,
        totalHeadcount: sectorCompanies.reduce((sum, c) => sum + c.headcount, 0),
      },
      companies: sectorCompanies.map((c, i) => ({
        rank: ranked.findIndex(r => r.name === c.name) + 1,
        categoryRank: i + 1,
        slug: getSlug(c.name),
        name: c.name,
        domain: c.domain,
        arr: c.arr,
        arrPerEmployee: c.arrPerEmployee,
        headcount: c.headcount,
        trending: c.trending || null,
      })),
    });
  }

  // All sectors summary
  const sectors = categories.map(cat => {
    const sectorCompanies = ranked.filter(c => c.category === cat.id);
    if (sectorCompanies.length === 0) return null;

    const totalARR = sectorCompanies.reduce((sum, c) => sum + (c.arr || 0), 0);
    const avgARRPerEmp = Math.round(
      sectorCompanies.reduce((sum, c) => sum + (c.arrPerEmployee || 0), 0) / sectorCompanies.length
    );

    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      companyCount: sectorCompanies.length,
      totalARR,
      avgARRPerEmployee: avgARRPerEmp,
      topCompany: {
        name: sectorCompanies[0].name,
        slug: getSlug(sectorCompanies[0].name),
        arrPerEmployee: sectorCompanies[0].arrPerEmployee,
      },
    };
  }).filter(Boolean);

  return res.json({
    count: sectors.length,
    totalCompanies: ranked.length,
    sectors,
  });
}
