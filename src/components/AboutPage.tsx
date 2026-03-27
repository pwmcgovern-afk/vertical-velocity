import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { companies, categories } from '../data/companies';
import { formatARR, formatARRPerEmployee, DATA_LAST_UPDATED, updateMetaTag } from '../utils';

export function AboutPage() {
  const navigate = useNavigate();

  const ranked = [...companies]
    .filter(c => c.arr !== null)
    .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));
  const totalARR = ranked.reduce((sum, c) => sum + (c.arr || 0), 0);
  const avgARRPerEmp = Math.round(ranked.reduce((sum, c) => sum + (c.arrPerEmployee || 0), 0) / ranked.length);
  const trendingCount = companies.filter(c => c.trending).length;

  useEffect(() => {
    document.title = 'About & API | Vertical Velocity';
    updateMetaTag('description', `How Vertical Velocity ranks ${ranked.length}+ vertical AI companies by ARR per employee. Public API, methodology, and the thesis behind the project.`);
    window.scrollTo(0, 0);
    return () => {
      document.title = 'Vertical Velocity | ARR per Employee Rankings for Vertical AI';
    };
  }, [ranked.length]);

  return (
    <div className="company-page">
      <div className="cp-container">
        <button className="cp-back-btn" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Rankings
        </button>

        <h1 style={{ marginTop: '24px', marginBottom: '8px' }}>About Vertical Velocity</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Built by <a href="https://twitter.com/pw_mcgovern" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Pat McGovern</a>
        </p>

        {/* Thesis */}
        <div className="cp-box">
          <h3>The Thesis</h3>
          <p className="cp-box-text">
            The most interesting trend in AI isn't the foundation model race — it's what happens when AI meets industries with deep, specific workflows. Healthcare billing. Construction permitting. Legal research. Insurance claims.
          </p>
          <p className="cp-box-text" style={{ marginTop: '12px' }}>
            These "vertical AI" companies are building products that require genuine domain expertise to get right, which creates natural moats that horizontal tools can't easily replicate. But not all vertical AI companies are created equal. Some are genuinely AI-native — lean teams generating outsized revenue because the product does the work, not the headcount. Others are services companies with an AI wrapper.
          </p>
          <p className="cp-box-text" style={{ marginTop: '12px' }}>
            ARR per employee is the simplest way to tell them apart. It's not perfect — early-stage companies investing in R&D will look "inefficient" — but across {ranked.length}+ companies, the signal is clear. The best vertical AI companies generate $300K+ per employee. That's the benchmark.
          </p>
        </div>

        {/* What I found */}
        <div className="cp-box">
          <h3>What Surprised Me</h3>
          <p className="cp-box-text">
            Three things stood out after tracking {ranked.length} companies across {categories.length} verticals:
          </p>
          <p className="cp-box-text" style={{ marginTop: '12px' }}>
            <strong>1. Defense is absurdly efficient.</strong> Companies like Palantir and Anduril operate at 2-3x the efficiency of other verticals. Government contracts + AI automation is a powerful combination.
          </p>
          <p className="cp-box-text" style={{ marginTop: '8px' }}>
            <strong>2. Healthcare is the most competitive vertical.</strong> Nine companies, aggressive funding, but wide efficiency variance. The winners (OpenEvidence, Abridge) are 5-10x more efficient than the laggards.
          </p>
          <p className="cp-box-text" style={{ marginTop: '8px' }}>
            <strong>3. Revenue multiples have detached from efficiency.</strong> Some of the least efficient companies carry the highest valuations. The market is pricing growth rate and TAM, not operational leverage. That gap will close.
          </p>
        </div>

        {/* About me */}
        <div className="cp-box">
          <h3>Who Built This</h3>
          <p className="cp-box-text">
            I'm Pat McGovern. I spent the last several years investing in pre-seed and seed vertical AI companies at <a href="https://bowerycap.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Bowery Capital</a> in New York. I built Vertical Velocity because I wanted a tool that didn't exist — a way to benchmark vertical AI companies against each other on the metric that matters most: how efficiently they convert talent into revenue.
          </p>
          <p className="cp-box-text" style={{ marginTop: '12px' }}>
            The data is sourced from TechCrunch, Forbes, Bloomberg, The Information, Sacra, CB Insights, PitchBook, SEC filings, and press releases. Headcount is cross-referenced against LinkedIn. All figures are directional estimates, not audited financials.
          </p>
          <p className="cp-box-text" style={{ marginTop: '12px' }}>
            I write about vertical AI efficiency on <a href="https://capitalefficient.substack.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Substack</a>. Reach me at{' '}
            <a href="mailto:patrick.mcgovern@bowerycap.com" style={{ color: 'var(--accent)' }}>patrick.mcgovern@bowerycap.com</a> or{' '}
            <a href="https://twitter.com/pw_mcgovern" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>@pw_mcgovern</a>.
          </p>
        </div>

        {/* Live stats */}
        <div className="report-summary" style={{ marginTop: '24px' }}>
          <div className="sector-stat">
            <span className="sector-stat-value">{ranked.length}</span>
            <span className="sector-stat-label">Companies Tracked</span>
          </div>
          <div className="sector-stat">
            <span className="sector-stat-value">{formatARR(totalARR)}</span>
            <span className="sector-stat-label">Total ARR</span>
          </div>
          <div className="sector-stat">
            <span className="sector-stat-value">{formatARRPerEmployee(avgARRPerEmp)}</span>
            <span className="sector-stat-label">Avg ARR/Emp</span>
          </div>
          <div className="sector-stat">
            <span className="sector-stat-value">{trendingCount}</span>
            <span className="sector-stat-label">Trending Now</span>
          </div>
        </div>

        {/* Methodology */}
        <div className="cp-box" style={{ marginTop: '24px' }}>
          <h3>Methodology</h3>
          <p className="cp-box-text">
            <strong>Inclusion criteria:</strong> The company must sell AI-powered software for a specific industry, not horizontal tools. Pure infrastructure/model companies (OpenAI, Anthropic) are excluded. We need sufficient public data to estimate ARR and headcount.
          </p>
          <p className="cp-box-text" style={{ marginTop: '8px' }}>
            <strong>ARR per employee</strong> = Annual Recurring Revenue / total headcount. Simple, but it works. &gt;$300K is elite, $200-300K is strong, &lt;$100K is early stage or less AI-leveraged.
          </p>
          <p className="cp-box-text" style={{ marginTop: '8px' }}>
            <strong>Update frequency:</strong> Data refreshes as new funding rounds, revenue milestones, or headcount changes are reported publicly. Full dataset review monthly.
          </p>
          <p className="cp-box-text" style={{ marginTop: '8px', color: 'var(--text-tertiary)' }}>
            Last updated: {new Date(DATA_LAST_UPDATED).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Public API */}
        <div className="cp-box" style={{ marginTop: '24px' }}>
          <h3>Public API</h3>
          <p className="cp-box-text">
            Vertical Velocity has a free, public REST API. No auth required. All responses are JSON with CORS enabled.
          </p>
          <div className="api-docs" style={{ marginTop: '16px' }}>
            <div className="api-endpoint">
              <code className="api-method">GET</code>
              <code className="api-path">/api/companies</code>
              <p className="api-desc">List all companies. Params: <code>category</code>, <code>sort</code> (arrPerEmployee|arr|headcount), <code>limit</code></p>
            </div>
            <div className="api-endpoint">
              <code className="api-method">GET</code>
              <code className="api-path">/api/companies?slug=harvey</code>
              <p className="api-desc">Get a single company by slug with rank data.</p>
            </div>
            <div className="api-endpoint">
              <code className="api-method">GET</code>
              <code className="api-path">/api/search?q=health</code>
              <p className="api-desc">Search companies by name, domain, HQ, or founder.</p>
            </div>
            <div className="api-endpoint">
              <code className="api-method">GET</code>
              <code className="api-path">/api/trending</code>
              <p className="api-desc">Companies with recent significant changes (funding, ARR growth).</p>
            </div>
            <div className="api-endpoint">
              <code className="api-method">GET</code>
              <code className="api-path">/api/sectors</code>
              <p className="api-desc">All sectors with stats. Param: <code>id</code> for single sector detail.</p>
            </div>
          </div>
        </div>

        <div className="cp-newsletter" style={{ marginTop: '24px' }}>
          <span className="cp-newsletter-title">Monthly Vertical AI Analysis</span>
          <span className="cp-newsletter-subtitle">Rankings, biggest movers, and sector deep-dives delivered to your inbox.</span>
          <a
            href="https://capitalefficient.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cp-newsletter-btn"
          >
            Subscribe Free
          </a>
        </div>
      </div>
    </div>
  );
}
