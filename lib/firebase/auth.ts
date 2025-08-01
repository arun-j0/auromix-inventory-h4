import { signInWithEmailAndPassword, signOut as firebaseSignOut, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "./config"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"
import type { UserRole } from "@/types/user"

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error("Error signing in:", error)
    throw new Error(error.message || "Failed to sign in")
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

interface SignUpData {
  name: string
  email: string
  password: string
  phone: string
  role: UserRole
  referenceId?: string
}

export async function signUp({ name, email, password, phone, role, referenceId }: SignUpData) {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Generate employee code
    const empCode = `EMP-${Math.floor(100000 + Math.random() * 900000)}`

    // Create user document in Firestore
    const userData: any = {
      empCode,
      name,
      email,
      phone,
      role,
      status: "ACTIVE",
      lastLogin: serverTimestamp(),
      permissions: getDefaultPermissions(role),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Only add referenceId if it exists and has a value
    if (referenceId && referenceId.trim()) {
      userData.referenceId = referenceId
    }

    await setDoc(doc(db, "users", user.uid), userData)

    return user
  } catch (error: any) {
    console.error("Error signing up:", error)
    throw new Error(error.message || "Failed to create account")
  }
}

function getDefaultPermissions(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return {
        canCreateOrders: true,
        canApproveOrders: true,
        canManageStock: true,
        canViewReports: true,
        canManageContractors: true,
      }
    case "INTERNAL_EMPLOYEE":
      return {
        canCreateOrders: true,
        canApproveOrders: false,
        canManageStock: true,
        canViewReports: true,
        canManageContractors: false,
      }
    case "CONTRACTOR":
      return {
        canCreateOrders: false,
        canApproveOrders: false,
        canManageStock: false,
        canViewReports: false,
        canManageContractors: false,
      }
    default:
      return {
        canCreateOrders: false,
        canApproveOrders: false,
        canManageStock: false,
        canViewReports: false,
        canManageContractors: false,
      }
  }
}
