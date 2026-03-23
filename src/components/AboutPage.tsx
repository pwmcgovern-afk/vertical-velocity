import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { companies } from '../data/companies';
import { DATA_LAST_UPDATED } from '../utils';

export function AboutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'About & Methodology | Vertical Velocity';
    window.scrollTo(0, 0);
    return () => {
      document.title = 'Vertical Velocity | ARR per Employee Rankings for Vertical AI';
    };
  }, []);

  const companiesWithARR = companies.filter(c => c.arr !== null).length;

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
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Built by <a href="https://twitter.com/pw_mcgovern" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Pat McGovern</a> at{' '}
          <a href="https://bowerycap.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Bowery Capital</a>.
        </p>

        <div className="cp-box">
          <h3>What is Vertical Velocity?</h3>
          <p className="cp-box-text">
            Vertical Velocity ranks {companiesWithARR}+ vertical AI companies by capital efficiency, measured as ARR (Annual Recurring Revenue) per employee. It's a tool for investors, founders, and operators to benchmark vertical AI companies against each other.
          </p>
        </div>

        <div className="cp-box">
          <h3>Why ARR per Employee?</h3>
          <p className="cp-box-text">
            ARR per employee is a proxy for how efficiently a company converts headcount into revenue. AI-native companies should theoretically be more capital efficient than traditional SaaS because AI automates work that would otherwise require more people. This metric surfaces which companies are actually delivering on that promise. A $300K+ ARR/employee figure is considered highly efficient; below $200K suggests the company may be earlier stage or less AI-leveraged.
          </p>
        </div>

        <div className="cp-box">
          <h3>Data Sources & Methodology</h3>
          <p className="cp-box-text">
            Revenue figures are sourced from public mentions in tech press (TechCrunch, Forbes, Bloomberg, The Information), research firms (Sacra, CB Insights, PitchBook), SEC filings, and press releases. Headcount is cross-referenced against LinkedIn and media reports. Valuations come from funding announcements and secondary market data.
          </p>
          <p className="cp-box-text" style={{ marginTop: '12px' }}>
            Companies where we couldn't find sufficient public data to calculate ARR per employee are excluded. All figures should be treated as directional estimates, not audited financials.
          </p>
          <p className="cp-box-text" style={{ marginTop: '12px', color: 'var(--text-tertiary)' }}>
            Last updated: {new Date(DATA_LAST_UPDATED).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="cp-box">
          <h3>What Counts as "Vertical AI"?</h3>
          <p className="cp-box-text">
            We define vertical AI as companies building AI-powered software for a specific industry (healthcare, legal, finance, construction, etc.) rather than horizontal tools. The company must be selling software with AI as a core differentiator, not just a feature. Pure infrastructure/model companies (e.g., OpenAI, Anthropic) are excluded.
          </p>
        </div>

        <div className="cp-box">
          <h3>How Often is Data Updated?</h3>
          <p className="cp-box-text">
            Data is updated as new funding rounds, revenue milestones, or headcount changes are reported publicly. We aim to refresh the full dataset monthly. If your company's data is outdated, use the "Submit Company" button on the main page to send us an update.
          </p>
        </div>

        <div className="cp-box">
          <h3>Contact</h3>
          <p className="cp-box-text">
            Questions, corrections, or company submissions:{' '}
            <a href="mailto:patrick.mcgovern@bowerycap.com" style={{ color: 'var(--accent)' }}>
              patrick.mcgovern@bowerycap.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
