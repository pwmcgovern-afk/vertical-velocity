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
