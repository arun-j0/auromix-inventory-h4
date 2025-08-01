"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, PlusCircle } from "lucide-react"
import { ThreadInventoryTable } from "@/components/thread-inventory/thread-inventory-table"
import { ThreadInventoryDialog } from "@/components/thread-inventory/thread-inventory-dialog"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { fetchThreadInventory } from "@/lib/firebase/thread-inventory"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function ThreadInventoryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInventory, setEditingInventory] = useState<any>(null)
  const [stats, setStats] = useState<any>({
    totalStock: 0,
    totalValue: 0,
    lowStockItems: 0,
  })

  useEffect(() => {
    const loadInventory = async () => {
      try {
        if (user) {
          const inventoryData = await fetchThreadInventory()
          setInventory(inventoryData)

          // Calculate stats
          const totalStock = inventoryData.reduce((sum: number, item: any) => sum + item.currentStockKg, 0)
          const totalValue = inventoryData.reduce((sum: number, item: any) => sum + item.totalValue, 0)
          const lowStockItems = inventoryData.filter((item: any) => item.currentStockKg <= item.thresholdKg).length

          setStats({ totalStock, totalValue, lowStockItems })
        }
      } catch (error) {
        console.error("Error loading thread inventory:", error)
        toast({
          title: "Error",
          description: "Failed to load thread inventory. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadInventory()
  }, [user, toast])

  const handleEditInventory = (inventoryItem: any) => {
    setEditingInventory(inventoryItem)
    setDialogOpen(true)
  }

  const handleAddInventory = () => {
    setEditingInventory(null)
    setDialogOpen(true)
  }

  const handleInventorySaved = (savedInventory: any) => {
    setDialogOpen(false)

    // Update the inventory list
    if (editingInventory) {
      setInventory(inventory.map((i) => (i.id === savedInventory.id ? savedInventory : i)))
      toast({
        title: "Inventory Updated",
        description: `Thread inventory has been updated successfully.`,
      })
    } else {
      setInventory([...inventory, savedInventory])
      toast({
        title: "Inventory Added",
        description: `Thread inventory has been added successfully.`,
      })
    }

    // Recalculate stats
    const totalStock = inventory.reduce((sum: number, item: any) => sum + item.currentStockKg, 0)
    const totalValue = inventory.reduce((sum: number, item: any) => sum + item.totalValue, 0)
    const lowStockItems = inventory.filter((item: any) => item.currentStockKg <= item.thresholdKg).length

    setStats({ totalStock, totalValue, lowStockItems })
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Thread Inventory</h1>
          <p className="text-muted-foreground">Manage thread stock levels and inventory</p>
        </div>
        <Button onClick={handleAddInventory}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Inventory
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStock.toFixed(2)} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockItems}</div>
          </CardContent>
        </Card>
      </div>

      {stats.lowStockItems > 0 && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock Warning</AlertTitle>
          <AlertDescription>
            {stats.lowStockItems} thread types are below their threshold levels. Please restock soon.
          </AlertDescription>
        </Alert>
      )}

      <ThreadInventoryTable inventory={inventory} onEditInventory={handleEditInventory} />

      <ThreadInventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        inventoryItem={editingInventory}
        onSave={handleInventorySaved}
      />
    </div>
  )
}
