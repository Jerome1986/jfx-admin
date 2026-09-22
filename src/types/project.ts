import type { AppointmentFollowUp } from './appointment'

export const projectStatuses = {
  PENDING_CONFIRM: '待确认',
  IN_SERVICE: '服务中',
  COMPLETED: '已完成',
  PENDING_QUOTE: '待报价',
  CANCELED: '已取消',
} as const
export type ProjectStatus = keyof typeof projectStatuses
export interface ProjectInput {
  name: string
  customerName: string
  mobile: string
  serviceAddress: string
  remark: string
  userId?: number | null
  employeeId?: number | null
  planId?: number | null
}
export type ProjectUpdate = Pick<
  ProjectInput,
  'name' | 'customerName' | 'mobile' | 'serviceAddress' | 'remark'
>
export interface Project extends ProjectInput {
  id: number
  projectNo: string
  appointmentId: number | null
  employeeName: string | null
  planName: string | null
  quotedAmount: string | null
  contractAmount: string | null
  quoteVersion: number
  status: ProjectStatus
  progress: string
  createdAt: string
  updatedAt: string
}
export interface QuoteItemInput {
  productId: number | null
  category: string
  name: string
  description: string | null
  unit: string
  unitPrice: string
  quantity: string
  image: string | null
  sort: number
}
export interface ProjectDetail extends Project {
  items: (QuoteItemInput & { id: number; amount: string })[]
  progressRecords: { id: number; status: ProjectStatus; content: string; createdAt: string }[]
  followUps: AppointmentFollowUp[]
}
export interface ProjectListParams {
  pageNum: number
  pageSize: number
  keyword?: string
  owner?: string
  status?: ProjectStatus | ''
}
export interface ProjectProgressInput {
  status: ProjectStatus
  content: string
  quoteVersion?: number
  contractAmount?: string
}
