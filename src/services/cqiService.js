import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore'

const COLLECTION = 'cqi'

export async function getCqi(lecturerId, courseCode, semester) {
  try {
    const q = query(collection(db, COLLECTION), where('lecturerId', '==', lecturerId))
    const snap = await getDocs(q)
    const match = snap.docs.find((d) => {
      const e = d.data()
      return e.courseCode === courseCode && e.semester === semester
    })
    if (!match) return { success: true, data: null }
    return { success: true, data: { id: match.id, ...match.data() } }
  } catch (error) {
    return { success: false, error: error.message, data: null }
  }
}

export async function saveCqi(data) {
  try {
    const q = query(collection(db, COLLECTION), where('lecturerId', '==', data.lecturerId))
    const snap = await getDocs(q)
    const existing = snap.docs.find((d) => {
      const e = d.data()
      return e.courseCode === data.courseCode && e.semester === data.semester
    })
    if (existing) {
      await updateDoc(doc(db, COLLECTION, existing.id), { ...data, updatedAt: new Date().toISOString() })
      return { success: true, action: 'updated' }
    }
    const ref = await addDoc(collection(db, COLLECTION), { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    return { success: true, action: 'created', id: ref.id }
  } catch (error) {
    return { success: false, error: error.message }
  }
}