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
import { createProduct, updateProduct } from "@/lib/firebase/products"
import { useAuth } from "@/lib/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchRawMaterials } from "@/lib/firebase/raw-materials"
import type { Product, ProductStatus, ProductSize, ProductDifficulty } from "@/types/product"
import type { RawMaterial } from "@/types/raw-material"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSave: (product: Product) => void
}

export function ProductDialog({ open, onOpenChange, product, onSave }: ProductDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [formData, setFormData] = useState<Partial<Product>>({
    productCode: "",
    name: "",
    category: "",
    model: "",
    description: "",
    colors: [],
    sizeConfig: [],
    status: "ACTIVE",
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
    if (product) {
      setFormData({
        ...product,
      })
    } else {
      // Reset form for new product
      setFormData({
        productCode: "",
        name: "",
        category: "",
        model: "",
        description: "",
        colors: [],
        sizeConfig: [
          {
            size: "M",
            threadRequirements: [],
            laborHours: 0,
            wagePerPiece: 0,
            difficulty: "MEDIUM",
          },
        ],
        status: "ACTIVE",
      })
    }
  }, [product, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleColorsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const colors = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    setFormData({
      ...formData,
      colors,
    })
  }

  const handleSizeConfigChange = (index: number, field: string, value: any) => {
    const updatedSizeConfig = [...(formData.sizeConfig || [])]
    updatedSizeConfig[index] = {
      ...updatedSizeConfig[index],
      [field]: value,
    }

    setFormData({
      ...formData,
      sizeConfig: updatedSizeConfig,
    })
  }

  const handleAddSize = () => {
    const updatedSizeConfig = [...(formData.sizeConfig || [])]
    updatedSizeConfig.push({
      size: "M",
      threadRequirements: [],
      laborHours: 0,
      wagePerPiece: 0,
      difficulty: "MEDIUM",
    })

    setFormData({
      ...formData,
      sizeConfig: updatedSizeConfig,
    })
  }

  const handleRemoveSize = (index: number) => {
    const updatedSizeConfig = [...(formData.sizeConfig || [])]
    updatedSizeConfig.splice(index, 1)

    setFormData({
      ...formData,
      sizeConfig: updatedSizeConfig,
    })
  }

  const handleAddThreadRequirement = (sizeIndex: number) => {
    const updatedSizeConfig = [...(formData.sizeConfig || [])]
    const currentRequirements = [...(updatedSizeConfig[sizeIndex].threadRequirements || [])]

    currentRequirements.push({
      rawMaterialId: materials.length > 0 ? materials[0].id : "",
      threadKg: 0,
    })

    updatedSizeConfig[sizeIndex] = {
      ...updatedSizeConfig[sizeIndex],
      threadRequirements: currentRequirements,
    }

    setFormData({
      ...formData,
      sizeConfig: updatedSizeConfig,
    })
  }

  const handleThreadRequirementChange = (sizeIndex: number, reqIndex: number, field: string, value: any) => {
    const updatedSizeConfig = [...(formData.sizeConfig || [])]
    const currentRequirements = [...(updatedSizeConfig[sizeIndex].threadRequirements || [])]

    currentRequirements[reqIndex] = {
      ...currentRequirements[reqIndex],
      [field]: field === "threadKg" ? Number(value) : value,
    }

    updatedSizeConfig[sizeIndex] = {
      ...updatedSizeConfig[sizeIndex],
      threadRequirements: currentRequirements,
    }

    setFormData({
      ...formData,
      sizeConfig: updatedSizeConfig,
    })
  }

  const handleRemoveThreadRequirement = (sizeIndex: number, reqIndex: number) => {
    const updatedSizeConfig = [...(formData.sizeConfig || [])]
    const currentRequirements = [...(updatedSizeConfig[sizeIndex].threadRequirements || [])]

    currentRequirements.splice(reqIndex, 1)

    updatedSizeConfig[sizeIndex] = {
      ...updatedSizeConfig[sizeIndex],
      threadRequirements: currentRequirements,
    }

    setFormData({
      ...formData,
      sizeConfig: updatedSizeConfig,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Validate form data
      if (!formData.name || !formData.category || !formData.model) {
        throw new Error("Please fill in all required fields")
      }

      if (!formData.sizeConfig || formData.sizeConfig.length === 0) {
        throw new Error("Please add at least one size configuration")
      }

      let savedProduct: Product
      if (product) {
        // Update existing product
        savedProduct = (await updateProduct(product.id, formData)) as Product
      } else {
        // Create new product
        savedProduct = (await createProduct({
          ...formData,
          createdBy: user.uid,
        })) as Product
      }

      onSave(savedProduct)
    } catch (error: any) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update the product's information." : "Fill in the details to add a new product."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="sizes">Size Configuration</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 py-4">
              {product && (
                <div className="space-y-2">
                  <Label htmlFor="productCode">Product Code</Label>
                  <Input
                    id="productCode"
                    name="productCode"
                    value={formData.productCode}
                    onChange={handleChange}
                    disabled
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" value={formData.category} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" name="model" value={formData.model} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="colors">Colors (comma separated)</Label>
                <Input
                  id="colors"
                  name="colors"
                  value={formData.colors?.join(", ")}
                  onChange={handleColorsChange}
                  placeholder="e.g. Red, Blue, Green"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status as string}
                  onValueChange={(value) => handleSelectChange("status", value as ProductStatus)}
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
            </TabsContent>
            <TabsContent value="sizes" className="space-y-4 py-4">
              {(formData.sizeConfig || []).map((sizeConfig, index) => (
                <div key={index} className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Size Configuration {index + 1}</h3>
                    {(formData.sizeConfig || []).length > 1 && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveSize(index)}>
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`size-${index}`}>Size</Label>
                      <Select
                        value={sizeConfig.size}
                        onValueChange={(value) => handleSizeConfigChange(index, "size", value as ProductSize)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="XS">XS</SelectItem>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                          <SelectItem value="XXL">XXL</SelectItem>
                          <SelectItem value="XXXL">XXXL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`difficulty-${index}`}>Difficulty</Label>
                      <Select
                        value={sizeConfig.difficulty}
                        onValueChange={(value) =>
                          handleSizeConfigChange(index, "difficulty", value as ProductDifficulty)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`laborHours-${index}`}>Labor Hours</Label>
                      <Input
                        id={`laborHours-${index}`}
                        type="number"
                        step="0.1"
                        min="0"
                        value={sizeConfig.laborHours}
                        onChange={(e) => handleSizeConfigChange(index, "laborHours", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`wagePerPiece-${index}`}>Wage Per Piece (₹)</Label>
                      <Input
                        id={`wagePerPiece-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={sizeConfig.wagePerPiece}
                        onChange={(e) => handleSizeConfigChange(index, "wagePerPiece", Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={handleAddSize} className="w-full bg-transparent">
                Add Size Configuration
              </Button>
            </TabsContent>
            <TabsContent value="materials" className="space-y-4 py-4">
              {materials.length === 0 && (
                <div className="text-center p-4 border rounded-md bg-muted">
                  <p>No raw materials available. Please add raw materials first.</p>
                </div>
              )}

              {materials.length > 0 &&
                (formData.sizeConfig || []).map((sizeConfig, sizeIndex) => (
                  <div key={sizeIndex} className="border rounded-md p-4 space-y-4">
                    <h3 className="text-lg font-medium">Thread Requirements for Size {sizeConfig.size}</h3>

                    {(sizeConfig.threadRequirements || []).map((req, reqIndex) => (
                      <div key={reqIndex} className="grid grid-cols-3 gap-4 items-end">
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor={`material-${sizeIndex}-${reqIndex}`}>Material</Label>
                          <Select
                            value={req.rawMaterialId}
                            onValueChange={(value) =>
                              handleThreadRequirementChange(sizeIndex, reqIndex, "rawMaterialId", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((material) => (
                                <SelectItem key={material.id} value={material.id}>
                                  {material.name} - {material.color}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="space-y-2 flex-1">
                            <Label htmlFor={`threadKg-${sizeIndex}-${reqIndex}`}>KG</Label>
                            <Input
                              id={`threadKg-${sizeIndex}-${reqIndex}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={req.threadKg}
                              onChange={(e) =>
                                handleThreadRequirementChange(sizeIndex, reqIndex, "threadKg", e.target.value)
                              }
                              required
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveThreadRequirement(sizeIndex, reqIndex)}
                            className="mb-2"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAddThreadRequirement(sizeIndex)}
                      className="w-full"
                    >
                      Add Thread Requirement
                    </Button>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : product ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
