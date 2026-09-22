import { request } from '@/utils/request'
import type { ArrangeInstallationParams, OrderListParams, OrderListResult } from '@/types/order'

export const orderApi = {
  list: (query: OrderListParams) =>
    request<OrderListResult>({
      method: 'GET',
      url: '/order/all',
      params: {
        ...query,
        keyWords: query.keyWords?.trim() || undefined,
        pageNum: String(query.pageNum),
        pageSize: String(query.pageSize),
      },
    }),
  cancel: (id: number) => request<unknown>({ method: 'PATCH', url: `/order/${id}/cancel` }),
  arrangeInstallation: (id: number, data: ArrangeInstallationParams) =>
    request<null>({ method: 'PATCH', url: `/order/${id}/installation`, data }),
  completeInstallation: (id: number) =>
    request<null>({ method: 'PATCH', url: `/order/${id}/complete` }),
  setAutoCompletion: (id: number, paused: boolean) =>
    request<null>({ method: 'PATCH', url: `/order/${id}/auto-completion`, data: { paused } }),
}
