<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { appointmentApi } from '@/api/appointments'
import AppointmentActionDialog from './components/AppointmentActionDialog.vue'
import type {
  AppointmentActionMode,
  AppointmentDetail,
  AppointmentListItem,
  AppointmentStatus,
  AppointmentType,
} from '@/types/appointment'

// 标记数据是否正在加载。
const loading = ref(false)
// 保存列表展示数据。
const rows = ref<AppointmentListItem[]>([])
// 保存列表记录总数。
const total = ref(0)
// 保存当前页码和每页条数。
const pagination = reactive({ pageNum: 1, pageSize: 10 })
// 保存列表筛选条件。
const query = reactive({
  keyword: '',
  type: '' as '' | AppointmentType,
  status: '' as '' | AppointmentStatus,
  visitAt: [] as string[],
})
// 控制详情抽屉的显示状态。
const detailVisible = ref(false)
// 标记详情是否正在加载。
const detailLoading = ref(false)
// 保存当前查看的预约详情。
const currentAppointment = ref<AppointmentDetail>()
// 控制预约操作弹窗的显示状态。
const actionVisible = ref(false)
// 保存当前预约操作类型。
const actionMode = ref<AppointmentActionMode>('follow-up')
// 保存当前操作的预约记录。
const actionAppointment = ref<AppointmentListItem>()
// 记录详情请求序号，避免旧响应覆盖新详情。
let detailRequestId = 0

// 定义预约类型的名称和标签样式。
const typeMeta: Record<AppointmentType, { label: string; type: 'info' | 'primary' | 'success' }> = {
  BUDGET: { label: '装修预算', type: 'info' },
  MEASURE: { label: '免费量房', type: 'primary' },
  QUOTE: { label: '房屋报价', type: 'success' },
  PLAN: { label: '焕新方案预约', type: 'primary' },
  CASE: { label: '同款案例报价', type: 'success' },
  OUTLET: { label: '网点咨询', type: 'info' },
}

// 定义预约状态的名称和标签样式。
const statusMeta: Record<
  AppointmentStatus,
  { label: string; type: 'warning' | 'primary' | 'success' | 'info' }
> = {
  PENDING_CONTACT: { label: '待联系', type: 'warning' },
  PENDING_VISIT: { label: '待上门', type: 'primary' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELED: { label: '已取消', type: 'info' },
}

// 将异常转换为可展示的错误消息。
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '预约列表加载失败，请稍后重试'

// 将日期转换为页面显示文本。
const formatDate = (value?: string | null) => {
  if (!value) return '—'
  // 将原始日期值转换为日期对象。
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', { hour12: false })
}

// 获取预约客户的显示姓名。
const customerName = (row: AppointmentListItem) =>
  row.customerName || row.user?.realName || row.user?.nickname || '—'

// 获取预约对象的显示名称。
const subjectName = (row: AppointmentListItem) =>
  row.snapshot?.title || row.plan?.name || row.case?.title || '—'

// 获取当前预约类型的展示配置。
const appointmentTypeMeta = (row: AppointmentListItem) => typeMeta[row.type]

// 获取当前预约状态的展示配置。
const appointmentStatusMeta = (row: AppointmentListItem) => statusMeta[row.status]

// 整理负责员工的展示信息。
const employeeDescription = (row: AppointmentListItem) => {
  if (!row.employee) return '—'
  return row.employee.position || row.employee.department || '—'
}

// 获取最近一次跟进时间。
const latestFollowUpAt = (row: AppointmentListItem) => {
  // 收集有效的跟进时间戳。
  const timestamps = row.followUps
    .map((item) => new Date(item.createdAt).getTime())
    .filter(Number.isFinite)
  return timestamps.length ? formatDate(new Date(Math.max(...timestamps)).toISOString()) : '—'
}

// 按时间整理详情中的跟进记录。
const sortedFollowUps = computed(() =>
  [...(currentAppointment.value?.followUps || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  ),
)

// 计算符合筛选条件的列表数据。
const filteredRows = computed(() => {
  // 整理用于搜索匹配的关键字。
  const keyword = query.keyword.trim().toLowerCase()
  return rows.value.filter((row) => {
    // 判断当前记录是否匹配关键字。
    const matchesKeyword =
      !keyword ||
      [row.appointmentNo, customerName(row), row.mobile]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    // 判断预约是否匹配类型条件。
    const matchesType = !query.type || row.type === query.type
    // 判断预约是否匹配状态条件。
    const matchesStatus = !query.status || row.status === query.status
    // 提取预约上门日期。
    const visitDay = row.visitDate?.slice(0, 10)
    // 提取上门日期筛选范围的起止日期。
    const [visitStart, visitEnd] = query.visitAt
    // 判断上门日期是否在筛选范围内。
    const matchesVisitAt =
      !visitStart || !visitEnd || (!!visitDay && visitDay >= visitStart && visitDay <= visitEnd)
    return matchesKeyword && matchesType && matchesStatus && matchesVisitAt
  })
})

// 加载列表数据并更新页面状态。
const loadData = async () => {
  loading.value = true
  try {
    // 获取接口返回的业务数据。
    const { data } = await appointmentApi.list({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    })
    console.log('列表数据', data)

    rows.value = data.list
    total.value = data.total
    pagination.pageNum = data.pageNum
    pagination.pageSize = data.pageSize
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    loading.value = false
  }
}

// 切换每页条数后从第一页加载。
const changePageSize = () => {
  pagination.pageNum = 1
  loadData()
}

// 清空筛选条件并更新列表。
const resetQuery = () => {
  Object.assign(query, { keyword: '', type: '', status: '', visitAt: [] })
}

// 设置预约操作类型并打开弹窗。
const openAction = (mode: AppointmentActionMode, appointment?: AppointmentListItem) => {
  if (mode === 'follow-up' && appointment?.employeeId == null) {
    ElMessage.warning('请先分配负责人，再添加跟进')
    return
  }
  actionMode.value = mode
  actionAppointment.value = appointment
  actionVisible.value = true
}

// 在预约操作保存后刷新相关数据。
const handleActionSaved = async (appointmentId: number) => {
  await loadData()
  if (detailVisible.value && currentAppointment.value?.id === appointmentId) {
    await openDetail(currentAppointment.value)
  }
}

// 加载并展示当前记录的详情。
const openDetail = async (row: AppointmentListItem) => {
  // 保存本次详情请求的序号。
  const requestId = ++detailRequestId
  currentAppointment.value = undefined
  detailVisible.value = true
  detailLoading.value = true
  try {
    // 获取接口返回的业务数据。
    const { data } = await appointmentApi.detail(row.id)
    console.log('详情', data)

    if (requestId !== detailRequestId) return
    if (!data) {
      detailVisible.value = false
      ElMessage.warning('预约不存在或已被删除')
      return
    }
    currentAppointment.value = data
  } catch (error) {
    if (requestId !== detailRequestId) return
    detailVisible.value = false
    ElMessage.error(error instanceof Error ? error.message : '预约详情加载失败，请稍后重试')
  } finally {
    if (requestId === detailRequestId) detailLoading.value = false
  }
}

// 页面挂载后加载初始数据。
onMounted(loadData)
</script>

<template>
  <section class="appointment-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" @submit.prevent>
        <el-form-item label="客户信息">
          <el-input v-model="query.keyword" clearable placeholder="请输入预约编号、客户或手机号" />
        </el-form-item>
        <el-form-item label="预约类型">
          <el-select v-model="query.type" clearable placeholder="全部预约类型">
            <el-option v-for="(meta, value) in typeMeta" :key="value" :label="meta.label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="预约状态">
          <el-select v-model="query.status" clearable placeholder="全部预约状态">
            <el-option v-for="(meta, value) in statusMeta" :key="value" :label="meta.label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="上门日期">
          <el-date-picker v-model="query.visitAt" type="daterange" range-separator="至" start-placeholder="开始日期"
            end-placeholder="结束日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <p class="filter-tip">当前接口暂不支持筛选，以上条件仅筛选当前页数据</p>
    </div>
    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>预约管理</h2>
          <p>查看全部装修预约、客户信息及当前处理状态</p>
        </div>
        <el-button type="primary" @click="openAction('create')">代客录入</el-button>
      </div>
      <div class="fill-content-body">
        <el-table v-loading="loading" :data="filteredRows" row-key="id" height="100%" border empty-text="暂无预约">
          <el-table-column label="预约编号" min-width="230" fixed="left">
            <template #default="{ row }">
              <div class="primary-cell">
                <strong>{{ row.appointmentNo }}</strong>
                <el-tag size="small" :type="appointmentTypeMeta(row).type">
                  {{ appointmentTypeMeta(row).label }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="客户" min-width="130">
            <template #default="{ row }">{{ customerName(row) }}</template>
          </el-table-column>
          <el-table-column prop="mobile" label="手机号" width="130" />
          <el-table-column label="来源" min-width="110">
            <template #default="{ row }">{{ row.source || '—' }}</template>
          </el-table-column>
          <el-table-column label="预约方案/案例" min-width="190" show-overflow-tooltip>
            <template #default="{ row }">{{ subjectName(row) }}</template>
          </el-table-column>
          <el-table-column label="负责人" min-width="150">
            <template #default="{ row }">
              <div v-if="row.employeeId != null && row.employee" class="secondary-cell">
                <strong>{{ row.employee.user?.realName || row.employee.employeeNo }}</strong>
                <small>{{ employeeDescription(row) }}</small>
              </div>
              <span v-else>{{ row.employeeId == null ? '未分配' : `员工 ID：${row.employeeId}` }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="appointmentStatusMeta(row).type">
                {{ appointmentStatusMeta(row).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最近跟进时间" width="175">
            <template #default="{ row }">{{ latestFollowUpAt(row) }}</template>
          </el-table-column>
          <el-table-column label="提交时间" width="175">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="230" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button link type="primary" @click="openDetail(row)">查看</el-button>
                <el-button v-if="row.employeeId != null" link type="primary" @click="openAction('follow-up', row)">
                  跟进
                </el-button>
                <el-button link type="primary" @click="openAction('assign', row)">
                  {{ row.employeeId == null ? '分配负责人' : '改派负责人' }}
                </el-button>
                <el-dropdown trigger="click" @command="openAction($event, row)">
                  <el-button link type="primary">更多</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="visit">安排上门</el-dropdown-item>
                      <el-dropdown-item command="status">更新状态</el-dropdown-item>
                      <el-dropdown-item command="convert">转为项目</el-dropdown-item>
                      <el-dropdown-item command="cancel" divided>取消预约</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="pagination.pageNum" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total"
          @current-change="loadData" @size-change="changePageSize" />
      </div>
    </div>
    <el-drawer v-model="detailVisible" title="预约详情" size="620px">
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="currentAppointment">
          <div class="detail-actions">
            <el-button v-if="currentAppointment.employeeId != null" type="primary"
              @click="openAction('follow-up', currentAppointment)">
              新增跟进
            </el-button>
            <el-button :type="currentAppointment.employeeId == null ? 'primary' : 'default'"
              @click="openAction('assign', currentAppointment)">
              {{ currentAppointment.employeeId == null ? '分配负责人' : '改派负责人' }}
            </el-button>
            <el-button @click="openAction('visit', currentAppointment)">安排上门</el-button>
            <el-dropdown trigger="click" @command="openAction($event, currentAppointment)">
              <el-button>更多操作</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="status">更新状态</el-dropdown-item>
                  <el-dropdown-item command="convert">转为项目</el-dropdown-item>
                  <el-dropdown-item command="cancel" divided>取消预约</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <section class="detail-section first-section">
            <h3>预约与客户信息</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="预约编号" :span="2">
                {{ currentAppointment.appointmentNo }}
              </el-descriptions-item>
              <el-descriptions-item label="预约类型">
                {{ appointmentTypeMeta(currentAppointment).label }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="appointmentStatusMeta(currentAppointment).type">
                  {{ appointmentStatusMeta(currentAppointment).label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="客户">
                {{ customerName(currentAppointment) }}
              </el-descriptions-item>
              <el-descriptions-item label="手机号">
                {{ currentAppointment.mobile || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="城市">
                {{ currentAppointment.city || currentAppointment.user?.city || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="房屋信息">
                {{
                  [currentAppointment.houseType, currentAppointment.roomLayout]
                    .filter(Boolean)
                    .join(' / ') || '—'
                }}
              </el-descriptions-item>
              <el-descriptions-item label="面积">
                {{ currentAppointment.area ? `${currentAppointment.area}㎡` : '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="来源">
                {{ currentAppointment.source || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="预约方案/案例" :span="2">
                {{ subjectName(currentAppointment) }}
              </el-descriptions-item>
              <el-descriptions-item label="装修需求" :span="2">
                {{ currentAppointment.demand || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="关注重点" :span="2">
                {{ currentAppointment.focus || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="上门时间">
                {{ formatDate(currentAppointment.visitDate) }}
                {{ currentAppointment.timeSlot || '' }}
              </el-descriptions-item>
              <el-descriptions-item label="上门地址">
                {{ currentAppointment.visitAddress || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="负责人">
                {{ currentAppointment.employeeId == null ? '未分配' : currentAppointment.employee?.user?.realName || currentAppointment.employee?.employeeNo || `员工
                ID：${currentAppointment.employeeId}` }}
              </el-descriptions-item>
              <el-descriptions-item label="最近跟进">
                {{ latestFollowUpAt(currentAppointment) }}
              </el-descriptions-item>
              <el-descriptions-item label="提交时间">
                {{ formatDate(currentAppointment.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ formatDate(currentAppointment.updatedAt) }}
              </el-descriptions-item>
            </el-descriptions>
          </section>
          <section v-if="currentAppointment.snapshot?.items.length" class="detail-section">
            <div class="section-heading">
              <h3>预约方案快照</h3>
              <strong>参考价：¥{{ currentAppointment.snapshot.referencePrice }}</strong>
            </div>
            <el-table :data="currentAppointment.snapshot.items" row-key="sourceItemId" border>
              <el-table-column prop="category" label="分类" width="100" />
              <el-table-column prop="name" label="项目" min-width="160" />
              <el-table-column label="单价" width="100" align="right">
                <template #default="{ row }">¥{{ row.unitPrice }}</template>
              </el-table-column>
              <el-table-column label="数量" width="100" align="center">
                <template #default="{ row }">{{ row.quantity }} {{ row.unit }}</template>
              </el-table-column>
            </el-table>
          </section>
          <section class="detail-section">
            <h3>跟进记录</h3>
            <el-timeline v-if="sortedFollowUps.length">
              <el-timeline-item v-for="item in sortedFollowUps" :key="item.id" :timestamp="formatDate(item.createdAt)"
                placement="top">
                <p class="follow-content">{{ item.content }}</p>
                <small>
                  跟进员工 ID：{{ item.employeeId || '—' }} · 下次跟进：{{
                    formatDate(item.nextFollowAt)
                  }}
                </small>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else :image-size="70" description="暂无跟进记录" />
          </section>
          <section class="detail-section">
            <h3>转化项目</h3>
            <el-descriptions v-if="currentAppointment.project" :column="2" border>
              <el-descriptions-item label="项目编号">
                {{ currentAppointment.project.projectNo }}
              </el-descriptions-item>
              <el-descriptions-item label="项目状态">
                {{ currentAppointment.project.status }}
              </el-descriptions-item>
              <el-descriptions-item label="项目名称" :span="2">
                {{ currentAppointment.project.name }}
              </el-descriptions-item>
              <el-descriptions-item label="报价金额">
                {{ currentAppointment.project.quotedAmount || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="合同金额">
                {{ currentAppointment.project.contractAmount || '—' }}
              </el-descriptions-item>
            </el-descriptions>
            <el-empty v-else :image-size="70" description="尚未转为装修项目" />
          </section>
        </template>
      </div>
    </el-drawer>
    <AppointmentActionDialog v-model="actionVisible" :mode="actionMode" :appointment="actionAppointment"
      @saved="handleActionSaved" />
  </section>
</template>

<style scoped lang="scss">
.filter-card,
.table-card {
  padding: 20px 22px;
  background: #fff;
  border: 1px solid var(--jfx-border);
  border-radius: 10px;
}

.filter-card {
  padding-bottom: 2px;

  .el-input,
  .el-select {
    width: 220px;
  }

  .filter-tip {
    margin: -6px 0 12px;
    color: var(--jfx-muted);
    font-size: 12px;
  }
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 17px;
  }

  p {
    margin: 6px 0 0;
    color: var(--jfx-muted);
    font-size: 12px;
  }
}

.detail-section {
  margin-top: 24px;

  h3 {
    margin: 0 0 12px;
    font-size: 15px;
  }
}

.first-section {
  margin-top: 20px;
}

.detail-actions,
.section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-actions {
  flex-wrap: wrap;
}

.section-heading {
  justify-content: space-between;

  strong {
    color: var(--jfx-primary);
    font-size: 14px;
  }
}

.follow-content {
  margin: 0 0 6px;
}

.table-actions {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  white-space: nowrap;

  .el-button {
    margin: 0;
  }

  .el-dropdown {
    display: inline-flex;
    align-items: center;
  }
}

.el-timeline-item small {
  color: var(--jfx-muted);
}

.detail-body {
  min-height: 240px;
}

.primary-cell,
.secondary-cell {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;

  strong {
    font-weight: 600;
  }

  small {
    color: var(--jfx-muted);
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}
</style>
