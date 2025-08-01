export type UserRole = "ADMIN" | "INTERNAL_EMPLOYEE" | "CONTRACTOR"
export type UserStatus = "ACTIVE" | "DISABLED" | "SUSPENDED"

export interface UserPermissions {
  canCreateOrders: boolean
  canApproveOrders: boolean
  canManageStock: boolean
  canViewReports: boolean
  canManageContractors: boolean
}

export interface User {
  id: string
  empCode: string
  name: string
  email: string
  phone: string
  role: UserRole
  contractorId?: string
  department?: string
  status: UserStatus
  lastLogin: Date
  permissions: UserPermissions
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  uid: string
  email: string
  name: string
  role: UserRole
  permissions: UserPermissions
}
