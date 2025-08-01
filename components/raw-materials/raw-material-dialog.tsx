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
import { createRawMaterial, updateRawMaterial } from "@/lib/firebase/raw-materials"
import { useAuth } from "@/lib/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { RawMaterial, MaterialStatus } from "@/types/raw-material"

interface RawMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: RawMaterial | null
  onSave: (material: RawMaterial) => void
}

export function RawMaterialDialog({ open, onOpenChange, material, onSave }: RawMaterialDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<RawMaterial>>({
    materialCode: "",
    name: "",
    type: "",
    color: "#000000",
    weight: "",
    unit: "KG",
    costPerKg: 0,
    supplier: "",
    minOrderQty: 0,
    status: "ACTIVE",
  })

  useEffect(() => {
    if (material) {
      setFormData({
        ...material,
      })
    } else {
      // Reset form for new material
      setFormData({
        materialCode: "",
        name: "",
        type: "",
        color: "#000000",
        weight: "",
        unit: "KG",
        costPerKg: 0,
        supplier: "",
        minOrderQty: 0,
        status: "ACTIVE",
      })
    }
  }, [material, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    let parsedValue: any = value

    // Parse numeric values
    if (type === "number") {
      parsedValue = Number.parseFloat(value) || 0
    }

    setFormData({
      ...formData,
      [name]: parsedValue,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      let savedMaterial: RawMaterial
      if (material) {
        // Update existing material
        savedMaterial = (await updateRawMaterial(material.id, formData)) as RawMaterial
      } else {
        // Create new material
        savedMaterial = (await createRawMaterial({
          ...formData,
          createdBy: user.uid,
        })) as RawMaterial
      }

      onSave(savedMaterial)
    } catch (error) {
      console.error("Error saving raw material:", error)
      toast({
        title: "Error",
        description: "Failed to save raw material. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{material ? "Edit Raw Material" : "Add New Raw Material"}</DialogTitle>
          <DialogDescription>
            {material ? "Update the raw material's information." : "Fill in the details to add a new raw material."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {material && (
              <div className="space-y-2">
                <Label htmlFor="materialCode">Material Code</Label>
                <Input
                  id="materialCode"
                  name="materialCode"
                  value={formData.materialCode}
                  onChange={handleChange}
                  disabled
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input id="type" name="type" value={formData.type} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    id="colorText"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input id="weight" name="weight" value={formData.weight} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)} disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">Kilogram (KG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPerKg">Cost per KG (₹)</Label>
                <Input
                  id="costPerKg"
                  name="costPerKg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPerKg}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minOrderQty">Min Order Qty (KG)</Label>
                <Input
                  id="minOrderQty"
                  name="minOrderQty"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minOrderQty}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status as string}
                onValueChange={(value) => handleSelectChange("status", value as MaterialStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : material ? "Update Material" : "Add Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
