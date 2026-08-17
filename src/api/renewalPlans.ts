import { request } from '@/utils/request'
import type {
  RenewalPlan,
  RenewalPlanInput,
  RenewalPlanSaveResult,
  RenewalPlanUpdateInput,
} from '@/types/renewalPlan'

export const renewalPlanApi = {
  list() {
    return request<RenewalPlan[]>({ method: 'GET', url: '/renewal-plan' })
  },
  detail(id: number) {
    return request<RenewalPlan>({ method: 'GET', url: `/renewal-plan/${id}` })
  },
  create(data: RenewalPlanInput) {
    return request<RenewalPlanSaveResult>({ method: 'POST', url: '/renewal-plan/add', data })
  },
  update(id: number, data: RenewalPlanUpdateInput) {
    return request<RenewalPlanSaveResult>({ method: 'PATCH', url: `/renewal-plan/${id}`, data })
  },
  remove(id: number) {
    return request<void>({ method: 'DELETE', url: `/renewal-plan/${id}` })
  },
}
