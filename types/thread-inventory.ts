export type StockMovementType = "IN" | "OUT" | "ALLOCATED" | "RELEASED" | "ADJUSTMENT"

export interface StockMovement {
  date: Date
  type: StockMovementType
  quantity: number
  orderId?: string
  notes: string
  performedBy: string
}

export interface StockAlerts {
  lowStock: boolean
  nearExpiry: boolean
  overstock: boolean
}

export interface ThreadInventory {
  id: string
  rawMaterialId: string
  currentStockKg: number
  allocatedKg: number
  availableKg: number
  thresholdKg: number
  reorderPointKg: number
  maxStockKg: number
  costPerKg: number
  totalValue: number
  location?: string
  lastRestockedDate: Date
  lastRestockedBy: string
  stockMovements: StockMovement[]
  alerts: StockAlerts
  updatedAt: Date
}
