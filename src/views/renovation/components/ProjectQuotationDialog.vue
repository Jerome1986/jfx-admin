<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { projectApi } from '@/api/projects'
import { productApi } from '@/api/products'
import { constructionServiceApi } from '@/api/constructionServices'
import type { Product } from '@/types/product'
import type { ConstructionService } from '@/types/constructionService'
import type { ProjectDetail, QuoteItemInput } from '@/types/project'
import { centsText, decimalHundredths, quoteLineCents } from '@/utils/project'
import QuoteImage from './QuoteImage.vue'
const props = defineProps<{ modelValue: boolean; project?: ProjectDetail }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: []; conflict: [] }>()
type Kind = 'product' | 'service'
const rows = ref<QuoteItemInput[]>([])
const saving = ref(false)
const version = ref(0)
const pickerVisible = ref(false)
const pickerKind = ref<Kind>('product')
const categories = ['人工', '主材', '辅材']
const pickerCategory = ref('')
const target = ref<QuoteItemInput>()
const products = ref<Product[]>([])
const services = ref<ConstructionService[]>([])
const pickerLoading = ref(false)
const pickerError = ref(false)
const total = ref(0)
const query = reactive({ keyword: '', pageNum: 1, pageSize: 10 })
let requestId = 0
function closePicker() {
  requestId++
  pickerVisible.value = false
  pickerLoading.value = false
  target.value = undefined
}
watch(
  () => [props.modelValue, props.project?.id],
  () => {
    closePicker()
    if (!props.modelValue) return
    version.value = props.project?.quoteVersion ?? 0
    rows.value = (props.project?.items || []).map((row) => ({
      productId: row.productId ?? null,
      serviceId: row.serviceId ?? null,
      category: row.category,
      name: row.name,
      description: row.description,
      unit: row.unit ?? null,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
      image: row.image,
      sort: row.sort,
    }))
  },
)
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
async function loadOptions() {
  const current = ++requestId
  const kind = pickerKind.value
  pickerLoading.value = true
  pickerError.value = false
  products.value = []
  services.value = []
  total.value = 0
  try {
    if (kind === 'product') {
      const { data } = await productApi.page({ ...query, isPublished: true })
      if (current !== requestId) return
      products.value = data.list.filter((row) => row.isPublished === true)
      total.value = data.total
    } else {
      const { data } = await constructionServiceApi.list({
        pageNum: query.pageNum,
        pageSize: query.pageSize,
      })
      if (current !== requestId) return
      services.value = data.list.filter((row) => row.isEnabled)
      total.value = data.total
    }
  } catch {
    if (current === requestId) pickerError.value = true
  } finally {
    if (current === requestId) pickerLoading.value = false
  }
}
function search() {
  query.pageNum = 1
  void loadOptions()
}
function pick(kind: Kind, row?: QuoteItemInput) {
  if (saving.value || !props.modelValue) return
  pickerCategory.value = row?.category ?? ''
  pickerKind.value = kind
  target.value = row
  pickerVisible.value = true
  query.keyword = ''
  search()
}
function openPicker(row?: QuoteItemInput) {
  pick(row?.serviceId != null ? 'service' : 'product', row)
}
function changeKind() {
  query.keyword = ''
  search()
}
function applyChoice(snapshot: QuoteItemInput) {
  const row = target.value
  try {
    if (!categories.includes(pickerCategory.value)) throw new Error('请先选择费用分类')
    if (row && !rows.value.includes(row)) throw new Error('明细已变化，请重新选择')
    decimalHundredths(snapshot.unitPrice)
    const quantity = row?.quantity ?? '1'
    if (decimalHundredths(quantity) <= 0n) throw new Error('请先填写有效数量')
    if (row) {
      // 替换只更新当前行，避免改变其他已有明细的历史快照。
      Object.assign(row, snapshot, { quantity, sort: row.sort })
    } else {
      const existing = rows.value.find(
        (item) =>
          item.category === snapshot.category &&
          (snapshot.productId != null
            ? item.productId === snapshot.productId
            : item.serviceId === snapshot.serviceId),
      )
      if (existing) {
        const merged = decimalHundredths(existing.quantity) + 100n
        if (merged > 9999999999n) throw new Error('合并后数量超出允许范围')
        existing.quantity = centsText(merged)
      } else rows.value.push({ ...snapshot, quantity, sort: rows.value.length })
    }
    closePicker()
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '所选明细无效')
  }
}
function chooseProduct(product: Product) {
  if (
    saving.value ||
    pickerLoading.value ||
    pickerError.value ||
    !pickerVisible.value ||
    pickerKind.value !== 'product' ||
    !product.isPublished
  )
    return
  applyChoice({
    productId: product.id,
    serviceId: null,
    category: pickerCategory.value,
    name: product.name,
    description: product.description ?? null,
    unit: null,
    unitPrice: String(product.price),
    quantity: '1',
    image: product.mainImage || null,
    sort: 0,
  })
}
function chooseService(service: ConstructionService) {
  if (
    saving.value ||
    pickerLoading.value ||
    pickerError.value ||
    !pickerVisible.value ||
    pickerKind.value !== 'service' ||
    !service.isEnabled
  )
    return
  if (!service.unit?.trim()) {
    ElMessage.warning('该服务缺少计价单位，请先在服务管理中补齐')
    return
  }
  applyChoice({
    productId: null,
    serviceId: service.id,
    category: pickerCategory.value,
    name: service.name,
    description: service.description,
    unit: service.unit,
    unitPrice: String(service.unitPrice),
    quantity: '1',
    image: service.image,
    sort: 0,
  })
}
async function submit() {
  if (saving.value || !props.project || pickerVisible.value) return
  if (props.project.status !== 'PENDING_CONFIRM') {
    ElMessage.warning('仅待确认项目可编辑报价')
    return
  }
  let payload: QuoteItemInput[]
  try {
    if (!rows.value.length) throw new Error('请至少选择一条商品或服务明细')
    let totalCents = 0n
    payload = rows.value.map((row, index) => {
      if (row.productId != null && row.serviceId != null)
        throw new Error(`第 ${index + 1} 行：商品和服务不能同时关联，请重新选择`)
      if (!['主材', '人工', '辅材'].includes(row.category) || !row.name.trim())
        throw new Error(`第 ${index + 1} 行：分类或名称无效，请重新选择`)
      if (row.serviceId != null && !row.unit?.trim())
        throw new Error(`第 ${index + 1} 行：服务缺少单位，请重新选择`)
      if (decimalHundredths(row.quantity) <= 0n)
        throw new Error(`第 ${index + 1} 行：数量必须大于零`)
      totalCents += quoteLineCents(row.unitPrice, row.quantity)
      return {
        productId: row.productId ?? null,
        serviceId: row.serviceId ?? null,
        category: row.category,
        name: row.name,
        description: row.description,
        unit: row.unit ?? null,
        unitPrice: row.unitPrice,
        quantity: row.quantity,
        image: row.image,
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
      <div class="toolbar">
        <div>
          <el-button type="primary" plain @click="openPicker()">添加明细</el-button>
        </div>
        <span class="hint">选择后调整数量，单价沿用选入时的价格</span>
      </div>
      <el-table :data="rows" border empty-text="请添加商品或服务">
        <el-table-column label="图片" width="80"
          ><template #default="{ row }"><QuoteImage :src="row.image" /></template
        ></el-table-column>
        <el-table-column label="名称 / 类型" min-width="190"
          ><template #default="{ row }"
            ><div>{{ row.name }}</div>
            <el-tag
              size="small"
              :type="row.productId == null && row.serviceId == null ? 'info' : 'primary'"
              >{{
                row.productId != null ? '商品' : row.serviceId != null ? '服务' : '历史明细'
              }}</el-tag
            ></template
          ></el-table-column
        >
        <el-table-column label="分类" width="90"
          ><template #default="{ row }"
            ><el-tag type="info" size="small">{{ row.category }}</el-tag></template
          ></el-table-column
        >
        <el-table-column prop="description" label="说明" min-width="160" show-overflow-tooltip />
        <el-table-column label="单价（元）" width="130"
          ><template #default="{ row }"
            >{{ row.unitPrice
            }}<span v-if="row.productId == null && row.unit"> / {{ row.unit }}</span></template
          ></el-table-column
        >
        <el-table-column label="数量" width="120"
          ><template #default="{ row }"
            ><el-input v-model="row.quantity" inputmode="decimal" /></template
        ></el-table-column>
        <el-table-column label="金额（元）" width="120"
          ><template #default="{ row }">{{ amount(row) }}</template></el-table-column
        >
        <el-table-column label="操作" width="115" fixed="right"
          ><template #default="{ row, $index }"
            ><el-button link type="primary" @click="openPicker(row)">替换</el-button
            ><el-button link type="danger" @click="rows.splice($index, 1)"
              >删除</el-button
            ></template
          ></el-table-column
        >
      </el-table>
      <div class="summary">
        <span class="hint">历史明细保留原报价，也可重新选择商品或服务</span
        ><strong>报价合计：¥{{ sum }}</strong>
      </div>
    </el-form>
    <template #footer
      ><el-button :disabled="saving" @click="emit('update:modelValue', false)">取消</el-button
      ><el-button type="primary" :loading="saving" :disabled="pickerVisible" @click="submit"
        >保存报价</el-button
      ></template
    >
  </el-dialog>
  <el-dialog
    :model-value="pickerVisible"
    :title="target ? '替换明细' : '添加明细'"
    width="min(94vw, 800px)"
    append-to-body
    @update:model-value="closePicker"
  >
    <el-form label-width="80px"
      ><el-form-item label="费用分类" required
        ><el-radio-group v-model="pickerCategory"
          ><el-radio-button v-for="category in categories" :key="category" :value="category">{{
            category
          }}</el-radio-button></el-radio-group
        ></el-form-item
      ></el-form
    >
    <el-tabs v-model="pickerKind" @tab-change="changeKind"
      ><el-tab-pane label="商品" name="product" /><el-tab-pane label="服务" name="service"
    /></el-tabs>
    <el-form v-if="pickerKind === 'product'" inline @submit.prevent="search"
      ><el-form-item
        ><el-input v-model="query.keyword" clearable placeholder="搜索商品" /></el-form-item
      ><el-form-item
        ><el-button native-type="submit" type="primary">查询</el-button></el-form-item
      ></el-form
    >
    <el-alert v-if="pickerError" title="加载失败，请重试" type="error" :closable="false"
      ><el-button link @click="loadOptions">重新加载</el-button></el-alert
    >
    <el-table
      v-if="pickerKind === 'product'"
      v-loading="pickerLoading"
      :data="products"
      empty-text="本页暂无可选商品"
    >
      <el-table-column label="图片" width="80"
        ><template #default="{ row }"
          ><QuoteImage :src="row.mainImage" /></template></el-table-column
      ><el-table-column prop="name" label="商品名称" /><el-table-column
        prop="price"
        label="单价（元）"
        width="120"
      /><el-table-column width="80"
        ><template #default="{ row }"
          ><el-button
            link
            type="primary"
            :disabled="pickerLoading || pickerError || !categories.includes(pickerCategory)"
            @click="chooseProduct(row)"
            >选择</el-button
          ></template
        ></el-table-column
      >
    </el-table>
    <template v-else
      ><p class="hint">仅展示本页已启用的服务，可翻页查看其他服务</p>
      <el-table
        v-loading="pickerLoading"
        :data="services"
        empty-text="本页暂无已启用服务，请尝试翻页"
      >
        <el-table-column label="图片" width="80"
          ><template #default="{ row }"><QuoteImage :src="row.image" /></template></el-table-column
        ><el-table-column prop="name" label="服务名称" /><el-table-column
          prop="unit"
          label="计价单位"
          width="95"
        /><el-table-column prop="unitPrice" label="单价（元）" width="120" /><el-table-column
          width="80"
          ><template #default="{ row }"
            ><el-button
              link
              type="primary"
              :disabled="pickerLoading || pickerError || !categories.includes(pickerCategory)"
              @click="chooseService(row)"
              >选择</el-button
            ></template
          ></el-table-column
        >
      </el-table></template
    >
    <el-pagination
      v-model:current-page="query.pageNum"
      :page-size="query.pageSize"
      :total="total"
      layout="prev, pager, next"
      @current-change="loadOptions"
    />
  </el-dialog>
</template>
<style scoped>
.toolbar,
.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0 0 18px;
}
.summary {
  margin: 18px 0 0;
}
.hint {
  color: #909399;
  font-size: 12px;
}
.el-pagination {
  margin-top: 16px;
}
.el-tag {
  margin-top: 6px;
}
</style>
