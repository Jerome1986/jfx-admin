/** 后台管理角色 */
export type AdminRole = 'ADMIN' | 'MANAGER' | 'STAFF'

export interface AdminInfo {
  id: number
  username: string
  role: AdminRole
}

export interface LoginResult {
  token: string
  userInfo: AdminInfo
}
