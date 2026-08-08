<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'

import { caseApi } from '@/api/cases'
import type { CaseDetail, CaseSaveInput } from '@/types/case'
import type { CaseCategory } from '@/types/caseCategory'

// 定义案例编辑组件的输入属性。
const props = defineProps<{
  modelValue: boolean
  caseId?: number
  categories: CaseCategory[]
}>()
// 定义案例编辑组件的关闭和保存事件。
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()
// 定义包含标签文本的案例编辑表单结构。
type CaseEditorForm = Omit<CaseSaveInput, 'tags'> & { tagsText: string }
// 引用案例表单实例以执行校验。
const formRef = ref<FormInstance>()
// 标记案例表单是否正在提交。
const submitting = ref(false)
const uploadUrl = 'https://a9lhd8buo8.sealoshzh.site/upload/images'
// 创建案例表单的默认数据。
const createForm = (): CaseEditorForm => ({
  title: '',
  categoryId: 0,
  beforeCover: '',
  afterCover: '',
  city: '',
  roomType: '',
  area: 0,
  style: '',
  tagsText: '',
  totalPrice: 0,
  durationDays: 1,
  quoteCount: 0,
  description: '',
  highlights: [{ title: '', description: '' }],
  costs: [{ name: '', amount: 0 }],
  isRecommended: false,
  recommendSort: 99,
  status: 'draft',
})
// 保存案例新增或编辑表单数据。
const form = reactive<CaseEditorForm>(createForm())
// 定义案例表单的核心字段校验规则。
const rules: FormRules = {
  title: [{ required: true, message: '请输入案例标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择案例分类', trigger: 'change' }],
  beforeCover: [{ required: true, message: '请上传改造前图片', trigger: 'change' }],
  afterCover: [{ required: true, message: '请上传改造后图片', trigger: 'change' }],
  city: [{ required: true, message: '请输入所在城市', trigger: 'blur' }],
  roomType: [{ required: true, message: '请输入户型', trigger: 'blur' }],
  area: [{ required: true, message: '请输入面积', trigger: 'change' }],
  totalPrice: [{ required: true, message: '请输入总花费', trigger: 'change' }],
  durationDays: [{ required: true, message: '请输入工期', trigger: 'change' }],
  description: [{ required: true, message: '请输入案例说明', trigger: 'blur' }],
}
// 将未知异常转换为可展示的错误信息。
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'
// 将完整案例详情填充到编辑表单。
const fillForm = (item: CaseDetail) => Object.assign(form, item, { tagsText: item.tags.join('，') })
// 在案例表单中追加一项改造亮点。
const addHighlight = () => form.highlights.push({ title: '', description: '' })
// 从案例表单中移除指定改造亮点。
const removeHighlight = (index: number) => form.highlights.splice(index, 1)
// 在案例表单中追加一项费用明细。
const addCost = () => form.costs.push({ name: '', amount: 0 })
// 从案例表单中移除指定费用明细。
const removeCost = (index: number) => form.costs.splice(index, 1)
// 关闭案例编辑弹框。
const close = () => emit('update:modelValue', false)
type CoverField = 'beforeCover' | 'afterCover'

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // if (!file.type.startsWith('image/')) {
  //   ElMessage.warning('只能上传图片文件')
  //   return false
  // }
  // if (file.size > 10 * 1024 * 1024) {
  //   ElMessage.warning('图片大小不能超过 10MB')
  //   return false
  // }
  return true
}

const setUploadedCover = (field: CoverField, response: unknown) => {
  if (typeof response !== 'string') {
    ElMessage.error('上传接口未返回图片地址')
    return
  }
  form[field] = response
  formRef.value?.validateField(field).catch(() => undefined)
  ElMessage.success('图片上传成功')
}

const handleBeforeCoverSuccess: UploadProps['onSuccess'] = (response) => {
  console.log('改造前', response)
  setUploadedCover('beforeCover', response)
}

const handleAfterCoverSuccess: UploadProps['onSuccess'] = (response) => {
  setUploadedCover('afterCover', response)
}

const handleUploadError: UploadProps['onError'] = () => {
  ElMessage.error('图片上传失败，请检查接口响应状态')
}

const removeCover = (field: CoverField) => {
  form[field] = ''
  formRef.value?.validateField(field).catch(() => undefined)
}
// 校验并提交案例新增或编辑数据。
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  if (!form.highlights.every((item) => item.title.trim() && item.description.trim()))
    return ElMessage.warning('请完整填写改造亮点')
  if (!form.costs.every((item) => item.name.trim() && item.amount >= 0))
    return ElMessage.warning('请完整填写费用明细')
  submitting.value = true
  try {
    // 将标签文本转换为去重后的标签数组。
    const tags = [
      ...new Set(
        form.tagsText
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ]
    // 移除仅供表单展示使用的标签文本字段。
    const { tagsText: _tagsText, ...formData } = form
    void _tagsText
    // 组装案例仓储需要的保存参数。
    const payload: CaseSaveInput = { ...formData, tags }
    if (props.caseId) await caseApi.update(props.caseId, payload)
    else await caseApi.create(payload)
    ElMessage.success(props.caseId ? '案例编辑成功' : '案例新增成功')
    close()
    emit('saved')
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    submitting.value = false
  }
}
// 在弹框打开时加载编辑数据或初始化新增表单。
watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) return
    formRef.value?.clearValidate()
    if (props.caseId) fillForm(await caseApi.detail(props.caseId))
    else
      Object.assign(form, createForm(), {
        categoryId: props.categories.find((item) => item.isEnabled)?.id ?? 0,
      })
  },
)
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="caseId ? '编辑案例' : '新增案例'"
    width="860px"
    top="4vh"
    destroy-on-close
    class="case-editor-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
      <div class="section-title">基本信息</div>
      <div class="form-grid">
        <el-form-item label="案例标题" prop="title" class="span-2"
          ><el-input v-model="form.title" maxlength="100" show-word-limit
        /></el-form-item>
        <el-form-item label="案例分类" prop="categoryId">
          <el-select v-model="form.categoryId">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="!item.isEnabled ? `${item.name}（已停用）` : item.name"
              :value="item.id"
              :disabled="!item.isEnabled && item.id !== form.categoryId" /></el-select
        ></el-form-item>
        <el-form-item label="发布状态"
          ><el-select v-model="form.status"
            ><el-option label="草稿" value="draft" /><el-option
              label="已发布"
              value="published" /><el-option label="已下架" value="disabled" /></el-select
        ></el-form-item>
        <el-form-item label="所在城市" prop="city"><el-input v-model="form.city" /></el-form-item>
        <el-form-item label="户型" prop="roomType"
          ><el-input v-model="form.roomType"
        /></el-form-item>
        <el-form-item label="面积" prop="area"
          ><el-input-number v-model="form.area" :min="1" :max="9999" :precision="2" /><span
            class="unit"
            >㎡</span
          ></el-form-item
        >
        <el-form-item label="装修风格"><el-input v-model="form.style" /></el-form-item>
        <el-form-item label="案例标签" class="span-2"
          ><el-input v-model="form.tagsText" placeholder="多个标签使用逗号分隔"
        /></el-form-item>
      </div>
      <div class="section-title">改造图片</div>
      <div class="editor-covers">
        <el-form-item label="改造前" prop="beforeCover">
          <el-upload
            class="cover-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :on-success="handleBeforeCoverSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <div class="editor-cover before">
              <img v-if="form.beforeCover" :src="form.beforeCover" alt="改造前图片" />
              <el-icon v-else>
                <Plus />
              </el-icon>
            </div>
          </el-upload>
          <el-button
            v-if="form.beforeCover"
            class="remove-cover"
            :icon="Delete"
            circle
            title="删除改造前图片"
            @click.stop="removeCover('beforeCover')"
          />
        </el-form-item>
        <el-form-item label="改造后" prop="afterCover">
          <el-upload
            class="cover-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :on-success="handleAfterCoverSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <div class="editor-cover after">
              <img v-if="form.afterCover" :src="form.afterCover" alt="改造后图片" />
              <el-icon v-else>
                <Plus />
              </el-icon>
            </div>
          </el-upload>
          <el-button
            v-if="form.afterCover"
            class="remove-cover"
            :icon="Delete"
            circle
            title="删除改造后图片"
            @click.stop="removeCover('afterCover')"
          />
        </el-form-item>
      </div>
      <div class="section-title">费用与工期</div>
      <div class="form-grid">
        <el-form-item label="总花费" prop="totalPrice"
          ><el-input-number
            v-model="form.totalPrice"
            :min="0"
            :max="999999999"
            :precision="2"
          /><span class="unit">元</span></el-form-item
        >
        <el-form-item label="施工工期" prop="durationDays"
          ><el-input-number v-model="form.durationDays" :min="1" :max="9999" /><span class="unit"
            >天</span
          ></el-form-item
        >
        <el-form-item label="报价人数"
          ><el-input-number v-model="form.quoteCount" :min="0"
        /></el-form-item>
        <el-form-item label="首页推荐"
          ><el-switch v-model="form.isRecommended" :disabled="form.status !== 'published'"
        /></el-form-item>
        <el-form-item label="推荐排序"
          ><el-input-number
            v-model="form.recommendSort"
            :min="0"
            :max="9999"
            :disabled="!form.isRecommended"
        /></el-form-item>
      </div>
      <div class="section-title">案例内容</div>
      <el-form-item label="案例说明" prop="description"
        ><el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          maxlength="1000"
          show-word-limit
      /></el-form-item>
      <div class="dynamic-heading">
        <span>改造亮点</span
        ><el-button link type="primary" @click="addHighlight">添加亮点</el-button>
      </div>
      <div v-for="(item, index) in form.highlights" :key="index" class="dynamic-row highlight-row">
        <el-input v-model="item.title" placeholder="亮点标题" /><el-input
          v-model="item.description"
          placeholder="亮点说明"
        /><el-button
          link
          type="danger"
          :disabled="form.highlights.length === 1"
          @click="removeHighlight(index)"
          >删除</el-button
        >
      </div>
      <div class="dynamic-heading">
        <span>费用明细</span><el-button link type="primary" @click="addCost">添加费用</el-button>
      </div>
      <div v-for="(item, index) in form.costs" :key="index" class="dynamic-row cost-row">
        <el-input v-model="item.name" placeholder="费用名称" /><el-input-number
          v-model="item.amount"
          :min="0"
          :precision="2"
        /><span class="unit">元</span
        ><el-button
          link
          type="danger"
          :disabled="form.costs.length === 1"
          @click="removeCost(index)"
          >删除</el-button
        >
      </div>
    </el-form>
    <template #footer
      ><el-button @click="close">取消</el-button
      ><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></template
    >
  </el-dialog>
</template>

<style scoped lang="scss">
.section-title {
  margin: 8px 0 18px;
  padding-left: 10px;
  border-left: 3px solid var(--jfx-primary);
  font-size: 15px;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 22px;

  .span-2 {
    grid-column: span 2;
  }

  .el-select,
  .el-input-number {
    width: 100%;
  }
}

.editor-covers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 24px;

  :deep(.el-form-item__content) {
    position: relative;
  }
}

.cover-uploader {
  flex: 0 0 144px;
  width: 144px;

  :deep(.el-upload) {
    width: 144px;
  }
}

.editor-cover {
  display: grid;
  width: 144px;
  height: 144px;
  aspect-ratio: 1;
  place-items: center;
  color: #fff;
  background: #9299a3;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: 1px dashed #c7cbd1;

  .el-icon {
    font-size: 28px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.after {
    background: #be856b;
  }
}

.remove-cover {
  position: absolute;
  top: 8px;
  left: 104px;
}

.unit {
  margin-left: 8px;
  color: var(--jfx-muted);
  font-size: 12px;
}

.dynamic-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0 10px 92px;
  font-size: 14px;
  font-weight: 600;
}

.dynamic-row {
  display: grid;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px 92px;

  &.highlight-row {
    grid-template-columns: 150px minmax(0, 1fr) 45px;
  }

  &.cost-row {
    grid-template-columns: minmax(0, 1fr) 180px 24px 45px;
  }
}

:global(.case-editor-dialog .el-dialog__body) {
  max-height: 76vh;
  overflow-y: auto;
  padding-top: 12px;
}
</style>
