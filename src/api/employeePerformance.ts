import { request } from '@/utils/request'
import type {
  EmployeePerformanceParams,
  EmployeePerformanceResult,
} from '@/types/employeePerformance'
export const employeePerformanceApi = {
  list: (params: EmployeePerformanceParams) =>
    request<EmployeePerformanceResult>({
      method: 'GET',
      url: '/admin/employee/performance',
      params,
    }),
}
