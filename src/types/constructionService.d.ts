/** 按单位计价的商品施工服务。 */
export interface ConstructionService {
  id: number
  name: string
  description: string | null
  unit: string
  unitPrice: number | string
  image: string | null
  isEnabled: boolean
  sort: number
  createdAt: string
  updatedAt: string
}

/** 商品服务列表分页参数。 */
export interface ConstructionServiceListParams {
  pageNum: number
  pageSize: number
}

/** 商品服务分页结果。 */
export interface ConstructionServiceListResult {
  list: ConstructionService[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

/** 新增或编辑商品服务参数。 */
export interface ConstructionServiceInput {
  name: string
  description?: string
  unit: string
  unitPrice: number
  image?: string
  isEnabled: boolean
  sort: number
}

/** 编辑商品服务参数，后端允许按需更新字段。 */
export type ConstructionServiceUpdateInput = Partial<ConstructionServiceInput>
