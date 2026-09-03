import { useState, useEffect, useCallback } from 'react'
import LecturerModal from '../components/LecturerModal'
import { useAuth } from '../context/AuthContext'
import ImportModal from '../components/ImportModal'
import { requestDeletion, getPendingRequests } from '../services/deletionService'
import { logActivity } from '../services/logService'
import {
  getAllLecturers,
  addLecturer,
  updateLecturer,
  deleteLecturer,
} from '../services/lecturerService'

const FACULTIES = [
  { code: 'SOCDT', name: 'School of Computing & Digital Technology', color: '#3b82f6' },
  { code: 'SOEFT', name: 'School of Engineering & Future Technologies', color: '#f59e0b' },
  { code: 'SOCM', name: 'School of Communication & Media', color: '#8b5cf6' },
  { code: 'SOBT', name: 'School of Business & Technology', color: '#10b981' },
  { code: 'PG', name: 'Postgraduate Studies', color: '#ef4444' },
  { code: 'FSAS', name: 'Faculty of Science & Social Sciences', color: '#06b6d4' },
]

export default function Lecturers() {
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingLecturer, setEditingLecturer] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const { profile } = useAuth()
const isHod = profile?.role === 'hod'
const myFaculty = profile?.facultyCode
const canDeleteDirect = profile?.role === 'vc' || profile?.role === 'admin'


  // ============================================
  // LOAD DATA FROM FIRESTORE
  // ============================================
const loadLecturers = useCallback(async () => {
  setLoading(true)
  setError(null)
  const [result, reqResult] = await Promise.all([getAllLecturers(), getPendingRequests()])
  if (result.success) setLecturers(result.data)
  else { setError(result.error); setLecturers([]) }
  setPendingRequests(reqResult.data || [])
  setLoading(false)
}, [])

  // Load on component mount
  useEffect(() => {
    loadLecturers()
  }, [loadLecturers])

  // ============================================
  // FILTER LECTURERS
  // ============================================
  const filtered = lecturers.filter((l) => {
  if (isHod && l.department !== myFaculty) return false   // ← HOD only own faculty
  if (facultyFilter !== 'all' && l.department !== facultyFilter) return false
  if (search) {
    const s = search.toLowerCase()
    return (l.name || '').toLowerCase().includes(s) || (l.staffId || '').toLowerCase().includes(s)
  }
  return true
})

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getFaculty = (code) =>
    FACULTIES.find((f) => f.code === code) || { code, color: '#6b7280' }

  const getInitials = (name) =>
    (name || 'Unknown').split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()

  const getContractStatus = (lecturer) => {
    if (lecturer.contractType === 'permanent')
      return { text: 'Permanent', color: '#059669', bg: '#d1fae5' }
    if (!lecturer.contractEnd)
      return { text: 'No date set', color: '#d97706', bg: '#fef3c7' }
    const days = Math.floor((new Date(lecturer.contractEnd) - new Date()) / 86400000)
    if (days < 0) return { text: 'Expired', color: '#dc2626', bg: '#fee2e2' }
    if (days <= 90) return { text: `Ends in ${days}d`, color: '#d97706', bg: '#fef3c7' }
    return { text: 'Active', color: '#059669', bg: '#d1fae5' }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ============================================
  // SAVE (ADD or UPDATE)
  // ============================================
  const handleSave = async (lecturerData) => {
    setSaving(true)

    try {
      if (editingLecturer) {
  const result = await updateLecturer(editingLecturer.id, lecturerData)
  if (result.success) {
    logActivity(profile, 'EDIT_LECTURER', { lecturerId: lecturerData.staffId, name: lecturerData.name })
    showToast('✅ Lecturer updated successfully')
          setShowModal(false)
          setEditingLecturer(null)
          loadLecturers() // Reload from database
        } else {
          showToast('❌ ' + result.error, 'error')
        }
      } else {
  const result = await addLecturer(lecturerData)
  if (result.success) {
    logActivity(profile, 'ADD_LECTURER', { lecturerId: lecturerData.staffId, name: lecturerData.name })
    showToast('✅ Lecturer added successfully')
          setShowModal(false)
          setEditingLecturer(null)
          loadLecturers() // Reload from database
        } else {
          showToast('❌ ' + result.error, 'error')
        }
      }
    } catch (err) {
      showToast('❌ An unexpected error occurred', 'error')
    }

    setSaving(false)
  }

  // ============================================
  // DELETE
  // ============================================
  const handleDelete = async () => {
  const target = deleteConfirm
  if (!target) return

  if (canDeleteDirect) {
    // VC / Admin: delete immediately
    const result = await deleteLecturer(target.id)
    if (result.success) {
      logActivity(profile, 'DELETE_LECTURER', { lecturerId: target.staffId, name: target.name })
      showToast('🗑️ Lecturer deleted')
    } else {
      showToast('❌ ' + result.error, 'error')
    }
  } else {
    // HOD: send request to VC
    const result = await requestDeletion(target, profile)
    if (result.success) showToast('📨 Deletion request sent to VC for approval')
    else showToast('⚠️ ' + result.error, 'error')
  }

  setDeleteConfirm(null)
  loadLecturers()
}

  // ============================================
  // EDIT
  // ============================================
  const handleEdit = (lecturer) => {
    setEditingLecturer(lecturer)
    setShowModal(true)
  }

  // ============================================
  // RENDER
  // ============================================

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading lecturers...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #fecaca' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>Database Connection Error</h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px', marginBottom: '16px' }}>
          {error}
        </p>
        <button
          onClick={loadLecturers}
          style={{
            padding: '10px 24px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          🔄 Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', gap: '8px' }}>
  <button
    onClick={() => setShowImport(true)}
    style={{
      padding: '10px 16px',
      background: '#fff',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }}
  >
    📥 Import Excel
  </button>
  <button
    onClick={loadLecturers}
    style={{
      padding: '10px 16px',
      background: '#fff',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
    }}
  >
    🔄 Refresh
  </button>
  <button
    onClick={() => { setEditingLecturer(null); setShowModal(true) }}
    style={{
      padding: '10px 20px',
      background: '#2563eb',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    }}
  >
    + Add Lecturer
  </button>
</div>


      {/* Search + Filter Bar */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        {!isHod && (
  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
    <button onClick={() => setFacultyFilter('all')} style={pillStyle(facultyFilter === 'all', '#1f2937')}>All</button>
    {FACULTIES.map((f) => (
      <button key={f.code} onClick={() => setFacultyFilter(f.code)} style={pillStyle(facultyFilter === f.code, f.color)}>{f.code}</button>
    ))}
  </div>
)}
      </div>

      {/* Lecturer Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '16px',
      }}>
        {filtered.map((lecturer) => {
          const faculty = getFaculty(lecturer.department)
          const contract = getContractStatus(lecturer)

          return (
            <div
              key={lecturer.id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid #e5e7eb',
                borderLeft: `4px solid ${faculty.color}`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
  <div style={{
    width: '48px', height: '48px', borderRadius: '50%',
    background: `linear-gradient(135deg, ${faculty.color}, ${faculty.color}88)`,
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '16px', flexShrink: 0,
  }}>
    {getInitials(lecturer.name)}
  </div>
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontWeight: '600', fontSize: '15px', color: '#111827' }}>
      {lecturer.title && (
        <span style={{ color: '#6b7280', fontWeight: '500' }}>
          {lecturer.title}{' '}
        </span>
      )}
      {lecturer.name}
    </div>
    <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
      {lecturer.staffId}
    </div>
  </div>
  <span style={{
    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
    background: contract.bg, color: contract.color,
  }}>
    {contract.text}
  </span>
</div>

              {/* Faculty Badge + Subject Count */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                  background: `${faculty.color}15`, color: faculty.color,
                }}>
                  {lecturer.department}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  📚 {(lecturer.subjects || []).length} subject{(lecturer.subjects || []).length !== 1 ? 's' : ''}
                </span>
              </div>

              {pendingRequests.some((r) => r.lecturerId === (lecturer.staffId || lecturer.id)) && (
  <span style={{
    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
    background: '#fef3c7', color: '#d97706',
  }}>
    ⏳ Deletion pending
  </span>
)}

              {/* Subject Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {(lecturer.subjects || []).map((s, i) => (
                  <span key={i} style={{
                    padding: '3px 10px', background: '#f3f4f6', borderRadius: '5px',
                    fontSize: '11px', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb',
                  }}>
                    {s.code}
                  </span>
                ))}
              </div>

              {/* Card Actions */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
                <button
                  onClick={() => handleEdit(lecturer)}
                  style={{
                    flex: 1, padding: '8px', background: '#eff6ff', color: '#2563eb',
                    border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '13px',
                    fontWeight: '500', cursor: 'pointer',
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(lecturer)}
                  style={{
                    flex: 1, padding: '8px', background: '#fef2f2', color: '#dc2626',
                    border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px',
                    fontWeight: '500', cursor: 'pointer',
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px', background: '#fff',
          borderRadius: '12px', border: '1px solid #e5e7eb',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>
            {lecturers.length === 0 ? 'No lecturers in database yet' : 'No lecturers match your search'}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            {lecturers.length === 0 ? 'Click "+ Add Lecturer" to create the first one' : 'Try adjusting your search or filter'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <LecturerModal
  lecturer={editingLecturer}
  faculties={FACULTIES}
  lockedFaculty={isHod ? myFaculty : null}
  onSave={handleSave}
  onClose={() => { setShowModal(false); setEditingLecturer(null) }}
  saving={saving}
/>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            width: '90%', maxWidth: '400px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
  {canDeleteDirect ? 'Delete Lecturer?' : 'Request Deletion?'}
</h3>
<p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
  {canDeleteDirect
    ? <>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</>
    : <>This will send a deletion request for <strong>{deleteConfirm.name}</strong> to the Vice Chancellor for approval.</>}
</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: '12px', background: '#f3f4f6', border: 'none',
                  borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button onClick={handleDelete} style={{
  flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none',
  borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
}}>
  {canDeleteDirect ? 'Delete' : 'Send Request'}
</button>
            </div>
          </div>
        </div>
      )}

{showImport && (
  <ImportModal
    onClose={() => setShowImport(false)}
    onImportComplete={() => loadLecturers()}
  />
)}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '20px', padding: '14px 24px',
          borderRadius: '10px', background: toast.type === 'error' ? '#dc2626' : '#059669',
          color: '#fff', fontSize: '14px', fontWeight: '500',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 2000,
        }}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

function pillStyle(isActive, color) {
  return {
    padding: '7px 14px', borderRadius: '20px',
    border: `1px solid ${isActive ? color : '#d1d5db'}`,
    background: isActive ? color : '#fff',
    color: isActive ? '#fff' : '#374151',
    fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
  }
}