<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { appointmentApi } from '@/api/appointments'
import { employeeApi } from '@/api/employees'
import type { AppointmentActionMode, AppointmentListItem } from '@/types/appointment'
import type { Employee } from '@/types/employee'

// 接收父组件传入的属性。
const props = defineProps<{
  modelValue: boolean
  mode: AppointmentActionMode
  appointment?: AppointmentListItem
}>()

// 定义组件向父组件发送的事件。
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [appointmentId: number]
}>()

// 引用表单实例，用于校验和重置。
const formRef = ref<FormInstance>()
// 标记员工选项是否正在加载。
const employeeLoading = ref(false)
// 保存员工列表加载失败的提示，供用户重试。
const employeeError = ref('')
// 区分不同弹窗会话的员工请求，避免旧响应覆盖新选项。
let employeeRequestId = 0
// 标记表单是否正在提交。
const submitting = ref(false)
// 保存可选择的员工列表。
const employees = ref<Employee[]>([])
// 保存表单编辑数据。
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

// 定义各预约操作对应的弹窗标题。
const titles: Record<AppointmentActionMode, string> = {
  create: '代客录入预约',
  assign: '分配负责人',
  'follow-up': '新增跟进',
  visit: '安排上门',
  status: '更新预约状态',
  cancel: '取消预约',
  convert: '转为装修项目',
}

// 根据当前操作类型计算弹窗标题。
const title = computed(() =>
  props.mode === 'assign' && props.appointment?.employeeId != null
    ? '改派负责人'
    : titles[props.mode],
)
// 优先展示负责人真实姓名，缺失时回退到员工编号或标识。
const assigneeLabel = computed(() =>
  props.appointment?.employeeId == null
    ? '未分配'
    : props.appointment.employee?.user?.realName ||
      props.appointment.employee?.employeeNo ||
      `员工 ID：${props.appointment.employeeId}`,
)
// 定义表单字段校验规则。
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
    return {
      content: [{ required: true, whitespace: true, message: '请输入跟进内容', trigger: 'blur' }],
    }
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

// 将表单恢复为初始数据。
const resetForm = () => {
  Object.assign(form, {
    customerName: props.appointment?.customerName || props.appointment?.user?.realName || '',
    mobile: props.appointment?.mobile || '',
    type: props.appointment?.type || 'BUDGET',
    source: props.mode === 'create' ? '后台录入' : props.appointment?.source || '',
    demand: props.appointment?.demand || '',
    employeeId: props.mode === 'assign' ? undefined : (props.appointment?.employeeId ?? undefined),
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

// 加载可分配的在职员工。
const loadEmployees = async () => {
  // 记录本次请求所属的弹窗会话。
  const requestId = ++employeeRequestId
  employeeLoading.value = true
  employeeError.value = ''
  employees.value = []
  try {
    // 汇总全部分页后一次性展示，避免选择到不完整的结果。
    const collected = new Map<number, Employee>()
    // 保存当前请求页码。
    let pageNum = 1
    do {
      // 获取本页在职员工及分页信息。
      const { data } = await employeeApi.list({ pageNum, pageSize: 100, status: true })
      if (requestId !== employeeRequestId) return
      if (!Number.isInteger(data.totalPage) || data.totalPage < 0 || data.pageNum !== pageNum) {
        throw new Error('员工分页数据异常，请重试')
      }
      data.list.filter((item) => item.status).forEach((item) => collected.set(item.id, item))
      if (pageNum >= data.totalPage) break
      if (!data.list.length || data.pageNum !== pageNum) throw new Error('员工分页数据异常，请重试')
      pageNum++
    } while (true)
    employees.value = [...collected.values()]
  } catch (error) {
    if (requestId !== employeeRequestId) return
    employees.value = []
    employeeError.value = error instanceof Error ? error.message : '员工加载失败，请重试'
  } finally {
    if (requestId === employeeRequestId) employeeLoading.value = false
  }
}

// 弹窗打开或编辑对象变更时初始化表单。
watch(
  () => [props.modelValue, props.mode, props.appointment?.id] as const,
  ([visible]) => {
    employeeRequestId++
    employeeLoading.value = false
    employeeError.value = ''
    if (!visible) return
    resetForm()
    if (props.mode === 'assign') loadEmployees()
  },
)

// 获取员工的显示姓名。
const employeeName = (employee: Employee) =>
  employee.user?.realName || employee.user?.nickname || employee.employeeNo

// 校验表单并提交保存。
const submit = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    if (!(await formRef.value?.validate().catch(() => false))) return
    if (props.mode !== 'assign' && props.mode !== 'follow-up') {
      ElMessage.warning('该操作接口待后端对接，本次填写的数据未保存')
      return
    }
    // 固定本次操作的预约，避免异步请求期间对象切换。
    const appointment = props.appointment
    if (!appointment) return
    if (props.mode === 'assign') {
      if (employeeLoading.value || employeeError.value) {
        ElMessage.warning('请先成功加载员工列表')
        return
      }
      if (!employees.value.some((item) => item.id === form.employeeId && item.status)) {
        ElMessage.warning('请选择在职员工')
        return
      }
      if (form.employeeId == null || form.employeeId === appointment.employeeId) {
        ElMessage.warning('请选择不同于当前负责人的员工')
        return
      }
      console.log('负责人ID', form.employeeId)

      await appointmentApi.assign(appointment.id, { employeeId: form.employeeId })
      ElMessage.success(appointment.employeeId == null ? '负责人已分配' : '负责人已改派')
    } else {
      if (appointment.employeeId == null) {
        ElMessage.warning('请先分配负责人，再添加跟进')
        return
      }
      await appointmentApi.createFollowUp(appointment.id, {
        content: form.content.trim(),
        nextFollowAt: form.nextFollowAt?.toISOString() ?? null,
        employeeId: appointment.employeeId,
      })
      ElMessage.success('跟进记录已添加')
    }
    emit('update:modelValue', false)
    emit('saved', appointment.id)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog :model-value="modelValue" :title="title" width="520px" destroy-on-close :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting" :show-close="!submitting"
    @update:model-value="emit('update:modelValue', $event)">
    <el-alert v-if="mode !== 'follow-up' && mode !== 'assign'" title="当前为业务表单预留，提交不会保存数据" type="warning"
      :closable="false" show-icon />
    <el-form ref="formRef" :model="form" :rules="rules" :disabled="submitting" label-width="92px" class="action-form">
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

      <template v-else-if="mode === 'assign'">
        <el-form-item v-if="appointment?.employeeId != null" label="当前负责人">{{ assigneeLabel }}</el-form-item>
        <el-alert v-if="employeeError" :title="employeeError" type="error" :closable="false" show-icon>
          <el-button link type="primary" @click="loadEmployees">重新加载</el-button>
        </el-alert>
        <el-form-item label="负责人" prop="employeeId">
          <el-select v-model="form.employeeId" filterable :loading="employeeLoading" placeholder="请选择在职员工">
            <el-option v-for="employee in employees" :key="employee.id"
              :disabled="employee.id === appointment?.employeeId"
              :label="`${employeeName(employee)}（${employee.employeeNo}）`" :value="employee.id" />
          </el-select>
        </el-form-item>
      </template>

      <template v-else-if="mode === 'follow-up'">
        <el-form-item label="跟进负责人">
          <span>{{ assigneeLabel }}</span>
        </el-form-item>
        <el-form-item label="跟进内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入本次沟通情况" />
        </el-form-item>
        <el-form-item label="下次跟进">
          <el-date-picker v-model="form.nextFollowAt" type="datetime" placeholder="可选" />
        </el-form-item>
      </template>

      <template v-else-if="mode === 'visit'">
        <el-form-item label="上门日期" prop="visitDate">
          <el-date-picker v-model="form.visitDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择日期" />
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
      <el-button :disabled="submitting" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting"
        :disabled="(mode === 'assign' && (employeeLoading || !!employeeError)) || (mode === 'follow-up' && appointment?.employeeId == null)"
        @click="submit">提交</el-button>
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
