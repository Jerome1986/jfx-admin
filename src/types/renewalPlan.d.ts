export type RenewalPlanStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE'

export interface RenewalPlanItemInput {
  productId?: number
  category: string
  name: string
  description: string
  unit: string
  unitPrice: number
  quantity: number
  image?: string
  sort: number
}

export interface RenewalPlanItem extends RenewalPlanItemInput {
  id: number
  planId?: number
  product?: import('./product').Product | null
  createdAt?: string
  updatedAt?: string
}

export interface RenewalPlanInput {
  name: string
  summary: string
  tags: string[]
  startingPrice: number
  cover: string
  images?: string[]
  detail: string
  shareTitle: string
  shareImage: string
  sort: number
  isRecommended: boolean
  recommendSort: number
  status: RenewalPlanStatus
  items: RenewalPlanItemInput[]
}

export interface RenewalPlan {
  id: number
  name: string
  summary?: string | null
  tags: string[]
  startingPrice: number | string
  cover?: string | null
  images?: string[] | null
  detail?: string | null
  shareTitle?: string | null
  shareImage?: string | null
  sort: number
  isRecommended: boolean
  recommendSort: number
  status: RenewalPlanStatus
  items: RenewalPlanItem[]
  createdAt: string
  updatedAt: string
}

export type RenewalPlanUpdateInput = Partial<RenewalPlanInput>

export interface RenewalPlanSaveResult {
  planId: number
}
