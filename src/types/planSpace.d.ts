/** 适用空间启用状态 */
export type PlanSpaceStatus = 'enabled' | 'disabled'

/** 方案适用空间 */
export interface PlanSpace {
  /** 空间唯一标识 */
  id: string
  /** 空间名称 */
  name: string
  /** 空间排序值，数值越小越靠前 */
  sort: number
  /** 空间启用状态 */
  status: PlanSpaceStatus
  /** 关联方案数量 */
  planCount: number
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 适用空间新增参数 */
export interface PlanSpaceInput {
  /** 空间名称 */
  name: string
  /** 空间排序值 */
  sort: number
}

/** 适用空间编辑参数 */
export interface PlanSpaceUpdateInput extends PlanSpaceInput {
  /** 数据更新时间，用于并发修改校验 */
  updatedAt: string
}
