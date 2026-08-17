import type { CaseDetail, CasePageResult, CaseQuery, CaseSaveInput, CaseStatus } from '@/types/case'
import { request } from '@/utils/request'

// 提供案例内容维护接口。
export const caseApi = {
  // 按页获取案例列表，筛选查询由独立接口处理。
  list(query: CaseQuery) {
    return request<CasePageResult>({
      method: 'GET',
      url: '/case',
      params: {
        pageNum: String(query.pageNum),
        pageSize: String(query.pageSize),
      },
    })
  },

  // 按组合条件搜索案例，空筛选项不发送到后端。
  search(query: CaseQuery) {
    return request<CasePageResult>({
      method: 'GET',
      url: '/case/search',
      params: {
        pageNum: String(query.pageNum),
        pageSize: String(query.pageSize),
        ...(query.title.trim() && { title: query.title.trim() }),
        ...(query.categoryId !== '' && { categoryId: query.categoryId }),
        ...(query.city && { city: query.city }),
        ...(query.status && { status: query.status }),
        ...(query.isRecommended !== '' && { isRecommended: query.isRecommended }),
      },
    })
  },

  // 获取指定案例的完整详情。
  detail(id: number) {
    return request<CaseDetail>({ method: 'GET', url: `/case/detail/${id}` })
  },

  // 新增案例。
  create(input: CaseSaveInput) {
    return request<CaseDetail>({ method: 'POST', url: '/case/add', data: input })
  },

  // 更新指定案例。
  update(id: number, input: CaseSaveInput) {
    return request<CaseDetail>({ method: 'PATCH', url: `/case/update/${id}`, data: input })
  },

  // 删除指定案例。
  remove(id: number) {
    return request<void>({ method: 'DELETE', url: `/case/${id}` })
  },

  // 更新指定案例的发布状态。
  setStatus(id: number, status: CaseStatus) {
    return request<void>({ method: 'PATCH', url: `/case/status/${id}`, data: { status } })
  },

  // 更新指定案例的首页推荐状态。
  setRecommended(id: number, isRecommended: boolean) {
    return request<void>({
      method: 'PATCH',
      url: `/case/recommended/${id}`,
      data: { isRecommended },
    })
  },
}
