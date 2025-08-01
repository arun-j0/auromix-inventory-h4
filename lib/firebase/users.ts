import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"

const USERS_COLLECTION = "users"

export async function getUserData(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId))

    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() }
    }

    return null
  } catch (error) {
    console.error("Error fetching user data:", error)
    throw error
  }
}

export async function fetchUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION))
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

export async function createUser(userData: any) {
  try {
    const docRef = await addDoc(collection(db, USERS_COLLECTION), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...userData,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUser(userId: string, userData: any) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: userId,
      ...userData,
    }
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function deleteUser(userId: string) {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId))
    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

export async function updateUserProfile(userId: string, profileData: any) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: userId,
      ...profileData,
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}
