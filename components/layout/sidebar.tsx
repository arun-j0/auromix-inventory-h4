"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-provider"
import {
  BarChart3,
  Bell,
  Box,
  ClipboardList,
  FileText,
  Home,
  Package,
  Settings,
  ShoppingCart,
  PrinterIcon as Spool,
  Users,
  UserCog,
  HardHatIcon as UserHardHat,
} from "lucide-react"

interface SidebarLink {
  href: string
  icon: React.ReactNode
  title: string
  roles: string[]
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      // This would be replaced with actual API call
      setUnreadNotifications(5)
    }

    if (user) {
      fetchUnreadCount()
    }
  }, [user])

  const links: SidebarLink[] = [
    {
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      title: "Dashboard",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE", "CONTRACTOR"],
    },
    {
      href: "/dashboard/clients",
      icon: <Users className="h-5 w-5" />,
      title: "Clients",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE"],
    },
    {
      href: "/dashboard/raw-materials",
      icon: <Spool className="h-5 w-5" />,
      title: "Raw Materials",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE"],
    },
    {
      href: "/dashboard/thread-inventory",
      icon: <Box className="h-5 w-5" />,
      title: "Thread Inventory",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE"],
    },
    {
      href: "/dashboard/products",
      icon: <Package className="h-5 w-5" />,
      title: "Products",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE"],
    },
    {
      href: "/dashboard/orders",
      icon: <ShoppingCart className="h-5 w-5" />,
      title: "Orders",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE", "CONTRACTOR"],
    },
    {
      href: "/dashboard/contractors",
      icon: <UserCog className="h-5 w-5" />,
      title: "Contractors",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE"],
    },
    {
      href: "/dashboard/workers",
      icon: <UserHardHat className="h-5 w-5" />,
      title: "Workers",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE", "CONTRACTOR"],
    },
    {
      href: "/dashboard/tasks",
      icon: <ClipboardList className="h-5 w-5" />,
      title: "Tasks",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE", "CONTRACTOR"],
    },
    {
      href: "/dashboard/reports",
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Reports",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE"],
    },
    {
      href: "/dashboard/notifications",
      icon: <Bell className="h-5 w-5" />,
      title: "Notifications",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE", "CONTRACTOR"],
    },
    {
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      title: "Settings",
      roles: ["ADMIN", "INTERNAL_EMPLOYEE", "CONTRACTOR"],
    },
  ]

  const filteredLinks = links.filter((link) => user && link.roles.includes(user.role))

  return (
    <div className="hidden border-r bg-muted/40 lg:block lg:w-64">
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <FileText className="h-6 w-6" />
            <span className="">Auromix</span>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav className="grid items-start px-2 py-4 text-sm font-medium">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  pathname === link.href ? "bg-muted text-primary" : "text-muted-foreground",
                )}
              >
                {link.icon}
                {link.title}
                {link.href === "/dashboard/notifications" && unreadNotifications > 0 && (
                  <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {unreadNotifications}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </div>
  )
}
