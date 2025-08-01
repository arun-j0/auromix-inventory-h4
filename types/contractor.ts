export type ContractorBusinessType = "INDIVIDUAL" | "COMPANY"
export type ContractorStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLACKLISTED"
export type ContractorAvailability = "AVAILABLE" | "BUSY" | "OVERLOADED"
export type ContractorSkillLevel = "BEGINNER" | "INTERMEDIATE" | "EXPERT"

export interface BankDetails {
  accountNumber: string
  ifscCode: string
  bankName: string
  branchName: string
}

export interface WorkingHours {
  start: string
  end: string
}

export interface WorkingSchedule {
  monday: WorkingHours
  tuesday: WorkingHours
  wednesday: WorkingHours
  thursday: WorkingHours
  friday: WorkingHours
  saturday?: WorkingHours
  sunday?: WorkingHours
}

export interface Contractor {
  id: string
  contractorCode: string
  companyName?: string
  contactPersonName: string
  phone: string
  email?: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
  }
  businessType: ContractorBusinessType
  gstNumber?: string
  panNumber?: string
  bankDetails?: BankDetails
  specialization: string[]
  skillLevel: ContractorSkillLevel
  rating: number
  totalOrdersCompleted: number
  onTimeDeliveryRate: number
  qualityScore: number
  maxConcurrentOrders: number
  workingHours: WorkingSchedule
  status: ContractorStatus
  availabilityStatus: ContractorAvailability
  onboardedBy: string
  onboardedAt: Date
  lastActiveAt: Date
  createdAt: Date
  updatedAt: Date
}
