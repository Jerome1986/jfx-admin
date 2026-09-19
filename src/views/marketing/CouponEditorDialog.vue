<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { couponApi } from '@/api/coupons'
import { couponScopes, couponStatuses, type CouponInput } from '@/types/coupon'

const props = defineProps<{ modelValue: boolean; couponId?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()
const defaults = () => ({
  name: '',
  amount: 1,
  threshold: 0,
  scopeType: 'ALL' as CouponInput['scopeType'],
  validFrom: '',
  validTo: '',
  totalQuantity: 1,
  perUserLimit: 1,
  status: 'DRAFT' as CouponInput['status'],
})
const form = reactive(defaults())
const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const loadError = ref('')
const maxInt = 2147483647
let loadVersion = 0
const rules: FormRules = {
  name: [{ required: true, whitespace: true, message: '请输入优惠券名称', trigger: 'blur' }],
  scopeType: [
    {
      required: true,
      type: 'enum',
      enum: couponScopes.map((item) => item.value),
      message: '请选择全部、装修或商品',
      trigger: 'change',
    },
  ],
  validFrom: [{ required: true, message: '请选择有效期开始时间', trigger: 'change' }],
  validTo: [
    {
      validator: (_rule, value, callback) => {
        if (!value || !Number.isFinite(Date.parse(value)))
          return callback(new Error('请选择有效期结束时间'))
        if (Date.parse(value) <= Date.parse(form.validFrom))
          return callback(new Error('结束时间必须晚于开始时间'))
        callback()
      },
      trigger: 'change',
    },
  ],
  status: [
    {
      required: true,
      type: 'enum',
      enum: couponStatuses.map((item) => item.value),
      message: '请选择草稿、已发布或已停用',
      trigger: 'change',
    },
  ],
}
for (const [field, label, min, max, integer] of [
  ['amount', '优惠券面额', 0.01, 99999999.99, false],
  ['threshold', '使用门槛', 0, 99999999.99, false],
  ['totalQuantity', '发行总量', 1, maxInt, true],
  ['perUserLimit', '每人限领', 1, maxInt, true],
] as const) {
  rules[field] = [
    {
      validator: (_rule, value, callback) => {
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < min ||
          value > max ||
          (integer
            ? !Number.isInteger(value)
            : Math.abs(value * 100 - Math.round(value * 100)) > 0.00001)
        )
          return callback(
            new Error(
              `${label}须为${min}至${max}之间的${integer ? '整数' : '数字（最多两位小数）'}`,
            ),
          )
        callback()
      },
      trigger: 'change',
    },
  ]
}
watch(
  () => [props.modelValue, props.couponId] as const,
  async ([visible, id]) => {
    const version = ++loadVersion
    if (!visible) return
    Object.assign(form, defaults())
    loadError.value = ''
    loading.value = id !== undefined
    await nextTick()
    formRef.value?.clearValidate()
    if (id === undefined) return
    try {
      const { data } = await couponApi.detail(id)
      if (version !== loadVersion) return
      if (!data || typeof data !== 'object' || data.id !== id || !data.validFrom || !data.validTo)
        throw new Error('详情接口尚未返回有效的优惠券数据，暂时无法编辑')
      Object.assign(form, {
        name: data.name,
        amount: Number(data.amount),
        threshold: Number(data.threshold),
        scopeType: data.scopeType,
        validFrom: data.validFrom,
        validTo: data.validTo,
        totalQuantity: data.totalQuantity,
        perUserLimit: data.perUserLimit,
        status: data.status,
      })
    } catch (error) {
      if (version === loadVersion)
        loadError.value = error instanceof Error ? error.message : '加载详情失败，请重试'
    } finally {
      if (version === loadVersion) loading.value = false
    }
  },
)
const close = () => {
  if (!submitting.value) emit('update:modelValue', false)
}
const submit = async () => {
  if (submitting.value || loading.value || loadError.value) return
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
    const payload: CouponInput = {
      name: form.name.trim(),
      amount: form.amount,
      threshold: form.threshold,
      scopeType: form.scopeType,
      validFrom: new Date(form.validFrom).toISOString(),
      validTo: new Date(form.validTo).toISOString(),
      totalQuantity: form.totalQuantity,
      perUserLimit: form.perUserLimit,
      status: form.status,
    }
    if (props.couponId === undefined) await couponApi.create(payload)
    else await couponApi.update(props.couponId, payload)
    ElMessage.success(props.couponId === undefined ? '优惠券模板已新增' : '优惠券模板已更新')
    emit('update:modelValue', false)
    emit('saved')
  } catch {
    // 请求封装统一提示接口错误，保留表单以便重试。
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="couponId === undefined ? '新增优惠券模板' : '编辑优惠券模板'"
    width="720px"
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    @update:model-value="close"
  >
    <el-alert v-if="loadError" :title="loadError" type="error" :closable="false" />
    <el-form
      v-else
      ref="formRef"
      v-loading="loading"
      :model="form"
      :rules="rules"
      :disabled="loading || submitting"
      label-width="110px"
    >
      <el-form-item label="优惠券名称" prop="name"
        ><el-input v-model="form.name" placeholder="请输入优惠券名称"
      /></el-form-item>
      <div class="form-grid">
        <el-form-item label="面额（元）" prop="amount"
          ><el-input-number v-model="form.amount" :min="0.01" :max="99999999.99" :precision="2"
        /></el-form-item>
        <el-form-item label="门槛（元）" prop="threshold"
          ><el-input-number
            v-model="form.threshold"
            :min="0"
            :max="99999999.99"
            :precision="2"
          /><span class="hint">0 表示无门槛</span></el-form-item
        >
      </div>
      <el-form-item label="适用范围类型" prop="scopeType">
        <el-select v-model="form.scopeType" placeholder="请选择适用范围">
          <el-option
            v-for="item in couponScopes"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="有效期开始" prop="validFrom"
        ><el-date-picker
          v-model="form.validFrom"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ssZ"
          placeholder="请选择开始时间"
      /></el-form-item>
      <el-form-item label="有效期结束" prop="validTo"
        ><el-date-picker
          v-model="form.validTo"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ssZ"
          placeholder="请选择结束时间"
      /></el-form-item>
      <div class="form-grid">
        <el-form-item label="发行总量" prop="totalQuantity"
          ><el-input-number v-model="form.totalQuantity" :min="1" :max="maxInt" :precision="0"
        /></el-form-item>
        <el-form-item label="每人限领" prop="perUserLimit"
          ><el-input-number v-model="form.perUserLimit" :min="1" :max="maxInt" :precision="0"
        /></el-form-item>
      </div>
      <el-form-item label="模板状态" prop="status"
        ><el-select v-model="form.status"
          ><el-option
            v-for="item in couponStatuses"
            :key="item.value"
            :label="item.label"
            :value="item.value" /></el-select
      ></el-form-item>
    </el-form>
    <template #footer
      ><el-button :disabled="submitting" @click="close">取消</el-button
      ><el-button
        type="primary"
        :loading="submitting"
        :disabled="loading || !!loadError"
        @click="submit"
        >保存</el-button
      ></template
    >
  </el-dialog>
</template>

<style scoped lang="scss">
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}
.el-input-number,
.el-select {
  width: 100%;
}
.hint {
  display: block;
  width: 100%;
  color: var(--jfx-muted);
  font-size: 12px;
}
@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
