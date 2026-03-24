import type { Company } from './data/companies';

export function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatARR(arrInMillions: number): string {
  if (arrInMillions >= 1000) return `$${(arrInMillions / 1000).toFixed(1)}B`;
  return `$${arrInMillions}M`;
}

export function formatARRPerEmployee(arrInThousands: number): string {
  if (arrInThousands >= 1000) return `$${(arrInThousands / 1000).toFixed(1)}M`;
  return `$${arrInThousands}K`;
}

export function formatValuation(valuationInBillions: number): string {
  if (valuationInBillions >= 1) return `$${valuationInBillions}B`;
  return `$${Math.round(valuationInBillions * 1000)}M`;
}

export function getEfficiencyColor(value: number): string {
  if (value >= 300) return '#22c55e';
  if (value >= 200) return '#f59e0b';
  return '#71717a';
}

export function getFundingStage(lastFunding: string): string {
  if (/public|ipo|nasdaq|nyse/i.test(lastFunding)) return 'Public';
  if (/acquired/i.test(lastFunding)) return 'Acquired';
  if (/seed/i.test(lastFunding)) return 'Seed';
  const seriesMatch = lastFunding.match(/Series\s+([A-Z])/i);
  if (seriesMatch) {
    const letter = seriesMatch[1].toUpperCase();
    if (letter <= 'B') return 'Series A-B';
    return 'Series C+';
  }
  return 'Other';
}

export function getRevenueMultiple(company: Company): string | null {
  if (!company.valuation || !company.arr) return null;
  const multiple = (company.valuation * 1000) / company.arr;
  return `${multiple.toFixed(1)}x`;
}

export function getRank(company: Company, allCompanies: Company[]): number {
  return (
    [...allCompanies]
      .filter(c => c.arr !== null)
      .sort((a, b) => (b.arrPerEmployee || 0) - (a.arrPerEmployee || 0))
      .findIndex(c => c.name === company.name) + 1
  );
}

export const LOGO_TOKEN = 'pk_Iw_EUyO3SUuLmOI4_D_2_Q';

export function getLogoUrl(domain: string, size: number = 64): string {
  return `https://img.logo.dev/${domain}?token=${LOGO_TOKEN}&format=png&size=${size}`;
}

export const DATA_LAST_UPDATED = '2026-03-23';
