export interface ChartData {
  label: string
  value: number
}

export interface LowStockAlert {
  id: string
  name: string
  currentStockKg: number
  thresholdKg: number
}

export interface DashboardStats {
  totalOrders: number
  ordersTrend: number
  activeClients: number
  clientsTrend: number
  totalThreadKg: number
  lowStockItems: number
  totalRevenue: number
  revenueTrend: number
  orderStatusData: ChartData[]
  monthlyOrdersData: ChartData[]
  lowStockAlerts: LowStockAlert[]
}
