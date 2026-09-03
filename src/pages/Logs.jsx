import { useState, useEffect } from 'react'
import { getLogs } from '../services/logService'

const ACTION_COLORS = {
  LOGIN: '#2563eb', LOGOUT: '#6b7280',
  ADD_LECTURER: '#059669', EDIT_LECTURER: '#2563eb',
  DELETE_LECTURER: '#dc2626', DELETE_REQUESTED: '#d97706',
  DELETE_APPROVED: '#dc2626', DELETE_REJECTED: '#6b7280',
  SAVE_ENTRY: '#7c3aed',
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    const result = await getLogs()
    setLogs(result.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const actions = ['all', ...new Set(logs.map((l) => l.action))]
  const filtered = filter === 'all' ? logs : logs.filter((l) => l.action === filter)

  const formatDetails = (details) => {
    if (!details) return ''
    return Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(' · ')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>Loading logs...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>📜 Activity Logs</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            {filtered.length} event(s) recorded
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{
            padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px',
          }}>
            {actions.map((a) => <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>)}
          </select>
          <button onClick={load} style={{
            padding: '9px 16px', background: '#fff', border: '1px solid #d1d5db',
            borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
          }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={th}>Time</th>
              <th style={th}>Action</th>
              <th style={th}>User</th>
              <th style={th}>Role</th>
              <th style={th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ ...td, whiteSpace: 'nowrap', color: '#9ca3af', fontSize: '12px' }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                </td>
                <td style={td}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                    color: '#fff', background: ACTION_COLORS[log.action] || '#6b7280',
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={td}>{log.performedByName}</td>
                <td style={{ ...td, textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>
                  {log.role}
                </td>
                <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{formatDetails(log.details)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" style={{ ...td, textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No logs yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '12px' }
const td = { padding: '10px 12px', color: '#4b5563' }