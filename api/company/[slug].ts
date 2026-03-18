// Serverless function that serves OG meta tags to social crawlers for /company/:slug routes
// Regular browsers get served the SPA index.html

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

const SOCIAL_CRAWLERS = [
  'Twitterbot',
  'LinkedInBot',
  'facebookexternalhit',
  'Slackbot',
  'Discordbot',
  'TelegramBot',
  'WhatsApp',
];

function isSocialCrawler(userAgent: string): boolean {
  return SOCIAL_CRAWLERS.some(bot => userAgent.includes(bot));
}

function formatName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const userAgent = req.headers['user-agent'] || '';
  const slug = req.query.slug as string;

  if (!slug) {
    // Serve SPA
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    try {
      const html = readFileSync(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch {
      return res.redirect('/');
    }
  }

  // For regular browsers, serve the SPA
  if (!isSocialCrawler(userAgent)) {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    try {
      const html = readFileSync(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch {
      return res.redirect('/');
    }
  }

  // For crawlers, serve OG meta tags
  const companyName = formatName(slug);
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'verticalvelocity.co';
  const origin = `${protocol}://${host}`;
  const ogImageUrl = `${origin}/api/og?slug=${slug}`;
  const pageUrl = `${origin}/company/${slug}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${companyName} - ARR per Employee | Vertical Velocity</title>
  <meta property="og:title" content="${companyName} - ARR per Employee | Vertical Velocity" />
  <meta property="og:description" content="See how ${companyName} ranks among 95+ vertical AI companies on ARR per employee efficiency." />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${companyName} - ARR per Employee | Vertical Velocity" />
  <meta name="twitter:description" content="See how ${companyName} ranks among 95+ vertical AI companies on ARR per employee efficiency." />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta name="twitter:site" content="@pw_mcgovern" />
</head>
<body></body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res.send(html);
}
