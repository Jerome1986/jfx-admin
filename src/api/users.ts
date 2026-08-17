import { request } from '@/utils/request'
import type {
  CustomerUser,
  UpdateUserParams,
  UserListParams,
  UserListResult,
} from '@/types/customerUser'

export const userApi = {
  list(params: UserListParams) {
    return request<UserListResult>({ method: 'GET', url: '/user', params })
  },
  detail(id: number) {
    return request<CustomerUser>({ method: 'GET', url: `/user/${id}` })
  },
  update(id: number, data: UpdateUserParams) {
    return request<CustomerUser>({ method: 'PATCH', url: `/user/${id}`, data })
  },
  disable(id: number) {
    return request<CustomerUser>({ method: 'DELETE', url: `/user/${id}` })
  },
}
