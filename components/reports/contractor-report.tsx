"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { fetchContractors } from "@/lib/firebase/contractors"
import { Download, Users, CheckCircle, Clock, XCircle } from "lucide-react"
import type { Contractor } from "@/types/contractor"

interface ContractorSummary {
  totalContractors: number
  activeContractors: number
  pendingContractors: number
  inactiveContractors: number
  totalValue: number
}

export function ContractorReport() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [summary, setSummary] = useState<ContractorSummary>({
    totalContractors: 0,
    activeContractors: 0,
    pendingContractors: 0,
    inactiveContractors: 0,
    totalValue: 0,
  })

  const loadContractorData = async () => {
    try {
      setLoading(true)
      const data = await fetchContractors()
      setContractors(data)

      // Calculate summary
      const activeCount = data.filter((c) => c.status === "active").length
      const pendingCount = data.filter((c) => c.status === "pending").length
      const inactiveCount = data.filter((c) => c.status === "inactive").length
      const totalValue = data.reduce((sum, c) => sum + (c.contractValue || 0), 0)

      setSummary({
        totalContractors: data.length,
        activeContractors: activeCount,
        pendingContractors: pendingCount,
        inactiveContractors: inactiveCount,
        totalValue,
      })
    } catch (error) {
      console.error("Error loading contractor data:", error)
      toast({
        title: "Error",
        description: "Failed to load contractor data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const exportReport = () => {
    const csvContent = [
      [
        "Name",
        "Company",
        "Email",
        "Phone",
        "Specialization",
        "Status",
        "Contract Value",
        "Start Date",
        "End Date",
      ].join(","),
      ...contractors.map((contractor) =>
        [
          contractor.name,
          contractor.company || "",
          contractor.email,
          contractor.phone,
          contractor.specialization || "",
          contractor.status,
          contractor.contractValue || 0,
          contractor.startDate || "",
          contractor.endDate || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `contractor-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadContractorData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contractors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalContractors}</div>
            <p className="text-xs text-muted-foreground">Registered contractors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.activeContractors}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.pendingContractors}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Contract values</p>
          </CardContent>
        </Card>
      </div>

      {/* Contractor Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contractor Report</CardTitle>
              <CardDescription>Complete contractor information and status</CardDescription>
            </div>
            <Button onClick={exportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contract Value</TableHead>
                  <TableHead>Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No contractors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  contractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell className="font-medium">{contractor.name}</TableCell>
                      <TableCell>{contractor.company || "N/A"}</TableCell>
                      <TableCell>{contractor.email}</TableCell>
                      <TableCell>{contractor.phone}</TableCell>
                      <TableCell>{contractor.specialization || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contractor.status)}>{contractor.status.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>${(contractor.contractValue || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {contractor.startDate && contractor.endDate
                          ? `${new Date(contractor.startDate).toLocaleDateString()} - ${new Date(contractor.endDate).toLocaleDateString()}`
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
