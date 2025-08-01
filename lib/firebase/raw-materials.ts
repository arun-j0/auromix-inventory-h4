import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"

const RAW_MATERIALS_COLLECTION = "rawMaterials"

export async function fetchRawMaterials() {
  try {
    const materialsSnapshot = await getDocs(collection(db, RAW_MATERIALS_COLLECTION))
    return materialsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching raw materials:", error)
    throw error
  }
}

export async function getRawMaterial(materialId: string) {
  try {
    const materialDoc = await getDoc(doc(db, RAW_MATERIALS_COLLECTION, materialId))

    if (materialDoc.exists()) {
      return { id: materialDoc.id, ...materialDoc.data() }
    }

    return null
  } catch (error) {
    console.error("Error fetching raw material:", error)
    throw error
  }
}

export async function createRawMaterial(materialData: any) {
  try {
    const docRef = await addDoc(collection(db, RAW_MATERIALS_COLLECTION), {
      ...materialData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...materialData,
    }
  } catch (error) {
    console.error("Error creating raw material:", error)
    throw error
  }
}

export async function updateRawMaterial(materialId: string, materialData: any) {
  try {
    const materialRef = doc(db, RAW_MATERIALS_COLLECTION, materialId)
    await updateDoc(materialRef, {
      ...materialData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: materialId,
      ...materialData,
    }
  } catch (error) {
    console.error("Error updating raw material:", error)
    throw error
  }
}

export async function deleteRawMaterial(materialId: string) {
  try {
    await deleteDoc(doc(db, RAW_MATERIALS_COLLECTION, materialId))
    return true
  } catch (error) {
    console.error("Error deleting raw material:", error)
    throw error
  }
}
