import { useState, useEffect } from 'react'
import { generateNextStaffId } from '../services/lecturerService'

export default function LecturerModal({ lecturer, faculties, onSave, onClose, saving, lockedFaculty }) {
  const isEditing = !!lecturer

 const [form, setForm] = useState({
  id: '',
  title: '',
  name: '',
  department: lockedFaculty || '',   // ← HOD pre-locked
  contractType: 'contract',
  contractEnd: '',
  subjects: [],
})

  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', semester: 'Feb' })
  const [errors, setErrors] = useState({})

  // Load existing data when editing
useEffect(() => {
  if (lecturer) {
    setForm({
      id: lecturer.id || lecturer.staffId || '',
      title: lecturer.title || '',
      name: lecturer.name,
      department: lockedFaculty || lecturer.department,
      contractType: lecturer.contractType || 'contract',
      contractEnd: lecturer.contractEnd || '',
      subjects: lecturer.subjects || [],
    })
  } else {
    // NEW lecturer → auto-generate next staff ID (F1001, F1002, ...)
    generateNextStaffId().then((nextId) => {
      setForm((f) => ({ ...f, id: nextId }))
    })
  }
}, [lecturer])

  // Handle form input changes
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  // Add subject
  const addSubject = () => {
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) return
    setForm((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { ...subjectForm }],
    }))
    setSubjectForm({ code: '', name: '', semester: 'Feb' })
  }

  // Remove subject
  const removeSubject = (index) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }))
  }

  // Validate and save
const handleSubmit = () => {
  const newErrors = {}
  if (!form.id.trim()) newErrors.id = 'Staff ID is required'
  if (!form.name.trim()) newErrors.name = 'Name is required'
  if (!form.department) newErrors.department = 'Select a faculty'
  if (form.contractType === 'contract' && !form.contractEnd) {
    newErrors.contractEnd = 'Contract end date is required'
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors)
    return
  }

  onSave({
  staffId: form.id,
  title: form.title,  // ← ADD THIS
  name: form.name,
  department: form.department,
  contractType: form.contractType,
  contractEnd: form.contractType === 'permanent' ? null : form.contractEnd,
  subjects: form.subjects,
})
}

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            {isEditing ? '✏️ Edit Lecturer' : '➕ Add New Lecturer'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: '#f3f4f6',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px' }}>
{/* Row 1: Title + Staff ID + Name */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px', marginBottom: '20px' }}>
  <div>
    <label style={labelStyle}>Title</label>
    <select
      value={form.title}
      onChange={(e) => handleChange('title', e.target.value)}
      style={inputStyle}
    >
      <option value="">-- Select --</option>
      <option value="Prof.">Professor</option>
      <option value="Assoc. Prof">Assoc. Prof.</option>
      <option value="Senior Lecturer">Senior Lecturer</option>
      <option value="Lecturer">Lecturer</option>
      <option value="Assistant Lecturer">Assistant Lecturer</option>
      <option value="Tutor">Tutor</option>
      <option value="Vice Chancellor">Vice Chancellor</option>
      <option value="Deputy Vice Chancellor">Deputy Vice Chancellor</option>
      <option value="Head Of Dean">Head Of Dean</option>
      <option value="Dean">Dean</option>
      <option value="Head of Department">Head of Department</option>
      <option value="Mr.">Mr.</option>
      <option value="Ms.">Ms.</option>
      <option value="Mrs.">Mrs.</option>
    </select>
  </div>
  <div>
    <label style={labelStyle}>Staff ID *</label>
    <input
      type="text"
      value={form.id}
      onChange={(e) => handleChange('id', e.target.value)}
      placeholder="e.g. F1013"
      disabled={isEditing}
      style={{
        ...inputStyle,
        background: isEditing ? '#f3f4f6' : '#fff',
        borderColor: errors.id ? '#dc2626' : '#d1d5db',
      }}
    />
    {errors.id && <span style={errorStyle}>{errors.id}</span>}
  </div>
  <div>
    <label style={labelStyle}>Full Name *</label>
    <input
      type="text"
      value={form.name}
      onChange={(e) => handleChange('name', e.target.value)}
      placeholder="e.g. Jane Doe"
      style={{
        ...inputStyle,
        borderColor: errors.name ? '#dc2626' : '#d1d5db',
      }}
    />
    {errors.name && <span style={errorStyle}>{errors.name}</span>}
  </div>
</div>

          {/* Row 1: ID + Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Staff ID *</label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => handleChange('id', e.target.value)}
                placeholder="e.g. F1013"
                disabled={isEditing}
                style={{
                  ...inputStyle,
                  background: isEditing ? '#f3f4f6' : '#fff',
                  borderColor: errors.id ? '#dc2626' : '#d1d5db',
                }}
              />
              {errors.id && <span style={errorStyle}>{errors.id}</span>}
            </div>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Dr. Jane Doe"
                style={{
                  ...inputStyle,
                  borderColor: errors.name ? '#dc2626' : '#d1d5db',
                }}
              />
              {errors.name && <span style={errorStyle}>{errors.name}</span>}
            </div>
          </div>

          {/* Row 2: Faculty */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Faculty *</label>
            <select
  value={form.department}
  onChange={(e) => handleChange('department', e.target.value)}
  disabled={!!lockedFaculty}
  style={{ ...inputStyle, borderColor: errors.department ? '#dc2626' : '#d1d5db', background: lockedFaculty ? '#f3f4f6' : '#fff' }}
>
  <option value="">-- Select Faculty --</option>
  {faculties.map((f) => (
    <option key={f.code} value={f.code}>{f.code} — {f.name}</option>
  ))}
</select>
            {errors.department && <span style={errorStyle}>{errors.department}</span>}
          </div>

          {/* Row 3: Contract Type + End Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Contract Type</label>
              <select
                value={form.contractType}
                onChange={(e) => handleChange('contractType', e.target.value)}
                style={inputStyle}
              >
                <option value="contract">Contract</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            {form.contractType === 'contract' && (
              <div>
                <label style={labelStyle}>Contract Ends On *</label>
                <input
                  type="date"
                  value={form.contractEnd}
                  onChange={(e) => handleChange('contractEnd', e.target.value)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.contractEnd ? '#dc2626' : '#d1d5db',
                  }}
                />
                {errors.contractEnd && <span style={errorStyle}>{errors.contractEnd}</span>}
              </div>
            )}
          </div>

          {/* Subjects Section */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid #e5e7eb',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px', color: '#374151' }}>
              📚 Subjects Teaching ({form.subjects.length})
            </h3>

            {/* Existing Subjects */}
            {form.subjects.map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: '#fff',
                borderRadius: '8px',
                marginBottom: '8px',
                border: '1px solid #e5e7eb',
              }}>
                <span style={{ fontWeight: '700', color: '#2563eb', fontSize: '13px', minWidth: '70px' }}>
                  {s.code}
                </span>
                <span style={{ flex: 1, fontSize: '13px', color: '#374151' }}>
                  {s.name}
                </span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  background: '#2563eb',
                  color: '#fff',
                }}>
                  {s.semester}
                </span>
                <button
                  onClick={() => removeSubject(i)}
                  style={{
                    padding: '4px 8px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            {form.subjects.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '12px' }}>
                No subjects added yet
              </p>
            )}

            {/* Add Subject Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 100px auto',
              gap: '8px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px dashed #d1d5db',
            }}>
              <input
                type="text"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="Code"
                style={{ ...inputStyle, padding: '8px 10px', fontSize: '13px' }}
              />
              <input
                type="text"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Subject name"
                style={{ ...inputStyle, padding: '8px 10px', fontSize: '13px' }}
              />
              <select
                value={subjectForm.semester}
                onChange={(e) => setSubjectForm((p) => ({ ...p, semester: e.target.value }))}
                style={{ ...inputStyle, padding: '8px 10px', fontSize: '13px' }}
              >
                <option value="Feb">Feb</option>
                <option value="May">May</option>
                <option value="Sep">Sep</option>
              </select>
              <button
                onClick={addSubject}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '20px 28px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            Cancel
          </button>
          // Find this button in the modal footer and update it:
<button
  onClick={handleSubmit}
  disabled={saving}
  style={{
    padding: '12px 24px',
    background: saving ? '#9ca3af' : '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: saving ? 'not-allowed' : 'pointer',
  }}
>
  {saving ? '⏳ Saving...' : (isEditing ? '💾 Save Changes' : '➕ Create Lecturer')}
</button>
        </div>
      </div>
    </div>
  )
}

// Shared styles
const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '6px',
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
}

const errorStyle = {
  display: 'block',
  fontSize: '12px',
  color: '#dc2626',
  marginTop: '4px',
}