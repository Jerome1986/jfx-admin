<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { productApi } from '@/api/products'
import { constructionServiceApi } from '@/api/constructionServices'
import { renewalPlanApi } from '@/api/renewalPlans'
import type { ConstructionService } from '@/types/constructionService'
import type { Product } from '@/types/product'
import type { RenewalPlan, RenewalPlanInput, RenewalPlanItemInput } from '@/types/renewalPlan'
import { calculateRenewalPlanPrice } from '@/utils/renewalPlan'

const props = defineProps<{ modelValue: boolean; planId?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()

type PlanItemInput = RenewalPlanItemInput & { constructionServiceId?: number }
type PlanForm = Omit<RenewalPlanInput, 'tags' | 'startingPrice' | 'items'> & {
  tagsText: string
  items: PlanItemInput[]
}
const uploadUrl = 'https://a9lhd8buo8.sealoshzh.site/upload/images'
const formRef = ref<FormInstance>()
const submitting = ref(false)
const detailLoading = ref(false)
const productLoading = ref(false)
const productDialogVisible = ref(false)
const serviceDialogVisible = ref(false)
const activeItemIndex = ref<number>()
const products = ref<Product[]>([])
const services = ref<ConstructionService[]>([])
const selectedProducts = ref<Product[]>([])
const selectedServices = ref<ConstructionService[]>([])
const productTableRef = ref<{
  clearSelection: () => void
  toggleRowSelection: (row: Product, selected: boolean) => void
}>()
const serviceTableRef = ref<{
  clearSelection: () => void
  toggleRowSelection: (row: ConstructionService, selected: boolean) => void
}>()

const newItem = (): PlanItemInput => ({
  category: '',
  name: '',
  description: '',
  unit: '',
  unitPrice: 0,
  quantity: 1,
  sort: 0,
})

const initialForm = (): PlanForm => ({
  name: '',
  summary: '',
  tagsText: '',
  cover: '',
  detail: '',
  shareTitle: '',
  shareImage: '',
  sort: 0,
  isRecommended: false,
  recommendSort: 0,
  status: 'DRAFT',
  items: [newItem()],
})

const form = reactive<PlanForm>(initialForm())
const startingPrice = computed(() => calculateRenewalPlanPrice(form.items))
const rules: FormRules = {
  name: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
  summary: [{ required: true, message: '请输入方案简介', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传封面图', trigger: 'change' }],
  detail: [{ required: true, message: '请输入方案详情', trigger: 'blur' }],
}

const uploadedUrl = (response: unknown) => (typeof response === 'string' ? response : '')
const uploadSuccess =
  (field: 'cover' | 'shareImage'): UploadProps['onSuccess'] =>
  (response) => {
    const url = uploadedUrl(response)
    if (!url) return ElMessage.error('上传接口未返回图片地址')
    form[field] = url
    formRef.value?.validateField(field).catch(() => undefined)
  }
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (file.type.startsWith('image/')) return true
  ElMessage.warning('只能上传图片文件')
  return false
}
const uploadError: UploadProps['onError'] = () => ElMessage.error('图片上传失败')

const reset = () => {
  Object.assign(form, initialForm())
  activeItemIndex.value = undefined
  selectedProducts.value = []
  selectedServices.value = []
  formRef.value?.clearValidate()
}

const fillForm = (plan: RenewalPlan) => {
  Object.assign(form, {
    name: plan.name,
    summary: plan.summary ?? '',
    tagsText: plan.tags?.join('，') ?? '',
    cover: plan.cover ?? '',
    detail: plan.detail ?? '',
    shareTitle: plan.shareTitle ?? '',
    shareImage: plan.shareImage ?? '',
    sort: Number(plan.sort),
    isRecommended: plan.isRecommended,
    recommendSort: Number(plan.recommendSort),
    status: plan.status,
    items: plan.items.map((item) => ({
      ...(item.productId ? { productId: Number(item.productId) } : {}),
      category: item.category,
      name: item.name,
      description: item.description ?? '',
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
      ...(item.image ? { image: item.image } : {}),
      sort: Number(item.sort),
    })),
  })
}

const linkedProduct = (item: RenewalPlanItemInput) =>
  products.value.find((product) => product.id === item.productId)

// 获取方案项目当前关联的商品服务。
const linkedService = (item: PlanItemInput) =>
  services.value.find((service) => service.id === item.constructionServiceId)

const loadProducts = async () => {
  productLoading.value = true
  try {
    const { data } = await productApi.list()
    products.value = data.filter((product) => product.isPublished)
  } finally {
    productLoading.value = false
  }
}

// 加载全部启用的商品服务供方案项目选择。
const loadServices = async () => {
  productLoading.value = true
  try {
    const { data } = await constructionServiceApi.list({ pageNum: 1, pageSize: 100 })
    services.value = data.list.filter((service) => service.isEnabled)
  } finally {
    productLoading.value = false
  }
}

const openProductDialog = async (index: number) => {
  const item = form.items[index]
  if (!item?.category.trim()) return ElMessage.warning('请先填写项目分类')
  activeItemIndex.value = index
  selectedProducts.value = []
  productDialogVisible.value = true
  await loadProducts()
  void nextTick(() => {
    productTableRef.value?.clearSelection()
    const current = products.value.find((product) => product.id === item.productId)
    if (current) productTableRef.value?.toggleRowSelection(current, true)
  })
}

// 打开商品服务选择弹窗并记录当前方案项目。
const openServiceDialog = async (index: number) => {
  const item = form.items[index]
  if (!item?.category.trim()) return ElMessage.warning('请先填写项目分类')
  activeItemIndex.value = index
  selectedServices.value = []
  serviceDialogVisible.value = true
  await loadServices()
  void nextTick(() => {
    serviceTableRef.value?.clearSelection()
    const current = services.value.find((service) => service.id === item.constructionServiceId)
    if (current) serviceTableRef.value?.toggleRowSelection(current, true)
  })
}

const confirmProducts = () => {
  if (activeItemIndex.value === undefined || !selectedProducts.value.length)
    return ElMessage.warning('请至少选择一个商品或服务')
  const planItem = form.items[activeItemIndex.value]
  if (!planItem) return
  const category = planItem.category.trim()
  const makeItem = (product: Product, offset: number): RenewalPlanItemInput => ({
    productId: product.id,
    category,
    name: product.name,
    description: product.description || '',
    unit: '件',
    unitPrice: Number(product.price),
    quantity: 1,
    image: product.mainImage,
    sort: planItem.sort + offset,
  })
  const [first, ...rest] = selectedProducts.value
  if (!first) return
  delete planItem.constructionServiceId
  Object.assign(planItem, makeItem(first, 0))
  form.items.splice(
    activeItemIndex.value + 1,
    0,
    ...rest.map((product, index) => makeItem(product, index + 1)),
  )
  productDialogVisible.value = false
  selectedProducts.value = []
}

// 将选中的多个商品服务分别复制为同分类方案项目。
const confirmService = () => {
  if (activeItemIndex.value === undefined || !selectedServices.value.length)
    return ElMessage.warning('请至少选择一个商品服务')
  const planItem = form.items[activeItemIndex.value]
  if (!planItem) return
  const category = planItem.category.trim()
  const makeItem = (service: ConstructionService, offset: number): PlanItemInput => ({
    constructionServiceId: service.id,
    category,
    name: service.name,
    description: service.description ?? '',
    unit: service.unit,
    unitPrice: Number(service.unitPrice),
    quantity: 1,
    image: service.image || undefined,
    sort: planItem.sort + offset,
  })
  const [first, ...rest] = selectedServices.value
  if (!first) return
  Object.assign(planItem, makeItem(first, 0))
  form.items.splice(
    activeItemIndex.value + 1,
    0,
    ...rest.map((service, index) => makeItem(service, index + 1)),
  )
  serviceDialogVisible.value = false
  selectedServices.value = []
}

// 判断商品服务是否已被其他方案项目选择。
const serviceSelectable = (service: ConstructionService) =>
  !form.items.some(
    (item, index) => index !== activeItemIndex.value && item.constructionServiceId === service.id,
  )

const productSelectable = (product: Product) =>
  !form.items.some(
    (item, index) => index !== activeItemIndex.value && item.productId === product.id,
  )

const unlinkProduct = (item: RenewalPlanItemInput) => {
  delete item.productId
}

// 取消方案项目与商品服务的临时关联。
const unlinkService = (item: PlanItemInput) => {
  delete item.constructionServiceId
  delete item.image
}

const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  if (!form.items.every((item) => item.category && item.name && item.unit)) {
    return ElMessage.warning('请完整填写项目的分类、名称和单位')
  }
  const payload: RenewalPlanInput = {
    name: form.name.trim(),
    summary: form.summary.trim(),
    tags: form.tagsText
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean),
    startingPrice: startingPrice.value,
    cover: form.cover,
    detail: form.detail.trim(),
    shareTitle: form.shareTitle.trim(),
    shareImage: form.shareImage,
    sort: Number(form.sort),
    isRecommended: form.isRecommended,
    recommendSort: Number(form.recommendSort),
    status: form.status,
    items: form.items.map((item) => ({
      ...(item.productId ? { productId: Number(item.productId) } : {}),
      category: item.category.trim(),
      name: item.name.trim(),
      description: item.description.trim(),
      unit: item.unit.trim(),
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
      ...(item.image ? { image: item.image } : {}),
      sort: Number(item.sort),
    })),
  }
  submitting.value = true
  try {
    if (props.planId) await renewalPlanApi.update(props.planId, payload)
    else await renewalPlanApi.create(payload)
    ElMessage.success(props.planId ? '焕新方案编辑成功' : '焕新方案新增成功')
    emit('update:modelValue', false)
    emit('saved')
    reset()
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) return
    reset()
    if (!props.planId) return
    detailLoading.value = true
    try {
      const { data } = await renewalPlanApi.detail(props.planId)
      fillForm(data)
    } finally {
      detailLoading.value = false
    }
  },
)
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="planId ? '编辑焕新方案' : '新增焕新方案'"
    width="900px"
    top="4vh"
    destroy-on-close
    :close-on-click-modal="false"
    class="plan-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="form"
      :rules="rules"
      label-width="90px"
    >
      <div class="section-title">基本信息</div>
      <div class="form-grid">
        <el-form-item label="方案名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="起步价">
          <div class="price-summary">
            <span class="price-value">¥{{ startingPrice.toFixed(2) }}</span>
            <small>根据全部项目的单价 × 数量自动汇总</small>
          </div>
        </el-form-item>
        <el-form-item label="方案简介" prop="summary" class="span-2"
          ><el-input v-model="form.summary"
        /></el-form-item>
        <el-form-item label="标签" class="span-2"
          ><el-input v-model="form.tagsText" placeholder="多个标签用逗号分隔"
        /></el-form-item>
      </div>

      <div class="section-title">图片信息</div>
      <div class="form-grid media-grid">
        <el-form-item label="封面图" prop="cover"
          ><el-upload
            :action="uploadUrl"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-success="uploadSuccess('cover')"
            :on-error="uploadError"
            ><div class="image-box cover-image-box" :class="{ 'has-image': form.cover }">
              <img v-if="form.cover" :src="form.cover" /><el-icon v-else
                ><Plus
              /></el-icon></div></el-upload
        ></el-form-item>
        <el-form-item label="分享图"
          ><el-upload
            :action="uploadUrl"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-success="uploadSuccess('shareImage')"
            :on-error="uploadError"
            ><div class="image-box">
              <img v-if="form.shareImage" :src="form.shareImage" /><el-icon v-else
                ><Plus
              /></el-icon></div></el-upload
        ></el-form-item>
      </div>

      <div class="section-title">发布设置</div>
      <div class="form-grid">
        <el-form-item label="分享标题"><el-input v-model="form.shareTitle" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="发布状态"
          ><el-select v-model="form.status"
            ><el-option label="草稿" value="DRAFT" /><el-option
              label="已发布"
              value="PUBLISHED" /><el-option label="已下架" value="OFFLINE" /></el-select
        ></el-form-item>
        <el-form-item label="首页推荐"><el-switch v-model="form.isRecommended" /></el-form-item>
        <el-form-item label="推荐排序"
          ><el-input-number v-model="form.recommendSort" :min="0" :disabled="!form.isRecommended"
        /></el-form-item>
      </div>

      <div class="section-title">方案介绍</div>
      <el-form-item label="方案详情" prop="detail"
        ><el-input v-model="form.detail" type="textarea" :rows="4"
      /></el-form-item>

      <div class="section-title item-title">
        <span>方案项目</span>
        <el-button type="primary" plain @click="form.items.push(newItem())">添加项目</el-button>
      </div>
      <div v-for="(item, index) in form.items" :key="index" class="plan-item">
        <div class="plan-item-head">
          <div>
            <strong>项目 {{ index + 1 }}</strong>
            <el-tag v-if="item.productId" size="small" type="success">已关联商品</el-tag>
            <el-tag v-else-if="item.constructionServiceId" size="small" type="warning"
              >已选择服务</el-tag
            >
            <el-tag v-else size="small" type="info">未关联</el-tag>
          </div>
          <el-button
            link
            type="danger"
            :disabled="form.items.length === 1"
            @click="form.items.splice(index, 1)"
            >删除</el-button
          >
        </div>
        <div class="item-category">
          <span>项目分类</span>
          <el-input v-model="item.category" placeholder="例如：主材、辅材、人工" />
        </div>
        <div v-if="item.productId || item.constructionServiceId" class="linked-product">
          <el-image :src="item.image" fit="contain" />
          <div>
            <strong>{{
              linkedProduct(item)?.name || linkedService(item)?.name || item.name
            }}</strong>
            <small v-if="item.productId">{{
              linkedProduct(item)?.model || `商品 #${item.productId}`
            }}</small>
            <small v-else>{{ linkedService(item)?.description || '商品服务' }}</small>
          </div>
          <div class="linked-actions">
            <el-button v-if="item.productId" link type="primary" @click="openProductDialog(index)"
              >调整商品</el-button
            >
            <el-button v-else link type="primary" @click="openServiceDialog(index)"
              >调整服务</el-button
            >
            <el-button v-if="item.productId" link type="danger" @click="unlinkProduct(item)"
              >取消关联</el-button
            >
            <el-button v-else link type="danger" @click="unlinkService(item)">取消选择</el-button>
          </div>
        </div>
        <div v-else class="select-product-row">
          <span>填写分类后，可从商品或商品服务中快速填充项目。</span>
          <div class="select-actions">
            <el-button type="primary" plain @click="openProductDialog(index)"
              >选择商品（可多选）</el-button
            >
            <el-button type="success" plain @click="openServiceDialog(index)">选择服务</el-button>
          </div>
        </div>
        <div class="item-grid">
          <label
            ><span>项目名称</span><el-input v-model="item.name" placeholder="请输入名称"
          /></label>
          <label class="wide"
            ><span>项目描述</span><el-input v-model="item.description" placeholder="请输入描述"
          /></label>
          <label><span>单位</span><el-input v-model="item.unit" placeholder="例如：项" /></label>
          <label><span>单价</span><el-input-number v-model="item.unitPrice" :min="0" /></label>
          <label><span>数量</span><el-input-number v-model="item.quantity" :min="0" /></label>
          <label><span>排序</span><el-input-number v-model="item.sort" :min="0" /></label>
        </div>
      </div>
    </el-form>
    <template #footer
      ><el-button @click="emit('update:modelValue', false)">取消</el-button
      ><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></template
    >
  </el-dialog>

  <el-dialog
    v-model="productDialogVisible"
    title="选择商品（可多选）"
    width="720px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <el-table
      ref="productTableRef"
      v-loading="productLoading"
      class="product-table"
      :data="products"
      row-key="id"
      border
      empty-text="暂无已上架商品"
      @selection-change="selectedProducts = $event"
    >
      <el-table-column type="selection" width="48" :selectable="productSelectable" />
      <el-table-column label="商品/服务" min-width="240">
        <template #default="{ row }">
          <div class="product-cell">
            <el-image :src="row.mainImage" fit="contain" />
            <div>
              <strong>{{ row.name }}</strong
              ><small>{{ row.brand || '暂无品牌' }} · {{ row.model || '暂无型号' }}</small>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="规格" width="130"
        ><template #default="{ row }">{{
          row.specifications?.join('、') || '—'
        }}</template></el-table-column
      >
      <el-table-column label="售价" width="100"
        ><template #default="{ row }"
          >¥{{ Number(row.price).toFixed(2) }}</template
        ></el-table-column
      >
      <el-table-column prop="stock" label="库存" width="75" align="center" />
    </el-table>
    <template #footer>
      <el-button @click="productDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmProducts"
        >确认选择（{{ selectedProducts.length }}）</el-button
      >
    </template>
  </el-dialog>

  <el-dialog
    v-model="serviceDialogVisible"
    title="选择商品服务"
    width="720px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <el-table
      ref="serviceTableRef"
      v-loading="productLoading"
      :data="services"
      row-key="id"
      border
      empty-text="暂无已启用商品服务"
      @selection-change="selectedServices = $event"
    >
      <el-table-column type="selection" width="48" :selectable="serviceSelectable" />
      <el-table-column label="商品服务" min-width="280">
        <template #default="{ row }">
          <div class="product-cell">
            <el-image :src="row.image" fit="contain" />
            <div>
              <strong>{{ row.name }}</strong
              ><small>{{ row.description || '暂无服务说明' }}</small>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" width="80" align="center" />
      <el-table-column label="基础单价" width="120" align="right">
        <template #default="{ row }">¥{{ Number(row.unitPrice).toFixed(2) }}</template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="serviceDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmService"
        >确认选择（{{ selectedServices.length }}）</el-button
      >
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.section-title {
  margin: 4px 0 18px;
  padding-left: 10px;
  border-left: 3px solid var(--jfx-primary);
  font-size: 15px;
  font-weight: 600;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
}
.media-grid {
  margin-bottom: 6px;
}
.span-2 {
  grid-column: span 2;
}
.form-grid .el-select {
  width: 100%;
}
.price-summary {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  .price-value {
    color: #e55d35;
    font-size: 20px;
    font-weight: 600;
  }
  small {
    color: var(--jfx-muted);
    font-size: 11px;
  }
}
.image-box {
  display: grid;
  width: 180px;
  height: 100px;
  overflow: hidden;
  place-items: center;
  border: 1px dashed #c7cbd1;
  border-radius: 8px;
}
.image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-image-box.has-image {
  width: fit-content;
  height: auto;
}
.cover-image-box.has-image img {
  width: auto;
  height: auto;
  max-width: 320px;
  max-height: 360px;
  object-fit: contain;
}
.item-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}
.plan-item {
  margin: 0 0 14px 90px;
  padding: 14px;
  background: #f8f9fb;
  border: 1px solid var(--jfx-border);
  border-radius: 8px;
}
.plan-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
}
.plan-item-head > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.item-category {
  display: grid;
  grid-template-columns: 76px minmax(0, 260px);
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.item-category span {
  color: #606266;
  font-size: 12px;
}
.linked-product,
.select-product-row {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid var(--jfx-border);
  border-radius: 7px;
}
.linked-product .el-image {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  margin-right: 10px;
  padding: 3px;
  box-sizing: border-box;
  background: #f7f8fa;
  border: 1px solid var(--jfx-border);
  border-radius: 5px;
}
.linked-product strong,
.linked-product small {
  display: block;
}
.linked-product small,
.select-product-row span {
  margin-top: 4px;
  color: var(--jfx-muted);
  font-size: 12px;
}
.linked-actions {
  display: flex;
  margin-left: auto;
}
.select-product-row {
  justify-content: space-between;
  border-style: dashed;
}
.select-actions {
  display: flex;
  flex: none;
  margin-left: 12px;
}
.item-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.item-grid label {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}
.item-grid label > span {
  color: #606266;
  font-size: 12px;
}
.item-grid .wide {
  grid-column: span 2;
}
.item-grid .el-input-number {
  width: 100%;
}
:global(.plan-dialog .el-dialog__body) {
  max-height: 76vh;
  overflow: auto;
  padding-top: 14px;
}
.product-table {
  margin-top: 16px;
}
.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.product-cell .el-image {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  padding: 3px;
  box-sizing: border-box;
  background: #f7f8fa;
  border: 1px solid var(--jfx-border);
  border-radius: 5px;
}
.product-cell strong,
.product-cell small {
  display: block;
}
.product-cell small {
  margin-top: 5px;
  color: var(--jfx-muted);
  font-size: 11px;
}
</style>
