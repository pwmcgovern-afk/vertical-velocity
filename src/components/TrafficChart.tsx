import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import trafficData from '../data/trafficData.json';

interface CompanyTraffic {
  domain: string;
  category: string;
  color: string;
  monthlyVisits: number;
  globalRank: number | null;
  usRank: number | null;
  categoryRank: string | null;
  bounceRate: number | null;
  pagesPerVisit: number | null;
  avgVisitDuration: number | null;
  trafficSources: {
    Social: number | null;
    'Paid Referrals': number | null;
    Mail: number | null;
    Referrals: number | null;
    Search: number | null;
    Direct: number | null;
  } | null;
  description: string;
}

const categories = [
  { id: 'healthcare', name: 'Healthcare', color: '#10b981' },
  { id: 'legal', name: 'Legal', color: '#6366f1' },
  { id: 'finance', name: 'Finance', color: '#f59e0b' },
  { id: 'home_services', name: 'Home Services', color: '#ef4444' },
  { id: 'other', name: 'Other', color: '#8b5cf6' },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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

export function TrafficChart() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categories.map(c => c.id)
  );
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'traffic' | 'rank'>('traffic');

  const companies = useMemo(() => {
    return Object.entries(trafficData.companies as Record<string, CompanyTraffic>)
      .filter(([_, data]) => selectedCategories.includes(data.category) && data.monthlyVisits > 0)
      .sort((a, b) => {
        if (sortBy === 'traffic') return b[1].monthlyVisits - a[1].monthlyVisits;
        return (a[1].globalRank || 999999999) - (b[1].globalRank || 999999999);
      })
      .slice(0, 15);
  }, [selectedCategories, sortBy]);

  const maxVisits = Math.max(...companies.map(([_, d]) => d.monthlyVisits));

  const totalVisits = useMemo(() => {
    return companies.reduce((sum, [_, d]) => sum + d.monthlyVisits, 0);
  }, [companies]);

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
        <div className="header-badge">Real Traffic Data</div>
        <h1>Vertical AI Traffic</h1>
        <p className="subtitle">
          Monthly website visits from SimilarWeb • {Object.keys(trafficData.companies).length} companies tracked
        </p>
      </header>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalVisits)}</span>
            <span className="stat-label">Combined Monthly Visits</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <span className="stat-value">{companies.length}</span>
            <span className="stat-label">Companies Shown</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">{categories.length}</span>
            <span className="stat-label">Verticals</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <span className="stat-value">Nov 2025</span>
            <span className="stat-label">Data Period</span>
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
          className={`sort-btn ${sortBy === 'traffic' ? 'active' : ''}`}
          onClick={() => setSortBy('traffic')}
        >
          Monthly Visits
        </button>
        <button
          className={`sort-btn ${sortBy === 'rank' ? 'active' : ''}`}
          onClick={() => setSortBy('rank')}
        >
          Global Rank
        </button>
      </div>

      {/* Chart */}
      <div
        className="chart-container glass-panel"
        style={{ height: companies.length * (barHeight + gap) + 48 }}
      >
        <AnimatePresence mode="popLayout">
          {companies.map(([name, data], index) => (
            <motion.div
              key={name}
              className={`bar-row ${hoveredCompany === name ? 'hovered' : ''}`}
              layout
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0, y: index * (barHeight + gap) }}
              exit={{ opacity: 0, x: 50 }}
              transition={{
                layout: { type: 'spring', stiffness: 100, damping: 18 },
                opacity: { duration: 0.2 },
              }}
              style={{ height: barHeight }}
              onMouseEnter={() => setHoveredCompany(name)}
              onMouseLeave={() => setHoveredCompany(null)}
            >
              <div className="bar-label">
                <span className="rank-badge" style={{ backgroundColor: `${data.color}20`, color: data.color }}>
                  {index + 1}
                </span>
                <div className="company-info">
                  <CompanyLogo domain={data.domain} name={name} color={data.color} />
                  <div className="company-details">
                    <span className="company-name">{name}</span>
                    <span className="company-domain">{data.domain}</span>
                  </div>
                </div>
              </div>

              <div className="bar-track">
                <motion.div
                  className="bar-fill"
                  style={{
                    background: `linear-gradient(90deg, ${data.color} 0%, ${data.color}cc 100%)`,
                    boxShadow: hoveredCompany === name
                      ? `0 4px 24px ${data.color}50`
                      : `0 2px 8px ${data.color}20`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.monthlyVisits / maxVisits) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                >
                  <span className="bar-value-inside">{formatNumber(data.monthlyVisits)}</span>
                </motion.div>
              </div>

              <div className="bar-rank">
                {data.globalRank && (
                  <span className="global-rank">#{data.globalRank.toLocaleString()}</span>
                )}
              </div>

              {/* Hover Card */}
              <AnimatePresence>
                {hoveredCompany === name && (
                  <motion.div
                    className="hover-card glass-panel"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="hover-card-header">
                      <CompanyLogo domain={data.domain} name={name} color={data.color} />
                      <div className="hover-card-title">
                        <span className="hover-card-name">{name}</span>
                        <span
                          className="hover-card-category"
                          style={{ backgroundColor: `${data.color}20`, color: data.color }}
                        >
                          {categories.find(c => c.id === data.category)?.name}
                        </span>
                      </div>
                    </div>

                    {data.description && (
                      <p className="hover-card-desc">{data.description.slice(0, 120)}...</p>
                    )}

                    <div className="hover-card-stats">
                      <div className="hover-stat">
                        <span className="hover-stat-value">{formatNumber(data.monthlyVisits)}</span>
                        <span className="hover-stat-label">Monthly Visits</span>
                      </div>
                      <div className="hover-stat">
                        <span className="hover-stat-value">#{data.globalRank?.toLocaleString() || 'N/A'}</span>
                        <span className="hover-stat-label">Global Rank</span>
                      </div>
                      {data.avgVisitDuration && (
                        <div className="hover-stat">
                          <span className="hover-stat-value">{formatDuration(data.avgVisitDuration)}</span>
                          <span className="hover-stat-label">Avg Duration</span>
                        </div>
                      )}
                    </div>

                    {data.trafficSources && (
                      <div className="traffic-sources">
                        <span className="sources-label">Traffic Sources</span>
                        <div className="sources-bar">
                          <div className="source direct" style={{ width: `${(data.trafficSources.Direct || 0) * 100}%` }} title="Direct" />
                          <div className="source search" style={{ width: `${(data.trafficSources.Search || 0) * 100}%` }} title="Search" />
                          <div className="source referral" style={{ width: `${(data.trafficSources.Referrals || 0) * 100}%` }} title="Referrals" />
                          <div className="source social" style={{ width: `${(data.trafficSources.Social || 0) * 100}%` }} title="Social" />
                        </div>
                        <div className="sources-legend">
                          <span><span className="legend-dot direct"></span>Direct</span>
                          <span><span className="legend-dot search"></span>Search</span>
                          <span><span className="legend-dot referral"></span>Referral</span>
                          <span><span className="legend-dot social"></span>Social</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <span>Data from SimilarWeb</span>
          <span className="footer-divider">•</span>
          <span>Updated {new Date(trafficData.fetchedAt).toLocaleDateString()}</span>
        </div>
      </footer>
    </div>
  );
}
