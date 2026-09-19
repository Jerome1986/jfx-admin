export interface ServiceAddress {
  /** 唯一标识 */
  id: number
  /** 关联用户标识 */
  userId: number
  /** 联系人姓名 */
  contactName: string
  /** 联系电话 */
  phone: string
  /** 地点名称 */
  locationName: string
  /** 所在省份 */
  province: string
  /** 所在城市 */
  city: string
  /** 所在区县 */
  district: string
  /** 详细地址 */
  address: string
  /** 门牌号 */
  doorplate: string
  /** 纬度 */
  latitude: number
  /** 经度 */
  longitude: number
  /** 是否为默认地址 */
  isDefault: boolean
  /** 是否启用 */
  isEnabled: boolean
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

export type AddressInput = Omit<ServiceAddress, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateAddressInput = Partial<AddressInput>
export interface AddressListResult {
  /** 查询结果列表 */
  list: ServiceAddress[]
  /** 记录总数 */
  total?: number
}
