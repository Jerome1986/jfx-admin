<script setup lang="ts">
import { computed } from 'vue'
import { installationLabel, installationTagType, installationDate } from '@/utils/orderInstallation'
import {
  orderStatuses,
  paymentStatusLabels,
  completionTypeLabel,
  type ProductOrder,
} from '@/types/order'

const orderStatusLabel = (status: ProductOrder['status']) =>
  orderStatuses.find((item) => item.value === status)?.label ?? status
const visible = defineModel<boolean>({ required: true })
const props = defineProps<{ order?: ProductOrder; processing?: boolean }>()
const emit = defineEmits<{ 'toggle-auto-completion': [order: ProductOrder] }>()
const completionImages = computed(() => {
  const images = props.order?.installation?.completionImages
  return Array.isArray(images)
    ? images.filter(
        (image): image is string => typeof image === 'string' && image.trim().length > 0,
      )
    : []
})
const money = (value: string | number | null | undefined) =>
  value == null || value === '' || !Number.isFinite(Number(value))
    ? '—'
    : `¥${Number(value).toFixed(2)}`
const date = (value?: string | null) => {
  if (!value) return '—'
  const result = new Date(value)
  return Number.isNaN(result.getTime()) ? '—' : result.toLocaleString('zh-CN', { hour12: false })
}
</script>

<template>
  <el-drawer
    v-model="visible"
    title="订单详情"
    direction="rtl"
    size="min(960px, 100vw)"
    destroy-on-close
  >
    <template v-if="order">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">{{
          orderStatusLabel(order.status)
        }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ order.contactName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ order.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="服务地址" :span="2">{{
          order.serviceAddress
        }}</el-descriptions-item>
        <el-descriptions-item label="商品金额">{{
          money(order.productAmount)
        }}</el-descriptions-item>
        <el-descriptions-item label="优惠券抵扣">{{
          money(order.couponDiscount || 0)
        }}</el-descriptions-item>
        <el-descriptions-item label="积分抵扣">{{
          money(order.pointDiscount || 0)
        }}</el-descriptions-item>
        <el-descriptions-item label="应付金额">{{
          money(order.payableAmount)
        }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">{{ money(order.paidAmount) }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">{{
          paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus
        }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ date(order.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ order.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
      <h3>完工与客户确认</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="安装完工时间">{{
          date(order.installation?.completedAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="确认截止时间">{{
          date(order.confirmationDeadlineAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="客户确认">{{
          order.installation ? (order.installation.customerConfirmed ? '已确认' : '未确认') : '—'
        }}</el-descriptions-item>
        <el-descriptions-item label="客户确认时间">{{
          date(order.installation?.customerConfirmedAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="订单完成时间">{{
          date(order.completedAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="完成方式">{{
          order.status === 'COMPLETED' ? completionTypeLabel(order.completionType) : '—'
        }}</el-descriptions-item>
        <el-descriptions-item
          v-if="order.status === 'PENDING_CONFIRMATION'"
          label="结单说明"
          :span="2"
          >{{
            order.autoCompletionPaused
              ? '因争议暂缓结单，客户仍可确认完成'
              : '等待客户确认；符合条件时，到期自动结单'
          }}</el-descriptions-item
        >
      </el-descriptions>
      <div v-if="order.status === 'PENDING_CONFIRMATION'" class="dispute-action">
        <el-button
          link
          :type="order.autoCompletionPaused ? 'success' : 'info'"
          :disabled="processing"
          @click="emit('toggle-auto-completion', order)"
          >{{ order.autoCompletionPaused ? '争议已解决' : '有争议，暂缓结单' }}</el-button
        >
      </div>
      <h3>下单商品明细</h3>
      <el-table :data="order.items ?? []" row-key="id" border empty-text="暂无商品明细">
        <el-table-column label="商品" min-width="220">
          <template #default="{ row }">
            <div class="item-product">
              <el-image
                v-if="row.image"
                :src="row.image"
                :preview-src-list="[row.image]"
                preview-teleported
                fit="cover"
                class="thumbnail"
              />
              <div>
                {{ row.productName }}
                <div class="muted">{{ row.skuDescription || '—' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成交单价" min-width="110"
          ><template #default="{ row }">{{ money(row.unitPrice) }}</template></el-table-column
        >
        <el-table-column prop="quantity" label="数量" width="70" />
        <el-table-column label="小计" min-width="110"
          ><template #default="{ row }">{{ money(row.subtotal) }}</template></el-table-column
        >
        <el-table-column label="需要安装" width="100"
          ><template #default="{ row }">{{
            row.requiresInstall ? '是' : '否'
          }}</template></el-table-column
        >
        <el-table-column label="安装费用" min-width="100"
          ><template #default="{ row }">{{ money(row.installationFee) }}</template></el-table-column
        >
      </el-table>
      <h3>安装信息</h3>
      <el-descriptions v-if="order.installation" :column="2" border>
        <el-descriptions-item label="安装服务单号">{{
          order.installation.serviceNo
        }}</el-descriptions-item>
        <el-descriptions-item label="安装状态"
          ><el-tag :type="installationTagType(order)">{{
            installationLabel(order)
          }}</el-tag></el-descriptions-item
        >
        <el-descriptions-item label="安装联系人">{{
          order.installation.customerName || '—'
        }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{
          order.installation.mobile || '—'
        }}</el-descriptions-item>
        <el-descriptions-item label="安装地址" :span="2">{{
          order.installation.serviceAddress || '—'
        }}</el-descriptions-item>
        <el-descriptions-item label="预约日期">{{
          order.installation.appointmentDate
            ? installationDate(order.installation.appointmentDate)
            : '待预约'
        }}</el-descriptions-item>
        <el-descriptions-item label="预约时段">{{
          order.installation.timeSlot || '—'
        }}</el-descriptions-item>
        <el-descriptions-item label="安装人员 / 团队">{{
          order.installation.installerName || '未安排'
        }}</el-descriptions-item>
        <el-descriptions-item label="安装联系电话">{{
          order.installation.installerPhone || '—'
        }}</el-descriptions-item>
        <el-descriptions-item label="安装备注" :span="2"
          ><div class="service-record">
            {{ order.installation.remark || '—' }}
          </div></el-descriptions-item
        >
        <el-descriptions-item label="派单时间">{{
          date(order.installation.assignedAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="接单时间">{{
          date(order.installation.acceptedAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="上门时间">{{
          date(order.installation.visitedAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="服务记录" :span="2"
          ><div class="service-record">
            {{ order.installation.serviceRecord || '暂无服务记录' }}
          </div></el-descriptions-item
        >
        <el-descriptions-item label="完工图片" :span="2">
          <div v-if="completionImages.length" class="completion-images">
            <el-image
              v-for="(image, index) in completionImages"
              :key="index"
              :src="image"
              :preview-src-list="completionImages"
              :initial-index="index"
              preview-teleported
              fit="cover"
              class="completion-image"
            />
          </div>
          <span v-else>暂无完工图片</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-alert v-else :title="installationLabel(order)" type="info" :closable="false" />
    </template>
    <template #footer><el-button @click="visible = false">关闭</el-button></template>
  </el-drawer>
</template>

<style scoped>
.dispute-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.service-record {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.completion-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.completion-image {
  width: 100px;
  height: 100px;
}
.item-product {
  display: flex;
  align-items: center;
  gap: 10px;
}
.thumbnail {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.muted {
  color: var(--jfx-muted);
  font-size: 12px;
}
</style>
