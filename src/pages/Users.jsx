import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllLecturers } from '../services/lecturerService'
import { getAllUsers, createUserAccount, deleteUser, genTempPassword } from '../services/userService'
import { ROLE_LABELS } from '../config/roles'

const FACULTY_CODES = ['SOCDT', 'SOEFT', 'SOCM', 'SOBT', 'PG', 'FSAS']

export default function Users() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)

  // Modal state
  const [form, setForm] = useState({ email: '', name: '', role: 'lecturer', lecturerId: '', facultyCode: '' })
  const [created, setCreated] = useState(null) // { email, tempPassword }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [u, l] = await Promise.all([getAllUsers(), getAllLecturers()])
    setUsers(u.data || [])
    setLecturers(l.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const showToast = (m, t = 'success') => { setToast({ message: m, type: t }); setTimeout(() => setToast(null), 3000) }

  // Lecturers not yet linked to any login
  const linkedIds = new Set(users.map((u) => u.lecturerId).filter(Boolean))
  const unlinkedLecturers = lecturers.filter((l) => !linkedIds.has(l.staffId || l.id))

  // When a lecturer is picked, auto-set faculty
  const pickLecturer = (staffId) => {
    const lec = lecturers.find((l) => (l.staffId || l.id) === staffId)
    setForm((f) => ({ ...f, lecturerId: staffId, facultyCode: lec?.department || f.facultyCode }))
  }

  const handleCreate = async () => {
    setError('')
    if (!form.email.trim()) { setError('Email is required'); return }
    if (form.role === 'lecturer' && !form.lecturerId) { setError('Select a lecturer to link'); return }
    if (form.role === 'hod' && !form.facultyCode) { setError('Select a faculty'); return }

    setSaving(true)
    const tempPassword = genTempPassword()
    const result = await createUserAccount({ ...form, tempPassword }, profile)
    setSaving(false)

    if (result.success) {
      setCreated({ email: form.email, tempPassword })
      showToast('✅ Account created & invite sent')
      load()
    } else {
      setError(result.error)
    }
  }

  const handleDelete = async (email) => {
    if (!window.confirm(`Remove login access for ${email}?`)) return
    const r = await deleteUser(email, profile)
    if (r.success) { showToast('🗑️ User removed'); load() }
    else showToast('❌ ' + r.error, 'error')
  }

  const closeModal = () => { setShowModal(false); setCreated(null); setError(''); setForm({ email: '', name: '', role: 'lecturer', lecturerId: '', facultyCode: '' }) }

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>Loading users...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>👤 User Management</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{users.length} account(s)</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          + Add User
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={th}>Email</th><th style={th}>Name</th><th style={th}>Role</th>
              <th style={th}>Faculty</th><th style={th}>Linked Lecturer</th><th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={td}>{u.email}</td>
                <td style={td}>{u.name}</td>
                <td style={td}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color: '#fff', background: ROLE_LABELS[u.role]?.color || '#6b7280' }}>
                    {ROLE_LABELS[u.role]?.text || u.role}
                  </span>
                </td>
                <td style={td}>{u.facultyCode || '—'}</td>
                <td style={td}>{u.lecturerId || '—'}</td>
                <td style={td}>
                  <button onClick={() => handleDelete(u.email)} style={{ padding: '5px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== ADD USER MODAL ===== */}
      {showModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) closeModal() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto' }}>
            {created ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎉</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Account Created</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                  Invite email sent to <strong>{created.email}</strong>
                </p>
                <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>Temp password (share securely):</p>
                  <p style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'monospace', color: '#92400e' }}>{created.tempPassword}</p>
                </div>
                <button onClick={closeModal} style={{ padding: '12px 32px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Done</button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>➕ Add User</h2>
                {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</div>}

                <Field label="University Email *">
                  <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@university.edu" style={inp} />
                </Field>
                <Field label="Display Name">
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Dr. Jane Doe" style={inp} />
                </Field>
                <Field label="Role *">
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} style={inp}>
                    <option value="lecturer">Lecturer</option>
                    <option value="hod">HOD</option>
                    <option value="vc">Vice Chancellor</option>
                    <option value="admin">Admin / IT</option>
                  </select>
                </Field>

                {form.role === 'lecturer' && (
                  <Field label="Link to Lecturer *">
                    <select value={form.lecturerId} onChange={(e) => pickLecturer(e.target.value)} style={inp}>
                      <option value="">-- Select lecturer --</option>
                      {unlinkedLecturers.map((l) => (
                        <option key={l.id} value={l.staffId || l.id}>{l.staffId || l.id} — {l.name || '(incomplete)'}</option>
                      ))}
                    </select>
                  </Field>
                )}

                {(form.role === 'hod' || (form.role === 'lecturer' && !form.facultyCode)) && (
                  <Field label="Faculty *">
                    <select value={form.facultyCode} onChange={(e) => setForm((f) => ({ ...f, facultyCode: e.target.value }))} style={inp}>
                      <option value="">-- Select --</option>
                      {FACULTY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button onClick={closeModal} style={{ padding: '12px 24px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleCreate} disabled={saving} style={{ padding: '12px 24px', background: saving ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    {saving ? '⏳ Creating...' : '✅ Create & Send Invite'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', padding: '14px 24px', borderRadius: '10px', background: toast.type === 'error' ? '#dc2626' : '#059669', color: '#fff', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 2000 }}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>{label}</label>{children}</div>
}
const inp = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }
const th = { padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '12px' }
const td = { padding: '10px 12px', color: '#4b5563' }