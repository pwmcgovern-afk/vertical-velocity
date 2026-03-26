import { useParams, useNavigate } from 'react-router-dom';
import { track } from '@vercel/analytics';
import { companies, categories } from '../data/companies';
import { useState, useEffect } from 'react';
import { ShareCard } from './ShareCard';
import { CompanyLogo } from './CompanyLogo';
import {
  formatARR, formatARRPerEmployee, formatValuation,
  getEfficiencyColor, getFundingStage, getRevenueMultiple,
} from '../utils';

function updateMetaTag(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
  if (el) {
    el.setAttribute('content', content);
  } else {
    el = document.createElement('meta');
    el.setAttribute(property.startsWith('og:') || property.startsWith('twitter:') ? 'property' : 'name', property);
    el.setAttribute('content', content);
    document.head.appendChild(el);
  }
}

export function CompanyPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [showShareCard, setShowShareCard] = useState(false);
  const [copiedStats, setCopiedStats] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  const company = companies.find(c =>
    c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) {
      const c = companies.find(co => co.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug);
      if (c) track('company_view', { slug: slug, category: c.category });
    }
  }, [slug]);

  // SEO: document title and meta description
  useEffect(() => {
    if (company) {
      const desc = `${company.name} does ${company.arrPerEmployee ? formatARRPerEmployee(company.arrPerEmployee) : 'N/A'} ARR per employee. See how ${company.name} ranks against ${companies.length}+ vertical AI companies.`;
      document.title = `${company.name} - ARR per Employee | Vertical Velocity`;
      updateMetaTag('description', desc);
      updateMetaTag('og:title', `${company.name} - ARR per Employee | Vertical Velocity`);
      updateMetaTag('og:description', desc);
      updateMetaTag('twitter:title', `${company.name} - ARR per Employee | Vertical Velocity`);
      updateMetaTag('twitter:description', desc);
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
  const ranked = [...companies]
    .filter(c => c.arr !== null)
    .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));
  const rank = ranked.findIndex(c => c.name === company.name) + 1;
  const totalRanked = ranked.length;

  const categoryCompanies = ranked.filter(c => c.category === company.category);
  const categoryRank = categoryCompanies.findIndex(c => c.name === company.name) + 1;

  const similarCompanies = companies
    .filter(c => c.category === company.category && c.name !== company.name && c.arr !== null)
    .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0))
    .slice(0, 5);

  const companySlug = company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const cardUrl = `https://verticalvelocity.co/card/${companySlug}`;
  const tweetText = `${company.name} is doing ${company.arrPerEmployee ? formatARRPerEmployee(company.arrPerEmployee) : 'N/A'} ARR per employee — #${rank} most efficient vertical AI company\n\nSee how they rank against ${companies.length}+ vertical AI companies:\n\nvia @pw_mcgovern`;
  const shareUrl = cardUrl;

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
          <div className="cp-random-buttons">
            <button
              className="cp-random-btn"
              onClick={() => {
                const pool = companies.filter(c => c.arr !== null && c.name !== company.name);
                const random = pool[Math.floor(Math.random() * pool.length)];
                const s = random.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                navigate(`/company/${s}`);
              }}
            >
              Random Company
            </button>
            <button
              className="cp-random-btn"
              onClick={() => {
                const sameVertical = companies.filter(c => c.category === company.category && c.arr !== null && c.name !== company.name);
                if (sameVertical.length === 0) return;
                const random = sameVertical[Math.floor(Math.random() * sameVertical.length)];
                const s = random.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                navigate(`/company/${s}`);
              }}
            >
              Discover {category?.name || 'Another'} Company
            </button>
          </div>
        </div>

        <div className="cp-header">
          <CompanyLogo domain={company.domain} name={company.name} color={company.color} size={128} className="cp-logo" wrapperClassName="cp-logo-wrapper" />
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
            <span className="cp-metric-value">{getRevenueMultiple(company) || '—'}</span>
            <span className="cp-metric-label">Rev Multiple</span>
          </div>
          <div className="cp-metric">
            <span className="cp-metric-value">{getFundingStage(company.lastFunding)}</span>
            <span className="cp-metric-label">Stage</span>
          </div>
        </div>

        {/* Collapsible ShareCard */}
        <button
          className="cp-share-toggle"
          onClick={() => setShowShareCard(prev => !prev)}
        >
          {showShareCard ? 'Hide Share Card' : 'Show Share Card'}
          <span className={`cp-share-toggle-arrow ${showShareCard ? 'open' : ''}`}>▼</span>
        </button>
        {showShareCard && (
          <ShareCard
            company={company}
            rank={rank}
            totalRanked={totalRanked}
            categoryRank={categoryRank}
            categoryName={category?.name || 'Other'}
          />
        )}

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
                track('share_twitter', { context: 'company', slug: companySlug });
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
            <button
              className="cp-share-btn"
              onClick={() => {
                const statsText = `${company.name}: ${company.arrPerEmployee ? formatARRPerEmployee(company.arrPerEmployee) : 'N/A'} ARR/emp, ${company.arr ? formatARR(company.arr) : 'N/A'} ARR, ${company.headcount.toLocaleString()} employees, #${rank} ranked — verticalvelocity.co/company/${companySlug}`;
                navigator.clipboard.writeText(statsText);
                setCopiedStats(true);
                track('copy_stats', { slug: companySlug });
                setTimeout(() => setCopiedStats(false), 2000);
              }}
            >
              {copiedStats ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
              {copiedStats ? 'Copied!' : 'Copy Stats'}
            </button>
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="cp-website-btn">
              Visit Website
            </a>
            <button
              className="cp-share-btn"
              onClick={() => {
                const s = company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                navigate(`/compare/${s}`);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Compare
            </button>
            <button
              className="cp-share-btn"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopiedLink(true);
                track('copy_link', { slug: companySlug });
                setTimeout(() => setCopiedLink(false), 2000);
              }}
            >
              {copiedLink ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              )}
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
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

        {/* Claim This Company */}
        <div className="cp-claim">
          {claimSubmitted ? (
            <p className="cp-claim-success">Thanks! We'll verify and add a badge to your page within 48 hours.</p>
          ) : showClaimForm ? (
            <form
              className="cp-claim-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const data: Record<string, string> = { company: company.name };
                formData.forEach((v, k) => { data[k] = v.toString(); });
                try {
                  const res = await fetch('https://formspree.io/f/mgopwvdv', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ ...data, _subject: `[VV Claim] ${company.name} — ${data.name}` }),
                  });
                  if (res.ok) {
                    setClaimSubmitted(true);
                    track('claim_company', { slug: companySlug });
                  }
                } catch { /* silent */ }
              }}
            >
              <h4>Claim This Page</h4>
              <input type="text" name="name" required placeholder="Your name" className="cp-claim-input" />
              <input type="email" name="email" required placeholder="Work email" className="cp-claim-input" />
              <input type="text" name="role" required placeholder="Your role (e.g., CEO, Co-founder)" className="cp-claim-input" />
              <button type="submit" className="cp-claim-submit">Submit Claim</button>
            </form>
          ) : (
            <button className="cp-claim-btn" onClick={() => setShowClaimForm(true)}>
              Are you the founder? Claim this page
            </button>
          )}
        </div>

        <div className="cp-disclaimer">
          Revenue figures sourced from public mentions in tech press. These numbers are for illustrative purposes only — treat them as directional estimates, not audited financials.
        </div>
      </div>
    </div>
  );
}
