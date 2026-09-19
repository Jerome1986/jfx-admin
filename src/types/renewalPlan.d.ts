export type RenewalPlanStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE'

export interface RenewalPlanItemInput {
  /** 关联商品标识 */
  productId?: number
  /** 项目分类 */
  category: string
  /** 名称 */
  name: string
  /** 详细说明 */
  description: string
  /** 计价单位 */
  unit: string
  /** 单位价格 */
  unitPrice: number
  /** 数量 */
  quantity: number
  /** 图片地址 */
  image?: string
  /** 排序值 */
  sort: number
}

export interface RenewalPlanItem extends RenewalPlanItemInput {
  /** 唯一标识 */
  id: number
  /** 关联方案标识 */
  planId?: number
  /** 关联商品信息 */
  product?: import('./product').Product | null
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

export interface RenewalPlanInput {
  /** 名称 */
  name: string
  /** 简要说明 */
  summary: string
  /** 标签列表 */
  tags: string[]
  /** 起始价格 */
  startingPrice: number
  /** 封面图片地址 */
  cover: string
  /** 方案图片列表 */
  images?: string[]
  /** 方案详细说明 */
  detail: string
  /** 分享标题 */
  shareTitle: string
  /** 分享图片地址 */
  shareImage: string
  /** 排序值 */
  sort: number
  /** 是否推荐到首页 */
  isRecommended: boolean
  /** 首页推荐排序值 */
  recommendSort: number
  /** 发布状态 */
  status: RenewalPlanStatus
  /** 项目明细列表 */
  items: RenewalPlanItemInput[]
}

export interface RenewalPlan {
  /** 唯一标识 */
  id: number
  /** 名称 */
  name: string
  /** 简要说明 */
  summary?: string | null
  /** 标签列表 */
  tags: string[]
  /** 起始价格 */
  startingPrice: number | string
  /** 封面图片地址 */
  cover?: string | null
  /** 方案图片列表 */
  images?: string[] | null
  /** 方案详细说明 */
  detail?: string | null
  /** 分享标题 */
  shareTitle?: string | null
  /** 分享图片地址 */
  shareImage?: string | null
  /** 排序值 */
  sort: number
  /** 是否推荐到首页 */
  isRecommended: boolean
  /** 首页推荐排序值 */
  recommendSort: number
  /** 发布状态 */
  status: RenewalPlanStatus
  /** 项目明细列表 */
  items: RenewalPlanItem[]
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

export type RenewalPlanUpdateInput = Partial<RenewalPlanInput>

export interface RenewalPlanSaveResult {
  /** 关联方案标识 */
  planId: number
}
