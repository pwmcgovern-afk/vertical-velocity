export interface ReportEntry {
  type: 'new' | 'update';
  company: string;
  detail: string;
}

export interface SectorStat {
  category: string;
  categoryName: string;
  count: number;
  totalARR: number;
  avgARRPerEmp: number;
  topCompany: string;
}

export interface MonthlyReport {
  month: string;
  title: string;
  date: string;
  totalCompanies: number;
  totalARR: number;
  avgARRPerEmp: number;
  entries: ReportEntry[];
  sectorStats: SectorStat[];
}

export const reports: MonthlyReport[] = [
  {
    month: 'march-2026',
    title: 'March 2026',
    date: '2026-03-26',
    totalCompanies: 82,
    totalARR: 13847,
    avgARRPerEmp: 198,
    entries: [
      { type: 'new', company: 'Deepgram', detail: 'Voice AI infrastructure platform. $22M ARR, 260 employees, $1.3B valuation. $130M Series C (Jan 2026).' },
      { type: 'update', company: 'Harvey', detail: 'New $200M round at $11B co-led by GIC & Sequoia (Mar 2026). 1,000+ clients, 25,000+ AI agents on platform.' },
      { type: 'update', company: 'Legora', detail: 'Funding corrected to $550M Series D at $5.55B (Mar 2026), led by Accel.' },
    ],
    sectorStats: [
      { category: 'healthcare', categoryName: 'Healthcare', count: 9, totalARR: 580, avgARRPerEmp: 219, topCompany: 'Commure' },
      { category: 'legal', categoryName: 'Legal', count: 10, totalARR: 1033, avgARRPerEmp: 179, topCompany: 'Clio' },
      { category: 'finance', categoryName: 'Finance', count: 7, totalARR: 1138, avgARRPerEmp: 180, topCompany: 'Ramp' },
      { category: 'sales', categoryName: 'Sales', count: 8, totalARR: 810, avgARRPerEmp: 154, topCompany: 'Gong' },
      { category: 'enterprise', categoryName: 'Enterprise', count: 5, totalARR: 567, avgARRPerEmp: 174, topCompany: 'Glean' },
      { category: 'defense', categoryName: 'Defense', count: 3, totalARR: 8680, avgARRPerEmp: 541, topCompany: 'Palantir' },
    ],
  },
];

export function getReport(month: string): MonthlyReport | undefined {
  return reports.find(r => r.month === month);
}

export function getLatestReport(): MonthlyReport | undefined {
  return reports[reports.length - 1];
}
