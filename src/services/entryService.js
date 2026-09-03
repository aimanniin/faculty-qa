import { db } from '../firebase'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore'

const COLLECTION = 'entries'

// ============================================
// GET: Find entry for lecturer + course + semester
// ============================================
export async function getEntry(lecturerId, courseCode, semester) {
  try {
    const q = query(collection(db, COLLECTION), where('lecturerId', '==', lecturerId))
    const snapshot = await getDocs(q)
    const match = snapshot.docs.find((d) => {
      const e = d.data()
      return e.courseCode === courseCode && e.semester === semester
    })
    if (!match) return { success: true, data: null }
    return { success: true, data: { id: match.id, ...match.data() } }
  } catch (error) {
    console.error('Error fetching entry:', error)
    return { success: false, error: error.message, data: null }
  }
}

// ============================================
// GET: All entries (for dashboard)
// ============================================
export async function getAllEntries() {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION))
    const entries = []
    snapshot.forEach((d) => entries.push({ id: d.id, ...d.data() }))
    return { success: true, data: entries }
  } catch (error) {
    console.error('Error fetching entries:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// ============================================
// GET: Entries by faculty
// ============================================
export async function getEntriesByFaculty(facultyCode) {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('facultyCode', '==', facultyCode)
    )
    const snapshot = await getDocs(q)
    const entries = []
    snapshot.forEach((d) => entries.push({ id: d.id, ...d.data() }))
    return { success: true, data: entries }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}


// SAVE: Create or update entry
export async function saveEntry(entryData) {
  try {
    const q = query(collection(db, COLLECTION), where('lecturerId', '==', entryData.lecturerId))
    const snapshot = await getDocs(q)
    const existing = snapshot.docs.find((d) => {
      const e = d.data()
      return e.courseCode === entryData.courseCode && e.semester === entryData.semester
    })

    if (existing) {
      await updateDoc(doc(db, COLLECTION, existing.id), {
        ...entryData,
        updatedAt: new Date().toISOString(),
      })
      return { success: true, id: existing.id, action: 'updated' }
    } else {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...entryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      return { success: true, id: docRef.id, action: 'created' }
    }
  } catch (error) {
    console.error('Error saving entry:', error)
    return { success: false, error: error.message }
  }
}

// ============================================
// DELETE: Remove entry
// ============================================
export async function deleteEntry(entryId) {
  try {
    await deleteDoc(doc(db, COLLECTION, entryId))
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============================================
// CALCULATE: Completion percentage
// ============================================
export function calculateCompletion(entry) {
  if (!entry) return 0
  let done = 0
  let total = 0

  const check = (val) => {
    total++
    if (val === 'Completed' || val === 'Secured' || val === 'Active') done++
  }

  if (entry.preSemester) {
    check(entry.preSemester.lessonPlan)
    check(entry.preSemester.teachingMaterial)
    check(entry.preSemester.coursera)
    check(entry.preSemester.curriculum)
  }
  if (entry.teaching) {
    check(entry.teaching.panopto)
    check(entry.teaching.attendanceStatus)
    check(entry.teaching.courseworkStatus)
    check(entry.teaching.examVettingStatus)
  }
  if (entry.qa) {
    check(entry.qa.finalMarks)
    check(entry.qa.cloPlo)
    check(entry.qa.dcf)
  }
  if (entry.research) {
    check(entry.research.knowledgeSharing)
    check(entry.research.grant)
    check(entry.research.industry)
  }

  return total > 0 ? Math.round((done / total) * 100) : 0
}