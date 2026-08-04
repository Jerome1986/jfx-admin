export interface FilterOption {
  label: string
  value: string
}

interface BaseFilter {
  key: string
  label: string
  placeholder?: string
}

export interface TextFilter extends BaseFilter {
  type: 'text'
}

export interface SelectFilter extends BaseFilter {
  type: 'select'
  options: readonly FilterOption[]
}

export interface DateRangeFilter extends BaseFilter {
  type: 'date-range'
}

export type PageFilter = TextFilter | SelectFilter | DateRangeFilter
export type PageFilterValue = string | string[]
