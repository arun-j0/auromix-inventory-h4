"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ClientsTable } from "@/components/clients/clients-table"
import { ClientDialog } from "@/components/clients/client-dialog"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { fetchClients } from "@/lib/firebase/clients"
import type { Client } from "@/types/client"

export default function ClientsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  useEffect(() => {
    const loadClients = async () => {
      try {
        if (user) {
          const clientsData = await fetchClients()
          setClients(clientsData)
        }
      } catch (error) {
        console.error("Error loading clients:", error)
        toast({
          title: "Error",
          description: "Failed to load clients. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [user, toast])

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setDialogOpen(true)
  }

  const handleAddClient = () => {
    setEditingClient(null)
    setDialogOpen(true)
  }

  const handleClientSaved = (savedClient: Client) => {
    setDialogOpen(false)

    // Update the clients list
    if (editingClient) {
      setClients(clients.map((c) => (c.id === savedClient.id ? savedClient : c)))
      toast({
        title: "Client Updated",
        description: `${savedClient.companyName} has been updated successfully.`,
      })
    } else {
      setClients([...clients, savedClient])
      toast({
        title: "Client Added",
        description: `${savedClient.companyName} has been added successfully.`,
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
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your client information and details</p>
        </div>
        <Button onClick={handleAddClient}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <ClientsTable clients={clients} onEditClient={handleEditClient} />

      <ClientDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editingClient} onSave={handleClientSaved} />
    </div>
  )
}
