"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrdersReport } from "@/components/reports/orders-report"
import { InventoryReport } from "@/components/reports/inventory-report"
import { ContractorReport } from "@/components/reports/contractor-report"
import { FinancialReport } from "@/components/reports/financial-report"
import { QualityReport } from "@/components/reports/quality-report"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("orders")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">View and analyze business performance metrics</p>
      </div>

      <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders Report</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersReport />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Report</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryReport />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contractors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contractor Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              <ContractorReport />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="financial" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Report</CardTitle>
            </CardHeader>
            <CardContent>
              <FinancialReport />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quality" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Report</CardTitle>
            </CardHeader>
            <CardContent>
              <QualityReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
