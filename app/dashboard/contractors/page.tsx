"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ContractorsTable } from "@/components/contractors/contractors-table"
import { ContractorDialog } from "@/components/contractors/contractor-dialog"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { fetchContractors } from "@/lib/firebase/contractors"

export default function ContractorsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [contractors, setContractors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContractor, setEditingContractor] = useState<any>(null)

  useEffect(() => {
    const loadContractors = async () => {
      try {
        if (user) {
          const contractorsData = await fetchContractors()
          setContractors(contractorsData)
        }
      } catch (error) {
        console.error("Error loading contractors:", error)
        toast({
          title: "Error",
          description: "Failed to load contractors. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadContractors()
  }, [user, toast])

  const handleEditContractor = (contractor: any) => {
    setEditingContractor(contractor)
    setDialogOpen(true)
  }

  const handleAddContractor = () => {
    setEditingContractor(null)
    setDialogOpen(true)
  }

  const handleContractorSaved = (savedContractor: any) => {
    setDialogOpen(false)

    // Update the contractors list
    if (editingContractor) {
      setContractors(contractors.map((c) => (c.id === savedContractor.id ? savedContractor : c)))
      toast({
        title: "Contractor Updated",
        description: `${savedContractor.contactPersonName} has been updated successfully.`,
      })
    } else {
      setContractors([...contractors, savedContractor])
      toast({
        title: "Contractor Added",
        description: `${savedContractor.contactPersonName} has been added successfully.`,
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
          <h1 className="text-3xl font-bold tracking-tight">Contractors</h1>
          <p className="text-muted-foreground">Manage contractors and their details</p>
        </div>
        <Button onClick={handleAddContractor}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Contractor
        </Button>
      </div>

      <ContractorsTable contractors={contractors} onEditContractor={handleEditContractor} />

      <ContractorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contractor={editingContractor}
        onSave={handleContractorSaved}
      />
    </div>
  )
}
