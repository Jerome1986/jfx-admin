<script setup lang="ts">
import type { BusinessMetric, BusinessStatus, DashboardAlert } from '@/types/dashboard'

// 工作台模拟数据；接入后端后可直接替换为接口返回值。
// 定义工作台顶部展示的经营指标。
const businessMetrics: BusinessMetric[] = [
  { key: 'todayCustomers', label: '今日新增客户', value: 18, unit: '人' },
  { key: 'todayAppointments', label: '今日新增预约', value: 12, unit: '条' },
  { key: 'renovationProjects', label: '装修项目数量', value: 86, unit: '个' },
  { key: 'productOrders', label: '商品订单数量', value: 35, unit: '单' },
  { key: 'todayRevenue', label: '今日成交金额', value: 28600, unit: '元' },
  { key: 'monthRevenue', label: '本月成交金额', value: 426800, unit: '元' },
]

// 定义工作台展示的业务状态统计。
const businessStatuses: BusinessStatus[] = [
  { key: 'appointmentPendingContact', label: '待联系预约', count: 8 },
  { key: 'appointmentPendingVisit', label: '待上门预约', count: 6 },
  { key: 'projectPendingConfirm', label: '待确认项目', count: 5 },
  { key: 'projectInService', label: '服务中项目', count: 23 },
  { key: 'orderPendingInstallation', label: '待安装订单', count: 9 },
  { key: 'projectCompleted', label: '已完成项目', count: 58 },
]

// 定义工作台展示的异常提醒数据。
const alerts: DashboardAlert[] = [
  {
    id: 'alert-appointment-uncontacted',
    type: 'APPOINTMENT_UNCONTACTED',
    title: '预约长时间未联系',
    description: '存在提交超过 2 小时且尚未联系的客户预约',
    count: 3,
    level: 'danger',
    targetPath: '/renovation/appointment',
    query: { status: '待联系', alertType: 'uncontacted' },
  },
  {
    id: 'alert-appointment-unassigned',
    type: 'APPOINTMENT_UNASSIGNED',
    title: '预约未分配员工',
    description: '存在尚未分配负责员工的有效预约',
    count: 2,
    level: 'warning',
    targetPath: '/renovation/appointment',
    query: { alertType: 'unassigned' },
  },
  {
    id: 'alert-project-overdue',
    type: 'PROJECT_OVERDUE',
    title: '装修项目已逾期',
    description: '存在超过计划完成时间但尚未完成的项目',
    count: 2,
    level: 'danger',
    targetPath: '/renovation/projects',
    query: { alertType: 'overdue' },
  },
  {
    id: 'alert-installation-overdue',
    type: 'INSTALLATION_OVERDUE',
    title: '商品安装超时',
    description: '存在超过预约安装时间仍未完成的服务单',
    count: 1,
    level: 'warning',
    targetPath: '/trade/installation',
    query: { alertType: 'overdue' },
  },
  {
    id: 'alert-feedback-unhandled',
    type: 'FEEDBACK_UNHANDLED',
    title: '客户反馈未处理',
    description: '存在提交超过 24 小时仍未处理的客户反馈',
    count: 4,
    level: 'warning',
    targetPath: '/support/feedback',
    query: { status: '待处理', alertType: 'overdue' },
  },
]

// 根据指标类型格式化工作台数值。
const formatMetricValue = (metric: BusinessMetric) => {
  if (metric.key.includes('Revenue')) {
    return `¥${metric.value.toLocaleString('zh-CN')}`
  }
  return metric.value.toLocaleString('zh-CN')
}
</script>

<template>
  <section class="dashboard-page">
    <div class="dashboard-section">
      <div class="section-heading">
        <h2>经营数据</h2>
        <p>今日经营情况与累计业务规模</p>
      </div>
      <div class="metric-grid">
        <div v-for="metric in businessMetrics" :key="metric.key" class="metric-card">
          <span>{{ metric.label }}</span>
          <div class="metric-value">
            <strong>{{ formatMetricValue(metric) }}</strong>
            <small v-if="!metric.key.includes('Revenue')">{{ metric.unit }}</small>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-section">
      <div class="section-heading">
        <h2>业务状态</h2>
        <p>各业务环节当前的数据量</p>
      </div>
      <div class="status-grid">
        <div v-for="status in businessStatuses" :key="status.key" class="status-card">
          <span>{{ status.label }}</span>
          <strong>{{ status.count }}</strong>
        </div>
      </div>
    </div>

    <div class="dashboard-section anomaly-section">
      <div class="section-heading">
        <h2>异常提醒</h2>
        <p>集中关注超时、未分配和未处理的业务异常</p>
      </div>
      <el-scrollbar v-if="alerts.length" class="alert-scrollbar">
        <div class="alert-list">
          <router-link
            v-for="alert in alerts"
            :key="alert.id"
            class="alert-item"
            :to="{ path: alert.targetPath, query: alert.query }"
          >
            <span class="alert-level" :class="`is-${alert.level}`" />
            <span class="alert-copy">
              <strong>{{ alert.title }}</strong>
              <small>{{ alert.description }}</small>
            </span>
            <el-tag :type="alert.level" effect="light">{{ alert.count }} 条</el-tag>
            <span class="alert-link">查看详情</span>
          </router-link>
        </div>
      </el-scrollbar>
      <el-empty v-else description="暂无异常数据" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.dashboard-page {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

.dashboard-section {
  padding: 22px;
  background: #fff;
  border: 1px solid var(--jfx-border);
  border-radius: 10px;
}

.section-heading {
  margin-bottom: 18px;

  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
  }

  p {
    margin: 6px 0 0;
    color: var(--jfx-muted);
    font-size: 12px;
  }
}

.metric-grid,
.status-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(130px, 1fr));
  gap: 12px;
}

.metric-card,
.status-card {
  display: flex;
  min-height: 94px;
  padding: 16px;
  flex-direction: column;
  justify-content: space-between;
  background: #fafbfc;
  border: 1px solid #f0f1f3;
  border-radius: 9px;

  span {
    color: #737780;
    font-size: 13px;
  }

  strong {
    font-size: 25px;
    font-weight: 600;
  }
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 5px;

  small {
    color: var(--jfx-muted);
    font-size: 12px;
  }
}

.status-card {
  min-height: 82px;
  background: var(--jfx-primary-light);
  border-color: #ffe2df;

  strong {
    color: var(--jfx-primary);
  }
}

.anomaly-section {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.alert-scrollbar {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.alert-list {
  border-top: 1px solid var(--jfx-border);
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 68px;
  color: inherit;
  border-bottom: 1px solid var(--jfx-border);
  text-decoration: none;

  &:hover {
    background: #fafbfc;
  }
}

.alert-level {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.is-danger {
    background: #f04438;
  }

  &.is-warning {
    background: #f79009;
  }
}

.alert-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 5px;

  strong {
    font-size: 14px;
    font-weight: 500;
  }

  small {
    overflow: hidden;
    color: var(--jfx-muted);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.alert-link {
  margin-left: 6px;
  color: var(--jfx-primary);
  font-size: 12px;
}

@media (width <=1400px) {
  .metric-grid,
  .status-grid {
    grid-template-columns: repeat(3, minmax(160px, 1fr));
  }
}
</style>
