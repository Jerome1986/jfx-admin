/** 按单位计价的商品施工服务。 */
export interface ConstructionService {
  /** 唯一标识 */
  id: number
  /** 名称 */
  name: string
  /** 详细说明 */
  description: string | null
  /** 计价单位 */
  unit: string
  /** 单位价格 */
  unitPrice: number | string
  /** 图片地址 */
  image: string | null
  /** 是否启用 */
  isEnabled: boolean
  /** 排序值 */
  sort: number
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 商品服务列表分页参数。 */
export interface ConstructionServiceListParams {
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
}

/** 商品服务分页结果。 */
export interface ConstructionServiceListResult {
  /** 查询结果列表 */
  list: ConstructionService[]
  /** 记录总数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}

/** 新增或编辑商品服务参数。 */
export interface ConstructionServiceInput {
  /** 名称 */
  name: string
  /** 详细说明 */
  description?: string
  /** 计价单位 */
  unit: string
  /** 单位价格 */
  unitPrice: number
  /** 图片地址 */
  image?: string
  /** 是否启用 */
  isEnabled: boolean
  /** 排序值 */
  sort: number
}

/** 编辑商品服务参数，后端允许按需更新字段。 */
export type ConstructionServiceUpdateInput = Partial<ConstructionServiceInput>
