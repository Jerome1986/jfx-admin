<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { feedbackApi } from '@/api/feedback'
import { feedbackStatusOptions } from '@/types/feedback'
import type { Feedback, FeedbackStatus } from '@/types/feedback'

const loading = ref(false)
const loadFailed = ref(false)
const rows = ref<Feedback[]>([])
const total = ref(0)
const query = reactive({ keyWords: '', status: 'ALL' as FeedbackStatus | 'ALL' })
// 翻页沿用已提交的搜索条件，避免尚未搜索的输入影响列表。
const appliedQuery = reactive({ ...query })
const pagination = reactive({ pageNum: 1, pageSize: 10 })
let requestId = 0

const formatDate = (value: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { hour12: false })
}
// 优先展示真实姓名，其次昵称、手机号；用户资料缺失时展示占位符。
const displayUser = (row: Feedback) =>
  row.user?.realName?.trim() || row.user?.nickname?.trim() || row.user?.mobile?.trim() || '—'

const statusOption = (status: string) =>
  feedbackStatusOptions.find((option) => option.value === status)

// 只应用最后一次请求的结果，防止快速搜索或翻页时旧响应覆盖新数据。
const loadData = async () => {
  const currentRequest = ++requestId
  loading.value = true
  loadFailed.value = false
  try {
    const { data } = await feedbackApi.list({
      ...(appliedQuery.keyWords && { keyWords: appliedQuery.keyWords }),
      status: appliedQuery.status,
      pageNum: String(pagination.pageNum),
      pageSize: String(pagination.pageSize),
    })
    if (currentRequest !== requestId) return
    // 回复后记录可能移出当前筛选结果，末页为空时回到最后一个有效页。
    if (!data.list.length && pagination.pageNum > Math.max(1, data.totalPage)) {
      pagination.pageNum = Math.max(1, Math.ceil(data.total / Number(data.pageSize)))
      return await loadData()
    }
    rows.value = data.list
    total.value = data.total
    pagination.pageNum = Number(data.pageNum)
    pagination.pageSize = Number(data.pageSize)
  } catch {
    if (currentRequest !== requestId) return
    // 请求封装统一提示错误；清除旧结果，避免误认为新查询已成功。
    rows.value = []
    total.value = 0
    loadFailed.value = true
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

const search = () => {
  Object.assign(appliedQuery, { keyWords: query.keyWords.trim(), status: query.status })
  pagination.pageNum = 1
  return loadData()
}
const resetQuery = () => {
  Object.assign(query, { keyWords: '', status: 'ALL' })
  return search()
}
// 页容量变化时回到第一页，忽略组件同步相同页码产生的重复事件。
const changePage = (pageNum: number, pageSize: number) => {
  const nextPage = pageSize === pagination.pageSize ? pageNum : 1
  if (nextPage === pagination.pageNum && pageSize === pagination.pageSize) return
  pagination.pageNum = nextPage
  pagination.pageSize = pageSize
  return loadData()
}

// 详情直接使用列表数据，回复成功后重新获取后台处理结果。
const dialogVisible = ref(false)
const dialogMode = ref<'detail' | 'reply'>('detail')
const selectedFeedback = ref<Feedback>()
const replyContent = ref('')
const replyError = ref('')
const submitting = ref(false)
const canReply = (row: Feedback) => row.status === 'PENDING' || row.status === 'PROCESSING'

const openDetail = (row: Feedback) => {
  selectedFeedback.value = row
  dialogMode.value = 'detail'
  replyError.value = ''
  dialogVisible.value = true
}
const openReply = (row: Feedback) => {
  if (submitting.value || !canReply(row)) return
  selectedFeedback.value = row
  dialogMode.value = 'reply'
  replyContent.value = ''
  replyError.value = ''
  dialogVisible.value = true
}
const submitReply = async () => {
  const feedback = selectedFeedback.value
  if (submitting.value || !feedback || !canReply(feedback)) return
  const reply = replyContent.value.trim()
  if (!reply || reply.length > 5000) {
    replyError.value = reply ? '回复内容不能超过 5000 字符' : '请输入回复内容'
    return
  }
  replyError.value = ''
  submitting.value = true
  try {
    await feedbackApi.reply(feedback.id, { reply })
    dialogVisible.value = false
    replyContent.value = ''
    ElMessage.success('回复成功')
    await loadData()
  } catch {
    // 请求封装统一展示后端错误，保留回复草稿以便管理员处理后重试。
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
onBeforeUnmount(() => requestId++)
</script>

<template>
  <section class="feedback-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" @submit.prevent="search">
        <el-form-item label="反馈信息">
          <el-input v-model="query.keyWords" clearable placeholder="请输入反馈编号或用户手机号" />
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="query.status">
            <el-option label="全部状态" value="ALL" />
            <el-option
              v-for="option in feedbackStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>意见反馈</h2>
          <p>查看用户提交的反馈及后台回复结果</p>
        </div>
        <el-button :loading="loading" @click="loadData">刷新</el-button>
      </div>
      <div class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          height="100%"
          border
          :empty-text="loadFailed ? '加载失败，请点击刷新重试' : '暂无反馈'"
        >
          <el-table-column prop="feedbackNo" label="反馈编号" min-width="190" fixed="left" />
          <el-table-column label="用户" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ displayUser(row) }}</template>
          </el-table-column>
          <el-table-column prop="type" label="反馈类型" min-width="120" show-overflow-tooltip />
          <el-table-column prop="content" label="反馈内容" min-width="280" show-overflow-tooltip />
          <el-table-column label="处理状态" width="105" align="center">
            <template #default="{ row }">
              <el-tag :type="statusOption(row.status)?.type ?? 'info'">
                {{ statusOption(row.status)?.label ?? row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="后台回复" min-width="280" show-overflow-tooltip>
            <template #default="{ row }">{{ row.reply || '—' }}</template>
          </el-table-column>
          <el-table-column label="处理管理员 ID" width="135">
            <template #default="{ row }">{{ row.adminId ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="提交时间" width="180">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="完成时间" width="180">
            <template #default="{ row }">{{ formatDate(row.completedAt) }}</template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">查看详情</el-button>
              <el-button v-if="canReply(row)" link type="primary" @click="openReply(row)"
                >回复</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination-wrap">
        <el-pagination
          :current-page="pagination.pageNum"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :disabled="loading"
          @update:current-page="changePage($event, pagination.pageSize)"
          @update:page-size="changePage(pagination.pageNum, $event)"
        />
      </div>
    </div>
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'reply' ? '回复反馈' : '反馈详情'"
      width="720px"
      destroy-on-close
      :close-on-click-modal="false"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
    >
      <template v-if="selectedFeedback">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="反馈编号">{{
            selectedFeedback.feedbackNo
          }}</el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="statusOption(selectedFeedback.status)?.type ?? 'info'">
              {{ statusOption(selectedFeedback.status)?.label ?? selectedFeedback.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用户">{{
            displayUser(selectedFeedback)
          }}</el-descriptions-item>
          <el-descriptions-item label="反馈类型">{{ selectedFeedback.type }}</el-descriptions-item>
          <el-descriptions-item label="反馈内容" :span="2">
            <div class="feedback-text">{{ selectedFeedback.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="后台回复" :span="2">
            <div class="feedback-text">{{ selectedFeedback.reply || '暂无回复' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="处理管理员 ID">{{
            selectedFeedback.adminId ?? '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{
            formatDate(selectedFeedback.createdAt)
          }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{
            formatDate(selectedFeedback.completedAt)
          }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{
            formatDate(selectedFeedback.updatedAt)
          }}</el-descriptions-item>
        </el-descriptions>
        <el-form
          v-if="dialogMode === 'reply'"
          class="reply-form"
          label-position="top"
          @submit.prevent="submitReply"
        >
          <el-form-item label="回复内容" required :error="replyError">
            <el-input
              v-model="replyContent"
              type="textarea"
              :rows="5"
              :maxlength="5000"
              show-word-limit
              :disabled="submitting"
              placeholder="请输入对用户反馈的回复内容"
              @input="replyError = ''"
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button :disabled="submitting" @click="dialogVisible = false">{{
          dialogMode === 'reply' ? '取消' : '关闭'
        }}</el-button>
        <el-button
          v-if="dialogMode === 'reply'"
          type="primary"
          :loading="submitting"
          @click="submitReply"
          >提交回复</el-button
        >
        <el-button
          v-else-if="selectedFeedback && canReply(selectedFeedback)"
          type="primary"
          @click="openReply(selectedFeedback)"
          >回复</el-button
        >
      </template>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
.filter-card,
.table-card {
  padding: 20px 22px;
  background: #fff;
  border: 1px solid var(--jfx-border);
  border-radius: 10px;
}

.filter-card {
  padding-bottom: 2px;

  .el-input {
    width: 280px;
  }

  .el-select {
    width: 160px;
  }
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 17px;
  }

  p {
    margin: 6px 0 0;
    color: var(--jfx-muted);
    font-size: 12px;
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
  overflow-x: auto;
}
.feedback-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.6;
}

.reply-form {
  margin-top: 22px;
}
</style>
