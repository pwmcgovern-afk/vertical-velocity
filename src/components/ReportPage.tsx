import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getReport, getLatestReport } from '../data/reports';
import { companies, categories, getCompanySlug } from '../data/companies';
import { formatARR, formatARRPerEmployee, getEfficiencyColor } from '../utils';

export function ReportPage() {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();

  const report = month ? getReport(month) : getLatestReport();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (report) {
      document.title = `${report.title} Report | Vertical Velocity`;
    }
    return () => {
      document.title = 'Vertical Velocity | ARR per Employee Rankings for Vertical AI';
    };
  }, [report]);

  if (!report) {
    return (
      <div className="company-page">
        <div className="cp-container">
          <button className="cp-back-btn" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Rankings
          </button>
          <h2 style={{ marginTop: '24px' }}>Report not found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>No report available for this month.</p>
        </div>
      </div>
    );
  }

  const newEntries = report.entries.filter(e => e.type === 'new');
  const updates = report.entries.filter(e => e.type === 'update');

  return (
    <div className="company-page">
      <div className="cp-container">
        <button className="cp-back-btn" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Rankings
        </button>

        <h1 style={{ marginTop: '24px', marginBottom: '4px' }}>{report.title} Report</h1>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: '24px', fontSize: '14px' }}>
          Published {new Date(report.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="report-summary">
          <div className="sector-stat">
            <span className="sector-stat-value">{report.totalCompanies}</span>
            <span className="sector-stat-label">Companies Tracked</span>
          </div>
          <div className="sector-stat">
            <span className="sector-stat-value">{formatARR(report.totalARR)}</span>
            <span className="sector-stat-label">Total ARR</span>
          </div>
          <div className="sector-stat">
            <span className="sector-stat-value" style={{ color: getEfficiencyColor(report.avgARRPerEmp) }}>
              {formatARRPerEmployee(report.avgARRPerEmp)}
            </span>
            <span className="sector-stat-label">Avg ARR/Emp</span>
          </div>
          <div className="sector-stat">
            <span className="sector-stat-value">{report.entries.length}</span>
            <span className="sector-stat-label">Changes This Month</span>
          </div>
        </div>

        {newEntries.length > 0 && (
          <div className="cp-box">
            <h3>New Companies</h3>
            {newEntries.map((e, i) => {
              const company = companies.find(c => c.name === e.company);
              const slug = company ? getCompanySlug(company.name) : '';
              return (
                <div key={i} className="report-entry" onClick={() => slug && navigate(`/company/${slug}`)}>
                  <span className="report-entry-badge new">NEW</span>
                  <span className="report-entry-company">{e.company}</span>
                  <span className="report-entry-detail">{e.detail}</span>
                </div>
              );
            })}
          </div>
        )}

        {updates.length > 0 && (
          <div className="cp-box">
            <h3>Data Updates</h3>
            {updates.map((e, i) => {
              const company = companies.find(c => c.name === e.company);
              const slug = company ? getCompanySlug(company.name) : '';
              return (
                <div key={i} className="report-entry" onClick={() => slug && navigate(`/company/${slug}`)}>
                  <span className="report-entry-badge update">UPDATED</span>
                  <span className="report-entry-company">{e.company}</span>
                  <span className="report-entry-detail">{e.detail}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="cp-box">
          <h3>Sector Breakdown</h3>
          <div className="report-sectors">
            {report.sectorStats.map(s => {
              const cat = categories.find(c => c.id === s.category);
              return (
                <div
                  key={s.category}
                  className="report-sector-card"
                  onClick={() => navigate(`/vertical/${s.category}`)}
                >
                  <div className="report-sector-header">
                    <span className="report-sector-name" style={{ color: cat?.color }}>{s.categoryName}</span>
                    <span className="report-sector-count">{s.count} companies</span>
                  </div>
                  <div className="report-sector-stats">
                    <span>{formatARR(s.totalARR)} ARR</span>
                    <span style={{ color: getEfficiencyColor(s.avgARRPerEmp) }}>
                      {formatARRPerEmployee(s.avgARRPerEmp)} avg/emp
                    </span>
                    <span>Top: {s.topCompany}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
