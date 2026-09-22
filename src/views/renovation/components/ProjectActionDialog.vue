<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { projectApi } from '@/api/projects'
import { employeeApi } from '@/api/employees'
import { userApi } from '@/api/users'
import { renewalPlanApi } from '@/api/renewalPlans'
import type { Employee } from '@/types/employee'
import type { CustomerUser } from '@/types/customerUser'
import type { RenewalPlan } from '@/types/renewalPlan'
import { projectStatuses, type ProjectDetail, type ProjectStatus } from '@/types/project'
import { decimalPattern } from '@/utils/project'
const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit' | 'assign' | 'progress' | 'follow-up'
  project?: ProjectDetail
}>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: []; conflict: [] }>()
const titles = {
  create: '新增项目',
  edit: '编辑项目',
  assign: '分配 / 改派负责人',
  progress: '更新服务进度',
  'follow-up': '新增跟进',
}
const formRef = ref<FormInstance>()
const saving = ref(false)
const optionsLoading = ref(false)
const optionsError = ref(false)
const employees = ref<Employee[]>([])
const users = ref<CustomerUser[]>([])
const plans = ref<RenewalPlan[]>([])
let session = 0
const form = reactive({
  name: '',
  customerName: '',
  mobile: '',
  serviceAddress: '',
  remark: '',
  employeeId: null as number | null,
  userId: null as number | null,
  planId: null as number | null,
  status: 'PENDING_CONFIRM' as ProjectStatus,
  content: '',
  contractAmount: '',
  nextFollowAt: null as Date | null,
})
const confirming = computed(
  () =>
    props.mode === 'progress' &&
    props.project?.status === 'PENDING_CONFIRM' &&
    form.status === 'IN_SERVICE',
)
const allowedStatuses = computed<ProjectStatus[]>(() =>
  props.project?.status === 'PENDING_CONFIRM'
    ? ['PENDING_CONFIRM', 'IN_SERVICE']
    : props.project?.status === 'IN_SERVICE'
      ? ['IN_SERVICE', 'COMPLETED']
      : props.project?.status === 'COMPLETED'
        ? ['COMPLETED']
        : [],
)
const required = (message: string) => [
  { required: true, whitespace: true, message, trigger: 'blur' },
]
const rules = computed<FormRules>(() => {
  if (['create', 'edit'].includes(props.mode))
    return {
      name: required('请输入项目名称'),
      customerName: required('请输入客户姓名'),
      mobile: [
        {
          required: true,
          pattern: /^1[3-9]\d{9}$/,
          message: '请输入正确的大陆手机号',
          trigger: 'blur',
        },
      ],
    }
  if (props.mode === 'assign')
    return { employeeId: [{ required: true, message: '请选择负责人', trigger: 'change' }] }
  return {
    content: required('请输入内容'),
    ...(confirming.value
      ? {
          contractAmount: [
            {
              required: true,
              pattern: decimalPattern,
              message: '请输入非负金额，最多 8 位整数和 2 位小数',
              trigger: 'blur',
            },
          ],
        }
      : {}),
  }
})
async function loadOptions() {
  const current = ++session
  optionsLoading.value = true
  optionsError.value = false
  try {
    const collected: Employee[] = []
    for (let pageNum = 1; ; pageNum++) {
      const { data } = await employeeApi.list({ pageNum, pageSize: 100, status: true })
      if (current !== session) return
      if (data.pageNum !== pageNum || !Number.isInteger(data.totalPage) || data.totalPage < 0)
        throw new Error('分页异常')
      collected.push(
        ...data.list.filter((e) => e.status && e.user?.status && e.user.role === 'EMPLOYEE'),
      )
      if (pageNum >= data.totalPage) break
      if (!data.list.length) throw new Error('分页异常')
    }
    let customerOptions: CustomerUser[] = []
    let planOptions: RenewalPlan[] = []
    if (props.mode === 'create') {
      const results = await Promise.all([
        renewalPlanApi.list(),
        (async () => {
          const all: CustomerUser[] = []
          for (let pageNum = 1; ; pageNum++) {
            const { data } = await userApi.list({
              pageNum,
              pageSize: 100,
              role: 'CUSTOMER',
              status: true,
            })
            if (current !== session) return []
            if (data.pageNum !== pageNum || !Number.isInteger(data.totalPage) || data.totalPage < 0)
              throw new Error('分页异常')
            all.push(...data.list)
            if (pageNum >= data.totalPage) break
            if (!data.list.length) throw new Error('分页异常')
          }
          return all
        })(),
      ])
      planOptions = results[0].data
      customerOptions = results[1]
    }
    if (current !== session) return
    employees.value = collected
    users.value = customerOptions
    plans.value = planOptions
  } catch {
    if (current === session) optionsError.value = true
  } finally {
    if (current === session) optionsLoading.value = false
  }
}
watch(
  () => [props.modelValue, props.mode],
  () => {
    session++
    if (!props.modelValue) return
    const p = props.project
    Object.assign(form, {
      name: p?.name || '',
      customerName: p?.customerName || '',
      mobile: p?.mobile || '',
      serviceAddress: p?.serviceAddress || '',
      remark: p?.remark || '',
      employeeId: null,
      userId: null,
      planId: null,
      status: p?.status || 'PENDING_CONFIRM',
      content: '',
      contractAmount: p?.quotedAmount ?? '',
      nextFollowAt: null,
    })
    employees.value = []
    users.value = []
    plans.value = []
    optionsError.value = false
    optionsLoading.value = false
    formRef.value?.clearValidate()
    if (['create', 'assign'].includes(props.mode)) void loadOptions()
  },
)
function chooseUser(id: number) {
  const user = users.value.find((item) => item.id === id)
  if (user) {
    form.customerName = user.realName || user.nickname || ''
    form.mobile = user.mobile
  }
}
async function submit() {
  if (saving.value) return
  saving.value = true
  try {
    if (!(await formRef.value?.validate().catch(() => false))) return
    const p = props.project
    const base = {
      name: form.name.trim(),
      customerName: form.customerName.trim(),
      mobile: form.mobile.trim(),
      serviceAddress: form.serviceAddress.trim(),
      remark: form.remark.trim(),
    }
    if (props.mode === 'create') {
      await projectApi.create({
        ...base,
        employeeId: form.employeeId || null,
        userId: form.userId || null,
        planId: form.planId || null,
      })
    } else if (p) {
      if (props.mode === 'edit') await projectApi.update(p.id, base)
      else if (props.mode === 'assign') {
        if (
          optionsLoading.value ||
          optionsError.value ||
          !employees.value.some((e) => e.id === form.employeeId) ||
          form.employeeId === p.employeeId
        ) {
          ElMessage.warning('请选择有效且不同于当前负责人的员工')
          return
        }
        await projectApi.assign(p.id, form.employeeId!)
      } else if (props.mode === 'follow-up') {
        if (!p.employeeId) {
          ElMessage.warning('请先分配负责人')
          return
        }
        await projectApi.followUp(p.id, {
          employeeId: p.employeeId,
          content: form.content.trim(),
          nextFollowAt: form.nextFollowAt?.toISOString() ?? null,
        })
      } else {
        if (!allowedStatuses.value.includes(form.status)) return
        if (confirming.value && !p.items.length) {
          ElMessage.warning('请先保存报价明细')
          return
        }
        await projectApi.progress(p.id, {
          status: form.status,
          content: form.content.trim(),
          ...(confirming.value
            ? { quoteVersion: p.quoteVersion, contractAmount: form.contractAmount.trim() }
            : {}),
        })
      }
    } else return
    ElMessage.success('保存成功')
    emit('update:modelValue', false)
    emit('saved')
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      emit('update:modelValue', false)
      emit('conflict')
      ElMessage.warning('项目已发生变化，正在刷新详情，请重新操作')
    }
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <el-dialog
    :model-value="modelValue"
    :title="titles[mode]"
    width="min(94vw, 600px)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-alert v-if="optionsError" title="选项加载失败，请重试" type="error" :closable="false"
      ><el-button link @click="loadOptions">重新加载</el-button></el-alert
    >
    <el-form ref="formRef" :model="form" :rules="rules" :disabled="saving" label-width="100px">
      <template v-if="mode === 'create' || mode === 'edit'">
        <el-form-item v-if="mode === 'create'" label="关联客户"
          ><el-select
            v-model="form.userId"
            clearable
            filterable
            :loading="optionsLoading"
            :disabled="optionsLoading || optionsError"
            placeholder="可选"
            @change="chooseUser"
            ><el-option
              v-for="user in users"
              :key="user.id"
              :value="user.id"
              :label="`${user.realName || user.nickname || user.userNo}（${user.mobile}）`" /></el-select
        ></el-form-item>
        <el-form-item label="项目名称" prop="name"
          ><el-input v-model="form.name" maxlength="191" /></el-form-item
        ><el-form-item label="客户姓名" prop="customerName"
          ><el-input v-model="form.customerName" maxlength="191" /></el-form-item
        ><el-form-item label="手机号" prop="mobile"
          ><el-input v-model="form.mobile" maxlength="11" /></el-form-item
        ><el-form-item label="服务地址"
          ><el-input v-model="form.serviceAddress" maxlength="191"
        /></el-form-item>
        <el-form-item v-if="mode === 'create'" label="装修方案"
          ><el-select
            v-model="form.planId"
            clearable
            filterable
            :loading="optionsLoading"
            :disabled="optionsLoading || optionsError"
            placeholder="可选"
            ><el-option
              v-for="plan in plans"
              :key="plan.id"
              :value="plan.id"
              :label="plan.name" /></el-select
        ></el-form-item>
        <el-form-item label="备注"
          ><el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            maxlength="5000"
            show-word-limit
        /></el-form-item>
      </template>
      <el-form-item
        v-if="mode === 'create' || mode === 'assign'"
        label="负责人"
        :prop="mode === 'assign' ? 'employeeId' : undefined"
        ><el-select
          v-model="form.employeeId"
          filterable
          :clearable="mode === 'create'"
          :loading="optionsLoading"
          :disabled="optionsLoading || optionsError"
          placeholder="请选择在职员工"
          ><el-option
            v-for="employee in employees"
            :key="employee.id"
            :value="employee.id"
            :disabled="mode === 'assign' && employee.id === project?.employeeId"
            :label="`${employee.user.realName || employee.user.nickname || employee.employeeNo}（${employee.employeeNo}）`" /></el-select
      ></el-form-item>
      <template v-if="mode === 'progress'">
        <el-form-item label="项目状态"
          ><el-select v-model="form.status"
            ><el-option
              v-for="status in allowedStatuses"
              :key="status"
              :value="status"
              :label="projectStatuses[status]" /></el-select
        ></el-form-item>
        <el-alert
          v-if="confirming"
          title="请确认客户已确认报价及合同；合同金额保存后不可修改。"
          type="warning"
          :closable="false"
        />
        <el-form-item v-if="confirming" label="合同金额" prop="contractAmount"
          ><el-input v-model="form.contractAmount" placeholder="单位：元"
        /></el-form-item>
      </template>
      <template v-if="mode === 'progress' || mode === 'follow-up'">
        <el-form-item v-if="mode === 'follow-up'" label="跟进负责人">{{
          project?.employeeName || '未分配'
        }}</el-form-item>
        <el-form-item :label="mode === 'progress' ? '进度说明' : '跟进内容'" prop="content"
          ><el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            maxlength="5000"
            show-word-limit
        /></el-form-item>
        <el-form-item v-if="mode === 'follow-up'" label="下次跟进"
          ><el-date-picker v-model="form.nextFollowAt" type="datetime" placeholder="可选"
        /></el-form-item>
      </template>
    </el-form>
    <template #footer
      ><el-button :disabled="saving" @click="emit('update:modelValue', false)">取消</el-button
      ><el-button
        type="primary"
        :loading="saving"
        :disabled="mode === 'assign' && (optionsLoading || optionsError)"
        @click="submit"
        >保存</el-button
      ></template
    >
  </el-dialog>
</template>
<style scoped>
.el-select,
.el-date-editor {
  width: 100%;
}
.el-alert {
  margin-bottom: 18px;
}
</style>
