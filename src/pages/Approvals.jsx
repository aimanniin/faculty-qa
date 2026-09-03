import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllRequests, approveRequest, rejectRequest } from '../services/deletionService'

export default function Approvals() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getAllRequests()
    setRequests(result.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleApprove = async (req) => {
    if (!window.confirm(`Approve deletion of ${req.lecturerName}? The lecturer will be permanently removed.`)) return
    setBusyId(req.id)
    const result = await approveRequest(req, profile)
    if (result.success) showToast('✅ Deletion approved & lecturer removed')
    else showToast('❌ ' + result.error, 'error')
    setBusyId(null)
    load()
  }

  const handleReject = async (req) => {
    setBusyId(req.id)
    const result = await rejectRequest(req, profile)
    if (result.success) showToast('↩️ Request rejected')
    else showToast('❌ ' + result.error, 'error')
    setBusyId(null)
    load()
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const resolved = requests.filter((r) => r.status !== 'pending')

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>Loading requests...</div>

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>🛡️ Deletion Approvals</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
        HOD deletion requests require your approval
      </p>

      {/* Pending Requests */}
      {pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <p style={{ color: '#6b7280' }}>No pending deletion requests</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px', marginBottom: '28px' }}>
          {pending.map((req) => (
            <div key={req.id} style={{
              background: '#fff', borderRadius: '12px', padding: '20px',
              border: '1px solid #e5e7eb', borderLeft: '4px solid #d97706',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '12px',
            }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>🗑️ {req.lecturerName}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  {req.lecturerId} · <span style={{ color: '#2563eb', fontWeight: '600' }}>{req.facultyCode}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  Requested by {req.requestedByName} ({req.requestedBy}) · {new Date(req.requestedAt).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleApprove(req)} disabled={busyId === req.id} style={{
                  padding: '10px 20px', background: busyId === req.id ? '#9ca3af' : '#dc2626', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>
                  Approve Delete
                </button>
                <button onClick={() => handleReject(req)} disabled={busyId === req.id} style={{
                  padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {resolved.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px' }}>📜 Request History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={th}>Lecturer</th>
                <th style={th}>Requested By</th>
                <th style={th}>Status</th>
                <th style={th}>Resolved By</th>
                <th style={th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={td}>{r.lecturerName}</td>
                  <td style={td}>{r.requestedByName}</td>
                  <td style={td}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      background: r.status === 'approved' ? '#fee2e2' : '#f3f4f6',
                      color: r.status === 'approved' ? '#dc2626' : '#6b7280',
                    }}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={td}>{r.resolvedByName || '—'}</td>
                  <td style={td}>{r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '20px', padding: '14px 24px', borderRadius: '10px',
          background: toast.type === 'error' ? '#dc2626' : '#059669', color: '#fff', fontSize: '14px',
          fontWeight: '500', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 2000,
        }}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '12px' }
const td = { padding: '10px 12px', color: '#4b5563' }