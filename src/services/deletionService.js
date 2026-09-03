import { db } from '../firebase'
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore'
import { deleteLecturer } from './lecturerService'
import { logActivity } from './logService'

const COLLECTION = 'deletion_requests'

// Get ALL requests (for Approvals page)
export async function getAllRequests() {
  try {
    const snap = await getDocs(collection(db, COLLECTION))
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''))
    return { success: true, data: list }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}

// Get only PENDING requests (for badges on lecturer cards)
export async function getPendingRequests() {
  try {
    const q = query(collection(db, COLLECTION), where('status', '==', 'pending'))
    const snap = await getDocs(q)
    return { success: true, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}

// HOD: request deletion
export async function requestDeletion(lecturer, profile) {
  try {
    const lecturerId = lecturer.staffId || lecturer.id

    // Block duplicate pending requests
    const q = query(collection(db, COLLECTION), where('status', '==', 'pending'))
    const snap = await getDocs(q)
    if (snap.docs.some((d) => d.data().lecturerId === lecturerId)) {
      return { success: false, error: 'A deletion request for this lecturer is already pending' }
    }

    await addDoc(collection(db, COLLECTION), {
      lecturerDocId: lecturer.id,   // ← REAL Firestore document ID (the fix)
      lecturerId,                   // staff ID for display
      lecturerName: (lecturer.title ? lecturer.title + ' ' : '') + lecturer.name,
      facultyCode: lecturer.department,
      requestedBy: profile?.email,
      requestedByName: profile?.name,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      resolvedBy: null,
      resolvedByName: null,
      resolvedAt: null,
    })

    await logActivity(profile, 'DELETE_REQUESTED', { lecturerId, name: lecturer.name })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// VC/Admin: approve → actually delete lecturer
export async function approveRequest(request, profile) {
  try {
    // Use the real doc ID; fall back to lookup for old requests
    let docId = request.lecturerDocId

    if (!docId) {
      const q = query(collection(db, 'lecturers'), where('staffId', '==', request.lecturerId))
      const snap = await getDocs(q)
      if (!snap.empty) docId = snap.docs[0].id
    }

    if (docId) {
      const del = await deleteLecturer(docId)   // ← delete by REAL doc ID
      if (!del.success) return del
    }

    await updateDoc(doc(db, COLLECTION, request.id), {
      status: 'approved',
      resolvedBy: profile?.email,
      resolvedByName: profile?.name,
      resolvedAt: new Date().toISOString(),
    })

    await logActivity(profile, 'DELETE_APPROVED', {
      lecturerId: request.lecturerId,
      name: request.lecturerName,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// VC/Admin: reject
export async function rejectRequest(request, profile) {
  try {
    await updateDoc(doc(db, COLLECTION, request.id), {
      status: 'rejected',
      resolvedBy: profile?.email,
      resolvedByName: profile?.name,
      resolvedAt: new Date().toISOString(),
    })

    await logActivity(profile, 'DELETE_REJECTED', {
      lecturerId: request.lecturerId,
      name: request.lecturerName,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}