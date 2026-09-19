export type UserCouponStatus = 'AVAILABLE' | 'USED' | 'EXPIRED' | 'INVALID'

export interface UserCoupon {
  id: number
  userId: number
  couponId: number
  orderId: number | null
  status: UserCouponStatus
  receivedAt: string
  usedAt: string | null
  expiresAt: string
}

export interface SendUserCouponInput {
  userId: number
  couponId: number
}

export const userCouponStatuses = [
  { value: 'AVAILABLE', label: '可使用' },
  { value: 'USED', label: '已使用' },
  { value: 'EXPIRED', label: '已过期' },
  { value: 'INVALID', label: '已失效' },
] as const
