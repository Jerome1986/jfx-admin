import type { CustomerUser } from './customerUser'

export interface Employee {
  id: number
  employeeNo: string
  userId: number
  position: string | null
  department: string | null
  serviceRegions: string[] | null
  hiredAt: string | null
  status: boolean
  createdAt: string
  updatedAt: string
  user: CustomerUser
}

export interface EmployeeListParams {
  pageNum: number
  pageSize: number
  keyword?: string
  department?: string
  status?: boolean
}

export interface EmployeeListResult {
  list: Employee[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

export interface CreateEmployeeParams {
  /** 兼容旧版接口；当前新增员工优先通过 mobile 关联用户。 */
  userId?: number
  mobile?: string
  nickname?: string
  realName?: string
  position?: string
  department?: string
  serviceRegions?: string[]
  hiredAt?: string
  status?: boolean
}

export type UpdateEmployeeParams = Pick<
  CreateEmployeeParams,
  'position' | 'department' | 'serviceRegions' | 'hiredAt' | 'status'
>
