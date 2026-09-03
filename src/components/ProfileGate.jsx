import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getLecturerByStaffId } from '../services/lecturerService'
import OnboardingForm from '../components/OnboardingForm'

export default function ProfileGate({ children }) {
  const { profile, logout } = useAuth()
  const isLecturer = profile?.role === 'lecturer'

  const [state, setState] = useState('loading')
  const [record, setRecord] = useState(null)

  useEffect(() => {
    if (!isLecturer) { setState('ok'); return }
    (async () => {
      const res = await getLecturerByStaffId(profile?.lecturerId)
      if (!res.success || !res.data) { setState('notlinked'); return }
      setRecord(res.data)
      setState(res.data.name && res.data.title ? 'ok' : 'onboarding')
    })()
  }, [isLecturer, profile])

  // Logout button shown on the "stuck" screens
  const logoutBtn = (
    <button
      onClick={logout}
      style={{
        position: 'fixed', top: '16px', right: '16px', padding: '8px 16px',
        background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none',
        borderRadius: '6px', cursor: 'pointer', fontSize: '13px', zIndex: 100,
      }}
    >
      Logout
    </button>
  )

  if (!isLecturer) return children

  if (state === 'loading')
    return <Center msg="Loading your profile..." />

  if (state === 'notlinked')
    return (
      <>
        {logoutBtn}
        <Center>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Account Not Linked</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            Your account isn't linked to a lecturer record.<br />Please contact IT/Admin.
          </p>
        </Center>
      </>
    )

  if (state === 'onboarding')
    return (
      <>
        {logoutBtn}
        <OnboardingForm record={record} onDone={() => setState('ok')} />
      </>
    )

  return children
}

function Center({ msg, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
      <div>{children || <p style={{ color: '#6b7280' }}>{msg}</p>}</div>
    </div>
  )
}