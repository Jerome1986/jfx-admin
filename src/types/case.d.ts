/** 案例发布状态 */
export type CaseStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE'

/** 案例改造亮点 */
export interface CaseHighlight {
  /** 亮点标题 */
  title: string
  /** 亮点详细说明 */
  description: string
}

/** 案例费用明细 */
export interface CaseCostItem {
  /** 费用项目名称 */
  name: string
  /** 费用金额，单位为元 */
  amount: number
}

/** 案例列表项 */
export interface CaseListItem {
  /** 案例唯一标识 */
  id: number
  /** 案例标题 */
  title: string
  /** 所属案例分类标识 */
  categoryId: number
  /** 改造前图片地址 */
  beforeImage: string
  /** 改造后图片地址 */
  afterImage: string
  /** 房屋所在城市 */
  city: string
  /** 房屋户型 */
  roomType: string
  /** 房屋面积，单位为平方米 */
  area: number
  /** 装修风格 */
  style?: string
  /** 案例标签列表 */
  tags: string[]
  /** 改造总花费，单位为元 */
  totalPrice: number
  /** 施工工期，单位为天 */
  durationDays: number
  /** 参与报价人数 */
  quoteCount: number
  /** 案例浏览次数 */
  viewCount: number
  /** 分享标题 */
  shareTitle?: string | null
  /** 分享图片地址 */
  shareImage?: string | null
  /** 是否推荐到首页 */
  isRecommended: boolean
  /** 首页推荐排序值 */
  recommendSort: number
  /** 案例发布状态 */
  status: CaseStatus
  /** 案例创建时间 */
  createdAt: string
  /** 案例更新时间 */
  updatedAt: string
}

/** 案例完整详情 */
export interface CaseDetail extends CaseListItem {
  /** 案例说明 */
  description: string
  /** 改造亮点列表 */
  highlights: CaseHighlight[]
  /** 费用明细列表 */
  costs: CaseCostItem[]
}

/** 案例新增或编辑提交参数 */
export interface CaseSaveInput {
  /** 案例标题 */
  title: string
  /** 所属案例分类标识 */
  categoryId: number
  /** 改造前图片地址 */
  beforeImage: string
  /** 改造后图片地址 */
  afterImage: string
  /** 房屋所在城市 */
  city: string
  /** 房屋户型 */
  roomType: string
  /** 房屋面积，单位为平方米 */
  area: number
  /** 装修风格 */
  style: string
  /** 案例标签列表 */
  tags: string[]
  /** 改造总花费，单位为元 */
  totalPrice: number
  /** 施工工期，单位为天 */
  durationDays: number
  /** 参与报价人数 */
  quoteCount: number
  /** 案例说明 */
  description: string
  /** 改造亮点列表 */
  highlights: CaseHighlight[]
  /** 费用明细列表 */
  costs: CaseCostItem[]
  /** 是否推荐到首页 */
  isRecommended: boolean
  /** 首页推荐排序值 */
  recommendSort: number
  /** 案例发布状态 */
  status: CaseStatus
}

/** 案例列表查询参数 */
export interface CaseQuery {
  /** 案例标题关键词 */
  title: string
  /** 案例分类标识，空字符串表示全部 */
  categoryId: number | ''
  /** 房屋所在城市，空字符串表示全部 */
  city: string
  /** 案例发布状态，空字符串表示全部 */
  status: CaseStatus | ''
  /** 首页推荐状态，空字符串表示全部 */
  isRecommended: boolean | ''
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
}

/** 案例分页查询结果 */
export interface CasePageResult {
  /** 当前页案例列表 */
  list: CaseListItem[]
  /** 符合条件的数据总数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}
