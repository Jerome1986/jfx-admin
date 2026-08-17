import { request } from '@/utils/request'
import type {
  AddressInput,
  AddressListResult,
  ServiceAddress,
  UpdateAddressInput,
} from '@/types/address'

export const addressApi = {
  create: (data: AddressInput) =>
    request<ServiceAddress>({ method: 'POST', url: '/address', data }),
  list: () => request<ServiceAddress[] | AddressListResult>({ method: 'GET', url: '/address' }),
  detail: (id: number) => request<ServiceAddress>({ method: 'GET', url: `/address/${id}` }),
  update: (id: number, data: UpdateAddressInput) =>
    request<ServiceAddress>({ method: 'PATCH', url: `/address/${id}`, data }),
  remove: (id: number) => request<unknown>({ method: 'DELETE', url: `/address/${id}` }),
}
