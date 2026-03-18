// Edge function that serves OG meta tags to social crawlers for /company/:slug routes
// Regular browsers get redirected to the SPA

export const config = {
  runtime: 'edge',
};

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

export default async function handler(req: Request) {
  const userAgent = req.headers.get('user-agent') || '';
  const url = new URL(req.url);

  // Extract slug from the path - Vercel passes it as /api/company/[slug]
  const pathParts = url.pathname.split('/');
  const slug = pathParts[pathParts.length - 1];

  if (!slug) {
    // Pass through to SPA
    return fetch(new URL('/index.html', url.origin));
  }

  // For regular browsers, serve the SPA
  if (!isSocialCrawler(userAgent)) {
    return fetch(new URL('/index.html', url.origin));
  }

  // For crawlers, serve OG meta tags
  const companyName = formatName(slug);
  const ogImageUrl = `${url.origin}/api/og?slug=${slug}`;
  const pageUrl = `${url.origin}/company/${slug}`;

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
  <meta http-equiv="refresh" content="0;url=${pageUrl}" />
</head>
<body></body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
