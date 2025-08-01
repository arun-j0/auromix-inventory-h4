export type ProductStatus = "ACTIVE" | "DISCONTINUED"
export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL"
export type ProductDifficulty = "EASY" | "MEDIUM" | "HARD"

export interface ThreadRequirement {
  rawMaterialId: string
  threadKg: number
}

export interface SizeConfig {
  size: ProductSize
  threadRequirements: ThreadRequirement[]
  laborHours: number
  wagePerPiece: number
  difficulty: ProductDifficulty
}

export interface Product {
  id: string
  productCode: string
  name: string
  category: string
  model: string
  description: string
  colors: string[]
  images?: string[]
  sizeConfig: SizeConfig[]
  seasonality?: string
  status: ProductStatus
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
