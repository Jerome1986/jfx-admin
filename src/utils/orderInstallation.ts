import { installationStatusLabels, type ProductOrder } from '@/types/order'

export const installationLabel = (order: ProductOrder) => {
  if (order.installation)
    return installationStatusLabels[order.installation.status] ?? order.installation.status
  // 需要安装但尚未生成服务单，不能误标为无需安装。
  if (order.items?.some((item) => item.requiresInstall)) return '待生成安装单'
  return '无需安装'
}

export const installationTagType = (order: ProductOrder) => {
  const status = order.installation?.status
  if (!status || status === 'CANCELED') return 'info'
  if (status === 'COMPLETED') return 'success'
  if (status === 'IN_SERVICE') return 'primary'
  return 'warning'
}

export const installationDate = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('zh-CN')
}
