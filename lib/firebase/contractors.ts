import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"
import type { Contractor } from "@/types/contractor"

const CONTRACTORS_COLLECTION = "contractors"

export async function fetchContractors(): Promise<Contractor[]> {
  try {
    const contractorsSnapshot = await getDocs(collection(db, CONTRACTORS_COLLECTION))
    return contractorsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Contractor[]
  } catch (error) {
    console.error("Error fetching contractors:", error)
    throw error
  }
}

export async function getContractor(contractorId: string): Promise<Contractor | null> {
  try {
    const contractorDoc = await getDoc(doc(db, CONTRACTORS_COLLECTION, contractorId))

    if (contractorDoc.exists()) {
      return { id: contractorDoc.id, ...contractorDoc.data() } as Contractor
    }

    return null
  } catch (error) {
    console.error("Error fetching contractor:", error)
    throw error
  }
}

export async function createContractor(contractorData: Partial<Contractor>): Promise<Contractor> {
  try {
    // Generate contractor code
    const contractorsSnapshot = await getDocs(collection(db, CONTRACTORS_COLLECTION))
    const contractorCount = contractorsSnapshot.size + 1
    const contractorCode = `CONT-${contractorCount.toString().padStart(3, "0")}`

    const docRef = await addDoc(collection(db, CONTRACTORS_COLLECTION), {
      ...contractorData,
      contractorCode,
      onboardedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      contractorCode,
      ...contractorData,
    } as Contractor
  } catch (error) {
    console.error("Error creating contractor:", error)
    throw error
  }
}

export async function updateContractor(contractorId: string, contractorData: Partial<Contractor>): Promise<Contractor> {
  try {
    const contractorRef = doc(db, CONTRACTORS_COLLECTION, contractorId)
    await updateDoc(contractorRef, {
      ...contractorData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: contractorId,
      ...contractorData,
    } as Contractor
  } catch (error) {
    console.error("Error updating contractor:", error)
    throw error
  }
}

export async function deleteContractor(contractorId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, CONTRACTORS_COLLECTION, contractorId))
    return true
  } catch (error) {
    console.error("Error deleting contractor:", error)
    throw error
  }
}
