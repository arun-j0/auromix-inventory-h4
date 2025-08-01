"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ProductsTable } from "@/components/products/products-table"
import { ProductDialog } from "@/components/products/product-dialog"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { fetchProducts } from "@/lib/firebase/products"

export default function ProductsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        if (user) {
          const productsData = await fetchProducts()
          setProducts(productsData)
        }
      } catch (error) {
        console.error("Error loading products:", error)
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [user, toast])

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setDialogOpen(true)
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setDialogOpen(true)
  }

  const handleProductSaved = (savedProduct: any) => {
    setDialogOpen(false)

    // Update the products list
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === savedProduct.id ? savedProduct : p)))
      toast({
        title: "Product Updated",
        description: `${savedProduct.name} has been updated successfully.`,
      })
    } else {
      setProducts([...products, savedProduct])
      toast({
        title: "Product Added",
        description: `${savedProduct.name} has been added successfully.`,
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
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog and specifications</p>
        </div>
        <Button onClick={handleAddProduct}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <ProductsTable products={products} onEditProduct={handleEditProduct} />

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSave={handleProductSaved}
      />
    </div>
  )
}
