import type { ServiceCity } from './serviceCity'

export interface ServiceOutlet {
  id: number
  name: string
  categories: unknown[] | null
  businessHours: string
  phone: string | null
  province: string | null
  cityId: number
  cityName: string | null
  district: string | null
  address: string
  latitude: string | null
  longitude: string | null
  cover: string | null
  sort: number
  status: boolean
  createdAt: string
  updatedAt: string
  serviceCity: ServiceCity | null
}

export interface ServiceOutletInput {
  name: string
  businessHours: string
  phone?: string
  province?: string
  cityId: number
  district?: string
  address: string
  latitude?: number
  longitude?: number
  cover?: string
  sort?: number
  status?: boolean
}

export interface ServiceOutletForm {
  name: string
  businessHours: string
  phone: string
  province: string
  cityId: number | undefined
  district: string
  address: string
  latitude: number | undefined
  longitude: number | undefined
  cover: string
  sort: number
  status: boolean
}

export interface ServiceOutletPoi {
  id: string
  name: string
  address: string
  province: string
  city: string
  district: string
  longitude: number
  latitude: number
}

export interface AmapLngLatLike {
  getLng(): number
  getLat(): number
}

export interface AmapRawPoi {
  id?: string
  name?: string
  address?: string | string[]
  pname?: string | string[]
  cityname?: string | string[]
  adname?: string | string[]
  location?: AmapLngLatLike
}

export interface AmapPlaceSearchResult {
  poiList?: { pois?: AmapRawPoi[] }
  info?: string
}

export interface AmapMarkerInstance {
  on(event: 'click', callback: () => void): void
  setMap(map: AmapMapInstance | null): void
}

export interface AmapMapInstance {
  add(overlays: AmapMarkerInstance | AmapMarkerInstance[]): void
  clearMap(): void
  destroy(): void
  setFitView(overlays?: AmapMarkerInstance[], immediately?: boolean): void
  setZoomAndCenter(zoom: number, center: [number, number]): void
}

export interface AmapPlaceSearchInstance {
  search(
    keyword: string,
    callback: (status: string, result: AmapPlaceSearchResult | string) => void,
  ): void
}

export interface AmapRuntime {
  Map: new (
    container: HTMLElement,
    options: { zoom: number; center?: [number, number]; resizeEnable?: boolean },
  ) => AmapMapInstance
  Marker: new (options: {
    position: [number, number]
    title?: string
    map?: AmapMapInstance
  }) => AmapMarkerInstance
  PlaceSearch: new (options: {
    city?: string
    citylimit?: boolean
    pageSize?: number
    pageIndex?: number
  }) => AmapPlaceSearchInstance
}

export type ServiceOutletUpdateInput = Partial<ServiceOutletInput>

export interface ServiceOutletListParams {
  pageNum: number
  pageSize: number
  keyword?: string
  cityId?: number
  district?: string
  status?: boolean
}

export interface ServiceOutletListResult {
  list: ServiceOutlet[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}
