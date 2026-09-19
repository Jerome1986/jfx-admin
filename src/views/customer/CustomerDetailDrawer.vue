<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CustomerUser } from '@/types/customerUser'
import CouponIssueDialog from '@/views/marketing/CouponIssueDialog.vue'
import CouponRecordsPanel from '@/views/marketing/CouponRecordsPanel.vue'

const props = defineProps<{ modelValue: boolean; user?: CustomerUser }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
// 保存详情页签和发放弹窗状态。
const activeTab = ref('profile')
const issueVisible = ref(false)
// 发放成功后更新用户持券列表。
const recordsVersion = ref(0)
const onSent = () => {
  recordsVersion.value++
}
// 每次打开客户详情重置展示状态。
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      activeTab.value = 'profile'
      issueVisible.value = false
    }
  },
)
// 打开发放弹窗并预留入口操作。
const openIssue = () => {
  issueVisible.value = true
}
// 关闭客户详情。
const close = () => {
  issueVisible.value = false
  emit('update:modelValue', false)
}
</script>

<template>
  <!-- 客户详情及持券入口。 -->
  <el-drawer
    :model-value="modelValue"
    title="客户详情"
    size="80%"
    destroy-on-close
    @update:model-value="close"
  >
    <template v-if="user">
      <div class="customer-heading">
        <el-avatar :size="48" :src="user.avatar || undefined">{{
          (user.realName || user.nickname || '用户').slice(0, 1)
        }}</el-avatar>
        <div>
          <h3>{{ user.realName || user.nickname || '未完善资料' }}</h3>
          <p>{{ user.mobile }} · {{ user.userNo }}</p>
        </div>
      </div>
      <el-tabs v-model="activeTab">
        <!-- 客户基本信息。 -->
        <el-tab-pane label="基本资料" name="profile"
          ><el-descriptions :column="2" border
            ><el-descriptions-item label="姓名">{{ user.realName || '—' }}</el-descriptions-item
            ><el-descriptions-item label="昵称">{{ user.nickname || '—' }}</el-descriptions-item
            ><el-descriptions-item label="手机号">{{ user.mobile }}</el-descriptions-item
            ><el-descriptions-item label="城市">{{ user.city || '—' }}</el-descriptions-item
            ><el-descriptions-item label="积分">{{ user.points }}</el-descriptions-item
            ><el-descriptions-item label="账号状态">{{
              user.status ? '启用' : '禁用'
            }}</el-descriptions-item></el-descriptions
          ></el-tab-pane
        >
        <!-- 当前用户的优惠券和发放操作。 -->
        <el-tab-pane label="优惠券" name="coupons" lazy
          ><div class="coupon-toolbar">
            <div>
              <h3>用户优惠券</h3>
              <p>查看该用户的领券、使用及核销记录</p>
            </div>
            <el-button type="primary" @click="openIssue">发放优惠券</el-button>
          </div>
          <CouponRecordsPanel :key="user.id" :user-id="user.id" :refresh-key="recordsVersion"
        /></el-tab-pane>
      </el-tabs>
      <!-- 复用指定用户发放弹窗。 -->
      <CouponIssueDialog
        v-model="issueVisible"
        @sent="onSent"
        :user="{ id: user.id, name: user.realName || user.nickname || user.mobile }"
      />
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
.customer-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}
h3 {
  margin: 0;
  font-size: 16px;
}
p {
  margin: 8px 0 0;
  color: var(--jfx-muted);
  font-size: 12px;
}
.coupon-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0 20px;
}
</style>
