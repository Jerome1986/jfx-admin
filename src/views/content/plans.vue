<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { renewalPlanApi } from '@/api/renewalPlans'
import type { RenewalPlan, RenewalPlanStatus } from '@/types/renewalPlan'
import { calculateRenewalPlanPrice } from '@/utils/renewalPlan'
import RenewalPlanCreateDialog from './components/RenewalPlanCreateDialog.vue'
import RenewalPlanDetailDrawer from './components/RenewalPlanDetailDrawer.vue'

const loading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const editingId = ref<number>()
const detailId = ref<number>()
const rows = ref<RenewalPlan[]>([])
const query = reactive({ name: '', status: '' as RenewalPlanStatus | '' })
const appliedQuery = reactive({ ...query })

const filteredRows = computed(() => {
  const name = appliedQuery.name.trim().toLowerCase()
  return rows.value.filter(
    (item) =>
      (!name || item.name.toLowerCase().includes(name)) &&
      (!appliedQuery.status || item.status === appliedQuery.status),
  )
})

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await renewalPlanApi.list()
    rows.value = data
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    loading.value = false
  }
}

const search = () => Object.assign(appliedQuery, query)
const resetQuery = () => {
  Object.assign(query, { name: '', status: '' })
  search()
}
const openCreate = () => {
  editingId.value = undefined
  dialogVisible.value = true
}
const openEdit = (row: RenewalPlan) => {
  editingId.value = row.id
  dialogVisible.value = true
}
const openDetail = (row: RenewalPlan) => {
  detailId.value = row.id
  detailVisible.value = true
}
const remove = async (row: RenewalPlan) => {
  try {
    await ElMessageBox.confirm(`删除“${row.name}”后无法恢复，确定继续吗？`, '删除焕新方案', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await renewalPlanApi.remove(row.id)
    ElMessage.success('焕新方案已删除')
    await loadData()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
  }
}
const statusLabel: Record<RenewalPlanStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  OFFLINE: '已下架',
}
const getStatusLabel = (status: RenewalPlanStatus) => statusLabel[status]
const statusType = (status: RenewalPlanStatus) =>
  status === 'PUBLISHED' ? 'success' : status === 'OFFLINE' ? 'info' : 'warning'
const formatDate = (value: string) => (value ? new Date(value).toLocaleString('zh-CN') : '—')

onMounted(loadData)
</script>

<template>
  <section class="plan-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" label-position="left" @submit.prevent="search">
        <el-form-item label="方案名称">
          <el-input v-model="query.name" clearable placeholder="请输入方案名称" />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="query.status" clearable placeholder="全部发布状态">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="已下架" value="OFFLINE" />
          </el-select>
        </el-form-item>
        <el-form-item class="filter-actions">
          <el-button type="primary" native-type="submit">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>焕新方案</h2>
          <p>维护焕新方案、关联商品与发布状态</p>
        </div>
        <el-button type="primary" @click="openCreate">新增方案</el-button>
      </div>
      <div class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="filteredRows"
          row-key="id"
          height="100%"
          border
          empty-text="暂无焕新方案"
        >
          <el-table-column label="方案" min-width="260" fixed="left">
            <template #default="{ row }">
              <div class="plan-cell">
                <el-image :src="row.cover" fit="contain" />
                <div>
                  <strong>{{ row.name }}</strong>
                  <small>{{ row.summary || '暂无简介' }}</small>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="起步价" width="125" align="right">
            <template #default="{ row }"
              >¥{{ calculateRenewalPlanPrice(row.items).toFixed(2) }}</template
            >
          </el-table-column>
          <el-table-column label="服务项目" width="95" align="center">
            <template #default="{ row }">{{ row.items?.length ?? 0 }} 项</template>
          </el-table-column>
          <el-table-column label="推荐" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isRecommended ? 'success' : 'info'">
                {{ row.isRecommended ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="95" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="75" align="center" />
          <el-table-column label="创建时间" width="175">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="165" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">查看</el-button>
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <RenewalPlanCreateDialog
      v-model="dialogVisible"
      :plan-id="editingId"
      @saved="loadData"
    />
    <RenewalPlanDetailDrawer v-model="detailVisible" :plan-id="detailId" />
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
    width: 210px;
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
.plan-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  .el-image {
    width: 62px;
    height: 62px;
    flex: none;
    padding: 4px;
    box-sizing: border-box;
    background: #f7f8fa;
    border: 1px solid var(--jfx-border);
    border-radius: 6px;
  }
  div {
    min-width: 0;
  }
  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    max-width: 280px;
    margin-top: 7px;
    color: var(--jfx-muted);
  }
}
</style>
