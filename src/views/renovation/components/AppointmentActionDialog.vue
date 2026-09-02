<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { appointmentApi } from '@/api/appointments'
import { employeeApi } from '@/api/employees'
import type { AppointmentActionMode, AppointmentListItem } from '@/types/appointment'
import type { Employee } from '@/types/employee'

const props = defineProps<{
  modelValue: boolean
  mode: AppointmentActionMode
  appointment?: AppointmentListItem
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [appointmentId: number]
}>()

const formRef = ref<FormInstance>()
const employeeLoading = ref(false)
const submitting = ref(false)
const employees = ref<Employee[]>([])
const form = reactive({
  customerName: '',
  mobile: '',
  type: 'BUDGET',
  source: '后台录入',
  demand: '',
  employeeId: undefined as number | undefined,
  content: '',
  nextFollowAt: undefined as Date | undefined,
  visitDate: '',
  timeSlot: '',
  visitAddress: '',
  status: 'PENDING_CONTACT',
  remark: '',
  reason: '',
  projectName: '',
})

const titles: Record<AppointmentActionMode, string> = {
  create: '代客录入预约',
  assign: '分配负责人',
  'follow-up': '新增跟进',
  visit: '安排上门',
  status: '更新预约状态',
  cancel: '取消预约',
  convert: '转为装修项目',
}

const title = computed(() => titles[props.mode])
const rules = computed<FormRules>(() => {
  if (props.mode === 'create') {
    return {
      customerName: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
      mobile: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1\d{10}$/, message: '请输入正确的手机号', trigger: 'blur' },
      ],
      type: [{ required: true, message: '请选择预约类型', trigger: 'change' }],
      source: [{ required: true, message: '请输入预约来源', trigger: 'blur' }],
    }
  }
  if (props.mode === 'assign')
    return { employeeId: [{ required: true, message: '请选择负责人', trigger: 'change' }] }
  if (props.mode === 'follow-up')
    return { content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }] }
  if (props.mode === 'visit') {
    return {
      visitDate: [{ required: true, message: '请选择上门日期', trigger: 'change' }],
      timeSlot: [{ required: true, message: '请选择预约时段', trigger: 'change' }],
      visitAddress: [{ required: true, message: '请输入上门地址', trigger: 'blur' }],
    }
  }
  if (props.mode === 'status')
    return { status: [{ required: true, message: '请选择预约状态', trigger: 'change' }] }
  if (props.mode === 'cancel')
    return { reason: [{ required: true, message: '请输入取消原因', trigger: 'blur' }] }
  return { projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }] }
})

const resetForm = () => {
  Object.assign(form, {
    customerName: props.appointment?.customerName || props.appointment?.user?.realName || '',
    mobile: props.appointment?.mobile || '',
    type: props.appointment?.type || 'BUDGET',
    source: props.mode === 'create' ? '后台录入' : props.appointment?.source || '',
    demand: props.appointment?.demand || '',
    employeeId: props.appointment?.employeeId ?? undefined,
    content: '',
    nextFollowAt: undefined,
    visitDate: props.appointment?.visitDate?.slice(0, 10) || '',
    timeSlot: props.appointment?.timeSlot || '',
    visitAddress: props.appointment?.visitAddress || '',
    status: props.appointment?.status || 'PENDING_CONTACT',
    remark: '',
    reason: '',
    projectName: props.appointment ? `${props.appointment.customerName || '客户'}装修项目` : '',
  })
  formRef.value?.clearValidate()
}

const loadEmployees = async () => {
  employeeLoading.value = true
  try {
    const { data } = await employeeApi.list({ pageNum: 1, pageSize: 100, status: true })
    employees.value = data.list.filter((item) => item.status)
  } catch {
    employees.value = []
  } finally {
    employeeLoading.value = false
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    resetForm()
    if (props.mode === 'assign' || props.mode === 'follow-up') loadEmployees()
  },
)

const employeeName = (employee: Employee) =>
  employee.user?.realName || employee.user?.nickname || employee.employeeNo

const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  if (props.mode === 'follow-up') {
    if (!props.appointment) return
    submitting.value = true
    try {
      await appointmentApi.createFollowUp(props.appointment.id, {
        content: form.content.trim(),
        nextFollowAt: form.nextFollowAt?.toISOString() ?? null,
        employeeId: form.employeeId ?? null,
      })
      ElMessage.success('跟进记录已添加')
      emit('update:modelValue', false)
      emit('saved', props.appointment.id)
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '新增跟进失败，请稍后重试')
    } finally {
      submitting.value = false
    }
    return
  }
  ElMessage.warning('该操作接口待后端对接，本次填写的数据未保存')
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="520px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-alert
      v-if="mode !== 'follow-up'"
      title="当前为业务表单预留，提交不会保存数据"
      type="warning"
      :closable="false"
      show-icon
    />
    <el-form ref="formRef" :model="form" :rules="rules" label-width="92px" class="action-form">
      <template v-if="mode === 'create'">
        <el-form-item label="客户姓名" prop="customerName">
          <el-input v-model="form.customerName" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" maxlength="11" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="预约类型" prop="type">
          <el-select v-model="form.type">
            <el-option label="装修预算" value="BUDGET" />
            <el-option label="免费量房" value="MEASURE" />
            <el-option label="房屋报价" value="QUOTE" />
            <el-option label="焕新方案预约" value="PLAN" />
            <el-option label="同款案例报价" value="CASE" />
            <el-option label="网点咨询" value="OUTLET" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源" prop="source">
          <el-input v-model="form.source" />
        </el-form-item>
        <el-form-item label="装修需求">
          <el-input v-model="form.demand" type="textarea" :rows="3" />
        </el-form-item>
      </template>

      <el-form-item v-else-if="mode === 'assign'" label="负责人" prop="employeeId">
        <el-select
          v-model="form.employeeId"
          filterable
          :loading="employeeLoading"
          placeholder="请选择在职员工"
        >
          <el-option
            v-for="employee in employees"
            :key="employee.id"
            :label="`${employeeName(employee)}（${employee.employeeNo}）`"
            :value="employee.id"
          />
        </el-select>
      </el-form-item>

      <template v-else-if="mode === 'follow-up'">
        <el-form-item label="跟进负责人">
          <el-select
            v-model="form.employeeId"
            clearable
            filterable
            :loading="employeeLoading"
            placeholder="可选，默认当前负责人"
          >
            <el-option
              v-for="employee in employees"
              :key="employee.id"
              :label="`${employeeName(employee)}（${employee.employeeNo}）`"
              :value="employee.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入本次沟通情况"
          />
        </el-form-item>
        <el-form-item label="下次跟进">
          <el-date-picker v-model="form.nextFollowAt" type="datetime" placeholder="可选" />
        </el-form-item>
      </template>

      <template v-else-if="mode === 'visit'">
        <el-form-item label="上门日期" prop="visitDate">
          <el-date-picker
            v-model="form.visitDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
          />
        </el-form-item>
        <el-form-item label="预约时段" prop="timeSlot">
          <el-select v-model="form.timeSlot" placeholder="请选择时段">
            <el-option label="上午" value="上午" />
            <el-option label="下午" value="下午" />
            <el-option label="晚上" value="晚上" />
          </el-select>
        </el-form-item>
        <el-form-item label="上门地址" prop="visitAddress">
          <el-input v-model="form.visitAddress" placeholder="请输入详细地址" />
        </el-form-item>
      </template>

      <template v-else-if="mode === 'status'">
        <el-form-item label="预约状态" prop="status">
          <el-select v-model="form.status">
            <el-option label="待联系" value="PENDING_CONTACT" />
            <el-option label="待上门" value="PENDING_VISIT" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELED" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </template>

      <el-form-item v-else-if="mode === 'cancel'" label="取消原因" prop="reason">
        <el-input v-model="form.reason" type="textarea" :rows="4" placeholder="请输入取消原因" />
      </el-form-item>

      <template v-else>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">提交</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.action-form {
  margin-top: 20px;

  .el-select,
  .el-date-editor {
    width: 100%;
  }
}
</style>
