const googleTrends = require('google-trends-api');
const fs = require('fs');
const path = require('path');

// Companies to track - grouped by category
// Google Trends allows max 5 keywords per comparison
const companyGroups = [
  // Healthcare - Group 1
  {
    category: 'healthcare',
    color: '#10b981',
    companies: ['Nuance DAX', 'Abridge AI', 'Ambience Healthcare', 'SmarterDx', 'OpenEvidence']
  },
  // Healthcare - Group 2
  {
    category: 'healthcare',
    color: '#10b981',
    companies: ['Silna Health', 'Regard AI', 'Heidi Health', 'Qualio', 'Chai Discovery']
  },
  // Legal - Group 1
  {
    category: 'legal',
    color: '#6366f1',
    companies: ['Harvey AI', 'EvenUp AI', 'Spellbook AI']
  },
  // Legal - Group 2
  {
    category: 'legal',
    color: '#6366f1',
    companies: ['Legora AI', 'Crosby AI', 'Solve Intelligence']
  },
  // Finance
  {
    category: 'finance',
    color: '#f59e0b',
    companies: ['Hebbia AI', 'Rogo AI', 'Trove AI', 'Accordance AI']
  },
  // Home Services
  {
    category: 'home_services',
    color: '#ef4444',
    companies: ['Avoca AI', 'Rilla Voice', 'Topline Pro', 'Siro AI', 'Netic AI']
  },
  // Other vertical AI
  {
    category: 'other',
    color: '#8b5cf6',
    companies: ['Elise AI', 'Sixfold AI', 'Comulate', 'Strala AI', 'Pace AI']
  },
];

async function fetchComparisonGroup(keywords) {
  try {
    const results = await googleTrends.interestOverTime({
      keyword: keywords,
      startTime: new Date('2023-01-01'),
      endTime: new Date(),
      geo: 'US',
    });

    const data = JSON.parse(results);

    if (data.default && data.default.timelineData) {
      const timeline = data.default.timelineData.map(point => {
        const entry = {
          time: point.formattedTime,
          timestamp: point.time
        };
        keywords.forEach((kw, i) => {
          entry[kw] = point.value[i];
        });
        return entry;
      });

      return {
        timeline,
        averages: data.default.averages
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching group:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Fetching Google Trends data for vertical AI companies...\n');

  const results = {
    fetchedAt: new Date().toISOString(),
    companies: {},
    comparisons: []
  };

  for (const group of companyGroups) {
    console.log(`Fetching ${group.category}: ${group.companies.join(', ')}`);

    const comparison = await fetchComparisonGroup(group.companies);

    if (comparison) {
      results.comparisons.push({
        category: group.category,
        color: group.color,
        keywords: group.companies,
        data: comparison
      });

      for (const company of group.companies) {
        results.companies[company] = {
          category: group.category,
          color: group.color,
          trendData: comparison.timeline.map(point => ({
            time: point.time,
            value: point[company] || 0
          }))
        };
      }
    }

    // Rate limiting - Google Trends needs longer delays
    console.log('  Waiting 5s before next request...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'realTrends.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\nSaved to ${outputPath}`);
  console.log(`Total companies: ${Object.keys(results.companies).length}`);
}

main().catch(console.error);
