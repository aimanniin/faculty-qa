import { db } from '../firebase'
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore'

// Record an activity
export async function logActivity(performedBy, action, details = {}) {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      action,
      performedBy: performedBy?.email || 'system',
      performedByName: performedBy?.name || 'System',
      role: performedBy?.role || 'system',
      details,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Log error:', error)
  }
}

// Get recent logs
export async function getLogs(count = 200) {
  try {
    const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(count))
    const snap = await getDocs(q)
    return { success: true, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }
  } catch (error) {
    return { success: false, error: error.message, data: [] }
  }
}