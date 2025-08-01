"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { WorkerDialog } from "./worker-dialog"
import { fetchWorkers, deleteWorker } from "@/lib/firebase/workers"
import { MoreHorizontal, Plus, Search, Edit, Trash2 } from "lucide-react"
import type { Worker } from "@/types/worker"

export function WorkersTable() {
  const { toast } = useToast()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)

  const loadWorkers = async () => {
    try {
      setLoading(true)
      const data = await fetchWorkers()
      setWorkers(data)
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

  useEffect(() => {
    loadWorkers()
  }, [])

  const handleEdit = (worker: Worker) => {
    setSelectedWorker(worker)
    setDialogOpen(true)
  }

  const handleDelete = async (workerId: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) return

    try {
      await deleteWorker(workerId)
      toast({
        title: "Worker Deleted",
        description: "Worker has been deleted successfully.",
      })
      loadWorkers()
    } catch (error) {
      console.error("Error deleting worker:", error)
      toast({
        title: "Error",
        description: "Failed to delete worker. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedWorker(null)
  }

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "on_leave":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workers</CardTitle>
              <CardDescription>Manage your workforce and employee information</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      {searchTerm ? "No workers found matching your search." : "No workers found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium">{worker.name}</TableCell>
                      <TableCell>{worker.email}</TableCell>
                      <TableCell>{worker.position}</TableCell>
                      <TableCell className="capitalize">{worker.department.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(worker.status)}>
                          {worker.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>${worker.salary?.toLocaleString() || "N/A"}</TableCell>
                      <TableCell>{worker.hireDate ? new Date(worker.hireDate).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(worker)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(worker.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <WorkerDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        worker={selectedWorker}
        onSuccess={loadWorkers}
      />
    </div>
  )
}
