const https = require('https');
const fs = require('fs');
const path = require('path');

// Original company list from the project
const companies = [
  // Healthcare
  { name: 'Nuance DAX', domain: 'nuance.com', category: 'healthcare' },
  { name: 'Abridge', domain: 'abridge.com', category: 'healthcare' },
  { name: 'Ambience Healthcare', domain: 'ambiencehealthcare.com', category: 'healthcare' },
  { name: 'SmarterDx', domain: 'smarterdx.com', category: 'healthcare' },
  { name: 'OpenEvidence', domain: 'openevidence.com', category: 'healthcare' },
  { name: 'Silna Health', domain: 'silnahealth.com', category: 'healthcare' },
  { name: 'Regard', domain: 'withregard.com', category: 'healthcare' },
  { name: 'Heidi Health', domain: 'heidihealth.com', category: 'healthcare' },
  { name: 'Qualio', domain: 'qualio.com', category: 'healthcare' },
  { name: 'Chai Discovery', domain: 'chaidiscovery.com', category: 'healthcare' },

  // Legal
  { name: 'Harvey', domain: 'harvey.ai', category: 'legal' },
  { name: 'EvenUp', domain: 'evenuplaw.com', category: 'legal' },
  { name: 'Spellbook', domain: 'spellbook.legal', category: 'legal' },
  { name: 'Legora', domain: 'legora.ai', category: 'legal' },
  { name: 'Crosby', domain: 'crosbyai.com', category: 'legal' },
  { name: 'Solve Intelligence', domain: 'solveintelligence.com', category: 'legal' },

  // Finance
  { name: 'Hebbia', domain: 'hebbia.ai', category: 'finance' },
  { name: 'Rogo', domain: 'rogodata.com', category: 'finance' },
  { name: 'Trove', domain: 'trove.ai', category: 'finance' },
  { name: 'Accordance', domain: 'accordanceai.com', category: 'finance' },

  // Home Services
  { name: 'Avoca', domain: 'avoca.ai', category: 'home_services' },
  { name: 'Rilla Voice', domain: 'rillavoice.com', category: 'home_services' },
  { name: 'Topline Pro', domain: 'toplinepro.com', category: 'home_services' },
  { name: 'Siro', domain: 'siro.ai', category: 'home_services' },
  { name: 'Netic', domain: 'netic.ai', category: 'home_services' },

  // Other
  { name: 'Elise AI', domain: 'eliseai.com', category: 'other' },
  { name: 'Sixfold', domain: 'sixfold.ai', category: 'other' },
  { name: 'Comulate', domain: 'comulate.com', category: 'other' },
  { name: 'Strala', domain: 'strala.ai', category: 'other' },
  { name: 'Pace', domain: 'paceai.co', category: 'other' },
];

const categoryColors = {
  healthcare: '#10b981',
  legal: '#6366f1',
  finance: '#f59e0b',
  home_services: '#ef4444',
  other: '#8b5cf6',
};

function fetchSimilarWebData(domain) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'data.similarweb.com',
      path: `/api/v1/data?domain=${domain}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse response for ${domain}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Fetching SimilarWeb traffic data for vertical AI companies...\n');

  const results = {
    fetchedAt: new Date().toISOString(),
    companies: {}
  };

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(`[${i + 1}/${companies.length}] Fetching ${company.name} (${company.domain})...`);

    try {
      const data = await fetchSimilarWebData(company.domain);

      // Extract the key metrics
      const latestMonth = data.EstimatedMonthlyVisits
        ? Object.entries(data.EstimatedMonthlyVisits).sort((a, b) => b[0].localeCompare(a[0]))[0]
        : null;

      results.companies[company.name] = {
        domain: company.domain,
        category: company.category,
        color: categoryColors[company.category],
        monthlyVisits: latestMonth ? latestMonth[1] : 0,
        globalRank: data.GlobalRank?.Rank || null,
        usRank: data.CountryRank?.Rank || null,
        categoryRank: data.CategoryRank?.Rank || null,
        categoryName: data.Category || null,
        bounceRate: parseFloat(data.Engagments?.BounceRate) || null,
        pagesPerVisit: parseFloat(data.Engagments?.PagePerVisit) || null,
        avgVisitDuration: parseFloat(data.Engagments?.TimeOnSite) || null,
        trafficSources: data.TrafficSources || null,
        topCountries: data.TopCountryShares?.slice(0, 5) || [],
        estimatedMonthlyVisits: data.EstimatedMonthlyVisits || {},
        description: data.Description || '',
        snapshotDate: data.SnapshotDate || null,
      };

      console.log(`   ✓ ${latestMonth ? latestMonth[1].toLocaleString() : 'N/A'} monthly visits, Rank #${data.GlobalRank?.Rank || 'N/A'}`);

    } catch (error) {
      console.log(`   ✗ Failed: ${error.message}`);
      results.companies[company.name] = {
        domain: company.domain,
        category: company.category,
        color: categoryColors[company.category],
        monthlyVisits: 0,
        error: error.message,
      };
    }

    // Rate limiting - wait between requests
    if (i < companies.length - 1) {
      await sleep(2000);
    }
  }

  // Save results
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'trafficData.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n✓ Saved to ${outputPath}`);
  console.log(`Total companies: ${Object.keys(results.companies).length}`);

  // Print summary sorted by traffic
  console.log('\n--- Top Companies by Monthly Visits ---');
  Object.entries(results.companies)
    .filter(([_, data]) => data.monthlyVisits > 0)
    .sort((a, b) => b[1].monthlyVisits - a[1].monthlyVisits)
    .slice(0, 15)
    .forEach(([name, data], i) => {
      console.log(`${i + 1}. ${name}: ${data.monthlyVisits.toLocaleString()} visits`);
    });
}

main().catch(console.error);
