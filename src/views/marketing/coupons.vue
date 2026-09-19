<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { couponApi } from '@/api/coupons'
import { couponScopes, couponStatuses, type Coupon, type CouponStatus } from '@/types/coupon'
import CouponEditorDialog from './CouponEditorDialog.vue'
import CouponIssueDialog from './CouponIssueDialog.vue'
import CouponRecordsPanel from './CouponRecordsPanel.vue'

// 保存页签及发放弹窗状态。
const activeTab = ref('templates')
const issueVisible = ref(false)
// 发放成功后切换到记录页并刷新数据。
const recordsVersion = ref(0)
const onSent = () => {
  recordsVersion.value++
  activeTab.value = 'records'
}
const issueCoupon = ref<Coupon>()
// 打开已发布模板的发放弹窗。
const openIssue = (row: Coupon) => {
  issueCoupon.value = row
  issueVisible.value = true
}
// 保存模板列表及筛选状态。
const rows = ref<Coupon[]>([])
const loading = ref(false)
const loadError = ref('')
const keyword = ref('')
const status = ref<CouponStatus | ''>('')
const dialogVisible = ref(false)
const editingId = ref<number>()
const deletingId = ref<number>()
const pagination = reactive({ pageNum: 1, pageSize: 10 })
const total = ref(0)
const appliedFilters = reactive<{ keyword?: string; status?: CouponStatus }>({})
let requestVersion = 0
// 搜索模板并回到第一页。
const search = () => {
  appliedFilters.keyword = keyword.value.trim() || undefined
  appliedFilters.status = status.value || undefined
  pagination.pageNum = 1
  return loadData()
}
// 重置模板筛选条件。
const resetFilters = () => {
  keyword.value = ''
  status.value = ''
  return search()
}
// 切换每页条数。
const changePageSize = () => {
  pagination.pageNum = 1
  return loadData()
}
// 加载模板列表。
const loadData = async () => {
  const version = ++requestVersion
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await couponApi.list({ ...appliedFilters, ...pagination })
    if (version !== requestVersion) return
    if (!data || !Array.isArray(data.list) || !Number.isInteger(data.total) || data.total < 0)
      throw new Error('列表接口返回的数据格式不正确，请重试')
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
    loadError.value = error instanceof Error ? error.message : '加载优惠券失败，请重试'
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
// 打开模板新增或编辑弹窗。
const openEditor = (id?: number) => {
  editingId.value = id
  dialogVisible.value = true
}
// 确认并删除模板。
const removeCoupon = async (row: Coupon) => {
  if (deletingId.value !== undefined) return
  deletingId.value = row.id
  try {
    await ElMessageBox.confirm(
      `确定删除优惠券模板“${row.name}”吗？删除后无法恢复。`,
      '删除优惠券模板',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
      },
    )
    await couponApi.remove(row.id)
    ElMessage.success('优惠券模板已删除')
    await loadData()
  } catch {
    // 取消无需提示；409、404、400 等接口错误由请求封装统一展示。
  } finally {
    deletingId.value = undefined
  }
}
// 格式化有效期时间。
const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false })
// 初始化模板列表。
onMounted(loadData)
</script>

<template>
  <section class="coupons-page fill-page-layout">
    <!-- 优惠券管理页签。 -->
    <el-tabs v-model="activeTab" class="management-tabs"
      ><el-tab-pane label="优惠券模板" name="templates" /><el-tab-pane
        label="发放记录"
        name="records"
    /></el-tabs>
    <!-- 模板筛选与管理。 -->
    <template v-if="activeTab === 'templates'">
      <div class="filter-card">
        <el-form inline @submit.prevent="search">
          <el-form-item label="优惠券名称"
            ><el-input v-model="keyword" clearable placeholder="请输入名称"
          /></el-form-item>
          <el-form-item label="模板状态"
            ><el-select v-model="status" clearable placeholder="全部状态"
              ><el-option
                v-for="item in couponStatuses"
                :key="item.value"
                :label="item.label"
                :value="item.value" /></el-select
          ></el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="table-card fill-content-card">
        <div class="table-toolbar">
          <div>
            <h2>优惠券模板</h2>
            <p>管理优惠券面额、使用范围、有效期和发行数量</p>
          </div>
          <el-button type="primary" :icon="Plus" @click="openEditor()">新增优惠券模板</el-button>
        </div>
        <el-alert v-if="loadError" :title="loadError" type="error" :closable="false"
          ><el-button link type="primary" :loading="loading" @click="loadData"
            >重新加载</el-button
          ></el-alert
        >
        <div v-else class="fill-content-body">
          <el-table v-loading="loading" :data="rows" row-key="id" height="100%" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="优惠券名称" min-width="180" />
            <el-table-column label="面额 / 门槛" min-width="170"
              ><template #default="{ row }"
                >¥{{ Number(row.amount).toFixed(2) }} /
                {{
                  Number(row.threshold) === 0 ? '无门槛' : `满 ¥${Number(row.threshold).toFixed(2)}`
                }}</template
              ></el-table-column
            >
            <el-table-column label="适用范围" min-width="140"
              ><template #default="{ row }">{{
                couponScopes.find((item) => item.value === row.scopeType)?.label ?? row.scopeType
              }}</template></el-table-column
            >
            <el-table-column label="有效期" min-width="210"
              ><template #default="{ row }"
                >{{ formatDate(row.validFrom) }}<br />至 {{ formatDate(row.validTo) }}</template
              ></el-table-column
            >
            <el-table-column label="已发行 / 总量" width="130"
              ><template #default="{ row }"
                >{{ row.issuedQuantity }} / {{ row.totalQuantity }}</template
              ></el-table-column
            >
            <el-table-column prop="perUserLimit" label="每人限领" width="100" />
            <el-table-column label="状态" width="100"
              ><template #default="{ row }"
                ><el-tag>{{
                  couponStatuses.find((item) => item.value === row.status)?.label ?? row.status
                }}</el-tag></template
              ></el-table-column
            >
            <el-table-column label="操作" fixed="right" width="210">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'PUBLISHED'"
                  link
                  type="primary"
                  :disabled="deletingId === row.id"
                  @click="openIssue(row)"
                  >发放</el-button
                >
                <el-button
                  link
                  type="primary"
                  :disabled="deletingId === row.id"
                  @click="openEditor(row.id)"
                  >编辑</el-button
                >
                <el-button
                  link
                  type="danger"
                  :loading="deletingId === row.id"
                  :disabled="deletingId !== undefined && deletingId !== row.id"
                  @click="removeCoupon(row)"
                  >删除</el-button
                >
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
    </template>
    <!-- 发放记录查询区域。 -->
    <CouponRecordsPanel v-else :refresh-key="recordsVersion" />
    <!-- 模板编辑和发放弹窗。 -->
    <CouponIssueDialog v-model="issueVisible" :coupon="issueCoupon" @sent="onSent" />
    <CouponEditorDialog v-model="dialogVisible" :coupon-id="editingId" @saved="loadData" />
  </section>
</template>

<style scoped lang="scss">
.management-tabs {
  flex-shrink: 0;
  padding: 0 22px;
  background: #fff;
  border: 1px solid var(--jfx-border);
  border-radius: 10px;
  :deep(.el-tabs__header) {
    margin: 0;
  }
  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
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
</style>
