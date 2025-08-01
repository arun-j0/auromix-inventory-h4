export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_APPROVED"
  | "TASK_REJECTED"
  | "TASK_COMPLETED"
  | "ORDER_ASSIGNED"
  | "ORDER_DEADLINE_APPROACHING"
  | "ORDER_OVERDUE"
  | "STOCK_LOW"
  | "STOCK_CRITICAL"
  | "STOCK_RESTOCKED"
  | "CONTRACTOR_REGISTERED"
  | "WORKER_REGISTERED"
  | "QUALITY_ISSUE"
  | "SYSTEM_ALERT"

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface Notification {
  id: string
  toUserId: string
  fromUserId?: string
  type: NotificationType
  title: string
  message: string
  orderId?: string
  taskId?: string
  contractorId?: string
  priority: NotificationPriority
  read: boolean
  readAt?: Date
  emailSent: boolean
  emailSentAt?: Date
  actionRequired: boolean
  actionUrl?: string
  createdAt: Date
}
