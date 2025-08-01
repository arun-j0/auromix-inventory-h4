import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "./config"
import type { DashboardStats, ChartData, LowStockAlert } from "@/types/dashboard"

export async function getDashboardStats(userId: string, role: string): Promise<DashboardStats> {
  try {
    // Fetch total orders
    const ordersQuery = collection(db, "orders")
    const ordersSnapshot = await getDocs(ordersQuery)
    const totalOrders = ordersSnapshot.size

    // Calculate orders trend (comparing current month to previous month)
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const currentMonthOrdersQuery = query(
      collection(db, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(currentMonthStart)),
    )
    const previousMonthOrdersQuery = query(
      collection(db, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(previousMonthStart)),
      where("createdAt", "<", Timestamp.fromDate(currentMonthStart)),
    )

    const currentMonthOrdersSnapshot = await getDocs(currentMonthOrdersQuery)
    const previousMonthOrdersSnapshot = await getDocs(previousMonthOrdersQuery)

    const currentMonthOrders = currentMonthOrdersSnapshot.size
    const previousMonthOrders = previousMonthOrdersSnapshot.size

    const ordersTrend =
      previousMonthOrders === 0
        ? 100
        : Math.round(((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100)

    // Fetch active clients
    const clientsQuery = query(collection(db, "clients"), where("status", "==", "ACTIVE"))
    const clientsSnapshot = await getDocs(clientsQuery)
    const activeClients = clientsSnapshot.size

    // Calculate clients trend
    const clientsLastMonthQuery = query(
      collection(db, "clients"),
      where("createdAt", ">=", Timestamp.fromDate(previousMonthStart)),
      where("createdAt", "<", Timestamp.fromDate(currentMonthStart)),
    )
    const clientsThisMonthQuery = query(
      collection(db, "clients"),
      where("createdAt", ">=", Timestamp.fromDate(currentMonthStart)),
    )

    const clientsLastMonthSnapshot = await getDocs(clientsLastMonthQuery)
    const clientsThisMonthSnapshot = await getDocs(clientsThisMonthQuery)

    const clientsLastMonth = clientsLastMonthSnapshot.size
    const clientsThisMonth = clientsThisMonthSnapshot.size

    const clientsTrend =
      clientsLastMonth === 0
        ? clientsThisMonth > 0
          ? 100
          : 0
        : Math.round(((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100)

    // Fetch thread inventory data
    const threadInventoryQuery = collection(db, "threadInventory")
    const threadInventorySnapshot = await getDocs(threadInventoryQuery)

    let totalThreadKg = 0
    let lowStockItems = 0
    const lowStockAlerts: LowStockAlert[] = []

    threadInventorySnapshot.forEach((doc) => {
      const data = doc.data()
      totalThreadKg += data.currentStockKg || 0

      if ((data.currentStockKg || 0) <= (data.thresholdKg || 0)) {
        lowStockItems++
        lowStockAlerts.push({
          id: doc.id,
          name: data.materialName || `Thread ${doc.id}`,
          currentStockKg: data.currentStockKg || 0,
          thresholdKg: data.thresholdKg || 0,
        })
      }
    })

    // Calculate revenue data
    const completedOrdersQuery = query(
      collection(db, "orders"),
      where("status", "in", ["COMPLETED", "PARTIALLY_COMPLETED"]),
    )
    const completedOrdersSnapshot = await getDocs(completedOrdersQuery)

    let totalRevenue = 0
    completedOrdersSnapshot.forEach((doc) => {
      const data = doc.data()
      totalRevenue += data.totalValue || 0
    })

    // Calculate revenue trend
    const revenueLastMonthQuery = query(
      collection(db, "orders"),
      where("status", "in", ["COMPLETED", "PARTIALLY_COMPLETED"]),
      where("updatedAt", ">=", Timestamp.fromDate(previousMonthStart)),
      where("updatedAt", "<", Timestamp.fromDate(currentMonthStart)),
    )

    const revenueThisMonthQuery = query(
      collection(db, "orders"),
      where("status", "in", ["COMPLETED", "PARTIALLY_COMPLETED"]),
      where("updatedAt", ">=", Timestamp.fromDate(currentMonthStart)),
    )

    const revenueLastMonthSnapshot = await getDocs(revenueLastMonthQuery)
    const revenueThisMonthSnapshot = await getDocs(revenueThisMonthQuery)

    let revenueLastMonth = 0
    let revenueThisMonth = 0

    revenueLastMonthSnapshot.forEach((doc) => {
      revenueLastMonth += doc.data().totalValue || 0
    })

    revenueThisMonthSnapshot.forEach((doc) => {
      revenueThisMonth += doc.data().totalValue || 0
    })

    const revenueTrend =
      revenueLastMonth === 0
        ? revenueThisMonth > 0
          ? 100
          : 0
        : Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)

    // Get order status data for chart
    const orderStatusData: ChartData[] = []
    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      PARTIALLY_COMPLETED: 0,
      CANCELLED: 0,
    }

    ordersSnapshot.forEach((doc) => {
      const status = doc.data().status
      if (status in statusCounts) {
        statusCounts[status]++
      }
    })

    for (const [status, count] of Object.entries(statusCounts)) {
      if (count > 0) {
        orderStatusData.push({
          label: status
            .replace("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count,
        })
      }
    }

    // Get monthly orders data for chart
    const monthlyOrdersData: ChartData[] = []
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentYear = now.getFullYear()

    for (let i = 0; i < 6; i++) {
      const month = now.getMonth() - i
      const year = currentYear + Math.floor(month / 12)
      const adjustedMonth = ((month % 12) + 12) % 12 // Handle negative months

      const monthStart = new Date(year, adjustedMonth, 1)
      const monthEnd = new Date(year, adjustedMonth + 1, 0)

      const monthOrdersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", Timestamp.fromDate(monthStart)),
        where("createdAt", "<=", Timestamp.fromDate(monthEnd)),
      )

      const monthOrdersSnapshot = await getDocs(monthOrdersQuery)

      monthlyOrdersData.unshift({
        label: months[adjustedMonth],
        value: monthOrdersSnapshot.size,
      })
    }

    return {
      totalOrders,
      ordersTrend,
      activeClients,
      clientsTrend,
      totalThreadKg,
      lowStockItems,
      totalRevenue,
      revenueTrend,
      orderStatusData,
      monthlyOrdersData,
      lowStockAlerts,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    // Return empty data structure if there's an error
    return {
      totalOrders: 0,
      ordersTrend: 0,
      activeClients: 0,
      clientsTrend: 0,
      totalThreadKg: 0,
      lowStockItems: 0,
      totalRevenue: 0,
      revenueTrend: 0,
      orderStatusData: [],
      monthlyOrdersData: [],
      lowStockAlerts: [],
    }
  }
}
