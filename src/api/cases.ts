import type { CaseDetail, CasePageResult, CaseQuery, CaseSaveInput, CaseStatus } from '@/types/case'

// 定义案例模拟数据的版本化存储键。
const STORAGE_KEY = 'jfx-admin:cases:v1'

// 通过序列化创建数据的深拷贝。
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

// 创建用于后台展示的初始案例数据。
const createInitialCases = (): CaseDetail[] => {
  // 统一初始化模拟案例的时间字段。
  const now = new Date().toISOString()
  // 定义老房改造案例的共享详情模板。
  const oldHouse = {
    categoryId: 1,
    beforeCover: '',
    afterCover: '',
    city: '武汉',
    roomType: '两居室',
    area: 68,
    style: '奶油风',
    tags: ['奶油风', '收纳提升', '空间扩容'],
    totalPrice: 286000,
    durationDays: 151,
    description:
      '屋主希望保留老房原有的生活记忆，同时解决采光不足、储物空间有限和动线拥挤的问题。设计以温暖的奶油色为基调，重新规划公共空间。',
    highlights: [
      { title: '空间扩容', description: '打通客餐厅视线，减少空间阻隔，提升整体通透感。' },
      { title: '收纳提升', description: '利用墙面和转角定制一体化柜体，释放日常活动空间。' },
      { title: '采光改善', description: '采用浅色材质与开放布局，让自然光进入室内深处。' },
    ],
    costs: [
      { name: '基础施工', amount: 98000 },
      { name: '主材费用', amount: 116000 },
      { name: '定制与软装', amount: 72000 },
    ],
  }
  // 定义厨房改造案例的共享详情模板。
  const kitchen = {
    categoryId: 2,
    beforeCover: '',
    afterCover: '',
    city: '武汉',
    roomType: '两居室',
    area: 76,
    style: '简约风',
    tags: ['动线优化', '收纳升级', '颜值提升'],
    totalPrice: 18000,
    durationDays: 5,
    description:
      '原厨房操作台面不足、物品摆放杂乱。此次改造重新梳理洗、切、炒动线，并通过吊柜和抽屉系统提升储物效率。',
    highlights: [
      { title: '动线优化', description: '按照洗、切、炒顺序重排功能区，减少往返操作。' },
      { title: '收纳升级', description: '补充吊柜、抽屉和转角收纳，常用物品触手可及。' },
      { title: '快速焕新', description: '保留可用结构，以局部更新缩短工期并控制预算。' },
    ],
    costs: [
      { name: '拆除与安装', amount: 4000 },
      { name: '橱柜与台面', amount: 9000 },
      { name: '五金与辅材', amount: 5000 },
    ],
  }

  // 定义案例列表中特有的展示状态和排序数据。
  const rows = [
    {
      id: 1,
      title: '68㎡老房翻新焕新颜',
      source: oldHouse,
      quoteCount: 327,
      status: 'published' as const,
      recommended: true,
      city: '武汉',
    },
    {
      id: 2,
      title: '老旧厨房大变身',
      source: kitchen,
      quoteCount: 142,
      status: 'published' as const,
      recommended: true,
      city: '武汉',
    },
    {
      id: 3,
      title: '小户型老房采光改造',
      source: oldHouse,
      quoteCount: 86,
      status: 'published' as const,
      recommended: false,
      city: '杭州',
    },
    {
      id: 4,
      title: '五天完成厨房焕新',
      source: kitchen,
      quoteCount: 51,
      status: 'draft' as const,
      recommended: false,
      city: '上海',
    },
    {
      id: 5,
      title: '老房收纳空间重塑',
      source: oldHouse,
      quoteCount: 208,
      status: 'disabled' as const,
      recommended: false,
      city: '北京',
    },
    {
      id: 6,
      title: '紧凑厨房动线优化',
      source: kitchen,
      quoteCount: 73,
      status: 'published' as const,
      recommended: false,
      city: '深圳',
    },
  ]

  return rows.map((row, index) => ({
    ...row.source,
    id: row.id,
    title: row.title,
    city: row.city,
    quoteCount: row.quoteCount,
    isRecommended: row.recommended,
    recommendSort: row.recommended ? index + 1 : undefined,
    status: row.status,
    publishedAt: row.status === 'published' ? now : undefined,
    createdAt: now,
    updatedAt: now,
  }))
}

// 读取案例数据并在缺失时写入初始数据。
const read = (): CaseDetail[] => {
  // 读取浏览器中已持久化的案例数据。
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as CaseDetail[]
    } catch {
      // Invalid development data is replaced with defaults.
    }
  }
  // 创建首次访问时使用的初始案例集合。
  const initial = createInitialCases()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  return clone(initial)
}

// 将全部案例数据持久化到浏览器存储。
const save = (items: CaseDetail[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

// 按 ID 查找案例并在不存在时抛出错误。
const locate = (items: CaseDetail[], id: number) => {
  // 查找与目标 ID 匹配的案例记录。
  const item = items.find((caseItem) => caseItem.id === id)
  if (!item) throw new Error('案例不存在')
  return item
}

// 提供案例查询和状态修改的本地接口。
export const caseApi = {
  // 按筛选条件返回案例分页列表。
  async list(query: CaseQuery): Promise<CasePageResult> {
    // 标准化标题关键词以便模糊匹配。
    const keyword = query.title.trim().toLowerCase()
    // 依次应用筛选条件并按业务排序。
    const filtered = read()
      .filter((item) => !keyword || item.title.toLowerCase().includes(keyword))
      .filter((item) => query.categoryId === '' || item.categoryId === query.categoryId)
      .filter((item) => !query.city || item.city === query.city)
      .filter((item) => !query.status || item.status === query.status)
      .filter((item) => query.isRecommended === '' || item.isRecommended === query.isRecommended)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    // 计算当前页在筛选结果中的起始位置。
    const start = (query.page - 1) * query.pageSize
    return {
      list: clone(filtered.slice(start, start + query.pageSize)),
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
    }
  },

  // 按案例 ID 返回完整详情。
  async detail(id: number): Promise<CaseDetail> {
    return clone(locate(read(), id))
  },

  // 新增一条完整案例记录。
  async create(input: CaseSaveInput): Promise<CaseDetail> {
    // 读取新增前的完整案例集合。
    const items = read()
    // 记录案例创建和更新时间。
    const now = new Date().toISOString()
    // 组装准备持久化的新案例对象。
    const item: CaseDetail = {
      ...clone(input),
      id: Math.max(0, ...items.map((caseItem) => caseItem.id)) + 1,
      beforeCover: '',
      afterCover: '',
      publishedAt: input.status === 'published' ? now : undefined,
      createdAt: now,
      updatedAt: now,
    }
    if (item.status !== 'published') item.isRecommended = false
    items.push(item)
    save(items)
    return clone(item)
  },

  // 修改指定案例的完整业务内容。
  async update(id: number, input: CaseSaveInput): Promise<CaseDetail> {
    // 读取修改前的完整案例集合。
    const items = read()
    // 定位需要修改的案例记录。
    const item = locate(items, id)
    // 保留系统字段并覆盖可编辑业务字段。
    Object.assign(item, clone(input), { updatedAt: new Date().toISOString() })
    if (item.status === 'published' && !item.publishedAt)
      item.publishedAt = new Date().toISOString()
    if (item.status !== 'published') item.isRecommended = false
    save(items)
    return clone(item)
  },

  // 修改案例发布状态并同步推荐约束。
  async setStatus(id: number, status: CaseStatus): Promise<void> {
    // 读取待修改的完整案例集合。
    const items = read()
    // 定位需要修改状态的案例。
    const item = locate(items, id)
    item.status = status
    if (status === 'published' && !item.publishedAt) item.publishedAt = new Date().toISOString()
    if (status !== 'published') item.isRecommended = false
    item.updatedAt = new Date().toISOString()
    save(items)
  },

  // 修改案例的首页推荐状态。
  async setRecommended(id: number, value: boolean): Promise<void> {
    // 读取待修改的完整案例集合。
    const items = read()
    // 定位需要修改推荐状态的案例。
    const item = locate(items, id)
    if (value && item.status !== 'published') throw new Error('请先发布案例，再设置首页推荐')
    item.isRecommended = value
    if (value && item.recommendSort == null) item.recommendSort = 99
    item.updatedAt = new Date().toISOString()
    save(items)
  },
}
