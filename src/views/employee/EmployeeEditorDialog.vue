<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { employeeApi } from '@/api/employees'
import { userApi } from '@/api/users'
import type { CustomerUser } from '@/types/customerUser'

const props = defineProps<{ modelValue: boolean; employeeId?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()
const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const userLoading = ref(false)
const userOptions = ref<CustomerUser[]>([])
const form = reactive({
  createMode: 'existing' as 'existing' | 'new',
  mobile: '',
  nickname: '',
  realName: '',
  position: '',
  department: '',
  serviceRegions: [] as string[],
  hiredAt: '',
  status: true,
})
const rules: FormRules = {
  mobile: [
    {
      // 新增员工时校验手机号是否存在且格式正确。
      validator: (_r, value, done) => {
        if (!props.employeeId && !value) done(new Error('请输入手机号码'))
        else if (value && !/^1\d{10}$/.test(value)) done(new Error('请输入正确的手机号码'))
        else done()
      },
      trigger: ['blur', 'change'],
    },
  ],
}

// 将表单恢复为新增员工时的初始状态。
const reset = () => {
  Object.assign(form, {
    createMode: 'existing',
    mobile: '',
    nickname: '',
    realName: '',
    position: '',
    department: '',
    serviceRegions: [],
    hiredAt: '',
    status: true,
  })
  userOptions.value = []
}
// 关闭员工编辑弹窗。
const close = () => emit('update:modelValue', false)
// 将未知异常转换为可展示的错误消息。
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'
// 获取用户在选择器中展示的姓名。
const userName = (user: CustomerUser) => user.realName || user.nickname || '未完善资料'
// 切换新增方式时清空上一种方式留下的用户信息。
const changeCreateMode = () => {
  form.mobile = ''
  form.nickname = ''
  form.realName = ''
  userOptions.value = []
  formRef.value?.clearValidate()
}
// 根据姓名或手机号远程搜索可关联的客户用户。
const searchUsers = async (keyword: string) => {
  if (!keyword.trim()) return
  userLoading.value = true
  try {
    const { data } = await userApi.list({
      pageNum: 1,
      pageSize: 20,
      keyword: keyword.trim(),
      role: 'CUSTOMER',
      status: true,
    })
    userOptions.value = data.list
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    userLoading.value = false
  }
}
// 加载待编辑员工的档案详情。
const loadDetail = async () => {
  if (!props.employeeId) return
  loading.value = true
  try {
    const { data } = await employeeApi.detail(props.employeeId)
    Object.assign(form, {
      position: data.position ?? '',
      department: data.department ?? '',
      serviceRegions: data.serviceRegions ?? [],
      hiredAt: data.hiredAt ?? '',
      status: data.status,
    })
  } catch (error) {
    ElMessage.error(messageOf(error))
    close()
  } finally {
    loading.value = false
  }
}
// 弹窗打开时重置表单，并按需加载员工详情。
watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) return
    reset()
    await loadDetail()
    await nextTick()
    formRef.value?.clearValidate()
  },
)
// 校验表单并新增或更新员工档案。
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  const common = {
    position: form.position.trim() || undefined,
    department: form.department.trim() || undefined,
    serviceRegions: form.serviceRegions.map((v) => v.trim()).filter(Boolean),
    hiredAt: form.hiredAt || undefined,
    status: form.status,
  }
  try {
    if (props.employeeId) await employeeApi.update(props.employeeId, common)
    else
      await employeeApi.create({
        ...common,
        mobile: form.mobile.trim(),
        ...(form.createMode === 'new'
          ? {
              nickname: form.nickname.trim() || undefined,
              realName: form.realName.trim() || undefined,
            }
          : {}),
      })
    ElMessage.success(props.employeeId ? '员工信息已更新' : '员工已新增')
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
    :title="employeeId ? '编辑员工' : '新增员工'"
    width="680px"
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-width="100px">
      <template v-if="!employeeId">
        <el-form-item label="新增方式"
          ><el-radio-group v-model="form.createMode" @change="changeCreateMode"
            ><el-radio-button value="existing">关联已有用户</el-radio-button
            ><el-radio-button value="new">录入新用户</el-radio-button></el-radio-group
          ></el-form-item
        >
        <el-form-item v-if="form.createMode === 'existing'" label="关联用户" prop="mobile">
          <el-select
            v-model="form.mobile"
            filterable
            remote
            clearable
            :remote-method="searchUsers"
            :loading="userLoading"
            placeholder="输入姓名或手机号搜索"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${userName(user)} · ${user.mobile}`"
              :value="user.mobile"
            />
          </el-select>
        </el-form-item>
        <div v-else class="form-grid">
          <el-form-item label="手机号码" prop="mobile"
            ><el-input v-model="form.mobile" maxlength="11"
          /></el-form-item>
          <el-form-item label="真实姓名"><el-input v-model="form.realName" /></el-form-item>
          <el-form-item label="用户昵称"><el-input v-model="form.nickname" /></el-form-item>
        </div>
        <el-divider />
      </template>
      <div class="form-grid">
        <el-form-item label="岗位"
          ><el-input v-model="form.position" placeholder="如：安装工程师"
        /></el-form-item>
        <el-form-item label="所属部门"
          ><el-input v-model="form.department" placeholder="如：安装部"
        /></el-form-item>
        <el-form-item label="入职时间"
          ><el-date-picker
            v-model="form.hiredAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            placeholder="请选择"
        /></el-form-item>
        <el-form-item label="在职状态"
          ><el-switch v-model="form.status" inline-prompt active-text="在职" inactive-text="离职"
        /></el-form-item>
        <el-form-item class="full-row" label="服务区域"
          ><el-select
            v-model="form.serviceRegions"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入区域后按回车，可添加多个"
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

.el-select,
.el-date-editor {
  width: 100%;
}
</style>
