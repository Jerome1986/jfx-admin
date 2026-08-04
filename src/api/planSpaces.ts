import type {
  PlanSpace,
  PlanSpaceInput,
  PlanSpaceStatus,
  PlanSpaceUpdateInput,
} from '@/types/planSpace'

// 定义适用空间数据的浏览器存储键。
const STORAGE_KEY = 'jfx-admin:plan-spaces'
// 定义适用空间审计日志的存储键。
const AUDIT_KEY = 'jfx-admin:plan-space-audits'

// 定义首次使用时写入的默认空间数据。
const defaults: Array<[string, string, number]> = [
  ['kitchen', '厨房', 10],
  ['bathroom', '卫生间', 20],
  ['balcony', '阳台', 30],
  ['wall', '墙面', 40],
  ['bedroom', '卧室', 50],
  ['living-room', '客厅', 60],
]

// 将默认空间元组转换为完整业务对象。
const initialSpaces = defaults.map<PlanSpace>(([id, name, sort]) => {
  // 记录当前默认空间的初始化时间。
  const now = new Date().toISOString()
  return { id, name, sort, status: 'enabled', planCount: 0, createdAt: now, updatedAt: now }
})

// 通过序列化创建数据的深拷贝。
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

// 读取空间数据并在缺失时写入默认值。
const read = (): PlanSpace[] => {
  // 读取浏览器中已持久化的空间数据。
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSpaces))
    return clone(initialSpaces)
  }
  try {
    return JSON.parse(raw) as PlanSpace[]
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSpaces))
    return clone(initialSpaces)
  }
}

// 将全部适用空间持久化到浏览器存储。
const save = (items: PlanSpace[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

// 追加一条适用空间操作审计日志。
const audit = (action: string, item: PlanSpace, detail: string) => {
  // 读取已有的适用空间操作日志。
  const raw = localStorage.getItem(AUDIT_KEY)
  // 将历史日志解析为可追加的列表。
  const logs: unknown[] = raw ? (JSON.parse(raw) as unknown[]) : []
  logs.unshift({
    id: crypto.randomUUID(),
    action,
    spaceId: item.id,
    spaceName: item.name,
    detail,
    operatedAt: new Date().toISOString(),
  })
  localStorage.setItem(AUDIT_KEY, JSON.stringify(logs.slice(0, 200)))
}

// 校验空间名称在当前数据中保持唯一。
const unique = (items: PlanSpace[], name: string, excludedId?: string) => {
  if (items.some((item) => item.id !== excludedId && item.name === name))
    throw new Error('空间名称已存在')
}

// 定位空间并校验更新时间以避免覆盖并发修改。
const locate = (items: PlanSpace[], id: string, updatedAt: string) => {
  // 查找与目标 ID 匹配的适用空间。
  const item = items.find((space) => space.id === id)
  if (!item) throw new Error('适用空间不存在或已被删除')
  if (item.updatedAt !== updatedAt) throw new Error('适用空间已被其他操作更新，请刷新后重试')
  return item
}

// 提供适用空间维护的本地接口。
export const planSpaceApi = {
  // 返回按状态筛选并排序后的适用空间列表。
  async list(status?: PlanSpaceStatus): Promise<PlanSpace[]> {
    return clone(
      read()
        .filter((item) => !status || item.status === status)
        .sort((a, b) => a.sort - b.sort || a.createdAt.localeCompare(b.createdAt)),
    )
  },
  // 新增一个启用状态的适用空间。
  async create(input: PlanSpaceInput): Promise<PlanSpace> {
    // 读取新增前的完整适用空间集合。
    const items = read()
    // 清理用户输入的空间名称。
    const name = input.name.trim()
    unique(items, name)
    // 记录空间创建时使用的时间。
    const now = new Date().toISOString()
    // 组装准备持久化的新空间对象。
    const item: PlanSpace = {
      id: crypto.randomUUID(),
      name,
      sort: input.sort,
      status: 'enabled',
      planCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    items.push(item)
    save(items)
    audit('create', item, '新增适用空间')
    return clone(item)
  },
  // 修改指定适用空间的名称和排序。
  async update(id: string, input: PlanSpaceUpdateInput): Promise<PlanSpace> {
    // 读取修改前的完整适用空间集合。
    const items = read()
    // 定位并校验需要修改的适用空间。
    const item = locate(items, id, input.updatedAt)
    // 清理用户输入的空间名称。
    const name = input.name.trim()
    unique(items, name, id)
    item.name = name
    item.sort = input.sort
    item.updatedAt = new Date().toISOString()
    save(items)
    audit('update', item, '修改名称或排序')
    return clone(item)
  },
  // 切换指定适用空间的启用状态。
  async setStatus(id: string, status: PlanSpaceStatus, updatedAt: string): Promise<PlanSpace> {
    // 读取修改前的完整适用空间集合。
    const items = read()
    // 定位并校验需要切换状态的空间。
    const item = locate(items, id, updatedAt)
    item.status = status
    item.updatedAt = new Date().toISOString()
    save(items)
    audit('status', item, status === 'enabled' ? '启用适用空间' : '停用适用空间')
    return clone(item)
  },
  // 删除未被焕新方案引用的适用空间。
  async remove(id: string, updatedAt: string): Promise<void> {
    // 读取删除前的完整适用空间集合。
    const items = read()
    // 定位并校验需要删除的适用空间。
    const item = locate(items, id, updatedAt)
    if (item.planCount > 0) throw new Error(`该空间已关联 ${item.planCount} 个方案，只能停用`)
    save(items.filter((space) => space.id !== id))
    audit('delete', item, '删除适用空间')
  },
}
