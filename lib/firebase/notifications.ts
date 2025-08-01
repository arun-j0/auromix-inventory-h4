import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore"
import { db } from "./config"

const NOTIFICATIONS_COLLECTION = "notifications"

export async function fetchNotifications(userId?: string) {
  try {
    let q = query(collection(db, NOTIFICATIONS_COLLECTION), orderBy("createdAt", "desc"))

    if (userId) {
      q = query(collection(db, NOTIFICATIONS_COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"))
    }

    const notificationsSnapshot = await getDocs(q)
    return notificationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching notifications:", error)
    throw error
  }
}

export async function createNotification(notificationData: any) {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...notificationData,
    }
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId)
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId))
    return true
  } catch (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where("userId", "==", userId), where("read", "==", false))

    const unreadNotifications = await getDocs(q)

    const updatePromises = unreadNotifications.docs.map((doc) =>
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
      }),
    )

    await Promise.all(updatePromises)
    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}
