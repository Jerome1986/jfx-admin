export type CustomerUserRole = 'CUSTOMER' | 'EMPLOYEE'

export interface CustomerUser {
  /** 唯一标识 */
  id: number
  /** 用户编号 */
  userNo: string
  /** 用户角色 */
  role: CustomerUserRole
  /** 手机号码 */
  mobile: string
  /** 微信用户标识 */
  openid: string | null
  /** 用户昵称 */
  nickname: string | null
  /** 真实姓名 */
  realName: string | null
  /** 头像地址 */
  avatar: string | null
  /** 来源渠道 */
  source: string | null
  /** 所在城市 */
  city: string | null
  /** 标签列表 */
  tags: string[] | null
  /** 当前可用积分 */
  points: number
  /** 累计获得积分 */
  totalPointsEarned: number
  /** 累计使用积分 */
  totalPointsUsed: number
  /** 账号是否启用 */
  status: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

export interface UserListParams {
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 搜索关键词 */
  keyword?: string
  /** 用户角色 */
  role?: CustomerUserRole
  /** 账号是否启用 */
  status?: boolean
}

export interface UserListResult {
  /** 查询结果列表 */
  list: CustomerUser[]
  /** 记录总数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}

export interface UpdateUserParams {
  /** 用户角色 */
  role?: CustomerUserRole
  /** 手机号码 */
  mobile?: string
  /** 用户昵称 */
  nickname?: string
  /** 真实姓名 */
  realName?: string
  /** 头像地址 */
  avatar?: string
  /** 来源渠道 */
  source?: string
  /** 所在城市 */
  city?: string
  /** 标签列表 */
  tags?: string[]
  /** 账号是否启用 */
  status?: boolean
}
