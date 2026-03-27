import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { companies, categories, getCompanySlug, type Company } from '../data/companies';
import { formatARR, formatARRPerEmployee, formatValuation } from '../utils';

interface ScatterChartProps {
  selectedCategories: string[];
  onCategoryChange: (cats: string[]) => void;
}

export function ScatterChart({ selectedCategories, onCategoryChange }: ScatterChartProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredCompany, setHoveredCompany] = useState<Company | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const companiesWithData = useMemo(() =>
    companies.filter(c => c.arr !== null && c.headcount > 0),
    []
  );

  const filteredCompanies = useMemo(() =>
    companiesWithData.filter(c => selectedCategories.includes(c.category)),
    [companiesWithData, selectedCategories]
  );

  // Chart dimensions
  const width = 960;
  const height = 540;
  const margin = { top: 40, right: 60, bottom: 60, left: 70 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Scales (log for better distribution)
  const maxHeadcount = filteredCompanies.length > 0 ? Math.max(...filteredCompanies.map(c => c.headcount)) : 100;
  const maxARR = filteredCompanies.length > 0 ? Math.max(...filteredCompanies.map(c => c.arr || 0)) : 100;

  const xScale = useCallback((val: number) => {
    const logMin = Math.log10(10);
    const logMax = Math.log10(Math.max(maxHeadcount * 1.3, 100));
    const logVal = Math.log10(Math.max(val, 10));
    return margin.left + ((logVal - logMin) / (logMax - logMin)) * plotW;
  }, [maxHeadcount, plotW, margin.left]);

  const yScale = useCallback((val: number) => {
    const logMin = Math.log10(1);
    const logMax = Math.log10(Math.max(maxARR * 1.5, 10));
    const logVal = Math.log10(Math.max(val, 1));
    return margin.top + plotH - ((logVal - logMin) / (logMax - logMin)) * plotH;
  }, [maxARR, plotH, margin.top]);

  // Bubble size based on valuation
  const maxVal = Math.max(1, ...filteredCompanies.map(c => c.valuation || 0));
  const bubbleScale = (val: number | null) => {
    if (!val) return 6;
    return Math.max(6, Math.min(28, 6 + (val / maxVal) * 22));
  };

  // Grid lines
  const xTicks = [10, 50, 100, 500, 1000, 5000].filter(t => t <= maxHeadcount * 1.5);
  const yTicks = [1, 5, 10, 50, 100, 500, 1000, 5000].filter(t => t <= maxARR * 1.5);

  // Efficiency reference lines (ARR/emp in $K)
  const efficiencyLines = [100, 300, 500];

  const toggleCategory = (catId: string) => {
    if (selectedCategories.length === 1 && selectedCategories[0] === catId) {
      onCategoryChange(categories.map(c => c.id));
    } else {
      onCategoryChange([catId]);
    }
  };

  // Position tooltip relative to the container
  const handleMouseEnter = useCallback((company: Company, cx: number, cy: number) => {
    setHoveredCompany(company);
    const svg = svgRef.current;
    const container = containerRef.current;
    if (svg && container) {
      const rect = svg.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const svgX = (cx / width) * rect.width + (rect.left - containerRect.left);
      const svgY = (cy / height) * rect.height + (rect.top - containerRect.top);

      const tooltipW = 200;
      const tooltipH = 120;
      const clampedX = Math.min(svgX + 16, containerRect.width - tooltipW - 8);
      const clampedY = Math.max(8, Math.min(svgY - 10, containerRect.height - tooltipH - 8));

      setTooltipPos({ x: clampedX, y: clampedY });
    }
  }, [width, height]);

  return (
    <div className="scatter-chart">
      <div className="scatter-header">
        <h2>ARR vs. Headcount</h2>
        <p className="scatter-subtitle">Bubble size = valuation. Diagonal lines = ARR/employee efficiency.</p>
      </div>

      <div className="scatter-filters">
        <button
          className={`category-btn all-btn ${selectedCategories.length === categories.length ? 'active' : ''}`}
          onClick={() => onCategoryChange(categories.map(c => c.id))}
        >
          <span className="category-btn-label">All</span>
        </button>
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

      <div className="scatter-container" ref={containerRef}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="scatter-svg"
          onClick={() => setHoveredCompany(null)}
        >
          <defs>
            <filter id="bubble-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="bubble-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {xTicks.map(tick => (
            <line
              key={`x-${tick}`}
              x1={xScale(tick)}
              y1={margin.top}
              x2={xScale(tick)}
              y2={margin.top + plotH}
              className="scatter-grid"
            />
          ))}
          {yTicks.map(tick => (
            <line
              key={`y-${tick}`}
              x1={margin.left}
              y1={yScale(tick)}
              x2={margin.left + plotW}
              y2={yScale(tick)}
              className="scatter-grid"
            />
          ))}

          {/* Efficiency reference lines (diagonal) */}
          {efficiencyLines.map(eff => {
            const points: [number, number][] = [];
            for (let h = 10; h <= maxHeadcount * 2; h *= 1.5) {
              const arr = (eff * h) / 1000;
              if (arr >= 1 && arr <= maxARR * 2) {
                points.push([xScale(h), yScale(arr)]);
              }
            }
            if (points.length < 2) return null;
            const d = `M ${points.map(p => p.join(',')).join(' L ')}`;
            return (
              <g key={`eff-${eff}`}>
                <path d={d} className="scatter-eff-line" />
                <text
                  x={points[points.length - 1][0] + 4}
                  y={points[points.length - 1][1] - 4}
                  className="scatter-eff-label"
                >
                  ${eff}K/emp
                </text>
              </g>
            );
          })}

          {/* Axis labels */}
          {xTicks.map(tick => (
            <text
              key={`xl-${tick}`}
              x={xScale(tick)}
              y={margin.top + plotH + 20}
              className="scatter-axis-label"
              textAnchor="middle"
            >
              {tick >= 1000 ? `${tick / 1000}K` : tick}
            </text>
          ))}
          {yTicks.map(tick => (
            <text
              key={`yl-${tick}`}
              x={margin.left - 12}
              y={yScale(tick) + 4}
              className="scatter-axis-label"
              textAnchor="end"
            >
              ${tick >= 1000 ? `${tick / 1000}B` : `${tick}M`}
            </text>
          ))}

          {/* Axis titles */}
          <text
            x={margin.left + plotW / 2}
            y={height - 8}
            className="scatter-axis-title"
            textAnchor="middle"
          >
            Headcount
          </text>
          <text
            x={14}
            y={margin.top + plotH / 2}
            className="scatter-axis-title"
            textAnchor="middle"
            transform={`rotate(-90, 14, ${margin.top + plotH / 2})`}
          >
            ARR
          </text>

          {/* Data points */}
          {filteredCompanies.map(company => {
            const cx = xScale(company.headcount);
            const cy = yScale(company.arr || 0);
            const r = bubbleScale(company.valuation);
            const isHovered = hoveredCompany?.name === company.name;

            return (
              <g key={company.name}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? r + 3 : r}
                  fill={company.color}
                  fillOpacity={isHovered ? 0.9 : 0.7}
                  stroke={isHovered ? company.color : 'transparent'}
                  strokeWidth={2}
                  className={`scatter-dot${isHovered ? ' scatter-dot-active' : ''}`}
                  filter={(company.arrPerEmployee || 0) >= 300 ? (isHovered ? 'url(#bubble-glow-strong)' : 'url(#bubble-glow)') : undefined}
                  onMouseEnter={() => handleMouseEnter(company, cx, cy)}
                  onMouseLeave={() => setHoveredCompany(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isHovered) {
                      navigate(`/company/${getCompanySlug(company.name)}`);
                    } else {
                      handleMouseEnter(company, cx, cy);
                    }
                  }}
                  style={{ cursor: 'pointer', animationDelay: `${filteredCompanies.indexOf(company) * 15}ms` }}
                />
                {r > 14 && !isHovered ? (
                  <text
                    x={cx}
                    y={cy + 1}
                    className="scatter-dot-label-inside"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {company.name.length > 10 ? company.name.slice(0, 9) + '..' : company.name}
                  </text>
                ) : (
                  <text
                    x={cx + r + 4}
                    y={cy + 3}
                    className="scatter-dot-label-outside"
                    textAnchor="start"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {company.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredCompany && (
          <div
            className="scatter-tooltip"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              borderTop: `3px solid ${hoveredCompany.color}`,
            }}
          >
            <div className="scatter-tooltip-name">{hoveredCompany.name}</div>
            <div className="scatter-tooltip-row">
              <span>ARR/Emp:</span>
              <span style={{ color: 'var(--success)' }}>{formatARRPerEmployee(hoveredCompany.arrPerEmployee || 0)}</span>
            </div>
            <div className="scatter-tooltip-row">
              <span>ARR:</span>
              <span>{formatARR(hoveredCompany.arr || 0)}</span>
            </div>
            <div className="scatter-tooltip-row">
              <span>Headcount:</span>
              <span>{hoveredCompany.headcount.toLocaleString()}</span>
            </div>
            {hoveredCompany.valuation && (
              <div className="scatter-tooltip-row">
                <span>Valuation:</span>
                <span>{formatValuation(hoveredCompany.valuation)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="scatter-legend">
        <span className="scatter-legend-item">Bubble size = valuation</span>
        <span className="scatter-legend-divider">|</span>
        <span className="scatter-legend-item">Diagonal lines = efficiency thresholds</span>
        <span className="scatter-legend-divider">|</span>
        <span className="scatter-legend-item">Click a company to view details</span>
      </div>
    </div>
  );
}
