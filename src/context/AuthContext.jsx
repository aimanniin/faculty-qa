import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // ← starts NULL (not logged in)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Fetch role profile
        try {
          const q = query(
            collection(db, 'users'),
            where('email', '==', authUser.email)
          )
          const snap = await getDocs(q)
          setProfile(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })
        } catch (err) {
          console.error('Failed to load profile:', err)
          setProfile(null)
        }
        setUser(authUser)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}