export type AlertLevel = 'danger' | 'warning'

export interface BusinessMetric {
  key: string
  label: string
  value: number
  unit: string
}

export interface BusinessStatus {
  key: string
  label: string
  count: number
}

export interface DashboardAlert {
  id: string
  type: string
  title: string
  description: string
  count: number
  level: AlertLevel
  targetPath: string
  query: Record<string, string>
}
