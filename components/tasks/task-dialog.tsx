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
import { createTask, updateTask } from "@/lib/firebase/tasks"
import { fetchOrders } from "@/lib/firebase/orders"
import { fetchWorkers } from "@/lib/firebase/workers"
import { useAuth } from "@/lib/auth-provider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Task, TaskStatus } from "@/types/task"
import type { Order } from "@/types/order"
import type { Worker } from "@/types/worker"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onSave: (task: Task) => void
}

export function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [formData, setFormData] = useState<Partial<Task>>({
    orderId: "",
    orderItemId: "",
    contractorId: "",
    assignedWorkerIds: [],
    productId: "",
    productName: "",
    quantity: 1,
    size: "",
    color: "",
    specialInstructions: "",
    assignedDate: new Date(),
    expectedCompletionDate: new Date(),
    status: "PENDING_APPROVAL",
    progressPercentage: 0,
    piecesCompleted: 0,
    hoursLogged: 0,
    qualityCheckRequired: true,
    totalWage: 0,
    wagePerPiece: 0,
    notes: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user) {
          const [ordersData, workersData] = await Promise.all([
            fetchOrders(user.uid, user.role),
            fetchWorkers(user.uid, user.role),
          ])
          setOrders(ordersData)
          setWorkers(workersData)
        }
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
  }, [open, user, toast])

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
      })
    } else {
      // Reset form for new task
      setFormData({
        orderId: "",
        orderItemId: "",
        contractorId: user?.uid || "",
        assignedWorkerIds: [],
        productId: "",
        productName: "",
        quantity: 1,
        size: "",
        color: "",
        specialInstructions: "",
        assignedDate: new Date(),
        expectedCompletionDate: new Date(),
        status: "PENDING_APPROVAL",
        progressPercentage: 0,
        piecesCompleted: 0,
        hoursLogged: 0,
        qualityCheckRequired: true,
        totalWage: 0,
        wagePerPiece: 0,
        notes: "",
      })
    }
  }, [task, open, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let parsedValue: any = value

    if (type === "number") {
      parsedValue = Number.parseFloat(value) || 0
    } else if (type === "date") {
      parsedValue = new Date(value)
    } else if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked
    }

    setFormData({
      ...formData,
      [name]: parsedValue,
    })

    // Calculate total wage when quantity or wage per piece changes
    if (name === "quantity" || name === "wagePerPiece") {
      const quantity = name === "quantity" ? parsedValue : formData.quantity || 0
      const wagePerPiece = name === "wagePerPiece" ? parsedValue : formData.wagePerPiece || 0
      setFormData((prev) => ({
        ...prev,
        totalWage: quantity * wagePerPiece,
      }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })

    // Update product details when order changes
    if (name === "orderId") {
      const selectedOrder = orders.find((o) => o.id === value)
      if (selectedOrder && selectedOrder.items.length > 0) {
        const firstItem = selectedOrder.items[0]
        setFormData((prev) => ({
          ...prev,
          orderItemId: firstItem.itemId,
          productId: firstItem.productId,
          productName: firstItem.productName,
          size: firstItem.size,
          color: firstItem.color,
        }))
      }
    }
  }

  const handleWorkerSelection = (workerId: string, selected: boolean) => {
    const currentWorkers = formData.assignedWorkerIds || []
    let updatedWorkers: string[]

    if (selected) {
      updatedWorkers = [...currentWorkers, workerId]
    } else {
      updatedWorkers = currentWorkers.filter((id) => id !== workerId)
    }

    setFormData({
      ...formData,
      assignedWorkerIds: updatedWorkers,
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
      if (!formData.orderId) {
        throw new Error("Please select an order")
      }

      if (!formData.productName) {
        throw new Error("Please provide product details")
      }

      let savedTask: Task
      if (task) {
        // Update existing task
        savedTask = (await updateTask(task.id, formData)) as Task
      } else {
        // Create new task
        savedTask = (await createTask({
          ...formData,
          createdBy: user.uid,
          assignedBy: user.uid,
          dailyProgress: [],
          messages: [],
          statusHistory: [
            {
              status: "PENDING_APPROVAL",
              timestamp: new Date(),
              changedBy: user.uid,
              notes: "Task created",
            },
          ],
        })) as Task
      }

      onSave(savedTask)
    } catch (error: any) {
      console.error("Error saving task:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update the task information." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order</Label>
              <Select value={formData.orderId} onValueChange={(value) => handleSelectChange("orderId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.totalQuantity} items
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input id="size" name="size" value={formData.size} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" value={formData.color} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedDate">Assigned Date</Label>
                <Input
                  id="assignedDate"
                  name="assignedDate"
                  type="date"
                  value={formData.assignedDate ? new Date(formData.assignedDate).toISOString().split("T")[0] : ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedCompletionDate">Expected Completion</Label>
                <Input
                  id="expectedCompletionDate"
                  name="expectedCompletionDate"
                  type="date"
                  value={
                    formData.expectedCompletionDate
                      ? new Date(formData.expectedCompletionDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wagePerPiece">Wage Per Piece (₹)</Label>
                <Input
                  id="wagePerPiece"
                  name="wagePerPiece"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.wagePerPiece}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalWage">Total Wage (₹)</Label>
                <Input
                  id="totalWage"
                  name="totalWage"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalWage}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status as string}
                onValueChange={(value) => handleSelectChange("status", value as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assigned Workers</Label>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                {workers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No workers available</p>
                ) : (
                  workers.map((worker) => (
                    <div key={worker.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`worker-${worker.id}`}
                        checked={(formData.assignedWorkerIds || []).includes(worker.id)}
                        onChange={(e) => handleWorkerSelection(worker.id, e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor={`worker-${worker.id}`} className="text-sm">
                        {worker.name} - {worker.skills.join(", ")}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : task ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
