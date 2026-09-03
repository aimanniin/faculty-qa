import { db } from '../firebase'
import { setDoc } from 'firebase/firestore'   // ← add setDoc to your import
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'

const COLLECTION = 'lecturers'

// READ: Get all lecturers
export async function getAllLecturers() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION))
    const lecturers = []
    querySnapshot.forEach((doc) => {
      lecturers.push({ id: doc.id, ...doc.data() })
    })
    return { success: true, data: lecturers }
  } catch (error) {
    console.error('Error fetching lecturers:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// READ: Get lecturers by faculty
export async function getLecturersByFaculty(facultyCode) {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('department', '==', facultyCode)
    )
    const querySnapshot = await getDocs(q)
    const lecturers = []
    querySnapshot.forEach((doc) => {
      lecturers.push({ id: doc.id, ...doc.data() })
    })
    return { success: true, data: lecturers }
  } catch (error) {
    console.error('Error fetching lecturers:', error)
    return { success: false, error: error.message, data: [] }
  }
}


export async function addLecturer(lecturerData) {
  try {
    const staffId = lecturerData.staffId

    // Duplicate check
    const q = query(collection(db, COLLECTION), where('staffId', '==', staffId))
    const existing = await getDocs(q)
    if (!existing.empty) return { success: false, error: 'Staff ID already exists' }

    // doc ID = staffId (no random ID)
    await setDoc(doc(db, COLLECTION, staffId), {
      ...lecturerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return { success: true, id: staffId }
  } catch (error) {
    console.error('Error adding lecturer:', error)
    return { success: false, error: error.message }
  }
}

// UPDATE: Edit existing lecturer
export async function updateLecturer(lecturerId, lecturerData) {
  try {
    const lecturerRef = doc(db, COLLECTION, lecturerId)
    await updateDoc(lecturerRef, {
      ...lecturerData,
      updatedAt: new Date().toISOString(),
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating lecturer:', error)
    return { success: false, error: error.message }
  }
}

// DELETE: Remove lecturer
export async function deleteLecturer(lecturerId) {
  try {
    await deleteDoc(doc(db, COLLECTION, lecturerId))
    return { success: true }
  } catch (error) {
    console.error('Error deleting lecturer:', error)
    return { success: false, error: error.message }
  }
}

// CHECK: Verify if staff ID already exists
export async function checkStaffIdExists(staffId) {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('staffId', '==', staffId)
    )
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error('Error checking staff ID:', error)
    return false
  }
}
// BATCH IMPORT: Import multiple lecturers at once
export async function batchImportLecturers(lecturersArray) {
  try {
    let imported = 0
    let skipped = 0
    const errors = []

    for (const lecturer of lecturersArray) {
      try {
        // Check if staff ID already exists
        const q = query(
          collection(db, COLLECTION),
          where('staffId', '==', lecturer.staffId)
        )
        const existing = await getDocs(q)

        if (!existing.empty) {
          skipped++
          continue // Skip duplicates
        }

        // Add new lecturer
        await addDoc(collection(db, COLLECTION), {
          ...lecturer,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        imported++
      } catch (err) {
        errors.push({ staffId: lecturer.staffId, error: err.message })
      }
    }

    return {
      success: true,
      imported,
      skipped,
      errors,
      total: lecturersArray.length,
    }
  } catch (error) {
    console.error('Batch import error:', error)
    return { success: false, error: error.message }
  }
}

// GET lecturer record by staffId
export async function getLecturerByStaffId(staffId) {
  try {
    const q = query(collection(db, COLLECTION), where('staffId', '==', staffId))
    const snap = await getDocs(q)
    if (snap.empty) return { success: true, data: null }
    return { success: true, data: { id: snap.docs[0].id, ...snap.docs[0].data() } }
  } catch (error) {
    return { success: false, error: error.message, data: null }
  }
}

// Generate next staff ID like F1001, F1002, ...
export async function generateNextStaffId(prefix = 'F', start = 1001) {
  try {
    const snap = await getDocs(collection(db, COLLECTION))
    let max = start - 1
    snap.forEach((d) => {
      const sid = d.data().staffId || d.id || ''
      const m = sid.match(/(\d+)\s*$/)   // trailing digits
      if (m) {
        const n = parseInt(m[1], 10)
        if (n > max) max = n
      }
    })
    return prefix + String(max + 1).padStart(4, '0')
  } catch (e) {
    return prefix + String(start).padStart(4, '0')
  }
}