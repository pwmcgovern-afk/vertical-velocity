import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { companies, categories, type Company } from '../data/companies';

function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

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

function formatValuation(valuationInBillions: number): string {
  if (valuationInBillions >= 1) {
    return `$${valuationInBillions}B`;
  }
  // Convert to millions (e.g., 0.2B = 200M)
  const millions = Math.round(valuationInBillions * 1000);
  return `$${millions}M`;
}

function getEfficiencyColor(value: number): string {
  if (value >= 300) return '#22c55e';
  if (value >= 200) return '#f59e0b';
  return '#71717a';
}

function CompanyLogo({ domain, name, color }: { domain: string; name: string; color: string }) {
  const [error, setError] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (error) {
    return (
      <div className="company-logo fallback" style={{ background: `${color}30`, color }}>
        {initials}
      </div>
    );
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

type SortOption = 'arrPerEmployee' | 'arr' | 'headcount';

// Removed emoji icons for cleaner professional look

export function EfficiencyChart() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categories.map(c => c.id)
  );
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('arrPerEmployee');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const filteredCompanies = useMemo(() => {
    let filtered = companies.filter(c => selectedCategories.includes(c.category));

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.domain.toLowerCase().includes(query)
      );
    }

    // For ARR-based sorts, only include companies with ARR data
    if (sortBy === 'arr' || sortBy === 'arrPerEmployee') {
      filtered = filtered.filter(c => c.arr !== null);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'headcount':
          return b.headcount - a.headcount;
        case 'arr':
          return (b.arr || 0) - (a.arr || 0);
        case 'arrPerEmployee':
          return (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0);
        default:
          return 0;
      }
    });
  }, [selectedCategories, sortBy, searchQuery]);

  const maxValue = useMemo(() => {
    switch (sortBy) {
      case 'headcount':
        return Math.max(...filteredCompanies.map(c => c.headcount));
      case 'arr':
        return Math.max(...filteredCompanies.map(c => c.arr || 0));
      case 'arrPerEmployee':
        return Math.max(...filteredCompanies.map(c => c.arrPerEmployee || 0));
      default:
        return 1;
    }
  }, [filteredCompanies, sortBy]);

  const getBarValue = (company: Company): number => {
    switch (sortBy) {
      case 'headcount':
        return company.headcount;
      case 'arr':
        return company.arr || 0;
      case 'arrPerEmployee':
        return company.arrPerEmployee || 0;
      default:
        return 0;
    }
  };

  const formatBarValue = (company: Company): string => {
    switch (sortBy) {
      case 'headcount':
        return formatNumber(company.headcount);
      case 'arr':
        return formatARR(company.arr || 0);
      case 'arrPerEmployee':
        return formatARRPerEmployee(company.arrPerEmployee || 0);
      default:
        return '';
    }
  };

  const getBarColor = (company: Company): string => {
    if (sortBy === 'arrPerEmployee') {
      return getEfficiencyColor(company.arrPerEmployee || 0);
    }
    return company.color;
  };

  // Dynamic metrics
  const filteredARR = useMemo(() =>
    filteredCompanies.reduce((sum, c) => sum + (c.arr || 0), 0),
    [filteredCompanies]
  );

  const filteredAvgARRPerEmployee = useMemo(() => {
    const companiesWithARR = filteredCompanies.filter(c => c.arr !== null);
    if (companiesWithARR.length === 0) return 0;
    return Math.round(companiesWithARR.reduce((sum, c) => sum + (c.arrPerEmployee || 0), 0) / companiesWithARR.length);
  }, [filteredCompanies]);

  // Top 3 companies by ARR/Employee for leaderboard (based on filtered companies)
  const topCompanies = useMemo(() => {
    return [...filteredCompanies]
      .filter(c => c.arr !== null)
      .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0))
      .slice(0, 3);
  }, [filteredCompanies]);

  // Recent raises (last 6 months) - parse lastFunding field
  const recentRaises = useMemo(() => {
    const monthOrder: Record<string, number> = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };

    // Current date is Jan 2026, so last 6 months = Aug 2025 - Jan 2026
    const cutoffYear = 2025;
    const cutoffMonth = 7; // July 2025 and later

    return companies
      .map(c => {
        // Parse formats like "$300M Series E (Jun 2025)" or "IPO $923M (Oct 2025)"
        const match = c.lastFunding.match(/\((\w{3})\s+(\d{4})\)/);
        if (!match) return null;

        const [, month, year] = match;
        const yearNum = parseInt(year);
        const monthNum = monthOrder[month] || 0;

        // Filter to last 6 months (Jul 2025 onwards)
        if (yearNum < cutoffYear) return null;
        if (yearNum === cutoffYear && monthNum < cutoffMonth) return null;

        // Extract the round info (everything before the parentheses)
        const roundInfo = c.lastFunding.replace(/\s*\([^)]+\)/, '').trim();

        return {
          name: c.name,
          category: c.category,
          round: roundInfo,
          month,
          year,
          dateDisplay: `${month}. ${year}`,
          sortKey: yearNum * 100 + monthNum
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.sortKey - a.sortKey); // Most recent first
  }, []);

  const toggleExpand = (companyName: string) => {
    setExpandedCompany(prev => prev === companyName ? null : companyName);
  };

  const toggleCategory = (categoryId: string) => {
    // Switch to just this category (or back to all if already selected alone)
    if (selectedCategories.length === 1 && selectedCategories[0] === categoryId) {
      // If only this one is selected, select all
      setSelectedCategories(categories.map(c => c.id));
    } else {
      // Switch to just this category
      setSelectedCategories([categoryId]);
    }
  };

  const selectAll = () => {
    setSelectedCategories(categories.map(c => c.id));
  };

  return (
    <div className="efficiency-chart">
      <header className="chart-header">
        <div className="chart-header-top">
          <div className="chart-header-left">
            <div className="title-container">
              <h1>VERTICAL VELOCITY</h1>
            </div>
            <p className="chart-subtitle">
              A curated ranking of vertical AI companies by efficiency.
            </p>
            <div className="header-buttons-left">
              <a href="https://twitter.com/pw_mcgovern" target="_blank" rel="noopener noreferrer" className="made-by-btn">
                Made by <span>Pat McGovern</span>
              </a>
              <button
                className="submit-btn-header"
                onClick={() => setShowSubmitModal(true)}
              >
                + Submit Company
              </button>
            </div>
          </div>
          <div className="chart-header-right">
            <button
              className="header-icon-btn"
              onClick={() => {
                const topCompany = topCompanies[0];
                const tweetText = topCompany
                  ? `${topCompany.name} is doing $${topCompany.arrPerEmployee ? (topCompany.arrPerEmployee >= 1000 ? (topCompany.arrPerEmployee / 1000).toFixed(1) + 'M' : topCompany.arrPerEmployee + 'K') : '?'} ARR per employee\n\nSee ${companies.length}+ vertical AI companies ranked by efficiency:\n\nvia @pw_mcgovern`
                  : `Check out the Vertical Velocity dashboard - ${companies.length}+ vertical AI companies ranked by ARR per employee\n\nvia @pw_mcgovern`;
                const url = encodeURIComponent(window.location.href);
                const text = encodeURIComponent(tweetText);
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
              }}
              aria-label="Share on X"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <div className="header-nav-pills">
              <a href="mailto:patrick.mcgovern@bowerycap.com" className="nav-pill">Contact</a>
              <a href="https://capitalefficient.substack.com" target="_blank" rel="noopener noreferrer" className="nav-pill">Substack</a>
              <a href="https://linkedin.com/in/pwmcgovern" target="_blank" rel="noopener noreferrer" className="nav-pill">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="last-updated">Last updated: Jan 13, 2026</div>
      </header>

      {/* Category buttons */}
      <div className="category-buttons-wrapper">
        <button
          className={`category-btn all-btn ${selectedCategories.length === categories.length ? 'active' : ''}`}
          onClick={selectAll}
        >
          <span className="category-btn-label">All Sectors</span>
        </button>
        <div className="category-buttons">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategories.includes(cat.id) && selectedCategories.length !== categories.length ? 'active' : ''}`}
              onClick={() => toggleCategory(cat.id)}
            >
              <span className="category-btn-label">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row - Filters, Stats, Top Performers all flush */}
      <div className="chart-stats">
        {/* Filters */}
        <div className="filters-box">
          <div className="filters-box-header">
            <span className="filters-title">Filters</span>
          </div>
          <div className="filters-box-content">
            <input
              type="text"
              className="filters-search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="filters-select"
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
            <select
              className="filters-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="arrPerEmployee">ARR/Employee</option>
              <option value="arr">Total ARR</option>
              <option value="headcount">Headcount</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-right">
          <div className="chart-stat">
            <span className="chart-stat-value green">{formatARR(filteredARR)}</span>
            <span className="chart-stat-label">Total ARR</span>
          </div>
          <div className="chart-stat">
            <span className="chart-stat-value blue">{filteredCompanies.length}</span>
            <span className="chart-stat-label">Companies</span>
          </div>
          <div className="chart-stat">
            <span className="chart-stat-value amber">{formatARRPerEmployee(filteredAvgARRPerEmployee)}</span>
            <span className="chart-stat-label">Avg ARR/Emp</span>
          </div>
        </div>

        {/* Recent Raises */}
        <div className="recent-raises">
          <div className="recent-raises-header">
            <span className="recent-raises-title">Recent Raises</span>
          </div>
          <div className="recent-raises-ticker">
            <div className="recent-raises-ticker-track">
              {/* Duplicate the list for seamless looping */}
              {[...recentRaises, ...recentRaises].map((raise, i) => (
                <div key={`${raise.name}-${i}`} className="recent-raise-row">
                  <div className="recent-raise-info">
                    <span className="recent-raise-name">{raise.name}</span>
                    <span className="recent-raise-round">{raise.round}</span>
                  </div>
                  <span className="recent-raise-date">{raise.dateDisplay}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="hot-companies">
          <div className="hot-companies-header">
            <span className="hot-title">Top Performers</span>
          </div>
          <div className="hot-companies-list">
            {topCompanies.map((company) => (
              <div key={company.name} className="hot-company-row">
                <div className="hot-company-info">
                  <span className="hot-company-name">{company.name}</span>
                  <span className="hot-company-category">
                    {categories.find(c => c.id === company.category)?.name}
                  </span>
                </div>
                <span className="hot-company-arr">{formatARRPerEmployee(company.arrPerEmployee || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-layout">
        {/* Main Content */}
        <div className="chart-main">
          {/* Chart */}
          <div className="companies-list">
            {filteredCompanies.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <h3 className="empty-state-title">No companies found</h3>
                <p className="empty-state-text">
                  {searchQuery.trim()
                    ? `No results for "${searchQuery}". Try a different search term.`
                    : 'No companies match your current filters.'}
                </p>
                <button
                  className="empty-state-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategories(categories.map(c => c.id));
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
            <AnimatePresence mode="popLayout">
              {filteredCompanies.map((company, index) => {
                const barColor = getBarColor(company);
                const isExpanded = expandedCompany === company.name;
                return (
                  <motion.div
                    key={company.name}
                    className={`company-card ${isExpanded ? 'expanded' : ''}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      layout: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                  >
                    <div
                      className="company-card-header"
                      onClick={() => toggleExpand(company.name)}
                    >
                      <div className="company-card-left">
                        <span className="company-card-rank">{index + 1}</span>
                        <CompanyLogo domain={company.domain} name={company.name} color={barColor} />
                        <div className="company-card-info">
                          <span className="company-card-name">{company.name}</span>
                          <span className="company-card-category">{categories.find(c => c.id === company.category)?.name}</span>
                        </div>
                      </div>

                      <div className="company-card-bar">
                        <motion.div
                          className="company-card-bar-fill"
                          style={{
                            background: barColor,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(getBarValue(company) / maxValue) * 100}%` }}
                          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        />
                      </div>

                      <div className="company-card-right">
                        <span className="company-card-value" style={{ color: barColor }}>
                          {formatBarValue(company)}
                        </span>
                        <span className={`company-card-expand ${isExpanded ? 'expanded' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="company-card-details"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="company-details-grid">
                            <div className="company-detail">
                              <span className="company-detail-label">ARR/Employee</span>
                              <span className="company-detail-value" style={{ color: barColor }}>
                                {formatARRPerEmployee(company.arrPerEmployee || 0)}
                              </span>
                            </div>
                            <div className="company-detail">
                              <span className="company-detail-label">Total ARR</span>
                              <span className="company-detail-value">{formatARR(company.arr || 0)}</span>
                            </div>
                            <div className="company-detail">
                              <span className="company-detail-label">Employees</span>
                              <span className="company-detail-value">{company.headcount.toLocaleString()}</span>
                            </div>
                            <div className="company-detail">
                              <span className="company-detail-label">Valuation</span>
                              <span className="company-detail-value">{company.valuation ? formatValuation(company.valuation) : '—'}</span>
                            </div>
                            <div className="company-detail">
                              <span className="company-detail-label">Founded</span>
                              <span className="company-detail-value">{company.founded}</span>
                            </div>
                            <div className="company-detail">
                              <span className="company-detail-label">Last Funding</span>
                              <span className="company-detail-value">{company.lastFunding}</span>
                            </div>
                          </div>
                          <div className="company-details-row">
                            <div className="company-detail-founders">
                              <span className="company-detail-label">Founders</span>
                              <span className="company-detail-value">{company.founders.join(', ')}</span>
                            </div>
                            <div className="company-actions">
                              <button
                                className="company-share-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const arrPerEmp = company.arrPerEmployee
                                    ? (company.arrPerEmployee >= 1000 ? `$${(company.arrPerEmployee / 1000).toFixed(1)}M` : `$${company.arrPerEmployee}K`)
                                    : 'N/A';
                                  const tweetText = `${company.name} is doing ${arrPerEmp} ARR per employee\n\nSee how they rank against ${companies.length}+ vertical AI companies:\n\nvia @pw_mcgovern`;
                                  const url = encodeURIComponent(window.location.href);
                                  const text = encodeURIComponent(tweetText);
                                  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
                                }}
                              >
                                Share on X
                              </button>
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="company-website-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Visit Website →
                              </a>
                            </div>
                          </div>
                          <div className="company-detail-source">
                            Source: {company.source}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            )}
          </div>

          <footer className="chart-footer">
            <div className="chart-footer-top">
              <span className="footer-count">{filteredCompanies.length} companies</span>
              <div className="footer-legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: '#16a34a' }} /> $300K+</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#ca8a04' }} /> $200-300K</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#71717a' }} /> &lt;$200K</span>
              </div>
              <span className="footer-attribution">logos by <a href="https://logo.dev" target="_blank" rel="noopener noreferrer">logo.dev</a></span>
            </div>
            <span>Methodology: Revenue figures sourced from public mentions in tech press (TechCrunch, Forbes, Bloomberg, etc.), research firms (Sacra, CB Insights), SEC filings, and press releases. Headcount cross-referenced against LinkedIn and media reports. These numbers are for illustrative purposes only—treat them as directional estimates, not audited financials. To update company data, use the Submit Company button above.</span>
          </footer>
        </div>
      </div>

      {/* Submit Company Modal */}
      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSubmitModal(false)}>×</button>
            <h2 className="modal-title">Submit Your Company</h2>
            <p className="modal-subtitle">
              Add your vertical AI company to the Vertical Velocity dashboard. We'll review and add qualifying companies within 48 hours.
            </p>

            <form
              className="submit-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const subject = encodeURIComponent('Vertical Velocity - New Company Submission');
                const body = encodeURIComponent(
                  `Company Name: ${formData.get('companyName')}\n` +
                  `Website: ${formData.get('website')}\n` +
                  `Sector: ${formData.get('sector')}\n` +
                  `Headcount: ${formData.get('headcount')}\n` +
                  `ARR (if comfortable sharing): ${formData.get('arr')}\n` +
                  `Last Funding Round: ${formData.get('funding')}\n` +
                  `Founded Year: ${formData.get('founded')}\n` +
                  `Founders: ${formData.get('founders')}\n` +
                  `Your Email: ${formData.get('email')}\n` +
                  `Additional Notes: ${formData.get('notes')}`
                );
                window.location.href = `mailto:patrick.mcgovern@bowerycap.com?subject=${subject}&body=${body}`;
                setShowSubmitModal(false);
              }}
            >
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input type="text" name="companyName" required placeholder="e.g., Acme AI" />
                </div>
                <div className="form-group">
                  <label>Website *</label>
                  <input type="url" name="website" required placeholder="https://acme.ai" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sector *</label>
                  <select name="sector" required>
                    <option value="">Select a sector</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Founded Year *</label>
                  <input type="number" name="founded" required placeholder="2023" min="1990" max="2026" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Headcount *</label>
                  <input type="number" name="headcount" required placeholder="50" min="1" />
                </div>
                <div className="form-group">
                  <label>ARR ($M) - Optional</label>
                  <input type="number" name="arr" placeholder="10" min="0" step="0.1" />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Founders *</label>
                <input type="text" name="founders" required placeholder="Jane Doe, John Smith" />
              </div>

              <div className="form-group full-width">
                <label>Last Funding Round</label>
                <input type="text" name="funding" placeholder="$20M Series A (Jan 2025)" />
              </div>

              <div className="form-group full-width">
                <label>Your Email *</label>
                <input type="email" name="email" required placeholder="founder@acme.ai" />
              </div>

              <div className="form-group full-width">
                <label>Additional Notes</label>
                <textarea name="notes" placeholder="Any additional context about your company..." rows={3} />
              </div>

              <button type="submit" className="submit-btn">Submit for Review</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
