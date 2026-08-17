import { request } from '@/utils/request'
import type {
  ProductCategory,
  ProductCategoryInput,
  ProductCategoryUpdateInput,
} from '@/types/productCategory'

const normalizeInput = (input: ProductCategoryInput) => ({
  ...input,
  name: input.name.trim(),
})

export const productCategoryApi = {
  list() {
    return request<ProductCategory[]>({ method: 'GET', url: '/product-category' })
  },
  detail(id: number) {
    return request<ProductCategory>({ method: 'GET', url: `/product-category/${id}` })
  },
  create(input: ProductCategoryInput) {
    return request<ProductCategory>({
      method: 'POST',
      url: '/product-category/add',
      data: normalizeInput(input),
    })
  },
  update(id: number, input: ProductCategoryUpdateInput) {
    return request<ProductCategory>({
      method: 'PATCH',
      url: `/product-category/${id}`,
      data: normalizeInput(input),
    })
  },
  setStatus(id: number, isEnabled: boolean) {
    return request<ProductCategory>({
      method: 'PATCH',
      url: `/product-category/${id}/status`,
      data: { isEnabled },
    })
  },
  remove(id: number) {
    return request<void>({ method: 'DELETE', url: `/product-category/${id}` })
  },
}
