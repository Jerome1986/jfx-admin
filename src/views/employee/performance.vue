<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { employeePerformanceApi } from '@/api/employeePerformance'
import type { EmployeePerformance, EmployeePerformanceParams } from '@/types/employeePerformance'

// 默认月份与后端保持一致，使用北京时间。
const currentMonth = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  return `${parts.find((part) => part.type === 'year')!.value}-${parts.find((part) => part.type === 'month')!.value}`
}
const query = reactive({
  period: 'month',
  month: currentMonth(),
  keyword: '',
  department: '',
  status: '' as '' | boolean,
})
const pagination = reactive({ pageNum: 1, pageSize: 10 })
// 翻页和刷新只使用已提交条件。
const appliedFilters = ref<Omit<EmployeePerformanceParams, 'pageNum' | 'pageSize'>>({
  month: query.month,
})
const rows = ref<EmployeePerformance[]>([])
const total = ref(0)
const loading = ref(false)
const loadError = ref('')
const displayedMonth = ref(query.month)
const periodLabel = computed(() =>
  displayedMonth.value === 'all' ? '累计业绩' : `${displayedMonth.value} 月业绩`,
)
let requestVersion = 0
const loadData = async () => {
  const version = ++requestVersion
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await employeePerformanceApi.list({ ...appliedFilters.value, ...pagination })
    if (version !== requestVersion) return
    if (!data || !Array.isArray(data.list) || !Number.isInteger(data.total) || data.total < 0)
      throw new Error('员工业绩数据格式不正确')
    const lastPage = Math.max(1, Math.ceil(data.total / pagination.pageSize))
    if (pagination.pageNum > lastPage) {
      pagination.pageNum = lastPage
      await loadData()
      return
    }
    rows.value = data.list
    total.value = data.total
    displayedMonth.value = data.month
  } catch {
    if (version !== requestVersion) return
    rows.value = []
    total.value = 0
    loadError.value = '员工业绩加载失败，请重试；如持续失败，请检查账号权限或联系管理员。'
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
const search = () => {
  if (query.period === 'month' && !/^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || '')) {
    ElMessage.warning('请选择统计月份')
    return
  }
  appliedFilters.value = {
    month: query.period === 'all' ? 'all' : query.month,
    keyword: query.keyword.trim() || undefined,
    department: query.department.trim() || undefined,
    status: typeof query.status === 'boolean' ? query.status : undefined,
  }
  pagination.pageNum = 1
  void loadData()
}
const resetQuery = () => {
  Object.assign(query, {
    period: 'month',
    month: currentMonth(),
    keyword: '',
    department: '',
    status: '',
  })
  search()
}
const changePageSize = () => {
  pagination.pageNum = 1
  void loadData()
}
const formatMoney = (value: string) => {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return '—'
  return `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
onMounted(loadData)
onBeforeUnmount(() => requestVersion++)
</script>
<template>
  <section class="performance-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" @submit.prevent="search">
        <el-form-item label="统计范围">
          <el-radio-group v-model="query.period">
            <el-radio-button value="month">按月</el-radio-button>
            <el-radio-button value="all">累计</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="query.period === 'month'" label="月份">
          <el-date-picker
            v-model="query.month"
            type="month"
            value-format="YYYY-MM"
            format="YYYY年MM月"
            placeholder="请选择月份"
            :clearable="false"
          />
        </el-form-item>
        <el-form-item label="员工信息"
          ><el-input v-model="query.keyword" clearable placeholder="员工编号、岗位、姓名或手机号"
        /></el-form-item>
        <el-form-item label="所属部门"
          ><el-input v-model="query.department" clearable placeholder="请输入完整部门名称"
        /></el-form-item>
        <el-form-item label="员工状态">
          <el-select v-model="query.status" placeholder="全部状态">
            <el-option label="全部状态" value="" /><el-option
              label="启用"
              :value="true"
            /><el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item
          ><el-button type="primary" native-type="submit" :loading="loading">查询</el-button
          ><el-button @click="resetQuery">重置</el-button></el-form-item
        >
      </el-form>
    </div>
    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>员工业绩</h2>
          <p>{{ periodLabel }} · 按完工合同金额降序展示</p>
        </div>
        <el-button :loading="loading" @click="loadData">刷新</el-button>
      </div>
      <el-alert class="performance-note" type="info" :closable="false" show-icon>
        <template #title>仅统计当前负责人名下的已完工项目，月份按北京时间的完工时间计算。</template>
        <p>
          客户按手机号去重；平均单值为完工合同金额除以完工项目数。公司排名仅计算有效员工，同额并列，筛选不改变名次；未参与排名的员工显示“—”。
        </p>
      </el-alert>
      <el-alert
        v-if="loadError"
        class="performance-note"
        :title="loadError"
        type="error"
        :closable="false"
        show-icon
      >
        <el-button link type="primary" :loading="loading" @click="loadData">重新加载</el-button>
      </el-alert>
      <div class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="employeeId"
          height="100%"
          border
          :empty-text="loadError ? '加载失败，请重试' : '暂无符合条件的员工'"
        >
          <el-table-column label="公司排名" width="100" align="center" fixed="left"
            ><template #default="{ row }"
              ><span :class="{ 'top-rank': row.companyRank != null && row.companyRank <= 3 }">{{
                row.companyRank ?? '—'
              }}</span></template
            ></el-table-column
          >
          <el-table-column label="员工" min-width="160" fixed="left"
            ><template #default="{ row }"
              ><div class="employee-cell">
                <strong>{{ row.name }}</strong
                ><small>{{ row.employeeNo }}</small>
              </div></template
            ></el-table-column
          >
          <el-table-column prop="mobile" label="手机号" width="140" />
          <el-table-column label="部门" min-width="120"
            ><template #default="{ row }">{{ row.department || '—' }}</template></el-table-column
          >
          <el-table-column label="岗位" min-width="120"
            ><template #default="{ row }">{{ row.position || '—' }}</template></el-table-column
          >
          <el-table-column label="员工状态" width="100" align="center"
            ><template #default="{ row }"
              ><el-tag :type="row.status ? 'success' : 'info'">{{
                row.status ? '启用' : '停用'
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="排名资格" width="120" align="center"
            ><template #default="{ row }"
              ><el-tooltip content="员工档案启用、关联用户启用且用户角色为员工时参与排名。"
                ><span>{{ row.isActive ? '参与排名' : '不参与排名' }}</span></el-tooltip
              ></template
            ></el-table-column
          >
          <el-table-column
            prop="signedCustomerCount"
            label="完工客户数"
            width="120"
            align="right"
          />
          <el-table-column label="完工合同金额" min-width="160" align="right"
            ><template #default="{ row }">{{
              formatMoney(row.signedAmount)
            }}</template></el-table-column
          >
          <el-table-column
            prop="completedProjectCount"
            label="完工项目数"
            width="120"
            align="right"
          />
          <el-table-column label="平均单值" min-width="150" align="right"
            ><template #default="{ row }">{{
              formatMoney(row.averageSignedAmount)
            }}</template></el-table-column
          >
        </el-table>
      </div>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          :disabled="loading || !!loadError"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="changePageSize"
        />
      </div>
    </div>
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
  .el-input {
    width: 240px;
  }
  .el-select {
    width: 140px;
  }
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
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
.performance-note {
  margin-bottom: 12px;
  flex-shrink: 0;
}
.employee-cell {
  strong,
  small {
    display: block;
  }
  small {
    margin-top: 4px;
    color: var(--jfx-muted);
  }
}
.top-rank {
  color: var(--jfx-primary);
  font-weight: 600;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
  overflow-x: auto;
}
</style>
