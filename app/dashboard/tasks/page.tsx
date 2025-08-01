"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { TasksTable } from "@/components/tasks/tasks-table"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { fetchTasks } from "@/lib/firebase/tasks"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TasksPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const loadTasks = async () => {
      try {
        if (user) {
          const tasksData = await fetchTasks(user.uid, user.role)
          setTasks(tasksData)
        }
      } catch (error) {
        console.error("Error loading tasks:", error)
        toast({
          title: "Error",
          description: "Failed to load tasks. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [user, toast])

  const handleEditTask = (task: any) => {
    setEditingTask(task)
    setDialogOpen(true)
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setDialogOpen(true)
  }

  const handleTaskSaved = (savedTask: any) => {
    setDialogOpen(false)

    // Update the tasks list
    if (editingTask) {
      setTasks(tasks.map((t) => (t.id === savedTask.id ? savedTask : t)))
      toast({
        title: "Task Updated",
        description: `Task #${savedTask.taskNumber} has been updated successfully.`,
      })
    } else {
      setTasks([...tasks, savedTask])
      toast({
        title: "Task Added",
        description: `Task #${savedTask.taskNumber} has been added successfully.`,
      })
    }
  }

  const filteredTasks =
    activeTab === "all"
      ? tasks
      : tasks.filter((task) => {
          if (activeTab === "pending") return task.status === "PENDING_APPROVAL"
          if (activeTab === "approved") return task.status === "APPROVED"
          if (activeTab === "in-progress") return task.status === "IN_PROGRESS"
          if (activeTab === "completed") return task.status === "COMPLETED"
          if (activeTab === "rejected") return task.status === "REJECTED"
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
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage production tasks and assignments</p>
        </div>
        {user?.role === "CONTRACTOR" && (
          <Button onClick={handleAddTask}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <TasksTable tasks={filteredTasks} onEditTask={handleEditTask} />
        </TabsContent>
      </Tabs>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editingTask} onSave={handleTaskSaved} />
    </div>
  )
}
