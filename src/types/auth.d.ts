/** 后台管理角色 */
export type AdminRole = 'ADMIN' | 'MANAGER' | 'STAFF'

/** 后台管理员信息 */
export interface AdminInfo {
  /** 管理员唯一标识 */
  id: number
  /** 管理员登录账号 */
  username: string
  /** 管理员角色 */
  role: AdminRole
}

/** 管理员登录结果 */
export interface LoginResult {
  /** 登录身份令牌 */
  token: string
  /** 当前登录管理员信息 */
  userInfo: AdminInfo
}
