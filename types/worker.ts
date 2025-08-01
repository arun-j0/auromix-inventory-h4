export type WorkerStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE"
export type WorkerSkillLevel = "BEGINNER" | "INTERMEDIATE" | "EXPERT"

export interface Worker {
  id: string
  contractorId: string
  workerCode: string
  name: string
  phone?: string
  email?: string
  skills: string[]
  experienceYears: number
  skillLevel: WorkerSkillLevel
  hourlyRate?: number
  pieceRate?: number
  totalTasksCompleted: number
  averageQualityScore: number
  averageCompletionTime: number
  status: WorkerStatus
  joinedAt: Date
  lastWorkedAt?: Date
  createdAt: Date
  updatedAt: Date
}
