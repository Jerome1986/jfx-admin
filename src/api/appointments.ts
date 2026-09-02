import { request } from '@/utils/request'
import type {
  AppointmentDetail,
  AppointmentFollowUp,
  AppointmentListParams,
  AppointmentListResult,
  CreateAppointmentFollowUpParams,
} from '@/types/appointment'

export const appointmentApi = {
  list: (query: AppointmentListParams) =>
    request<AppointmentListResult>({
      method: 'GET',
      url: '/appointment',
      params: {
        pageNum: String(query.pageNum),
        pageSize: String(query.pageSize),
      },
    }),
  detail: (id: number) =>
    request<AppointmentDetail | null>({
      method: 'GET',
      url: `/appointment/detail/${id}`,
    }),
  createFollowUp: (id: number, data: CreateAppointmentFollowUpParams) =>
    request<AppointmentFollowUp>({
      method: 'POST',
      url: `/appointment/${id}/follow-up`,
      data,
    }),

  // 其余后台预约写操作接口待后端补充：代客录入、分配负责人、
  // 安排上门、更新状态、取消预约、转为项目。
}
