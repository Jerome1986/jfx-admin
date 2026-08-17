import { request } from '@/utils/request'
import type {
  ConstructionService,
  ConstructionServiceInput,
  ConstructionServiceListParams,
  ConstructionServiceListResult,
  ConstructionServiceUpdateInput,
} from '@/types/constructionService'

export const constructionServiceApi = {
  // 分页查询商品服务。
  list(params: ConstructionServiceListParams) {
    return request<ConstructionServiceListResult>({
      method: 'GET',
      url: '/construction-service',
      params,
    })
  },
  // 查询指定商品服务详情。
  detail(id: number) {
    return request<ConstructionService>({ method: 'GET', url: `/construction-service/${id}` })
  },
  // 新增商品服务。
  create(data: ConstructionServiceInput) {
    return request<ConstructionService>({ method: 'POST', url: '/construction-service', data })
  },
  // 更新指定商品服务。
  update(id: number, data: ConstructionServiceUpdateInput) {
    return request<ConstructionService>({
      method: 'PATCH',
      url: `/construction-service/${id}`,
      data,
    })
  },
  // 删除指定商品服务。
  remove(id: number) {
    return request<void>({ method: 'DELETE', url: `/construction-service/${id}` })
  },
}
