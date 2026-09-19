import type { ServiceCity } from './serviceCity'

export interface ServiceOutlet {
  /** 唯一标识 */
  id: number
  /** 名称 */
  name: string
  /** 网点分类列表 */
  categories: unknown[] | null
  /** 营业时间 */
  businessHours: string
  /** 联系电话 */
  phone: string | null
  /** 所在省份 */
  province: string | null
  /** 所属服务城市标识 */
  cityId: number
  /** 所属城市名称 */
  cityName: string | null
  /** 所在区县 */
  district: string | null
  /** 详细地址 */
  address: string
  /** 纬度 */
  latitude: string | null
  /** 经度 */
  longitude: string | null
  /** 封面图片地址 */
  cover: string | null
  /** 排序值 */
  sort: number
  /** 是否启用 */
  status: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 关联服务城市信息 */
  serviceCity: ServiceCity | null
}

export interface ServiceOutletInput {
  /** 名称 */
  name: string
  /** 营业时间 */
  businessHours: string
  /** 联系电话 */
  phone?: string
  /** 所在省份 */
  province?: string
  /** 所属服务城市标识 */
  cityId: number
  /** 所在区县 */
  district?: string
  /** 详细地址 */
  address: string
  /** 纬度 */
  latitude?: number
  /** 经度 */
  longitude?: number
  /** 封面图片地址 */
  cover?: string
  /** 排序值 */
  sort?: number
  /** 是否启用 */
  status?: boolean
}

export interface ServiceOutletForm {
  /** 名称 */
  name: string
  /** 营业时间 */
  businessHours: string
  /** 联系电话 */
  phone: string
  /** 所在省份 */
  province: string
  /** 所属服务城市标识 */
  cityId: number | undefined
  /** 所在区县 */
  district: string
  /** 详细地址 */
  address: string
  /** 纬度 */
  latitude: number | undefined
  /** 经度 */
  longitude: number | undefined
  /** 封面图片地址 */
  cover: string
  /** 排序值 */
  sort: number
  /** 是否启用 */
  status: boolean
}

export interface ServiceOutletPoi {
  /** 唯一标识 */
  id: string
  /** 名称 */
  name: string
  /** 详细地址 */
  address: string
  /** 所在省份 */
  province: string
  /** 所在城市 */
  city: string
  /** 所在区县 */
  district: string
  /** 经度 */
  longitude: number
  /** 纬度 */
  latitude: number
}

export interface AmapLngLatLike {
  /** 获取经度 */
  getLng(): number
  /** 获取纬度 */
  getLat(): number
}

export interface AmapRawPoi {
  /** 唯一标识 */
  id?: string
  /** 名称 */
  name?: string
  /** 详细地址 */
  address?: string | string[]
  /** 地图返回的省份名称 */
  pname?: string | string[]
  /** 地图返回的城市名称 */
  cityname?: string | string[]
  /** 地图返回的区县名称 */
  adname?: string | string[]
  /** 地点经纬度对象 */
  location?: AmapLngLatLike
}

export interface AmapPlaceSearchResult {
  /** 地点搜索结果集合 */
  poiList?: {
    /** 搜索到的地点列表 */
    pois?: AmapRawPoi[]
  }
  /** 搜索结果提示信息 */
  info?: string
}

export interface AmapMarkerInstance {
  /** 注册地图标记的点击回调 */
  on(event: 'click', callback: () => void): void
  /** 设置标记所属地图，传入空值时移除标记 */
  setMap(map: AmapMapInstance | null): void
}

export interface AmapMapInstance {
  /** 向地图添加标记 */
  add(overlays: AmapMarkerInstance | AmapMarkerInstance[]): void
  /** 清除地图覆盖物 */
  clearMap(): void
  /** 销毁地图实例 */
  destroy(): void
  /** 调整地图视野以显示指定标记 */
  setFitView(overlays?: AmapMarkerInstance[], immediately?: boolean): void
  /** 设置地图缩放级别和中心坐标 */
  setZoomAndCenter(zoom: number, center: [number, number]): void
}

export interface AmapPlaceSearchInstance {
  /** 按关键词搜索地点 */
  search(
    /** 搜索关键词 */
    keyword: string,
    /** 接收地点搜索状态和结果的回调 */
    callback: (status: string, result: AmapPlaceSearchResult | string) => void,
  ): void
}

export interface AmapRuntime {
  /** 地图实例构造函数 */
  Map: new (
    /** 地图挂载容器 */
    container: HTMLElement,
    /** 地图初始化选项 */
    options: {
      /** 地图缩放级别 */
      zoom: number
      /** 地图中心坐标，顺序为经度、纬度 */
      center?: [number, number]
      /** 是否随容器尺寸变化调整地图 */
      resizeEnable?: boolean
    },
  ) => AmapMapInstance
  /** 地图标记构造函数 */
  Marker: new (options: {
    /** 标记坐标，顺序为经度、纬度 */
    position: [number, number]
    /** 标题 */
    title?: string
    /** 标记所属的地图实例 */
    map?: AmapMapInstance
  }) => AmapMarkerInstance
  /** 地点搜索实例构造函数 */
  PlaceSearch: new (options: {
    /** 所在城市 */
    city?: string
    /** 是否仅搜索指定城市 */
    citylimit?: boolean
    /** 每页数据条数 */
    pageSize?: number
    /** 搜索结果页码 */
    pageIndex?: number
  }) => AmapPlaceSearchInstance
}

export type ServiceOutletUpdateInput = Partial<ServiceOutletInput>

export interface ServiceOutletListParams {
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 搜索关键词 */
  keyword?: string
  /** 所属服务城市标识 */
  cityId?: number
  /** 所在区县 */
  district?: string
  /** 是否启用 */
  status?: boolean
}

export interface ServiceOutletListResult {
  /** 查询结果列表 */
  list: ServiceOutlet[]
  /** 记录总数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页数据条数 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}
