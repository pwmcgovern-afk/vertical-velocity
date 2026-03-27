/**
 * Build script: generates /company/:slug/index.html and /vertical/:categoryId/index.html
 * with correct OG meta tags. Vercel serves these static files to crawlers
 * before the SPA catch-all rewrite kicks in.
 *
 * Run after `vite build` via: npx tsx scripts/generate-og-pages.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { companies, categories, getCompanySlug } from '../src/data/companies';

const distDir = join(import.meta.dirname, '..', 'dist');
const template = readFileSync(join(distDir, 'index.html'), 'utf-8');

function formatARRPerEmp(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}M`;
  return `$${v}K`;
}

function replaceMeta(html: string, opts: { title: string; description: string; ogImage: string; pageUrl: string }): string {
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${opts.title}</title>`);
  out = out.replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${opts.title}" />`);
  out = out.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${opts.description}" />`);
  out = out.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${opts.pageUrl}" />`);
  out = out.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${opts.title}" />`);
  out = out.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${opts.description}" />`);
  out = out.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${opts.ogImage}" />`);
  out = out.replace(/<meta property="twitter:url" content="[^"]*" \/>/, `<meta property="twitter:url" content="${opts.pageUrl}" />`);
  out = out.replace(/<meta property="twitter:title" content="[^"]*" \/>/, `<meta property="twitter:title" content="${opts.title}" />`);
  out = out.replace(/<meta property="twitter:description" content="[^"]*" \/>/, `<meta property="twitter:description" content="${opts.description}" />`);
  out = out.replace(/<meta property="twitter:image" content="[^"]*" \/>/, `<meta property="twitter:image" content="${opts.ogImage}" />`);
  out = out.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${opts.pageUrl}" />`);
  return out;
}

const ranked = [...companies]
  .filter(c => c.arr !== null)
  .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

// Generate company pages
for (const company of companies) {
  if (company.arr === null) continue;

  const slug = getCompanySlug(company.name);
  const cat = categories.find(c => c.id === company.category);
  const rank = ranked.findIndex(c => c.name === company.name) + 1;
  const arrPerEmp = formatARRPerEmp(company.arrPerEmployee || 0);

  const html = replaceMeta(template, {
    title: `${company.name} - ${arrPerEmp}/emp (#${rank}) | Vertical Velocity`,
    description: `${company.name} ranks #${rank} with ${arrPerEmp} ARR per employee. ${cat?.name || 'Vertical AI'} company, ${company.headcount} employees. See how they compare.`,
    ogImage: `https://verticalvelocity.co/api/og?slug=${slug}`,
    pageUrl: `https://verticalvelocity.co/company/${slug}`,
  });

  const outDir = join(distDir, 'company', slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
}

console.log(`Generated OG pages for ${companies.filter(c => c.arr !== null).length} companies`);

// Generate vertical/category pages
for (const cat of categories) {
  const categoryCompanies = ranked.filter(c => c.category === cat.id);
  if (categoryCompanies.length === 0) continue;

  const topCompany = categoryCompanies[0];
  const topArrPerEmp = formatARRPerEmp(topCompany.arrPerEmployee || 0);

  const html = replaceMeta(template, {
    title: `Top ${cat.name} AI Companies by Efficiency | Vertical Velocity`,
    description: `${categoryCompanies.length} ${cat.name.toLowerCase()} AI companies ranked by ARR per employee. #1: ${topCompany.name} at ${topArrPerEmp}/emp. See the full leaderboard.`,
    ogImage: `https://verticalvelocity.co/api/og?category=${cat.id}`,
    pageUrl: `https://verticalvelocity.co/vertical/${cat.id}`,
  });

  const outDir = join(distDir, 'vertical', cat.id);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
}

console.log(`Generated vertical pages for ${categories.length} categories`);

// Generate about page
{
  const html = replaceMeta(template, {
    title: 'About & Methodology | Vertical Velocity',
    description: `How Vertical Velocity ranks ${ranked.length}+ vertical AI companies by ARR per employee. Data sources, methodology, and update frequency.`,
    ogImage: 'https://verticalvelocity.co/og-image.jpg',
    pageUrl: 'https://verticalvelocity.co/about',
  });
  const outDir = join(distDir, 'about');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
  console.log('Generated about page');
}

// Generate compare landing page
{
  const html = replaceMeta(template, {
    title: 'Compare Vertical AI Companies | Vertical Velocity',
    description: `Compare ${ranked.length}+ vertical AI companies side-by-side on ARR per employee, valuation, headcount, and more.`,
    ogImage: 'https://verticalvelocity.co/og-image.jpg',
    pageUrl: 'https://verticalvelocity.co/compare',
  });
  const outDir = join(distDir, 'compare');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
  console.log('Generated compare page');
}

// Generate card pages for each company
for (const company of companies) {
  if (company.arr === null) continue;
  const slug = getCompanySlug(company.name);
  const rank = ranked.findIndex(c => c.name === company.name) + 1;
  const arrPerEmp = formatARRPerEmp(company.arrPerEmployee || 0);

  const html = replaceMeta(template, {
    title: `${company.name} - #${rank} Most Efficient | Vertical Velocity`,
    description: `${company.name} does ${arrPerEmp} ARR per employee, ranking #${rank} among ${ranked.length}+ vertical AI companies.`,
    ogImage: `https://verticalvelocity.co/api/og?slug=${slug}`,
    pageUrl: `https://verticalvelocity.co/card/${slug}`,
  });
  const outDir = join(distDir, 'card', slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
}
console.log(`Generated card pages for ${companies.filter(c => c.arr !== null).length} companies`);

// Generate programmatic SEO pages: /best-[vertical]-ai-companies
for (const cat of categories) {
  const categoryCompanies = ranked.filter(c => c.category === cat.id);
  if (categoryCompanies.length === 0) continue;

  const slug = `best-${cat.name.toLowerCase().replace(/\s+/g, '-')}-ai-companies`;
  const top5 = categoryCompanies.slice(0, 5).map(c => c.name).join(', ');
  const topCompany = categoryCompanies[0];
  const topArrPerEmp = formatARRPerEmp(topCompany.arrPerEmployee || 0);

  const html = replaceMeta(template, {
    title: `Best ${cat.name} AI Companies (${new Date().getFullYear()}) | Vertical Velocity`,
    description: `Top ${categoryCompanies.length} ${cat.name.toLowerCase()} AI companies ranked by efficiency. #1: ${topCompany.name} at ${topArrPerEmp}/emp. Full list: ${top5}.`,
    ogImage: `https://verticalvelocity.co/api/og?category=${cat.id}`,
    pageUrl: `https://verticalvelocity.co/${slug}`,
  });

  const outDir = join(distDir, slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
}
console.log(`Generated ${categories.length} SEO landing pages`);

// Generate cross-cutting SEO pages
const seoPages = [
  {
    slug: 'fastest-growing-vertical-ai-companies',
    title: `Fastest Growing Vertical AI Companies (${new Date().getFullYear()}) | Vertical Velocity`,
    description: `Trending vertical AI companies with the biggest ARR growth. ${companies.filter(c => c.trending?.direction === 'up').map(c => c.name).slice(0, 5).join(', ')} and more.`,
  },
  {
    slug: 'vertical-ai-companies-by-revenue',
    title: `Vertical AI Companies Ranked by Revenue (${new Date().getFullYear()}) | Vertical Velocity`,
    description: `${ranked.length}+ vertical AI companies ranked by ARR. From ${ranked[0]?.name} to early-stage startups. See revenue data across ${categories.length} sectors.`,
  },
  {
    slug: 'vertical-ai-market-map',
    title: `Vertical AI Market Map (${new Date().getFullYear()}) — ${categories.length} Sectors | Vertical Velocity`,
    description: `Complete vertical AI market map across ${categories.length} sectors: ${categories.slice(0, 8).map(c => c.name).join(', ')}. ${ranked.length}+ companies with ARR and efficiency data.`,
  },
  {
    slug: 'ai-companies-arr-per-employee',
    title: `AI Companies Ranked by ARR per Employee (${new Date().getFullYear()}) | Vertical Velocity`,
    description: `Which AI companies generate the most revenue per employee? ${ranked[0]?.name} leads at ${formatARRPerEmp(ranked[0]?.arrPerEmployee || 0)}/emp. See ${ranked.length}+ companies ranked.`,
  },
];

for (const sp of seoPages) {
  const html = replaceMeta(template, {
    title: sp.title,
    description: sp.description,
    ogImage: 'https://verticalvelocity.co/og-image.jpg',
    pageUrl: `https://verticalvelocity.co/${sp.slug}`,
  });
  const outDir = join(distDir, sp.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
}
console.log(`Generated ${seoPages.length} cross-cutting SEO pages`);

// Generate calculator page
{
  const html = replaceMeta(template, {
    title: 'Efficiency Calculator | Vertical Velocity',
    description: `See how your company ranks against ${ranked.length}+ vertical AI companies. Enter your ARR and headcount to calculate your efficiency score.`,
    ogImage: 'https://verticalvelocity.co/og-image.jpg',
    pageUrl: 'https://verticalvelocity.co/calculator',
  });
  const outDir = join(distDir, 'calculator');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
  console.log('Generated calculator page');
}

// Generate report page
{
  const html = replaceMeta(template, {
    title: 'Monthly Report | Vertical Velocity',
    description: `Monthly vertical AI market report: new companies, data updates, and sector analysis across ${ranked.length}+ companies.`,
    ogImage: 'https://verticalvelocity.co/og-image.jpg',
    pageUrl: 'https://verticalvelocity.co/report',
  });
  const outDir = join(distDir, 'report');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
  console.log('Generated report page');
}

// Inject JSON-LD structured data into homepage
{
  const homepagePath = join(distDir, 'index.html');
  let homepage = readFileSync(homepagePath, 'utf-8');

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Most Efficient Vertical AI Companies',
    description: `${ranked.length}+ vertical AI companies ranked by ARR per employee`,
    url: 'https://verticalvelocity.co',
    numberOfItems: ranked.length,
    itemListElement: ranked.slice(0, 20).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Organization',
        name: c.name,
        url: c.website,
        description: c.description?.slice(0, 200),
      },
    })),
  };

  const topCompanyName = ranked[0]?.name || 'N/A';
  const topArrPerEmpStr = formatARRPerEmp(ranked[0]?.arrPerEmployee || 0);
  const trendingCompanies = companies.filter(c => c.trending).map(c => c.name);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the most efficient vertical AI company?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${topCompanyName} leads with ${topArrPerEmpStr} ARR per employee. Vertical Velocity ranks ${ranked.length}+ vertical AI companies by capital efficiency.`,
        },
      },
      {
        '@type': 'Question',
        name: 'What is ARR per employee?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ARR per employee divides a company\'s Annual Recurring Revenue by its total headcount. It\'s a measure of capital efficiency — how much revenue each employee generates. Higher values indicate leaner, more efficient companies.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which vertical AI companies are trending right now?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Companies trending in ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}: ${trendingCompanies.join(', ')}. These companies recently raised significant funding or showed strong ARR growth.`,
        },
      },
      {
        '@type': 'Question',
        name: 'How many vertical AI companies does Vertical Velocity track?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Vertical Velocity tracks ${ranked.length}+ vertical AI companies across ${categories.length} sectors including healthcare, legal, finance, defense, and more. Data is updated monthly.`,
        },
      },
    ],
  };

  const scriptTag = `<script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>`;
  const faqTag = `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`;
  homepage = homepage.replace('</head>', `${scriptTag}\n${faqTag}\n</head>`);
  writeFileSync(homepagePath, homepage);
  console.log('Injected JSON-LD + FAQ schema into homepage');
}

// Inject JSON-LD Organization schema into company pages
for (const company of companies) {
  if (company.arr === null) continue;
  const slug = getCompanySlug(company.name);
  const pagePath = join(distDir, 'company', slug, 'index.html');

  try {
    let html = readFileSync(pagePath, 'utf-8');
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: company.name,
      url: company.website,
      description: company.description,
      foundingDate: String(company.founded),
      founder: company.founders.map(f => ({ '@type': 'Person', name: f })),
      address: { '@type': 'PostalAddress', addressLocality: company.headquarters },
      numberOfEmployees: { '@type': 'QuantitativeValue', value: company.headcount },
    };

    const scriptTag = `<script type="application/ld+json">${JSON.stringify(orgSchema)}</script>`;
    html = html.replace('</head>', `${scriptTag}\n</head>`);
    writeFileSync(pagePath, html);
  } catch { /* page may not exist */ }
}
console.log('Injected JSON-LD into company pages');

// Inject JSON-LD ItemList schema into vertical/category pages
for (const cat of categories) {
  const categoryCompanies = ranked.filter(c => c.category === cat.id);
  if (categoryCompanies.length === 0) continue;

  const pagePath = join(distDir, 'vertical', cat.id, 'index.html');
  try {
    let html = readFileSync(pagePath, 'utf-8');
    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Top ${cat.name} AI Companies by Efficiency`,
      description: `${categoryCompanies.length} ${cat.name.toLowerCase()} AI companies ranked by ARR per employee`,
      url: `https://verticalvelocity.co/vertical/${cat.id}`,
      numberOfItems: categoryCompanies.length,
      itemListElement: categoryCompanies.slice(0, 20).map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Organization',
          name: c.name,
          url: c.website,
          description: c.description?.slice(0, 200),
        },
      })),
    };

    const scriptTag = `<script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>`;
    html = html.replace('</head>', `${scriptTag}\n</head>`);
    writeFileSync(pagePath, html);
  } catch { /* page may not exist */ }
}
console.log('Injected JSON-LD into category pages');

// Generate complete sitemap.xml
{
  const today = new Date().toISOString().split('T')[0];
  const urls: { loc: string; priority: string; changefreq: string }[] = [];

  // Homepage
  urls.push({ loc: 'https://verticalvelocity.co/', priority: '1.0', changefreq: 'weekly' });

  // Static pages
  urls.push({ loc: 'https://verticalvelocity.co/about', priority: '0.6', changefreq: 'monthly' });
  urls.push({ loc: 'https://verticalvelocity.co/calculator', priority: '0.6', changefreq: 'monthly' });
  urls.push({ loc: 'https://verticalvelocity.co/report', priority: '0.7', changefreq: 'monthly' });
  urls.push({ loc: 'https://verticalvelocity.co/compare', priority: '0.5', changefreq: 'monthly' });

  // Company pages
  for (const company of companies) {
    if (company.arr === null) continue;
    const slug = getCompanySlug(company.name);
    urls.push({ loc: `https://verticalvelocity.co/company/${slug}`, priority: '0.8', changefreq: 'monthly' });
  }

  // Vertical/category pages
  for (const cat of categories) {
    const hasCo = companies.some(c => c.category === cat.id && c.arr !== null);
    if (!hasCo) continue;
    urls.push({ loc: `https://verticalvelocity.co/vertical/${cat.id}`, priority: '0.7', changefreq: 'monthly' });
  }

  // SEO landing pages
  for (const cat of categories) {
    const hasCo = companies.some(c => c.category === cat.id && c.arr !== null);
    if (!hasCo) continue;
    const slug = `best-${cat.name.toLowerCase().replace(/\s+/g, '-')}-ai-companies`;
    urls.push({ loc: `https://verticalvelocity.co/${slug}`, priority: '0.6', changefreq: 'monthly' });
  }

  // Cross-cutting SEO pages
  for (const sp of seoPages) {
    urls.push({ loc: `https://verticalvelocity.co/${sp.slug}`, priority: '0.7', changefreq: 'monthly' });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  writeFileSync(join(distDir, 'sitemap.xml'), sitemap);
  console.log(`Generated sitemap.xml with ${urls.length} URLs`);
}
