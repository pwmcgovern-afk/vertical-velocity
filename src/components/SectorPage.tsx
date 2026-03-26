import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { companies, categories } from '../data/companies';
import { EfficiencyChart } from './EfficiencyChart';
import {
  formatARR, formatARRPerEmployee, getEfficiencyColor,
  getFundingStage,
} from '../utils';

export function SectorPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const category = categories.find(c => c.id === categoryId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryId]);

  const sectorCompanies = useMemo(() =>
    companies.filter(c => c.category === categoryId && c.arr !== null),
    [categoryId]
  );

  const totalARR = useMemo(() =>
    sectorCompanies.reduce((sum, c) => sum + (c.arr || 0), 0),
    [sectorCompanies]
  );

  const avgARRPerEmp = useMemo(() => {
    if (sectorCompanies.length === 0) return 0;
    return Math.round(sectorCompanies.reduce((sum, c) => sum + (c.arrPerEmployee || 0), 0) / sectorCompanies.length);
  }, [sectorCompanies]);

  const topCompany = useMemo(() =>
    [...sectorCompanies].sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0))[0],
    [sectorCompanies]
  );

  const totalHeadcount = useMemo(() =>
    sectorCompanies.reduce((sum, c) => sum + c.headcount, 0),
    [sectorCompanies]
  );

  // Recent raises in this vertical
  const recentRaises = useMemo(() => {
    const monthOrder: Record<string, number> = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 12, 1);

    return sectorCompanies
      .map(c => {
        const match = c.lastFunding.match(/\((\w{3})\s+(\d{4})\)/);
        if (!match) return null;
        const [, month, year] = match;
        const yearNum = parseInt(year);
        const monthNum = monthOrder[month] || 0;
        const date = new Date(yearNum, monthNum - 1);
        if (date < cutoff) return null;
        return {
          name: c.name,
          round: c.lastFunding.replace(/\s*\([^)]+\)/, '').trim(),
          date: `${month} ${year}`,
          sortKey: yearNum * 100 + monthNum,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.sortKey - a.sortKey);
  }, [sectorCompanies]);

  // Stage breakdown
  const stageBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sectorCompanies.forEach(c => {
      const stage = getFundingStage(c.lastFunding);
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [sectorCompanies]);

  // Global rank of top company
  const globalRank = useMemo(() => {
    if (!topCompany) return 0;
    const allRanked = [...companies]
      .filter(c => c.arr !== null)
      .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));
    return allRanked.findIndex(c => c.name === topCompany.name) + 1;
  }, [topCompany]);

  if (!category) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="sector-page">
      <div className="sector-header">
        <button className="cp-back-btn" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          All Sectors
        </button>

        <div className="sector-title-row">
          <h1 className="sector-title" style={{ color: category.color }}>
            {category.name} AI
          </h1>
          <span className="sector-count">{sectorCompanies.length} companies</span>
        </div>

        <div className="sector-stats">
          <div className="sector-stat">
            <span className="sector-stat-value">{formatARR(totalARR)}</span>
            <span className="sector-stat-label">Total ARR</span>
          </div>
          <div className="sector-stat">
            <span className="sector-stat-value" style={{ color: getEfficiencyColor(avgARRPerEmp) }}>
              {formatARRPerEmployee(avgARRPerEmp)}
            </span>
            <span className="sector-stat-label">Avg ARR/Emp</span>
          </div>
          <div className="sector-stat">
            <span className="sector-stat-value">{totalHeadcount.toLocaleString()}</span>
            <span className="sector-stat-label">Total Employees</span>
          </div>
          {topCompany && (
            <div
              className="sector-stat sector-stat-clickable"
              onClick={() => navigate(`/company/${topCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`)}
            >
              <span className="sector-stat-value" style={{ color: getEfficiencyColor(topCompany.arrPerEmployee || 0) }}>
                {topCompany.name}
              </span>
              <span className="sector-stat-label">
                Most Efficient (#{globalRank})
              </span>
            </div>
          )}
        </div>

        {/* Stage breakdown */}
        <div className="sector-stages">
          {stageBreakdown.map(([stage, count]) => (
            <span key={stage} className="sector-stage-tag">
              {stage}: {count}
            </span>
          ))}
        </div>

        {/* Recent raises */}
        {recentRaises.length > 0 && (
          <div className="sector-recent">
            <h3 className="sector-recent-title">Recent Raises (Last 12 Months)</h3>
            <div className="sector-recent-list">
              {recentRaises.slice(0, 6).map((r, i) => (
                <div key={i} className="sector-recent-item">
                  <span className="sector-recent-name">{r.name}</span>
                  <span className="sector-recent-round">{r.round}</span>
                  <span className="sector-recent-date">{r.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EfficiencyChart defaultCategory={categoryId} />
    </div>
  );
}
