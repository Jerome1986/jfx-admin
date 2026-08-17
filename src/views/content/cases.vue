<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

import { caseApi } from '@/api/cases'
import { caseCategoryApi } from '@/api/caseCategories'
import CaseDetailDrawer from './components/CaseDetailDrawer.vue'
import CaseEditorDialog from './components/CaseEditorDialog.vue'
import type { CaseDetail, CaseListItem, CaseQuery, CaseStatus } from '@/types/case'
import type { CaseCategory, CaseCategoryInput } from '@/types/caseCategory'

// 控制案例列表的加载状态。
const loading = ref(false)
// 标记列表当前是否使用综合搜索接口。
const searchActive = ref(false)
// 保存当前分页展示的案例数据。
const rows = ref<CaseListItem[]>([])
// 保存符合筛选条件的案例总数。
const total = ref(0)
// 保存可用的案例分类列表。
const categories = ref<CaseCategory[]>([])
// 保存当前查看的案例详情。
const detail = ref<CaseDetail>()
// 控制案例详情抽屉的显示状态。
const detailVisible = ref(false)
// 控制分类管理抽屉的显示状态。
const categoryDrawerVisible = ref(false)
// 控制分类编辑弹窗的显示状态。
const categoryDialogVisible = ref(false)
// 标记分类表单是否正在提交。
const categorySubmitting = ref(false)
// 保存当前正在编辑的分类。
const editingCategory = ref<CaseCategory>()
// 引用分类表单实例以执行校验。
const categoryFormRef = ref<FormInstance>()
// 控制案例新增编辑弹框的显示状态。
const caseDialogVisible = ref(false)
// 保存当前正在编辑的案例 ID。
const editingCaseId = ref<number>()

// 保存案例列表的查询和分页条件。
const query = reactive<CaseQuery>({
  title: '',
  categoryId: '',
  city: '',
  status: '',
  isRecommended: '',
  pageNum: 1,
  pageSize: 5,
})
// 保存分类新增或编辑表单数据。
const categoryForm = reactive<CaseCategoryInput>({ name: '', sort: 10 })

// 提供案例城市筛选选项。
const cities = ['北京', '上海', '杭州', '深圳', '武汉']
// 建立分类 ID 到名称的快速映射。
const categoryMap = computed(() => new Map(categories.value.map((item) => [item.id, item.name])))
// 判断当前是否至少存在一个启用分类。
const hasEnabledCategory = computed(() => categories.value.some((item) => item.isEnabled))
// 定义分类表单的字段校验规则。
const categoryRules: FormRules<CaseCategoryInput> = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '分类名称长度应为 2 到 20 个字符', trigger: 'blur' },
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

// 从分类仓储加载全部案例分类。
const loadCategories = async () => {
  const { data } = await caseCategoryApi.list()
  categories.value = data
}

// 按当前查询条件加载案例分页数据。
const loadCases = async () => {
  loading.value = true
  try {
    // 搜索状态下保持筛选条件，否则只按分页获取列表。
    const { data } = searchActive.value ? await caseApi.search(query) : await caseApi.list(query)

    rows.value = data.list
    total.value = data.total
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    loading.value = false
  }
}

// 从第一页执行案例查询。
const search = () => {
  query.pageNum = 1
  searchActive.value = true
  void loadCases()
}

// 清空筛选条件并重新加载案例列表。
const resetQuery = () => {
  searchActive.value = false
  Object.assign(query, {
    title: '',
    categoryId: '',
    city: '',
    status: '',
    isRecommended: '',
    pageNum: 1,
  })
  void loadCases()
}

// 将金额数值格式化为元或万元文本。
const formatPrice = (value: number) =>
  value >= 10000 ? `${Number((value / 10000).toFixed(2))}万` : `${value.toLocaleString('zh-CN')}元`
// 将 ISO 日期格式化为简短日期文本。
const formatDate = (value?: string) => (value ? value.slice(0, 10) : '—')
// 更新指定案例的发布状态。
const updateStatus = async (row: CaseListItem, value: CaseStatus) => {
  try {
    await caseApi.setStatus(row.id, value)
    ElMessage.success(
      value === 'PUBLISHED' ? '案例已发布' : value === 'OFFLINE' ? '案例已下架' : '已转为草稿',
    )
    await loadCases()
  } catch (error) {
    ElMessage.error(messageOf(error))
  }
}

// 更新指定案例的首页推荐状态。
const updateRecommended = async (row: CaseListItem, value: boolean) => {
  try {
    await caseApi.setRecommended(row.id, value)
    ElMessage.success(value ? '已设为首页推荐' : '已取消首页推荐')
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    await loadCases()
  }
}

// 加载并打开指定案例的详情抽屉。
const showDetail = async (row: CaseListItem) => {
  try {
    const { data } = await caseApi.detail(row.id)
    detail.value = data
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(messageOf(error))
  }
}

// 打开空白案例新增表单。
const openCreateCase = () => {
  editingCaseId.value = undefined
  caseDialogVisible.value = true
}

// 加载指定案例并打开编辑表单。
const openEditCase = (row: CaseListItem) => {
  editingCaseId.value = row.id
  caseDialogVisible.value = true
}

// 二次确认后删除案例，并保持分页位置有效。
const removeCase = async (row: CaseListItem) => {
  try {
    await ElMessageBox.confirm(`删除“${row.title}”后无法恢复，确定继续吗？`, '删除案例', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    })
    await caseApi.remove(row.id)
    if (rows.value.length === 1 && query.pageNum > 1) query.pageNum -= 1
    await loadCases()
    ElMessage.success('案例已删除')
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
  }
}

// 打开新增分类表单并初始化默认排序。
const openCreateCategory = () => {
  editingCategory.value = undefined
  Object.assign(categoryForm, { name: '', sort: (categories.value.at(-1)?.sort ?? 0) + 10 })
  categoryDialogVisible.value = true
}

// 打开指定分类的编辑表单。
const openEditCategory = (category: CaseCategory) => {
  editingCategory.value = category
  Object.assign(categoryForm, { name: category.name, sort: category.sort })
  categoryDialogVisible.value = true
}

// 校验并提交分类新增或修改数据。
const submitCategory = async () => {
  if (!(await categoryFormRef.value?.validate().catch(() => false))) return
  categorySubmitting.value = true
  try {
    if (editingCategory.value) {
      await caseCategoryApi.update(editingCategory.value.id, categoryForm)
      ElMessage.success('分类修改成功')
    } else {
      await caseCategoryApi.create(categoryForm)
      ElMessage.success('分类新增成功')
    }
    categoryDialogVisible.value = false
    await loadCategories()
  } catch (error) {
    ElMessage.error(messageOf(error))
    await loadCategories()
  } finally {
    categorySubmitting.value = false
  }
}

// 切换指定分类的启用状态。
const toggleCategoryStatus = async (category: CaseCategory) => {
  try {
    // 计算分类切换后的目标状态。
    const isEnabled = !category.isEnabled
    await caseCategoryApi.setStatus(category.id, isEnabled)
    ElMessage.success(isEnabled ? '分类已启用' : '分类已停用')
    await loadCategories()
  } catch (error) {
    ElMessage.error(messageOf(error))
    await loadCategories()
  }
}

// 确认后删除指定分类。
const removeCategory = async (category: CaseCategory) => {
  try {
    await ElMessageBox.confirm(`删除“${category.name}”后无法恢复，确定继续吗？`, '删除案例分类', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await caseCategoryApi.remove(category.id)
    ElMessage.success('分类已删除')
    await loadCategories()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
    await loadCategories()
  }
}

onMounted(async () => {
  try {
    await loadCategories()
    await loadCases()
  } catch (error) {
    ElMessage.error(messageOf(error))
  }
})
</script>

<template>
  <section class="case-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" label-position="left">
        <el-form-item label="案例标题"
          ><el-input
            v-model="query.title"
            clearable
            placeholder="请输入案例标题"
            @keyup.enter="search"
        /></el-form-item>
        <el-form-item label="案例分类">
          <el-select v-model="query.categoryId" clearable placeholder="全部案例分类">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="!item.isEnabled ? `${item.name}（已停用）` : item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="城市"
          ><el-select v-model="query.city" clearable placeholder="全部城市"
            ><el-option v-for="city in cities" :key="city" :label="city" :value="city" /></el-select
        ></el-form-item>
        <el-form-item label="发布状态"
          ><el-select v-model="query.status" clearable placeholder="全部状态"
            ><el-option label="草稿" value="DRAFT" /><el-option
              label="已发布"
              value="PUBLISHED" /><el-option label="已下架" value="OFFLINE" /></el-select
        ></el-form-item>
        <el-form-item label="首页推荐"
          ><el-select v-model="query.isRecommended" clearable placeholder="全部"
            ><el-option label="已推荐" :value="true" /><el-option
              label="未推荐"
              :value="false" /></el-select
        ></el-form-item>
        <el-form-item class="filter-actions"
          ><el-button type="primary" @click="search">查询</el-button
          ><el-button @click="resetQuery">重置</el-button></el-form-item
        >
      </el-form>
    </div>

    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>案例管理</h2>
          <p>统一维护案例内容、发布状态和首页推荐</p>
        </div>
        <div class="toolbar-actions">
          <el-button @click="categoryDrawerVisible = true">分类管理</el-button
          ><el-button type="primary" @click="openCreateCase">新增案例</el-button>
        </div>
      </div>
      <div class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          height="100%"
          border
          empty-text="暂无符合条件的案例"
        >
          <el-table-column label="案例" min-width="190" fixed="left">
            <template #default="{ row }">
              <div class="case-cell">
                <div>
                  <strong>{{ row.title }}</strong
                  ><small>{{ categoryMap.get(row.categoryId) || '未知分类' }}</small>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="改造前" width="112" align="center">
            <template #default="{ row }">
              <div class="table-cover before">
                <span>改造前</span>
                <img
                  v-if="row.beforeImage"
                  :src="row.beforeImage"
                  alt="改造前封面"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="改造后" width="112" align="center">
            <template #default="{ row }">
              <div class="table-cover after">
                <span>改造后</span>
                <img
                  v-if="row.afterImage"
                  :src="row.afterImage"
                  alt="改造后封面"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="房屋信息" min-width="150"
            ><template #default="{ row }">
              <div>{{ row.city }} · {{ row.roomType }}</div>
              <small class="muted">{{ row.area }}㎡ · {{ row.style || '未设置风格' }}</small>
            </template></el-table-column
          >
          <el-table-column label="总花费" width="105"
            ><template #default="{ row }"
              >¥{{ formatPrice(row.totalPrice) }}</template
            ></el-table-column
          >
          <el-table-column label="工期" width="78"
            ><template #default="{ row }">{{ row.durationDays }}天</template></el-table-column
          >
          <el-table-column prop="quoteCount" label="报价人数" width="88" align="center" />
          <el-table-column label="首页推荐" width="100" align="center"
            ><template #default="{ row }"
              ><el-switch
                :model-value="row.isRecommended"
                :disabled="row.status !== 'PUBLISHED'"
                @change="updateRecommended(row, Boolean($event))" /></template
          ></el-table-column>
          <el-table-column label="状态" width="110"
            ><template #default="{ row }"
              ><el-select :model-value="row.status" size="small" @change="updateStatus(row, $event)"
                ><el-option label="草稿" value="DRAFT" /><el-option
                  label="已发布"
                  value="PUBLISHED" /><el-option
                  label="已下架"
                  value="OFFLINE" /></el-select></template
          ></el-table-column>
          <el-table-column label="更新时间" width="110"
            ><template #default="{ row }">{{
              formatDate(row.updatedAt)
            }}</template></el-table-column
          >
          <el-table-column label="操作" width="155" fixed="right"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="showDetail(row)">查看</el-button
              ><el-button link type="primary" @click="openEditCase(row)">编辑</el-button
              ><el-button link type="danger" @click="removeCase(row)">删除</el-button></template
            ></el-table-column
          >
        </el-table>
      </div>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @change="loadCases"
        />
      </div>
    </div>

    <CaseDetailDrawer
      v-model="detailVisible"
      :detail="detail"
      :category-name="detail ? categoryMap.get(detail.categoryId) || '未知分类' : ''"
    />

    <el-drawer v-model="categoryDrawerVisible" title="案例分类管理" size="620px">
      <template #header>
        <div class="drawer-heading">
          <div>
            <strong>案例分类管理</strong>
            <p>维护案例分类名称、排序和启停状态</p>
          </div>
          <el-button type="primary" @click="openCreateCategory">新增分类</el-button>
        </div>
      </template>
      <el-table
        :data="categories"
        row-key="id"
        border
        empty-text="暂无分类"
        max-height="calc(100vh - 220px)"
      >
        <el-table-column prop="name" label="分类名称" min-width="150" /><el-table-column
          prop="sort"
          label="排序"
          width="80"
          align="center"
        /><el-table-column label="状态" width="90"
          ><template #default="{ row }"
            ><el-tag :type="row.isEnabled ? 'success' : 'info'">{{
              row.isEnabled ? '启用' : '停用'
            }}</el-tag></template
          ></el-table-column
        ><el-table-column label="操作" width="190"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="openEditCategory(row)">编辑</el-button
            ><el-button
              link
              :type="row.isEnabled ? 'warning' : 'success'"
              @click="toggleCategoryStatus(row)"
              >{{ row.isEnabled ? '停用' : '启用' }}</el-button
            ><el-button link type="danger" @click="removeCategory(row)">删除</el-button></template
          ></el-table-column
        ></el-table
      >
      <div v-if="!hasEnabledCategory" class="warning-box">
        当前没有启用的分类，后续新增案例时将无法选择分类。
      </div>
    </el-drawer>

    <CaseEditorDialog
      v-model="caseDialogVisible"
      :case-id="editingCaseId"
      :categories="categories"
      @saved="loadCases"
    />

    <el-dialog
      v-model="categoryDialogVisible"
      :title="editingCategory ? '编辑案例分类' : '新增案例分类'"
      width="460px"
      destroy-on-close
      :close-on-click-modal="false"
      @closed="categoryFormRef?.clearValidate()"
      ><el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="88px"
        ><el-form-item label="分类名称" prop="name"
          ><el-input v-model="categoryForm.name" maxlength="20" show-word-limit /></el-form-item
        ><el-form-item label="排序" prop="sort"
          ><el-input-number
            v-model="categoryForm.sort"
            :min="0"
            :max="9999"
            :step="10" /></el-form-item></el-form
      ><template #footer
        ><el-button @click="categoryDialogVisible = false">取消</el-button
        ><el-button type="primary" :loading="categorySubmitting" @click="submitCategory"
          >保存</el-button
        ></template
      ></el-dialog
    >
  </section>
</template>

<style scoped lang="scss">
.case-page {
  width: 100%;
}

.filter-card,
.table-card {
  background: #fff;
  border: 1px solid var(--jfx-border);
  border-radius: 10px;
}

.filter-card {
  padding: 20px 22px 2px;

  .el-form-item {
    margin-right: 22px;
    margin-bottom: 18px;
  }

  .el-input,
  .el-select {
    width: 190px;
  }
}

.table-card {
  padding: 22px;
}

.table-toolbar,
.drawer-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-toolbar {
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

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.case-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  strong,
  small {
    display: block;
  }

  small {
    margin-top: 5px;
    color: var(--jfx-muted);
  }
}

.table-cover {
  position: relative;
  display: grid;
  width: 88px;
  height: 54px;
  overflow: hidden;
  place-items: center;
  color: #fff;
  background: #9299a3;
  border-radius: 6px;
  font-size: 11px;

  &.after {
    background: #be856b;
  }

  img {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.muted {
  color: var(--jfx-muted);
  line-height: 24px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.drawer-heading {
  width: 100%;
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

.warning-box {
  margin-top: 16px;
  padding: 12px 14px;
  color: #b25f00;
  background: #fff7e8;
  border-radius: 6px;
  font-size: 13px;
}
</style>
