export type CouponStatus = 'DRAFT' | 'PUBLISHED' | 'DISABLED'
export type CouponScopeType = 'ALL' | 'RENOVATION' | 'PRODUCT'

export const couponScopes: { value: CouponScopeType; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'RENOVATION', label: '装修' },
  { value: 'PRODUCT', label: '商品' },
]

export interface CouponListParams {
  keyword?: string
  status?: CouponStatus
  pageNum: number
  pageSize: number
}

export interface CouponListResult {
  list: Coupon[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

export interface CouponInput {
  name: string
  amount: number
  threshold: number
  scopeType: CouponScopeType
  validFrom: string
  validTo: string
  totalQuantity: number
  perUserLimit: number
  status: CouponStatus
}

export interface Coupon extends Omit<CouponInput, 'amount' | 'threshold'> {
  id: number
  amount: number | string
  threshold: number | string
  issuedQuantity: number
  createdAt: string
  updatedAt: string
}

export const couponStatuses: { value: CouponStatus; label: string }[] = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'DISABLED', label: '已停用' },
]
