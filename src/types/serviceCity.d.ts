export interface ServiceCity {
  /** 唯一标识 */
  id: number
  /** 名称 */
  name: string
  /** 城市编码 */
  code: string
  /** 排序值 */
  sort: number
  /** 是否启用 */
  status: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

export interface ServiceCityListParams {
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 搜索关键词 */
  keyword?: string
  /** 是否启用 */
  status?: boolean
}

export interface ServiceCityInput {
  /** 名称 */
  name: string
  /** 排序值 */
  sort?: number
  /** 是否启用 */
  status?: boolean
}

export type ServiceCityUpdateInput = Partial<ServiceCityInput>

export interface ServiceCityListResult {
  /** 查询结果列表 */
  list: ServiceCity[]
  /** 记录总数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}
