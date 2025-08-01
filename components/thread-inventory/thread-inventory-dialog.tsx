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
import { useToast } from "@/components/ui/use-toast"
import { createThreadInventory, updateThreadInventory } from "@/lib/firebase/thread-inventory"
import { useAuth } from "@/lib/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { fetchRawMaterials } from "@/lib/firebase/raw-materials"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ThreadInventory } from "@/types/thread-inventory"
import type { RawMaterial } from "@/types/raw-material"

interface ThreadInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventoryItem: ThreadInventory | null
  onSave: (inventoryItem: ThreadInventory) => void
}

export function ThreadInventoryDialog({ open, onOpenChange, inventoryItem, onSave }: ThreadInventoryDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [formData, setFormData] = useState<Partial<ThreadInventory>>({
    rawMaterialId: "",
    currentStockKg: 0,
    allocatedKg: 0,
    availableKg: 0,
    thresholdKg: 0,
    reorderPointKg: 0,
    maxStockKg: 0,
    costPerKg: 0,
    totalValue: 0,
    location: "",
    lastRestockedDate: new Date(),
    lastRestockedBy: "",
    stockMovements: [],
    alerts: {
      lowStock: false,
      nearExpiry: false,
      overstock: false,
    },
  })

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const materialsData = await fetchRawMaterials()
        setMaterials(materialsData)
      } catch (error) {
        console.error("Error loading raw materials:", error)
        toast({
          title: "Error",
          description: "Failed to load raw materials. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (open) {
      loadMaterials()
    }
  }, [open, toast])

  useEffect(() => {
    if (inventoryItem) {
      setFormData({
        ...inventoryItem,
      })
    } else {
      // Reset form for new inventory item
      setFormData({
        rawMaterialId: "",
        currentStockKg: 0,
        allocatedKg: 0,
        availableKg: 0,
        thresholdKg: 0,
        reorderPointKg: 0,
        maxStockKg: 0,
        costPerKg: 0,
        totalValue: 0,
        location: "",
        lastRestockedDate: new Date(),
        lastRestockedBy: user?.uid || "",
        stockMovements: [],
        alerts: {
          lowStock: false,
          nearExpiry: false,
          overstock: false,
        },
      })
    }
  }, [inventoryItem, open, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let parsedValue: any = value

    // Parse numeric values
    if (
      [
        "currentStockKg",
        "allocatedKg",
        "availableKg",
        "thresholdKg",
        "reorderPointKg",
        "maxStockKg",
        "costPerKg",
      ].includes(name)
    ) {
      parsedValue = Number.parseFloat(value) || 0
    }

    setFormData({
      ...formData,
      [name]: parsedValue,
    })

    // Calculate total value when stock or cost changes
    if (name === "currentStockKg" || name === "costPerKg") {
      const currentStockKg = name === "currentStockKg" ? parsedValue : formData.currentStockKg || 0
      const costPerKg = name === "costPerKg" ? parsedValue : formData.costPerKg || 0
      const totalValue = currentStockKg * costPerKg

      setFormData((prev) => ({
        ...prev,
        totalValue,
      }))
    }

    // Calculate available kg when stock or allocated changes
    if (name === "currentStockKg" || name === "allocatedKg") {
      const currentStockKg = name === "currentStockKg" ? parsedValue : formData.currentStockKg || 0
      const allocatedKg = name === "allocatedKg" ? parsedValue : formData.allocatedKg || 0
      const availableKg = Math.max(0, currentStockKg - allocatedKg)

      setFormData((prev) => ({
        ...prev,
        availableKg,
      }))
    }
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

      // Check if current stock is less than allocated
      if ((formData.currentStockKg || 0) < (formData.allocatedKg || 0)) {
        throw new Error("Current stock cannot be less than allocated stock")
      }

      // Update alerts based on current values
      const alerts = {
        lowStock: (formData.currentStockKg || 0) <= (formData.thresholdKg || 0),
        nearExpiry: false, // This would be based on expiry date if implemented
        overstock: (formData.currentStockKg || 0) > (formData.maxStockKg || 0),
      }

      // Prepare stock movement if this is a new entry or stock has changed
      const stockMovements = [...(formData.stockMovements || [])]

      if (!inventoryItem || inventoryItem.currentStockKg !== formData.currentStockKg) {
        stockMovements.push({
          date: new Date(),
          type: inventoryItem ? "ADJUSTMENT" : "IN",
          quantity: formData.currentStockKg || 0,
          notes: inventoryItem ? "Stock adjustment" : "Initial stock entry",
          performedBy: user.uid,
        })
      }

      const updatedFormData = {
        ...formData,
        alerts,
        stockMovements,
        lastRestockedBy: user.uid,
        lastRestockedDate: new Date(),
      }

      let savedInventory: ThreadInventory
      if (inventoryItem) {
        // Update existing inventory
        savedInventory = (await updateThreadInventory(inventoryItem.id, updatedFormData)) as ThreadInventory
      } else {
        // Create new inventory
        savedInventory = (await createThreadInventory(updatedFormData)) as ThreadInventory
      }

      onSave(savedInventory)
    } catch (error: any) {
      console.error("Error saving inventory:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save inventory. Please try again.",
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
          <DialogTitle>{inventoryItem ? "Edit Inventory" : "Add New Inventory"}</DialogTitle>
          <DialogDescription>
            {inventoryItem ? "Update the inventory information." : "Fill in the details to add new inventory."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="rawMaterialId">Raw Material</Label>
              <Select
                value={formData.rawMaterialId}
                onValueChange={(value) => handleSelectChange("rawMaterialId", value)}
                disabled={!!inventoryItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select raw material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} - {material.color} ({material.materialCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {materials.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No raw materials available. Please add raw materials first.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentStockKg">Current Stock (kg)</Label>
                <Input
                  id="currentStockKg"
                  name="currentStockKg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentStockKg}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allocatedKg">Allocated (kg)</Label>
                <Input
                  id="allocatedKg"
                  name="allocatedKg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.allocatedKg}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availableKg">Available (kg)</Label>
                <Input
                  id="availableKg"
                  name="availableKg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.availableKg}
                  disabled
                />
                <p className="text-xs text-muted-foreground">Calculated as Current Stock - Allocated</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thresholdKg">Threshold (kg)</Label>
                <Input
                  id="thresholdKg"
                  name="thresholdKg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.thresholdKg}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorderPointKg">Reorder Point (kg)</Label>
                <Input
                  id="reorderPointKg"
                  name="reorderPointKg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.reorderPointKg}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStockKg">Max Stock (kg)</Label>
                <Input
                  id="maxStockKg"
                  name="maxStockKg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxStockKg}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPerKg">Cost per kg (₹)</Label>
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
                <Label htmlFor="totalValue">Total Value (₹)</Label>
                <Input
                  id="totalValue"
                  name="totalValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalValue}
                  disabled
                />
                <p className="text-xs text-muted-foreground">Calculated as Current Stock × Cost per kg</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                placeholder="e.g. Warehouse A, Shelf B3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : inventoryItem ? "Update Inventory" : "Add Inventory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
