import type { CustomerUser } from './customerUser'

export interface Employee {
  /** 唯一标识 */
  id: number
  /** 员工编号 */
  employeeNo: string
  /** 关联用户标识 */
  userId: number
  /** 岗位 */
  position: string | null
  /** 所属部门 */
  department: string | null
  /** 服务区域列表 */
  serviceRegions: string[] | null
  /** 入职时间 */
  hiredAt: string | null
  /** 是否在职 */
  status: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 关联用户信息 */
  user: CustomerUser
}

export interface EmployeeListParams {
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 搜索关键词 */
  keyword?: string
  /** 所属部门 */
  department?: string
  /** 是否在职 */
  status?: boolean
}

export interface EmployeeListResult {
  /** 查询结果列表 */
  list: Employee[]
  /** 记录总数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}

export interface CreateEmployeeParams {
  /** 兼容旧版接口；当前新增员工优先通过 mobile 关联用户。 */
  userId?: number
  /** 手机号码 */
  mobile?: string
  /** 用户昵称 */
  nickname?: string
  /** 真实姓名 */
  realName?: string
  /** 岗位 */
  position?: string
  /** 所属部门 */
  department?: string
  /** 服务区域列表 */
  serviceRegions?: string[]
  /** 入职时间 */
  hiredAt?: string
  /** 是否在职 */
  status?: boolean
}

export type UpdateEmployeeParams = Pick<
  CreateEmployeeParams,
  'position' | 'department' | 'serviceRegions' | 'hiredAt' | 'status'
>
