"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { RawMaterialsTable } from "@/components/raw-materials/raw-materials-table"
import { RawMaterialDialog } from "@/components/raw-materials/raw-material-dialog"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { fetchRawMaterials } from "@/lib/firebase/raw-materials"

export default function RawMaterialsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        if (user) {
          const materialsData = await fetchRawMaterials()
          setMaterials(materialsData)
        }
      } catch (error) {
        console.error("Error loading raw materials:", error)
        toast({
          title: "Error",
          description: "Failed to load raw materials. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMaterials()
  }, [user, toast])

  const handleEditMaterial = (material: any) => {
    setEditingMaterial(material)
    setDialogOpen(true)
  }

  const handleAddMaterial = () => {
    setEditingMaterial(null)
    setDialogOpen(true)
  }

  const handleMaterialSaved = (savedMaterial: any) => {
    setDialogOpen(false)

    // Update the materials list
    if (editingMaterial) {
      setMaterials(materials.map((m) => (m.id === savedMaterial.id ? savedMaterial : m)))
      toast({
        title: "Material Updated",
        description: `${savedMaterial.name} has been updated successfully.`,
      })
    } else {
      setMaterials([...materials, savedMaterial])
      toast({
        title: "Material Added",
        description: `${savedMaterial.name} has been added successfully.`,
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
          <h1 className="text-3xl font-bold tracking-tight">Raw Materials</h1>
          <p className="text-muted-foreground">Manage thread types and raw materials</p>
        </div>
        <Button onClick={handleAddMaterial}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </div>

      <RawMaterialsTable materials={materials} onEditMaterial={handleEditMaterial} />

      <RawMaterialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        material={editingMaterial}
        onSave={handleMaterialSaved}
      />
    </div>
  )
}
