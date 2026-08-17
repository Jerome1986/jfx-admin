<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { addressApi } from '@/api/addresses'
import type { AddressInput, ServiceAddress, UpdateAddressInput } from '@/types/address'

const props = defineProps<{
  modelValue: boolean
  addressId?: number
  address?: ServiceAddress
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()
type AddressForm = Omit<AddressInput, 'userId' | 'latitude' | 'longitude'>

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
const formRef = ref<FormInstance>()
const form = reactive<AddressForm>(emptyForm())
const loading = ref(false)
const submitting = ref(false)
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
const close = () => emit('update:modelValue', false)
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'

const fillRegionFromAddress = () => {
  const text = form.address.trim()
  if (!text) return

  const province = text.match(/^(.+?(?:省|自治区|特别行政区))/)?.[1]
  const afterProvince = province ? text.slice(province.length) : text
  const municipality = text.match(/^(北京市|天津市|上海市|重庆市)/)?.[1]
  const city = municipality ?? afterProvince.match(/^(.+?市)/)?.[1]
  const afterCity =
    city && afterProvince.startsWith(city) ? afterProvince.slice(city.length) : afterProvince
  const district = afterCity.match(/^(.+?(?:区|县|旗))/)?.[1]

  if (!form.province) form.province = province ?? municipality ?? ''
  if (!form.city) form.city = city ?? ''
  if (!form.district) form.district = district ?? ''

  let streetAddress = text
  for (const region of [form.province, form.city, form.district]) {
    if (region && streetAddress.startsWith(region)) {
      streetAddress = streetAddress.slice(region.length)
    }
  }
  form.address = streetAddress
}

const prepare = async () => {
  Object.assign(form, emptyForm())
  if (props.address) {
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
      const { data } = await addressApi.detail(props.addressId)
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
watch(
  () => [props.modelValue, props.addressId, props.address] as const,
  ([visible]) => {
    if (visible) prepare()
  },
)

const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
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
