import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// ✅ Firebase config (exported so userService can use it)
export const firebaseConfig = {
  apiKey: "AIzaSyCxceqBQcfqNRbMzVwqrtQFZH74jrZ_cuk",
  authDomain: "faculty-qa-system.firebaseapp.com",
  projectId: "faculty-qa-system",
  storageBucket: "faculty-qa-system.firebasestorage.app",
  messagingSenderId: "264055858510",
  appId: "1:264055858510:web:f0369ccdcc7a8f93ceaa1f",
  measurementId: "G-DFV9JJSEDJ"
}

// ✅ Initialize Firebase ONCE
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

console.log('✅ Firebase connected successfully')