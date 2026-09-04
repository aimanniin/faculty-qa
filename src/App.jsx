import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { canAccess } from './config/roles'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Lecturers from './pages/Lecturers'
import Entry from './pages/Entry'
import Approvals from './pages/Approvals'
import Logs from './pages/Logs'
import ProfileGate from './components/ProfileGate'
import Users from './pages/Users'
import OnboardingGuide from './pages/OnboardingGuide'
import Cqi from './pages/Cqi'

function Guard({ path, children }) {
  const { profile } = useAuth()
  if (!canAccess(profile?.role, path)) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #fecaca' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚫</div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>Access Denied</h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
          Your role does not have permission to view this page.
        </p>
      </div>
    )
  }
  return children
}

function Shell() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <p style={{ color: '#6b7280' }}>Loading Faculty QA System...</p>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <ProfileGate>
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <Routes>
          <Route path="/" element={<Guard path="/"><Dashboard /></Guard>} />
          <Route path="/lecturers" element={<Guard path="/lecturers"><Lecturers /></Guard>} />
          <Route path="/entry" element={<Guard path="/entry"><Entry /></Guard>} />
          <Route path="/approvals" element={<Guard path="/approvals"><Approvals /></Guard>} />
          <Route path="/logs" element={<Guard path="/logs"><Logs /></Guard>} />
          <Route path="/users" element={<Guard path="/users"><Users /></Guard>} />
          <Route path="/onboarding" element={<Guard path="/onboarding"><OnboardingGuide /></Guard>} />
          <Route path="/cqi" element={<Guard path="/cqi"><Cqi /></Guard>} />
        </Routes>
      </div>
    </div>
    </ProfileGate>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App