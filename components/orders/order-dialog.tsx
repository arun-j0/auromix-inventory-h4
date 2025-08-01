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
import { createOrder, updateOrder } from "@/lib/firebase/orders"
import { fetchClients } from "@/lib/firebase/clients"
import { fetchProducts } from "@/lib/firebase/products"
import { useAuth } from "@/lib/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Order, OrderPriority, OrderStatus, OrderItem } from "@/types/order"
import type { Client } from "@/types/client"
import type { Product } from "@/types/product"

interface OrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onSave: (order: Order) => void
}

export function OrderDialog({ open, onOpenChange, order, onSave }: OrderDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState<Partial<Order>>({
    clientId: "",
    orderDate: new Date(),
    requiredByDate: new Date(),
    priority: "MEDIUM",
    status: "DRAFT",
    items: [],
    specialInstructions: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, productsData] = await Promise.all([fetchClients(), fetchProducts()])
        setClients(clientsData)
        setProducts(productsData)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (open) {
      loadData()
    }
  }, [open, toast])

  useEffect(() => {
    if (order) {
      setFormData({
        ...order,
      })
    } else {
      // Reset form for new order
      setFormData({
        clientId: "",
        orderDate: new Date(),
        requiredByDate: new Date(),
        priority: "MEDIUM",
        status: "DRAFT",
        items: [],
        specialInstructions: "",
      })
    }
  }, [order, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let parsedValue: any = value

    if (type === "date") {
      parsedValue = new Date(value)
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

  const handleAddItem = () => {
    const newItem: OrderItem = {
      itemId: `item_${Date.now()}`,
      productId: products.length > 0 ? products[0].id : "",
      productCode: products.length > 0 ? products[0].productCode : "",
      productName: products.length > 0 ? products[0].name : "",
      size: "M",
      color: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      threadAllocations: [],
      estimatedLaborHours: 0,
      totalWage: 0,
      status: "PENDING",
      qualityChecked: false,
    }

    setFormData({
      ...formData,
      items: [...(formData.items || []), newItem],
    })
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...(formData.items || [])]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }

    // Calculate total price when quantity or unit price changes
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? value : updatedItems[index].quantity
      const unitPrice = field === "unitPrice" ? value : updatedItems[index].unitPrice
      updatedItems[index].totalPrice = quantity * unitPrice
    }

    // Update product details when product changes
    if (field === "productId") {
      const selectedProduct = products.find((p) => p.id === value)
      if (selectedProduct) {
        updatedItems[index].productCode = selectedProduct.productCode
        updatedItems[index].productName = selectedProduct.name
      }
    }

    setFormData({
      ...formData,
      items: updatedItems,
    })
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...(formData.items || [])]
    updatedItems.splice(index, 1)

    setFormData({
      ...formData,
      items: updatedItems,
    })
  }

  const calculateTotals = () => {
    const items = formData.items || []
    const totalItems = items.length
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0)
    const totalLaborHours = items.reduce((sum, item) => sum + item.estimatedLaborHours, 0)

    return { totalItems, totalQuantity, totalValue, totalLaborHours }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Validate form data
      if (!formData.clientId) {
        throw new Error("Please select a client")
      }

      if (!formData.items || formData.items.length === 0) {
        throw new Error("Please add at least one order item")
      }

      const totals = calculateTotals()
      const orderData = {
        ...formData,
        ...totals,
        totalThreadKg: 0, // This would be calculated based on thread allocations
        totalCost: 0, // This would be calculated based on material costs
        estimatedProfit: totals.totalValue, // This would be calculated as totalValue - totalCost
      }

      let savedOrder: Order
      if (order) {
        // Update existing order
        savedOrder = (await updateOrder(order.id, orderData)) as Order
      } else {
        // Create new order
        savedOrder = (await createOrder({
          ...orderData,
          createdBy: user.uid,
        })) as Order
      }

      onSave(savedOrder)
    } catch (error: any) {
      console.error("Error saving order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Edit Order" : "Create New Order"}</DialogTitle>
          <DialogDescription>
            {order ? "Update the order information." : "Fill in the details to create a new order."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="items">Order Items</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <Select value={formData.clientId} onValueChange={(value) => handleSelectChange("clientId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName} - {client.contactPersonName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderDate">Order Date</Label>
                  <Input
                    id="orderDate"
                    name="orderDate"
                    type="date"
                    value={formData.orderDate ? new Date(formData.orderDate).toISOString().split("T")[0] : ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requiredByDate">Required By Date</Label>
                  <Input
                    id="requiredByDate"
                    name="requiredByDate"
                    type="date"
                    value={formData.requiredByDate ? new Date(formData.requiredByDate).toISOString().split("T")[0] : ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority as string}
                    onValueChange={(value) => handleSelectChange("priority", value as OrderPriority)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status as string}
                    onValueChange={(value) => handleSelectChange("status", value as OrderStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="PARTIALLY_COMPLETED">Partially Completed</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </TabsContent>
            <TabsContent value="items" className="space-y-4 py-4">
              {(formData.items || []).map((item, index) => (
                <div key={index} className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Item {index + 1}</h3>
                    <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveItem(index)}>
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`product-${index}`}>Product</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => handleItemChange(index, "productId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.productCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`size-${index}`}>Size</Label>
                      <Input
                        id={`size-${index}`}
                        value={item.size}
                        onChange={(e) => handleItemChange(index, "size", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`color-${index}`}>Color</Label>
                      <Input
                        id={`color-${index}`}
                        value={item.color}
                        onChange={(e) => handleItemChange(index, "color", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`unitPrice-${index}`}>Unit Price (₹)</Label>
                      <Input
                        id={`unitPrice-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, "unitPrice", Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-medium">Total: ₹{item.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={handleAddItem} className="w-full bg-transparent">
                Add Order Item
              </Button>
            </TabsContent>
            <TabsContent value="summary" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Items</Label>
                  <div className="text-2xl font-bold">{totals.totalItems}</div>
                </div>
                <div className="space-y-2">
                  <Label>Total Quantity</Label>
                  <div className="text-2xl font-bold">{totals.totalQuantity}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Value</Label>
                  <div className="text-2xl font-bold">₹{totals.totalValue.toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Labor Hours</Label>
                  <div className="text-2xl font-bold">{totals.totalLaborHours}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Order Items Summary</h3>
                <div className="space-y-2">
                  {(formData.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-muted-foreground ml-2">
                          {item.size} - {item.color} × {item.quantity}
                        </span>
                      </div>
                      <div className="font-medium">₹{item.totalPrice.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : order ? "Update Order" : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
