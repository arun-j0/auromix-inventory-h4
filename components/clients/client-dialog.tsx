"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClient, updateClient } from "@/lib/firebase/clients"
import { useAuth } from "@/lib/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Client, Address, ClientStatus } from "@/types/client"

interface ClientFormData {
  clientCode: string
  companyName: string
  contactPersonName: string
  contactPhone: string
  contactEmail: string
  billingAddress: Address
  shippingAddress: Address
  gstNumber?: string
  businessType: string
  paymentTerms: string
  creditLimit: number
  status: ClientStatus
  notes?: string
}

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSave: (client: Client) => void
}

export function ClientDialog({ open, onOpenChange, client, onSave }: ClientDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ClientFormData>({
    clientCode: "",
    companyName: "",
    contactPersonName: "",
    contactPhone: "",
    contactEmail: "",
    billingAddress: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
    shippingAddress: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
    gstNumber: "",
    businessType: "Retailer",
    paymentTerms: "Net 30",
    creditLimit: 0,
    status: "ACTIVE",
    notes: "",
  })
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true)

  useEffect(() => {
    if (client) {
      setFormData({
        ...client,
        // Ensure all required fields exist
        billingAddress: client.billingAddress || {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
        shippingAddress: client.shippingAddress || {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
      })

      // Check if billing and shipping are the same
      const billing = client.billingAddress || {}
      const shipping = client.shippingAddress || {}
      const sameAddress =
        billing.street === shipping.street &&
        billing.city === shipping.city &&
        billing.state === shipping.state &&
        billing.pincode === shipping.pincode &&
        billing.country === shipping.country

      setUseShippingAsBilling(sameAddress)
    } else {
      // Reset form for new client
      setFormData({
        clientCode: "",
        companyName: "",
        contactPersonName: "",
        contactPhone: "",
        contactEmail: "",
        billingAddress: {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
        shippingAddress: {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
        gstNumber: "",
        businessType: "Retailer",
        paymentTerms: "Net 30",
        creditLimit: 0,
        status: "ACTIVE",
        notes: "",
      })
      setUseShippingAsBilling(true)
    }
  }, [client, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData({
        ...formData,
        [parent]: {
          ...(formData[parent as keyof ClientFormData] as Record<string, any>),
          [child]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }

    // If using same address, update shipping when billing changes
    if (useShippingAsBilling && name.startsWith("billingAddress.")) {
      const field = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [field]: value,
        },
      }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleUseShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setUseShippingAsBilling(checked)

    if (checked) {
      // Copy billing address to shipping
      setFormData((prev) => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress },
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      let savedClient: Client
      if (client) {
        // Update existing client
        savedClient = await updateClient(client.id, {
          ...formData,
          updatedAt: new Date(),
        })
      } else {
        // Create new client
        savedClient = await createClient({
          ...formData,
          createdBy: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      onSave(savedClient)
    } catch (error) {
      console.error("Error saving client:", error)
      toast({
        title: "Error",
        description: "Failed to save client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {client ? "Update the client's information." : "Fill in the details to add a new client."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientCode">Client Code</Label>
                <Input id="clientCode" name="clientCode" value={formData.clientCode} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPersonName">Contact Person</Label>
                <Input
                  id="contactPersonName"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input id="gstNumber" name="gstNumber" value={formData.gstNumber} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => handleSelectChange("businessType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retailer">Retailer</SelectItem>
                    <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="Distributor">Distributor</SelectItem>
                    <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value) => handleSelectChange("paymentTerms", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Immediate">Immediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
                <Input
                  id="creditLimit"
                  name="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value as ClientStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="text-lg font-medium">Billing Address</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="billingAddress.street">Street</Label>
                  <Input
                    id="billingAddress.street"
                    name="billingAddress.street"
                    value={formData.billingAddress.street}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingAddress.city">City</Label>
                  <Input
                    id="billingAddress.city"
                    name="billingAddress.city"
                    value={formData.billingAddress.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="billingAddress.state">State</Label>
                  <Input
                    id="billingAddress.state"
                    name="billingAddress.state"
                    value={formData.billingAddress.state}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingAddress.pincode">Pincode</Label>
                  <Input
                    id="billingAddress.pincode"
                    name="billingAddress.pincode"
                    value={formData.billingAddress.pincode}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingAddress.country">Country</Label>
                  <Input
                    id="billingAddress.country"
                    name="billingAddress.country"
                    value={formData.billingAddress.country}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useShippingAsBilling"
                checked={useShippingAsBilling}
                onChange={handleUseShippingChange}
                className="rounded border-gray-300"
              />
              <Label htmlFor="useShippingAsBilling">Shipping address same as billing</Label>
            </div>

            {!useShippingAsBilling && (
              <div>
                <h3 className="text-lg font-medium">Shipping Address</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress.street">Street</Label>
                    <Input
                      id="shippingAddress.street"
                      name="shippingAddress.street"
                      value={formData.shippingAddress.street}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress.city">City</Label>
                    <Input
                      id="shippingAddress.city"
                      name="shippingAddress.city"
                      value={formData.shippingAddress.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress.state">State</Label>
                    <Input
                      id="shippingAddress.state"
                      name="shippingAddress.state"
                      value={formData.shippingAddress.state}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress.pincode">Pincode</Label>
                    <Input
                      id="shippingAddress.pincode"
                      name="shippingAddress.pincode"
                      value={formData.shippingAddress.pincode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress.country">Country</Label>
                    <Input
                      id="shippingAddress.country"
                      name="shippingAddress.country"
                      value={formData.shippingAddress.country}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : client ? "Update Client" : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
