import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { companies, categories, getCompanySlug, type Company } from '../data/companies';
import { CompanyLogo } from './CompanyLogo';
import {
  formatARR, formatARRPerEmployee, formatValuation,
  getEfficiencyColor, getRevenueMultiple, getFundingStage, getRank,
} from '../utils';

type MetricDef = {
  label: string;
  getValue: (c: Company) => string;
  getNumeric: (c: Company) => number | null;
  higherIsBetter: boolean;
  colorize?: boolean;
};

const metrics: MetricDef[] = [
  {
    label: 'ARR / Employee',
    getValue: c => formatARRPerEmployee(c.arrPerEmployee || 0),
    getNumeric: c => c.arrPerEmployee || null,
    higherIsBetter: true,
    colorize: true,
  },
  {
    label: 'Total ARR',
    getValue: c => (c.arr ? formatARR(c.arr) : '—'),
    getNumeric: c => c.arr,
    higherIsBetter: true,
  },
  {
    label: 'Employees',
    getValue: c => c.headcount.toLocaleString(),
    getNumeric: c => c.headcount,
    higherIsBetter: false,
  },
  {
    label: 'Valuation',
    getValue: c => (c.valuation ? formatValuation(c.valuation) : '—'),
    getNumeric: c => c.valuation,
    higherIsBetter: true,
  },
  {
    label: 'Rev Multiple',
    getValue: c => getRevenueMultiple(c) || '—',
    getNumeric: c => (c.valuation && c.arr ? (c.valuation * 1000) / c.arr : null),
    higherIsBetter: false,
  },
  {
    label: 'Stage',
    getValue: c => getFundingStage(c.lastFunding),
    getNumeric: () => null,
    higherIsBetter: true,
  },
  {
    label: 'Founded',
    getValue: c => String(c.founded),
    getNumeric: c => c.founded,
    higherIsBetter: false,
  },
  {
    label: 'HQ',
    getValue: c => c.headquarters,
    getNumeric: () => null,
    higherIsBetter: true,
  },
];

type BarMetric = {
  label: string;
  getValue: (c: Company) => number;
  format: (v: number) => string;
  colorize?: boolean;
};

const barMetrics: BarMetric[] = [
  {
    label: 'ARR / Employee',
    getValue: c => c.arrPerEmployee || 0,
    format: v => formatARRPerEmployee(v),
    colorize: true,
  },
  {
    label: 'Total ARR',
    getValue: c => c.arr || 0,
    format: v => formatARR(v),
  },
  {
    label: 'Employees',
    getValue: c => c.headcount,
    format: v => v.toLocaleString(),
  },
];

export function ComparePage() {
  const { slugs } = useParams<{ slugs: string }>();
  const navigate = useNavigate();
  const [selectorOpen, setSelectorOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slugs]);

  const selectedCompanies = useMemo(() => {
    if (!slugs) return [];
    const slugList = slugs.split('-vs-');
    return slugList
      .map(s => companies.find(c => getCompanySlug(c.name) === s))
      .filter((c): c is Company => c !== undefined);
  }, [slugs]);

  const uniqueCompanies = useMemo(() => {
    const seen = new Set<string>();
    return selectedCompanies.filter(c => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
  }, [selectedCompanies]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return companies
      .filter(
        c =>
          !uniqueCompanies.some(uc => uc.name === c.name) &&
          c.arr !== null &&
          (c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [searchQuery, uniqueCompanies]);

  const suggestedCompanies = useMemo(() => {
    if (uniqueCompanies.length === 0) return [];
    const selectedCategories = new Set(uniqueCompanies.map(c => c.category));
    const selectedNames = new Set(uniqueCompanies.map(c => c.name));
    return companies
      .filter(c => selectedCategories.has(c.category) && !selectedNames.has(c.name) && c.arr !== null)
      .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0))
      .slice(0, 6);
  }, [uniqueCompanies]);

  useEffect(() => {
    if (selectorOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [selectorOpen]);

  useEffect(() => {
    if (uniqueCompanies.length >= 2) {
      document.title = `${uniqueCompanies.map(c => c.name).join(' vs ')} | Vertical Velocity`;
    } else {
      document.title = 'Compare Companies | Vertical Velocity';
    }
    return () => {
      document.title = 'Vertical Velocity | ARR per Employee Rankings for Vertical AI';
    };
  }, [uniqueCompanies]);

  const addCompany = (company: Company) => {
    const newSlugs = [...uniqueCompanies, company].map(c => getCompanySlug(c.name)).join('-vs-');
    navigate(`/compare/${newSlugs}`, { replace: true });
    setSelectorOpen(false);
    setSearchQuery('');
  };

  const removeCompany = (company: Company) => {
    const remaining = uniqueCompanies.filter(c => c.name !== company.name);
    if (remaining.length === 0) {
      navigate('/');
    } else if (remaining.length === 1) {
      navigate(`/compare/${getCompanySlug(remaining[0].name)}`, { replace: true });
    } else {
      const newSlugs = remaining.map(c => getCompanySlug(c.name)).join('-vs-');
      navigate(`/compare/${newSlugs}`, { replace: true });
    }
  };

  const getWinner = (metric: MetricDef): string | null => {
    const values = uniqueCompanies.map(c => ({
      name: c.name,
      val: metric.getNumeric(c),
    }));
    const numericValues = values.filter(v => v.val !== null) as { name: string; val: number }[];
    if (numericValues.length < 2) return null;
    numericValues.sort((a, b) => (metric.higherIsBetter ? b.val - a.val : a.val - b.val));
    return numericValues[0].name;
  };

  const shareText = uniqueCompanies.length >= 2
    ? `Comparing ${uniqueCompanies.map(c => c.name).join(' vs ')} on ARR per employee:\n\n${uniqueCompanies.map(c => `${c.name}: ${formatARRPerEmployee(c.arrPerEmployee || 0)}/emp`).join('\n')}\n\nSee the full comparison:\nvia @pw_mcgovern`
    : '';

  return (
    <div className="company-page">
      <div className="cmp-container">
        <div className="cmp-top-bar">
          <button className="cp-back-btn" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Rankings
          </button>
          <div className="cmp-top-actions">
            {uniqueCompanies.length >= 2 && (
              <>
                <button
                  className="cp-share-btn"
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(shareText);
                    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share
                </button>
                <button
                  className="cp-share-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </>
            )}
          </div>
        </div>

        <h1 className="cmp-title">
          {uniqueCompanies.length >= 2
            ? uniqueCompanies.map(c => c.name).join(' vs ')
            : 'Compare Companies'}
        </h1>

        <div className="cmp-companies-row">
          {uniqueCompanies.map(company => {
            const category = categories.find(c => c.id === company.category);
            const rank = getRank(company, companies);
            return (
              <div key={company.name} className="cmp-company-card">
                <button
                  className="cmp-remove-btn"
                  onClick={() => removeCompany(company)}
                  title="Remove from comparison"
                >
                  x
                </button>
                <div
                  className="cmp-company-link"
                  onClick={() => navigate(`/company/${getCompanySlug(company.name)}`)}
                >
                  <CompanyLogo domain={company.domain} name={company.name} color={company.color} size={128} className="cmp-logo" wrapperClassName="cmp-logo-wrapper" />
                  <span className="cmp-company-name">{company.name}</span>
                </div>
                <div className="cmp-company-meta">
                  <span className={`category-tag ${company.category}`}>{category?.name}</span>
                  <span className="cmp-company-rank" style={{ color: getEfficiencyColor(company.arrPerEmployee || 0) }}>
                    #{rank}
                  </span>
                </div>
              </div>
            );
          })}

          {uniqueCompanies.length < 3 && (
            <div className="cmp-add-card" onClick={() => setSelectorOpen(!selectorOpen)}>
              <div className="cmp-add-icon">+</div>
              <span className="cmp-add-text">Add Company</span>
            </div>
          )}
        </div>

        {selectorOpen && (
          <div className="cmp-selector">
            <input
              ref={searchRef}
              type="text"
              className="cmp-selector-input"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="cmp-selector-results">
                {searchResults.map(c => {
                  const cat = categories.find(cat => cat.id === c.category);
                  return (
                    <div key={c.name} className="cmp-selector-item" onClick={() => addCompany(c)}>
                      <span className="cmp-selector-item-name">{c.name}</span>
                      <span className="cmp-selector-item-meta">
                        {cat?.name} &middot; {formatARRPerEmployee(c.arrPerEmployee || 0)}/emp
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="cmp-selector-empty">No companies found</div>
            )}
            {suggestedCompanies.length > 0 && (
              <div className="cmp-suggestions">
                <div className="cmp-suggestions-label">Same vertical</div>
                <div className="cmp-suggestions-chips">
                  {suggestedCompanies.map(c => (
                    <button
                      key={c.name}
                      className="cmp-suggestion-chip"
                      onClick={() => addCompany(c)}
                    >
                      <img
                        src={`https://img.logo.dev/${c.domain}?token=pk_Iw_EUyO3SUuLmOI4_D_2_Q&format=png&size=40`}
                        alt=""
                        className="cmp-suggestion-logo"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span className="cmp-suggestion-name">{c.name}</span>
                      <span className="cmp-suggestion-meta">{formatARRPerEmployee(c.arrPerEmployee || 0)}/emp</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {uniqueCompanies.length >= 2 && (
          <>
            <div className="cmp-metrics-table">
              {metrics.map(metric => {
                const winner = getWinner(metric);
                return (
                  <div key={metric.label} className="cmp-metric-row">
                    <div className="cmp-metric-label">{metric.label}</div>
                    {uniqueCompanies.map(company => {
                      const isWinner = winner === company.name;
                      const value = metric.getValue(company);
                      const style: React.CSSProperties = {};
                      if (metric.colorize) {
                        style.color = getEfficiencyColor(company.arrPerEmployee || 0);
                      }
                      if (isWinner) {
                        style.fontWeight = 700;
                      }
                      return (
                        <div
                          key={company.name}
                          className={`cmp-metric-value${isWinner ? ' winner' : ''}`}
                          style={style}
                        >
                          {value}
                          {isWinner && <span className="cmp-winner-dot" />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="cmp-bars-section">
              <h3 className="cmp-bars-title">Visual Comparison</h3>
              {barMetrics.map(bm => {
                const maxVal = Math.max(...uniqueCompanies.map(c => bm.getValue(c)), 1);
                return (
                  <div key={bm.label} className="cmp-bar-group">
                    <div className="cmp-bar-group-label">{bm.label}</div>
                    {uniqueCompanies.map(company => {
                      const val = bm.getValue(company);
                      const pct = (val / maxVal) * 100;
                      const color = bm.colorize
                        ? getEfficiencyColor(company.arrPerEmployee || 0)
                        : company.color;
                      return (
                        <div key={company.name} className="cmp-bar-row">
                          <span className="cmp-bar-company">{company.name}</span>
                          <div className="cmp-bar-track">
                            <motion.div
                              className="cmp-bar-fill"
                              style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                            />
                          </div>
                          <span className="cmp-bar-value" style={bm.colorize ? { color } : undefined}>
                            {bm.format(val)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {uniqueCompanies.length < 2 && (
          <div className="cmp-empty">
            <div className="cmp-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <h2>Select {uniqueCompanies.length === 0 ? 'two' : 'one more'} company to compare</h2>
            <p>Add companies using the search above to see a side-by-side comparison.</p>
          </div>
        )}
      </div>
    </div>
  );
}
