import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore"
import { db } from "./config"

const ORDERS_COLLECTION = "orders"

export async function fetchOrders(userId: string, role: string) {
  try {
    let ordersQuery = collection(db, ORDERS_COLLECTION)

    // If user is not an admin, filter orders
    if (role === "INTERNAL_EMPLOYEE") {
      ordersQuery = query(ordersQuery, where("createdBy", "==", userId))
    } else if (role === "CONTRACTOR") {
      ordersQuery = query(ordersQuery, where("assignedContractorId", "==", userId))
    }

    const ordersSnapshot = await getDocs(ordersQuery)
    return ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching orders:", error)
    throw error
  }
}

export async function getOrder(orderId: string) {
  try {
    const orderDoc = await getDoc(doc(db, ORDERS_COLLECTION, orderId))

    if (orderDoc.exists()) {
      return { id: orderDoc.id, ...orderDoc.data() }
    }

    return null
  } catch (error) {
    console.error("Error fetching order:", error)
    throw error
  }
}

export async function createOrder(orderData: any) {
  try {
    // Generate order number
    const year = new Date().getFullYear()
    const ordersSnapshot = await getDocs(collection(db, ORDERS_COLLECTION))
    const orderCount = ordersSnapshot.size + 1
    const orderNumber = `AUR-ORD-${year}-${orderCount.toString().padStart(3, "0")}`

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      orderNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      orderNumber,
      ...orderData,
    }
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

export async function updateOrder(orderId: string, orderData: any) {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId)
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: orderId,
      ...orderData,
    }
  } catch (error) {
    console.error("Error updating order:", error)
    throw error
  }
}

export async function deleteOrder(orderId: string) {
  try {
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId))
    return true
  } catch (error) {
    console.error("Error deleting order:", error)
    throw error
  }
}

export async function approveOrder(orderId: string, approverId: string) {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId)
    await updateDoc(orderRef, {
      status: "CONFIRMED",
      approvedBy: approverId,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error approving order:", error)
    throw error
  }
}

export async function assignOrderToContractor(orderId: string, contractorId: string, assignedBy: string) {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId)
    await updateDoc(orderRef, {
      assignedContractorId: contractorId,
      assignedTo: assignedBy,
      status: "IN_PROGRESS",
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error assigning order to contractor:", error)
    throw error
  }
}
