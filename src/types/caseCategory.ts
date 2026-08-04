export type CaseCategoryStatus = 'enabled' | 'disabled'

export interface CaseCategory {
  id: number
  name: string
  sort: number
  status: CaseCategoryStatus
  createdAt: string
  updatedAt: string
}

export interface CaseCategoryInput {
  name: string
  sort: number
}

export interface CaseCategoryUpdateInput extends CaseCategoryInput {
  updatedAt: string
}

export interface CaseCategoryAuditLog {
  id: string
  action: 'create' | 'update' | 'status'
  categoryId: number
  categoryName: string
  detail: string
  operatedAt: string
}
