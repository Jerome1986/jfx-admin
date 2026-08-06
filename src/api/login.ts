import type { LoginResult } from '@/types/auth'
import { request } from '@/utils/request'

/**
 * 管理员登录
 * @param username
 * @param password
 */
export const adminLogin = (username: string, password: string) => {
  return request<LoginResult>({
    method: 'POST',
    url: '/admin/login',
    data: { username, password },
  })
}
