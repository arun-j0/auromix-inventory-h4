export type MaterialStatus = "ACTIVE" | "DISCONTINUED"

export interface RawMaterial {
  id: string
  materialCode: string
  name: string
  type: string
  color: string
  weight: string
  unit: "KG"
  costPerKg: number
  supplier?: string
  minOrderQty: number
  status: MaterialStatus
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
