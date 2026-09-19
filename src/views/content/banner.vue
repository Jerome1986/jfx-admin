<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { bannerApi } from '@/api/banner'
import type { Banner, BannerInput } from '@/types/banner'

// 标记数据是否正在加载。
const loading = ref(false)
// 标记表单是否正在提交。
const submitting = ref(false)
// 控制编辑弹窗的显示状态。
const dialogVisible = ref(false)
// 引用表单实例，用于校验和重置。
const formRef = ref<FormInstance>()
// 保存列表展示数据。
const rows = ref<Banner[]>([])
// 保存当前编辑记录的 ID。
const editingId = ref<number>()
// 配置图片上传接口地址。
const uploadUrl = 'https://a9lhd8buo8.sealoshzh.site/upload/images'
// 保存列表筛选条件。
const query = reactive({ title: '', status: '' })
// 保存表单编辑数据。
const form = reactive<BannerInput>({
  title: '',
  image: '',
  sort: 0,
  status: 'PUBLISHED',
})

// 计算符合筛选条件的列表数据。
const filteredRows = computed(() =>
  rows.value.filter(
    (item) =>
      (!query.title || item.title.includes(query.title.trim())) &&
      (!query.status || item.status === query.status),
  ),
)

// 定义表单字段校验规则。
const rules: FormRules<BannerInput> = {
  title: [{ required: true, message: '请输入轮播图标题', trigger: 'blur' }],
  image: [{ required: true, message: '请上传轮播图片', trigger: 'change' }],
}

// 加载轮播图列表。
const loadBanners = async () => {
  loading.value = true
  try {
    // 获取接口返回的业务数据。
    const { data } = await bannerApi.list()
    rows.value = Array.isArray(data) ? data : data.list
  } finally {
    loading.value = false
  }
}

// 将表单恢复为初始数据。
const resetForm = () => {
  editingId.value = undefined
  Object.assign(form, {
    title: '',
    image: '',
    sort: 0,
    status: 'PUBLISHED',
  })
}

// 保存上传成功后的图片地址。
const handleUploadSuccess: UploadProps['onSuccess'] = (response) => {
  if (typeof response !== 'string') return ElMessage.error('上传接口未返回图片地址')
  form.image = response
  formRef.value?.validateField('image').catch(() => undefined)
  ElMessage.success('图片上传成功')
}

// 提示图片上传失败。
const handleUploadError: UploadProps['onError'] = () => ElMessage.error('图片上传失败')

// 处理图片上传前的检查。
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (file.type.startsWith('image/')) return true
  ElMessage.warning('只能上传图片文件')
  return false
}

// 清空已上传的图片。
const removeImage = () => {
  form.image = ''
  formRef.value?.validateField('image').catch(() => undefined)
}

// 初始化并打开新增弹窗。
const openCreate = () => {
  resetForm()
  dialogVisible.value = true
}

// 设置编辑记录并打开编辑弹窗。
const openEdit = (row: Banner) => {
  editingId.value = row.id
  Object.assign(form, {
    title: row.title,
    image: row.image,
    sort: row.sort,
    status: row.status,
  })
  dialogVisible.value = true
}

// 校验表单并提交保存。
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
    // 组装接口提交数据。
    const payload: BannerInput = {
      title: form.title,
      image: form.image,
      sort: form.sort,
      status: form.status,
    }
    if (editingId.value) await bannerApi.update(editingId.value, payload)
    else await bannerApi.create(payload)
    ElMessage.success(editingId.value ? '轮播图更新成功' : '轮播图新增成功')
    dialogVisible.value = false
    await loadBanners()
  } finally {
    submitting.value = false
  }
}

// 确认后删除当前记录并刷新列表。
const remove = async (row: Banner) => {
  try {
    await ElMessageBox.confirm(`确定删除“${row.title}”吗？`, '删除轮播图', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await bannerApi.remove(row.id)
    ElMessage.success('轮播图已删除')
    await loadBanners()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  }
}

// 获取状态对应的显示文本。
const statusText = (status: string) =>
  ({ DRAFT: '草稿', PUBLISHED: '已发布', OFFLINE: '已下架' })[status] || status

// 页面挂载后加载初始数据。
onMounted(loadBanners)
</script>

<template>
  <section class="banner-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="标题">
          <el-input v-model="query.title" clearable placeholder="请输入轮播图标题" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="已下架" value="OFFLINE" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>轮播图管理</h2>
          <p>维护轮播图图片、排序和发布状态</p>
        </div>
        <el-button type="primary" @click="openCreate">新增轮播图</el-button>
      </div>
      <div class="fill-content-body">
        <el-table v-loading="loading" :data="filteredRows" row-key="id" height="100%" border>
          <el-table-column label="图片" width="150">
            <template #default="{ row }"
              ><el-image class="banner-image" :src="row.image" fit="cover"
            /></template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="150" />
          <el-table-column prop="sort" label="排序" width="70" align="center" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag
                :type="
                  row.status === 'PUBLISHED'
                    ? 'success'
                    : row.status === 'OFFLINE'
                      ? 'warning'
                      : 'info'
                "
              >
                {{ statusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑轮播图' : '新增轮播图'"
      width="620px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="轮播图片" prop="image">
          <div class="upload-wrap">
            <el-upload
              class="banner-uploader"
              :action="uploadUrl"
              :show-file-list="false"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
            >
              <img v-if="form.image" :src="form.image" alt="轮播图片" />
              <el-icon v-else><Plus /></el-icon>
            </el-upload>
            <el-button v-if="form.image" :icon="Delete" circle @click="removeImage" />
          </div>
        </el-form-item>
        <el-form-item label="排序" prop="sort"
          ><el-input-number v-model="form.sort" :min="0"
        /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status"
            ><el-radio value="DRAFT">草稿</el-radio><el-radio value="PUBLISHED">已发布</el-radio
            ><el-radio value="OFFLINE">已下架</el-radio></el-radio-group
          >
        </el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="dialogVisible = false">取消</el-button
        ><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></template
      >
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
}
.filter-card .el-input,
.filter-card .el-select {
  width: 220px;
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.table-toolbar h2 {
  margin: 0;
  font-size: 17px;
}
.table-toolbar p {
  margin: 6px 0 0;
  color: var(--jfx-muted);
  font-size: 12px;
}
.banner-image {
  width: 120px;
  height: 60px;
  border-radius: 5px;
}
.upload-wrap {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.banner-uploader :deep(.el-upload) {
  display: grid;
  width: 240px;
  height: 120px;
  overflow: hidden;
  place-items: center;
  border: 1px dashed #c7cbd1;
  border-radius: 8px;
  cursor: pointer;
}
.banner-uploader img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.banner-uploader .el-icon {
  color: var(--jfx-muted);
  font-size: 28px;
}
</style>
