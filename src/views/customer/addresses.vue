<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addressApi } from '@/api/addresses'
import AddressEditorDialog from './AddressEditorDialog.vue'
import type { ServiceAddress } from '@/types/address'

const loading = ref(false)
const allRows = ref<ServiceAddress[]>([])
const dialogVisible = ref(false)
const editingId = ref<number>()
const editingAddress = ref<ServiceAddress>()
const query = reactive({ keyword: '', city: '', status: '' as '' | boolean })
const pagination = reactive({ pageNum: 1, pageSize: 10 })
const filteredRows = computed(() => {
  const keyword = query.keyword.trim().toLowerCase()
  return allRows.value.filter((row) => {
    const matchesKeyword =
      !keyword ||
      [row.contactName, row.phone, row.locationName, row.address, row.doorplate]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    return (
      matchesKeyword &&
      (!query.city.trim() || row.city.includes(query.city.trim())) &&
      (query.status === '' || row.isEnabled === query.status)
    )
  })
})
const rows = computed(() => {
  const start = (pagination.pageNum - 1) * pagination.pageSize
  return filteredRows.value.slice(start, start + pagination.pageSize)
})
const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试'
const fullAddress = (row: ServiceAddress) =>
  [row.province, row.city, row.district, row.address, row.doorplate].filter(Boolean).join('') || '—'
const loadData = async () => {
  loading.value = true
  try {
    const { data } = await addressApi.list()
    allRows.value = Array.isArray(data) ? data : data.list
    pagination.pageNum = Math.min(
      pagination.pageNum,
      Math.max(1, Math.ceil(filteredRows.value.length / pagination.pageSize)),
    )
  } catch (error) {
    ElMessage.error(messageOf(error))
  } finally {
    loading.value = false
  }
}
const search = () => {
  pagination.pageNum = 1
}
const resetQuery = () => {
  Object.assign(query, { keyword: '', city: '', status: '' })
  search()
}
const openEdit = (row: ServiceAddress) => {
  editingId.value = row.id
  editingAddress.value = row
  dialogVisible.value = true
}
const setStatus = async (row: ServiceAddress, value: boolean) => {
  try {
    await addressApi.update(row.id, { isEnabled: value })
    ElMessage.success(value ? '地址已启用' : '地址已停用')
    await loadData()
  } catch (error) {
    ElMessage.error(messageOf(error))
  }
}
const setDefault = async (row: ServiceAddress) => {
  if (row.isDefault) return
  try {
    await addressApi.update(row.id, { isDefault: true })
    ElMessage.success('已设为默认地址')
    await loadData()
  } catch (error) {
    ElMessage.error(messageOf(error))
  }
}
const remove = async (row: ServiceAddress) => {
  try {
    await ElMessageBox.confirm(`确定删除“${row.contactName}”的服务地址吗？`, '删除地址', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    await addressApi.remove(row.id)
    ElMessage.success('地址已删除')
    await loadData()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(messageOf(error))
  }
}
onMounted(loadData)
</script>

<template>
  <section class="addresses-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" @submit.prevent="search">
        <el-form-item label="地址信息"
          ><el-input v-model="query.keyword" clearable placeholder="联系人、手机号、地点或详细地址"
        /></el-form-item>
        <el-form-item label="城市"
          ><el-input v-model="query.city" clearable placeholder="请输入城市"
        /></el-form-item>
        <el-form-item label="地址状态"
          ><el-select v-model="query.status" clearable placeholder="全部状态"
            ><el-option label="启用" :value="true" /><el-option
              label="停用"
              :value="false" /></el-select
        ></el-form-item>
        <el-form-item
          ><el-button type="primary" native-type="submit">搜索</el-button
          ><el-button @click="resetQuery">重置</el-button></el-form-item
        >
      </el-form>
    </div>
    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>服务地址</h2>
          <p>管理客户联系人、服务地点及地址可用状态</p>
        </div>
      </div>
      <div class="fill-content-body">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          height="100%"
          border
          empty-text="暂无地址"
        >
          <el-table-column label="联系人" width="150" fixed="left"
            ><template #default="{ row }"
              ><strong>{{ row.contactName }}</strong
              ><br /><small class="muted">{{ row.phone }}</small></template
            ></el-table-column
          >
          <el-table-column label="服务地点" min-width="180"
            ><template #default="{ row }"
              >{{ row.locationName || '—' }}<br /><small class="muted"
                >{{ row.city }}{{ row.district }}</small
              ></template
            ></el-table-column
          >
          <el-table-column label="详细地址" min-width="300" show-overflow-tooltip
            ><template #default="{ row }">{{ fullAddress(row) }}</template></el-table-column
          >
          <el-table-column label="默认" width="85" align="center"
            ><template #default="{ row }"
              ><el-tag v-if="row.isDefault" type="success">默认</el-tag
              ><el-button v-else link type="primary" @click="setDefault(row)"
                >设为默认</el-button
              ></template
            ></el-table-column
          >
          <el-table-column label="状态" width="95" align="center"
            ><template #default="{ row }"
              ><el-switch
                :model-value="row.isEnabled"
                @change="setStatus(row, Boolean($event))" /></template
          ></el-table-column>
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
          :total="filteredRows.length"
          @size-change="search"
        />
      </div>
    </div>
    <AddressEditorDialog
      v-model="dialogVisible"
      :address-id="editingId"
      :address="editingAddress"
      @saved="loadData"
    />
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
    width: 260px;
  }
  .el-select {
    width: 150px;
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
.muted {
  color: var(--jfx-muted);
  line-height: 24px;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}
</style>
