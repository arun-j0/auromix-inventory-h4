"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { fetchRawMaterials } from "@/lib/firebase/raw-materials"
import { fetchProducts } from "@/lib/firebase/products"
import { Download, Package, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import type { RawMaterial } from "@/types/raw-material"
import type { Product } from "@/types/product"

interface InventoryItem {
  id: string
  name: string
  type: "raw_material" | "product"
  currentStock: number
  minStock: number
  maxStock?: number
  unit: string
  value: number
  status: "in_stock" | "low_stock" | "out_of_stock"
}

export function InventoryReport() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  })

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      const [rawMaterials, products] = await Promise.all([fetchRawMaterials(), fetchProducts()])

      const items: InventoryItem[] = [
        ...rawMaterials.map((material: RawMaterial) => ({
          id: material.id,
          name: material.name,
          type: "raw_material" as const,
          currentStock: material.currentStock || 0,
          minStock: material.minStock || 0,
          maxStock: material.maxStock,
          unit: material.unit || "pcs",
          value: (material.currentStock || 0) * (material.unitPrice || 0),
          status: getStockStatus(material.currentStock || 0, material.minStock || 0),
        })),
        ...products.map((product: Product) => ({
          id: product.id,
          name: product.name,
          type: "product" as const,
          currentStock: product.stock || 0,
          minStock: product.minStock || 0,
          maxStock: product.maxStock,
          unit: "pcs",
          value: (product.stock || 0) * (product.price || 0),
          status: getStockStatus(product.stock || 0, product.minStock || 0),
        })),
      ]

      setInventoryItems(items)

      // Calculate summary
      const totalValue = items.reduce((sum, item) => sum + item.value, 0)
      const lowStockItems = items.filter((item) => item.status === "low_stock").length
      const outOfStockItems = items.filter((item) => item.status === "out_of_stock").length

      setSummary({
        totalItems: items.length,
        totalValue,
        lowStockItems,
        outOfStockItems,
      })
    } catch (error) {
      console.error("Error loading inventory data:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (currentStock: number, minStock: number): "in_stock" | "low_stock" | "out_of_stock" => {
    if (currentStock === 0) return "out_of_stock"
    if (currentStock <= minStock) return "low_stock"
    return "in_stock"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return "bg-green-100 text-green-800"
      case "low_stock":
        return "bg-yellow-100 text-yellow-800"
      case "out_of_stock":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const exportReport = () => {
    const csvContent = [
      ["Name", "Type", "Current Stock", "Min Stock", "Unit", "Value", "Status"].join(","),
      ...inventoryItems.map((item) =>
        [
          item.name,
          item.type.replace("_", " "),
          item.currentStock,
          item.minStock,
          item.unit,
          item.value.toFixed(2),
          item.status.replace("_", " "),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadInventoryData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground">Inventory items tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items below minimum</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">Items out of stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Report</CardTitle>
              <CardDescription>Complete inventory status and valuation</CardDescription>
            </div>
            <Button onClick={exportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No inventory items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="capitalize">{item.type.replace("_", " ")}</TableCell>
                      <TableCell>{item.currentStock}</TableCell>
                      <TableCell>{item.minStock}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>${item.value.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
