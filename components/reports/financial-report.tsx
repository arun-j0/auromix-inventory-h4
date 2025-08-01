"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { fetchOrders } from "@/lib/firebase/orders"
import { fetchRawMaterials } from "@/lib/firebase/raw-materials"
import { fetchProducts } from "@/lib/firebase/products"
import { Download, DollarSign, TrendingUp, TrendingDown, ShoppingCart } from "lucide-react"
import type { Order } from "@/types/order"

interface FinancialSummary {
  totalRevenue: number
  totalCosts: number
  grossProfit: number
  profitMargin: number
  totalOrders: number
  averageOrderValue: number
}

interface MonthlyData {
  month: string
  revenue: number
  costs: number
  profit: number
  orders: number
}

export function FinancialReport() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalCosts: 0,
    grossProfit: 0,
    profitMargin: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      const [orders, rawMaterials, products] = await Promise.all([fetchOrders(), fetchRawMaterials(), fetchProducts()])

      // Calculate revenue from orders
      const totalRevenue = orders.reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0)
      const totalOrders = orders.length
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Calculate costs (simplified - raw materials inventory value)
      const rawMaterialsCost = rawMaterials.reduce(
        (sum: any, material: any) => sum + (material.currentStock || 0) * (material.unitPrice || 0),
        0,
      )

      // Calculate product inventory value
      const productValue = products.reduce(
        (sum: any, product: any) => sum + (product.stock || 0) * (product.price || 0),
        0,
      )

      const totalCosts = rawMaterialsCost
      const grossProfit = totalRevenue - totalCosts
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

      setSummary({
        totalRevenue,
        totalCosts,
        grossProfit,
        profitMargin,
        totalOrders,
        averageOrderValue,
      })

      // Generate monthly data (last 6 months)
      const monthlyDataMap = new Map<string, MonthlyData>()
      const now = new Date()

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
        const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

        monthlyDataMap.set(monthKey, {
          month: monthName,
          revenue: 0,
          costs: 0,
          profit: 0,
          orders: 0,
        })
      }

      // Aggregate orders by month
      orders.forEach((order: Order) => {
        if (order.createdAt) {
          const orderDate = new Date(order.createdAt.seconds * 1000)
          const monthKey = orderDate.toISOString().slice(0, 7)
          const monthData = monthlyDataMap.get(monthKey)

          if (monthData) {
            monthData.revenue += order.totalAmount || 0
            monthData.orders += 1
            monthData.costs += (order.totalAmount || 0) * 0.6 // Assume 60% cost ratio
            monthData.profit = monthData.revenue - monthData.costs
          }
        }
      })

      setMonthlyData(Array.from(monthlyDataMap.values()))
    } catch (error) {
      console.error("Error loading financial data:", error)
      toast({
        title: "Error",
        description: "Failed to load financial data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    const csvContent = [
      ["Month", "Revenue", "Costs", "Profit", "Orders"].join(","),
      ...monthlyData.map((data) =>
        [data.month, data.revenue.toFixed(2), data.costs.toFixed(2), data.profit.toFixed(2), data.orders].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `financial-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadFinancialData()
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {summary.totalOrders} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${summary.grossProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{summary.profitMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${summary.totalCosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Operational costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.averageOrderValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Financial Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Report</CardTitle>
              <CardDescription>Monthly revenue, costs, and profit analysis</CardDescription>
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
                  <TableHead>Month</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Costs</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Avg Order Value</TableHead>
                  <TableHead>Profit Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No financial data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyData.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{data.month}</TableCell>
                      <TableCell>${data.revenue.toLocaleString()}</TableCell>
                      <TableCell>${data.costs.toLocaleString()}</TableCell>
                      <TableCell className={data.profit >= 0 ? "text-green-600" : "text-red-600"}>
                        ${data.profit.toLocaleString()}
                      </TableCell>
                      <TableCell>{data.orders}</TableCell>
                      <TableCell>${data.orders > 0 ? (data.revenue / data.orders).toLocaleString() : "0"}</TableCell>
                      <TableCell className={data.profit >= 0 ? "text-green-600" : "text-red-600"}>
                        {data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : "0"}%
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
