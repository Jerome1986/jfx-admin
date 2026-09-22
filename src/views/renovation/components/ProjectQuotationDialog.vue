<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { projectApi } from '@/api/projects'
import { productApi } from '@/api/products'
import type { Product } from '@/types/product'
import type { ProjectDetail, QuoteItemInput } from '@/types/project'
import { centsText, decimalHundredths, quoteLineCents } from '@/utils/project'
const props = defineProps<{ modelValue: boolean; project?: ProjectDetail }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: []; conflict: [] }>()
const rows = ref<QuoteItemInput[]>([])
const saving = ref(false)
const version = ref(0)
const pickerVisible = ref(false)
const target = ref<QuoteItemInput>()
const products = ref<Product[]>([])
const productLoading = ref(false)
const productError = ref(false)
const total = ref(0)
const query = reactive({ keyword: '', pageNum: 1, pageSize: 10 })
let requestId = 0
watch(
  () => props.modelValue,
  (visible) => {
    requestId++
    pickerVisible.value = false
    if (!visible) return
    version.value = props.project?.quoteVersion ?? 0
    rows.value = (props.project?.items || []).map(
      ({ productId, category, name, description, unit, unitPrice, quantity, image, sort }) => ({
        productId,
        category,
        name,
        description,
        unit,
        unitPrice,
        quantity,
        image,
        sort,
      }),
    )
  },
)
function add() {
  rows.value.push({
    productId: null,
    category: '主材',
    name: '',
    description: '',
    unit: '项',
    unitPrice: '',
    quantity: '1',
    image: null,
    sort: rows.value.length,
  })
}
function amount(row: QuoteItemInput) {
  try {
    return centsText(quoteLineCents(row.unitPrice, row.quantity))
  } catch {
    return '—'
  }
}
const sum = computed(() => {
  try {
    return centsText(
      rows.value.reduce((sum, row) => sum + quoteLineCents(row.unitPrice, row.quantity), 0n),
    )
  } catch {
    return '—'
  }
})
async function loadProducts() {
  const current = ++requestId
  productLoading.value = true
  productError.value = false
  try {
    const { data } = await productApi.page({ ...query, isPublished: true })
    if (current !== requestId) return
    products.value = data.list
    total.value = data.total
  } catch {
    if (current === requestId) {
      productError.value = true
      products.value = []
      total.value = 0
    }
  } finally {
    if (current === requestId) productLoading.value = false
  }
}
function searchProducts() {
  query.pageNum = 1
  void loadProducts()
}
function pick(row: QuoteItemInput) {
  target.value = row
  pickerVisible.value = true
  query.keyword = ''
  searchProducts()
}
function choose(product: Product) {
  if (!target.value) return
  Object.assign(target.value, {
    productId: product.id,
    name: product.name,
    description: product.description || '',
    unitPrice: String(product.price),
    image: product.mainImage || null,
  })
  pickerVisible.value = false
}
async function submit() {
  if (saving.value || !props.project) return
  if (props.project.status !== 'PENDING_CONFIRM') {
    ElMessage.warning('仅待确认项目可编辑报价')
    return
  }
  let payload: QuoteItemInput[]
  try {
    if (!rows.value.length) throw new Error('请至少添加一条报价明细')
    let totalCents = 0n
    payload = rows.value.map((row, index) => {
      if (!['主材', '人工', '辅材'].includes(row.category) || !row.name.trim() || !row.unit.trim())
        throw new Error(`第 ${index + 1} 行：请填写分类、名称和单位`)
      if (decimalHundredths(row.quantity) <= 0n)
        throw new Error(`第 ${index + 1} 行：数量必须大于零`)
      totalCents += quoteLineCents(row.unitPrice, row.quantity)
      return {
        ...row,
        name: row.name.trim(),
        unit: row.unit.trim(),
        description: row.description?.trim() || null,
        image: row.image?.trim() || null,
        sort: index,
      }
    })
    if (totalCents > 9999999999n) throw new Error('报价总金额不得超过 99999999.99 元')
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '请检查报价明细')
    return
  }
  saving.value = true
  try {
    await projectApi.quotation(props.project.id, version.value, payload)
    ElMessage.success('报价已保存')
    emit('update:modelValue', false)
    emit('saved')
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      emit('update:modelValue', false)
      emit('conflict')
      ElMessage.warning('项目或报价已变化，正在刷新详情，请重新编辑')
    }
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <el-dialog
    :model-value="modelValue"
    title="编辑项目报价"
    width="min(96vw, 1200px)"
    append-to-body
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form :disabled="saving">
      <el-table :data="rows" border>
        <el-table-column label="分类" width="100"
          ><template #default="{ row }"
            ><el-select v-model="row.category"
              ><el-option
                v-for="value in ['主材', '人工', '辅材']"
                :key="value"
                :label="value"
                :value="value" /></el-select></template
        ></el-table-column>
        <el-table-column label="名称 / 商品" min-width="190"
          ><template #default="{ row }"
            ><el-input v-model="row.name" maxlength="191" placeholder="项目名称" /><el-button
              link
              type="primary"
              @click="pick(row)"
              >{{ row.productId ? '替换商品' : '选择商品' }}</el-button
            ><el-button v-if="row.productId" link @click="row.productId = null">解除关联</el-button
            ><small v-if="row.productId">商品 ID：{{ row.productId }}</small></template
          ></el-table-column
        >
        <el-table-column label="说明" min-width="160"
          ><template #default="{ row }"
            ><el-input v-model="row.description" type="textarea" :rows="2" /><el-input
              v-model="row.image"
              placeholder="图片地址（可选）" /></template
        ></el-table-column>
        <el-table-column label="单位" width="90"
          ><template #default="{ row }"><el-input v-model="row.unit" /></template
        ></el-table-column>
        <el-table-column label="单价（元）" width="135"
          ><template #default="{ row }"
            ><el-input v-model="row.unitPrice" inputmode="decimal" /></template
        ></el-table-column>
        <el-table-column label="数量" width="120"
          ><template #default="{ row }"
            ><el-input v-model="row.quantity" inputmode="decimal" /></template
        ></el-table-column>
        <el-table-column label="金额（元）" width="120"
          ><template #default="{ row }">{{ amount(row) }}</template></el-table-column
        >
        <el-table-column label="操作" width="85"
          ><template #default="{ $index }"
            ><el-button link type="danger" @click="rows.splice($index, 1)"
              >删除</el-button
            ></template
          ></el-table-column
        >
      </el-table>
      <div class="summary">
        <el-button @click="add">添加明细</el-button><strong>报价合计：¥{{ sum }}</strong>
      </div>
    </el-form>
    <template #footer
      ><el-button :disabled="saving" @click="emit('update:modelValue', false)">取消</el-button
      ><el-button type="primary" :loading="saving" @click="submit">保存报价</el-button></template
    >
  </el-dialog>
  <el-dialog v-model="pickerVisible" title="选择商品" width="min(94vw, 760px)" append-to-body>
    <el-form inline @submit.prevent="searchProducts"
      ><el-form-item
        ><el-input v-model="query.keyword" clearable placeholder="搜索商品" /></el-form-item
      ><el-form-item
        ><el-button native-type="submit" type="primary">查询</el-button></el-form-item
      ></el-form
    >
    <el-alert v-if="productError" title="商品加载失败" type="error" :closable="false"
      ><el-button link @click="loadProducts">重新加载</el-button></el-alert
    >
    <el-table v-loading="productLoading" :data="products"
      ><el-table-column label="图片" width="75"
        ><template #default="{ row }"
          ><el-image
            :src="row.mainImage"
            style="width: 45px; height: 45px"
            fit="cover" /></template></el-table-column
      ><el-table-column prop="name" label="名称" /><el-table-column
        prop="price"
        label="价格（元）"
        width="120"
      /><el-table-column width="80"
        ><template #default="{ row }"
          ><el-button link type="primary" :disabled="productLoading" @click="choose(row)"
            >选择</el-button
          ></template
        ></el-table-column
      ></el-table
    >
    <el-pagination
      v-model:current-page="query.pageNum"
      :page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadProducts"
    />
  </el-dialog>
</template>
<style scoped>
.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18px;
}
small {
  display: block;
  color: #909399;
}
.el-pagination {
  margin-top: 16px;
}
</style>
