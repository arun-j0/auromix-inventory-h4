export type OrderPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
export type OrderStatus = "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "PARTIALLY_COMPLETED" | "COMPLETED" | "CANCELLED"
export type OrderItemStatus = "PENDING" | "ALLOCATED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED"

export interface ThreadAllocation {
  rawMaterialId: string
  allocatedKg: number
  costPerKg: number
}

export interface OrderItem {
  itemId: string
  productId: string
  productCode: string
  productName: string
  size: string
  color: string
  quantity: number
  unitPrice: number
  totalPrice: number
  threadAllocations: ThreadAllocation[]
  estimatedLaborHours: number
  totalWage: number
  status: OrderItemStatus
  assignedContractorId?: string
  assignedDate?: Date
  completedDate?: Date
  qualityChecked: boolean
  qualityNotes?: string
}

export interface Order {
  id: string
  orderNumber: string
  clientId: string
  orderDate: Date
  requiredByDate: Date
  priority: OrderPriority
  status: OrderStatus
  items: OrderItem[]
  totalItems: number
  totalQuantity: number
  totalThreadKg: number
  totalLaborHours: number
  totalValue: number
  totalCost: number
  estimatedProfit: number
  specialInstructions?: string
  attachments?: string[]
  createdBy: string
  assignedTo?: string
  approvedBy?: string
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
}
