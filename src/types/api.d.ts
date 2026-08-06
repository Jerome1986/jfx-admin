/** 后端统一接口响应结构 */
export interface ApiResponse<T = unknown> {
  /** 业务状态码 */
  code: number
  /** 接口响应提示信息 */
  message: string
  /** 接口返回的业务数据 */
  data: T
}
