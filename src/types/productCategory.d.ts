/** 商品分类 */
export interface ProductCategory {
  id: number
  parentId: number | null
  name: string
  sort: number
  isEnabled: boolean
  children?: ProductCategory[]
  createdAt?: string
  updatedAt?: string
}

/** 商品分类新增参数 */
export interface ProductCategoryInput {
  parentId?: number
  name: string
  sort: number
  isEnabled: boolean
}

/** 商品分类编辑参数 */
export type ProductCategoryUpdateInput = ProductCategoryInput
