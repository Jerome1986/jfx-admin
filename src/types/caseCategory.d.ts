/** 案例分类启用状态 */
export type CaseCategoryStatus = 'enabled' | 'disabled'

/** 案例分类详情 */
export interface CaseCategory {
  /** 分类唯一标识 */
  id: number
  /** 分类名称 */
  name: string
  /** 分类排序值，数值越小越靠前 */
  sort: number
  /** 分类启用状态 */
  status: CaseCategoryStatus
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 案例分类新增参数 */
export interface CaseCategoryInput {
  /** 分类名称 */
  name: string
  /** 分类排序值 */
  sort: number
}

/** 案例分类编辑参数 */
export interface CaseCategoryUpdateInput extends CaseCategoryInput {
  /** 数据更新时间，用于并发修改校验 */
  updatedAt: string
}

/** 案例分类操作审计记录 */
export interface CaseCategoryAuditLog {
  /** 日志唯一标识 */
  id: string
  /** 操作类型 */
  action: 'create' | 'update' | 'status'
  /** 被操作的分类标识 */
  categoryId: number
  /** 被操作的分类名称 */
  categoryName: string
  /** 操作详情 */
  detail: string
  /** 操作时间 */
  operatedAt: string
}
