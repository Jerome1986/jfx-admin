export type CustomerUserRole = 'CUSTOMER' | 'EMPLOYEE'

export interface CustomerUser {
  id: number
  userNo: string
  role: CustomerUserRole
  mobile: string
  openid: string | null
  nickname: string | null
  realName: string | null
  avatar: string | null
  source: string | null
  city: string | null
  tags: string[] | null
  points: number
  totalPointsEarned: number
  totalPointsUsed: number
  status: boolean
  createdAt: string
  updatedAt: string
}

export interface UserListParams {
  pageNum: number
  pageSize: number
  keyword?: string
  role?: CustomerUserRole
  status?: boolean
}

export interface UserListResult {
  list: CustomerUser[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

export interface UpdateUserParams {
  role?: CustomerUserRole
  mobile?: string
  nickname?: string
  realName?: string
  avatar?: string
  source?: string
  city?: string
  tags?: string[]
  status?: boolean
}
