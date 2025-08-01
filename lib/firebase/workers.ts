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
import type { Worker } from "@/types/worker"

const WORKERS_COLLECTION = "workers"

export async function fetchWorkers(userId: string, role: string): Promise<Worker[]> {
  try {
    let workersQuery = collection(db, WORKERS_COLLECTION)

    // Filter workers based on user role
    if (role === "CONTRACTOR") {
      workersQuery = query(workersQuery, where("contractorId", "==", userId))
    }

    const workersSnapshot = await getDocs(workersQuery)
    return workersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Worker[]
  } catch (error) {
    console.error("Error fetching workers:", error)
    throw error
  }
}

export async function getWorker(workerId: string): Promise<Worker | null> {
  try {
    const workerDoc = await getDoc(doc(db, WORKERS_COLLECTION, workerId))

    if (workerDoc.exists()) {
      return { id: workerDoc.id, ...workerDoc.data() } as Worker
    }

    return null
  } catch (error) {
    console.error("Error fetching worker:", error)
    throw error
  }
}

export async function createWorker(workerData: Partial<Worker>): Promise<Worker> {
  try {
    // Generate worker code
    const workersSnapshot = await getDocs(collection(db, WORKERS_COLLECTION))
    const workerCount = workersSnapshot.size + 1
    const workerCode = `WRK-${workerCount.toString().padStart(4, "0")}`

    const docRef = await addDoc(collection(db, WORKERS_COLLECTION), {
      ...workerData,
      workerCode,
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      workerCode,
      ...workerData,
    } as Worker
  } catch (error) {
    console.error("Error creating worker:", error)
    throw error
  }
}

export async function updateWorker(workerId: string, workerData: Partial<Worker>): Promise<Worker> {
  try {
    const workerRef = doc(db, WORKERS_COLLECTION, workerId)
    await updateDoc(workerRef, {
      ...workerData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: workerId,
      ...workerData,
    } as Worker
  } catch (error) {
    console.error("Error updating worker:", error)
    throw error
  }
}

export async function deleteWorker(workerId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, WORKERS_COLLECTION, workerId))
    return true
  } catch (error) {
    console.error("Error deleting worker:", error)
    throw error
  }
}
