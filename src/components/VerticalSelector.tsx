import { useState } from 'react';
import { categories, companies } from '../data/companies';

interface VerticalSelectorProps {
  onSelect: (categoryId: string) => void;
}

function getCategoryStats(categoryId: string) {
  const categoryCompanies = companies.filter(c => c.category === categoryId);
  const companiesWithARR = categoryCompanies.filter(c => c.arr !== null);
  const totalARR = companiesWithARR.reduce((sum, c) => sum + (c.arr || 0), 0);
  const avgEfficiency = companiesWithARR.length > 0
    ? Math.round(companiesWithARR.reduce((sum, c) => sum + (c.arrPerEmployee || 0), 0) / companiesWithARR.length)
    : 0;

  return {
    count: categoryCompanies.length,
    totalARR,
    avgEfficiency,
  };
}

function formatARR(arrInMillions: number): string {
  if (arrInMillions >= 1000) {
    return `$${(arrInMillions / 1000).toFixed(1)}B`;
  }
  return `$${arrInMillions}M`;
}

export function VerticalSelector({ onSelect }: VerticalSelectorProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="vertical-selector">
      <header className="selector-header">
        <h1>Vertical Velocity</h1>
        <p className="selector-subtitle">
          Explore ARR per employee across {companies.length} vertical AI companies
        </p>
        <div className="made-by">
          <span className="made-by-label">Made by</span>
          <span className="made-by-name">Pat McGovern</span>
          <div className="made-by-links">
            <a href="https://twitter.com/pw_mcgovern" target="_blank" rel="noopener noreferrer">@pw_mcgovern</a>
            <a href="https://linkedin.com/in/pwmcgovern" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      </header>

      <div className="selector-prompt">
        <h2>Select a vertical to explore</h2>
        <p>Click on a sector to see detailed company rankings</p>
      </div>

      <div className="vertical-grid">
        {categories.filter(cat => cat.id !== 'other').map(category => {
          const stats = getCategoryStats(category.id);
          const isHovered = hoveredCategory === category.id;

          return (
            <button
              key={category.id}
              className={`vertical-card ${isHovered ? 'hovered' : ''}`}
              style={{
                '--card-color': category.color,
                borderColor: isHovered ? category.color : undefined,
              } as React.CSSProperties}
              onClick={() => onSelect(category.id)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="vertical-card-header">
                <span className="vertical-card-dot" style={{ background: category.color }} />
                <span className="vertical-card-name">{category.name}</span>
              </div>
              <div className="vertical-card-stats">
                <div className="vertical-card-stat">
                  <span className="vertical-card-stat-value">{stats.count}</span>
                  <span className="vertical-card-stat-label">Companies</span>
                </div>
                <div className="vertical-card-stat">
                  <span className="vertical-card-stat-value">{formatARR(stats.totalARR)}</span>
                  <span className="vertical-card-stat-label">Total ARR</span>
                </div>
                <div className="vertical-card-stat">
                  <span className="vertical-card-stat-value">${stats.avgEfficiency}K</span>
                  <span className="vertical-card-stat-label">Avg ARR/Emp</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        className="view-all-btn"
        onClick={() => onSelect('all')}
      >
        View All Sectors
      </button>

      <footer className="selector-footer">
        <span>Data compiled from public sources. ARR figures are estimates.</span>
        <span className="logo-attribution">logos by <a href="https://logo.dev" target="_blank" rel="noopener noreferrer">logo.dev</a></span>
      </footer>
    </div>
  );
}
