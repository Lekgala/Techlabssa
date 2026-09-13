import type { AcademySettings, CourseTier } from '../types';

export function calculateTuitionBreakdown(tier: string, settings: Partial<Pick<AcademySettings, 'courseTierPricing' | 'flashSale'>>) {
  const prices: Record<string, number> = { STARTER: 1999, PROFESSIONAL: 3499, CAREER_ACCELERATOR: 4999 };
  const listPriceZAR = Object.hasOwn(prices, tier) ? (settings.courseTierPricing?.[tier as CourseTier]?.priceZAR ?? prices[tier]) : 0;
  const sale = settings.flashSale;
  const discountPercent = sale?.enabled && Number.isFinite(sale.discountPercent) && sale.discountPercent > 0 && sale.discountPercent < 100 && (!sale.targetTiers?.length || sale.targetTiers.includes(tier as CourseTier)) ? sale.discountPercent : 0;
  const amountZAR = Math.round(listPriceZAR * (1 - discountPercent / 100) * 100) / 100;
  return { amountZAR, listPriceZAR, discountZAR: Math.round((listPriceZAR - amountZAR) * 100) / 100, discountPercent };
}
