import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import realTrendsData from '../data/realTrends.json';

interface TrendPoint {
  time: string;
  value: number;
}

interface CompanyData {
  category: string;
  color: string;
  trendData: TrendPoint[];
}

interface CompanyMeta {
  founded: number;
  raised: string;
  raisedNum: number;
  description: string;
  domain: string;
  logo: string;
}

interface Company {
  name: string;
  category: string;
  color: string;
  trendData: number[];
  times: string[];
  meta: CompanyMeta;
}

interface RankedCompany extends Company {
  value: number;
  rank: number;
  currentTime: string;
}

// Company metadata with domains for logo fetching
const companyMetadata: Record<string, CompanyMeta> = {
  'Nuance DAX': { founded: 2020, raised: '$0 (Microsoft)', raisedNum: 0, description: 'AI clinical documentation', domain: 'nuance.com', logo: 'https://logo.clearbit.com/nuance.com' },
  'Abridge AI': { founded: 2018, raised: '$212M', raisedNum: 212, description: 'Medical conversation AI', domain: 'abridge.com', logo: 'https://logo.clearbit.com/abridge.com' },
  'Ambience Healthcare': { founded: 2020, raised: '$100M', raisedNum: 100, description: 'AI medical scribe', domain: 'ambience.healthcare', logo: 'https://logo.clearbit.com/ambience.healthcare' },
  'SmarterDx': { founded: 2020, raised: '$65M', raisedNum: 65, description: 'AI for clinical coding', domain: 'smarterdx.com', logo: 'https://logo.clearbit.com/smarterdx.com' },
  'OpenEvidence': { founded: 2022, raised: '$10M', raisedNum: 10, description: 'AI for clinical decisions', domain: 'openevidence.com', logo: 'https://logo.clearbit.com/openevidence.com' },
  'Silna Health': { founded: 2021, raised: '$8M', raisedNum: 8, description: 'Prior auth automation', domain: 'silnahealth.com', logo: 'https://logo.clearbit.com/silnahealth.com' },
  'Regard AI': { founded: 2020, raised: '$50M', raisedNum: 50, description: 'AI diagnosis assistant', domain: 'regard.com', logo: 'https://logo.clearbit.com/regard.com' },
  'Heidi Health': { founded: 2021, raised: '$20M', raisedNum: 20, description: 'AI clinical notes', domain: 'heidihealth.com', logo: 'https://logo.clearbit.com/heidihealth.com' },
  'Qualio': { founded: 2017, raised: '$75M', raisedNum: 75, description: 'Quality management AI', domain: 'qualio.com', logo: 'https://logo.clearbit.com/qualio.com' },
  'Chai Discovery': { founded: 2024, raised: '$30M', raisedNum: 30, description: 'AI drug discovery', domain: 'chaidiscovery.com', logo: 'https://logo.clearbit.com/chaidiscovery.com' },
  'Harvey AI': { founded: 2022, raised: '$206M', raisedNum: 206, description: 'AI for law firms', domain: 'harvey.ai', logo: 'https://logo.clearbit.com/harvey.ai' },
  'EvenUp AI': { founded: 2019, raised: '$135M', raisedNum: 135, description: 'PI demand letters', domain: 'evenuplaw.com', logo: 'https://logo.clearbit.com/evenuplaw.com' },
  'Spellbook AI': { founded: 2020, raised: '$20M', raisedNum: 20, description: 'Contract drafting AI', domain: 'spellbook.legal', logo: 'https://logo.clearbit.com/spellbook.legal' },
  'Legora AI': { founded: 2023, raised: '$5M', raisedNum: 5, description: 'Legal research AI', domain: 'legora.ai', logo: 'https://logo.clearbit.com/legora.ai' },
  'Crosby AI': { founded: 2023, raised: '$3M', raisedNum: 3, description: 'Litigation AI', domain: 'crosbyai.com', logo: 'https://logo.clearbit.com/crosbyai.com' },
  'Solve Intelligence': { founded: 2022, raised: '$6M', raisedNum: 6, description: 'Patent drafting AI', domain: 'solveintelligence.com', logo: 'https://logo.clearbit.com/solveintelligence.com' },
  'Hebbia AI': { founded: 2020, raised: '$130M', raisedNum: 130, description: 'AI for finance research', domain: 'hebbia.ai', logo: 'https://logo.clearbit.com/hebbia.ai' },
  'Rogo AI': { founded: 2022, raised: '$25M', raisedNum: 25, description: 'Investment research AI', domain: 'rogodata.com', logo: 'https://logo.clearbit.com/rogodata.com' },
  'Trove AI': { founded: 2022, raised: '$8M', raisedNum: 8, description: 'Financial data AI', domain: 'trove.ai', logo: 'https://logo.clearbit.com/trove.ai' },
  'Accordance AI': { founded: 2023, raised: '$4M', raisedNum: 4, description: 'Compliance AI', domain: 'accordance.ai', logo: 'https://logo.clearbit.com/accordance.ai' },
  'Avoca AI': { founded: 2022, raised: '$23M', raisedNum: 23, description: 'AI for home services', domain: 'avoca.ai', logo: 'https://logo.clearbit.com/avoca.ai' },
  'Rilla Voice': { founded: 2020, raised: '$12M', raisedNum: 12, description: 'Sales coaching AI', domain: 'rilla.com', logo: 'https://logo.clearbit.com/rilla.com' },
  'Topline Pro': { founded: 2021, raised: '$8M', raisedNum: 8, description: 'Contractor marketing AI', domain: 'toplinepro.com', logo: 'https://logo.clearbit.com/toplinepro.com' },
  'Siro AI': { founded: 2020, raised: '$25M', raisedNum: 25, description: 'Field sales AI', domain: 'siro.ai', logo: 'https://logo.clearbit.com/siro.ai' },
  'Netic AI': { founded: 2022, raised: '$5M', raisedNum: 5, description: 'Service business AI', domain: 'netic.ai', logo: 'https://logo.clearbit.com/netic.ai' },
  'Elise AI': { founded: 2017, raised: '$75M', raisedNum: 75, description: 'AI leasing assistant', domain: 'eliseai.com', logo: 'https://logo.clearbit.com/eliseai.com' },
  'Sixfold AI': { founded: 2021, raised: '$15M', raisedNum: 15, description: 'Insurance underwriting', domain: 'sixfold.ai', logo: 'https://logo.clearbit.com/sixfold.ai' },
  'Comulate': { founded: 2022, raised: '$10M', raisedNum: 10, description: 'Insurance billing AI', domain: 'comulate.com', logo: 'https://logo.clearbit.com/comulate.com' },
  'Strala AI': { founded: 2023, raised: '$3M', raisedNum: 3, description: 'Construction AI', domain: 'strala.ai', logo: 'https://logo.clearbit.com/strala.ai' },
  'Pace AI': { founded: 2022, raised: '$5M', raisedNum: 5, description: 'Revenue ops AI', domain: 'paceai.co', logo: 'https://logo.clearbit.com/paceai.co' },
};

const defaultMeta: CompanyMeta = { founded: 2022, raised: 'Undisclosed', raisedNum: 0, description: 'Vertical AI company', domain: '', logo: '' };

// Logo component with fallback
function CompanyLogo({ src, name, color }: { src: string; name: string; color: string }) {
  const [error, setError] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (error || !src) {
    return (
      <div className="company-logo fallback" style={{ background: `${color}30`, color }}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="company-logo"
      onError={() => setError(true)}
    />
  );
}

const categories = [
  { id: 'healthcare', name: 'Healthcare', color: '#10b981' },
  { id: 'legal', name: 'Legal', color: '#6366f1' },
  { id: 'finance', name: 'Finance', color: '#f59e0b' },
  { id: 'home_services', name: 'Home Services', color: '#ef4444' },
  { id: 'other', name: 'Other', color: '#8b5cf6' },
] as const;

// Aggregate weekly data into monthly
function aggregateToMonthly(trendData: TrendPoint[]): { values: number[]; months: string[] } {
  const monthlyData: Record<string, number[]> = {};

  for (const point of trendData) {
    // Parse "Jan 1 – 7, 2023" -> "Jan 2023"
    const match = point.time.match(/^(\w+)\s+\d+.*(\d{4})$/);
    if (match) {
      const monthKey = `${match[1]} ${match[2]}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(point.value);
    }
  }

  // Sort months chronologically
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
    return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
  });

  // Average the weekly values for each month
  const values = sortedMonths.map(month => {
    const weeklyValues = monthlyData[month];
    const avg = weeklyValues.reduce((a, b) => a + b, 0) / weeklyValues.length;
    return Math.round(avg);
  });

  return { values, months: sortedMonths };
}

// Transform the real trends data
function transformData(): Company[] {
  const companies: Company[] = [];

  for (const [name, data] of Object.entries(realTrendsData.companies as Record<string, CompanyData>)) {
    const { values, months } = aggregateToMonthly(data.trendData);
    const meta = companyMetadata[name] || defaultMeta;

    companies.push({
      name,
      category: data.category,
      color: data.color,
      trendData: values,
      times: months,
      meta,
    });
  }

  return companies;
}

export function BarChartRace() {
  const companies = useMemo(() => transformData(), []);
  const timePoints = companies[0]?.times || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categories.map((c) => c.id)
  );
  const [speed, setSpeed] = useState(300);
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);

  const filteredCompanies = companies.filter((c) =>
    selectedCategories.includes(c.category)
  );

  const getRankedCompanies = useCallback(
    (index: number): RankedCompany[] => {
      return filteredCompanies
        .map((company) => ({
          ...company,
          value: company.trendData[index] || 0,
          currentTime: company.times[index] || '',
          rank: 0,
        }))
        .sort((a, b) => b.value - a.value)
        .map((company, idx) => ({
          ...company,
          rank: idx,
        }))
        .slice(0, 12);
    },
    [filteredCompanies]
  );

  const rankedCompanies = getRankedCompanies(currentIndex);
  const maxValue = Math.max(...rankedCompanies.map((c) => c.value), 1);
  const currentTime = timePoints[currentIndex] || '';

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= timePoints.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, timePoints.length]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const barHeight = 56;
  const gap = 8;
  const [showLegend, setShowLegend] = useState(false);

  // Calculate total funding across all visible companies
  const totalFunding = useMemo(() => {
    return rankedCompanies.reduce((sum, c) => sum + (c.meta?.raisedNum || 0), 0);
  }, [rankedCompanies]);

  return (
    <div className="race-container">
      <header className="header">
        <div className="header-badge">Vertical AI Landscape</div>
        <h1>The Race for Industry AI</h1>
        <p className="subtitle">
          Tracking search interest across {Object.keys(realTrendsData.companies).length} vertical AI companies
        </p>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">{timePoints.length}</span>
            <span className="stat-label">Months Tracked</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <span className="stat-value">{Object.keys(realTrendsData.companies).length}</span>
            <span className="stat-label">Companies</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-value">${totalFunding}M</span>
            <span className="stat-label">Combined Funding</span>
          </div>
        </div>
        <div className="stat-card glass-panel clickable" onClick={() => setShowLegend(!showLegend)}>
          <div className="stat-icon">❓</div>
          <div className="stat-content">
            <span className="stat-value">0-100</span>
            <span className="stat-label">What's this score?</span>
          </div>
        </div>
      </div>

      {/* Legend Explainer */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            className="legend-panel glass-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="legend-content">
              <h3>Understanding the Score</h3>
              <p>
                Numbers represent <strong>Google Trends search interest</strong> on a 0-100 scale.
                This is a <em>relative</em> measure of public interest, not absolute search volume.
              </p>
              <div className="legend-scale">
                <div className="scale-item">
                  <span className="scale-value high">100</span>
                  <span className="scale-desc">Peak popularity</span>
                </div>
                <div className="scale-item">
                  <span className="scale-value mid">50</span>
                  <span className="scale-desc">Half of peak interest</span>
                </div>
                <div className="scale-item">
                  <span className="scale-value low">0</span>
                  <span className="scale-desc">Minimal search data</span>
                </div>
              </div>
              <p className="legend-note">
                Spikes often correlate with funding announcements, product launches, or press coverage.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filters */}
      <div className="filters-section">
        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-chip ${selectedCategories.includes(cat.id) ? 'active' : ''}`}
              style={{ '--cat-color': cat.color } as React.CSSProperties}
              onClick={() => toggleCategory(cat.id)}
            >
              <span className="chip-dot" style={{ backgroundColor: cat.color }} />
              <span className="chip-label">{cat.name}</span>
              {selectedCategories.includes(cat.id) && (
                <span className="chip-check">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="timeline-section glass-panel">
        <div className="current-date">
          <span className="date-label">Current Period</span>
          <span className="date-value">{currentTime}</span>
        </div>

        <div className="playback-controls">
          <button
            className="control-btn"
            onClick={() => setCurrentIndex(0)}
            disabled={currentIndex === 0}
          >
            ⏮
          </button>
          <button
            className="play-btn"
            onClick={() => {
              if (currentIndex >= timePoints.length - 1) {
                setCurrentIndex(0);
              }
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            className="control-btn"
            onClick={() => setCurrentIndex(timePoints.length - 1)}
            disabled={currentIndex === timePoints.length - 1}
          >
            ⏭
          </button>
        </div>

        <div className="timeline-track">
          <input
            type="range"
            min={0}
            max={timePoints.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setCurrentIndex(parseInt(e.target.value));
              setIsPlaying(false);
            }}
            className="timeline-slider"
          />
          <div className="timeline-markers">
            <span>Jan 2023</span>
            <span>Now</span>
          </div>
        </div>

        <select
          value={speed}
          onChange={(e) => setSpeed(parseInt(e.target.value))}
          className="speed-select"
        >
          <option value={600}>0.5×</option>
          <option value={300}>1×</option>
          <option value={150}>2×</option>
          <option value={75}>4×</option>
        </select>
      </div>

      {/* Chart */}
      <div
        className="chart-container glass-panel"
        style={{ height: 12 * (barHeight + gap) + 48 }}
      >
        <AnimatePresence>
          {rankedCompanies.map((company) => (
            <motion.div
              key={company.name}
              className={`bar-row ${hoveredCompany === company.name ? 'hovered' : ''}`}
              initial={{ opacity: 0, x: -50 }}
              animate={{
                opacity: 1,
                x: 0,
                y: company.rank * (barHeight + gap),
              }}
              exit={{ opacity: 0, x: 50 }}
              transition={{
                y: { type: 'spring', stiffness: 100, damping: 18 },
                opacity: { duration: 0.2 },
              }}
              style={{ height: barHeight }}
              onMouseEnter={() => setHoveredCompany(company.name)}
              onMouseLeave={() => setHoveredCompany(null)}
            >
              <div className="bar-label">
                <span className="rank-badge" style={{ backgroundColor: `${company.color}20`, color: company.color }}>
                  {company.rank + 1}
                </span>
                <div className="company-info">
                  <CompanyLogo src={company.meta.logo} name={company.name} color={company.color} />
                  <span className="company-name">{company.name}</span>
                </div>
              </div>

              <div className="bar-track">
                <motion.div
                  className="bar-fill"
                  style={{
                    background: `linear-gradient(90deg, ${company.color} 0%, ${company.color}dd 100%)`,
                    boxShadow: hoveredCompany === company.name
                      ? `0 4px 24px ${company.color}50`
                      : `0 2px 8px ${company.color}20`
                  }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(company.value / maxValue) * 100}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                >
                  <span className="bar-value-inside">{company.value}</span>
                </motion.div>
              </div>

              {/* Hover Card */}
              <AnimatePresence>
                {hoveredCompany === company.name && (
                  <motion.div
                    className="hover-card glass-panel"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    <div className="hover-card-header">
                      <CompanyLogo src={company.meta.logo} name={company.name} color={company.color} />
                      <div className="hover-card-title">
                        <span className="hover-card-name">{company.name}</span>
                        <span
                          className="hover-card-category"
                          style={{ backgroundColor: `${company.color}20`, color: company.color }}
                        >
                          {categories.find((c) => c.id === company.category)?.name}
                        </span>
                      </div>
                    </div>
                    <p className="hover-card-desc">{company.meta.description}</p>
                    <div className="hover-card-stats">
                      <div className="hover-stat">
                        <span className="hover-stat-value">{company.meta.raised}</span>
                        <span className="hover-stat-label">Raised</span>
                      </div>
                      <div className="hover-stat">
                        <span className="hover-stat-value">{company.meta.founded}</span>
                        <span className="hover-stat-label">Founded</span>
                      </div>
                      <div className="hover-stat">
                        <span className="hover-stat-value">{company.value}</span>
                        <span className="hover-stat-label">Score</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <span>Data from Google Trends API</span>
          <span className="footer-divider">•</span>
          <span>Updated {new Date(realTrendsData.fetchedAt).toLocaleDateString()}</span>
        </div>
      </footer>
    </div>
  );
}
