<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { constructionServiceApi } from '@/api/constructionServices'
import ConstructionServiceEditorDialog from './ConstructionServiceEditorDialog.vue'
import type { ConstructionService } from '@/types/constructionService'

const loading = ref(false)
const rows = ref<ConstructionService[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const editingId = ref<number>()
const pagination = reactive({ pageNum: 1, pageSize: 10 })

// 将未知异常转换为可展示的错误消息。
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'
// 将接口日期转换为本地日期时间文本。
const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false })
// 将价格统一显示为两位小数。
const formatPrice = (value: number | string) => Number(value).toFixed(2)

// 按当前分页加载商品服务列表。
const loadData = async () => {
  loading.value = true
  try {
    const { data } = await constructionServiceApi.list(pagination)
    rows.value = data.list
    total.value = data.total
    pagination.pageNum = data.pageNum
    pagination.pageSize = data.pageSize
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    loading.value = false
  }
}

// 打开新增商品服务弹窗。
const openCreate = () => {
  editingId.value = undefined
  dialogVisible.value = true
}

// 打开指定商品服务的编辑弹窗。
const openEdit = (row: ConstructionService) => {
  editingId.value = row.id
  dialogVisible.value = true
}

// 快速更新商品服务的启停状态。
const setStatus = async (row: ConstructionService, isEnabled: boolean) => {
  try {
    await constructionServiceApi.update(row.id, { isEnabled })
    ElMessage.success(isEnabled ? '商品服务已启用' : '商品服务已停用')
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    await loadData()
  }
}

// 确认后删除商品服务并刷新当前列表。
const remove = async (row: ConstructionService) => {
  try {
    await ElMessageBox.confirm(`删除“${row.name}”后无法恢复，确定继续吗？`, '删除商品服务', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    await constructionServiceApi.remove(row.id)
    ElMessage.success('商品服务已删除')
    if (rows.value.length === 1 && pagination.pageNum > 1) pagination.pageNum--
    await loadData()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
  }
}

// 切换每页数量并从第一页重新加载。
const changePageSize = () => {
  pagination.pageNum = 1
  loadData()
}

onMounted(loadData)
</script>

<template>
  <section class="services-page fill-page-layout">
    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>商品服务</h2>
          <p>维护保护、拆除、保洁、防水和安装等按单位计价的服务</p>
        </div>
        <el-button type="primary" @click="openCreate">新增商品服务</el-button>
      </div>
      <div class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          height="100%"
          border
          empty-text="暂无商品服务"
        >
          <el-table-column label="服务信息" min-width="260" fixed="left">
            <template #default="{ row }"
              ><div class="service-cell">
                <el-image
                  v-if="row.image"
                  :src="row.image"
                  fit="cover"
                  :preview-src-list="[row.image]"
                  preview-teleported
                />
                <div v-else class="image-empty">暂无图片</div>
                <div>
                  <strong>{{ row.name }}</strong
                  ><small>{{ row.description || '暂无服务说明' }}</small>
                </div>
              </div></template
            >
          </el-table-column>
          <el-table-column label="单价" width="150" align="right"
            ><template #default="{ row }"
              ><strong class="price">¥{{ formatPrice(row.unitPrice) }}</strong> /
              {{ row.unit }}</template
            ></el-table-column
          >
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column label="状态" width="100" align="center"
            ><template #default="{ row }"
              ><el-switch
                :model-value="row.isEnabled"
                inline-prompt
                active-text="启"
                inactive-text="停"
                @change="setStatus(row, Boolean($event))" /></template
          ></el-table-column>
          <el-table-column label="更新时间" width="175"
            ><template #default="{ row }">{{
              formatDate(row.updatedAt)
            }}</template></el-table-column
          >
          <el-table-column label="操作" width="130" fixed="right"
            ><template #default="{ row }"
              ><el-button link type="primary" @click="openEdit(row)">编辑</el-button
              ><el-button link type="danger" @click="remove(row)">删除</el-button></template
            ></el-table-column
          >
        </el-table>
      </div>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @current-change="loadData"
          @size-change="changePageSize"
        />
      </div>
    </div>
    <ConstructionServiceEditorDialog
      v-model="dialogVisible"
      :service-id="editingId"
      @saved="loadData"
    />
  </section>
</template>

<style scoped lang="scss">
.table-card {
  padding: 20px 22px;
  background: #fff;
  border: 1px solid var(--jfx-border);
  border-radius: 10px;
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
.service-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  .el-image,
  .image-empty {
    flex: 0 0 64px;
    width: 64px;
    height: 48px;
    border-radius: 6px;
  }
  .image-empty {
    display: grid;
    place-items: center;
    color: var(--jfx-muted);
    background: #f4f5f7;
    font-size: 11px;
  }
  strong,
  small {
    display: block;
  }
  small {
    max-width: 300px;
    margin-top: 6px;
    overflow: hidden;
    color: var(--jfx-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.price {
  color: #f56c6c;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}
</style>
