export type AppointmentType = 'BUDGET' | 'MEASURE' | 'QUOTE' | 'PLAN' | 'CASE' | 'OUTLET'

export type AppointmentStatus = 'PENDING_CONTACT' | 'PENDING_VISIT' | 'COMPLETED' | 'CANCELED'

export interface AppointmentSnapshotItem {
  /** 来源方案项目标识 */
  sourceItemId: number
  /** 候选项标识 */
  candidateId: number | null
  /** 关联商品标识 */
  productId: number | null
  /** 项目分类 */
  category: string
  /** 名称 */
  name: string
  /** 详细说明 */
  description: string | null
  /** 计价单位 */
  unit: string
  /** 单位价格 */
  unitPrice: string
  /** 数量 */
  quantity: string
  /** 图片地址 */
  image: string | null
}

export interface AppointmentSnapshot {
  /** 标题 */
  title: string
  /** 封面图片地址 */
  cover: string | null
  /** 参考价格 */
  referencePrice: string
  /** 项目明细列表 */
  items: AppointmentSnapshotItem[]
}

export interface AppointmentUser {
  /** 唯一标识 */
  id: number
  /** 用户编号 */
  userNo: string
  /** 用户昵称 */
  nickname: string | null
  /** 真实姓名 */
  realName: string | null
  /** 手机号码 */
  mobile: string
  /** 头像地址 */
  avatar: string | null
  /** 所在城市 */
  city: string | null
  /** 账号是否启用 */
  status: boolean
}

export interface AppointmentEmployee {
  /** 负责人关联的用户资料，兼容未返回该字段的接口 */
  user?: {
    /** 负责人真实姓名 */
    realName?: string | null
  } | null
  /** 唯一标识 */
  id: number
  /** 员工编号 */
  employeeNo: string
  /** 岗位 */
  position: string | null
  /** 所属部门 */
  department: string | null
  /** 是否在职 */
  status: boolean
}

export interface AppointmentPlan {
  /** 唯一标识 */
  id: number
  /** 名称 */
  name: string
  /** 简要说明 */
  summary: string | null
  /** 起始价格 */
  startingPrice: string
  /** 封面图片地址 */
  cover: string | null
  /** 发布状态 */
  status: string
}

export interface AppointmentCase {
  /** 唯一标识 */
  id: number
  /** 标题 */
  title: string
  /** 所在城市 */
  city: string | null
  /** 房屋户型 */
  roomType: string | null
  /** 房屋面积 */
  area: string | null
  /** 装修风格 */
  style: string | null
  /** 总金额 */
  totalPrice: string | null
  /** 发布状态 */
  status: string
}

export interface AppointmentFollowUp {
  /** 唯一标识 */
  id: number
  /** 关联预约标识 */
  appointmentId: number | null
  /** 关联项目标识 */
  projectId: number | null
  /** 关联员工标识 */
  employeeId: number | null
  /** 跟进内容 */
  content: string
  /** 下次跟进时间 */
  nextFollowAt: string | null
  /** 创建时间 */
  createdAt: string
}

export interface AppointmentProject {
  /** 唯一标识 */
  id: number
  /** 项目编号 */
  projectNo: string
  /** 名称 */
  name: string
  /** 客户姓名 */
  customerName: string
  /** 手机号码 */
  mobile: string
  /** 报价金额 */
  quotedAmount: string | null
  /** 合同金额 */
  contractAmount: string | null
  /** 项目状态 */
  status: string
}

export interface AppointmentListItem {
  /** 唯一标识 */
  id: number
  /** 预约编号 */
  appointmentNo: string
  /** 关联用户标识 */
  userId: number | null
  /** 关联员工标识 */
  employeeId: number | null
  /** 关联案例标识 */
  caseId: number | null
  /** 关联方案标识 */
  planId: number | null
  /** 预约类型 */
  type: AppointmentType
  /** 来源渠道 */
  source: string | null
  /** 客户姓名 */
  customerName: string | null
  /** 手机号码 */
  mobile: string
  /** 房屋类型 */
  houseType: string | null
  /** 所在城市 */
  city: string | null
  /** 房屋面积 */
  area: string | null
  /** 房屋格局 */
  roomLayout: string | null
  /** 客户需求 */
  demand: string | null
  /** 预约时的方案快照 */
  snapshot: AppointmentSnapshot | null
  /** 客户关注事项 */
  focus: string | null
  /** 预约上门日期 */
  visitDate: string | null
  /** 预约上门时段 */
  timeSlot: string | null
  /** 预约上门地址 */
  visitAddress: string | null
  /** 预约状态 */
  status: AppointmentStatus
  /** 完成时间 */
  completedAt: string | null
  /** 取消时间 */
  canceledAt: string | null
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 关联用户信息 */
  user: AppointmentUser | null
  /** 关联员工信息 */
  employee: AppointmentEmployee | null
  /** 关联案例信息 */
  case: AppointmentCase | null
  /** 关联方案信息 */
  plan: AppointmentPlan | null
  /** 跟进记录列表 */
  followUps: AppointmentFollowUp[]
  /** 关联项目信息 */
  project: AppointmentProject | null
}

export type AppointmentDetail = AppointmentListItem

export interface AppointmentListParams {
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
}

export interface AppointmentListResult {
  /** 查询结果列表 */
  list: AppointmentListItem[]
  /** 记录总数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}

export type AppointmentActionMode =
  'create' | 'assign' | 'follow-up' | 'visit' | 'status' | 'cancel' | 'convert'

export interface CreateAppointmentParams {
  /** 客户姓名 */
  customerName: string
  /** 手机号码 */
  mobile: string
  /** 预约类型 */
  type: AppointmentType
  /** 来源渠道 */
  source: string
  /** 客户需求 */
  demand: string
}

export interface AssignAppointmentParams {
  /** 必须选择的在职负责人标识 */
  employeeId: number
}

export interface CreateAppointmentFollowUpParams {
  /** 跟进内容 */
  content: string
  /** 下次跟进时间 */
  nextFollowAt?: string | null
  /** 提交时的当前负责人标识，后端校验归属一致后写入跟进 */
  employeeId: number
}

export interface ScheduleAppointmentVisitParams {
  /** 预约上门日期 */
  visitDate: string
  /** 预约上门时段 */
  timeSlot: string
  /** 预约上门地址 */
  visitAddress: string
}

export interface UpdateAppointmentStatusParams {
  /** 预约状态 */
  status: AppointmentStatus
  /** 备注说明 */
  remark: string
}

export interface CancelAppointmentParams {
  /** 取消原因 */
  reason: string
}

export interface ConvertAppointmentParams {
  /** 项目名称 */
  projectName: string
  /** 备注说明 */
  remark: string
}
