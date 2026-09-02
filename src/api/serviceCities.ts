import { request } from '@/utils/request'
import type {
  ServiceCity,
  ServiceCityInput,
  ServiceCityListParams,
  ServiceCityListResult,
  ServiceCityUpdateInput,
} from '@/types/serviceCity'

const url = '/service-city'

export const serviceCityApi = {
  list: (params: ServiceCityListParams) =>
    request<ServiceCityListResult>({ method: 'GET', url, params }),
  enabled: () => request<ServiceCity[]>({ method: 'GET', url: `${url}/enabled` }),
  detail: (id: number) => request<ServiceCity>({ method: 'GET', url: `${url}/${id}` }),
  create: (data: ServiceCityInput) => request<ServiceCity>({ method: 'POST', url, data }),
  update: (id: number, data: ServiceCityUpdateInput) =>
    request<ServiceCity>({ method: 'PATCH', url: `${url}/${id}`, data }),
  remove: (id: number) => request<ServiceCity>({ method: 'DELETE', url: `${url}/${id}` }),
}
