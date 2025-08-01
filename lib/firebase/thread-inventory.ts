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

const THREAD_INVENTORY_COLLECTION = "threadInventory"

export async function fetchThreadInventory() {
  try {
    const inventorySnapshot = await getDocs(collection(db, THREAD_INVENTORY_COLLECTION))
    return inventorySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching thread inventory:", error)
    throw error
  }
}

export async function getThreadInventoryItem(inventoryId: string) {
  try {
    const inventoryDoc = await getDoc(doc(db, THREAD_INVENTORY_COLLECTION, inventoryId))

    if (inventoryDoc.exists()) {
      return { id: inventoryDoc.id, ...inventoryDoc.data() }
    }

    return null
  } catch (error) {
    console.error("Error fetching thread inventory item:", error)
    throw error
  }
}

export async function getThreadInventoryByMaterial(materialId: string) {
  try {
    const q = query(collection(db, THREAD_INVENTORY_COLLECTION), where("rawMaterialId", "==", materialId))
    const inventorySnapshot = await getDocs(q)

    if (!inventorySnapshot.empty) {
      return inventorySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    }

    return []
  } catch (error) {
    console.error("Error fetching thread inventory by material:", error)
    throw error
  }
}

export async function createThreadInventory(inventoryData: any) {
  try {
    const docRef = await addDoc(collection(db, THREAD_INVENTORY_COLLECTION), {
      ...inventoryData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...inventoryData,
    }
  } catch (error) {
    console.error("Error creating thread inventory:", error)
    throw error
  }
}

export async function updateThreadInventory(inventoryId: string, inventoryData: any) {
  try {
    const inventoryRef = doc(db, THREAD_INVENTORY_COLLECTION, inventoryId)
    await updateDoc(inventoryRef, {
      ...inventoryData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: inventoryId,
      ...inventoryData,
    }
  } catch (error) {
    console.error("Error updating thread inventory:", error)
    throw error
  }
}

export async function deleteThreadInventory(inventoryId: string) {
  try {
    await deleteDoc(doc(db, THREAD_INVENTORY_COLLECTION, inventoryId))
    return true
  } catch (error) {
    console.error("Error deleting thread inventory:", error)
    throw error
  }
}

export async function allocateThreadStock(inventoryId: string, quantityKg: number, orderId: string, userId: string) {
  try {
    const inventoryDoc = await getDoc(doc(db, THREAD_INVENTORY_COLLECTION, inventoryId))

    if (!inventoryDoc.exists()) {
      throw new Error("Inventory item not found")
    }

    const inventoryData = inventoryDoc.data()

    if (inventoryData.availableKg < quantityKg) {
      throw new Error("Insufficient stock available")
    }

    const newAllocatedKg = inventoryData.allocatedKg + quantityKg
    const newAvailableKg = inventoryData.currentStockKg - newAllocatedKg

    const stockMovement = {
      date: new Date(),
      type: "ALLOCATED",
      quantity: quantityKg,
      orderId: orderId,
      notes: `Allocated for order ${orderId}`,
      performedBy: userId,
    }

    const updatedInventory = {
      allocatedKg: newAllocatedKg,
      availableKg: newAvailableKg,
      stockMovements: [...(inventoryData.stockMovements || []), stockMovement],
      updatedAt: serverTimestamp(),
    }

    await updateDoc(doc(db, THREAD_INVENTORY_COLLECTION, inventoryId), updatedInventory)

    return {
      id: inventoryId,
      ...inventoryData,
      ...updatedInventory,
    }
  } catch (error) {
    console.error("Error allocating thread stock:", error)
    throw error
  }
}

export async function releaseThreadStock(inventoryId: string, quantityKg: number, orderId: string, userId: string) {
  try {
    const inventoryDoc = await getDoc(doc(db, THREAD_INVENTORY_COLLECTION, inventoryId))

    if (!inventoryDoc.exists()) {
      throw new Error("Inventory item not found")
    }

    const inventoryData = inventoryDoc.data()

    if (inventoryData.allocatedKg < quantityKg) {
      throw new Error("Cannot release more than allocated amount")
    }

    const newAllocatedKg = inventoryData.allocatedKg - quantityKg
    const newAvailableKg = inventoryData.currentStockKg - newAllocatedKg

    const stockMovement = {
      date: new Date(),
      type: "RELEASED",
      quantity: quantityKg,
      orderId: orderId,
      notes: `Released from order ${orderId}`,
      performedBy: userId,
    }

    const updatedInventory = {
      allocatedKg: newAllocatedKg,
      availableKg: newAvailableKg,
      stockMovements: [...(inventoryData.stockMovements || []), stockMovement],
      updatedAt: serverTimestamp(),
    }

    await updateDoc(doc(db, THREAD_INVENTORY_COLLECTION, inventoryId), updatedInventory)

    return {
      id: inventoryId,
      ...inventoryData,
      ...updatedInventory,
    }
  } catch (error) {
    console.error("Error releasing thread stock:", error)
    throw error
  }
}
