import { useState, useMemo } from 'react';
import { companies, categories } from '../data/companies';

type SortKey = 'arrPerEmployee' | 'arr' | 'headcount' | 'valuation';

function formatARR(arrInMillions: number): string {
  if (arrInMillions >= 1000) {
    return `$${(arrInMillions / 1000).toFixed(1)}B`;
  }
  return `$${arrInMillions}M`;
}

function formatARRPerEmployee(arrInThousands: number): string {
  if (arrInThousands >= 1000) {
    return `$${(arrInThousands / 1000).toFixed(1)}M`;
  }
  return `$${arrInThousands}K`;
}

function CompanyLogo({ domain, name }: { domain: string; name: string }) {
  const [error, setError] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (error) {
    return <div className="company-logo fallback">{initials}</div>;
  }

  return (
    <img
      src={`https://img.logo.dev/${domain}?token=pk_Iw_EUyO3SUuLmOI4_D_2_Q&format=png&size=64`}
      alt={name}
      className="company-logo"
      onError={() => setError(true)}
    />
  );
}

interface DashboardProps {
  initialCategory?: string;
}

export function Dashboard({ initialCategory }: DashboardProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory && initialCategory !== 'all'
      ? [initialCategory]
      : categories.map(c => c.id)
  );
  const [sortKey, setSortKey] = useState<SortKey>('arrPerEmployee');

  const filteredCompanies = useMemo(() => {
    return companies
      .filter(c => selectedCategories.includes(c.category))
      .sort((a, b) => {
        const aVal = a[sortKey] || 0;
        const bVal = b[sortKey] || 0;
        return bVal - aVal;
      });
  }, [selectedCategories, sortKey]);

  // Dynamic metrics based on filtered companies
  const filteredHeadcount = useMemo(() =>
    filteredCompanies.reduce((sum, c) => sum + c.headcount, 0),
    [filteredCompanies]
  );

  const filteredARR = useMemo(() =>
    filteredCompanies.reduce((sum, c) => sum + (c.arr || 0), 0),
    [filteredCompanies]
  );

  const filteredAvgARRPerEmployee = useMemo(() => {
    const companiesWithARR = filteredCompanies.filter(c => c.arr !== null);
    if (companiesWithARR.length === 0) return 0;
    return Math.round(companiesWithARR.reduce((sum, c) => sum + (c.arrPerEmployee || 0), 0) / companiesWithARR.length);
  }, [filteredCompanies]);

  const maxEfficiency = Math.max(...filteredCompanies.map(c => c.arrPerEmployee || 0));

  const getEfficiencyColor = (value: number) => {
    if (value >= 300) return '#22c55e';
    if (value >= 200) return '#f59e0b';
    return '#71717a';
  };

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-left">
          <h1>Vertical Velocity</h1>
          <p>ARR per employee across {companies.length} vertical AI companies</p>
          <div className="made-by">
            <span className="made-by-label">Made by</span>
            <span className="made-by-name">Pat McGovern</span>
            <div className="made-by-links">
              <a href="https://twitter.com/pw_mcgovern" target="_blank" rel="noopener noreferrer">@pw_mcgovern</a>
              <a href="https://linkedin.com/in/pwmcgovern" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="last-updated">Last updated: Jan 13, 2026</div>
          <div className="data-source">Sacra, PitchBook, Tracxn, CB Insights</div>
        </div>
      </header>

      <div className="chart-layout">
        {/* Sidebar */}
        <aside className="chart-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">FILTERS</h3>
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">SECTORS</label>
            <select
              className="sidebar-select"
              value={selectedCategories.length === categories.length ? 'all' : selectedCategories[0] || 'all'}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setSelectedCategories(categories.map(c => c.id));
                } else {
                  setSelectedCategories([e.target.value]);
                }
              }}
            >
              <option value="all">All Sectors</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">SORT BY</label>
            <select
              className="sidebar-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="arrPerEmployee">ARR/Employee</option>
              <option value="arr">Total ARR</option>
              <option value="headcount">Headcount</option>
              <option value="valuation">Valuation</option>
            </select>
          </div>

          <div className="sidebar-section">
            <label className="sidebar-label">EFFICIENCY</label>
            <div className="sidebar-legend">
              <span className="legend-item"><span className="legend-dot" style={{ background: '#16a34a' }} /> $300K+</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#d97706' }} /> $200-300K</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#6b7280' }} /> &lt;$200K</span>
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-count">{filteredCompanies.length} companies</div>
            <div className="sidebar-attribution">logos by <a href="https://logo.dev" target="_blank" rel="noopener noreferrer">logo.dev</a></div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="chart-main">
          <div className="metrics-row">
            <div className="metric">
              <div className="metric-label">Total ARR</div>
              <div className="metric-value green">{formatARR(filteredARR)}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Total Headcount</div>
              <div className="metric-value">{filteredHeadcount.toLocaleString()}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Avg ARR/Employee</div>
              <div className="metric-value amber">${filteredAvgARRPerEmployee}K</div>
            </div>
            <div className="metric">
              <div className="metric-label">Companies</div>
              <div className="metric-value">{filteredCompanies.length}</div>
            </div>
          </div>

          <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '280px' }}>Company</th>
              <th>Vertical</th>
              <th
                className={`numeric ${sortKey === 'headcount' ? 'sorted' : ''}`}
                onClick={() => setSortKey('headcount')}
              >
                Headcount
              </th>
              <th
                className={`numeric ${sortKey === 'arr' ? 'sorted' : ''}`}
                onClick={() => setSortKey('arr')}
              >
                ARR
              </th>
              <th
                className={`numeric ${sortKey === 'arrPerEmployee' ? 'sorted' : ''}`}
                onClick={() => setSortKey('arrPerEmployee')}
              >
                ARR/Emp
              </th>
              <th
                className={`numeric ${sortKey === 'valuation' ? 'sorted' : ''}`}
                onClick={() => setSortKey('valuation')}
              >
                Valuation
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company, index) => (
              <tr key={company.name}>
                <td>
                  <div className="company-cell">
                    <span className="company-rank">{index + 1}</span>
                    <CompanyLogo domain={company.domain} name={company.name} />
                    <div className="company-info">
                      <span className="company-name">{company.name}</span>
                      <span className="company-domain">{company.domain}</span>
                      <span className="company-source">{company.source}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`category-tag ${company.category}`}>
                    {company.category}
                  </span>
                </td>
                <td className="numeric-cell">
                  {company.headcount.toLocaleString()}
                </td>
                <td className="numeric-cell arr-cell">
                  {formatARR(company.arr || 0)}
                </td>
                <td>
                  <div className="efficiency-cell">
                    <span
                      className="efficiency-value"
                      style={{ color: getEfficiencyColor(company.arrPerEmployee || 0) }}
                    >
                      {formatARRPerEmployee(company.arrPerEmployee || 0)}
                    </span>
                    <div className="efficiency-bar">
                      <div
                        className="efficiency-fill"
                        style={{
                          width: `${((company.arrPerEmployee || 0) / maxEfficiency) * 100}%`,
                          background: getEfficiencyColor(company.arrPerEmployee || 0)
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="numeric-cell valuation-cell">
                  {company.valuation ? `$${company.valuation}B` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>

          <footer className="footer">
            <div className="footer-left">
              Data compiled from public sources. ARR figures are estimates.
            </div>
            <div className="footer-right">
              <div className="footer-stat">
                <div className="footer-stat-label">Top Performer</div>
                <div className="footer-stat-value">
                  {filteredCompanies[0]?.name} @ {formatARRPerEmployee(filteredCompanies[0]?.arrPerEmployee || 0)}
                </div>
              </div>
              <div className="footer-stat">
                <div className="footer-stat-label">Median</div>
                <div className="footer-stat-value">
                  {formatARRPerEmployee(Math.round(filteredCompanies[Math.floor(filteredCompanies.length / 2)]?.arrPerEmployee || 0))}
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
