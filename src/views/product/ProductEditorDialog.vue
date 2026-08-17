<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'

import { productApi } from '@/api/products'
import {
  findCategoryPath,
  lastCategoryId,
  toCategoryCascaderOptions,
} from '@/utils/productCategories'
import type { ProductInput } from '@/types/product'
import type { ProductCategory } from '@/types/productCategory'

const props = defineProps<{
  modelValue: boolean
  productId?: number
  categories: ProductCategory[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

// 表单使用完整分类路径，保存时只提交路径中的末级分类编号。
type ProductForm = Omit<ProductInput, 'categoryId'> & { categoryPath: number[] }

const uploadUrl = 'https://a9lhd8buo8.sealoshzh.site/upload/images'
const loading = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<ProductForm>({
  categoryPath: [],
  name: '',
  description: '',
  brand: '',
  model: '',
  specifications: [],
  price: 0,
  stock: 0,
  mainImage: '',
  detailImages: [],
  installationIncluded: false,
  isPublished: true,
  sort: 0,
})

const categoryOptions = computed(() => toCategoryCascaderOptions(props.categories))

const rules: FormRules<ProductForm> = {
  categoryPath: [{ required: true, message: '请选择末级商品分类', trigger: 'change' }],
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入商品价格', trigger: 'change' }],
  mainImage: [{ required: true, message: '请上传商品主图', trigger: 'change' }],
}

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'

// 初始化新增商品表单。
const resetForm = () => {
  Object.assign(form, {
    categoryPath: [],
    name: '',
    description: '',
    brand: '',
    model: '',
    specifications: [],
    price: 0,
    stock: 0,
    mainImage: '',
    detailImages: [],
    installationIncluded: false,
    isPublished: true,
    sort: 0,
  })
  nextTick(() => formRef.value?.clearValidate())
}

// 编辑时读取最新商品详情。
const loadDetail = async () => {
  if (!props.productId) return
  loading.value = true
  try {
    const { data } = await productApi.detail(props.productId)
    Object.assign(form, {
      categoryPath: findCategoryPath(props.categories, data.categoryId) ?? [],
      name: data.name,
      description: data.description ?? '',
      brand: data.brand ?? '',
      model: data.model ?? '',
      specifications: data.specifications ?? [],
      price: Number(data.price),
      stock: data.stock ?? 0,
      mainImage: data.mainImage,
      detailImages: data.detailImages ?? [],
      installationIncluded: Boolean(data.installationIncluded),
      isPublished: Boolean(data.isPublished),
      sort: data.sort ?? 0,
    })
  } catch (error) {
    ElMessage.error(messageOf(error))
    emit('update:modelValue', false)
  } finally {
    loading.value = false
  }
}

// 弹框打开时按新增或编辑模式准备表单。
watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    resetForm()
    if (props.productId) loadDetail()
  },
)

// 只提交后端 DTO 中定义的商品字段。
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
    const payload: ProductInput = {
      categoryId: lastCategoryId(form.categoryPath)!,
      name: form.name.trim(),
      description: form.description?.trim(),
      brand: form.brand?.trim(),
      model: form.model?.trim(),
      specifications: (form.specifications ?? []).map((item) => item.trim()).filter(Boolean),
      price: Number(form.price),
      stock: form.stock ?? 0,
      mainImage: form.mainImage,
      detailImages: form.detailImages ?? [],
      installationIncluded: form.installationIncluded,
      isPublished: form.isPublished,
      sort: form.sort ?? 0,
    }
    if (props.productId) await productApi.update(props.productId, payload)
    else await productApi.create(payload)
    ElMessage.success(props.productId ? '商品修改成功' : '商品新增成功')
    emit('update:modelValue', false)
    emit('saved')
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    submitting.value = false
  }
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (file.type.startsWith('image/')) return true
  ElMessage.warning('只能上传图片文件')
  return false
}

const mainImageSuccess: UploadProps['onSuccess'] = (response) => {
  if (typeof response !== 'string') return ElMessage.error('上传接口未返回图片地址')
  form.mainImage = response
  formRef.value?.validateField('mainImage').catch(() => undefined)
}

const detailImageSuccess: UploadProps['onSuccess'] = (response) => {
  if (typeof response !== 'string') return ElMessage.error('上传接口未返回图片地址')
  form.detailImages = [...(form.detailImages ?? []), response]
}

// 新增一项待填写的商品规格。
const addSpecification = () => {
  form.specifications = [...(form.specifications ?? []), '']
}

// 删除指定商品规格。
const removeSpecification = (index: number) => {
  form.specifications?.splice(index, 1)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="productId ? '编辑商品' : '新增商品'"
    width="760px"
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form v-loading="loading" ref="formRef" :model="form" :rules="rules" label-width="100px">
      <div class="form-grid">
        <el-form-item label="商品名称" prop="name"
          ><el-input v-model="form.name" placeholder="请输入商品名称"
        /></el-form-item>
        <el-form-item label="商品分类" prop="categoryPath">
          <el-cascader
            v-model="form.categoryPath"
            :options="categoryOptions"
            filterable
            clearable
            placeholder="请选择末级分类"
          />
        </el-form-item>
        <el-form-item label="品牌"
          ><el-input v-model="form.brand" placeholder="请输入品牌"
        /></el-form-item>
        <el-form-item label="产品型号"
          ><el-input v-model="form.model" placeholder="请输入产品型号"
        /></el-form-item>
        <el-form-item label="价格" prop="price"
          ><el-input-number
            v-model="form.price"
            :min="0"
            :max="99999999.99"
            :precision="2"
            :step="100"
        /></el-form-item>
        <el-form-item label="库存"
          ><el-input-number v-model="form.stock" :min="0" :precision="0"
        /></el-form-item>
        <el-form-item class="full-row" label="排序"
          ><el-input-number v-model="form.sort" :min="0" :precision="0"
        /></el-form-item>
      </div>
      <el-form-item label="商品规格">
        <div class="specification-list">
          <div v-for="(_, index) in form.specifications" :key="index" class="specification-item">
            <el-input v-model="form.specifications![index]" placeholder="请输入规格，如：黑色" />
            <el-button
              :icon="Delete"
              circle
              plain
              type="danger"
              @click="removeSpecification(index)"
            />
          </div>
          <el-button plain type="primary" :icon="Plus" @click="addSpecification">
            新增规格
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="商品描述"
        ><el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入商品描述"
      /></el-form-item>
      <el-form-item label="商品主图" prop="mainImage">
        <div class="upload-row">
          <el-upload
            class="image-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-success="mainImageSuccess"
            ><el-image
              v-if="form.mainImage"
              :src="form.mainImage"
              fit="contain"
              :preview-src-list="[form.mainImage]"
              preview-teleported
              @click.stop /><el-icon v-else><Plus /></el-icon
          ></el-upload>
          <el-button v-if="form.mainImage" :icon="Delete" circle @click="form.mainImage = ''" />
        </div>
      </el-form-item>
      <el-form-item label="详情图片">
        <div class="detail-images">
          <div
            v-for="(image, index) in form.detailImages"
            :key="image + index"
            class="detail-image"
          >
            <el-image
              :src="image"
              fit="contain"
              :preview-src-list="form.detailImages"
              :initial-index="index"
              preview-teleported
            /><el-button
              :icon="Delete"
              circle
              size="small"
              @click="form.detailImages?.splice(index, 1)"
            />
          </div>
          <el-upload
            class="detail-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-success="detailImageSuccess"
            ><el-icon><Plus /></el-icon
          ></el-upload>
        </div>
      </el-form-item>
      <div class="form-grid">
        <el-form-item label="基础安装"
          ><el-switch v-model="form.installationIncluded"
        /></el-form-item>
        <el-form-item label="上架状态"
          ><el-switch
            v-model="form.isPublished"
            inline-prompt
            active-text="上架"
            inactive-text="下架"
        /></el-form-item>
      </div>
    </el-form>
    <template #footer
      ><el-button @click="emit('update:modelValue', false)">取消</el-button
      ><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></template
    >
  </el-dialog>
</template>

<style scoped lang="scss">
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;
  .el-select,
  .el-cascader,
  .el-input-number {
    width: 100%;
  }
}
.full-row {
  grid-column: 1 / -1;
}
.upload-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.specification-list {
  width: 100%;
}
.specification-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.image-uploader :deep(.el-upload),
.detail-uploader :deep(.el-upload) {
  display: grid;
  place-items: center;
  border: 1px dashed #c7cbd1;
  border-radius: 8px;
  cursor: pointer;
}
.image-uploader :deep(.el-upload) {
  width: auto;
  min-width: 180px;
  min-height: 120px;
  max-width: 560px;
  padding: 8px;
}
.image-uploader .el-image,
.detail-image .el-image {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  background: #f7f8fa;
}
.image-uploader .el-image {
  max-height: 360px;
}
.image-uploader :deep(.el-image__inner),
.detail-image :deep(.el-image__inner) {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  object-fit: contain;
}
.image-uploader .el-icon,
.detail-uploader .el-icon {
  color: var(--jfx-muted);
  font-size: 26px;
}
.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.detail-image {
  position: relative;
  display: grid;
  width: auto;
  min-width: 100px;
  min-height: 100px;
  max-width: 240px;
  padding: 6px;
  place-items: center;
  background: #f7f8fa;
  border: 1px solid var(--jfx-border);
  border-radius: 8px;
  box-sizing: border-box;

  :deep(.el-image__inner) {
    max-height: 220px;
  }

  .el-button {
    position: absolute;
    top: 5px;
    right: 5px;
  }
}
.detail-uploader :deep(.el-upload) {
  width: 100px;
  height: 100px;
}
@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
