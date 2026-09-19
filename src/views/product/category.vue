<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

import { productCategoryApi } from '@/api/productCategories'
import type { ProductCategory, ProductCategoryInput } from '@/types/productCategory'

// 标记数据是否正在加载。
const loading = ref(false)
// 标记表单是否正在提交。
const submitting = ref(false)
// 控制编辑弹窗的显示状态。
const dialogVisible = ref(false)
// 保存列表展示数据。
const rows = ref<ProductCategory[]>([])
// 保存当前编辑记录的 ID。
const editingId = ref<number>()
// 引用表单实例，用于校验和重置。
const formRef = ref<FormInstance>()
// 保存列表筛选条件。
const query = reactive({ keyword: '', status: '' as '' | boolean })
// 保存已应用到列表的筛选条件。
const appliedQuery = reactive({ keyword: '', status: '' as '' | boolean })
// 保存表单编辑数据。
const form = reactive<ProductCategoryInput>({
  name: '',
  sort: 0,
  isEnabled: true,
})

// 过滤当前分类，生成可选的父级分类。
const parentOptions = computed(() => rows.value.filter((item) => item.id !== editingId.value))
// 计算符合筛选条件的列表数据。
const filteredRows = computed(() => {
  // 整理用于搜索匹配的关键字。
  const keyword = appliedQuery.keyword.trim().toLowerCase()
  // 判断分类是否符合当前筛选条件。
  const matches = (item: ProductCategory) =>
    (!keyword || item.name.toLowerCase().includes(keyword)) &&
    (appliedQuery.status === '' || item.isEnabled === appliedQuery.status)

  return rows.value.reduce<ProductCategory[]>((result, item) => {
    // 保存符合筛选条件的子分类。
    const children = (item.children ?? []).filter(matches)
    if (matches(item) || children.length) result.push({ ...item, children })
    return result
  }, [])
})

// 定义表单字段校验规则。
const rules: FormRules<ProductCategoryInput> = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 30, message: '分类名称不能超过 30 个字符', trigger: 'blur' },
  ],
  sort: [{ required: true, message: '请输入排序值', trigger: 'change' }],
}

// 将异常转换为可展示的错误消息。
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'

// 加载分类列表。
const loadCategories = async () => {
  loading.value = true
  try {
    // 获取接口返回的业务数据。
    const { data } = await productCategoryApi.list()
    rows.value = data
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    loading.value = false
  }
}

// 将表单恢复为初始数据。
const resetForm = (parentId?: number) => {
  editingId.value = undefined
  Object.assign(form, {
    parentId,
    name: '',
    sort: 0,
    isEnabled: true,
  })
}

// 初始化并打开新增弹窗。
const openCreate = (parentId?: number) => {
  resetForm(parentId)
  dialogVisible.value = true
}

// 设置编辑记录并打开编辑弹窗。
const openEdit = async (row: ProductCategory) => {
  try {
    // 获取接口返回的业务数据。
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

// 校验表单并提交保存。
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
    // 组装接口提交数据。
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

// 更新当前记录的启用状态。
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

// 确认后删除当前记录并刷新列表。
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

// 应用当前筛选条件查询列表。
const search = () => Object.assign(appliedQuery, query)

// 清空筛选条件并更新列表。
const resetQuery = () => {
  Object.assign(query, { keyword: '', status: '' })
  search()
}

// 页面挂载后加载初始数据。
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
