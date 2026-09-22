import { request } from '@/utils/request'
import type { AppointmentFollowUp, CreateAppointmentFollowUpParams } from '@/types/appointment'
import type {
  Project,
  ProjectDetail,
  ProjectInput,
  ProjectUpdate,
  ProjectListParams,
  ProjectProgressInput,
  QuoteItemInput,
} from '@/types/project'

export const projectApi = {
  list: (params: ProjectListParams) =>
    request<{
      list: Project[]
      total: number
      pageNum: number
      pageSize: number
      totalPage: number
    }>({
      method: 'GET',
      url: '/project',
      // 默认加载、清空及重置筛选均使用后端接受的 ALL。
      params: { ...params, status: params.status || 'ALL' },
    }),
  detail: (id: number) => request<ProjectDetail>({ method: 'GET', url: `/project/${id}` }),
  create: (data: ProjectInput) => request<ProjectDetail>({ method: 'POST', url: '/project', data }),
  update: (id: number, data: ProjectUpdate) =>
    request<ProjectDetail>({ method: 'PATCH', url: `/project/${id}`, data }),
  assign: (id: number, employeeId: number) =>
    request<ProjectDetail>({
      method: 'PATCH',
      url: `/project/${id}/assignee`,
      data: { employeeId },
    }),
  quotation: (id: number, quoteVersion: number, items: QuoteItemInput[]) =>
    request<ProjectDetail>({
      method: 'PUT',
      url: `/project/${id}/quotation`,
      data: { quoteVersion, items },
    }),
  progress: (id: number, data: ProjectProgressInput) =>
    request<ProjectDetail>({ method: 'POST', url: `/project/${id}/progress`, data }),
  followUp: (id: number, data: CreateAppointmentFollowUpParams) =>
    request<AppointmentFollowUp>({ method: 'POST', url: `/project/${id}/follow-up`, data }),
}
