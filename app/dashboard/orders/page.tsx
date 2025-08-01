"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { OrdersTable } from "@/components/orders/orders-table"
import { OrderDialog } from "@/components/orders/order-dialog"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { fetchOrders } from "@/lib/firebase/orders"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function OrdersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const loadOrders = async () => {
      try {
        if (user) {
          const ordersData = await fetchOrders(user.uid, user.role)
          setOrders(ordersData)
        }
      } catch (error) {
        console.error("Error loading orders:", error)
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [user, toast])

  const handleEditOrder = (order: any) => {
    setEditingOrder(order)
    setDialogOpen(true)
  }

  const handleAddOrder = () => {
    setEditingOrder(null)
    setDialogOpen(true)
  }

  const handleOrderSaved = (savedOrder: any) => {
    setDialogOpen(false)

    // Update the orders list
    if (editingOrder) {
      setOrders(orders.map((o) => (o.id === savedOrder.id ? savedOrder : o)))
      toast({
        title: "Order Updated",
        description: `Order #${savedOrder.orderNumber} has been updated successfully.`,
      })
    } else {
      setOrders([...orders, savedOrder])
      toast({
        title: "Order Added",
        description: `Order #${savedOrder.orderNumber} has been added successfully.`,
      })
    }
  }

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((order) => {
          if (activeTab === "draft") return order.status === "DRAFT"
          if (activeTab === "confirmed") return order.status === "CONFIRMED"
          if (activeTab === "in-progress") return order.status === "IN_PROGRESS"
          if (activeTab === "completed") return order.status === "COMPLETED" || order.status === "PARTIALLY_COMPLETED"
          if (activeTab === "cancelled") return order.status === "CANCELLED"
          return true
        })

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage client orders and production status</p>
        </div>
        {(user?.role === "ADMIN" || user?.role === "INTERNAL_EMPLOYEE") && (
          <Button onClick={handleAddOrder}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <OrdersTable orders={filteredOrders} onEditOrder={handleEditOrder} />
        </TabsContent>
      </Tabs>

      <OrderDialog open={dialogOpen} onOpenChange={setDialogOpen} order={editingOrder} onSave={handleOrderSaved} />
    </div>
  )
}
