export type BannerStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE'

export interface Banner {
  id: number
  title: string
  image: string
  sort: number
  status: BannerStatus
  createdAt?: string
  updatedAt?: string
}

export type BannerInput = Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>

export interface BannerListResult {
  list: Banner[]
  total: number
}
