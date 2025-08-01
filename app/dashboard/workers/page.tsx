"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { WorkersTable } from "@/components/workers/workers-table"
import { WorkerDialog } from "@/components/workers/worker-dialog"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { fetchWorkers } from "@/lib/firebase/workers"

export default function WorkersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<any>(null)

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        if (user) {
          const workersData = await fetchWorkers(user.uid, user.role)
          setWorkers(workersData)
        }
      } catch (error) {
        console.error("Error loading workers:", error)
        toast({
          title: "Error",
          description: "Failed to load workers. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadWorkers()
  }, [user, toast])

  const handleEditWorker = (worker: any) => {
    setEditingWorker(worker)
    setDialogOpen(true)
  }

  const handleAddWorker = () => {
    setEditingWorker(null)
    setDialogOpen(true)
  }

  const handleWorkerSaved = (savedWorker: any) => {
    setDialogOpen(false)

    // Update the workers list
    if (editingWorker) {
      setWorkers(workers.map((w) => (w.id === savedWorker.id ? savedWorker : w)))
      toast({
        title: "Worker Updated",
        description: `${savedWorker.name} has been updated successfully.`,
      })
    } else {
      setWorkers([...workers, savedWorker])
      toast({
        title: "Worker Added",
        description: `${savedWorker.name} has been added successfully.`,
      })
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
          <p className="text-muted-foreground">Manage workers and their skills</p>
        </div>
        <Button onClick={handleAddWorker}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Worker
        </Button>
      </div>

      <WorkersTable workers={workers} onEditWorker={handleEditWorker} />

      <WorkerDialog open={dialogOpen} onOpenChange={setDialogOpen} worker={editingWorker} onSave={handleWorkerSaved} />
    </div>
  )
}
