<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import * as AMapLoader from '@amap/amap-jsapi-loader'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { serviceCityApi } from '@/api/serviceCities'
import { serviceOutletApi } from '@/api/serviceOutlets'
import type { ServiceCity } from '@/types/serviceCity'
import type {
  ServiceOutlet,
  AmapMapInstance,
  AmapMarkerInstance,
  AmapRawPoi,
  AmapRuntime,
  ServiceOutletForm,
  ServiceOutletInput,
  ServiceOutletListParams,
  ServiceOutletPoi,
} from '@/types/serviceOutlet'

// 创建空白表单及默认值。
const emptyForm = (): ServiceOutletForm => ({
  name: '',
  businessHours: '',
  phone: '',
  province: '',
  cityId: undefined,
  district: '',
  address: '',
  latitude: undefined,
  longitude: undefined,
  cover: '',
  sort: 0,
  status: true,
})
// 配置图片上传接口地址。
const uploadUrl = 'https://a9lhd8buo8.sealoshzh.site/upload/images'
// 标记数据是否正在加载。
const loading = ref(false)
// 标记表单是否正在提交。
const submitting = ref(false)
// 标记详情是否正在加载。
const detailLoading = ref(false)
// 控制编辑弹窗的显示状态。
const dialogVisible = ref(false)
// 引用表单实例，用于校验和重置。
const formRef = ref<FormInstance>()
// 引用地图挂载容器。
const mapContainerRef = ref<HTMLElement>()
// 保存当前编辑记录的 ID。
const editingId = ref<number>()
// 保存列表展示数据。
const rows = ref<ServiceOutlet[]>([])
// 保存可选择的服务城市。
const cityOptions = ref<ServiceCity[]>([])
// 保存列表记录总数。
const total = ref(0)
// 保存列表筛选条件。
const query = reactive({ keyword: '', cityId: '' as '' | number, status: '' as '' | boolean })
// 保存当前页码和每页条数。
const pagination = reactive({ pageNum: 1, pageSize: 10 })
// 保存表单编辑数据。
const form = reactive<ServiceOutletForm>(emptyForm())
// 保存地图地点搜索关键字。
const mapKeyword = ref('')
// 标记地图是否正在初始化。
const mapLoading = ref(false)
// 标记地点是否正在搜索。
const searching = ref(false)
// 保存地图加载失败的提示。
const mapError = ref('')
// 保存地点搜索的状态提示。
const searchMessage = ref('请输入关键词搜索地点')
// 保存地图地点搜索结果。
const poiResults = ref<ServiceOutletPoi[]>([])
// 保存当前选中地点的标识。
const selectedPoiId = ref('')
// 保存高德地图运行时对象。
let amap: AmapRuntime | undefined
// 保存当前地图实例。
let map: AmapMapInstance | undefined
// 保存地图上已绘制的标记。
let markers: AmapMarkerInstance[] = []

// 定义表单字段校验规则。
const rules: FormRules<ServiceOutletForm> = {
  name: [{ required: true, message: '请输入网点名称', trigger: 'blur' }],
  businessHours: [{ required: true, message: '请输入营业时间', trigger: 'blur' }],
  cityId: [{ required: true, message: '请选择城市', trigger: 'change' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  latitude: [
    {
      // 校验是否已通过地图选择有效坐标。
      validator: (_rule, value, callback) =>
        typeof value === 'number' ? callback() : callback(new Error('请通过地图选择地点')),
      trigger: 'change',
    },
  ],
  sort: [{ required: true, message: '请输入排序值', trigger: 'change' }],
}

// 将地图返回的文本或数组统一为文本。
const textValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || '' : value || ''

// 清除地图上的全部标记。
const clearMarkers = () => {
  markers.forEach((marker) => marker.setMap(null))
  markers = []
}

// 将选中地点的坐标和地址填入表单。
const selectPoi = (poi: ServiceOutletPoi) => {
  selectedPoiId.value = poi.id
  form.longitude = poi.longitude
  form.latitude = poi.latitude
  form.province = poi.province || form.province
  form.district = poi.district || form.district
  form.address = poi.address || poi.name
  map?.setZoomAndCenter(17, [poi.longitude, poi.latitude])
  formRef.value?.validateField('latitude').catch(() => undefined)
}

// 在地图上绘制搜索结果标记。
const drawPoiMarkers = () => {
  if (!amap || !map) return
  clearMarkers()
  markers = poiResults.value.map((poi) => {
    // 创建当前地点的地图标记。
    const marker = new amap!.Marker({
      map,
      position: [poi.longitude, poi.latitude],
      title: poi.name,
    })
    marker.on('click', () => selectPoi(poi))
    return marker
  })
  if (markers.length) map.setFitView(markers, false)
}

// 在地图上标记表单中的当前位置。
const drawCurrentPoint = () => {
  if (!amap || !map || form.longitude === undefined || form.latitude === undefined) return
  clearMarkers()
  // 创建当前地点的地图标记。
  const marker = new amap.Marker({
    map,
    position: [form.longitude, form.latitude],
    title: form.name || '当前网点',
  })
  markers = [marker]
  map.setZoomAndCenter(17, [form.longitude, form.latitude])
}

// 将地图原始地点转换为页面需要的数据。
const normalizePoi = (poi: AmapRawPoi, index: number): ServiceOutletPoi | undefined => {
  if (!poi.location) return undefined
  return {
    id: poi.id || `${poi.location.getLng()}-${poi.location.getLat()}-${index}`,
    name: poi.name || '未命名地点',
    address: textValue(poi.address),
    province: textValue(poi.pname),
    city: textValue(poi.cityname),
    district: textValue(poi.adname),
    longitude: poi.location.getLng(),
    latitude: poi.location.getLat(),
  }
}

// 按关键字和城市搜索地图地点。
const searchPlaces = async () => {
  // 整理用于搜索匹配的关键字。
  const keyword = mapKeyword.value.trim()
  if (!keyword) return ElMessage.warning('请输入地点关键词')
  if (!amap || !map) return ElMessage.error(mapError.value || '地图尚未加载完成')
  searching.value = true
  searchMessage.value = '正在搜索地点…'
  selectedPoiId.value = ''
  // 获取表单选中的服务城市。
  const selectedCity = cityOptions.value.find((city) => city.id === form.cityId)
  try {
    // 创建地图地点搜索实例。
    const placeSearch = new amap.PlaceSearch({
      city: selectedCity?.name,
      citylimit: Boolean(selectedCity),
      pageSize: 20,
      pageIndex: 1,
    })
    // 等待并保存地图地点搜索结果。
    const result = await new Promise<ServiceOutletPoi[]>((resolve, reject) => {
      placeSearch.search(keyword, (status, response) => {
        if (status !== 'complete' || typeof response === 'string') {
          reject(
            new Error(typeof response === 'string' ? response : response.info || '地点搜索失败'),
          )
          return
        }
        resolve(
          (response.poiList?.pois || [])
            .map(normalizePoi)
            .filter((item): item is ServiceOutletPoi => Boolean(item)),
        )
      })
    })
    poiResults.value = result
    searchMessage.value = result.length ? '' : '未找到匹配地点，请更换关键词'
    drawPoiMarkers()
  } catch (error) {
    poiResults.value = []
    clearMarkers()
    searchMessage.value = error instanceof Error ? error.message : '地点搜索失败'
    ElMessage.error(searchMessage.value)
  } finally {
    searching.value = false
  }
}

// 加载地图服务并初始化地图。
const initMap = async () => {
  await nextTick()
  if (!mapContainerRef.value || map) return
  // 读取地图服务的访问密钥配置。
  const key = import.meta.env.VITE_AMAP_KEY?.trim()
  // 读取地图服务的安全校验配置。
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_CODE?.trim()
  if (!key || !securityJsCode) {
    mapError.value = '缺少高德地图环境变量，请配置 VITE_AMAP_KEY 和 VITE_AMAP_SECURITY_CODE'
    return
  }
  mapLoading.value = true
  mapError.value = ''
  try {
    ; (
      window as Window & {
        _AMapSecurityConfig?: { securityJsCode: string }
      }
    )._AMapSecurityConfig = { securityJsCode }
    amap = (await AMapLoader.load({
      key,
      version: '2.0',
      plugins: ['AMap.PlaceSearch'],
    })) as unknown as AmapRuntime
    map = new amap.Map(mapContainerRef.value, { zoom: 11, resizeEnable: true })
    drawCurrentPoint()
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '高德地图加载失败'
  } finally {
    mapLoading.value = false
  }
}

// 销毁地图实例并清理关联状态。
const destroyMap = () => {
  clearMarkers()
  map?.destroy()
  map = undefined
  amap = undefined
  poiResults.value = []
  selectedPoiId.value = ''
  searchMessage.value = '请输入关键词搜索地点'
  mapError.value = ''
  formRef.value?.resetFields()
}

// 将日期转换为页面显示文本。
const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false })
// 获取网点所属城市的显示名称。
const cityName = (row: ServiceOutlet) => row.serviceCity?.name ?? row.cityName ?? ''
// 拼接用于展示的完整地址。
const fullAddress = (row: ServiceOutlet) =>
  [row.province, cityName(row), row.district, row.address].filter(Boolean).join(' ')

// 加载已启用的服务城市选项。
const loadCityOptions = async () => {
  // 获取接口返回的业务数据。
  const { data } = await serviceCityApi.enabled()
  cityOptions.value = data
}

// 加载列表数据并更新页面状态。
const loadData = async () => {
  loading.value = true
  try {
    // 组装列表查询和分页参数。
    const params: ServiceOutletListParams = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    }
    if (query.keyword.trim()) params.keyword = query.keyword.trim()
    if (query.cityId !== '') params.cityId = query.cityId
    if (query.status !== '') params.status = query.status
    // 获取接口返回的业务数据。
    const { data } = await serviceOutletApi.list(params)
    rows.value = data.list
    total.value = data.total
    pagination.pageNum = data.pageNum
    pagination.pageSize = data.pageSize
  } finally {
    loading.value = false
  }
}

// 应用当前筛选条件查询列表。
const search = () => {
  pagination.pageNum = 1
  loadData()
}
// 清空筛选条件并更新列表。
const resetQuery = () => {
  Object.assign(query, { keyword: '', cityId: '', status: '' })
  search()
}
// 初始化并打开新增弹窗。
const openCreate = () => {
  editingId.value = undefined
  Object.assign(form, emptyForm())
  mapKeyword.value = ''
  dialogVisible.value = true
}
// 将详情数据填入编辑表单。
const fillForm = (row: ServiceOutlet) =>
  Object.assign(form, {
    name: row.name,
    businessHours: row.businessHours,
    phone: row.phone || '',
    province: row.province || '',
    cityId: row.cityId,
    district: row.district || '',
    address: row.address,
    latitude: row.latitude == null ? undefined : Number(row.latitude),
    longitude: row.longitude == null ? undefined : Number(row.longitude),
    cover: row.cover || '',
    sort: row.sort,
    status: row.status,
  })

// 设置编辑记录并打开编辑弹窗。
const openEdit = async (row: ServiceOutlet) => {
  editingId.value = row.id
  fillForm(row)
  mapKeyword.value = row.name
  dialogVisible.value = true
  detailLoading.value = true
  try {
    // 获取接口返回的业务数据。
    const { data } = await serviceOutletApi.detail(row.id)
    if (data.serviceCity && !cityOptions.value.some((city) => city.id === data.serviceCity?.id)) {
      cityOptions.value.push(data.serviceCity)
    }
    fillForm(data)
    mapKeyword.value = data.name
    drawCurrentPoint()
  } finally {
    detailLoading.value = false
  }
}

// 去除文本首尾空格，并将空值转为未填写。
const optionalText = (value: string) => value.trim() || undefined
// 从网点表单组装接口提交参数。
const buildPayload = (): ServiceOutletInput => ({
  name: form.name.trim(),
  businessHours: form.businessHours.trim(),
  ...(optionalText(form.phone) && { phone: form.phone.trim() }),
  ...(optionalText(form.province) && { province: form.province.trim() }),
  cityId: form.cityId!,
  ...(optionalText(form.district) && { district: form.district.trim() }),
  address: form.address.trim(),
  ...(typeof form.latitude === 'number' && { latitude: form.latitude }),
  ...(typeof form.longitude === 'number' && { longitude: form.longitude }),
  ...(optionalText(form.cover) && { cover: form.cover.trim() }),
  sort: form.sort,
  status: form.status,
})

// 校验表单并提交保存。
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  submitting.value = true
  try {
    // 组装接口提交数据。
    const payload = buildPayload()
    if (editingId.value !== undefined) await serviceOutletApi.update(editingId.value, payload)
    else await serviceOutletApi.create(payload)
    ElMessage.success(editingId.value !== undefined ? '网点更新成功' : '网点新增成功')
    dialogVisible.value = false
    await loadData()
  } finally {
    submitting.value = false
  }
}

// 确认并切换当前记录的启用状态。
const toggleStatus = async (row: ServiceOutlet) => {
  // 生成本次状态切换的操作名称。
  const action = row.status ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}“${row.name}”吗？`, `${action}网点`, {
      type: row.status ? 'warning' : 'info',
      confirmButtonText: `确认${action}`,
      cancelButtonText: '取消',
    })
    await serviceOutletApi.update(row.id, { status: !row.status })
    ElMessage.success(`网点已${action}`)
    await loadData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  }
}

// 确认后删除当前记录并刷新列表。
const remove = async (row: ServiceOutlet) => {
  try {
    await ElMessageBox.confirm(`删除“${row.name}”后无法恢复，确定继续吗？`, '删除网点', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    await serviceOutletApi.remove(row.id)
    if (rows.value.length === 1 && pagination.pageNum > 1) pagination.pageNum--
    ElMessage.success('网点已删除')
    await loadData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  }
}

// 处理图片上传前的检查。
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (file.type.startsWith('image/')) return true
  ElMessage.warning('只能上传图片文件')
  return false
}
// 处理上传成功并回填图片地址。
const uploadSuccess: UploadProps['onSuccess'] = (response) => {
  if (typeof response !== 'string') return ElMessage.error('上传接口未返回图片地址')
  form.cover = response
  ElMessage.success('封面上传成功')
}
// 提示图片上传失败。
const uploadError: UploadProps['onError'] = () => ElMessage.error('封面上传失败')

// 页面挂载后加载初始数据。
onMounted(() => Promise.all([loadData(), loadCityOptions()]))
</script>

<template>
  <section class="outlets-page fill-page-layout">
    <div class="filter-card">
      <el-form :inline="true" :model="query" @submit.prevent="search">
        <el-form-item label="关键词"><el-input v-model="query.keyword" clearable placeholder="网点名称、地址或电话" /></el-form-item>
        <el-form-item label="城市"><el-select v-model="query.cityId" clearable filterable placeholder="全部城市"><el-option
              v-for="city in cityOptions" :key="city.id" :label="city.name"
              :value="city.id" /></el-select></el-form-item>
        <el-form-item label="状态"><el-select v-model="query.status" clearable placeholder="全部状态"><el-option label="启用"
              :value="true" /><el-option label="停用" :value="false" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit">搜索</el-button><el-button
            @click="resetQuery">重置</el-button></el-form-item>
      </el-form>
    </div>

    <div class="table-card fill-content-card">
      <div class="table-toolbar">
        <div>
          <h2>服务网点管理</h2>
          <p>维护网点地址、营业信息和启用状态</p>
        </div>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增网点</el-button>
      </div>
      <div class="fill-content-body">
        <el-table v-loading="loading" :data="rows" row-key="id" height="100%" border empty-text="暂无服务网点">
          <el-table-column label="网点" min-width="210" fixed="left"><template #default="{ row }">
              <div class="outlet-cell">
                <el-image v-if="row.cover" :src="row.cover" fit="cover" preview-teleported
                  :preview-src-list="[row.cover]" />
                <div v-else class="cover-empty">暂无图片</div>
                <div>
                  <strong>{{ row.name }}</strong><small>{{ row.phone || '暂无电话' }}</small>
                </div>
              </div>
            </template></el-table-column>
          <el-table-column label="地址" min-width="280"><template #default="{ row }">{{ fullAddress(row)
              }}</template></el-table-column>
          <el-table-column prop="businessHours" label="营业时间" min-width="190" />
          <el-table-column prop="sort" label="排序" width="75" align="center" />
          <el-table-column label="状态" width="80" align="center"><template #default="{ row }"><el-tag
                :type="row.status ? 'success' : 'info'">{{
                  row.status ? '启用' : '停用'
                }}</el-tag></template></el-table-column>
          <el-table-column label="更新时间" width="170"><template #default="{ row }">{{
            formatDate(row.updatedAt)
              }}</template></el-table-column>
          <el-table-column label="操作" width="170" fixed="right"><template #default="{ row }"><el-button link
                type="primary" @click="openEdit(row)">编辑</el-button><el-button link
                :type="row.status ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status ? '停用' : '启用'
                }}</el-button><el-button link type="danger"
                @click="remove(row)">删除</el-button></template></el-table-column>
        </el-table>
      </div>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="pagination.pageNum" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total"
          @current-change="loadData" @size-change="search" />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId !== undefined ? '编辑服务网点' : '新增服务网点'" width="980px"
      destroy-on-close :close-on-click-modal="false" @opened="initMap" @closed="destroyMap">
      <el-form ref="formRef" v-loading="detailLoading" :model="form" :rules="rules" label-width="92px">
        <div class="form-grid">
          <el-form-item label="网点名称" prop="name" class="span-2"><el-input v-model="form.name" maxlength="100"
              show-word-limit /></el-form-item>
          <el-form-item label="营业时间" prop="businessHours" class="span-2"><el-input v-model="form.businessHours"
              placeholder="如：周一至周日 09:00-18:00" /></el-form-item>
          <el-form-item label="联系电话"><el-input v-model="form.phone" placeholder="选填" /></el-form-item><el-form-item
            label="省份"><el-input v-model="form.province" placeholder="选填" /></el-form-item>
          <el-form-item label="城市" prop="cityId"><el-select v-model="form.cityId" filterable
              placeholder="请选择服务城市"><el-option v-for="city in cityOptions" :key="city.id" :label="city.name"
                :value="city.id" :disabled="!city.status" /></el-select></el-form-item>
          <el-form-item label="区县"><el-input v-model="form.district" placeholder="选填" /></el-form-item>
          <el-form-item label="详细地址" prop="address" class="span-2"><el-input v-model="form.address" /></el-form-item>
          <el-form-item label="排序" prop="sort"><el-input-number v-model="form.sort" :min="0" :step="1" :precision="0"
              controls-position="right" /></el-form-item><el-form-item label="状态"><el-switch v-model="form.status"
              inline-prompt active-text="启用" inactive-text="停用" /></el-form-item>
          <el-form-item label="封面图片" class="span-2">
            <div class="upload-wrap">
              <el-upload class="cover-uploader" :action="uploadUrl" :show-file-list="false"
                :before-upload="beforeUpload" :on-success="uploadSuccess" :on-error="uploadError"><img v-if="form.cover"
                  :src="form.cover" alt="网点封面" /><el-icon v-else>
                  <Plus />
                </el-icon></el-upload>
              <el-button v-if="form.cover" :icon="Delete" @click="form.cover = ''">移除图片</el-button>
            </div>
          </el-form-item>
          <el-form-item label="地图选点" prop="latitude" class="span-2 map-form-item">
            <div class="map-picker">
              <div class="map-search">
                <el-input v-model="mapKeyword" clearable placeholder="请输入门店、道路或地标名称" @keyup.enter="searchPlaces" />
                <el-button type="primary" :loading="searching" @click="searchPlaces">搜索</el-button>
              </div>
              <div class="map-content">
                <div v-loading="mapLoading" class="map-canvas-wrap">
                  <div ref="mapContainerRef" class="map-canvas"></div>
                  <el-empty v-if="mapError" class="map-error" :description="mapError" :image-size="64" />
                </div>
                <div class="poi-panel">
                  <div v-if="form.longitude !== undefined && form.latitude !== undefined" class="selected-coordinate">
                    已选坐标：{{ form.longitude.toFixed(7) }}, {{ form.latitude.toFixed(7) }}
                  </div>
                  <div v-if="poiResults.length" class="poi-list">
                    <button v-for="poi in poiResults" :key="poi.id" type="button" class="poi-item"
                      :class="{ 'is-selected': selectedPoiId === poi.id }" @click="selectPoi(poi)">
                      <strong>{{ poi.name }}</strong>
                      <span>{{
                        [poi.district, poi.address].filter(Boolean).join(' ') || '暂无地址'
                        }}</span>
                    </button>
                  </div>
                  <el-empty v-else :description="searchMessage" :image-size="64" />
                </div>
              </div>
            </div>
          </el-form-item>
        </div>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary"
          :loading="submitting" :disabled="detailLoading" @click="submit">保存</el-button></template>
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
    width: 210px;
  }

  .el-select {
    width: 140px;
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

.outlet-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .el-image,
  .cover-empty {
    flex: 0 0 64px;
    width: 64px;
    height: 44px;
    border-radius: 5px;
  }

  .cover-empty {
    display: grid;
    place-items: center;
    color: var(--jfx-muted);
    background: #f4f5f7;
    font-size: 10px;
  }

  strong,
  small {
    display: block;
  }

  strong {
    margin-bottom: 6px;
  }

  small {
    color: var(--jfx-muted);
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 18px;

  .span-2 {
    grid-column: 1 / -1;
  }

  .el-input-number {
    width: 100%;
  }

  .el-select {
    width: 100%;
  }
}

.upload-wrap {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 12px;
}

.cover-uploader :deep(.el-upload) {
  display: grid;
  width: 180px;
  height: 100px;
  overflow: hidden;
  place-items: center;
  border: 1px dashed #c7cbd1;
  border-radius: 8px;
  cursor: pointer;
}

.cover-uploader img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-uploader .el-icon {
  color: var(--jfx-muted);
  font-size: 28px;
}

.outlets-page :deep(.el-dialog__body) {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

.map-form-item :deep(.el-form-item__content) {
  display: block;
}

.map-picker {
  width: 100%;
}

.map-search {
  display: flex;
  margin-bottom: 12px;
  gap: 10px;
}

.map-content {
  display: grid;
  height: 340px;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 12px;
}

.map-canvas-wrap,
.poi-panel {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--jfx-border);
  border-radius: 6px;
}

.map-canvas {
  width: 100%;
  height: 100%;
}

.map-error {
  position: absolute;
  z-index: 2;
  inset: 0;
  background: #fff;
}

.poi-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
}

.selected-coordinate {
  padding: 10px 12px;
  color: #606266;
  background: #f7f8fa;
  border-bottom: 1px solid var(--jfx-border);
  font-size: 12px;
}

.poi-list {
  flex: 1;
  overflow-y: auto;
}

.poi-item {
  display: block;
  width: 100%;
  padding: 11px 12px;
  color: var(--jfx-text);
  text-align: left;
  background: #fff;
  border: 0;
  border-bottom: 1px solid #f0f1f3;
  cursor: pointer;

  strong,
  span {
    display: block;
  }

  strong {
    margin-bottom: 5px;
    font-size: 13px;
  }

  span {
    overflow: hidden;
    color: var(--jfx-muted);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover,
  &.is-selected {
    background: var(--jfx-primary-light);
  }

  &.is-selected strong {
    color: var(--jfx-primary);
  }
}

@media (max-width: 900px) {
  .map-content {
    height: auto;
    grid-template-columns: 1fr;
  }

  .map-canvas-wrap,
  .poi-panel {
    height: 300px;
  }
}
</style>
