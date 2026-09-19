/** 商品分类 */
export interface ProductCategory {
  /** 唯一标识 */
  id: number
  /** 父级分类标识 */
  parentId: number | null
  /** 名称 */
  name: string
  /** 排序值 */
  sort: number
  /** 是否启用 */
  isEnabled: boolean
  /** 子分类列表 */
  children?: ProductCategory[]
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/** 商品分类新增参数 */
export interface ProductCategoryInput {
  /** 父级分类标识 */
  parentId?: number
  /** 名称 */
  name: string
  /** 排序值 */
  sort: number
  /** 是否启用 */
  isEnabled: boolean
}

/** 商品分类编辑参数 */
export type ProductCategoryUpdateInput = ProductCategoryInput
