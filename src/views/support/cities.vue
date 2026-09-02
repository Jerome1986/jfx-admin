<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { serviceCityApi } from '@/api/serviceCities'
import type { ServiceCity, ServiceCityInput } from '@/types/serviceCity'

interface ServiceCityForm {
  name: string
  sort: number
  status: boolean
}

const emptyForm = (): ServiceCityForm => ({
  name: '',
  sort: 0,
  status: true,
})

const rows = ref<ServiceCity[]>([])
const total = ref(0)
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number>()
const formRef = ref<FormInstance>()
const query = reactive({ keyword: '', status: '' as '' | boolean })
const pagination = reactive({ pageNum: 1, pageSize: 10 })
const form = reactive<ServiceCityForm>(emptyForm())

const rules: FormRules<ServiceCityForm> = {
  name: [{ required: true, message: '请输入城市名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序值', trigger: 'change' }],
}

const loadData = async () => {
  loading.value = true
  try {
    const keyword = query.keyword.trim()
    const { data } = await serviceCityApi.list({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      ...(keyword && { keyword }),
      ...(query.status !== '' && { status: query.status }),
    })
    rows.value = data.list
    total.value = data.total
    pagination.pageNum = data.pageNum
    pagination.pageSize = data.pageSize
  } finally {
    loading.value = false
  }
}

const search = () => {
  pagination.pageNum = 1
  loadData()
}
const resetQuery = () => {
  Object.assign(query, { keyword: '', status: '' })
  search()
}
const openCreate = () => {
  editingId.value = undefined
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}
const openEdit = async (row: ServiceCity) => {
  editingId.value = row.id
  dialogVisible.value = true
  const { data } = await serviceCityApi.detail(row.id)
  Object.assign(form, { name: data.name, sort: data.sort, status: data.status })
}
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
    const payload: ServiceCityInput = {
      name: form.name.trim(),
      sort: form.sort,
      status: form.status,
    }
    if (editingId.value !== undefined) {
      await serviceCityApi.update(editingId.value, payload)
    } else {
      await serviceCityApi.create(payload)
    }
    dialogVisible.value = false
    ElMessage.success(editingId.value === undefined ? '城市已添加' : '城市已更新')
    await loadData()
  } finally {
    submitting.value = false
  }
}
const toggleStatus = async (row: ServiceCity) => {
  const action = row.status ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}“${row.name}”吗？`, `${action}城市`, {
      type: 'warning',
      confirmButtonText: `确认${action}`,
      cancelButtonText: '取消',
    })
    await serviceCityApi.update(row.id, { status: !row.status })
    ElMessage.success(`城市已${action}`)
    await loadData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  }
}
const remove = async (row: ServiceCity) => {
  try {
    await ElMessageBox.confirm(`删除“${row.name}”后无法恢复，确定继续吗？`, '删除城市', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    await serviceCityApi.remove(row.id)
    if (rows.value.length === 1 && pagination.pageNum > 1) pagination.pageNum--
    ElMessage.success('城市已删除')
    await loadData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  }
}

onMounted(loadData)
</script>

<template>
  <section class="cities-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" @submit.prevent="search">
        <el-form-item label="城市">
          <el-input v-model="query.keyword" clearable placeholder="请输入城市名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态">
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>服务城市管理</h2>
          <p>维护业务覆盖城市及服务网点的可选城市范围</p>
        </div>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增城市</el-button>
      </div>
      <div class="fill-content-body">
        <el-table v-loading="loading" :data="rows" row-key="id" height="100%" border>
          <el-table-column prop="name" label="城市" min-width="180" fixed="left" />
          <el-table-column prop="sort" label="排序" min-width="100" align="center" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link :type="row.status ? 'warning' : 'success'" @click="toggleStatus(row)">
                {{ row.status ? '停用' : '启用' }}
              </el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
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

    <el-dialog
      v-model="dialogVisible"
      :title="editingId === undefined ? '新增服务城市' : '编辑服务城市'"
      width="520px"
      destroy-on-close
      :close-on-click-modal="false"
      @closed="formRef?.resetFields()"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <div class="form-grid">
          <el-form-item label="城市名称" prop="name" class="span-2">
            <el-input v-model="form.name" maxlength="50" placeholder="如：杭州市" />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="form.sort" :min="0" :step="1" :precision="0" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" inline-prompt active-text="启用" inactive-text="停用" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
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
  .el-input { width: 220px; }
  .el-select { width: 140px; }
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  h2 { margin: 0; font-size: 17px; }
  p { margin: 6px 0 0; color: var(--jfx-muted); font-size: 12px; }
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 18px;
  .span-2 { grid-column: 1 / -1; }
  .el-input-number { width: 100%; }
}
</style>
