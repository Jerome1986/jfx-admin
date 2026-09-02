import { request } from '@/utils/request'
import type {
  ServiceOutlet,
  ServiceOutletInput,
  ServiceOutletListParams,
  ServiceOutletListResult,
  ServiceOutletUpdateInput,
} from '@/types/serviceOutlet'

const url = '/service-outlet'

export const serviceOutletApi = {
  list: (params: ServiceOutletListParams) =>
    request<ServiceOutletListResult>({ method: 'GET', url, params }),
  detail: (id: number) => request<ServiceOutlet>({ method: 'GET', url: `${url}/${id}` }),
  create: (data: ServiceOutletInput) => request<ServiceOutlet>({ method: 'POST', url, data }),
  update: (id: number, data: ServiceOutletUpdateInput) =>
    request<ServiceOutlet>({ method: 'PATCH', url: `${url}/${id}`, data }),
  remove: (id: number) => request<ServiceOutlet>({ method: 'DELETE', url: `${url}/${id}` }),
}
