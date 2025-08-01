"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { fetchNotifications, markNotificationAsRead } from "@/lib/firebase/notifications"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export default function NotificationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        if (user) {
          const notificationsData = await fetchNotifications(user.uid)
          setNotifications(notificationsData)
        }
      } catch (error) {
        console.error("Error loading notifications:", error)
        toast({
          title: "Error",
          description: "Failed to load notifications. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [user, toast])

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)

      if (unreadNotifications.length === 0) {
        toast({
          title: "No unread notifications",
          description: "All notifications are already marked as read.",
        })
        return
      }

      for (const notification of unreadNotifications) {
        await markNotificationAsRead(notification.id)
      }

      // Update local state
      setNotifications(notifications.map((n) => ({ ...n, read: true })))

      toast({
        title: "Success",
        description: `Marked ${unreadNotifications.length} notifications as read.`,
      })
    } catch (error) {
      console.error("Error marking notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notifications as read. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)

      // Update local state
      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))

      toast({
        title: "Success",
        description: "Notification marked as read.",
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read. Please try again.",
        variant: "destructive",
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

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleMarkAllAsRead} variant="outline">
          <Check className="mr-2 h-4 w-4" />
          Mark All as Read
        </Button>
      </div>

      <NotificationsList notifications={notifications} onMarkAsRead={handleMarkAsRead} />
    </div>
  )
}
