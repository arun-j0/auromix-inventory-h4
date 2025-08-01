export type ClientStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

export interface Address {
  street: string
  city: string
  state: string
  pincode: string
  country: string
}

export interface Client {
  id: string
  clientCode: string
  companyName: string
  contactPersonName: string
  contactPhone: string
  contactEmail: string
  billingAddress: Address
  shippingAddress?: Address
  gstNumber?: string
  businessType: string
  paymentTerms: string
  creditLimit?: number
  status: ClientStatus
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
