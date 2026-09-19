<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { userCouponApi } from '@/api/userCoupons'
import type { Coupon } from '@/types/coupon'
import { userApi } from '@/api/users'
import { couponApi } from '@/api/coupons'

const props = defineProps<{
  modelValue: boolean
  coupon?: Coupon
  user?: { id: number; name: string }
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; sent: [] }>()
// 防止重复点击提交。
const submitting = ref(false)
// 保存发放表单和远程搜索选项。
const form = reactive({
  couponId: undefined as number | undefined,
  userId: undefined as number | undefined,
})
const couponOptions = ref<{ id: number; name: string }[]>([])
const userOptions = ref<{ id: number; name: string }[]>([])
// 保存搜索加载状态并防止旧请求覆盖新结果。
const usersLoading = ref(false)
const couponsLoading = ref(false)
let userSearchVersion = 0
let couponSearchVersion = 0
// 查询已发布模板并保留当前选择。
const searchCoupons = async (keyword: string) => {
  const version = ++couponSearchVersion
  couponsLoading.value = true
  try {
    const { data } = await couponApi.list({
      keyword: keyword.trim() || undefined,
      status: 'PUBLISHED',
      pageNum: 1,
      pageSize: 20,
    })
    if (version !== couponSearchVersion) return
    const selected = couponOptions.value.filter((item) => item.id === form.couponId)
    couponOptions.value = Array.from(
      new Map(
        [
          ...selected,
          ...data.list.map((item) => ({ id: item.id, name: `${item.name}（¥${item.amount}）` })),
        ].map((item) => [item.id, item]),
      ).values(),
    )
  } catch {
    // 请求封装统一提示错误，保留已选模板。
    if (version === couponSearchVersion)
      couponOptions.value = couponOptions.value.filter((item) => item.id === form.couponId)
  } finally {
    if (version === couponSearchVersion) couponsLoading.value = false
  }
}
// 按用户编号、姓名或手机号搜索并保留已选用户。
const searchUsers = async (keyword: string) => {
  const version = ++userSearchVersion
  usersLoading.value = true
  try {
    const { data } = await userApi.list({
      keyword: keyword.trim() || undefined,
      role: 'CUSTOMER',
      status: true,
      pageNum: 1,
      pageSize: 20,
    })
    if (version !== userSearchVersion) return
    const selected = userOptions.value.filter((item) => form.userId === item.id)
    userOptions.value = Array.from(
      new Map(
        [
          ...selected,
          ...data.list.map((item) => ({
            id: item.id,
            name: `${item.realName || item.nickname || '未完善资料'} · ${item.mobile} · ${item.userNo}`,
          })),
        ].map((item) => [item.id, item]),
      ).values(),
    )
  } catch {
    // 请求封装统一提示错误，保留已选用户。
    if (version === userSearchVersion)
      userOptions.value = userOptions.value.filter((item) => form.userId === item.id)
  } finally {
    if (version === userSearchVersion) usersLoading.value = false
  }
}
// 打开时重置表单并带入当前模板或用户。
watch(
  () => props.modelValue,
  (visible) => {
    userSearchVersion++
    couponSearchVersion++
    usersLoading.value = false
    couponsLoading.value = false
    if (!visible) return
    form.couponId = props.coupon?.id
    form.userId = props.user?.id

    couponOptions.value = props.coupon ? [{ id: props.coupon.id, name: props.coupon.name }] : []
    userOptions.value = props.user ? [props.user] : []
    if (!props.coupon) searchCoupons('')
    if (!props.user) searchUsers('')
  },
)
// 校验用户和模板后发放一张券，不自动重试请求。
const submit = async () => {
  if (submitting.value) return
  const { userId, couponId } = form
  if (
    !userId ||
    !couponId ||
    !Number.isInteger(userId) ||
    !Number.isInteger(couponId) ||
    userId < 1 ||
    couponId < 1
  ) {
    ElMessage.warning('请选择有效的用户和优惠券模板')
    return
  }
  submitting.value = true
  try {
    await userCouponApi.sendUser({ userId, couponId })
    ElMessage.success('优惠券已发放')
    emit('update:modelValue', false)
    emit('sent')
  } catch {
    // 请求封装显示后端错误，保留选择以便核对。
  } finally {
    submitting.value = false
  }
}
// 提交期间禁止关闭弹窗。
const close = () => {
  if (!submitting.value) emit('update:modelValue', false)
}
</script>

<template>
  <!-- 两个入口共用发放表单。 -->
  <el-dialog
    :model-value="modelValue"
    title="发放优惠券"
    width="560px"
    :close-on-click-modal="false"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    append-to-body
    @update:model-value="close"
  >
    <el-form :model="form" label-width="100px" :disabled="submitting">
      <el-form-item label="优惠券模板" required>
        <el-select
          v-model="form.couponId"
          :disabled="!!coupon"
          filterable
          remote
          :remote-method="searchCoupons"
          :loading="couponsLoading"
          placeholder="搜索已发布的优惠券模板"
          no-data-text="暂无可选模板"
        >
          <el-option
            v-for="item in couponOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="指定用户" required>
        <el-select
          v-model="form.userId"
          filterable
          remote
          :disabled="!!user"
          :remote-method="searchUsers"
          :loading="usersLoading"
          placeholder="输入用户编号、姓名或手机号"
          no-data-text="暂无可选用户"
        >
          <el-option
            v-for="item in userOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <!-- 当前接口每次发放一张，过期时间沿用模板有效期。 -->
      <div class="issue-summary">
        本次向指定用户发放 <b>1</b> 张优惠券，有效期截止时间沿用模板。
      </div>
    </el-form>
    <!-- 发放确认操作。 -->
    <template #footer
      ><el-button :disabled="submitting" @click="close">取消</el-button
      ><el-button
        type="primary"
        :disabled="!form.couponId || !form.userId"
        :loading="submitting"
        @click="submit"
        >确认发放</el-button
      ></template
    >
  </el-dialog>
</template>

<style scoped lang="scss">
.el-select {
  width: 100%;
}
.coupon-summary {
  margin: 0 0 20px 100px;
  padding: 16px;
  border-radius: 8px;
  background: #fff5f2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  strong {
    font-size: 24px;
    color: var(--el-color-primary);
  }
  span {
    font-size: 12px;
    color: var(--jfx-muted);
  }
}
.issue-summary {
  padding: 14px 18px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  color: var(--jfx-muted);
  b {
    color: var(--el-color-primary);
  }
}
</style>
