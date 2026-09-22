<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi } from '@/api/orders'
import OrderDetailDrawer from './OrderDetailDrawer.vue'
import ArrangeInstallationDialog from './ArrangeInstallationDialog.vue'
import {
  orderStatuses,
  getOrderStatusAction,
  paymentStatusLabels,
  type OrderListParams,
  type ProductOrder,
  type ProductOrderStatus,
} from '@/types/order'

const arrangementVisible = ref(false)
const arrangementOrder = ref<ProductOrder>()
const processingOrderId = ref<number>()
const cancelOrder = async (order: ProductOrder) => {
  if (processingOrderId.value !== undefined || order.status !== 'PENDING_PAYMENT') return
  processingOrderId.value = order.id
  try {
    try {
      await ElMessageBox.confirm('确定取消该订单吗？', '取消订单', {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }
    await orderApi.cancel(order.id)
    ElMessage.success('订单已取消')
    // 关闭可能持有旧订单快照的详情，列表以服务端结果为准。
    if (selectedOrder.value?.id === order.id) {
      detailVisible.value = false
      selectedOrder.value = undefined
    }
    await loadData()
  } catch {
    // 请求封装统一显示接口错误，失败时不修改本地订单状态。
  } finally {
    processingOrderId.value = undefined
  }
}
const completeInstallation = async (order: ProductOrder) => {
  if (processingOrderId.value !== undefined || order.status !== 'IN_SERVICE') return
  processingOrderId.value = order.id
  try {
    try {
      await ElMessageBox.confirm(
        '确认安装已完工？订单将进入待客户确认，确认期限为完工后 7 天。',
        '确认安装完工',
        {
          type: 'warning',
          confirmButtonText: '确认',
          cancelButtonText: '取消',
        },
      )
    } catch {
      return
    }
    await orderApi.completeInstallation(order.id)
    ElMessage.success('安装已完工，待客户确认')
    if (selectedOrder.value?.id === order.id) {
      detailVisible.value = false
      selectedOrder.value = undefined
    }
    await loadData()
  } catch {
    // 请求封装统一提示失败原因，不提前修改订单或安装状态。
  } finally {
    processingOrderId.value = undefined
  }
}
const toggleAutoCompletion = async (order: ProductOrder) => {
  if (
    loading.value ||
    processingOrderId.value !== undefined ||
    order.status !== 'PENDING_CONFIRMATION'
  )
    return
  const paused = !order.autoCompletionPaused
  processingOrderId.value = order.id
  try {
    try {
      await ElMessageBox.confirm(
        paused
          ? '确认该订单存在争议？暂缓后系统不再自动结单，客户仍可确认完成。'
          : '恢复后，系统会在原截止时间后自动结单；已过期的订单可能很快结单。确认恢复？',
        paused ? '有争议，暂缓结单' : '争议已解决',
        { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' },
      )
    } catch {
      return
    }
    await orderApi.setAutoCompletion(order.id, paused)
    ElMessage.success(paused ? '已因争议暂缓结单' : '争议已解决，已恢复自动结单')
    if (selectedOrder.value?.id === order.id) {
      detailVisible.value = false
      selectedOrder.value = undefined
    }
    await loadData()
  } catch {
    // 错误由请求封装提示，不提前变更暂停标记或截止时间。
  } finally {
    processingOrderId.value = undefined
  }
}
const handleOrderAction = (order: ProductOrder) => {
  if (loading.value || processingOrderId.value !== undefined) return
  switch (order.status) {
    case 'PENDING_PAYMENT':
      void cancelOrder(order)
      break
    case 'PENDING_INSTALLATION':
      arrangementOrder.value = order
      arrangementVisible.value = true
      break
    case 'IN_SERVICE':
      void completeInstallation(order)
      break
  }
}
const rows = ref<ProductOrder[]>([])
const detailVisible = ref(false)
const selectedOrder = ref<ProductOrder>()
const openDetail = (order: ProductOrder) => {
  selectedOrder.value = order
  detailVisible.value = true
}
const loading = ref(false)
const loadError = ref('')
const total = ref(0)
const pagination = reactive({ pageNum: 1, pageSize: 10 })
const keyWords = ref('')
const status = ref<ProductOrderStatus | 'ALL'>('ALL')
const createdAt = ref<[string, string] | null>(null)
// 翻页和刷新沿用已提交的筛选条件。
const appliedFilters = ref<Omit<OrderListParams, 'pageNum' | 'pageSize'>>({ status: 'ALL' })
let requestVersion = 0

const loadData = async () => {
  const version = ++requestVersion
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await orderApi.list({ ...appliedFilters.value, ...pagination })
    if (version !== requestVersion) return
    if (!data || !Array.isArray(data.list) || !Number.isInteger(data.total) || data.total < 0)
      throw new Error('订单列表数据格式不正确，请重试')
    const lastPage = Math.max(1, Math.ceil(data.total / pagination.pageSize))
    if (pagination.pageNum > lastPage) {
      pagination.pageNum = lastPage
      await loadData()
      return
    }
    rows.value = data.list
    total.value = data.total
  } catch (error) {
    if (version !== requestVersion) return
    rows.value = []
    total.value = 0
    loadError.value = error instanceof Error ? error.message : '加载订单失败，请重试'
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
const onInstallationSaved = async (orderId: number) => {
  if (selectedOrder.value?.id === orderId) {
    detailVisible.value = false
    selectedOrder.value = undefined
  }
  arrangementOrder.value = undefined
  await loadData()
}
const search = () => {
  const [start, end] = createdAt.value ?? []
  appliedFilters.value = {
    status: status.value,
    keyWords: keyWords.value.trim() || undefined,
    // 后端使用 gte/lte，范围包含本地所选结束日期的全天。
    createdAtStart: start ? new Date(`${start}T00:00:00.000`).toISOString() : undefined,
    createdAtEnd: end ? new Date(`${end}T23:59:59.999`).toISOString() : undefined,
  }
  pagination.pageNum = 1
  void loadData()
}
const resetFilters = () => {
  keyWords.value = ''
  status.value = 'ALL'
  createdAt.value = null
  search()
}
const changePageSize = () => {
  pagination.pageNum = 1
  void loadData()
}
const formatMoney = (value: string | number | null | undefined) => {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return '—'
  return `¥${Number(value).toFixed(2)}`
}
const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { hour12: false })
}
const statusTagType = (value: ProductOrderStatus) => {
  if (value === 'COMPLETED') return 'success'
  if (value === 'PENDING_PAYMENT' || value === 'REFUNDING' || value === 'PENDING_CONFIRMATION')
    return 'warning'
  if (value === 'CANCELED' || value === 'REFUNDED') return 'info'
  return 'primary'
}
onMounted(loadData)
onBeforeUnmount(() => requestVersion++)
</script>

<template>
  <section class="orders-page fill-page-layout">
    <div class="filter-card">
      <el-form inline @submit.prevent="search">
        <el-form-item label="订单号"
          ><el-input v-model="keyWords" clearable placeholder="请输入订单号"
        /></el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="status">
            <el-option label="全部状态" value="ALL" />
            <el-option
              v-for="item in orderStatuses"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="createdAt"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>商品订单</h2>
          <p>统一查看商品订单与安装服务进度</p>
        </div>
        <el-button :loading="loading" @click="loadData">刷新</el-button>
      </div>
      <el-alert v-if="loadError" :title="loadError" type="error" :closable="false">
        <el-button link type="primary" :loading="loading" @click="loadData">重新加载</el-button>
      </el-alert>
      <div v-else class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          height="100%"
          border
          empty-text="暂无订单"
        >
          <el-table-column
            type="index"
            label="序号"
            width="70"
            fixed="left"
            :index="(index: number) => (pagination.pageNum - 1) * pagination.pageSize + index + 1"
          />
          <el-table-column
            prop="orderNo"
            label="订单号"
            width="210"
            fixed="left"
            show-overflow-tooltip
          />
          <el-table-column prop="contactName" label="联系人" min-width="100" />
          <el-table-column prop="contactPhone" label="联系电话" min-width="135" />
          <el-table-column
            prop="serviceAddress"
            label="服务地址"
            min-width="220"
            show-overflow-tooltip
          />
          <el-table-column label="商品金额" min-width="120" align="right"
            ><template #default="{ row }">{{
              formatMoney(row.productAmount)
            }}</template></el-table-column
          >
          <el-table-column label="优惠券抵扣" min-width="120" align="right">
            <template #default="{ row }">{{ formatMoney(row.couponDiscount || 0) }}</template>
          </el-table-column>
          <el-table-column label="积分抵扣" min-width="120" align="right">
            <template #default="{ row }">{{ formatMoney(row.pointDiscount || 0) }}</template>
          </el-table-column>
          <el-table-column label="应付金额" min-width="120" align="right"
            ><template #default="{ row }">{{
              formatMoney(row.payableAmount)
            }}</template></el-table-column
          >
          <el-table-column label="实付金额" min-width="120" align="right"
            ><template #default="{ row }">{{
              formatMoney(row.paidAmount)
            }}</template></el-table-column
          >
          <el-table-column label="订单状态" width="130">
            <template #default="{ row }"
              ><el-tag :type="statusTagType(row.status)">{{
                orderStatuses.find((item) => item.value === row.status)?.label ?? row.status
              }}</el-tag></template
            >
          </el-table-column>
          <el-table-column label="确认截止时间" min-width="190">
            <template #default="{ row }">
              <div>
                {{ row.confirmationDeadlineAt ? formatDate(row.confirmationDeadlineAt) : '—' }}
              </div>
              <el-tag
                v-if="row.status === 'PENDING_CONFIRMATION' && row.autoCompletionPaused"
                type="warning"
                size="small"
                >因争议暂缓结单</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column label="支付状态" width="110">
            <template #default="{ row }: { row: ProductOrder }">{{
              paymentStatusLabels[row.paymentStatus] ?? row.paymentStatus
            }}</template>
          </el-table-column>
          <el-table-column label="下单时间" min-width="180"
            ><template #default="{ row }">{{
              formatDate(row.createdAt)
            }}</template></el-table-column
          >
          <el-table-column label="备注" min-width="160" show-overflow-tooltip
            ><template #default="{ row }">{{ row.remark || '—' }}</template></el-table-column
          >
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }: { row: ProductOrder }">
              <el-button link class="detail-action" @click="openDetail(row)">订单详情</el-button>
              <el-button
                v-if="getOrderStatusAction(row.status)"
                link
                :type="getOrderStatusAction(row.status)?.type"
                :loading="processingOrderId === row.id"
                :disabled="loading || processingOrderId !== undefined"
                :class="{ 'assign-action': row.status === 'PENDING_INSTALLATION' }"
                @click="handleOrderAction(row)"
              >
                {{ getOrderStatusAction(row.status)?.label }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-if="!loadError" class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          :disabled="loading"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="changePageSize"
        />
      </div>
    </div>
    <ArrangeInstallationDialog
      v-model="arrangementVisible"
      :order="arrangementOrder"
      @saved="onInstallationSaved"
    />
    <OrderDetailDrawer
      v-model="detailVisible"
      :order="selectedOrder"
      :processing="processingOrderId !== undefined || loading"
      @toggle-auto-completion="toggleAutoCompletion"
    />
  </section>
</template>

<style scoped lang="scss">
.detail-action {
  color: #78716c;
  &:hover,
  &:focus-visible {
    color: #57534e;
  }
  &:active {
    color: #44403c;
  }
}
.assign-action {
  color: #a6753d;
  &:hover,
  &:focus-visible {
    color: #8c602f;
  }
  &:active {
    color: #734c24;
  }
}
.filter-card,
.table-card {
  padding: 20px 22px;
  background: #fff;
  border: 1px solid var(--jfx-border);
  border-radius: 10px;
}
.filter-card {
  padding-bottom: 2px;
  .el-input {
    width: 220px;
  }
  .el-select {
    width: 150px;
  }
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  overflow-x: auto;
  padding-top: 18px;
}
</style>
