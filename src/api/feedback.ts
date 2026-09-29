import { request } from '@/utils/request'
import type {
  Feedback,
  FeedbackListParams,
  FeedbackListResult,
  ReplyFeedbackParams,
} from '@/types/feedback'

export const feedbackApi = {
  // 按关键词、处理状态分页查询用户已提交的反馈。
  list: (params: FeedbackListParams) =>
    request<FeedbackListResult>({ method: 'GET', url: '/feedback/all', params }),
  // 回复用户反馈；管理员身份、处理状态和完成时间由后端校验并记录。
  reply: (id: number, data: ReplyFeedbackParams) =>
    request<Omit<Feedback, 'user'>>({ method: 'PATCH', url: `/feedback/${id}/reply`, data }),
}
