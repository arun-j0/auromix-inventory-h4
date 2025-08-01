import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"
import type { Client } from "@/types/client"

const CLIENTS_COLLECTION = "clients"

export async function fetchClients(): Promise<Client[]> {
  try {
    const clientsSnapshot = await getDocs(collection(db, CLIENTS_COLLECTION))
    return clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Client[]
  } catch (error) {
    console.error("Error fetching clients:", error)
    throw error
  }
}

export async function getClient(clientId: string): Promise<Client | null> {
  try {
    const clientDoc = await getDoc(doc(db, CLIENTS_COLLECTION, clientId))

    if (clientDoc.exists()) {
      return { id: clientDoc.id, ...clientDoc.data() } as Client
    }

    return null
  } catch (error) {
    console.error("Error fetching client:", error)
    throw error
  }
}

export async function createClient(clientData: Partial<Client>): Promise<Client> {
  try {
    const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), {
      ...clientData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...clientData,
    } as Client
  } catch (error) {
    console.error("Error creating client:", error)
    throw error
  }
}

export async function updateClient(clientId: string, clientData: Partial<Client>): Promise<Client> {
  try {
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId)
    await updateDoc(clientRef, {
      ...clientData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: clientId,
      ...clientData,
    } as Client
  } catch (error) {
    console.error("Error updating client:", error)
    throw error
  }
}

export async function deleteClient(clientId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, CLIENTS_COLLECTION, clientId))
    return true
  } catch (error) {
    console.error("Error deleting client:", error)
    throw error
  }
}
