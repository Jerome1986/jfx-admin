import { request } from '@/utils/request'
import type { ProjectDetail } from '@/types/project'
import type {
  AppointmentDetail,
  AppointmentFollowUp,
  AppointmentListParams,
  AppointmentListResult,
  AssignAppointmentParams,
  CreateAppointmentFollowUpParams,
  ConvertAppointmentParams,
} from '@/types/appointment'

export const appointmentApi = {
  list: (query: AppointmentListParams) =>
    request<AppointmentListResult>({
      method: 'GET',
      url: '/appointment',
      params: { pageNum: String(query.pageNum), pageSize: String(query.pageSize) },
    }),
  detail: (id: number) =>
    request<AppointmentDetail | null>({ method: 'GET', url: `/appointment/detail/${id}` }),
  createFollowUp: (id: number, data: CreateAppointmentFollowUpParams) =>
    request<AppointmentFollowUp>({ method: 'POST', url: `/appointment/${id}/follow-up`, data }),
  assign: (id: number, data: AssignAppointmentParams) =>
    request<AppointmentDetail>({ method: 'PATCH', url: `/appointment/${id}/assignee`, data }),
  convert: (id: number, data: ConvertAppointmentParams) =>
    request<ProjectDetail>({ method: 'POST', url: `/appointment/${id}/convert`, data }),
  // 代客录入、安排上门、更新状态、取消预约仍待后端补充。
}
