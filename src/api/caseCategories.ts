import type {
  CaseCategory,
  CaseCategoryInput,
  CaseCategoryStatus,
  CaseCategoryUpdateInput,
} from '@/types/caseCategory'
import { request } from '@/utils/request'

// 提供案例分类维护接口。
export const caseCategoryApi = {
  // 获取全部案例分类。
  list() {
    return request<CaseCategory[]>({
      method: 'GET',
      url: '/case-category',
    })
  },

  // 新增案例分类。
  create(input: CaseCategoryInput) {
    return request<CaseCategory>({
      method: 'POST',
      url: '/case-category/add',
      data: {
        ...input,
        name: input.name.trim(),
      },
    })
  },

  // 更新指定案例分类。
  update(id: number, input: CaseCategoryUpdateInput) {
    return request<CaseCategory>({
      method: 'PATCH',
      url: `/case-category/${id}`,
      data: {
        ...input,
        name: input.name.trim(),
      },
    })
  },

  // 切换指定案例分类的启用状态。
  setStatus(id: number, isEnabled: CaseCategoryStatus) {
    return request<CaseCategory>({
      method: 'PATCH',
      url: `/case-category/${id}/status`,
      data: { isEnabled },
    })
  },

  // 删除指定案例分类。
  remove(id: number) {
    return request<void>({
      method: 'DELETE',
      url: `/case-category/${id}`,
    })
  },
}
