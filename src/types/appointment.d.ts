export type AppointmentType = 'BUDGET' | 'MEASURE' | 'QUOTE' | 'PLAN' | 'CASE' | 'OUTLET'

export type AppointmentStatus = 'PENDING_CONTACT' | 'PENDING_VISIT' | 'COMPLETED' | 'CANCELED'

export interface AppointmentSnapshotItem {
  sourceItemId: number
  candidateId: number | null
  productId: number | null
  category: string
  name: string
  description: string | null
  unit: string
  unitPrice: string
  quantity: string
  image: string | null
}

export interface AppointmentSnapshot {
  title: string
  cover: string | null
  referencePrice: string
  items: AppointmentSnapshotItem[]
}

export interface AppointmentUser {
  id: number
  userNo: string
  nickname: string | null
  realName: string | null
  mobile: string
  avatar: string | null
  city: string | null
  status: boolean
}

export interface AppointmentEmployee {
  id: number
  employeeNo: string
  position: string | null
  department: string | null
  status: boolean
}

export interface AppointmentPlan {
  id: number
  name: string
  summary: string | null
  startingPrice: string
  cover: string | null
  status: string
}

export interface AppointmentCase {
  id: number
  title: string
  city: string | null
  roomType: string | null
  area: string | null
  style: string | null
  totalPrice: string | null
  status: string
}

export interface AppointmentFollowUp {
  id: number
  appointmentId: number | null
  projectId: number | null
  employeeId: number | null
  content: string
  nextFollowAt: string | null
  createdAt: string
}

export interface AppointmentProject {
  id: number
  projectNo: string
  name: string
  customerName: string
  mobile: string
  quotedAmount: string | null
  contractAmount: string | null
  status: string
}

export interface AppointmentListItem {
  id: number
  appointmentNo: string
  userId: number | null
  employeeId: number | null
  caseId: number | null
  planId: number | null
  type: AppointmentType
  source: string | null
  customerName: string | null
  mobile: string
  houseType: string | null
  city: string | null
  area: string | null
  roomLayout: string | null
  demand: string | null
  snapshot: AppointmentSnapshot | null
  focus: string | null
  visitDate: string | null
  timeSlot: string | null
  visitAddress: string | null
  status: AppointmentStatus
  completedAt: string | null
  canceledAt: string | null
  createdAt: string
  updatedAt: string
  user: AppointmentUser | null
  employee: AppointmentEmployee | null
  case: AppointmentCase | null
  plan: AppointmentPlan | null
  followUps: AppointmentFollowUp[]
  project: AppointmentProject | null
}

export type AppointmentDetail = AppointmentListItem

export interface AppointmentListParams {
  pageNum: number
  pageSize: number
}

export interface AppointmentListResult {
  list: AppointmentListItem[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

export type AppointmentActionMode =
  'create' | 'assign' | 'follow-up' | 'visit' | 'status' | 'cancel' | 'convert'

export interface CreateAppointmentParams {
  customerName: string
  mobile: string
  type: AppointmentType
  source: string
  demand: string
}

export interface AssignAppointmentParams {
  employeeId: number | null
}

export interface CreateAppointmentFollowUpParams {
  content: string
  nextFollowAt?: string | null
  employeeId?: number | null
}

export interface ScheduleAppointmentVisitParams {
  visitDate: string
  timeSlot: string
  visitAddress: string
}

export interface UpdateAppointmentStatusParams {
  status: AppointmentStatus
  remark: string
}

export interface CancelAppointmentParams {
  reason: string
}

export interface ConvertAppointmentParams {
  projectName: string
  remark: string
}
