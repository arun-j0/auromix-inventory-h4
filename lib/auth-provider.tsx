"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase/config"
import { getUserData } from "./firebase/users"
import type { AuthUser } from "@/types/user"

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userData = await getUserData(firebaseUser.uid)

          if (userData) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: userData.name || "",
              role: userData.role || "INTERNAL_EMPLOYEE",
              permissions: userData.permissions || {
                canCreateOrders: false,
                canApproveOrders: false,
                canManageStock: false,
                canViewReports: false,
                canManageContractors: false,
              },
            })
          } else {
            // User document doesn't exist in Firestore
            setUser(null)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
