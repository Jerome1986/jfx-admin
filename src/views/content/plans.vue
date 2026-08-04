<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

import { planSpaceApi } from '@/api/planSpaces'
import type { PlanSpace, PlanSpaceInput } from '@/types/planSpace'

// 控制适用空间列表的加载状态。
const loading = ref(false)
// 保存全部适用空间数据。
const spaces = ref<PlanSpace[]>([])
// 控制适用空间管理抽屉的显示状态。
const drawerVisible = ref(false)
// 控制适用空间编辑弹窗的显示状态。
const dialogVisible = ref(false)
// 标记适用空间表单是否正在提交。
const submitting = ref(false)
// 保存当前正在编辑的适用空间。
const editing = ref<PlanSpace>()
// 引用适用空间表单实例以执行校验。
const formRef = ref<FormInstance>()
// 保存焕新方案页面的筛选条件。
const query = reactive({ name: '', spaceId: '', status: '' })
// 保存适用空间新增或编辑表单数据。
const form = reactive<PlanSpaceInput>({ name: '', sort: 10 })

// 生成包含停用标记的空间筛选选项。
const spaceOptions = computed(() =>
  spaces.value.map((space) => ({
    ...space,
    optionLabel: space.status === 'disabled' ? `${space.name}（已停用）` : space.name,
  })),
)
// 判断当前是否至少存在一个启用空间。
const hasEnabledSpace = computed(() => spaces.value.some((space) => space.status === 'enabled'))

// 定义适用空间表单的字段校验规则。
const rules: FormRules<PlanSpaceInput> = {
  name: [
    { required: true, message: '请输入空间名称', trigger: 'blur' },
    { min: 1, max: 20, message: '空间名称长度应为 1 到 20 个字符', trigger: 'blur' },
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'change' },
    {
      validator: (_rule, value, callback) =>
        Number.isInteger(value) && value >= 0 && value <= 9999
          ? callback()
          : callback(new Error('排序必须是 0 到 9999 的整数')),
      trigger: 'change',
    },
  ],
}

// 将未知异常转换为可展示的错误信息。
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'

// 从仓储加载全部适用空间。
const loadSpaces = async () => {
  loading.value = true
  try {
    spaces.value = await planSpaceApi.list()
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    loading.value = false
  }
}

// 清空焕新方案页面的筛选条件。
const resetQuery = () => Object.assign(query, { name: '', spaceId: '', status: '' })

// 打开新增适用空间表单。
const openCreate = () => {
  editing.value = undefined
  Object.assign(form, { name: '', sort: (spaces.value.at(-1)?.sort ?? 0) + 10 })
  dialogVisible.value = true
}

// 打开指定适用空间的编辑表单。
const openEdit = (space: PlanSpace) => {
  editing.value = space
  Object.assign(form, { name: space.name, sort: space.sort })
  dialogVisible.value = true
}

// 校验并提交适用空间表单。
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
    if (editing.value) {
      await planSpaceApi.update(editing.value.id, {
        name: form.name,
        sort: form.sort,
        updatedAt: editing.value.updatedAt,
      })
      ElMessage.success('适用空间修改成功')
    } else {
      await planSpaceApi.create(form)
      ElMessage.success('适用空间新增成功')
    }
    dialogVisible.value = false
    await loadSpaces()
  } catch (error) {
    ElMessage.error(messageOf(error))
    await loadSpaces()
  } finally {
    submitting.value = false
  }
}

// 切换指定适用空间的启用状态。
const toggleStatus = async (space: PlanSpace) => {
  // 计算适用空间切换后的目标状态。
  const next = space.status === 'enabled' ? 'disabled' : 'enabled'
  try {
    await ElMessageBox.confirm(
      next === 'disabled'
        ? `停用后，新建或编辑方案时将不能选择“${space.name}”，历史方案不受影响。`
        : `确定启用“${space.name}”吗？`,
      next === 'disabled' ? '停用适用空间' : '启用适用空间',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' },
    )
    await planSpaceApi.setStatus(space.id, next, space.updatedAt)
    ElMessage.success(next === 'enabled' ? '适用空间已启用' : '适用空间已停用')
    await loadSpaces()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
    await loadSpaces()
  }
}

// 删除未被使用的适用空间。
const remove = async (space: PlanSpace) => {
  if (space.planCount > 0)
    return ElMessage.warning(`该空间已关联 ${space.planCount} 个方案，只能停用`)
  try {
    await ElMessageBox.confirm(`删除“${space.name}”后无法恢复，确定继续吗？`, '删除适用空间', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await planSpaceApi.remove(space.id, space.updatedAt)
    if (query.spaceId === space.id) query.spaceId = ''
    ElMessage.success('适用空间已删除')
    await loadSpaces()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
    await loadSpaces()
  }
}

onMounted(loadSpaces)
</script>

<template>
  <section class="placeholder-page plan-page">
    <div class="filter-card">
      <el-form :inline="true" :model="query" label-position="left">
        <el-form-item label="方案名称"
          ><el-input v-model="query.name" clearable placeholder="请输入方案名称"
        /></el-form-item>
        <el-form-item label="适用空间">
          <el-select
            v-model="query.spaceId"
            clearable
            placeholder="全部适用空间"
            :loading="loading"
          >
            <el-option
              v-for="space in spaceOptions"
              :key="space.id"
              :label="space.optionLabel"
              :value="space.id"
            >
              <span>{{ space.name }}</span
              ><el-tag
                v-if="space.status === 'disabled'"
                class="option-status"
                size="small"
                type="info"
                >已停用</el-tag
              >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="上下架状态">
          <el-select v-model="query.status" clearable placeholder="全部上下架状态"
            ><el-option label="已上架" value="published" /><el-option
              label="已下架"
              value="offline"
          /></el-select>
        </el-form-item>
        <el-form-item class="filter-actions"
          ><el-button type="primary">查询</el-button
          ><el-button @click="resetQuery">重置</el-button></el-form-item
        >
      </el-form>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div>
          <h2>焕新方案</h2>
          <p>内容管理数据列表</p>
        </div>
        <div class="toolbar-actions">
          <el-button @click="drawerVisible = true">适用空间管理</el-button
          ><el-button type="primary">新增方案</el-button>
        </div>
      </div>
      <el-empty description="暂无方案数据" />
    </div>

    <el-drawer v-model="drawerVisible" title="适用空间管理" size="760px">
      <template #header
        ><div class="drawer-heading">
          <div>
            <strong>适用空间管理</strong>
            <p>维护方案筛选和编辑时使用的空间</p>
          </div>
          <el-button type="primary" @click="openCreate">新增空间</el-button>
        </div></template
      >
      <el-table v-loading="loading" :data="spaces" row-key="id" empty-text="暂无适用空间">
        <el-table-column prop="name" label="空间名称" min-width="130" />
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column prop="planCount" label="关联方案" width="90" align="center" />
        <el-table-column label="状态" width="82"
          ><template #default="{ row }"
            ><el-tag :type="row.status === 'enabled' ? 'success' : 'info'">{{
              row.status === 'enabled' ? '启用' : '停用'
            }}</el-tag></template
          ></el-table-column
        >
        <el-table-column label="操作" width="178" fixed="right"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="openEdit(row)">编辑</el-button
            ><el-button
              link
              :type="row.status === 'enabled' ? 'warning' : 'success'"
              @click="toggleStatus(row)"
              >{{ row.status === 'enabled' ? '停用' : '启用' }}</el-button
            ><el-button link type="danger" :disabled="row.planCount > 0" @click="remove(row)"
              >删除</el-button
            ></template
          ></el-table-column
        >
      </el-table>
      <div v-if="!hasEnabledSpace" class="taxonomy-warning">
        当前没有启用的适用空间，新建方案时将无法选择。
      </div>
    </el-drawer>

    <el-dialog
      v-model="dialogVisible"
      :title="editing ? '编辑适用空间' : '新增适用空间'"
      width="480px"
      destroy-on-close
      @closed="formRef?.clearValidate()"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="空间名称" prop="name"
          ><el-input v-model="form.name" maxlength="20" show-word-limit placeholder="例如：玄关"
        /></el-form-item>
        <el-form-item label="排序" prop="sort"
          ><el-input-number
            v-model="form.sort"
            :min="0"
            :max="9999"
            :step="10"
            controls-position="right"
        /></el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="dialogVisible = false">取消</el-button
        ><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></template
      >
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
.toolbar-actions {
  display: flex;
  gap: 10px;
}
.option-status {
  float: right;
  margin-top: 5px;
}
.drawer-heading {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding-right: 20px;
  strong {
    font-size: 18px;
  }
  p {
    margin: 6px 0 0;
    color: var(--jfx-muted);
    font-size: 12px;
  }
}
.taxonomy-warning {
  margin-top: 16px;
  padding: 12px 14px;
  color: #b25f00;
  background: #fff7e8;
  border-radius: 6px;
  font-size: 13px;
}
</style>
