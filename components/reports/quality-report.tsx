"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { fetchProducts } from "@/lib/firebase/products"
import { fetchOrders } from "@/lib/firebase/orders"
import { Download, CheckCircle, XCircle, AlertTriangle, BarChart3 } from "lucide-react"
import type { Product } from "@/types/product"
import type { Order } from "@/types/order"

interface QualityMetrics {
  totalProducts: number
  passedQuality: number
  failedQuality: number
  qualityScore: number
  defectRate: number
  customerSatisfaction: number
}

interface QualityItem {
  id: string
  name: string
  type: "product" | "order"
  qualityStatus: "passed" | "failed" | "pending"
  defects: number
  testDate: string
  notes?: string
}

export function QualityReport() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<QualityMetrics>({
    totalProducts: 0,
    passedQuality: 0,
    failedQuality: 0,
    qualityScore: 0,
    defectRate: 0,
    customerSatisfaction: 0,
  })
  const [qualityItems, setQualityItems] = useState<QualityItem[]>([])

  const loadQualityData = async () => {
    try {
      setLoading(true)
      const [products, orders] = await Promise.all([fetchProducts(), fetchOrders()])

      // Generate mock quality data for demonstration
      const items: QualityItem[] = [
        ...products.map((product: Product, index: number) => ({
          id: product.id,
          name: product.name,
          type: "product" as const,
          qualityStatus: (["passed", "failed", "pending"] as const)[index % 3],
          defects: Math.floor(Math.random() * 5),
          testDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          notes: index % 4 === 0 ? "Minor cosmetic issues" : undefined,
        })),
        ...orders.slice(0, 10).map((order: Order, index: number) => ({
          id: order.id,
          name: `Order #${order.orderNumber || order.id.slice(-6)}`,
          type: "order" as const,
          qualityStatus: (["passed", "failed", "pending"] as const)[index % 3],
          defects: Math.floor(Math.random() * 3),
          testDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          notes: index % 5 === 0 ? "Customer complaint resolved" : undefined,
        })),
      ]

      setQualityItems(items)

      // Calculate metrics
      const totalItems = items.length
      const passedItems = items.filter((item) => item.qualityStatus === "passed").length
      const failedItems = items.filter((item) => item.qualityStatus === "failed").length
      const totalDefects = items.reduce((sum, item) => sum + item.defects, 0)

      const qualityScore = totalItems > 0 ? (passedItems / totalItems) * 100 : 0
      const defectRate = totalItems > 0 ? (totalDefects / totalItems) * 100 : 0
      const customerSatisfaction = Math.max(0, 100 - defectRate * 2) // Mock calculation

      setMetrics({
        totalProducts: totalItems,
        passedQuality: passedItems,
        failedQuality: failedItems,
        qualityScore,
        defectRate,
        customerSatisfaction,
      })
    } catch (error) {
      console.error("Error loading quality data:", error)
      toast({
        title: "Error",
        description: "Failed to load quality data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const exportReport = () => {
    const csvContent = [
      ["Name", "Type", "Quality Status", "Defects", "Test Date", "Notes"].join(","),
      ...qualityItems.map((item) =>
        [item.name, item.type, item.qualityStatus, item.defects, item.testDate, item.notes || ""].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quality-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadQualityData()
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
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.qualityScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Overall quality rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed Quality</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.passedQuality}</div>
            <p className="text-xs text-muted-foreground">Items passed inspection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Quality</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.failedQuality}</div>
            <p className="text-xs text-muted-foreground">Items failed inspection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defect Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.defectRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average defects per item</p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quality Report</CardTitle>
              <CardDescription>Quality control results and defect tracking</CardDescription>
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
                  <TableHead>Quality Status</TableHead>
                  <TableHead>Defects</TableHead>
                  <TableHead>Test Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualityItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No quality data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  qualityItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="capitalize">{item.type}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.qualityStatus)}>{item.qualityStatus.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{item.defects}</TableCell>
                      <TableCell>{new Date(item.testDate).toLocaleDateString()}</TableCell>
                      <TableCell>{item.notes || "—"}</TableCell>
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
