import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { track } from '@vercel/analytics';
import { companies, categories } from '../data/companies';
import { formatARRPerEmployee, getEfficiencyColor, updateMetaTag } from '../utils';

export function CalculatorPage() {
  const navigate = useNavigate();
  const [arr, setArr] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    document.title = 'Efficiency Calculator | Vertical Velocity';
    updateMetaTag('description', `See how your company ranks against ${ranked.length}+ vertical AI companies. Enter your ARR and headcount to calculate your efficiency score.`);
    window.scrollTo(0, 0);
    return () => {
      document.title = 'Vertical Velocity | ARR per Employee Rankings for Vertical AI';
    };
  }, []);

  const arrNum = Math.max(0, parseFloat(arr) || 0);
  const hcNum = Math.max(0, parseInt(headcount) || 0);
  const arrPerEmp = hcNum > 0 && arrNum > 0 ? Math.round((arrNum * 1000000) / hcNum / 1000) : 0;
  const effColor = getEfficiencyColor(arrPerEmp);

  const ranked = useMemo(() =>
    [...companies]
      .filter(c => c.arr !== null)
      .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0)),
    []
  );

  const rank = useMemo(() => {
    if (arrPerEmp <= 0) return 0;
    const position = ranked.findIndex(c => (c.arrPerEmployee || 0) < arrPerEmp);
    return position === -1 ? ranked.length + 1 : position + 1;
  }, [arrPerEmp, ranked]);

  const percentile = rank > 0 ? Math.ceil((rank / (ranked.length + 1)) * 100) : 0;

  const nearbyCompanies = useMemo(() => {
    if (rank <= 0) return [];
    const startIdx = Math.max(0, rank - 3);
    const endIdx = Math.min(ranked.length, rank + 2);
    return ranked.slice(startIdx, endIdx).map((c, i) => ({
      ...c,
      displayRank: startIdx + i + 1,
    }));
  }, [rank, ranked]);

  const handleCalculate = () => {
    if (arrNum > 0 && hcNum > 0) {
      setCalculated(true);
      track('calculator_use', { arr: arrNum, headcount: hcNum, arrPerEmp });
    }
  };

  let tierLabel = '';
  let tierDesc = '';
  if (arrPerEmp >= 300) {
    tierLabel = 'Elite Efficiency';
    tierDesc = 'Top tier — you\'re generating $300K+ per employee. This puts you among the most efficient vertical AI companies.';
  } else if (arrPerEmp >= 200) {
    tierLabel = 'Strong Efficiency';
    tierDesc = 'Solid performance — $200-300K per employee suggests a lean, well-run operation with strong product-market fit.';
  } else if (arrPerEmp >= 100) {
    tierLabel = 'Moderate Efficiency';
    tierDesc = 'Room to grow — typical for earlier-stage companies or those investing heavily in R&D ahead of revenue.';
  } else if (arrPerEmp > 0) {
    tierLabel = 'Early Stage';
    tierDesc = 'Common for pre-scale companies — efficiency typically improves as revenue grows faster than headcount.';
  }

  return (
    <div className="company-page">
      <div className="cp-container">
        <button className="cp-back-btn" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Rankings
        </button>

        <h1 style={{ marginTop: '24px', marginBottom: '8px' }}>Efficiency Calculator</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Enter your ARR and headcount to see how you'd rank among {ranked.length}+ vertical AI companies.
        </p>

        <div className="calc-form">
          <div className="calc-inputs">
            <div className="calc-input-group">
              <label>Annual Recurring Revenue ($M)</label>
              <input
                type="number"
                inputMode="decimal"
                value={arr}
                onChange={(e) => { setArr(e.target.value); setCalculated(false); }}
                placeholder="e.g., 50"
                min="0"
                step="0.1"
                className="calc-input"
              />
            </div>
            <div className="calc-input-group">
              <label>Number of Employees</label>
              <input
                type="number"
                inputMode="numeric"
                value={headcount}
                onChange={(e) => { setHeadcount(e.target.value); setCalculated(false); }}
                placeholder="e.g., 200"
                min="1"
                className="calc-input"
              />
            </div>
            <button className="calc-btn" onClick={handleCalculate} disabled={arrNum <= 0 || hcNum <= 0}>
              Calculate Rank
            </button>
          </div>
        </div>

        {calculated && arrPerEmp > 0 && (
          <motion.div
            className="calc-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="calc-hero" style={{ borderColor: effColor }}>
              <span className="calc-hero-value" style={{ color: effColor }}>
                {formatARRPerEmployee(arrPerEmp)}
              </span>
              <span className="calc-hero-label">ARR / Employee</span>
            </div>

            <div className="calc-stats">
              <div className="calc-stat">
                <span className="calc-stat-value" style={{ color: effColor }}>#{rank}</span>
                <span className="calc-stat-label">of {ranked.length + 1} companies</span>
              </div>
              <div className="calc-stat">
                <span className="calc-stat-value">Top {percentile}%</span>
                <span className="calc-stat-label">percentile</span>
              </div>
              <div className="calc-stat">
                <span className="calc-stat-value" style={{ color: effColor }}>{tierLabel}</span>
                <span className="calc-stat-label">{tierDesc}</span>
              </div>
            </div>

            {nearbyCompanies.length > 0 && (
              <div className="calc-nearby">
                <h3>Companies Near Your Rank</h3>
                <div className="calc-nearby-list">
                  {(() => {
                    const yourRow = (
                      <div key="your-company" className="calc-nearby-item calc-nearby-you" style={{ borderColor: effColor }}>
                        <span className="calc-nearby-rank" style={{ color: effColor }}>#{rank}</span>
                        <span className="calc-nearby-name" style={{ color: effColor }}>Your Company</span>
                        <span className="calc-nearby-cat">-</span>
                        <span className="calc-nearby-value" style={{ color: effColor }}>
                          {formatARRPerEmployee(arrPerEmp)}
                        </span>
                      </div>
                    );
                    let inserted = false;
                    const rows: React.ReactNode[] = [];
                    for (const c of nearbyCompanies) {
                      if (!inserted && c.displayRank >= rank) {
                        rows.push(yourRow);
                        inserted = true;
                      }
                      rows.push(
                        <div
                          key={c.name}
                          className="calc-nearby-item"
                          onClick={() => navigate(`/company/${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`)}
                        >
                          <span className="calc-nearby-rank">#{c.displayRank}</span>
                          <span className="calc-nearby-name">{c.name}</span>
                          <span className="calc-nearby-cat">{categories.find(cat => cat.id === c.category)?.name}</span>
                          <span className="calc-nearby-value" style={{ color: getEfficiencyColor(c.arrPerEmployee || 0) }}>
                            {formatARRPerEmployee(c.arrPerEmployee || 0)}
                          </span>
                        </div>
                      );
                    }
                    if (!inserted) rows.push(yourRow);
                    return rows;
                  })()}
                </div>
              </div>
            )}

            <div className="calc-cta">
              <p>Want to be listed on Vertical Velocity?</p>
              <button className="calc-cta-btn" onClick={() => navigate('/?submit=1')}>
                Submit Your Company
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
