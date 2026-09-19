import { request } from '@/utils/request'
import type { SendUserCouponInput, UserCoupon } from '@/types/userCoupon'

export const userCouponApi = {
  // 给指定用户发放一张优惠券。
  sendUser: (data: SendUserCouponInput) =>
    request<UserCoupon>({ method: 'POST', url: '/user-coupon/sendUser', data }),
  // 获取全部发放记录，接口不接收筛选和分页参数。
  list: () => request<UserCoupon[]>({ method: 'GET', url: '/user-coupon' }),
}
