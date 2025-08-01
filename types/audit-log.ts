export type EntityType = "orders" | "tasks" | "inventory" | "users" | "clients" | "products" | "contractors" | "workers"
export type ActionType = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "ASSIGN" | "COMPLETE"

export interface AuditLog {
  id: string
  entityType: EntityType
  entityId: string
  action: ActionType
  fieldChanged?: string
  oldValue?: any
  newValue?: any
  performedBy: string
  performedByRole: string
  ipAddress?: string
  userAgent?: string
  reason?: string
  relatedEntityId?: string
  timestamp: Date
}
