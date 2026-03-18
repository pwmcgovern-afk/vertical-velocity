// Vercel Edge Middleware for serving OG meta tags to social crawlers
// For Vite (non-Next.js) projects, middleware uses the Web API directly

export const config = {
  matcher: '/company/(.*)',
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

function getSlugFromPath(path: string): string | null {
  const match = path.match(/^\/company\/([^/]+)/);
  return match ? match[1] : null;
}

function formatName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';

  if (!isSocialCrawler(userAgent)) {
    return; // Pass through to SPA
  }

  const url = new URL(request.url);
  const slug = getSlugFromPath(url.pathname);
  if (!slug) {
    return;
  }

  const companyName = formatName(slug);
  const origin = url.origin;
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
  <meta http-equiv="refresh" content="0;url=${pageUrl}" />
</head>
<body></body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
