/** 商品数据 */
export interface Product {
  id: number
  categoryId: number
  name: string
  description?: string | null
  brand?: string | null
  model?: string | null
  specifications?: string[] | null
  price: number | string
  stock?: number | null
  mainImage: string
  detailImages?: string[] | null
  installationIncluded?: boolean
  isPublished?: boolean
  sort?: number | null
  category?: { id: number; name: string }
  createdAt?: string
  updatedAt?: string
}

/** 新增商品参数 */
export interface ProductInput {
  categoryId: number
  name: string
  description?: string
  brand?: string
  model?: string
  specifications?: string[]
  price: number
  stock?: number
  mainImage: string
  detailImages?: string[]
  installationIncluded?: boolean
  isPublished?: boolean
  sort?: number
}

/** 编辑商品参数 */
export type ProductUpdateInput = Partial<ProductInput>
