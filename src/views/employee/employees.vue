<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { employeeApi } from '@/api/employees'
import EmployeeEditorDialog from './EmployeeEditorDialog.vue'
import type { Employee, EmployeeListParams } from '@/types/employee'

const loading = ref(false)
const rows = ref<Employee[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const editingId = ref<number>()
const query = reactive({ keyword: '', department: '', status: '' as '' | boolean })
const pagination = reactive({ pageNum: 1, pageSize: 10 })

// 将未知异常转换为可展示的错误消息。
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'
// 获取员工用于页面展示的姓名。
const displayName = (row: Employee) => row.user?.realName || row.user?.nickname || '未完善资料'
// 将接口日期转换为本地日期时间文本。
const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—'

// 根据当前筛选条件和分页信息加载员工列表。
const loadData = async () => {
  loading.value = true
  try {
    const params: EmployeeListParams = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    }
    if (query.keyword.trim()) params.keyword = query.keyword.trim()
    if (query.department.trim()) params.department = query.department.trim()
    if (query.status !== '') params.status = query.status
    const { data } = await employeeApi.list(params)
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
// 从第一页执行员工搜索。
const search = () => {
  pagination.pageNum = 1
  loadData()
}
// 清空筛选条件并重新加载列表。
const resetQuery = () => {
  Object.assign(query, { keyword: '', department: '', status: '' })
  search()
}
// 打开新增员工弹窗。
const openCreate = () => {
  editingId.value = undefined
  dialogVisible.value = true
}
// 打开指定员工的编辑弹窗。
const openEdit = (row: Employee) => {
  editingId.value = row.id
  dialogVisible.value = true
}
// 确认后删除员工档案并刷新列表。
const remove = async (row: Employee) => {
  try {
    await ElMessageBox.confirm(
      `删除“${displayName(row)}”的员工档案后，其用户角色将恢复为客户，确定继续吗？`,
      '删除员工',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
    await employeeApi.remove(row.id)
    ElMessage.success('员工档案已删除')
    if (rows.value.length === 1 && pagination.pageNum > 1) pagination.pageNum--
    await loadData()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
  }
}
onMounted(loadData)
</script>

<template>
  <section class="employees-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" @submit.prevent="search">
        <el-form-item label="员工信息"
          ><el-input v-model="query.keyword" clearable placeholder="员工编号、岗位、姓名或手机号"
        /></el-form-item>
        <el-form-item label="所属部门"
          ><el-input v-model="query.department" clearable placeholder="请输入部门"
        /></el-form-item>
        <el-form-item label="在职状态"
          ><el-select v-model="query.status" clearable placeholder="全部状态"
            ><el-option label="在职" :value="true" /><el-option
              label="离职"
              :value="false" /></el-select
        ></el-form-item>
        <el-form-item
          ><el-button type="primary" native-type="submit">搜索</el-button
          ><el-button @click="resetQuery">重置</el-button></el-form-item
        >
      </el-form>
    </div>
    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>员工管理</h2>
          <p>管理员工档案、岗位、服务区域和在职状态</p>
        </div>
        <el-button type="primary" @click="openCreate">新增员工</el-button>
      </div>
      <div class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          height="100%"
          border
          empty-text="暂无员工"
        >
          <el-table-column label="员工" min-width="220" fixed="left"
            ><template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="42" :src="row.user?.avatar || undefined">{{
                  displayName(row).slice(0, 1)
                }}</el-avatar>
                <div>
                  <strong>{{ displayName(row) }}</strong
                  ><small>{{ row.employeeNo }}</small>
                </div>
              </div>
            </template></el-table-column
          >
          <el-table-column label="手机号" width="130"
            ><template #default="{ row }">{{ row.user?.mobile || '—' }}</template></el-table-column
          >
          <el-table-column label="岗位" min-width="140"
            ><template #default="{ row }">{{ row.position || '—' }}</template></el-table-column
          >
          <el-table-column label="部门" min-width="120"
            ><template #default="{ row }">{{ row.department || '—' }}</template></el-table-column
          >
          <el-table-column label="服务区域" min-width="220"
            ><template #default="{ row }"
              ><el-space v-if="row.serviceRegions?.length" wrap :size="4"
                ><el-tag
                  v-for="region in row.serviceRegions"
                  :key="region"
                  size="small"
                  type="info"
                  >{{ region }}</el-tag
                ></el-space
              ><span v-else>—</span></template
            ></el-table-column
          >
          <el-table-column label="入职时间" width="170"
            ><template #default="{ row }">{{ formatDate(row.hiredAt) }}</template></el-table-column
          >
          <el-table-column label="状态" width="85" align="center"
            ><template #default="{ row }"
              ><el-tag :type="row.status ? 'success' : 'info'">{{
                row.status ? '在职' : '离职'
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="操作" width="130" fixed="right"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="openEdit(row)">编辑</el-button
              ><el-button link type="danger" @click="remove(row)">删除</el-button></template
            ></el-table-column
          >
        </el-table>
      </div>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @current-change="loadData"
          @size-change="search"
        />
      </div>
    </div>
    <EmployeeEditorDialog v-model="dialogVisible" :employee-id="editingId" @saved="loadData" />
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
    width: 150px;
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 11px;

  strong,
  small {
    display: block;
  }

  strong {
    margin-bottom: 6px;
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
