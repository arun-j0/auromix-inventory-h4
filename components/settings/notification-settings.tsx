"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Bell, Mail, AlertTriangle } from "lucide-react"

interface NotificationPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  orderUpdates: boolean
  inventoryAlerts: boolean
  systemMaintenance: boolean
  securityAlerts: boolean
  marketingEmails: boolean
  weeklyReports: boolean
  monthlyReports: boolean
}

export function NotificationSettings() {
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    inventoryAlerts: true,
    systemMaintenance: true,
    securityAlerts: true,
    marketingEmails: false,
    weeklyReports: true,
    monthlyReports: true,
  })

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = () => {
    // Here you would typically save to your backend/Firebase
    toast({
      title: "Settings Saved",
      description: "Your notification preferences have been updated.",
    })
  }

  const handleTestNotification = () => {
    toast({
      title: "Test Notification",
      description: "This is a test notification to verify your settings.",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
            </div>
            <Switch
              checked={preferences.pushNotifications}
              onCheckedChange={(checked) => handlePreferenceChange("pushNotifications", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
            </div>
            <Switch
              checked={preferences.smsNotifications}
              onCheckedChange={(checked) => handlePreferenceChange("smsNotifications", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Types
          </CardTitle>
          <CardDescription>Configure which types of alerts you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Order Updates</Label>
              <p className="text-sm text-muted-foreground">Notifications about order status changes</p>
            </div>
            <Switch
              checked={preferences.orderUpdates}
              onCheckedChange={(checked) => handlePreferenceChange("orderUpdates", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Inventory Alerts</Label>
              <p className="text-sm text-muted-foreground">Low stock and inventory warnings</p>
            </div>
            <Switch
              checked={preferences.inventoryAlerts}
              onCheckedChange={(checked) => handlePreferenceChange("inventoryAlerts", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">System Maintenance</Label>
              <p className="text-sm text-muted-foreground">Scheduled maintenance and downtime notices</p>
            </div>
            <Switch
              checked={preferences.systemMaintenance}
              onCheckedChange={(checked) => handlePreferenceChange("systemMaintenance", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Security Alerts</Label>
              <p className="text-sm text-muted-foreground">Important security-related notifications</p>
            </div>
            <Switch
              checked={preferences.securityAlerts}
              onCheckedChange={(checked) => handlePreferenceChange("securityAlerts", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
          </CardTitle>
          <CardDescription>Manage your email subscription preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">Product updates and promotional content</p>
            </div>
            <Switch
              checked={preferences.marketingEmails}
              onCheckedChange={(checked) => handlePreferenceChange("marketingEmails", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Weekly summary of your account activity</p>
            </div>
            <Switch
              checked={preferences.weeklyReports}
              onCheckedChange={(checked) => handlePreferenceChange("weeklyReports", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Monthly Reports</Label>
              <p className="text-sm text-muted-foreground">Monthly analytics and performance reports</p>
            </div>
            <Switch
              checked={preferences.monthlyReports}
              onCheckedChange={(checked) => handlePreferenceChange("monthlyReports", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave}>Save Preferences</Button>
        <Button variant="outline" onClick={handleTestNotification}>
          Send Test Notification
        </Button>
      </div>
    </div>
  )
}
