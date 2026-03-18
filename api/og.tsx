import { ImageResponse } from '@vercel/og';
import { companies, categories } from '../src/data/companies';

export const config = {
  runtime: 'edge',
};

function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatARR(arrInMillions: number): string {
  if (arrInMillions >= 1000) return `$${(arrInMillions / 1000).toFixed(1)}B`;
  return `$${arrInMillions}M`;
}

function formatARRPerEmployee(arrInThousands: number): string {
  if (arrInThousands >= 1000) return `$${(arrInThousands / 1000).toFixed(1)}M`;
  return `$${arrInThousands}K`;
}

function formatValuation(valuationInBillions: number): string {
  if (valuationInBillions >= 1) return `$${valuationInBillions}B`;
  return `$${Math.round(valuationInBillions * 1000)}M`;
}

function getEfficiencyColor(value: number): string {
  if (value >= 300) return '#22c55e';
  if (value >= 200) return '#f59e0b';
  return '#71717a';
}

// Pre-compute ranked list and company lookup
const ranked = [...companies]
  .filter(c => c.arr !== null)
  .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

const companyBySlug = new Map(
  companies.map(c => [getSlug(c.name), c])
);

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return new Response('Missing slug parameter', { status: 400 });
  }

  const company = companyBySlug.get(slug);
  if (!company) {
    return new Response('Company not found', { status: 404 });
  }

  const cat = categories.find(cat => cat.id === company.category);
  const categoryName = cat?.name || 'Other';
  const categoryColor = cat?.color || '#71717a';
  const rank = ranked.findIndex(c => c.name === company.name) + 1;
  const effColor = getEfficiencyColor(company.arrPerEmployee || 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0b',
          color: '#fafafa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '48px 56px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
          <img
            src={`https://img.logo.dev/${company.domain}?token=pk_Iw_EUyO3SUuLmOI4_D_2_Q&format=png&size=128`}
            width={72}
            height={72}
            style={{
              borderRadius: '14px',
              background: '#fff',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {company.name}
              </span>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: effColor,
                }}
              >
                #{rank}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  background: `${categoryColor}30`,
                  color: categoryColor,
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {categoryName}
              </span>
              <span style={{ color: '#a1a1aa', fontSize: '16px' }}>
                {company.headquarters} · Founded {company.founded}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'flex', gap: '16px', flex: '1' }}>
          {/* ARR/Emp - Hero */}
          <div
            style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#18181b',
              borderRadius: '16px',
              border: `2px solid ${effColor}`,
              padding: '24px',
            }}
          >
            <span
              style={{
                fontSize: '52px',
                fontWeight: 800,
                color: effColor,
                letterSpacing: '-0.02em',
              }}
            >
              {formatARRPerEmployee(company.arrPerEmployee || 0)}
            </span>
            <span style={{ fontSize: '16px', color: '#71717a', fontWeight: 500, marginTop: '4px' }}>
              ARR / Employee
            </span>
          </div>

          {/* ARR */}
          <div
            style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#18181b',
              borderRadius: '16px',
              border: '1px solid #27272a',
              padding: '24px',
            }}
          >
            <span style={{ fontSize: '44px', fontWeight: 700 }}>
              {company.arr ? formatARR(company.arr) : '—'}
            </span>
            <span style={{ fontSize: '16px', color: '#71717a', fontWeight: 500, marginTop: '4px' }}>
              ARR
            </span>
          </div>

          {/* Headcount */}
          <div
            style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#18181b',
              borderRadius: '16px',
              border: '1px solid #27272a',
              padding: '24px',
            }}
          >
            <span style={{ fontSize: '44px', fontWeight: 700 }}>
              {company.headcount.toLocaleString()}
            </span>
            <span style={{ fontSize: '16px', color: '#71717a', fontWeight: 500, marginTop: '4px' }}>
              Employees
            </span>
          </div>

          {/* Valuation */}
          <div
            style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#18181b',
              borderRadius: '16px',
              border: '1px solid #27272a',
              padding: '24px',
            }}
          >
            <span style={{ fontSize: '44px', fontWeight: 700 }}>
              {company.valuation ? formatValuation(company.valuation) : '—'}
            </span>
            <span style={{ fontSize: '16px', color: '#71717a', fontWeight: 500, marginTop: '4px' }}>
              Valuation
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#1e3a5f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              V
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#e0e7ff' }}>
              Vertical Velocity
            </span>
          </div>
          <span style={{ fontSize: '16px', color: '#71717a' }}>verticalvelocity.co</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    }
  );
}
