import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { companies, categories, type Company } from '../data/companies';
import { ScatterChart } from './ScatterChart';

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
  const millions = Math.round(valuationInBillions * 1000);
  return `$${millions}M`;
}

function getEfficiencyColor(value: number): string {
  if (value >= 300) return '#22c55e';
  if (value >= 200) return '#f59e0b';
  return '#71717a';
}

function getFundingStage(lastFunding: string): string {
  if (/public|ipo|nasdaq|nyse/i.test(lastFunding)) return 'Public';
  if (/acquired/i.test(lastFunding)) return 'Acquired';
  if (/seed/i.test(lastFunding)) return 'Seed';
  const seriesMatch = lastFunding.match(/Series\s+([A-Z])/i);
  if (seriesMatch) {
    const letter = seriesMatch[1].toUpperCase();
    if (letter <= 'B') return `Series A-B`;
    return `Series C+`;
  }
  return 'Other';
}

function getRevenueMultiple(company: Company): string | null {
  if (!company.valuation || !company.arr) return null;
  const multiple = company.valuation * 1000 / company.arr;
  return `${multiple.toFixed(1)}x`;
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

function Tooltip({ text }: { text: string }) {
  return (
    <span className="info-tooltip">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
      <span className="info-tooltip-text">{text}</span>
    </span>
  );
}

function getCompanySlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

type SortOption = 'arrPerEmployee' | 'arr' | 'headcount' | 'revenueMultiple';
type ViewMode = 'ranking' | 'scatter';
type StageFilter = 'all' | 'Seed' | 'Series A-B' | 'Series C+' | 'Public';

export function EfficiencyChart({ defaultView = 'ranking' }: { defaultView?: ViewMode }) {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categories.map(c => c.id)
  );
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('arrPerEmployee');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [locationFilter, setLocationFilter] = useState<'all' | 'ny' | 'sf'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('vv-dark-mode');
    if (saved !== null) return saved === 'true';
    return true;
  });
  const [foundedFilter, setFoundedFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('vv-dark-mode', String(darkMode));
  }, [darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        setExpandedCompany(null);
        setShowSubmitModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredCompanies = useMemo(() => {
    let filtered = companies.filter(c => selectedCategories.includes(c.category));

    // Filter by location
    if (locationFilter === 'ny') {
      filtered = filtered.filter(c => c.headquarters.includes('New York'));
    } else if (locationFilter === 'sf') {
      filtered = filtered.filter(c => c.headquarters.includes('San Francisco'));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.domain.toLowerCase().includes(query)
      );
    }

    // Filter by founded year
    if (foundedFilter !== 'all') {
      const year = parseInt(foundedFilter);
      filtered = filtered.filter(c => c.founded >= year);
    }

    // Filter by funding stage
    if (stageFilter !== 'all') {
      filtered = filtered.filter(c => getFundingStage(c.lastFunding) === stageFilter);
    }

    // For ARR-based sorts, only include companies with ARR data
    if (sortBy === 'arr' || sortBy === 'arrPerEmployee' || sortBy === 'revenueMultiple') {
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
        case 'revenueMultiple': {
          const aMultiple = (a.valuation && a.arr) ? a.valuation * 1000 / a.arr : 0;
          const bMultiple = (b.valuation && b.arr) ? b.valuation * 1000 / b.arr : 0;
          return bMultiple - aMultiple;
        }
        default:
          return 0;
      }
    });
  }, [selectedCategories, sortBy, searchQuery, locationFilter, foundedFilter, stageFilter]);

  const maxValue = useMemo(() => {
    switch (sortBy) {
      case 'headcount':
        return Math.max(...filteredCompanies.map(c => c.headcount));
      case 'arr':
        return Math.max(...filteredCompanies.map(c => c.arr || 0));
      case 'arrPerEmployee':
        return Math.max(...filteredCompanies.map(c => c.arrPerEmployee || 0));
      case 'revenueMultiple':
        return Math.max(...filteredCompanies.map(c =>
          (c.valuation && c.arr) ? c.valuation * 1000 / c.arr : 0
        ));
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
      case 'revenueMultiple':
        return (company.valuation && company.arr) ? company.valuation * 1000 / company.arr : 0;
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
      case 'revenueMultiple':
        return getRevenueMultiple(company) || '—';
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

  // Top 10 companies by ARR/Employee for leaderboard (based on filtered companies)
  const topCompanies = useMemo(() => {
    return [...filteredCompanies]
      .filter(c => c.arr !== null)
      .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0))
      .slice(0, 10);
  }, [filteredCompanies]);

  // Recent raises (last 6 months) - parse lastFunding field
  const recentRaises = useMemo(() => {
    const monthOrder: Record<string, number> = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };

    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const cutoffYear = cutoff.getFullYear();
    const cutoffMonth = cutoff.getMonth() + 1;

    return companies
      .map(c => {
        const match = c.lastFunding.match(/\((\w{3})\s+(\d{4})\)/);
        if (!match) return null;

        const [, month, year] = match;
        const yearNum = parseInt(year);
        const monthNum = monthOrder[month] || 0;

        if (yearNum < cutoffYear) return null;
        if (yearNum === cutoffYear && monthNum < cutoffMonth) return null;

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
      .sort((a, b) => b.sortKey - a.sortKey);
  }, []);

  const toggleExpand = (companyName: string) => {
    setExpandedCompany(prev => prev === companyName ? null : companyName);
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.length === 1 && selectedCategories[0] === categoryId) {
      setSelectedCategories(categories.map(c => c.id));
    } else {
      setSelectedCategories([categoryId]);
    }
  };

  const selectAll = () => {
    setSelectedCategories(categories.map(c => c.id));
  };

  // CSV Export
  const exportCSV = useCallback(() => {
    const headers = ['Rank', 'Company', 'Domain', 'Category', 'ARR ($M)', 'Headcount', 'ARR/Employee ($K)', 'Valuation ($B)', 'Rev Multiple', 'Founded', 'HQ', 'Stage', 'Last Funding', 'Founders'];
    const rows = filteredCompanies.map((c, i) => [
      i + 1,
      c.name,
      c.domain,
      categories.find(cat => cat.id === c.category)?.name || c.category,
      c.arr || '',
      c.headcount,
      c.arrPerEmployee || '',
      c.valuation || '',
      (c.valuation && c.arr) ? (c.valuation * 1000 / c.arr).toFixed(1) : '',
      c.founded,
      c.headquarters,
      getFundingStage(c.lastFunding),
      c.lastFunding,
      c.founders.join('; '),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const str = String(cell);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vertical-velocity-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredCompanies]);

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
              <button
                className="random-btn-header"
                onClick={() => {
                  const pool = companies.filter(c => c.arr !== null);
                  const random = pool[Math.floor(Math.random() * pool.length)];
                  navigate(`/company/${getCompanySlug(random.name)}`);
                }}
              >
                Discover a Company
              </button>
            </div>
          </div>
          <div className="chart-header-right">
            <button
              className="header-icon-btn"
              onClick={() => setDarkMode(prev => !prev)}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {darkMode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
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
        <div className="last-updated">Last updated: Mar 17, 2026</div>
      </header>

      {/* View Toggle */}
      <div className="view-toggle-row">
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'ranking' ? 'active' : ''}`}
            onClick={() => setViewMode('ranking')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Rankings
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'scatter' ? 'active' : ''}`}
            onClick={() => setViewMode('scatter')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7.5" cy="7.5" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="11" cy="16" r="2"/><circle cx="17" cy="14" r="2"/><circle cx="5" cy="13" r="2"/>
            </svg>
            Scatter Plot
          </button>
        </div>
        <button className="export-btn" onClick={exportCSV} title="Export filtered data as CSV">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      {viewMode === 'scatter' ? (
        <ScatterChart />
      ) : (
        <>
          {/* Category buttons */}
          <div className="category-buttons-wrapper">
            <div className="category-buttons-row">
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
            <div className="location-buttons">
              <button
                className={`category-btn location-btn ${locationFilter === 'all' ? 'active' : ''}`}
                onClick={() => setLocationFilter('all')}
              >
                <span className="category-btn-label">All Locations</span>
              </button>
              <button
                className={`category-btn location-btn ${locationFilter === 'ny' ? 'active' : ''}`}
                onClick={() => setLocationFilter('ny')}
              >
                <span className="category-btn-label">NYC</span>
              </button>
              <button
                className={`category-btn location-btn ${locationFilter === 'sf' ? 'active' : ''}`}
                onClick={() => setLocationFilter('sf')}
              >
                <span className="category-btn-label">SF</span>
              </button>
            </div>
          </div>

          {/* Stats Row - Filters, Stats, Top Performers all flush */}
          <div className="chart-stats">
            {/* Filters */}
            <div className="filters-box">
              <div className="filters-box-header">
                <span className="filters-title">Filters</span>
                <span className="keyboard-hint" title="Press / to focus search">/</span>
              </div>
              <div className="filters-box-content">
                <input
                  ref={searchRef}
                  type="text"
                  className="filters-search"
                  placeholder="Search... (press /)"
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
                  <option value="revenueMultiple">Rev Multiple</option>
                </select>
                <div className="filters-row-extra">
                  <select
                    className="filters-select"
                    value={foundedFilter}
                    onChange={(e) => setFoundedFilter(e.target.value)}
                  >
                    <option value="all">All Years</option>
                    <option value="2023">2023+</option>
                    <option value="2020">2020+</option>
                    <option value="2015">2015+</option>
                    <option value="2010">2010+</option>
                  </select>
                  <select
                    className="filters-select"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value as StageFilter)}
                  >
                    <option value="all">All Stages</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A-B">Series A-B</option>
                    <option value="Series C+">Series C+</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-right">
              <div className="chart-stat">
                <span className="chart-stat-value green">{formatARR(filteredARR)}</span>
                <span className="chart-stat-label">
                  Total ARR
                  <Tooltip text="Annual Recurring Revenue - the yearly revenue from subscriptions" />
                </span>
              </div>
              <div className="chart-stat">
                <span className="chart-stat-value blue">{filteredCompanies.length}</span>
                <span className="chart-stat-label">Companies</span>
              </div>
              <div className="chart-stat">
                <span className="chart-stat-value amber">{formatARRPerEmployee(filteredAvgARRPerEmployee)}</span>
                <span className="chart-stat-label">
                  Avg ARR/Emp
                  <Tooltip text="Average Annual Revenue per employee - a measure of company efficiency" />
                </span>
              </div>
            </div>

            {/* Recent Raises */}
            <div className="recent-raises">
              <div className="recent-raises-header">
                <span className="recent-raises-title">Recent Raises</span>
              </div>
              <div className="recent-raises-ticker">
                <div className="recent-raises-ticker-track">
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
                <span className="hot-title">Top Performers (ARR/FTE)</span>
              </div>
              <div className="hot-companies-ticker">
                <div className="hot-companies-ticker-track">
                  {[...topCompanies, ...topCompanies].map((company, i) => (
                    <div key={`${company.name}-${i}`} className="hot-company-row">
                      <span className="hot-company-rank">#{(i % topCompanies.length) + 1}</span>
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
                        setFoundedFilter('all');
                        setStageFilter('all');
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
                    const slug = getCompanySlug(company.name);
                    return (
                      <motion.div
                        key={company.name}
                        className={`company-card ${isExpanded ? 'expanded' : ''}${index < 3 ? ` rank-${index + 1}` : ''}${index < 10 ? ' top-10' : ''}`}
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
                            <span className={`company-card-rank${index < 10 ? ' rank-badge' : ''}`}>{index + 1}</span>
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
                                background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
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
                                  <span className="company-detail-label">
                                    ARR/Employee
                                    <Tooltip text="Annual Recurring Revenue divided by number of employees" />
                                  </span>
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
                                  <span className="company-detail-label">
                                    Rev Multiple
                                    <Tooltip text="Valuation divided by ARR — shows how the market prices this company relative to its revenue" />
                                  </span>
                                  <span className="company-detail-value">{getRevenueMultiple(company) || '—'}</span>
                                </div>
                                <div className="company-detail">
                                  <span className="company-detail-label">Founded</span>
                                  <span className="company-detail-value">{company.founded}</span>
                                </div>
                                <div className="company-detail">
                                  <span className="company-detail-label">HQ</span>
                                  <span className="company-detail-value">{company.headquarters}</span>
                                </div>
                                <div className="company-detail">
                                  <span className="company-detail-label">Stage</span>
                                  <span className="company-detail-value">{getFundingStage(company.lastFunding)}</span>
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
                                      const url = encodeURIComponent(`${window.location.origin}/company/${slug}`);
                                      const text = encodeURIComponent(tweetText);
                                      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
                                    }}
                                  >
                                    Share on X
                                  </button>
                                  <button
                                    className="view-profile-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/company/${slug}`);
                                    }}
                                  >
                                    View Profile →
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
                <span>Disclaimer: Revenue figures sourced from public mentions in tech press (TechCrunch, Forbes, Bloomberg, etc.), research firms (Sacra, CB Insights), SEC filings, and press releases. Headcount cross-referenced against LinkedIn and media reports. Companies where we couldn't find sufficient data to calculate ARR/FTE were not included. These numbers are for illustrative purposes only—treat them as directional estimates, not audited financials. To update company data, use the Submit Company button above.</span>
                <div className="chart-footer-shortcuts">
                  <span className="shortcut-hint"><kbd>/</kbd> Search</span>
                  <span className="shortcut-hint"><kbd>Esc</kbd> Close</span>
                </div>
              </footer>
            </div>
          </div>
        </>
      )}

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
