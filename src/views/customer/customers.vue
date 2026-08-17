<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { userApi } from '@/api/users'
import UserEditorDialog from './UserEditorDialog.vue'
import type { CustomerUser, CustomerUserRole, UserListParams } from '@/types/customerUser'

const loading = ref(false)
const rows = ref<CustomerUser[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const editingId = ref<number>()
const query = reactive({
  keyword: '',
  role: '' as '' | CustomerUserRole,
  status: '' as '' | boolean,
})
const pagination = reactive({ pageNum: 1, pageSize: 10 })

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'
const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false })
const displayName = (row: CustomerUser) => row.realName || row.nickname || '未完善资料'

const loadData = async () => {
  loading.value = true
  try {
    const params: UserListParams = { pageNum: pagination.pageNum, pageSize: pagination.pageSize }
    if (query.keyword.trim()) params.keyword = query.keyword.trim()
    if (query.role) params.role = query.role
    if (query.status !== '') params.status = query.status
    const { data } = await userApi.list(params)
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

const search = () => {
  pagination.pageNum = 1
  loadData()
}
const resetQuery = () => {
  Object.assign(query, { keyword: '', role: '', status: '' })
  search()
}
const openEdit = (row: CustomerUser) => {
  editingId.value = row.id
  dialogVisible.value = true
}
const disable = async (row: CustomerUser) => {
  try {
    await ElMessageBox.confirm(
      `禁用“${displayName(row)}”后，该用户将无法正常使用账号，确定继续吗？`,
      '禁用用户',
      { type: 'warning', confirmButtonText: '确认禁用', cancelButtonText: '取消' },
    )
    await userApi.disable(row.id)
    ElMessage.success('用户已禁用')
    await loadData()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
  }
}

onMounted(loadData)
</script>

<template>
  <section class="customers-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" @submit.prevent="search">
        <el-form-item label="用户信息"
          ><el-input v-model="query.keyword" clearable placeholder="用户编号、手机号、昵称或姓名"
        /></el-form-item>
        <el-form-item label="用户角色"
          ><el-select v-model="query.role" clearable placeholder="全部角色"
            ><el-option label="客户" value="CUSTOMER" /><el-option
              label="员工"
              value="EMPLOYEE" /></el-select
        ></el-form-item>
        <el-form-item label="账号状态"
          ><el-select v-model="query.status" clearable placeholder="全部状态"
            ><el-option label="启用" :value="true" /><el-option
              label="禁用"
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
          <h2>用户管理</h2>
          <p>查看自然注册用户资料、积分与账号状态</p>
        </div>
      </div>
      <div class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          height="100%"
          border
          empty-text="暂无用户"
        >
          <el-table-column label="用户" min-width="230" fixed="left"
            ><template #default="{ row }"
              ><div class="user-cell">
                <el-avatar :size="42" :src="row.avatar || undefined">{{
                  displayName(row).slice(0, 1)
                }}</el-avatar>
                <div>
                  <strong>{{ displayName(row) }}</strong
                  ><small>{{ row.nickname || '暂无昵称' }} · {{ row.userNo }}</small>
                </div>
              </div></template
            ></el-table-column
          >
          <el-table-column prop="mobile" label="手机号" width="130" />
          <el-table-column label="角色" width="90" align="center"
            ><template #default="{ row }"
              ><el-tag :type="row.role === 'EMPLOYEE' ? 'warning' : ''">{{
                row.role === 'EMPLOYEE' ? '员工' : '客户'
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="来源/城市" min-width="145"
            ><template #default="{ row }"
              >{{ row.source || '—' }}<br /><small class="muted">{{
                row.city || '城市未填写'
              }}</small></template
            ></el-table-column
          >
          <el-table-column label="标签" min-width="180"
            ><template #default="{ row }"
              ><el-space v-if="row.tags?.length" wrap :size="4"
                ><el-tag v-for="tag in row.tags" :key="tag" size="small" type="info">{{
                  tag
                }}</el-tag></el-space
              ><span v-else>—</span></template
            ></el-table-column
          >
          <el-table-column label="积分" width="95" align="right"
            ><template #default="{ row }">{{ row.points }}</template></el-table-column
          >
          <el-table-column label="状态" width="85" align="center"
            ><template #default="{ row }"
              ><el-tag :type="row.status ? 'success' : 'info'">{{
                row.status ? '启用' : '禁用'
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="注册时间" width="170"
            ><template #default="{ row }">{{
              formatDate(row.createdAt)
            }}</template></el-table-column
          >
          <el-table-column label="操作" width="125" fixed="right"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="openEdit(row)">编辑</el-button
              ><el-button v-if="row.status" link type="danger" @click="disable(row)"
                >禁用</el-button
              ></template
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
    <UserEditorDialog v-model="dialogVisible" :user-id="editingId" @saved="loadData" />
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
    width: 270px;
  }
  .el-select {
    width: 160px;
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
.muted {
  color: var(--jfx-muted);
  line-height: 24px;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}
</style>
