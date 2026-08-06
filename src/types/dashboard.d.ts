/** 看板预警等级 */
export type AlertLevel = 'danger' | 'warning'

/** 看板业务指标 */
export interface BusinessMetric {
  /** 指标唯一键 */
  key: string
  /** 指标展示名称 */
  label: string
  /** 指标数值 */
  value: number
  /** 指标单位 */
  unit: string
}

/** 看板业务状态统计 */
export interface BusinessStatus {
  /** 状态唯一键 */
  key: string
  /** 状态展示名称 */
  label: string
  /** 状态对应的数据数量 */
  count: number
}

/** 看板预警信息 */
export interface DashboardAlert {
  /** 预警唯一标识 */
  id: string
  /** 预警业务类型 */
  type: string
  /** 预警标题 */
  title: string
  /** 预警详细说明 */
  description: string
  /** 预警关联数据数量 */
  count: number
  /** 预警等级 */
  level: AlertLevel
  /** 点击预警后跳转的页面路径 */
  targetPath: string
  /** 页面跳转携带的查询参数 */
  query: Record<string, string>
}
