export type PlanSpaceStatus = 'enabled' | 'disabled'

export interface PlanSpace {
  id: string
  name: string
  sort: number
  status: PlanSpaceStatus
  planCount: number
  createdAt: string
  updatedAt: string
}

export interface PlanSpaceInput {
  name: string
  sort: number
}

export interface PlanSpaceUpdateInput extends PlanSpaceInput {
  updatedAt: string
}
