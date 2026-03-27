import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { track } from '@vercel/analytics';
import { companies, categories, getCompanySlug, type Company } from '../data/companies';
import { CompanyLogo } from './CompanyLogo';
import { ScatterChart } from './ScatterChart';
import {
  formatNumber, formatARR, formatARRPerEmployee, formatValuation,
  getEfficiencyColor, getFundingStage, getRevenueMultiple, DATA_LAST_UPDATED,
} from '../utils';

function useAnimatedValue(targetValue: number, duration = 400): number {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const prevValue = useRef(targetValue);

  useEffect(() => {
    if (prevValue.current === targetValue) return;
    const startValue = prevValue.current;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(startValue + (targetValue - startValue) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = targetValue;
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = targetValue;
  }, [targetValue, duration]);

  return displayValue;
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

type SortOption = 'arrPerEmployee' | 'arr' | 'headcount' | 'revenueMultiple';
type ViewMode = 'ranking' | 'scatter';
type StageFilter = 'all' | 'Seed' | 'Series A-B' | 'Series C+' | 'Public';

const LOCATION_OPTIONS = [
  { value: 'all', label: 'All Locations' },
  { value: 'ny', label: 'NYC', match: 'New York' },
  { value: 'sf', label: 'SF', match: 'San Francisco' },
  { value: 'boston', label: 'Boston', match: 'Boston' },
  { value: 'la', label: 'LA', match: 'Los Angeles' },
  { value: 'austin', label: 'Austin', match: 'Austin' },
  { value: 'seattle', label: 'Seattle', match: 'Seattle' },
  { value: 'chicago', label: 'Chicago', match: 'Chicago' },
  { value: 'dc', label: 'DC', match: 'Washington' },
  { value: 'denver', label: 'Denver', match: 'Denver' },
] as const;

type LocationFilter = typeof LOCATION_OPTIONS[number]['value'];

export function EfficiencyChart({ defaultView = 'ranking', defaultCategory }: { defaultView?: ViewMode; defaultCategory?: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  // Initialize state from URL params
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const cat = searchParams.get('category');
    if (defaultCategory) return [defaultCategory];
    if (cat) return cat.split(',').filter(c => categories.some(x => x.id === c));
    return categories.map(c => c.id);
  });
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(() =>
    (searchParams.get('sort') as SortOption) || 'arrPerEmployee'
  );
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>(() =>
    (searchParams.get('location') as LocationFilter) || 'all'
  );
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('vv-dark-mode');
    if (saved !== null) return saved === 'true';
    return false;
  });
  const [foundedFilter, setFoundedFilter] = useState<string>(() =>
    searchParams.get('founded') || 'all'
  );
  const [stageFilter, setStageFilter] = useState<StageFilter>(() =>
    (searchParams.get('stage') as StageFilter) || 'all'
  );
  const [compareList, setCompareList] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [showFilters, setShowFilters] = useState(false);

  // Auto-open submit modal from URL param
  useEffect(() => {
    if (searchParams.get('submit') === '1') {
      setShowSubmitModal(true);
      const params = new URLSearchParams(searchParams);
      params.delete('submit');
      setSearchParams(params, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync filters to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCategories.length !== categories.length && !defaultCategory) {
      params.set('category', selectedCategories.join(','));
    }
    if (sortBy !== 'arrPerEmployee') params.set('sort', sortBy);
    if (locationFilter !== 'all') params.set('location', locationFilter);
    if (foundedFilter !== 'all') params.set('founded', foundedFilter);
    if (stageFilter !== 'all') params.set('stage', stageFilter);

    const newSearch = params.toString();
    const currentSearch = searchParams.toString();
    if (newSearch !== currentSearch) {
      setSearchParams(params, { replace: true });
    }
  }, [searchQuery, selectedCategories, sortBy, locationFilter, foundedFilter, stageFilter, defaultCategory, searchParams, setSearchParams]);

  const toggleCompare = (companyName: string) => {
    setCompareList(prev =>
      prev.includes(companyName)
        ? prev.filter(n => n !== companyName)
        : prev.length < 3 ? [...prev, companyName] : prev
    );
  };

  const hasActiveFilters = searchQuery.trim() !== '' ||
    selectedCategories.length !== categories.length ||
    locationFilter !== 'all' ||
    foundedFilter !== 'all' ||
    stageFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories(categories.map(c => c.id));
    setLocationFilter('all');
    setFoundedFilter('all');
    setStageFilter('all');
  };

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('vv-dark-mode', String(darkMode));
  }, [darkMode]);

  // Reset focused index when filters change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [selectedCategories, sortBy, searchQuery, locationFilter, foundedFilter, stageFilter]);

  // Scroll focused card into view
  useEffect(() => {
    if (focusedIndex >= 0) {
      const el = document.querySelector('.company-card.keyboard-focused');
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);

  const filteredCompanies = useMemo(() => {
    let filtered = companies.filter(c => selectedCategories.includes(c.category));

    // Filter by location
    if (locationFilter !== 'all') {
      const loc = LOCATION_OPTIONS.find(l => l.value === locationFilter);
      if (loc && 'match' in loc) {
        filtered = filtered.filter(c => c.headquarters.includes(loc.match));
      }
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

  const animatedARR = useAnimatedValue(filteredARR);
  const animatedCount = useAnimatedValue(filteredCompanies.length);
  const animatedAvgARRPerEmp = useAnimatedValue(filteredAvgARRPerEmployee);

  // Top 10 companies by ARR/Employee for leaderboard (based on filtered companies)
  const topCompanies = useMemo(() => {
    return [...filteredCompanies]
      .filter(c => c.arr !== null)
      .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0))
      .slice(0, 10);
  }, [filteredCompanies]);

  // Recent raises (last 6 months)
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

  // Keyboard shortcuts (must be after filteredCompanies declaration)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        setFocusedIndex(-1);
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filteredCompanies.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const company = filteredCompanies[focusedIndex];
        if (company) toggleExpand(company.name);
      } else if (e.key === 'o' && focusedIndex >= 0) {
        e.preventDefault();
        const company = filteredCompanies[focusedIndex];
        if (company) navigate(`/company/${getCompanySlug(company.name)}`);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, filteredCompanies, navigate]);

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
    track('csv_export', { count: filteredCompanies.length });
  }, [filteredCompanies]);

  const defaultCategoryObj = defaultCategory ? categories.find(c => c.id === defaultCategory) : null;

  useEffect(() => {
    if (defaultCategoryObj) {
      document.title = `Top ${defaultCategoryObj.name} AI Companies by Efficiency | Vertical Velocity`;
    }
    return () => {
      if (defaultCategoryObj) {
        document.title = 'Vertical Velocity | ARR per Employee Rankings for Vertical AI';
      }
    };
  }, [defaultCategoryObj]);

  // Compare search state
  const [copiedLink, setCopiedLink] = useState(false);
  const [compareSearch, setCompareSearch] = useState('');
  const [compareSearchOpen, setCompareSearchOpen] = useState(false);
  const compareSearchRef = useRef<HTMLInputElement>(null);
  const compareResults = useMemo(() => {
    if (!compareSearch.trim()) return [];
    const q = compareSearch.toLowerCase();
    return companies
      .filter(c => c.arr !== null && (c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [compareSearch]);

  return (
    <div className="efficiency-chart">
      <header className="chart-header">
        <div className="chart-header-top">
          <div className="chart-header-left">
            <div className="title-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <h1>{defaultCategoryObj ? `${defaultCategoryObj.name.toUpperCase()} AI RANKINGS` : 'VERTICAL VELOCITY'}</h1>
            </div>
            <p className="chart-subtitle">
              {defaultCategoryObj
                ? `The most efficient ${defaultCategoryObj.name.toLowerCase()} AI companies, ranked by ARR per employee.`
                : 'A curated ranking of vertical AI companies by efficiency.'}
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
                Random Company
              </button>
              <button
                className="random-btn-header"
                onClick={() => navigate('/calculator')}
              >
                Calculator
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
                track('share_twitter', { context: 'header' });
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
              }}
              aria-label="Share on X"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button
              className="header-icon-btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  track('copy_link', { context: 'header' });
                  setTimeout(() => setCopiedLink(false), 2000);
                } catch { /* clipboard not available */ }
              }}
              aria-label="Copy link"
              title={copiedLink ? 'Copied!' : 'Copy link'}
            >
              {copiedLink ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              )}
            </button>
            <div className="header-nav-pills">
              <button className="nav-pill" onClick={() => navigate('/report')}>Report</button>
              <button className="nav-pill" onClick={() => navigate('/about')}>About</button>
              <a href="mailto:patrick.mcgovern@bowerycap.com" className="nav-pill">Contact</a>
              <a href="https://capitalefficient.substack.com" target="_blank" rel="noopener noreferrer" className="nav-pill">Substack</a>
              <a href="https://linkedin.com/in/pwmcgovern" target="_blank" rel="noopener noreferrer" className="nav-pill">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="last-updated">
          Tracking {companies.filter(c => c.arr !== null).length} companies
          <span className="last-updated-date"> · Updated {new Date(DATA_LAST_UPDATED).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
          <div className="compare-search-wrapper">
            <button
              className="compare-mode-btn"
              onClick={() => {
                setCompareSearchOpen(prev => !prev);
                setTimeout(() => compareSearchRef.current?.focus(), 100);
              }}
              title="Compare companies side-by-side"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Compare
            </button>
            {compareSearchOpen && (
              <div className="compare-search-dropdown">
                <input
                  ref={compareSearchRef}
                  type="text"
                  className="compare-search-input"
                  placeholder="Search a company to compare..."
                  value={compareSearch}
                  onChange={e => setCompareSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setCompareSearchOpen(false); setCompareSearch(''); } }}
                />
                {compareResults.map(c => (
                  <div
                    key={c.name}
                    className="compare-search-item"
                    onClick={() => {
                      navigate(`/compare/${getCompanySlug(c.name)}`);
                      setCompareSearchOpen(false);
                      setCompareSearch('');
                    }}
                  >
                    <span>{c.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                      {categories.find(cat => cat.id === c.category)?.name}
                    </span>
                  </div>
                ))}
                {compareSearch && compareResults.length === 0 && (
                  <div className="compare-search-item" style={{ color: 'var(--text-tertiary)', cursor: 'default' }}>
                    No results
                  </div>
                )}
              </div>
            )}
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
      </div>

      {viewMode === 'scatter' ? (
        <ScatterChart selectedCategories={selectedCategories} onCategoryChange={setSelectedCategories} />
      ) : (
        <>
          {/* New This Month */}
          {(() => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const newCompanies = companies.filter(c => {
              if (!c.dateAdded) return false;
              return new Date(c.dateAdded) >= thirtyDaysAgo;
            });
            if (newCompanies.length === 0) return null;
            return (
              <div className="new-this-month">
                <div className="new-this-month-header">
                  <span className="new-this-month-title">New This Month</span>
                  <button className="new-this-month-report" onClick={() => navigate('/report')}>
                    Monthly Report →
                  </button>
                </div>
                <div className="new-this-month-list">
                  {newCompanies.map(c => {
                    const slug = getCompanySlug(c.name);
                    const cat = categories.find(cat => cat.id === c.category);
                    return (
                      <div key={c.name} className="new-this-month-card" onClick={() => navigate(`/company/${slug}`)}>
                        <CompanyLogo domain={c.domain} name={c.name} color={c.color} className="company-logo" />
                        <div className="new-this-month-info">
                          <span className="new-this-month-name">{c.name}</span>
                          <span className="new-this-month-cat">{cat?.name}</span>
                        </div>
                        <span className="new-this-month-value" style={{ color: getEfficiencyColor(c.arrPerEmployee || 0) }}>
                          {formatARRPerEmployee(c.arrPerEmployee || 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
          </div>

          {/* Market Pulse */}
          <div className="section-label">MARKET PULSE</div>
          <div className="chart-stats">
            {/* Filters */}
            <div className="filters-box">
              <div className="filters-box-content">
                <div className="filters-main-row">
                  <input
                    ref={searchRef}
                    type="text"
                    className="filters-search"
                    placeholder="Search companies... (press /)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
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
                  <button
                    className={`filters-toggle-btn${showFilters || hasActiveFilters ? ' active' : ''}`}
                    onClick={() => setShowFilters(prev => !prev)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                    </svg>
                    Filters
                    {hasActiveFilters && <span className="filters-active-dot" />}
                  </button>
                  {hasActiveFilters && (
                    <button className="clear-filters-btn" onClick={clearAllFilters}>
                      Clear
                    </button>
                  )}
                  <span className="keyboard-hint" title="Press / to focus search">/</span>
                </div>
                {showFilters && (
                  <div className="filters-expanded">
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
                    <div className="location-buttons">
                      {LOCATION_OPTIONS.map(loc => (
                        <button
                          key={loc.value}
                          className={`category-btn location-btn ${locationFilter === loc.value ? 'active' : ''}`}
                          onClick={() => setLocationFilter(loc.value)}
                        >
                          <span className="category-btn-label">{loc.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="stats-right">
              <div className="chart-stat">
                <span className="chart-stat-value green">{formatARR(animatedARR)}</span>
                <span className="chart-stat-label">
                  Total ARR
                  <Tooltip text="Annual Recurring Revenue - the yearly revenue from subscriptions" />
                </span>
              </div>
              <div className="chart-stat">
                <span className="chart-stat-value blue">{animatedCount}</span>
                <span className="chart-stat-label">Companies</span>
              </div>
              <div className="chart-stat">
                <span className="chart-stat-value amber">{formatARRPerEmployee(animatedAvgARRPerEmp)}</span>
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

          <div className="section-label">LEADERBOARD</div>
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
                      onClick={clearAllFilters}
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
                        className={`company-card ${isExpanded ? 'expanded' : ''}${index < 3 ? ` rank-${index + 1}` : ''}${index < 10 ? ' top-10' : ''}${focusedIndex === index ? ' keyboard-focused' : ''}`}
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
                            <CompanyLogo domain={company.domain} name={company.name} color={barColor} className="company-logo" />
                            <div className="company-card-info">
                              <span className="company-card-name">{company.name}</span>
                              <span className="company-card-category">{categories.find(c => c.id === company.category)?.name}</span>
                            </div>
                          </div>
                          <button
                            className={`company-card-compare${compareList.includes(company.name) ? ' active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleCompare(company.name); }}
                            title="Add to compare"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                            </svg>
                          </button>

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

              {/* Newsletter Signup */}
              <div className="newsletter-signup">
                <div className="newsletter-text">
                  <span className="newsletter-title">Get Monthly Efficiency Rankings</span>
                  <span className="newsletter-subtitle">New companies, biggest movers, and sector analysis delivered monthly.</span>
                </div>
                <form
                  className="newsletter-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const email = (e.target as HTMLFormElement).email.value;
                    track('newsletter_signup', { email });
                    window.open(`https://capitalefficient.substack.com/subscribe?email=${encodeURIComponent(email)}`, '_blank');
                    (e.target as HTMLFormElement).reset();
                  }}
                >
                  <input type="email" name="email" placeholder="your@email.com" required className="newsletter-input" />
                  <button type="submit" className="newsletter-btn">Subscribe</button>
                </form>
              </div>

              <footer className="chart-footer">
                <div className="chart-footer-row">
                  <span className="footer-count">{filteredCompanies.length} companies</span>
                  <div className="footer-legend">
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#16a34a' }} /> $300K+</span>
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#d97706' }} /> $200-300K</span>
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#71717a' }} /> &lt;$200K</span>
                  </div>
                </div>
                <div className="chart-footer-row">
                  <div className="chart-footer-shortcuts">
                    <span className="shortcut-hint"><kbd>/</kbd> Search</span>
                    <span className="shortcut-hint"><kbd>↑↓</kbd> Navigate</span>
                    <span className="shortcut-hint"><kbd>Enter</kbd> Expand</span>
                    <span className="shortcut-hint"><kbd>o</kbd> Open Profile</span>
                    <span className="shortcut-hint"><kbd>Esc</kbd> Close</span>
                  </div>
                  <span className="footer-attribution">logos by <a href="https://logo.dev" target="_blank" rel="noopener noreferrer">logo.dev</a></span>
                </div>
                <p className="chart-footer-disclaimer">Revenue figures sourced from public mentions in tech press (TechCrunch, Forbes, Bloomberg, etc.), research firms (Sacra, CB Insights), SEC filings, and press releases. Headcount cross-referenced against LinkedIn and media reports. These numbers are for illustrative purposes only — treat them as directional estimates, not audited financials.</p>
              </footer>
            </div>
          </div>
        </>
      )}

      {/* Floating Compare Bar */}
      {compareList.length > 0 && (
        <div className="compare-floating-bar">
          <div className="compare-floating-companies">
            {compareList.map(name => (
              <span key={name} className="compare-floating-chip">
                {name}
                <button onClick={() => toggleCompare(name)}>&times;</button>
              </span>
            ))}
          </div>
          <button
            className="compare-floating-go"
            disabled={compareList.length < 2}
            onClick={() => {
              const slugs = compareList.map(n => {
                const c = companies.find(co => co.name === n);
                return c ? getCompanySlug(c.name) : '';
              }).filter(Boolean).join('-vs-');
              navigate(`/compare/${slugs}`);
            }}
          >
            Compare {compareList.length}/3
          </button>
        </div>
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
              onSubmit={async (e) => {
                e.preventDefault();
                if (submitting) return;
                setSubmitting(true);
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const data: Record<string, string> = {};
                formData.forEach((v, k) => { data[k] = v.toString(); });

                try {
                  const res = await fetch('https://formspree.io/f/mgopwvdv', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(data),
                  });
                  if (res.ok) {
                    track('submit_company', { company: data.companyName || '' });
                    setShowSubmitModal(false);
                    form.reset();
                    alert('Submitted! We\'ll review your company within 48 hours.');
                  } else {
                    alert('Something went wrong. Please email patrick.mcgovern@bowerycap.com instead.');
                  }
                } catch {
                  alert('Something went wrong. Please email patrick.mcgovern@bowerycap.com instead.');
                }
                setSubmitting(false);
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
                  <input type="number" inputMode="numeric" name="founded" required placeholder="2023" min="1990" max="2026" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Headcount *</label>
                  <input type="number" inputMode="numeric" name="headcount" required placeholder="50" min="1" />
                </div>
                <div className="form-group">
                  <label>ARR ($M) - Optional</label>
                  <input type="number" inputMode="decimal" name="arr" placeholder="10" min="0" step="0.1" />
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
                <input type="email" inputMode="email" name="email" required placeholder="founder@acme.ai" />
              </div>

              <div className="form-group full-width">
                <label>Additional Notes</label>
                <textarea name="notes" placeholder="Any additional context about your company..." rows={3} />
              </div>

              <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit for Review'}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
