/** 商品查询条件；不传的条件不参与筛选。 */
export interface ProductListParams {
  keyword?: string
  categoryId?: number
  isPublished?: boolean
  inStock?: boolean
}

/** 商品分页查询参数 */
export interface ProductPageParams extends ProductListParams {
  pageNum: number
  pageSize: number
}

/** 商品分页查询结果 */
export interface ProductPageResult {
  list: Product[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

/** 商品数据 */
export interface Product {
  /** 唯一标识 */
  id: number
  /** 所属商品分类标识 */
  categoryId: number
  /** 名称 */
  name: string
  /** 详细说明 */
  description?: string | null
  /** 商品品牌 */
  brand?: string | null
  /** 商品型号 */
  model?: string | null
  /** 商品规格列表 */
  specifications?: string[] | null
  /** 商品价格 */
  price: number | string
  /** 库存数量 */
  stock?: number | null
  /** 商品主图地址 */
  mainImage: string
  /** 商品详情图片列表 */
  detailImages?: string[] | null
  /** 是否包含安装服务 */
  installationIncluded?: boolean
  /** 是否上架 */
  isPublished?: boolean
  /** 排序值 */
  sort?: number | null
  /** 所属商品分类信息 */
  category?: {
    /** 分类唯一标识 */
    id: number
    /** 分类名称 */
    name: string
  }
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/** 新增商品参数 */
export interface ProductInput {
  /** 所属商品分类标识 */
  categoryId: number
  /** 名称 */
  name: string
  /** 详细说明 */
  description?: string
  /** 商品品牌 */
  brand?: string
  /** 商品型号 */
  model?: string
  /** 商品规格列表 */
  specifications?: string[]
  /** 商品价格 */
  price: number
  /** 库存数量 */
  stock?: number
  /** 商品主图地址 */
  mainImage: string
  /** 商品详情图片列表 */
  detailImages?: string[]
  /** 是否包含安装服务 */
  installationIncluded?: boolean
  /** 是否上架 */
  isPublished?: boolean
  /** 排序值 */
  sort?: number
}

/** 编辑商品参数 */
export type ProductUpdateInput = Partial<ProductInput>
