<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { constructionServiceApi } from '@/api/constructionServices'
import type { ConstructionServiceInput } from '@/types/constructionService'

const props = defineProps<{ modelValue: boolean; serviceId?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()
const uploadUrl = 'https://a9lhd8buo8.sealoshzh.site/upload/images'
const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const form = reactive<ConstructionServiceInput>({
  name: '',
  description: '',
  unit: '',
  unitPrice: 0,
  image: '',
  isEnabled: true,
  sort: 0,
})
const rules: FormRules<ConstructionServiceInput> = {
  name: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入计价单位', trigger: 'blur' }],
  unitPrice: [{ required: true, message: '请输入基础单价', trigger: 'change' }],
}

// 将未知异常转换为可展示的错误消息。
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'

// 恢复新增商品服务时的默认表单数据。
const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    unit: '',
    unitPrice: 0,
    image: '',
    isEnabled: true,
    sort: 0,
  })
  nextTick(() => formRef.value?.clearValidate())
}

// 加载待编辑商品服务的最新详情。
const loadDetail = async () => {
  if (!props.serviceId) return
  loading.value = true
  try {
    const { data } = await constructionServiceApi.detail(props.serviceId)
    Object.assign(form, {
      name: data.name,
      description: data.description ?? '',
      unit: data.unit,
      unitPrice: Number(data.unitPrice),
      image: data.image ?? '',
      isEnabled: data.isEnabled,
      sort: data.sort,
    })
  } catch (error) {
    ElMessage.error(messageOf(error))
    emit('update:modelValue', false)
  } finally {
    loading.value = false
  }
}

// 弹窗打开时初始化新增表单或读取编辑详情。
watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    resetForm()
    if (props.serviceId) loadDetail()
  },
)

// 限制服务图片只能上传图片文件。
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (file.type.startsWith('image/')) return true
  ElMessage.warning('只能上传图片文件')
  return false
}

// 将上传成功后返回的地址写入服务图片字段。
const imageUploadSuccess: UploadProps['onSuccess'] = (response) => {
  if (typeof response !== 'string') return ElMessage.error('上传接口未返回图片地址')
  form.image = response
}

// 校验并新增或更新商品服务。
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  const payload: ConstructionServiceInput = {
    name: form.name.trim(),
    description: form.description?.trim() || undefined,
    unit: form.unit.trim(),
    unitPrice: Number(form.unitPrice),
    image: form.image?.trim() || undefined,
    isEnabled: form.isEnabled,
    sort: Number(form.sort),
  }
  try {
    if (props.serviceId) await constructionServiceApi.update(props.serviceId, payload)
    else await constructionServiceApi.create(payload)
    ElMessage.success(props.serviceId ? '商品服务修改成功' : '商品服务新增成功')
    emit('update:modelValue', false)
    emit('saved')
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="serviceId ? '编辑商品服务' : '新增商品服务'"
    width="700px"
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-width="100px">
      <div class="form-grid">
        <el-form-item label="服务名称" prop="name"
          ><el-input v-model="form.name" maxlength="255" placeholder="如：家具遮蔽保护"
        /></el-form-item>
        <el-form-item label="计价单位" prop="unit"
          ><el-input v-model="form.unit" maxlength="32" placeholder="如：㎡、项、个"
        /></el-form-item>
        <el-form-item label="基础单价" prop="unitPrice"
          ><el-input-number
            v-model="form.unitPrice"
            :min="0"
            :max="99999999.99"
            :precision="2"
            :step="1"
        /></el-form-item>
        <el-form-item label="排序"
          ><el-input-number v-model="form.sort" :min="0" :precision="0"
        /></el-form-item>
        <el-form-item label="启用状态"
          ><el-switch
            v-model="form.isEnabled"
            inline-prompt
            active-text="启用"
            inactive-text="停用"
        /></el-form-item>
      </div>
      <el-form-item label="服务说明"
        ><el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请输入服务内容或适用范围"
      /></el-form-item>
      <el-form-item label="服务图片">
        <div class="upload-row">
          <el-upload
            class="image-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-success="imageUploadSuccess"
          >
            <el-image
              v-if="form.image"
              :src="form.image"
              fit="contain"
              :preview-src-list="[form.image]"
              preview-teleported
              @click.stop
            />
            <el-icon v-else><Plus /></el-icon>
          </el-upload>
          <el-button
            v-if="form.image"
            :icon="Delete"
            circle
            type="danger"
            plain
            @click="form.image = ''"
          />
        </div>
      </el-form-item>
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
}
.el-input-number {
  width: 100%;
}
.upload-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.image-uploader :deep(.el-upload) {
  display: grid;
  width: 180px;
  height: 120px;
  overflow: hidden;
  place-items: center;
  border: 1px dashed #c7cbd1;
  border-radius: 8px;
  cursor: pointer;
}
.image-uploader .el-image {
  width: 100%;
  height: 100%;
}
.image-uploader .el-icon {
  color: var(--jfx-muted);
  font-size: 26px;
}
@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
