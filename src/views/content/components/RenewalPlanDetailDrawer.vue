<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { renewalPlanApi } from '@/api/renewalPlans'
import type { RenewalPlan, RenewalPlanStatus } from '@/types/renewalPlan'
import { calculateRenewalPlanPrice } from '@/utils/renewalPlan'

const props = defineProps<{ modelValue: boolean; planId?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const loading = ref(false)
const detail = ref<RenewalPlan>()
const gallery = computed(() =>
  detail.value ? [detail.value.cover, ...(detail.value.images ?? [])].filter(Boolean) as string[] : [],
)
const itemsTotal = computed(() => calculateRenewalPlanPrice(detail.value?.items))
const statusLabel = (status: RenewalPlanStatus) =>
  ({ DRAFT: '草稿', PUBLISHED: '已发布', OFFLINE: '已下架' })[status]
const statusType = (status: RenewalPlanStatus) =>
  ({ DRAFT: 'warning', PUBLISHED: 'success', OFFLINE: 'info' })[status] as
    | 'warning'
    | 'success'
    | 'info'
const formatDate = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '—')
const formatPrice = (value: number | string) => Number(value).toFixed(2)

watch(
  () => [props.modelValue, props.planId] as const,
  async ([visible, planId]) => {
    if (!visible || !planId) return
    detail.value = undefined
    loading.value = true
    try {
      const { data } = await renewalPlanApi.detail(planId)
      detail.value = data
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '焕新方案详情加载失败')
    } finally {
      loading.value = false
    }
  },
)
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    title="焕新方案详情"
    size="760px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="drawer-content">
      <template v-if="detail">
        <div class="detail-head">
          <div>
            <div class="title-row">
              <h2>{{ detail.name }}</h2>
              <el-tag :type="statusType(detail.status)">{{ statusLabel(detail.status) }}</el-tag>
            </div>
            <p>{{ detail.summary || '暂无方案简介' }}</p>
          </div>
          <strong class="starting-price">¥{{ formatPrice(itemsTotal) }} 起</strong>
        </div>

        <section v-if="gallery.length" class="detail-section">
          <h3>方案图片</h3>
          <div class="image-grid">
            <el-image
              v-for="(image, index) in gallery"
              :key="`${image}-${index}`"
              :src="image"
              :preview-src-list="gallery"
              :initial-index="index"
              fit="contain"
              preview-teleported
            />
          </div>
        </section>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="首页推荐">{{ detail.isRecommended ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="推荐排序">{{ detail.recommendSort }}</el-descriptions-item>
          <el-descriptions-item label="方案排序">{{ detail.sort }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="3">{{ formatDate(detail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="3">{{ formatDate(detail.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <section class="detail-section">
          <h3>方案标签</h3>
          <el-space v-if="detail.tags?.length" wrap>
            <el-tag v-for="tag in detail.tags" :key="tag" type="info">{{ tag }}</el-tag>
          </el-space>
          <span v-else class="empty-text">暂无标签</span>
        </section>

        <section class="detail-section">
          <h3>方案详情</h3>
          <p class="detail-text">{{ detail.detail || '暂无详情内容' }}</p>
        </section>

        <section class="detail-section">
          <div class="section-head">
            <h3>服务项目（{{ detail.items?.length ?? 0 }}）</h3>
            <strong>项目合计：¥{{ formatPrice(itemsTotal) }}</strong>
          </div>
          <el-table :data="detail.items" row-key="id" border>
            <el-table-column label="项目" min-width="220">
              <template #default="{ row }">
                <div class="item-cell">
                  <el-image v-if="row.image || row.product?.mainImage" :src="row.image || row.product?.mainImage" fit="contain" />
                  <div>
                    <strong>{{ row.name }}</strong>
                    <small>{{ row.description || row.product?.model || '暂无描述' }}</small>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="90" />
            <el-table-column label="单价" width="105" align="right">
              <template #default="{ row }">¥{{ formatPrice(row.unitPrice) }}</template>
            </el-table-column>
            <el-table-column label="数量" width="90" align="center">
              <template #default="{ row }">{{ row.quantity }} {{ row.unit }}</template>
            </el-table-column>
            <el-table-column label="小计" width="115" align="right">
              <template #default="{ row }">¥{{ formatPrice(Number(row.unitPrice) * Number(row.quantity)) }}</template>
            </el-table-column>
          </el-table>
        </section>

        <section v-if="detail.shareTitle || detail.shareImage" class="detail-section">
          <h3>分享设置</h3>
          <div class="share-card">
            <el-image v-if="detail.shareImage" :src="detail.shareImage" fit="contain" />
            <span>{{ detail.shareTitle || '未设置分享标题' }}</span>
          </div>
        </section>
      </template>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.drawer-content {
  min-height: 240px;
}
.detail-head,
.title-row,
.section-head,
.share-card,
.item-cell {
  display: flex;
  align-items: center;
}
.detail-head {
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  h2 {
    margin: 0;
    font-size: 22px;
  }
  p {
    margin: 8px 0 0;
    color: var(--jfx-muted);
  }
}
.title-row {
  gap: 10px;
}
.starting-price {
  flex: none;
  color: #e55d35;
  font-size: 18px;
}
.detail-section {
  margin: 24px 0;
  h3 {
    margin: 0 0 12px;
    font-size: 15px;
  }
}
.section-head {
  justify-content: space-between;
  margin-bottom: 12px;
  h3 {
    margin: 0;
  }
  strong {
    color: #e55d35;
  }
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  .el-image {
    width: 100%;
    height: 135px;
    padding: 5px;
    box-sizing: border-box;
    background: #f7f8fa;
    border: 1px solid var(--jfx-border);
    border-radius: 7px;
  }
}
.detail-text {
  margin: 0;
  color: #555b63;
  line-height: 1.8;
  white-space: pre-wrap;
}
.empty-text,
.item-cell small {
  color: var(--jfx-muted);
}
.item-cell {
  gap: 10px;
  .el-image {
    width: 48px;
    height: 48px;
    flex: none;
    padding: 3px;
    box-sizing: border-box;
    background: #f7f8fa;
    border: 1px solid var(--jfx-border);
    border-radius: 5px;
  }
  strong,
  small {
    display: block;
  }
  small {
    margin-top: 5px;
    font-size: 11px;
  }
}
.share-card {
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  .el-image {
    width: 90px;
    height: 70px;
  }
}
</style>
