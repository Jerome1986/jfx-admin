export interface EmployeePerformanceParams {
  month: string
  pageNum: number
  pageSize: number
  keyword?: string
  department?: string
  status?: boolean
}
export interface EmployeePerformance {
  employeeId: number
  employeeNo: string
  name: string
  mobile: string
  department: string | null
  position: string | null
  status: boolean
  isActive: boolean
  signedCustomerCount: number
  /** 已完工项目合同金额，单位元。 */
  signedAmount: string
  completedProjectCount: number
  averageSignedAmount: string
  companyRank: number | null
}
export interface EmployeePerformanceResult {
  month: string
  list: EmployeePerformance[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}
