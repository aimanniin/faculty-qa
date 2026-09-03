export const NAV_ITEMS = [
  { to: '/', label: '📊 Dashboard', roles: ['admin', 'vc', 'hod', 'lecturer'] },
  { to: '/onboarding', label: '📘 Onboarding Guide', roles: ['lecturer'] },   // ← ADD
  { to: '/lecturers', label: '👥 Lecturers', roles: ['admin', 'vc', 'hod'] },
  { to: '/entry', label: '📝 Data Entry', roles: ['admin', 'vc', 'hod', 'lecturer'] },
  { to: '/approvals', label: '🛡️ Approvals', roles: ['admin', 'vc'] },
  { to: '/users', label: '👤 Users', roles: ['admin'] },
  { to: '/logs', label: '📜 Logs', roles: ['admin'] },
]

export const PAGE_ACCESS = {
  '/': ['admin', 'vc', 'hod', 'lecturer'],
  '/onboarding': ['lecturer'],   // ← ADD
  '/lecturers': ['admin', 'vc', 'hod'],
  '/entry': ['admin', 'vc', 'hod', 'lecturer'],
  '/approvals': ['admin', 'vc'],
  '/users': ['admin'],
  '/logs': ['admin'],
}

export function canAccess(role, path) {
  return (PAGE_ACCESS[path] || []).includes(role)
}

export const ROLE_LABELS = {
  admin:    { text: 'Admin / IT',      color: '#7c3aed' },
  vc:       { text: 'Vice Chancellor', color: '#dc2626' },
  hod:      { text: 'Head of Dept',    color: '#2563eb' },
  lecturer: { text: 'Lecturer',        color: '#059669' },
}

