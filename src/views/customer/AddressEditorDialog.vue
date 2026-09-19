<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { addressApi } from '@/api/addresses'
import type { AddressInput, ServiceAddress, UpdateAddressInput } from '@/types/address'

// 接收父组件传入的属性。
const props = defineProps<{
  modelValue: boolean
  addressId?: number
  address?: ServiceAddress
}>()
// 定义组件向父组件发送的事件。
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()
type AddressForm = Omit<AddressInput, 'userId' | 'latitude' | 'longitude'>

// 创建空白表单及默认值。
const emptyForm = (): AddressForm => ({
  contactName: '',
  phone: '',
  locationName: '',
  province: '',
  city: '',
  district: '',
  address: '',
  doorplate: '',
  isDefault: false,
  isEnabled: true,
})
// 引用表单实例，用于校验和重置。
const formRef = ref<FormInstance>()
// 保存表单编辑数据。
const form = reactive<AddressForm>(emptyForm())
// 标记数据是否正在加载。
const loading = ref(false)
// 标记表单是否正在提交。
const submitting = ref(false)
// 定义表单字段校验规则。
const rules: FormRules<AddressForm> = {
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
  locationName: [{ required: true, message: '请输入地点名称', trigger: 'blur' }],
  province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  district: [{ required: true, message: '请输入区县', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
}
// 通知父组件关闭当前弹窗。
const close = () => emit('update:modelValue', false)
// 将异常转换为可展示的错误消息。
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'

// 从完整地址中识别并填写行政区划。
const fillRegionFromAddress = () => {
  // 保存去除首尾空格后的地址文本。
  const text = form.address.trim()
  if (!text) return

  // 提取地址中的省级行政区。
  const province = text.match(/^(.+?(?:省|自治区|特别行政区))/)?.[1]
  // 保存移除省级名称后的地址文本。
  const afterProvince = province ? text.slice(province.length) : text
  // 识别地址中的直辖市名称。
  const municipality = text.match(/^(北京市|天津市|上海市|重庆市)/)?.[1]
  // 提取地址中的城市名称。
  const city = municipality ?? afterProvince.match(/^(.+?市)/)?.[1]
  // 保存移除城市名称后的地址文本。
  const afterCity =
    city && afterProvince.startsWith(city) ? afterProvince.slice(city.length) : afterProvince
  // 提取地址中的区县名称。
  const district = afterCity.match(/^(.+?(?:区|县|旗))/)?.[1]

  if (!form.province) form.province = province ?? municipality ?? ''
  if (!form.city) form.city = city ?? ''
  if (!form.district) form.district = district ?? ''

  // 保存待移除行政区划的详细地址。
  let streetAddress = text
  // 逐一移除省市区前缀，保留详细街道地址。
  for (const region of [form.province, form.city, form.district]) {
    if (region && streetAddress.startsWith(region)) {
      streetAddress = streetAddress.slice(region.length)
    }
  }
  form.address = streetAddress
}

// 初始化表单并按需加载地址详情。
const prepare = async () => {
  Object.assign(form, emptyForm())
  if (props.address) {
    // 从地址详情中提取可编辑字段。
    const {
      userId: _userId,
      latitude: _latitude,
      longitude: _longitude,
      ...editableAddress
    } = props.address
    Object.assign(form, editableAddress)
    fillRegionFromAddress()
  }
  if (props.addressId) {
    loading.value = true
    try {
      // 获取接口返回的业务数据。
      const { data } = await addressApi.detail(props.addressId)
      // 从地址详情中提取可编辑字段。
      const {
        userId: _userId,
        latitude: _latitude,
        longitude: _longitude,
        ...editableAddress
      } = data
      Object.assign(
        form,
        Object.fromEntries(
          Object.entries(editableAddress).filter(
            ([, value]) => value !== null && value !== undefined && value !== '',
          ),
        ),
      )
      fillRegionFromAddress()
    } catch (error) {
      ElMessage.error(messageOf(error))
      close()
    } finally {
      loading.value = false
    }
  }
  await nextTick()
  formRef.value?.clearValidate()
}
// 弹窗打开或编辑对象变更时初始化表单。
watch(
  () => [props.modelValue, props.addressId, props.address] as const,
  ([visible]) => {
    if (visible) prepare()
  },
)

// 校验表单并提交保存。
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
    // 组装待提交的地址修改数据。
    const data: UpdateAddressInput = {
      ...form,
      contactName: form.contactName.trim(),
      phone: form.phone.trim(),
      locationName: form.locationName.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      address: form.address.trim(),
      doorplate: form.doorplate.trim(),
    }
    if (!props.addressId) return
    await addressApi.update(props.addressId, data)
    ElMessage.success('地址已更新')
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
    title="编辑服务地址"
    width="760px"
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-width="88px">
      <div class="form-grid">
        <el-form-item label="联系人" prop="contactName"
          ><el-input v-model="form.contactName" maxlength="30" placeholder="请输入联系人姓名"
        /></el-form-item>
        <el-form-item label="手机号" prop="phone"
          ><el-input v-model="form.phone" maxlength="11" placeholder="请输入手机号码"
        /></el-form-item>
        <el-form-item label="地点名称" prop="locationName"
          ><el-input v-model="form.locationName" placeholder="如：万达广场"
        /></el-form-item>
        <el-form-item label="省份" prop="province"
          ><el-input v-model="form.province"
        /></el-form-item>
        <el-form-item label="城市" prop="city"><el-input v-model="form.city" /></el-form-item>
        <el-form-item label="区县" prop="district"
          ><el-input v-model="form.district"
        /></el-form-item>
        <el-form-item label="门牌号"
          ><el-input v-model="form.doorplate" placeholder="如：100号2单元"
        /></el-form-item>
        <el-form-item class="full-row" label="详细地址" prop="address"
          ><el-input v-model="form.address" placeholder="请输入街道、道路等详细地址"
        /></el-form-item>
        <el-form-item label="默认地址"
          ><el-switch v-model="form.isDefault" inline-prompt active-text="是" inactive-text="否"
        /></el-form-item>
        <el-form-item label="地址状态"
          ><el-switch
            v-model="form.isEnabled"
            inline-prompt
            active-text="启用"
            inactive-text="停用"
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
.el-input-number {
  width: 100%;
}
</style>
