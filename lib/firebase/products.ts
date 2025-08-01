import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"

const PRODUCTS_COLLECTION = "products"

export async function fetchProducts() {
  try {
    const productsSnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION))
    return productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching products:", error)
    throw error
  }
}

export async function getProduct(productId: string) {
  try {
    const productDoc = await getDoc(doc(db, PRODUCTS_COLLECTION, productId))

    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() }
    }

    return null
  } catch (error) {
    console.error("Error fetching product:", error)
    throw error
  }
}

export async function createProduct(productData: any) {
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...productData,
    }
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export async function updateProduct(productId: string, productData: any) {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId)
    await updateDoc(productRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: productId,
      ...productData,
    }
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export async function deleteProduct(productId: string) {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId))
    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}
