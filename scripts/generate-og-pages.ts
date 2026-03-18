/**
 * Build script: generates /company/:slug/index.html for each company
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

const ranked = [...companies]
  .filter(c => c.arr !== null)
  .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

for (const company of companies) {
  if (company.arr === null) continue;

  const slug = getCompanySlug(company.name);
  const cat = categories.find(c => c.id === company.category);
  const rank = ranked.findIndex(c => c.name === company.name) + 1;
  const arrPerEmp = formatARRPerEmp(company.arrPerEmployee || 0);

  const title = `${company.name} - ${arrPerEmp}/emp (#${rank}) | Vertical Velocity`;
  const description = `${company.name} ranks #${rank} with ${arrPerEmp} ARR per employee. ${cat?.name || 'Vertical AI'} company, ${company.headcount} employees. See how they compare.`;
  const ogImage = `https://verticalvelocity.co/api/og?slug=${slug}`;
  const pageUrl = `https://verticalvelocity.co/company/${slug}`;

  // Replace the generic meta tags with company-specific ones
  let html = template;

  // Replace title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${title}</title>`
  );

  // Replace meta name="title"
  html = html.replace(
    /<meta name="title" content="[^"]*" \/>/,
    `<meta name="title" content="${title}" />`
  );

  // Replace meta name="description"
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${description}" />`
  );

  // Replace OG tags
  html = html.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${pageUrl}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${title}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${description}" />`
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*" \/>/,
    `<meta property="og:image" content="${ogImage}" />`
  );

  // Replace Twitter tags
  html = html.replace(
    /<meta property="twitter:url" content="[^"]*" \/>/,
    `<meta property="twitter:url" content="${pageUrl}" />`
  );
  html = html.replace(
    /<meta property="twitter:title" content="[^"]*" \/>/,
    `<meta property="twitter:title" content="${title}" />`
  );
  html = html.replace(
    /<meta property="twitter:description" content="[^"]*" \/>/,
    `<meta property="twitter:description" content="${description}" />`
  );
  html = html.replace(
    /<meta property="twitter:image" content="[^"]*" \/>/,
    `<meta property="twitter:image" content="${ogImage}" />`
  );

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${pageUrl}" />`
  );

  // Write to dist/company/:slug/index.html
  const outDir = join(distDir, 'company', slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
}

console.log(`Generated OG pages for ${companies.filter(c => c.arr !== null).length} companies`);
