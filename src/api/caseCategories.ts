import type {
  CaseCategory,
  CaseCategoryAuditLog,
  CaseCategoryInput,
  CaseCategoryStatus,
  CaseCategoryUpdateInput,
} from '@/types/caseCategory'

// 定义案例分类数据的版本化存储键。
const STORAGE_KEY = 'jfx-admin:case-categories:v2'
// 定义案例分类审计日志的存储键。
const AUDIT_KEY = 'jfx-admin:case-category-audits:v2'

// 创建默认案例分类数据。
const createInitialCategories = (): CaseCategory[] => {
  // 统一初始化默认分类的时间字段。
  const now = new Date().toISOString()
  return [
    { id: 1, name: '老房改造', sort: 10, status: 'enabled', createdAt: now, updatedAt: now },
    { id: 2, name: '厨房改造', sort: 20, status: 'enabled', createdAt: now, updatedAt: now },
  ]
}

// 通过序列化创建数据的深拷贝。
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

// 读取分类数据并在缺失时写入默认值。
const read = (): CaseCategory[] => {
  // 读取浏览器中已持久化的分类数据。
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as CaseCategory[]
    } catch {
      // Invalid development data is replaced with the versioned defaults.
    }
  }
  // 创建首次访问时使用的默认分类集合。
  const initial = createInitialCategories()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  return clone(initial)
}

// 将全部分类数据持久化到浏览器存储。
const save = (items: CaseCategory[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

// 追加一条案例分类操作审计日志。
const audit = (log: Omit<CaseCategoryAuditLog, 'id' | 'operatedAt'>) => {
  // 读取已有的分类操作审计日志。
  const raw = localStorage.getItem(AUDIT_KEY)
  // 将历史日志解析为可追加的列表。
  const logs: CaseCategoryAuditLog[] = raw ? (JSON.parse(raw) as CaseCategoryAuditLog[]) : []
  logs.unshift({ ...log, id: crypto.randomUUID(), operatedAt: new Date().toISOString() })
  localStorage.setItem(AUDIT_KEY, JSON.stringify(logs.slice(0, 200)))
}

// 校验分类名称在当前数据中保持唯一。
const ensureUnique = (items: CaseCategory[], name: string, excludedId?: number) => {
  if (items.some((item) => item.id !== excludedId && item.name === name)) {
    throw new Error('分类名称已存在')
  }
}

// 定位分类并校验更新时间以避免覆盖并发修改。
const locate = (items: CaseCategory[], id: number, updatedAt: string) => {
  // 查找与目标 ID 匹配的分类记录。
  const item = items.find((category) => category.id === id)
  if (!item) throw new Error('分类不存在')
  if (item.updatedAt !== updatedAt) throw new Error('分类已被其他操作更新，请刷新后重试')
  return item
}

// 提供案例分类维护的本地接口。
export const caseCategoryApi = {
  // 返回按状态筛选并排序后的分类列表。
  async list(status?: CaseCategoryStatus): Promise<CaseCategory[]> {
    return clone(
      read()
        .filter((item) => !status || item.status === status)
        .sort((a, b) => a.sort - b.sort || a.id - b.id),
    )
  },

  // 新增一个启用状态的案例分类。
  async create(input: CaseCategoryInput): Promise<CaseCategory> {
    // 读取新增前的完整分类集合。
    const items = read()
    // 清理用户输入的分类名称。
    const name = input.name.trim()
    ensureUnique(items, name)
    // 记录分类创建时使用的时间。
    const now = new Date().toISOString()
    // 组装准备持久化的新分类对象。
    const item: CaseCategory = {
      id: Math.max(0, ...items.map((category) => category.id)) + 1,
      name,
      sort: input.sort,
      status: 'enabled',
      createdAt: now,
      updatedAt: now,
    }
    items.push(item)
    save(items)
    audit({ action: 'create', categoryId: item.id, categoryName: name, detail: '新增分类' })
    return clone(item)
  },

  // 修改指定案例分类的名称和排序。
  async update(id: number, input: CaseCategoryUpdateInput): Promise<CaseCategory> {
    // 读取修改前的完整分类集合。
    const items = read()
    // 定位并校验需要修改的分类。
    const item = locate(items, id, input.updatedAt)
    // 清理用户输入的分类名称。
    const name = input.name.trim()
    ensureUnique(items, name, id)
    item.name = name
    item.sort = input.sort
    item.updatedAt = new Date().toISOString()
    save(items)
    audit({ action: 'update', categoryId: id, categoryName: name, detail: '修改名称或排序' })
    return clone(item)
  },

  // 切换指定案例分类的启用状态。
  async setStatus(
    id: number,
    status: CaseCategoryStatus,
    updatedAt: string,
  ): Promise<CaseCategory> {
    // 读取修改前的完整分类集合。
    const items = read()
    // 定位并校验需要切换状态的分类。
    const item = locate(items, id, updatedAt)
    item.status = status
    item.updatedAt = new Date().toISOString()
    save(items)
    audit({
      action: 'status',
      categoryId: id,
      categoryName: item.name,
      detail: status === 'enabled' ? '启用分类' : '停用分类',
    })
    return clone(item)
  },
}
