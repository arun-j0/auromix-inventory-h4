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
import { useToast } from "@/components/ui/use-toast"
import { createContractor, updateContractor } from "@/lib/firebase/contractors"
import { useAuth } from "@/lib/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Contractor } from "@/types/contractor"

interface ContractorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractor: Contractor | null
  onSave: (contractor: Contractor) => void
}

export function ContractorDialog({ open, onOpenChange, contractor, onSave }: ContractorDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Contractor>>({
    contractorCode: "",
    companyName: "",
    contactPersonName: "",
    phone: "",
    email: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
    businessType: "INDIVIDUAL",
    specialization: [],
    skillLevel: "INTERMEDIATE",
    status: "ACTIVE",
    availabilityStatus: "AVAILABLE",
  })

  useEffect(() => {
    if (contractor) {
      setFormData({
        ...contractor,
      })
    } else {
      // Reset form for new contractor
      setFormData({
        contractorCode: "",
        companyName: "",
        contactPersonName: "",
        phone: "",
        email: "",
        address: {
          street: "",
          city: "",
          state: "",
          pincode: "",
        },
        businessType: "INDIVIDUAL",
        specialization: [],
        skillLevel: "INTERMEDIATE",
        status: "ACTIVE",
        availabilityStatus: "AVAILABLE",
      })
    }
  }, [contractor, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData({
        ...formData,
        [parent]: {
          ...(formData[parent as keyof typeof formData] as Record<string, any>),
          [child]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSpecializationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const specializations = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    setFormData({
      ...formData,
      specialization: specializations,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      let savedContractor: Contractor
      if (contractor) {
        // Update existing contractor
        savedContractor = (await updateContractor(contractor.id, {
          ...formData,
        })) as Contractor
      } else {
        // Create new contractor
        savedContractor = (await createContractor({
          ...formData,
          onboardedBy: user.uid,
        })) as Contractor
      }

      onSave(savedContractor)
    } catch (error) {
      console.error("Error saving contractor:", error)
      toast({
        title: "Error",
        description: "Failed to save contractor. Please try again.",
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
          <DialogTitle>{contractor ? "Edit Contractor" : "Add New Contractor"}</DialogTitle>
          <DialogDescription>
            {contractor ? "Update the contractor's information." : "Fill in the details to add a new contractor."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {contractor && (
              <div className="space-y-2">
                <Label htmlFor="contractorCode">Contractor Code</Label>
                <Input
                  id="contractorCode"
                  name="contractorCode"
                  value={formData.contractorCode}
                  onChange={handleChange}
                  disabled
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Select
                  value={formData.businessType as string}
                  onValueChange={(value) => handleSelectChange("businessType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="COMPANY">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.businessType === "COMPANY" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName || ""}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPersonName">Contact Person Name</Label>
                <Input
                  id="contactPersonName"
                  name="contactPersonName"
                  value={formData.contactPersonName || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={formData.phone || ""} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email || ""} onChange={handleChange} />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address.street">Street</Label>
                  <Input
                    id="address.street"
                    name="address.street"
                    value={formData.address?.street || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.city">City</Label>
                  <Input
                    id="address.city"
                    name="address.city"
                    value={formData.address?.city || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="address.state">State</Label>
                  <Input
                    id="address.state"
                    name="address.state"
                    value={formData.address?.state || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.pincode">Pincode</Label>
                  <Input
                    id="address.pincode"
                    name="address.pincode"
                    value={formData.address?.pincode || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization (comma separated)</Label>
              <Input
                id="specialization"
                name="specialization"
                value={formData.specialization?.join(", ") || ""}
                onChange={handleSpecializationChange}
                placeholder="e.g. Embroidery, Stitching, Knitting"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skillLevel">Skill Level</Label>
                <Select
                  value={formData.skillLevel as string}
                  onValueChange={(value) => handleSelectChange("skillLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status as string}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availabilityStatus">Availability</Label>
              <Select
                value={formData.availabilityStatus as string}
                onValueChange={(value) => handleSelectChange("availabilityStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="BUSY">Busy</SelectItem>
                  <SelectItem value="OVERLOADED">Overloaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : contractor ? "Update Contractor" : "Add Contractor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
