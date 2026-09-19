<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { productApi } from '@/api/products'
import { productCategoryApi } from '@/api/productCategories'
import {
  findCategoryName,
  lastCategoryId,
  toCategoryCascaderOptions,
} from '@/utils/productCategories'
import ProductEditorDialog from './ProductEditorDialog.vue'
import type { Product } from '@/types/product'
import type { ProductCategory } from '@/types/productCategory'

// 标记数据是否正在加载。
const loading = ref(false)
// 控制编辑弹窗的显示状态。
const dialogVisible = ref(false)
// 保存列表展示数据。
const rows = ref<Product[]>([])
const total = ref(0)
// 分页器仅展示最近一次成功请求的页码和条数。
const pagination = reactive({ pageNum: 1, pageSize: 10 })
// 保存商品分类列表。
const categories = ref<ProductCategory[]>([])
// 保存当前编辑记录的 ID。
const editingId = ref<number>()
// 保存列表筛选条件。
const query = reactive({
  keyword: '',
  categoryPath: [] as number[],
  status: '' as '' | boolean,
})
// 保存已应用到列表的筛选条件。
const appliedQuery = reactive({ ...query })

// 保留任意层级分类结构，级联选择器仅允许选择末级分类。
const categoryOptions = computed(() => toCategoryCascaderOptions(categories.value))

let loadVersion = 0

// 将异常转换为可展示的错误消息。
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'

// 按已提交的筛选条件查询分页商品。
const loadData = async (pageNum = pagination.pageNum, pageSize = pagination.pageSize) => {
  const version = ++loadVersion
  loading.value = true
  try {
    const params = {
      keyword: appliedQuery.keyword.trim() || undefined,
      categoryId: lastCategoryId(appliedQuery.categoryPath) || undefined,
      isPublished: typeof appliedQuery.status === 'boolean' ? appliedQuery.status : undefined,
      pageNum,
      pageSize,
    }
    // 删除、编辑或其他管理员操作可能使当前页超出范围。
    while (version === loadVersion) {
      const { data } = await productApi.page(params)
      if (version !== loadVersion) return
      const lastPage = Math.max(1, data.totalPage)
      if (params.pageNum > lastPage) {
        params.pageNum = lastPage
        continue
      }
      rows.value = data.list
      total.value = data.total
      pagination.pageNum = data.pageNum
      pagination.pageSize = data.pageSize
      break
    }
  } catch (error) {
    if (version === loadVersion) ElMessage.error(messageOf(error))
  } finally {
    if (version === loadVersion) loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const { data } = await productCategoryApi.list()
    categories.value = data
  } catch (error) {
    ElMessage.error(messageOf(error))
  }
}

const changePageSize = (pageSize: number) => loadData(1, pageSize)

// 打开空白商品表单。
const openCreate = () => {
  editingId.value = undefined
  dialogVisible.value = true
}

// 传入商品编号并打开编辑表单。
const openEdit = (row: Product) => {
  editingId.value = row.id
  dialogVisible.value = true
}

// 删除前进行二次确认。
const remove = async (row: Product) => {
  try {
    await ElMessageBox.confirm(`删除“${row.name}”后无法恢复，确定继续吗？`, '删除商品', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await productApi.remove(row.id)
    ElMessage.success('商品已删除')
    await loadData()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
  }
}

// 应用当前筛选条件查询列表。
const search = () => {
  Object.assign(appliedQuery, query, { categoryPath: [...query.categoryPath] })
  return loadData(1)
}
// 清空筛选条件并更新列表。
const resetQuery = () => {
  Object.assign(query, { keyword: '', categoryPath: [], status: '' })
  search()
}
// 获取商品所属分类的显示名称。
const categoryName = (row: Product) =>
  row.category?.name ?? findCategoryName(categories.value, row.categoryId) ?? '-'

// 页面挂载后加载初始数据。
onMounted(() => Promise.all([loadData(), loadCategories()]))
</script>

<template>
  <section class="goods-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" @submit.prevent="search">
        <el-form-item label="商品"
          ><el-input v-model="query.keyword" clearable placeholder="请输入名称、品牌、型号或描述"
        /></el-form-item>
        <el-form-item label="商品分类">
          <el-cascader
            v-model="query.categoryPath"
            :options="categoryOptions"
            clearable
            filterable
            placeholder="请选择末级分类"
          />
        </el-form-item>
        <el-form-item label="上架状态"
          ><el-select v-model="query.status" clearable placeholder="全部状态"
            ><el-option label="已上架" :value="true" /><el-option
              label="未上架"
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
          <h2>商品管理</h2>
          <p>维护商品信息、库存、价格和上架状态</p>
        </div>
        <el-button type="primary" @click="openCreate">新增商品</el-button>
      </div>
      <div class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          height="100%"
          border
          empty-text="暂无商品"
        >
          <el-table-column label="商品" min-width="250" fixed="left"
            ><template #default="{ row }"
              ><div class="product-cell">
                <el-image
                  :src="row.mainImage"
                  fit="contain"
                  :preview-src-list="[row.mainImage]"
                  preview-teleported
                />
                <div>
                  <strong>{{ row.name }}</strong
                  ><small>{{ row.brand || '-' }} · {{ row.model || '-' }}</small>
                </div>
              </div></template
            ></el-table-column
          >
          <el-table-column label="分类" min-width="130"
            ><template #default="{ row }">{{ categoryName(row) }}</template></el-table-column
          >
          <el-table-column label="价格" width="120" align="right"
            ><template #default="{ row }"
              >¥{{ Number(row.price).toFixed(2) }}</template
            ></el-table-column
          >
          <el-table-column prop="stock" label="库存" width="90" align="center" />
          <el-table-column label="安装" width="90" align="center"
            ><template #default="{ row }">{{
              row.installationIncluded ? '包含' : '不包含'
            }}</template></el-table-column
          >
          <el-table-column prop="sort" label="排序" width="75" align="center" />
          <el-table-column label="状态" width="90" align="center"
            ><template #default="{ row }"
              ><el-tag :type="row.isPublished ? 'success' : 'info'">{{
                row.isPublished ? '已上架' : '未上架'
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="操作" width="120" fixed="right"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="openEdit(row)">编辑</el-button
              ><el-button link type="danger" @click="remove(row)">删除</el-button></template
            ></el-table-column
          >
        </el-table>
      </div>
      <div class="pagination-wrap">
        <el-pagination
          :current-page="pagination.pageNum"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :disabled="loading"
          @update:current-page="loadData($event)"
          @update:page-size="changePageSize"
        />
      </div>
    </div>

    <ProductEditorDialog
      v-model="dialogVisible"
      :product-id="editingId"
      :categories="categories"
      @saved="loadData()"
    />
  </section>
</template>

<style scoped lang="scss">
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
  overflow-x: auto;
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
  .el-input,
  .el-select,
  .el-cascader {
    width: 210px;
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
.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  .el-image {
    width: 58px;
    height: 58px;
    flex: none;
    padding: 4px;
    background: #f7f8fa;
    border: 1px solid var(--jfx-border);
    border-radius: 6px;
    box-sizing: border-box;
  }
  strong,
  small {
    display: block;
  }
  strong {
    margin-bottom: 7px;
  }
  small {
    color: var(--jfx-muted);
  }
}
</style>
