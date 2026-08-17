export interface ServiceAddress {
  id: number
  userId: number
  contactName: string
  phone: string
  locationName: string
  province: string
  city: string
  district: string
  address: string
  doorplate: string
  latitude: number
  longitude: number
  isDefault: boolean
  isEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

export type AddressInput = Omit<ServiceAddress, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateAddressInput = Partial<AddressInput>
export interface AddressListResult {
  list: ServiceAddress[]
  total?: number
}
