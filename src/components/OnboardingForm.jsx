import { useState } from 'react'
import { updateLecturer } from '../services/lecturerService'

const TITLES = ['Professor','Associate Professor','Dr.','Senior Lecturer','Lecturer','Assistant Lecturer','Tutor','Mr.','Ms.','Mrs.']

export default function OnboardingForm({ record, onDone }) {
  const [name, setName] = useState(record?.name || '')
  const [title, setTitle] = useState(record?.title || '')
  const [subjects, setSubjects] = useState(record?.subjects || [])
  const [subj, setSubj] = useState({ code: '', name: '', semester: 'Feb' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addSubject = () => {
    if (!subj.code.trim() || !subj.name.trim()) return
    setSubjects((p) => [...p, { ...subj }])
    setSubj({ code: '', name: '', semester: 'Feb' })
  }

  const removeSubject = (i) => setSubjects((p) => p.filter((_, x) => x !== i))

  const handleSave = async () => {
    if (!name.trim() || !title) {
      setError('Please fill in your name and select a title to continue.')
      return
    }
    setSaving(true)
    const result = await updateLecturer(record.id, { name: name.trim(), title, subjects })
    setSaving(false)
    if (result.success) onDone()
    else setError(result.error)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>👋 Complete Your Profile</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
          Staff ID: <strong style={{ fontFamily: 'monospace' }}>{record?.staffId}</strong> · You must complete this before accessing the dashboard.
        </p>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Title *</label>
            <select value={title} onChange={(e) => setTitle(e.target.value)} style={inp}>
              <option value="">-- Select --</option>
              {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Full Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Doe" style={inp} />
          </div>
        </div>

        {/* Subjects */}
        <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <label style={lbl}>📚 Your Subjects (add any you teach)</label>
          {subjects.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', marginBottom: '6px' }}>
              <strong style={{ color: '#2563eb', fontSize: '13px', minWidth: '70px' }}>{s.code}</strong>
              <span style={{ flex: 1, fontSize: '13px' }}>{s.name}</span>
              <span style={{ fontSize: '11px', fontWeight: '700', background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>{s.semester}</span>
              <button onClick={() => removeSubject(i)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px auto', gap: '6px', marginTop: '8px' }}>
            <input value={subj.code} onChange={(e) => setSubj((p) => ({ ...p, code: e.target.value }))} placeholder="Code" style={{ ...inp, padding: '7px 8px', fontSize: '13px' }} />
            <input value={subj.name} onChange={(e) => setSubj((p) => ({ ...p, name: e.target.value }))} placeholder="Subject name" style={{ ...inp, padding: '7px 8px', fontSize: '13px' }} />
            <select value={subj.semester} onChange={(e) => setSubj((p) => ({ ...p, semester: e.target.value }))} style={{ ...inp, padding: '7px 8px', fontSize: '13px' }}>
              <option>Feb</option><option>May</option><option>Sep</option>
            </select>
            <button onClick={addSubject} style={{ padding: '7px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>+ Add</button>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '13px', background: saving ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
          {saving ? '⏳ Saving...' : '✅ Save & Continue'}
        </button>
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }
const inp = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }