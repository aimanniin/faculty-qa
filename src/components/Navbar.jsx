import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NAV_ITEMS, ROLE_LABELS } from '../config/roles'
import { logActivity } from '../services/logService'

export default function Navbar() {

  const handleLogout = async () => {
  await logActivity(profile, 'LOGOUT')
  logout()
}
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logActivity } from '../services/logService'
import { NAV_ITEMS, ROLE_LABELS } from '../config/roles'

export default function Navbar() {
  const { profile, logout } = useAuth()
  const location = useLocation()

  const role = profile?.role || 'lecturer'
  const roleInfo = ROLE_LABELS[role] || { text: role, color: '#6b7280' }
  const visibleLinks = NAV_ITEMS.filter((item) => item.roles.includes(role))

  const handleLogout = async () => {
    try {
      await logActivity(profile, 'LOGOUT')
    } catch (e) {
      console.error('Logout log failed', e)
    }
    logout()
  }

  return (
    <nav style={{
      background: '#1e3a8a', color: '#fff', padding: '14px 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: '10px',
    }}>
      <span style={{ fontWeight: '700', fontSize: '18px' }}>📊 Faculty QA</span>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {visibleLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              color: '#fff', textDecoration: 'none', padding: '8px 14px',
              borderRadius: '6px', fontSize: '13px',
              background: location.pathname === link.to ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
            }}
          >
            {link.label}
          </Link>
        ))}

        <span style={{
          padding: '4px 12px', borderRadius: '20px', fontSize: '11px',
          fontWeight: '700', background: roleInfo.color, color: '#fff', marginLeft: '8px',
        }}>
          {roleInfo.text}
        </span>

        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          👤 {profile?.name || 'User'}
        </span>

        <button
          onClick={handleLogout}
          style={{
            padding: '8px 14px', background: 'rgba(239,68,68,0.8)', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
  const { profile, logout } = useAuth()
  const location = useLocation()

  const role = profile?.role || 'lecturer'
  const roleInfo = ROLE_LABELS[role] || { text: role, color: '#6b7280' }

  // Only show links this role is allowed to see
  const visibleLinks = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <nav style={{
      background: '#1e3a8a', color: '#fff', padding: '14px 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: '10px',
    }}>
      <span style={{ fontWeight: '700', fontSize: '18px' }}>📊 Faculty QA</span>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {visibleLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              color: '#fff', textDecoration: 'none', padding: '8px 14px',
              borderRadius: '6px', fontSize: '13px',
              background: location.pathname === link.to
                ? 'rgba(255,255,255,0.25)'
                : 'rgba(255,255,255,0.1)',
            }}
          >
            {link.label}
          </Link>
        ))}

        {/* Role badge */}
        <span style={{
          padding: '4px 12px', borderRadius: '20px', fontSize: '11px',
          fontWeight: '700', background: roleInfo.color, color: '#fff', marginLeft: '8px',
        }}>
          {roleInfo.text}
        </span>

        <span style={{ fontSize: '12px', opacity: 0.8 }}>
          👤 {profile?.name || 'User'}
        </span>

        <button
          onClick={logout}
          style={{
            padding: '8px 14px', background: 'rgba(239,68,68,0.8)', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}