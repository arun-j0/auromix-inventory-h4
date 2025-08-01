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
import type { Task } from "@/types/task"

const TASKS_COLLECTION = "tasks"

export async function fetchTasks(userId: string, role: string): Promise<Task[]> {
  try {
    let tasksQuery = collection(db, TASKS_COLLECTION)

    // Filter tasks based on user role
    if (role === "CONTRACTOR") {
      tasksQuery = query(tasksQuery, where("contractorId", "==", userId))
    } else if (role === "INTERNAL_EMPLOYEE") {
      tasksQuery = query(tasksQuery, where("createdBy", "==", userId))
    }

    const tasksSnapshot = await getDocs(tasksQuery)
    return tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[]
  } catch (error) {
    console.error("Error fetching tasks:", error)
    throw error
  }
}

export async function getTask(taskId: string): Promise<Task | null> {
  try {
    const taskDoc = await getDoc(doc(db, TASKS_COLLECTION, taskId))

    if (taskDoc.exists()) {
      return { id: taskDoc.id, ...taskDoc.data() } as Task
    }

    return null
  } catch (error) {
    console.error("Error fetching task:", error)
    throw error
  }
}

export async function createTask(taskData: Partial<Task>): Promise<Task> {
  try {
    // Generate task number
    const year = new Date().getFullYear()
    const tasksSnapshot = await getDocs(collection(db, TASKS_COLLECTION))
    const taskCount = tasksSnapshot.size + 1
    const taskNumber = `TSK-${year}-${taskCount.toString().padStart(4, "0")}`

    const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
      ...taskData,
      taskNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      taskNumber,
      ...taskData,
    } as Task
  } catch (error) {
    console.error("Error creating task:", error)
    throw error
  }
}

export async function updateTask(taskId: string, taskData: Partial<Task>): Promise<Task> {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId)
    await updateDoc(taskRef, {
      ...taskData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: taskId,
      ...taskData,
    } as Task
  } catch (error) {
    console.error("Error updating task:", error)
    throw error
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId))
    return true
  } catch (error) {
    console.error("Error deleting task:", error)
    throw error
  }
}
