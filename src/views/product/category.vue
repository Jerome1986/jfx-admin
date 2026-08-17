<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

import { productCategoryApi } from '@/api/productCategories'
import type { ProductCategory, ProductCategoryInput } from '@/types/productCategory'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const rows = ref<ProductCategory[]>([])
const editingId = ref<number>()
const formRef = ref<FormInstance>()
const query = reactive({ keyword: '', status: '' as '' | boolean })
const appliedQuery = reactive({ keyword: '', status: '' as '' | boolean })
const form = reactive<ProductCategoryInput>({
  name: '',
  sort: 0,
  isEnabled: true,
})

const parentOptions = computed(() => rows.value.filter((item) => item.id !== editingId.value))
const filteredRows = computed(() => {
  const keyword = appliedQuery.keyword.trim().toLowerCase()
  const matches = (item: ProductCategory) =>
    (!keyword || item.name.toLowerCase().includes(keyword)) &&
    (appliedQuery.status === '' || item.isEnabled === appliedQuery.status)

  return rows.value.reduce<ProductCategory[]>((result, item) => {
    const children = (item.children ?? []).filter(matches)
    if (matches(item) || children.length) result.push({ ...item, children })
    return result
  }, [])
})

const rules: FormRules<ProductCategoryInput> = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 30, message: '分类名称不能超过 30 个字符', trigger: 'blur' },
  ],
  sort: [{ required: true, message: '请输入排序值', trigger: 'change' }],
}

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'

const loadCategories = async () => {
  loading.value = true
  try {
    const { data } = await productCategoryApi.list()
    rows.value = data
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    loading.value = false
  }
}

const resetForm = (parentId?: number) => {
  editingId.value = undefined
  Object.assign(form, {
    parentId,
    name: '',
    sort: 0,
    isEnabled: true,
  })
}

const openCreate = (parentId?: number) => {
  resetForm(parentId)
  dialogVisible.value = true
}

const openEdit = async (row: ProductCategory) => {
  try {
    const { data } = await productCategoryApi.detail(row.id)
    editingId.value = data.id
    Object.assign(form, {
      parentId: data.parentId ?? undefined,
      name: data.name,
      sort: data.sort,
      isEnabled: data.isEnabled,
    })
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error(messageOf(error))
  }
}

const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
    const payload: ProductCategoryInput = {
      ...(form.parentId ? { parentId: form.parentId } : {}),
      name: form.name,
      sort: form.sort,
      isEnabled: form.isEnabled,
    }
    if (editingId.value) await productCategoryApi.update(editingId.value, payload)
    else await productCategoryApi.create(payload)
    ElMessage.success(editingId.value ? '分类修改成功' : '分类新增成功')
    dialogVisible.value = false
    await loadCategories()
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    submitting.value = false
  }
}

const setStatus = async (row: ProductCategory, isEnabled: boolean) => {
  try {
    await productCategoryApi.setStatus(row.id, isEnabled)
    ElMessage.success(isEnabled ? '分类已启用' : '分类已停用')
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    await loadCategories()
  }
}

const remove = async (row: ProductCategory) => {
  try {
    await ElMessageBox.confirm(`删除“${row.name}”后无法恢复，确定继续吗？`, '删除商品分类', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await productCategoryApi.remove(row.id)
    ElMessage.success('分类已删除')
    await loadCategories()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
  }
}

const search = () => Object.assign(appliedQuery, query)

const resetQuery = () => {
  Object.assign(query, { keyword: '', status: '' })
  search()
}

onMounted(loadCategories)
</script>

<template>
  <section class="category-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" @submit.prevent="search">
        <el-form-item label="分类名称">
          <el-input v-model="query.keyword" clearable placeholder="请输入分类名称" />
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
          <h2>商品分类</h2>
          <p>维护一级分类及其二级子分类、排序和启停状态</p>
        </div>
        <el-button type="primary" @click="openCreate()">新增一级分类</el-button>
      </div>
      <div class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="filteredRows"
          row-key="id"
          height="100%"
          border
          default-expand-all
          empty-text="暂无商品分类"
        >
          <el-table-column prop="name" label="分类名称" min-width="220" fixed="left" />
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.isEnabled"
                inline-prompt
                active-text="启"
                inactive-text="停"
                @change="setStatus(row, Boolean($event))"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="210" fixed="right">
            <template #default="{ row }">
              <el-button v-if="!row.parentId" link type="primary" @click="openCreate(row.id)">
                新增子分类
              </el-button>
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑商品分类' : '新增商品分类'"
      width="600px"
      destroy-on-close
      :close-on-click-modal="false"
      @closed="formRef?.clearValidate()"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="上级分类">
          <el-select v-model="form.parentId" clearable placeholder="无（一级分类）">
            <el-option v-for="item in parentOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态" prop="isEnabled">
          <el-radio-group v-model="form.isEnabled">
            <el-radio :value="true">启用</el-radio>
            <el-radio :value="false">停用</el-radio>
          </el-radio-group>
        </el-form-item>
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

  .el-input,
  .el-select {
    width: 220px;
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

</style>
