import { useParams, useNavigate } from 'react-router-dom';
import { companies, categories, type Company } from '../data/companies';
import { useState, useEffect } from 'react';

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

function getRevenueMultiple(company: Company): string {
  if (!company.valuation || !company.arr) return '—';
  const multiple = company.valuation * 1000 / company.arr;
  return `${multiple.toFixed(1)}x`;
}

function getFundingStage(lastFunding: string): string {
  if (/public|ipo|nasdaq|nyse/i.test(lastFunding)) return 'Public';
  if (/acquired/i.test(lastFunding)) return 'Acquired';
  if (/seed/i.test(lastFunding)) return 'Seed';
  const seriesMatch = lastFunding.match(/Series\s+([A-Z])/i);
  if (seriesMatch) {
    const letter = seriesMatch[1].toUpperCase();
    if (letter <= 'B') return `Series ${letter}`;
    return `Series ${letter}`;
  }
  return 'Other';
}

function CompanyLogo({ domain, name, color }: { domain: string; name: string; color: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Reset state when company changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [domain]);

  return (
    <div className="cp-logo-wrapper">
      {(!loaded || error) && (
        <div className="cp-logo fallback" style={{ background: `${color}30`, color }}>
          {initials}
        </div>
      )}
      {!error && (
        <img
          src={`https://img.logo.dev/${domain}?token=pk_Iw_EUyO3SUuLmOI4_D_2_Q&format=png&size=128`}
          alt={name}
          className={`cp-logo${loaded ? '' : ' loading'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

export function CompanyPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const company = companies.find(c =>
    c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug
  );

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Set document title for SEO
  useEffect(() => {
    if (company) {
      document.title = `${company.name} - ARR per Employee | Vertical Velocity`;
    }
    return () => {
      document.title = 'Vertical Velocity | ARR per Employee Rankings for Vertical AI';
    };
  }, [company]);

  if (!company) {
    return (
      <div className="company-page">
        <div className="cp-not-found">
          <h2>Company not found</h2>
          <p>The company you're looking for doesn't exist in our database.</p>
          <button className="cp-back-btn" onClick={() => navigate('/')}>
            Back to Rankings
          </button>
        </div>
      </div>
    );
  }

  const category = categories.find(c => c.id === company.category);
  const efficiencyColor = getEfficiencyColor(company.arrPerEmployee || 0);
  const rank = [...companies]
    .filter(c => c.arr !== null)
    .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0))
    .findIndex(c => c.name === company.name) + 1;

  // Find similar companies (same category, sorted by ARR/emp)
  const similarCompanies = companies
    .filter(c => c.category === company.category && c.name !== company.name && c.arr !== null)
    .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0))
    .slice(0, 5);

  const tweetText = `${company.name} is doing ${company.arrPerEmployee ? formatARRPerEmployee(company.arrPerEmployee) : 'N/A'} ARR per employee\n\nSee how they rank against ${companies.length}+ vertical AI companies:\n\nvia @pw_mcgovern`;
  const shareUrl = window.location.href;

  return (
    <div className="company-page">
      <div className="cp-container">
        <div className="cp-top-buttons">
          <button className="cp-back-btn" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Rankings
          </button>
          <button
            className="cp-random-btn"
            onClick={() => {
              const pool = companies.filter(c => c.arr !== null && c.name !== company.name);
              const random = pool[Math.floor(Math.random() * pool.length)];
              const slug = random.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              navigate(`/company/${slug}`);
            }}
          >
            Discover Another Company
          </button>
        </div>

        <div className="cp-header">
          <CompanyLogo domain={company.domain} name={company.name} color={company.color} />
          <div className="cp-header-info">
            <div className="cp-header-top">
              <h1>{company.name}</h1>
              <span className="cp-rank" style={{ color: efficiencyColor }}>#{rank}</span>
            </div>
            <div className="cp-header-meta">
              <span className={`category-tag ${company.category}`}>{category?.name}</span>
              <span className="cp-hq">{company.headquarters}</span>
              <span className="cp-founded">Founded {company.founded}</span>
            </div>
          </div>
        </div>

        <div className="cp-metrics">
          <div className="cp-metric hero" style={{ borderColor: efficiencyColor }}>
            <span className="cp-metric-value" style={{ color: efficiencyColor }}>
              {formatARRPerEmployee(company.arrPerEmployee || 0)}
            </span>
            <span className="cp-metric-label">ARR / Employee</span>
          </div>
          <div className="cp-metric">
            <span className="cp-metric-value">{company.arr ? formatARR(company.arr) : '—'}</span>
            <span className="cp-metric-label">Total ARR</span>
          </div>
          <div className="cp-metric">
            <span className="cp-metric-value">{company.headcount.toLocaleString()}</span>
            <span className="cp-metric-label">Employees</span>
          </div>
          <div className="cp-metric">
            <span className="cp-metric-value">{company.valuation ? formatValuation(company.valuation) : '—'}</span>
            <span className="cp-metric-label">Valuation</span>
          </div>
          <div className="cp-metric">
            <span className="cp-metric-value">{getRevenueMultiple(company)}</span>
            <span className="cp-metric-label">Rev Multiple</span>
          </div>
          <div className="cp-metric">
            <span className="cp-metric-value">{getFundingStage(company.lastFunding)}</span>
            <span className="cp-metric-label">Stage</span>
          </div>
        </div>

        {/* What It Does */}
        <div className="cp-box">
          <h3>What It Does</h3>
          <p className="cp-box-text">
            {company.description || `${company.name} is a ${category?.name?.toLowerCase() || 'vertical AI'} company headquartered in ${company.headquarters}, founded in ${company.founded}.`}
          </p>
        </div>

        {/* Company History */}
        <div className="cp-box">
          <h3>Company History</h3>
          <div className="cp-timeline">
            {company.milestones && company.milestones.length > 0 ? (
              <>
                {company.milestones.map((m, i) => (
                  <div className="cp-timeline-item" key={i}>
                    <div className={`cp-timeline-dot${i === company.milestones!.length - 1 ? ' current' : ''}`} />
                    <div className="cp-timeline-content">
                      <span className="cp-timeline-year">{m.year}</span>
                      <span className="cp-timeline-text">{m.text}</span>
                    </div>
                  </div>
                ))}
                {company.arr && (
                  <div className="cp-timeline-item">
                    <div className="cp-timeline-dot current" />
                    <div className="cp-timeline-content">
                      <span className="cp-timeline-year">Today</span>
                      <span className="cp-timeline-text">
                        {formatARR(company.arr)} ARR, {company.headcount.toLocaleString()} employees
                        {company.valuation ? `, valued at ${formatValuation(company.valuation)}` : ''}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="cp-timeline-item">
                  <div className="cp-timeline-dot" />
                  <div className="cp-timeline-content">
                    <span className="cp-timeline-year">{company.founded}</span>
                    <span className="cp-timeline-text">Founded by {company.founders.join(' & ')} in {company.headquarters}</span>
                  </div>
                </div>
                <div className="cp-timeline-item">
                  <div className="cp-timeline-dot" />
                  <div className="cp-timeline-content">
                    <span className="cp-timeline-year">{company.lastFunding.match(/\(([^)]+)\)/)?.[1] || 'Latest'}</span>
                    <span className="cp-timeline-text">{company.lastFunding.replace(/\s*\([^)]+\)/, '')}</span>
                  </div>
                </div>
                {company.arr && (
                  <div className="cp-timeline-item">
                    <div className="cp-timeline-dot current" />
                    <div className="cp-timeline-content">
                      <span className="cp-timeline-year">Today</span>
                      <span className="cp-timeline-text">
                        {formatARR(company.arr)} ARR, {company.headcount.toLocaleString()} employees
                        {company.valuation ? `, valued at ${formatValuation(company.valuation)}` : ''}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="cp-details">
          <div className="cp-detail-section">
            <h3>Company Details</h3>
            <div className="cp-detail-grid">
              <div className="cp-detail-item">
                <span className="cp-detail-label">Last Funding</span>
                <span className="cp-detail-value">{company.lastFunding}</span>
              </div>
              <div className="cp-detail-item">
                <span className="cp-detail-label">Founders</span>
                <span className="cp-detail-value">{company.founders.join(', ')}</span>
              </div>
              <div className="cp-detail-item">
                <span className="cp-detail-label">Website</span>
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="cp-detail-link">
                  {company.domain}
                </a>
              </div>
              <div className="cp-detail-item">
                <span className="cp-detail-label">Sources</span>
                <span className="cp-detail-value cp-sources">{company.source}</span>
              </div>
            </div>
          </div>

          <div className="cp-actions">
            <button
              className="cp-share-btn"
              onClick={() => {
                const url = encodeURIComponent(shareUrl);
                const text = encodeURIComponent(tweetText);
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X
            </button>
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="cp-website-btn">
              Visit Website
            </a>
          </div>
        </div>

        {similarCompanies.length > 0 && (
          <div className="cp-similar">
            <h3>Other {category?.name} Companies <span className="cp-similar-metric">ARR / Employee</span></h3>
            <div className="cp-similar-list">
              {similarCompanies.map(c => {
                const cSlug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                return (
                  <div
                    key={c.name}
                    className="cp-similar-card"
                    onClick={() => navigate(`/company/${cSlug}`)}
                  >
                    <div className="cp-similar-info">
                      <span className="cp-similar-name">{c.name}</span>
                      <span className="cp-similar-meta">{c.headcount} employees</span>
                    </div>
                    <span className="cp-similar-value" style={{ color: getEfficiencyColor(c.arrPerEmployee || 0) }}>
                      {formatARRPerEmployee(c.arrPerEmployee || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="cp-disclaimer">
          Revenue figures sourced from public mentions in tech press. These numbers are for illustrative purposes only — treat them as directional estimates, not audited financials.
        </div>
      </div>
    </div>
  );
}
