export type BannerStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE'

export interface Banner {
  /** 唯一标识 */
  id: number
  /** 标题 */
  title: string
  /** 图片地址 */
  image: string
  /** 排序值 */
  sort: number
  /** 发布状态 */
  status: BannerStatus
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

export type BannerInput = Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>

export interface BannerListResult {
  /** 查询结果列表 */
  list: Banner[]
  /** 记录总数 */
  total: number
}
