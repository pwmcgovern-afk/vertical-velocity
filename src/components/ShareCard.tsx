import { categories, type Company } from '../data/companies';

function formatARRPerEmployee(arrInThousands: number): string {
  if (arrInThousands >= 1000) return `$${(arrInThousands / 1000).toFixed(1)}M`;
  return `$${arrInThousands}K`;
}

function getEfficiencyColor(value: number): string {
  if (value >= 300) return '#22c55e';
  if (value >= 200) return '#f59e0b';
  return '#71717a';
}

interface ShareCardProps {
  company: Company;
  rank: number;
  totalRanked: number;
  categoryRank: number;
  categoryName: string;
}

export function ShareCard({ company, rank, totalRanked, categoryRank, categoryName }: ShareCardProps) {
  const percentile = Math.ceil((rank / totalRanked) * 100);
  const effColor = getEfficiencyColor(company.arrPerEmployee || 0);
  const category = categories.find(c => c.id === company.category);
  const catColor = category?.color || '#71717a';

  let percentileLabel = '';
  if (percentile <= 5) percentileLabel = 'Top 5%';
  else if (percentile <= 10) percentileLabel = 'Top 10%';
  else if (percentile <= 15) percentileLabel = 'Top 15%';
  else if (percentile <= 25) percentileLabel = 'Top 25%';
  else if (percentile <= 50) percentileLabel = 'Top 50%';

  return (
    <div className="share-card">
      <div className="share-card-header">
        <div className="share-card-company">
          <img
            src={`https://img.logo.dev/${company.domain}?token=pk_Iw_EUyO3SUuLmOI4_D_2_Q&format=png&size=128`}
            alt={company.name}
            className="share-card-logo"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="share-card-name">{company.name}</span>
        </div>
        <span className="share-card-rank-badge" style={{ color: effColor }}>#{rank}</span>
      </div>

      <div className="share-card-title">
        #{rank} Most Efficient Vertical AI Company
      </div>

      <div className="share-card-hero" style={{ borderColor: effColor }}>
        <span className="share-card-hero-value" style={{ color: effColor }}>
          {formatARRPerEmployee(company.arrPerEmployee || 0)}
        </span>
        <span className="share-card-hero-label">ARR / Employee</span>
      </div>

      <div className="share-card-badges">
        {percentileLabel && (
          <span className="share-card-percentile" style={{ background: `${effColor}20`, color: effColor }}>
            {percentileLabel}
          </span>
        )}
        <span className="share-card-category-rank" style={{ background: `${catColor}20`, color: catColor }}>
          #{categoryRank} in {categoryName}
        </span>
      </div>

      <div className="share-card-footer">
        <div className="share-card-brand">
          <svg width="20" height="20" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="vv-sc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6"/>
                <stop offset="100%" stopColor="#1d4ed8"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="url(#vv-sc)"/>
            <g fill="white">
              <polygon points="3,8 8,8 11,20 14,8 17,8 12.5,24 9.5,24" opacity="0.8"/>
              <polygon points="15,8 20,8 23,20 26,8 29,8 24.5,24 21.5,24"/>
            </g>
          </svg>
          <span>Vertical Velocity</span>
        </div>
        <span className="share-card-url">verticalvelocity.co</span>
      </div>
    </div>
  );
}
