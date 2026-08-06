/** 筛选项选项 */
export interface FilterOption {
  /** 选项展示文本 */
  label: string
  /** 选项提交值 */
  value: string
}

/** 页面筛选项公共属性 */
interface BaseFilter {
  /** 筛选字段唯一键 */
  key: string
  /** 筛选字段标签 */
  label: string
  /** 筛选控件占位提示 */
  placeholder?: string
}

/** 文本输入筛选项 */
export interface TextFilter extends BaseFilter {
  /** 筛选控件类型 */
  type: 'text'
}

/** 下拉选择筛选项 */
export interface SelectFilter extends BaseFilter {
  /** 筛选控件类型 */
  type: 'select'
  /** 下拉框可选项 */
  options: readonly FilterOption[]
}

/** 日期范围筛选项 */
export interface DateRangeFilter extends BaseFilter {
  /** 筛选控件类型 */
  type: 'date-range'
}

/** 页面支持的筛选项联合类型 */
export type PageFilter = TextFilter | SelectFilter | DateRangeFilter
/** 页面筛选字段值 */
export type PageFilterValue = string | string[]
