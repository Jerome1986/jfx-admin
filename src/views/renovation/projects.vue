<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { projectApi } from '@/api/projects'
import { projectStatuses, type Project, type ProjectListParams } from '@/types/project'
import { projectMoney, projectTime } from '@/utils/project'
import ProjectDetailDrawer from './components/ProjectDetailDrawer.vue'
import ProjectActionDialog from './components/ProjectActionDialog.vue'
const query = reactive<ProjectListParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  owner: '',
  status: '',
})
const rows = ref<Project[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref(false)
const selectedId = ref<number>()
const detailVisible = ref(false)
const createVisible = ref(false)
let requestId = 0
async function load() {
  const current = ++requestId
  loading.value = true
  error.value = false
  try {
    const { data } = await projectApi.list({ ...query })
    if (current !== requestId) return
    rows.value = data.list
    total.value = data.total
  } catch {
    if (current === requestId) {
      error.value = true
      rows.value = []
      total.value = 0
    }
  } finally {
    if (current === requestId) loading.value = false
  }
}
function search() {
  query.pageNum = 1
  void load()
}
function reset() {
  Object.assign(query, { keyword: '', owner: '', status: '' })
  search()
}
function open(row: Project) {
  selectedId.value = row.id
  detailVisible.value = true
}
onMounted(load)
</script>
<template>
  <section class="placeholder-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" @submit.prevent="search">
        <el-form-item label="项目信息"
          ><el-input v-model="query.keyword" clearable placeholder="项目名称或客户姓名"
        /></el-form-item>
        <el-form-item label="负责人"
          ><el-input v-model="query.owner" clearable placeholder="负责人姓名"
        /></el-form-item>
        <el-form-item label="项目状态"
          ><el-select v-model="query.status" clearable placeholder="全部状态"
            ><el-option
              v-for="(label, value) in projectStatuses"
              :key="value"
              :label="label"
              :value="value" /></el-select
        ></el-form-item>
        <el-form-item
          ><el-button type="primary" native-type="submit">查询</el-button
          ><el-button @click="reset">重置</el-button></el-form-item
        >
      </el-form>
    </div>
    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>装修项目</h2>
          <p>客户装修项目、报价与服务进度</p>
        </div>
        <el-button type="primary" @click="createVisible = true">新增项目</el-button>
      </div>
      <el-alert v-if="error" title="项目加载失败" type="error" :closable="false"
        ><el-button link @click="load">重新加载</el-button></el-alert
      >
      <div class="fill-content-body">
        <el-table v-loading="loading" :data="rows" height="100%">
          <el-table-column
            prop="projectNo"
            label="项目编号"
            min-width="205"
            show-overflow-tooltip
          />
          <el-table-column prop="name" label="项目名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="customerName" label="客户" width="100" />
          <el-table-column prop="mobile" label="手机号" width="125" />
          <el-table-column label="负责人" width="110"
            ><template #default="{ row }">{{
              row.employeeName || '未分配'
            }}</template></el-table-column
          >
          <el-table-column label="报价金额" width="125"
            ><template #default="{ row }">{{
              row.quotedAmount == null ? '未报价' : projectMoney(row.quotedAmount)
            }}</template></el-table-column
          >
          <el-table-column label="合同金额" width="125"
            ><template #default="{ row }">{{
              projectMoney(row.contractAmount)
            }}</template></el-table-column
          >
          <el-table-column label="状态" width="100"
            ><template #default="{ row }"
              ><el-tag>{{
                projectStatuses[row.status as keyof typeof projectStatuses] || row.status
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column prop="progress" label="当前进度" min-width="190" show-overflow-tooltip />
          <el-table-column label="更新时间" min-width="170"
            ><template #default="{ row }">{{
              projectTime(row.updatedAt)
            }}</template></el-table-column
          >
          <el-table-column label="操作" fixed="right" width="90"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="open(row)">查看详情</el-button></template
            ></el-table-column
          >
        </el-table>
      </div>
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @size-change="search"
        @current-change="load"
      />
    </div>
    <ProjectDetailDrawer v-model="detailVisible" :project-id="selectedId" @saved="load" />
    <ProjectActionDialog v-model="createVisible" mode="create" @saved="search" />
  </section>
</template>
<style scoped>
.pagination {
  margin-top: 18px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
</style>
