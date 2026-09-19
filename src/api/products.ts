import { request } from '@/utils/request'
import type {
  Product,
  ProductInput,
  ProductUpdateInput,
  ProductListParams,
  ProductPageParams,
  ProductPageResult,
} from '@/types/product'

export const productApi = {
  list(params?: ProductListParams) {
    return request<Product[]>({ method: 'GET', url: '/product', params })
  },
  page(params: ProductPageParams) {
    return request<ProductPageResult>({ method: 'GET', url: '/product', params })
  },
  detail(id: number) {
    return request<Product>({ method: 'GET', url: `/product/${id}` })
  },
  create(data: ProductInput) {
    return request<Product>({ method: 'POST', url: '/product/add', data })
  },
  update(id: number, data: ProductUpdateInput) {
    return request<Product>({ method: 'PATCH', url: `/product/${id}`, data })
  },
  remove(id: number) {
    return request<void>({ method: 'DELETE', url: `/product/${id}` })
  },
}
