export const feedbackStatusOptions = [
  { value: 'PENDING', label: '待处理', type: 'warning' },
  { value: 'PROCESSING', label: '处理中', type: 'primary' },
  { value: 'REPLIED', label: '已回复', type: 'success' },
  { value: 'CLOSED', label: '已关闭', type: 'info' },
] as const

export type FeedbackStatus = (typeof feedbackStatusOptions)[number]['value']

export interface Feedback {
  id: number
  feedbackNo: string
  userId: number | null
  user: {
    mobile: string | null
    nickname: string | null
    realName: string | null
  } | null
  adminId: number | null
  type: string
  content: string
  status: FeedbackStatus
  reply: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface FeedbackListParams {
  keyWords?: string
  status?: FeedbackStatus | 'ALL'
  pageNum?: string
  pageSize?: string
}

export interface FeedbackListResult {
  list: Feedback[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

/** 管理员回复内容，提交前去除首尾空白。 */
export interface ReplyFeedbackParams {
  reply: string
}
