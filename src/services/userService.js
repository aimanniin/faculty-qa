import { initializeApp, deleteApp, getApps } from 'firebase/app'
import {
  getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut,
} from 'firebase/auth'
import {
  collection, getDocs, setDoc, deleteDoc, doc, query, where,
} from 'firebase/firestore'
import { db, firebaseConfig } from '../firebase'
import { logActivity } from './logService'

const USERS = 'users'
const LECTURERS = 'lecturers'

// Secondary app so creating a user doesn't log the admin out
function secondaryAuth() {
  const app = initializeApp(firebaseConfig, 'secondary-' + Date.now())
  return { app, auth: getAuth(app) }
}

// Random temp password
export function genTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let p = ''
  for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p + 'A1!'
}

// LIST all users
export async function getAllUsers() {
  try {
    const snap = await getDocs(collection(db, USERS))
    return { success: true, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }
  } catch (e) {
    return { success: false, error: e.message, data: [] }
  }
}

// CREATE user + profile + lecturer stub + invite email
export async function createUserAccount(data, adminProfile) {
  const { email, name, role, facultyCode, lecturerId, tempPassword } = data
  try {
    // 1. Create auth user (secondary app, admin stays logged in)
    const { app, auth } = secondaryAuth()
    await createUserWithEmailAndPassword(auth, email, tempPassword)
    await signOut(auth)
    await deleteApp(app)

    // 2. Create profile doc (doc ID = email)
    await setDoc(doc(db, USERS, email), {
      email, name: name || email, role,
      facultyCode: facultyCode || null,
      lecturerId: lecturerId || null,
      createdAt: new Date().toISOString(),
    })

    // 3. If lecturer, ensure a lecturer record stub exists
    if (role === 'lecturer' && lecturerId) {
      const q = query(collection(db, LECTURERS), where('staffId', '==', lecturerId))
      const snap = await getDocs(q)
      if (snap.empty) {
        await setDoc(doc(db, LECTURERS, lecturerId), {
          staffId: lecturerId, name: '', title: '',
          department: facultyCode || '', contractType: 'contract',
          contractEnd: null, subjects: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        })
      }
    }

    // 4. Send "set your password" invite email
    try {
      await sendPasswordResetEmail(getAuth(), email)
    } catch (e) {
      console.warn('Invite email failed:', e)
    }

    await logActivity(adminProfile, 'CREATE_USER', { email, role })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// DELETE user profile (auth account remains but can't access without profile)
export async function deleteUser(email, adminProfile) {
  try {
    await deleteDoc(doc(db, USERS, email))
    await logActivity(adminProfile, 'DELETE_USER', { email })
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
}