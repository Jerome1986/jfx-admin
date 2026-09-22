// 使用整数分计算预览，与后端逐行四舍五入后汇总保持一致。
export const decimalPattern = /^\d{1,8}(\.\d{1,2})?$/
export function decimalHundredths(value: string): bigint {
  if (!decimalPattern.test(value)) throw new Error('请输入最多 8 位整数、2 位小数的非负数字')
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
}
export function quoteLineCents(price: string, quantity: string): bigint {
  return (decimalHundredths(price) * decimalHundredths(quantity) + 50n) / 100n
}
export function centsText(cents: bigint): string {
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`
}
export const projectTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—'
export const projectMoney = (value: string | null) => (value == null ? '未确认' : `¥${value}`)
