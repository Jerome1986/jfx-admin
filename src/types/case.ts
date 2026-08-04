export type CaseStatus = 'draft' | 'published' | 'disabled'

export interface CaseHighlight {
  title: string
  description: string
}

export interface CaseCostItem {
  name: string
  amount: number
}

export interface CaseListItem {
  id: number
  title: string
  categoryId: number
  beforeCover: string
  afterCover: string
  city: string
  roomType: string
  area: number
  style?: string
  tags: string[]
  totalPrice: number
  durationDays: number
  quoteCount: number
  isRecommended: boolean
  recommendSort?: number
  status: CaseStatus
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CaseDetail extends CaseListItem {
  description: string
  highlights: CaseHighlight[]
  costs: CaseCostItem[]
}

export interface CaseSaveInput {
  title: string
  categoryId: number
  city: string
  roomType: string
  area: number
  style?: string
  tags: string[]
  totalPrice: number
  durationDays: number
  quoteCount: number
  description: string
  highlights: CaseHighlight[]
  costs: CaseCostItem[]
  isRecommended: boolean
  recommendSort?: number
  status: CaseStatus
}

export interface CaseQuery {
  title: string
  categoryId: number | ''
  city: string
  status: CaseStatus | ''
  isRecommended: boolean | ''
  page: number
  pageSize: number
}

export interface CasePageResult {
  list: CaseListItem[]
  total: number
  page: number
  pageSize: number
}
