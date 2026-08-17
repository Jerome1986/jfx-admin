import { request } from '@/utils/request'
import type {
  CreateEmployeeParams,
  Employee,
  EmployeeListParams,
  EmployeeListResult,
  UpdateEmployeeParams,
} from '@/types/employee'

export const employeeApi = {
  // 分页查询员工列表。
  list: (params: EmployeeListParams) =>
    request<EmployeeListResult>({ method: 'GET', url: '/employee', params }),
  // 根据员工档案 ID 查询详情。
  detail: (id: number) => request<Employee>({ method: 'GET', url: `/employee/${id}` }),
  // 新增员工并关联或创建用户。
  create: (data: CreateEmployeeParams) =>
    request<Employee>({ method: 'POST', url: '/employee', data }),
  // 更新员工档案中的可编辑信息。
  update: (id: number, data: UpdateEmployeeParams) =>
    request<Employee>({ method: 'PATCH', url: `/employee/${id}`, data }),
  // 删除员工档案并恢复关联用户角色。
  remove: (id: number) => request<void>({ method: 'DELETE', url: `/employee/${id}` }),
}
