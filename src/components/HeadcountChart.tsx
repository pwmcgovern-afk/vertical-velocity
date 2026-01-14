import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { companies, categories, totalHeadcount, companiesWithARR, avgARRPerEmployee, type Company } from '../data/companies';

function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatCurrency(num: number): string {
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}B`;
  return `$${num}M`;
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
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      className="company-logo"
      onError={() => setError(true)}
    />
  );
}

type SortOption = 'headcount' | 'arr' | 'arrPerEmployee';

export function HeadcountChart() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categories.map(c => c.id)
  );
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('arrPerEmployee');

  const filteredCompanies = useMemo(() => {
    let filtered = companies.filter(c => selectedCategories.includes(c.category));

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
  }, [selectedCategories, sortBy]);

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
        return company.arr ? `$${company.arr}M` : 'N/A';
      case 'arrPerEmployee':
        return company.arrPerEmployee ? `$${company.arrPerEmployee}K` : 'N/A';
      default:
        return '';
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const barHeight = 64;
  const gap = 8;

  return (
    <div className="race-container">
      <header className="header">
        <div className="header-badge">Headcount & Efficiency</div>
        <h1>Vertical AI Companies</h1>
        <p className="subtitle">
          Employee headcount and ARR per employee across {companies.length} companies
        </p>
      </header>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalHeadcount)}</span>
            <span className="stat-label">Total Employees</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <span className="stat-value">{companies.length}</span>
            <span className="stat-label">Companies Tracked</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-value">{companiesWithARR.length}</span>
            <span className="stat-label">With ARR Data</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">${avgARRPerEmployee}K</span>
            <span className="stat-label">Avg ARR/Employee</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-chip ${selectedCategories.includes(cat.id) ? 'active' : ''}`}
              style={{ '--cat-color': cat.color } as React.CSSProperties}
              onClick={() => toggleCategory(cat.id)}
            >
              <span className="chip-dot" style={{ backgroundColor: cat.color }} />
              <span className="chip-label">{cat.name}</span>
              {selectedCategories.includes(cat.id) && <span className="chip-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="sort-controls glass-panel">
        <span className="sort-label">Sort by:</span>
        <button
          className={`sort-btn ${sortBy === 'arrPerEmployee' ? 'active' : ''}`}
          onClick={() => setSortBy('arrPerEmployee')}
        >
          ARR/Employee
        </button>
        <button
          className={`sort-btn ${sortBy === 'arr' ? 'active' : ''}`}
          onClick={() => setSortBy('arr')}
        >
          Total ARR
        </button>
        <button
          className={`sort-btn ${sortBy === 'headcount' ? 'active' : ''}`}
          onClick={() => setSortBy('headcount')}
        >
          Headcount
        </button>
      </div>

      {/* Chart */}
      <div
        className="chart-container glass-panel"
        style={{ height: filteredCompanies.length * (barHeight + gap) + 48 }}
      >
        <AnimatePresence mode="popLayout">
          {filteredCompanies.map((company, index) => (
            <motion.div
              key={company.name}
              className={`bar-row ${hoveredCompany === company.name ? 'hovered' : ''}`}
              layout
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0, y: index * (barHeight + gap) }}
              exit={{ opacity: 0, x: 50 }}
              transition={{
                layout: { type: 'spring', stiffness: 100, damping: 18 },
                opacity: { duration: 0.2 },
              }}
              style={{ height: barHeight }}
              onMouseEnter={() => setHoveredCompany(company.name)}
              onMouseLeave={() => setHoveredCompany(null)}
            >
              <div className="bar-label">
                <span className="rank-badge" style={{ backgroundColor: `${company.color}20`, color: company.color }}>
                  {index + 1}
                </span>
                <div className="company-info">
                  <CompanyLogo domain={company.domain} name={company.name} color={company.color} />
                  <div className="company-details">
                    <span className="company-name">{company.name}</span>
                    <span className="company-domain">{company.domain}</span>
                  </div>
                </div>
              </div>

              <div className="bar-track">
                <motion.div
                  className="bar-fill"
                  style={{
                    background: `linear-gradient(90deg, ${company.color} 0%, ${company.color}cc 100%)`,
                    boxShadow: hoveredCompany === company.name
                      ? `0 4px 24px ${company.color}50`
                      : `0 2px 8px ${company.color}20`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(getBarValue(company) / maxValue) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                >
                  <span className="bar-value-inside">{formatBarValue(company)}</span>
                </motion.div>
              </div>

              <div className="bar-rank">
                <span className="headcount-badge">{company.headcount} employees</span>
              </div>

              {/* Hover Card */}
              <AnimatePresence>
                {hoveredCompany === company.name && (
                  <motion.div
                    className="hover-card glass-panel"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="hover-card-header">
                      <CompanyLogo domain={company.domain} name={company.name} color={company.color} />
                      <div className="hover-card-title">
                        <span className="hover-card-name">{company.name}</span>
                        <span
                          className="hover-card-category"
                          style={{ backgroundColor: `${company.color}20`, color: company.color }}
                        >
                          {categories.find(c => c.id === company.category)?.name}
                        </span>
                      </div>
                    </div>

                    <div className="hover-card-stats">
                      <div className="hover-stat">
                        <span className="hover-stat-value">{company.headcount}</span>
                        <span className="hover-stat-label">Employees</span>
                      </div>
                      <div className="hover-stat">
                        <span className="hover-stat-value">{company.arr ? `$${company.arr}M` : 'N/A'}</span>
                        <span className="hover-stat-label">ARR</span>
                      </div>
                      <div className="hover-stat">
                        <span className="hover-stat-value">{company.arrPerEmployee ? `$${company.arrPerEmployee}K` : 'N/A'}</span>
                        <span className="hover-stat-label">ARR/Employee</span>
                      </div>
                    </div>

                    <div className="hover-card-details">
                      {company.valuation && (
                        <div className="detail-row">
                          <span className="detail-label">Valuation:</span>
                          <span className="detail-value">{formatCurrency(company.valuation * 1000)}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Last Funding:</span>
                        <span className="detail-value">{company.lastFunding}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Source:</span>
                        <span className="detail-value source">{company.source}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <span>Data from PitchBook, Sacra, Tracxn, LeadIQ</span>
          <span className="footer-divider">•</span>
          <span>Updated Jan 2026</span>
        </div>
      </footer>
    </div>
  );
}
