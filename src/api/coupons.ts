import { request } from '@/utils/request'
import type { Coupon, CouponInput, CouponListParams, CouponListResult } from '@/types/coupon'

export const couponApi = {
  list: (params: CouponListParams) =>
    request<CouponListResult>({ method: 'GET', url: '/coupon', params }),
  detail: (id: number) => request<Coupon>({ method: 'GET', url: `/coupon/${id}` }),
  create: (data: CouponInput) => request<Coupon>({ method: 'POST', url: '/coupon/add', data }),
  update: (id: number, data: CouponInput) =>
    request<Coupon>({ method: 'PATCH', url: `/coupon/${id}`, data }),
  remove: (id: number) => request<Coupon>({ method: 'DELETE', url: `/coupon/${id}` }),
}
