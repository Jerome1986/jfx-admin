<script setup lang="ts">
import { ref, watch } from 'vue'
import { projectApi } from '@/api/projects'
import { projectStatuses, type ProjectDetail } from '@/types/project'
import { projectMoney, projectTime } from '@/utils/project'
import ProjectActionDialog from './ProjectActionDialog.vue'
import ProjectQuotationDialog from './ProjectQuotationDialog.vue'
const props = defineProps<{ modelValue: boolean; projectId?: number }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: [] }>()
const project = ref<ProjectDetail>()
const loading = ref(false)
const error = ref(false)
const actionVisible = ref(false)
const quoteVisible = ref(false)
const mode = ref<'edit' | 'assign' | 'progress' | 'follow-up'>('edit')
let requestId = 0
async function load() {
  const current = ++requestId
  project.value = undefined
  if (!props.modelValue || !props.projectId) return
  loading.value = true
  error.value = false
  try {
    const { data } = await projectApi.detail(props.projectId)
    if (current === requestId) project.value = data
  } catch {
    if (current === requestId) error.value = true
  } finally {
    if (current === requestId) loading.value = false
  }
}
watch(
  () => [props.modelValue, props.projectId],
  () => {
    actionVisible.value = false
    quoteVisible.value = false
    void load()
  },
)
function action(value: typeof mode.value) {
  mode.value = value
  actionVisible.value = true
}
function saved() {
  emit('saved')
  void load()
}
</script>
<template>
  <el-drawer
    :model-value="modelValue"
    title="装修项目详情"
    size="min(100vw, 1050px)"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="detail">
      <el-result v-if="error" icon="error" title="详情加载失败"
        ><template #extra><el-button @click="load">重新加载</el-button></template></el-result
      >
      <template v-if="project">
        <div class="actions">
          <el-button @click="action('edit')">编辑项目</el-button
          ><el-button @click="action('assign')">{{
            project.employeeId ? '改派负责人' : '分配负责人'
          }}</el-button
          ><el-button :disabled="!project.employeeId" @click="action('follow-up')"
            >新增跟进</el-button
          ><el-button
            type="primary"
            :disabled="!['PENDING_CONFIRM', 'IN_SERVICE', 'COMPLETED'].includes(project.status)"
            @click="action('progress')"
            >更新进度</el-button
          >
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目名称">{{ project.name }}</el-descriptions-item
          ><el-descriptions-item label="项目编号">{{ project.projectNo }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ project.customerName }}</el-descriptions-item
          ><el-descriptions-item label="手机号">{{ project.mobile }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{
            project.employeeName || '未分配'
          }}</el-descriptions-item
          ><el-descriptions-item label="状态">{{
            projectStatuses[project.status]
          }}</el-descriptions-item>
          <el-descriptions-item label="装修方案">{{ project.planName || '—' }}</el-descriptions-item
          ><el-descriptions-item label="来源预约">{{
            project.appointmentId ?? '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="报价金额">{{
            project.quotedAmount == null ? '未报价' : projectMoney(project.quotedAmount)
          }}</el-descriptions-item
          ><el-descriptions-item label="合同金额">{{
            projectMoney(project.contractAmount)
          }}</el-descriptions-item>
          <el-descriptions-item label="服务地址" :span="2">{{
            project.serviceAddress || '—'
          }}</el-descriptions-item
          ><el-descriptions-item label="当前进度" :span="2">{{
            project.progress || '—'
          }}</el-descriptions-item
          ><el-descriptions-item label="备注" :span="2">{{
            project.remark || '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{
            projectTime(project.createdAt)
          }}</el-descriptions-item
          ><el-descriptions-item label="更新时间">{{
            projectTime(project.updatedAt)
          }}</el-descriptions-item>
        </el-descriptions>
        <div class="section-title">
          <h3>报价明细</h3>
          <el-button :disabled="project.status !== 'PENDING_CONFIRM'" @click="quoteVisible = true"
            >编辑报价</el-button
          >
        </div>
        <el-table :data="project.items" border
          ><el-table-column prop="category" label="分类" width="75" /><el-table-column
            prop="name"
            label="名称"
            min-width="140" /><el-table-column
            prop="description"
            label="说明"
            min-width="120" /><el-table-column
            prop="unit"
            label="单位"
            width="75" /><el-table-column
            prop="unitPrice"
            label="单价（元）"
            width="110" /><el-table-column
            prop="quantity"
            label="数量"
            width="85" /><el-table-column prop="amount" label="金额（元）" width="120"
        /></el-table>
        <h3>服务进度</h3>
        <el-empty
          v-if="!project.progressRecords.length"
          description="暂无进度记录"
          :image-size="60"
        /><el-timeline v-else
          ><el-timeline-item
            v-for="record in project.progressRecords"
            :key="record.id"
            :timestamp="projectTime(record.createdAt)"
            ><el-tag>{{ projectStatuses[record.status] || record.status }}</el-tag>
            <p class="content">{{ record.content }}</p></el-timeline-item
          ></el-timeline
        >
        <h3>跟进记录</h3>
        <el-empty
          v-if="!project.followUps.length"
          description="暂无跟进记录"
          :image-size="60"
        /><el-timeline v-else
          ><el-timeline-item
            v-for="record in project.followUps"
            :key="record.id"
            :timestamp="projectTime(record.createdAt)"
            ><p class="content">{{ record.content }}</p>
            <small
              >跟进员工 ID：{{ record.employeeId ?? '—' }} · 下次跟进：{{
                projectTime(record.nextFollowAt)
              }}</small
            ></el-timeline-item
          ></el-timeline
        >
      </template>
    </div>
    <ProjectActionDialog
      v-model="actionVisible"
      :mode="mode"
      :project="project"
      @saved="saved"
      @conflict="saved"
    />
    <ProjectQuotationDialog
      v-model="quoteVisible"
      :project="project"
      @saved="saved"
      @conflict="saved"
    />
  </el-drawer>
</template>
<style scoped>
.detail {
  min-height: 180px;
}
.actions,
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.section-title {
  margin-top: 24px;
}
h3 {
  margin: 24px 0 16px;
}
.content {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
:deep(.el-descriptions__content) {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
