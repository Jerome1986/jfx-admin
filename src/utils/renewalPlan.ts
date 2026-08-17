import type { RenewalPlanItemInput } from '@/types/renewalPlan'

type PricedPlanItem = Pick<RenewalPlanItemInput, 'unitPrice' | 'quantity'>

/** 汇总全部方案项目，并在金额边界统一保留两位小数。 */
export const calculateRenewalPlanPrice = (items: PricedPlanItem[] | null | undefined) =>
  Math.round(
    (items ?? []).reduce(
      (total, item) => total + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0,
    ) * 100,
  ) / 100
