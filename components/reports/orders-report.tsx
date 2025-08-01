"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileBarChart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/lib/auth-provider"
import { fetchOrders } from "@/lib/firebase/orders"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export function OrdersReport() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user) {
          const ordersData = await fetchOrders(user.uid, user.role)
          setOrders(ordersData)
        }
      } catch (error) {
        console.error("Error loading orders data:", error)
        toast({
          title: "Error",
          description: "Failed to load orders data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being generated and will download shortly.",
    })
    // In a real implementation, this would generate and download a CSV/Excel file
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Process data for charts
  const currentDate = new Date()
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(currentDate)
    date.setMonth(currentDate.getMonth() - i)
    return date.toLocaleString("default", { month: "short" })
  }).reverse()

  const ordersByMonth = last6Months.map((month) => {
    return {
      month,
      count: orders.filter((order) => {
        const orderDate = new Date(order.orderDate)
        return orderDate.toLocaleString("default", { month: "short" }) === month
      }).length,
      value: orders
        .filter((order) => {
          const orderDate = new Date(order.orderDate)
          return orderDate.toLocaleString("default", { month: "short" }) === month
        })
        .reduce((sum, order) => sum + (order.totalValue || 0), 0),
    }
  })

  const orderStatusData = [
    { name: "Draft", value: orders.filter((o) => o.status === "DRAFT").length },
    { name: "Confirmed", value: orders.filter((o) => o.status === "CONFIRMED").length },
    { name: "In Progress", value: orders.filter((o) => o.status === "IN_PROGRESS").length },
    { name: "Completed", value: orders.filter((o) => o.status === "COMPLETED").length },
    { name: "Cancelled", value: orders.filter((o) => o.status === "CANCELLED").length },
  ].filter((item) => item.value > 0)

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  // Calculate totals
  const totalOrders = orders.length
  const totalOrderValue = orders.reduce((sum, order) => sum + (order.totalValue || 0), 0)
  const completedOrders = orders.filter((o) => o.status === "COMPLETED").length
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orders Report</h2>
          <p className="text-muted-foreground">Analysis of order volume, value, and status</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Order Volume (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {ordersByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Order Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">No order data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">No order status data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Value (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {ordersByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" name="Order Value (₹)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No order value data available</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalOrderValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
