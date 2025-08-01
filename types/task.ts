export type TaskStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface DailyProgress {
  date: Date
  piecesCompleted: number
  hoursWorked: number
  workerIds: string[]
  notes?: string
  images?: string[]
}

export interface TaskMessage {
  from: string
  message: string
  timestamp: Date
  readBy: string[]
}

export interface StatusHistory {
  status: string
  timestamp: Date
  changedBy: string
  notes?: string
}

export interface Task {
  id: string
  taskNumber: string
  orderId: string
  orderItemId: string
  contractorId: string
  assignedWorkerIds: string[]
  productId: string
  productName: string
  quantity: number
  size: string
  color: string
  specialInstructions?: string
  assignedDate: Date
  expectedCompletionDate: Date
  startedDate?: Date
  completedDate?: Date
  status: TaskStatus
  approvalStatus: ApprovalStatus
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  progressPercentage: number
  piecesCompleted: number
  hoursLogged: number
  dailyProgress: DailyProgress[]
  qualityCheckRequired: boolean
  qualityChecked: boolean
  qualityScore?: number
  qualityNotes?: string
  qualityCheckedBy?: string
  qualityCheckedAt?: Date
  totalWage: number
  wagePerPiece: number
  notes: string
  messages: TaskMessage[]
  statusHistory: StatusHistory[]
  createdBy: string
  assignedBy: string
  createdAt: Date
  updatedAt: Date
}
