<script setup lang="ts">
import type { CaseDetail, CaseStatus } from '@/types/case'

// 定义案例详情组件的输入属性。
defineProps<{ modelValue: boolean; detail?: CaseDetail; categoryName: string }>()
// 定义案例详情组件的关闭事件。
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
// 将金额数值格式化为元或万元文本。
const formatPrice = (value: number) =>
  value >= 10000 ? `${Number((value / 10000).toFixed(2))}万` : `${value.toLocaleString('zh-CN')}元`
// 返回案例状态对应的中文名称。
const statusLabel = (status: CaseStatus) =>
  ({ draft: '草稿', published: '已发布', disabled: '已下架' })[status]
// 返回案例状态对应的标签样式。
const statusTag = (status: CaseStatus) =>
  ({ draft: 'info', published: 'success', disabled: 'warning' })[status] as
    'info' | 'success' | 'warning'
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    title="案例详情"
    size="720px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="detail">
      <div class="detail-covers">
        <section class="cover-card">
          <h3>改造前</h3>
          <div class="cover-placeholder before">
            <span>改造前图片</span
            ><img
              v-if="detail.beforeCover"
              :src="detail.beforeCover"
              alt="改造前图片"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
          </div>
        </section>
        <section class="cover-card">
          <h3>改造后</h3>
          <div class="cover-placeholder after">
            <span>改造后图片</span
            ><img
              v-if="detail.afterCover"
              :src="detail.afterCover"
              alt="改造后图片"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
          </div>
        </section>
      </div>
      <div class="detail-title">
        <div>
          <el-tag>{{ categoryName || '未知分类' }}</el-tag>
          <h2>{{ detail.title }}</h2>
          <p>
            {{ detail.city }} · {{ detail.roomType }} · {{ detail.area }}㎡ · {{ detail.style }}
          </p>
        </div>
        <el-tag :type="statusTag(detail.status)">{{ statusLabel(detail.status) }}</el-tag>
      </div>
      <el-descriptions :column="3" border
        ><el-descriptions-item label="总花费"
          >¥{{ formatPrice(detail.totalPrice) }}</el-descriptions-item
        ><el-descriptions-item label="施工工期">{{ detail.durationDays }}天</el-descriptions-item
        ><el-descriptions-item label="报价人数"
          >{{ detail.quoteCount }}人</el-descriptions-item
        ></el-descriptions
      >
      <section class="detail-section">
        <h3>案例标签</h3>
        <el-space wrap
          ><el-tag v-for="tag in detail.tags" :key="tag" type="info">{{ tag }}</el-tag></el-space
        >
      </section>
      <section class="detail-section">
        <h3>案例说明</h3>
        <p>{{ detail.description }}</p>
      </section>
      <section class="detail-section">
        <h3>改造亮点</h3>
        <div v-for="(item, index) in detail.highlights" :key="item.title" class="highlight">
          <b>{{ String(index + 1).padStart(2, '0') }}</b>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </section>
      <section class="detail-section">
        <h3>费用明细</h3>
        <div v-for="item in detail.costs" :key="item.name" class="cost-row">
          <span>{{ item.name }}</span
          ><strong>¥{{ item.amount.toLocaleString('zh-CN') }}</strong>
        </div>
        <div class="cost-row total">
          <span>合计</span
          ><strong
            >¥{{
              detail.costs.reduce((sum, item) => sum + item.amount, 0).toLocaleString('zh-CN')
            }}</strong
          >
        </div>
      </section>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
.detail-covers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}
.cover-card {
  min-width: 0;
  padding: 14px;
  background: #f8f9fa;
  border: 1px solid var(--jfx-border);
  border-radius: 10px;
  h3 {
    margin: 0 0 10px;
    font-size: 14px;
  }
}
.cover-placeholder {
  position: relative;
  display: grid;
  width: 100%;
  height: 190px;
  overflow: hidden;
  place-items: center;
  color: #fff;
  background: #9299a3;
  border-radius: 7px;
  font-size: 15px;
  letter-spacing: 2px;
  &.after {
    background: #be856b;
  }
  img {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
.detail-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  h2 {
    margin: 10px 0 6px;
    font-size: 21px;
  }
  p {
    margin: 0;
    color: var(--jfx-muted);
  }
}
.detail-section {
  margin-top: 25px;
  h3 {
    margin: 0 0 12px;
    font-size: 15px;
  }
  > p {
    color: #555b63;
    line-height: 1.8;
  }
}
.highlight {
  display: flex;
  gap: 14px;
  padding: 13px 0;
  border-bottom: 1px solid var(--jfx-border);
  b {
    color: var(--jfx-primary);
    font-size: 18px;
  }
  strong {
    font-size: 14px;
  }
  p {
    margin: 5px 0 0;
    color: var(--jfx-muted);
    line-height: 1.6;
  }
}
.cost-row {
  display: flex;
  justify-content: space-between;
  padding: 11px 4px;
  border-bottom: 1px solid var(--jfx-border);
  &.total {
    color: var(--jfx-primary);
    font-size: 15px;
  }
}
</style>
