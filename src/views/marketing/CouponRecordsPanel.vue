<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { userCouponApi } from '@/api/userCoupons'
import { userCouponStatuses, type UserCoupon } from '@/types/userCoupon'

const props = defineProps<{ userId?: number; refreshKey?: number }>()
// 保存输入条件、已应用条件及本地分页。
const query = reactive({ couponId: '', userId: '', status: '' })
const filters = reactive({ couponId: '', userId: '', status: '' })
const pagination = reactive({ pageNum: 1, pageSize: 10 })
const rows = ref<UserCoupon[]>([])
const loading = ref(false)
const loadError = ref('')
let requestVersion = 0
// 按用户上下文和精确ID筛选，不推算用户券状态。
const filteredRows = computed(() =>
  rows.value.filter(
    (row) =>
      (props.userId === undefined || row.userId === props.userId) &&
      (!filters.couponId || String(row.couponId) === filters.couponId) &&
      (!filters.userId || String(row.userId) === filters.userId) &&
      (!filters.status || row.status === filters.status),
  ),
)
// 截取当前页记录。
const pageRows = computed(() =>
  filteredRows.value.slice(
    (pagination.pageNum - 1) * pagination.pageSize,
    pagination.pageNum * pagination.pageSize,
  ),
)
// 获取全部记录并在前端按领取时间倒序排列。
const loadRecords = async () => {
  const version = ++requestVersion
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await userCouponApi.list()
    if (version !== requestVersion) return
    if (!Array.isArray(data)) throw new Error('发放记录返回格式不正确')
    rows.value = [...data].sort(
      (a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt) || b.id - a.id,
    )
    pagination.pageNum = Math.min(
      pagination.pageNum,
      Math.max(1, Math.ceil(filteredRows.value.length / pagination.pageSize)),
    )
  } catch (error) {
    if (version !== requestVersion) return
    rows.value = []
    loadError.value = error instanceof Error ? error.message : '加载发放记录失败'
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
// 应用本地筛选并回到第一页。
const search = () => {
  Object.assign(filters, {
    couponId: query.couponId.trim(),
    userId: query.userId.trim(),
    status: query.status,
  })
  pagination.pageNum = 1
}
// 清空本地筛选。
const reset = () => {
  Object.assign(query, { couponId: '', userId: '', status: '' })
  search()
}
// 切换每页条数时重置页码。
const changePageSize = () => {
  pagination.pageNum = 1
}
// 将ISO日期转换成本地时间，空值显示占位符。
const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—'
// 初始化、切换用户或发放成功后重新获取记录。
watch(
  () => [props.userId, props.refreshKey],
  () => {
    reset()
    void loadRecords()
  },
  { immediate: true },
)
</script>

<template>
  <section class="records-panel">
    <!-- 使用接口实际返回的ID和状态进行本地筛选。 -->
    <el-form inline :model="query" @submit.prevent="search">
      <el-form-item label="模板ID"
        ><el-input v-model="query.couponId" clearable placeholder="请输入优惠券模板ID"
      /></el-form-item>
      <el-form-item v-if="userId === undefined" label="用户ID"
        ><el-input v-model="query.userId" clearable placeholder="请输入用户ID"
      /></el-form-item>
      <el-form-item label="使用状态"
        ><el-select v-model="query.status" clearable placeholder="全部状态"
          ><el-option
            v-for="item in userCouponStatuses"
            :key="item.value"
            :label="item.label"
            :value="item.value" /></el-select
      ></el-form-item>
      <el-form-item
        ><el-button type="primary" native-type="submit">搜索</el-button
        ><el-button @click="reset">重置</el-button
        ><el-button :loading="loading" @click="loadRecords">刷新</el-button></el-form-item
      >
    </el-form>
    <!-- 加载失败时提供重试，不伪装成空记录。 -->
    <el-alert v-if="loadError" :title="loadError" type="error" :closable="false" />
    <!-- 展示真实发放、到期及核销记录。 -->
    <el-table
      v-else
      v-loading="loading"
      :data="pageRows"
      border
      row-key="id"
      height="360"
      empty-text="暂无优惠券记录"
    >
      <el-table-column prop="id" label="记录ID" width="90" />
      <el-table-column prop="couponId" label="优惠券模板ID" min-width="120" />
      <el-table-column v-if="userId === undefined" prop="userId" label="用户ID" min-width="100" />
      <el-table-column label="使用状态" min-width="100"
        ><template #default="{ row }"
          ><el-tag :type="row.status === 'AVAILABLE' ? 'success' : 'info'">{{
            userCouponStatuses.find((item) => item.value === row.status)?.label ?? row.status
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column label="领取时间" min-width="175"
        ><template #default="{ row }">{{ formatDate(row.receivedAt) }}</template></el-table-column
      >
      <el-table-column label="过期时间" min-width="175"
        ><template #default="{ row }">{{ formatDate(row.expiresAt) }}</template></el-table-column
      >
      <el-table-column label="使用订单ID" min-width="120"
        ><template #default="{ row }">{{ row.orderId ?? '—' }}</template></el-table-column
      >
      <el-table-column label="核销时间" min-width="175"
        ><template #default="{ row }">{{ formatDate(row.usedAt) }}</template></el-table-column
      >
    </el-table>
    <!-- 全量记录在前端分页，不向接口传分页参数。 -->
    <div v-if="!loadError" class="pagination">
      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="filteredRows.length"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="changePageSize"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.records-panel {
  padding: 20px 22px;
  background: #fff;
  border: 1px solid var(--jfx-border);
  border-radius: 10px;
}
.el-input {
  width: 210px;
}
.el-select {
  width: 140px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  overflow-x: auto;
}
</style>
