import type { VercelRequest, VercelResponse } from '@vercel/node';
import { companies, categories } from '../src/data/companies.js';

function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getFundingStage(lastFunding: string): string {
  if (/public|ipo|nasdaq|nyse/i.test(lastFunding)) return 'Public';
  if (/acquired/i.test(lastFunding)) return 'Acquired';
  if (/seed/i.test(lastFunding)) return 'Seed';
  const seriesMatch = lastFunding.match(/Series\s+([A-Z])/i);
  if (seriesMatch) {
    const letter = seriesMatch[1].toUpperCase();
    if (letter <= 'B') return 'Series A-B';
    return 'Series C+';
  }
  return 'Other';
}

const ranked = [...companies]
  .filter(c => c.arr !== null)
  .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const slug = req.query.slug as string | undefined;
  const category = req.query.category as string | undefined;
  const sort = (req.query.sort as string) || 'arrPerEmployee';
  const limit = parseInt(req.query.limit as string) || 0;

  // Single company lookup
  if (slug) {
    const company = companies.find(c => getSlug(c.name) === slug);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const rank = ranked.findIndex(c => c.name === company.name) + 1;
    const categoryRanked = ranked.filter(c => c.category === company.category);
    const categoryRank = categoryRanked.findIndex(c => c.name === company.name) + 1;

    return res.json({
      company: {
        slug: getSlug(company.name),
        name: company.name,
        domain: company.domain,
        category: company.category,
        categoryName: categories.find(c => c.id === company.category)?.name,
        headcount: company.headcount,
        arr: company.arr,
        arrPerEmployee: company.arrPerEmployee,
        valuation: company.valuation,
        lastFunding: company.lastFunding,
        stage: getFundingStage(company.lastFunding),
        founded: company.founded,
        founders: company.founders,
        headquarters: company.headquarters,
        website: company.website,
        description: company.description,
      },
      rank,
      categoryRank,
      totalRanked: ranked.length,
    });
  }

  // List companies
  let result = [...ranked];

  // Filter by category
  if (category) {
    result = result.filter(c => c.category === category);
  }

  // Sort
  switch (sort) {
    case 'arr':
      result.sort((a, b) => (b.arr || 0) - (a.arr || 0));
      break;
    case 'headcount':
      result.sort((a, b) => b.headcount - a.headcount);
      break;
    case 'revenueMultiple':
      result.sort((a, b) => {
        const am = (a.valuation && a.arr) ? a.valuation * 1000 / a.arr : 0;
        const bm = (b.valuation && b.arr) ? b.valuation * 1000 / b.arr : 0;
        return bm - am;
      });
      break;
    // default: arrPerEmployee (already sorted)
  }

  // Limit
  if (limit > 0) {
    result = result.slice(0, limit);
  }

  const data = result.map((c, i) => ({
    rank: i + 1,
    slug: getSlug(c.name),
    name: c.name,
    domain: c.domain,
    category: c.category,
    categoryName: categories.find(cat => cat.id === c.category)?.name,
    headcount: c.headcount,
    arr: c.arr,
    arrPerEmployee: c.arrPerEmployee,
    valuation: c.valuation,
    stage: getFundingStage(c.lastFunding),
    founded: c.founded,
    headquarters: c.headquarters,
  }));

  return res.json({
    count: data.length,
    totalRanked: ranked.length,
    categories: categories.map(c => ({ id: c.id, name: c.name })),
    companies: data,
  });
}
