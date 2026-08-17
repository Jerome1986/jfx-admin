import { request } from '@/utils/request'
import type { Banner, BannerInput, BannerListResult } from '@/types/banner'

export const bannerApi = {
  list() {
    return request<Banner[] | BannerListResult>({ method: 'GET', url: '/banner' })
  },
  create(data: BannerInput) {
    return request<Banner>({ method: 'POST', url: '/banner', data })
  },
  update(id: number, data: BannerInput) {
    return request<Banner>({ method: 'PATCH', url: `/banner/${id}`, data })
  },
  remove(id: number) {
    return request<void>({ method: 'DELETE', url: `/banner/${id}` })
  },
}
