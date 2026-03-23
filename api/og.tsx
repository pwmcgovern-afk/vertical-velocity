import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

// Duplicated from src/data/companies.ts — keep in sync (can't import in edge runtime)
const categories: Record<string, { name: string; color: string }> = {
  finance: { name: 'Finance', color: '#f59e0b' },
  sales: { name: 'Sales', color: '#14b8a6' },
  enterprise: { name: 'Enterprise', color: '#06b6d4' },
  healthcare: { name: 'Healthcare', color: '#22c55e' },
  legal: { name: 'Legal', color: '#8b5cf6' },
  insurance: { name: 'Insurance', color: '#ec4899' },
  homeservices: { name: 'Home Services', color: '#f97316' },
  travel: { name: 'Travel', color: '#0891b2' },
  manufacturing: { name: 'Manufacturing', color: '#84cc16' },
  construction: { name: 'Construction', color: '#78716c' },
  logistics: { name: 'Logistics', color: '#7c3aed' },
  defense: { name: 'Defense', color: '#1e3a5f' },
  realestate: { name: 'Real Estate', color: '#059669' },
  other: { name: 'Other', color: '#71717a' },
};

interface CompanyOgData {
  name: string;
  domain: string;
  category: string;
  headcount: number;
  arr: number | null;
  arrPerEmployee: number | null;
  valuation: number | null;
  headquarters: string;
  founded: number;
}

// Mirrors getCompanySlug() in src/data/companies.ts — keep in sync
function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatARR(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${v}M`;
}

function formatARRPerEmp(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}M`;
  return `$${v}K`;
}

function formatVal(v: number): string {
  if (v >= 1) return `$${v}B`;
  return `$${Math.round(v * 1000)}M`;
}

function effColor(v: number): string {
  if (v >= 300) return '#22c55e';
  if (v >= 200) return '#f59e0b';
  return '#71717a';
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const categoryParam = searchParams.get('category');
  const dataUrl = new URL('/', req.url).origin;

  // Handle category OG image
  if (categoryParam && !slug) {
    try {
      const res = await fetch(`${dataUrl}/api/og-data?category=${categoryParam}`);
      if (res.ok) {
        const data = await res.json();
        const cat = data.category;
        const topCompanies = data.topCompanies || [];

        return new ImageResponse(
          (
            <div style={{
              width: '1200px', height: '630px', display: 'flex', flexDirection: 'column',
              background: '#0a0a0b', color: '#fafafa',
              fontFamily: 'system-ui, -apple-system, sans-serif', padding: '48px 56px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <span style={{ padding: '6px 16px', borderRadius: '8px', background: `${cat.color}30`, color: cat.color, fontSize: '20px', fontWeight: 700 }}>{cat.name}</span>
                <span style={{ fontSize: '20px', color: '#a1a1aa' }}>{data.totalInCategory} companies</span>
              </div>

              <div style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '40px' }}>
                Top {cat.name} AI Companies by Efficiency
              </div>

              <div style={{ display: 'flex', gap: '16px', flex: '1' }}>
                {topCompanies.slice(0, 3).map((c: { name: string; domain: string; arrPerEmployee: number | null; categoryRank: number }, i: number) => (
                  <div key={i} style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#18181b', borderRadius: '16px', border: i === 0 ? `2px solid ${cat.color}` : '1px solid #27272a', padding: '24px', gap: '12px' }}>
                    <img
                      src={`https://img.logo.dev/${c.domain}?token=pk_Iw_EUyO3SUuLmOI4_D_2_Q&format=png&size=128`}
                      width={48} height={48}
                      style={{ borderRadius: '10px', background: '#fff' }}
                    />
                    <span style={{ fontSize: '20px', fontWeight: 700 }}>{c.name}</span>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: effColor(c.arrPerEmployee || 0) }}>
                      {formatARRPerEmp(c.arrPerEmployee || 0)}
                    </span>
                    <span style={{ fontSize: '14px', color: '#71717a' }}>#{c.categoryRank} in {cat.name}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="30" height="30" viewBox="0 0 32 32">
                    <defs>
                      <linearGradient id="vv-g2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6"/>
                        <stop offset="100%" stopColor="#1d4ed8"/>
                      </linearGradient>
                    </defs>
                    <rect width="32" height="32" rx="7" fill="url(#vv-g2)"/>
                    <g fill="white">
                      <polygon points="3,8 8,8 11,20 14,8 17,8 12.5,24 9.5,24" opacity="0.8"/>
                      <polygon points="15,8 20,8 23,20 26,8 29,8 24.5,24 21.5,24"/>
                    </g>
                  </svg>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#e0e7ff' }}>Vertical Velocity</span>
                </div>
                <span style={{ fontSize: '16px', color: '#71717a' }}>verticalvelocity.co</span>
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
            headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' },
          }
        );
      }
    } catch {
      // Fall through to generic image
    }
  }

  if (!slug && !categoryParam) {
    return new Response('Missing slug or category', { status: 400 });
  }

  // Fetch company data from the site itself to avoid import issues
  let company: CompanyOgData | null = null;
  let rank = 0;

  if (slug) {
    try {
      const res = await fetch(`${dataUrl}/api/og-data?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        company = data.company;
        rank = data.rank;
      }
    } catch {
      // Fallback: generate a simple placeholder
    }
  }

  if (!company) {
    // Return a generic OG image
    return new ImageResponse(
      (
        <div style={{
          width: '1200px', height: '630px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0a0b', color: '#fafafa',
          fontFamily: 'system-ui', fontSize: '48px', fontWeight: 800,
        }}>
          Vertical Velocity
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const cat = categories[company.category] || categories.other;
  const ec = effColor(company.arrPerEmployee || 0);

  return new ImageResponse(
    (
      <div style={{
        width: '1200px', height: '630px', display: 'flex', flexDirection: 'column',
        background: '#0a0a0b', color: '#fafafa',
        fontFamily: 'system-ui, -apple-system, sans-serif', padding: '48px 56px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
          <img
            src={`https://img.logo.dev/${company.domain}?token=pk_Iw_EUyO3SUuLmOI4_D_2_Q&format=png&size=128`}
            width={72} height={72}
            style={{ borderRadius: '14px', background: '#fff' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.02em' }}>{company.name}</span>
              <span style={{ fontSize: '28px', fontWeight: 700, color: ec }}>#{rank}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ padding: '4px 12px', borderRadius: '6px', background: `${cat.color}30`, color: cat.color, fontSize: '16px', fontWeight: 600 }}>{cat.name}</span>
              <span style={{ color: '#a1a1aa', fontSize: '16px' }}>{company.headquarters} · Founded {company.founded}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flex: '1' }}>
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#18181b', borderRadius: '16px', border: `2px solid ${ec}`, padding: '24px' }}>
            <span style={{ fontSize: '52px', fontWeight: 800, color: ec, letterSpacing: '-0.02em' }}>{formatARRPerEmp(company.arrPerEmployee || 0)}</span>
            <span style={{ fontSize: '16px', color: '#71717a', fontWeight: 500, marginTop: '4px' }}>ARR / Employee</span>
          </div>
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '24px' }}>
            <span style={{ fontSize: '44px', fontWeight: 700 }}>{company.arr ? formatARR(company.arr) : '—'}</span>
            <span style={{ fontSize: '16px', color: '#71717a', fontWeight: 500, marginTop: '4px' }}>ARR</span>
          </div>
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '24px' }}>
            <span style={{ fontSize: '44px', fontWeight: 700 }}>{company.headcount.toLocaleString()}</span>
            <span style={{ fontSize: '16px', color: '#71717a', fontWeight: 500, marginTop: '4px' }}>Employees</span>
          </div>
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '24px' }}>
            <span style={{ fontSize: '44px', fontWeight: 700 }}>{company.valuation ? formatVal(company.valuation) : '—'}</span>
            <span style={{ fontSize: '16px', color: '#71717a', fontWeight: 500, marginTop: '4px' }}>Valuation</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="30" height="30" viewBox="0 0 32 32">
              <defs>
                <linearGradient id="vv-g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6"/>
                  <stop offset="100%" stopColor="#1d4ed8"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="7" fill="url(#vv-g)"/>
              <g fill="white">
                <polygon points="3,8 8,8 11,20 14,8 17,8 12.5,24 9.5,24" opacity="0.8"/>
                <polygon points="15,8 20,8 23,20 26,8 29,8 24.5,24 21.5,24"/>
              </g>
            </svg>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#e0e7ff' }}>Vertical Velocity</span>
          </div>
          <span style={{ fontSize: '16px', color: '#71717a' }}>verticalvelocity.co</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' },
    }
  );
}
