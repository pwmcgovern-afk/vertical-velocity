import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { companies, categories } from '../data/companies';
import { ShareCard } from './ShareCard';

export function CardPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const company = companies.find(c =>
    c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug
  );

  const ranked = [...companies]
    .filter(c => c.arr !== null)
    .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0));

  const totalRanked = ranked.length;
  const rank = company ? ranked.findIndex(c => c.name === company.name) + 1 : 0;

  const category = company ? categories.find(c => c.id === company.category) : null;
  const categoryCompanies = company
    ? ranked.filter(c => c.category === company.category)
    : [];
  const categoryRank = company
    ? categoryCompanies.findIndex(c => c.name === company.name) + 1
    : 0;

  useEffect(() => {
    if (company) {
      document.title = `${company.name} - #${rank} Most Efficient | Vertical Velocity`;
    }
    return () => {
      document.title = 'Vertical Velocity | ARR per Employee Rankings for Vertical AI';
    };
  }, [company, rank]);

  if (!company) {
    return (
      <div className="card-page">
        <p style={{ color: 'var(--text-tertiary)' }}>Company not found.</p>
      </div>
    );
  }

  return (
    <div className="card-page">
      <ShareCard
        company={company}
        rank={rank}
        totalRanked={totalRanked}
        categoryRank={categoryRank}
        categoryName={category?.name || 'Other'}
      />
      <a
        href={`/company/${slug}`}
        className="card-page-link"
        onClick={(e) => { e.preventDefault(); navigate(`/company/${slug}`); }}
      >
        View full profile &rarr;
      </a>
    </div>
  );
}
