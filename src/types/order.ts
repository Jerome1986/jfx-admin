export const orderStatuses = [
  { value: 'PENDING_PAYMENT', label: '待付款' },
  { value: 'PENDING_INSTALLATION', label: '待安装' },
  { value: 'IN_SERVICE', label: '服务中' },
  { value: 'PENDING_CONFIRMATION', label: '待客户确认' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELED', label: '已取消' },
  { value: 'REFUNDING', label: '退款中' },
  { value: 'REFUNDED', label: '已退款' },
] as const
export type ProductOrderStatus = (typeof orderStatuses)[number]['value']
export const paymentStatusLabels = {
  UNPAID: '未支付',
  PAID: '已支付',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
  CLOSED: '已关闭',
} as const
export interface OrderListParams {
  status?: ProductOrderStatus | 'ALL'
  keyWords?: string
  pageNum: number
  pageSize: number
  createdAtStart?: string
  createdAtEnd?: string
}
/** 后台订单列表包含下单商品快照。 */
export interface ProductOrder {
  confirmationDeadlineAt?: string | null
  completionType?: 'CUSTOMER_CONFIRMED' | 'AUTO_TIMEOUT' | null
  autoCompletionPaused?: boolean
  completedAt?: string | null
  appointmentDate?: string | null
  timeSlot?: string | null
  installation: OrderInstallation | null
  items: ProductOrderItem[]
  id: number
  orderNo: string
  contactName: string
  contactPhone: string
  serviceAddress: string
  couponDiscount?: string | number | null
  pointDiscount?: string | number | null
  productAmount: string | number
  payableAmount: string | number
  paidAmount: string | number
  status: ProductOrderStatus
  paymentStatus: keyof typeof paymentStatusLabels
  remark: string | null
  createdAt: string
}
export interface OrderListResult {
  list: ProductOrder[]
  total: number
}

export interface ProductOrderItem {
  id: number
  orderId: number
  productId: number | null
  productName: string
  skuDescription: string | null
  image: string | null
  unitPrice: string | number
  quantity: number
  subtotal: string | number
  requiresInstall: boolean
  installationFee: string | number
}

export const installationStatusLabels = {
  PENDING_APPOINTMENT: '待预约',
  PENDING_ASSIGNMENT: '待派单',
  PENDING_VISIT: '待上门',
  IN_SERVICE: '服务中',
  COMPLETED: '已完成',
  CANCELED: '已取消',
} as const

export interface OrderInstallation {
  installerName?: string | null
  installerPhone?: string | null
  remark?: string | null
  id: number
  serviceNo: string
  orderId: number
  employeeId: number | null
  customerName: string
  mobile: string
  serviceAddress: string
  appointmentDate: string | null
  timeSlot: string | null
  assignedAt: string | null
  acceptedAt: string | null
  visitedAt: string | null
  serviceRecord: string | null
  completionImages: unknown
  customerConfirmedAt?: string | null
  customerConfirmed: boolean
  status: keyof typeof installationStatusLabels
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

/** 订单操作仅允许以下三个状态流转。 */
export const orderStatusActions = {
  PENDING_PAYMENT: { label: '取消', targetStatus: 'CANCELED', type: 'danger' },
  PENDING_INSTALLATION: { label: '安排安装', targetStatus: 'IN_SERVICE', type: 'primary' },
  IN_SERVICE: { label: '确认安装完工', targetStatus: 'PENDING_CONFIRMATION', type: 'success' },
} as const satisfies Partial<
  Record<
    ProductOrderStatus,
    {
      label: string
      targetStatus: ProductOrderStatus
      type: 'danger' | 'primary' | 'success'
    }
  >
>

export const getOrderStatusAction = (status: ProductOrderStatus) =>
  Object.prototype.hasOwnProperty.call(orderStatusActions, status)
    ? orderStatusActions[status as keyof typeof orderStatusActions]
    : undefined

/** 安排安装接口参数，不修改用户预约时间。 */
export interface ArrangeInstallationParams {
  installerName: string
  installerPhone: string
  remark?: string
}

export const completionTypeLabel = (value: ProductOrder['completionType']) => {
  if (value === 'CUSTOMER_CONFIRMED') return '客户确认完成'
  if (value === 'AUTO_TIMEOUT') return '超时自动完成'
  return value || '未记录'
}
