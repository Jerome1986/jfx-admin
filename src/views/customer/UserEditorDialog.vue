<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'

import { userApi } from '@/api/users'
import type { CustomerUserRole, UpdateUserParams } from '@/types/customerUser'

const props = defineProps<{ modelValue: boolean; userId?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()

type UserForm = Required<
  Pick<
    UpdateUserParams,
    'role' | 'mobile' | 'nickname' | 'realName' | 'avatar' | 'source' | 'city' | 'tags' | 'status'
  >
>

const loading = ref(false)
const submitting = ref(false)
const uploadUrl = 'https://a9lhd8buo8.sealoshzh.site/upload/images'
const formRef = ref<FormInstance>()
const form = reactive<UserForm>({
  role: 'CUSTOMER',
  mobile: '',
  nickname: '',
  realName: '',
  avatar: '',
  source: '',
  city: '',
  tags: [],
  status: true,
})
const rules: FormRules<UserForm> = {
  mobile: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择用户角色', trigger: 'change' }],
}

const close = () => emit('update:modelValue', false)
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (file.type.startsWith('image/')) return true
  ElMessage.warning('只能上传图片文件')
  return false
}

const handleAvatarSuccess: UploadProps['onSuccess'] = (response) => {
  if (typeof response !== 'string') return ElMessage.error('上传接口未返回图片地址')
  form.avatar = response
  ElMessage.success('头像上传成功')
}

const handleAvatarError: UploadProps['onError'] = () => ElMessage.error('头像上传失败')
const removeAvatar = () => {
  form.avatar = ''
}

const loadDetail = async () => {
  if (!props.userId) return
  loading.value = true
  try {
    const { data } = await userApi.detail(props.userId)
    Object.assign(form, {
      role: data.role,
      mobile: data.mobile,
      nickname: data.nickname ?? '',
      realName: data.realName ?? '',
      avatar: data.avatar ?? '',
      source: data.source ?? '',
      city: data.city ?? '',
      tags: data.tags ?? [],
      status: data.status,
    })
    await nextTick()
    formRef.value?.clearValidate()
  } catch (error) {
    ElMessage.error(messageOf(error))
    close()
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.userId] as const,
  ([visible]) => {
    if (visible) loadDetail()
  },
)

const submit = async () => {
  if (!props.userId || !(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
    await userApi.update(props.userId, {
      role: form.role as CustomerUserRole,
      mobile: form.mobile.trim(),
      nickname: form.nickname.trim(),
      realName: form.realName.trim(),
      avatar: form.avatar.trim(),
      source: form.source.trim(),
      city: form.city.trim(),
      tags: form.tags.map((tag) => tag.trim()).filter(Boolean),
      status: form.status,
    })
    ElMessage.success('用户信息已更新')
    close()
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
    title="编辑用户"
    width="700px"
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-width="88px">
      <div class="form-grid">
        <el-form-item label="用户角色" prop="role"
          ><el-select v-model="form.role"
            ><el-option label="客户" value="CUSTOMER" /><el-option
              label="员工"
              value="EMPLOYEE" /></el-select
        ></el-form-item>
        <el-form-item label="手机号码" prop="mobile"
          ><el-input v-model="form.mobile" maxlength="11"
        /></el-form-item>
        <el-form-item label="用户昵称"
          ><el-input v-model="form.nickname" placeholder="请输入用户昵称"
        /></el-form-item>
        <el-form-item label="真实姓名"
          ><el-input v-model="form.realName" placeholder="请输入真实姓名"
        /></el-form-item>
        <el-form-item label="来源渠道"
          ><el-input v-model="form.source" placeholder="如：微信小程序"
        /></el-form-item>
        <el-form-item label="所在城市"
          ><el-input v-model="form.city" placeholder="请输入所在城市"
        /></el-form-item>
        <el-form-item class="full-row" label="用户头像">
          <div class="avatar-upload-wrap">
            <el-upload
              class="avatar-uploader"
              :action="uploadUrl"
              :show-file-list="false"
              :before-upload="beforeUpload"
              :on-success="handleAvatarSuccess"
              :on-error="handleAvatarError"
              accept="image/*"
            >
              <img v-if="form.avatar" :src="form.avatar" alt="用户头像" />
              <el-icon v-else><Plus /></el-icon>
            </el-upload>
            <div class="upload-actions">
              <span>支持 JPG、PNG 等图片格式</span>
              <el-button v-if="form.avatar" :icon="Delete" link type="danger" @click="removeAvatar">
                移除头像
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item class="full-row" label="用户标签"
          ><el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后回车"
        /></el-form-item>
        <el-form-item label="账号状态"
          ><el-switch v-model="form.status" inline-prompt active-text="启用" inactive-text="禁用"
        /></el-form-item>
      </div>
    </el-form>
    <template #footer
      ><el-button @click="close">取消</el-button
      ><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></template
    >
  </el-dialog>
</template>

<style scoped lang="scss">
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
}
.full-row {
  grid-column: 1 / -1;
}
.el-select {
  width: 100%;
}
.avatar-upload-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}
.avatar-uploader :deep(.el-upload) {
  display: grid;
  width: 88px;
  height: 88px;
  overflow: hidden;
  place-items: center;
  border: 1px dashed #c7cbd1;
  border-radius: 50%;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--jfx-primary);
  }
}
.avatar-uploader img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-uploader .el-icon {
  color: var(--jfx-muted);
  font-size: 26px;
}
.upload-actions {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;

  span {
    color: var(--jfx-muted);
    font-size: 12px;
  }
}
</style>
