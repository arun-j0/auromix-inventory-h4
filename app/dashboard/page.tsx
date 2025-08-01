"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-provider"
import { getDashboardStats } from "@/lib/firebase/dashboard"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DashboardChart } from "@/components/dashboard/dashboard-chart"
import { AlertCircle, Box, DollarSign, ShoppingBag, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user) {
          const dashboardStats = await getDashboardStats(user.uid, user.role)
          setStats(dashboardStats)
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || "User"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.ordersTrend > 0
                ? `+${stats?.ordersTrend}% from last month`
                : `${stats?.ordersTrend}% from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeClients || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.clientsTrend > 0
                ? `+${stats?.clientsTrend}% from last month`
                : `${stats?.clientsTrend}% from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thread Inventory</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalThreadKg || 0} kg</div>
            <p className="text-xs text-muted-foreground">{stats?.lowStockItems || 0} items below threshold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.revenueTrend > 0
                ? `+${stats?.revenueTrend}% from last month`
                : `${stats?.revenueTrend}% from last month`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={stats?.orderStatusData || []} type="pie" height={300} />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={stats?.monthlyOrdersData || []} type="bar" height={300} />
          </CardContent>
        </Card>
      </div>

      {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.lowStockAlerts.map((alert: any, index: number) => (
                <Alert key={index} variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Low Stock Warning</AlertTitle>
                  <AlertDescription>
                    {alert.name} is running low ({alert.currentStockKg}kg remaining, threshold: {alert.thresholdKg}kg)
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
