<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { orderApi } from '@/api/orders'
import type { ArrangeInstallationParams, ProductOrder } from '@/types/order'

const visible = defineModel<boolean>({ required: true })
const props = defineProps<{ order?: ProductOrder }>()
const emit = defineEmits<{ saved: [orderId: number] }>()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const emptyForm = (): ArrangeInstallationParams => ({
  installerName: '',
  installerPhone: '',
  remark: '',
})
const form = reactive(emptyForm())
// 用户下单时确定的日期和时段仅作展示，不参与后台提交。
const appointmentTimeLabel = computed(() => {
  const order = props.order
  const value = order?.appointmentDate ?? order?.installation?.appointmentDate
  const date = value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '未提供预约日期'
  const timeSlot =
    order?.timeSlot?.trim() || order?.installation?.timeSlot?.trim() || '未提供预约时段'
  return `${date} ${timeSlot}`
})
const rules: FormRules<ArrangeInstallationParams> = {
  installerName: [
    { required: true, whitespace: true, message: '请输入安装人员或施工团队', trigger: 'blur' },
  ],
  installerPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    {
      pattern: /^(?:1\d{10}|0\d{2,3}-?\d{7,8}(?:-\d{1,6})?)$/,
      message: '请输入有效的手机号或带区号的固定电话',
      trigger: 'blur',
    },
  ],
}
watch(
  () => [visible.value, props.order] as const,
  async ([open]) => {
    if (!open) return
    Object.assign(form, emptyForm())
    await nextTick()
    formRef.value?.clearValidate()
  },
)
const submit = async () => {
  if (submitting.value || !props.order || !formRef.value) return
  if (props.order.status !== 'PENDING_INSTALLATION') {
    ElMessage.warning('仅待安装订单可以安排安装，请刷新列表后重试')
    return
  }
  submitting.value = true
  try {
    form.installerName = form.installerName.trim()
    form.installerPhone = form.installerPhone.trim()
    form.remark = form.remark?.trim() || ''
    if (!(await formRef.value.validate().catch(() => false))) return
    const orderId = props.order.id
    await orderApi.arrangeInstallation(orderId, { ...form })
    ElMessage.success('安装安排成功')
    visible.value = false
    emit('saved', orderId)
  } catch {
    // 接口错误由请求封装提示，保留已填内容供用户重试。
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="安排安装"
    width="min(580px, 94vw)"
    :close-on-click-modal="false"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    destroy-on-close
  >
    <div v-if="order" class="order-summary">
      <div><span>订单号</span>{{ order.orderNo }}</div>
      <div><span>客户</span>{{ order.contactName }} · {{ order.contactPhone }}</div>
      <div><span>安装地址</span>{{ order.serviceAddress }}</div>
      <div><span>预约时间</span>{{ appointmentTimeLabel }}</div>
    </div>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      :disabled="submitting"
      @submit.prevent="submit"
    >
      <el-form-item label="安装人员 / 施工团队" prop="installerName">
        <el-input
          v-model="form.installerName"
          maxlength="100"
          placeholder="请输入安装人员姓名或施工团队名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="联系电话" prop="installerPhone">
        <el-input
          v-model="form.installerPhone"
          maxlength="25"
          placeholder="手机号或带区号的固定电话"
          clearable
        />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="选填，如安装注意事项、客户特殊要求"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">关闭</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确认安排</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.order-summary {
  margin-bottom: 20px;
  padding: 14px 16px;
  background: #faf8f6;
  border: 1px solid var(--jfx-border);
  border-radius: 8px;
  font-size: 13px;
  overflow-wrap: anywhere;
  div + div {
    margin-top: 8px;
  }
  span {
    display: inline-block;
    min-width: 70px;
    color: var(--jfx-muted);
  }
}
</style>
