export interface ServiceCity {
  id: number
  name: string
  code: string
  sort: number
  status: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceCityListParams {
  pageNum: number
  pageSize: number
  keyword?: string
  status?: boolean
}

export interface ServiceCityInput {
  name: string
  sort?: number
  status?: boolean
}

export type ServiceCityUpdateInput = Partial<ServiceCityInput>

export interface ServiceCityListResult {
  list: ServiceCity[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}
