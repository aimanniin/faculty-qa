import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { batchImportLecturers } from '../services/lecturerService'

export default function ImportModal({ onClose, onImportComplete }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [errors, setErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [step, setStep] = useState(1) // 1: Upload, 2: Preview, 3: Result
  const fileInputRef = useRef(null)

  // ============================================
  // HANDLE FILE SELECTION
  // ============================================
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ]

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setErrors(['Invalid file type. Please upload .xlsx, .xls, or .csv'])
      return
    }

    setFile(selectedFile)
    setErrors([])
    parseFile(selectedFile)
  }

  // ============================================
  // PARSE EXCEL FILE
  // ============================================
  const parseFile = (file) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

        if (jsonData.length === 0) {
          setErrors(['The file appears to be empty'])
          return
        }

        // Validate and transform data
        const { valid, invalid } = validateData(jsonData)
        setPreview(valid)
        setErrors(invalid)
        setStep(2)
      } catch (err) {
        setErrors(['Failed to parse file: ' + err.message])
      }
    }

    reader.readAsArrayBuffer(file)
  }

  // ============================================
  // VALIDATE DATA
  // ============================================
  const validateData = (rows) => {
    const valid = []
    const invalid = []

    rows.forEach((row, index) => {
      const rowNum = index + 2 // +2 because row 1 is header

      // Try different possible column names
      const title = (row['Title'] || row['title'] || '').toString().trim()
const staffId = (row['Staff ID'] || row['staffId'] || row['staff_id'] || row['ID'] || row['id'] || '').toString().trim()
      const name = (row['Name'] || row['name'] || row['Full Name'] || row['full_name'] || row['Lecturer Name'] || '').toString().trim()
      const department = (row['Faculty'] || row['faculty'] || row['Department'] || row['department'] || row['Dept'] || '').toString().trim().toUpperCase()
      const contractType = (row['Contract Type'] || row['contractType'] || row['contract_type'] || row['Type'] || 'contract').toString().trim().toLowerCase()
      const contractEnd = (row['Contract End'] || row['contractEnd'] || row['contract_end'] || row['End Date'] || '').toString().trim()
      const subjects = (row['Subjects'] || row['subjects'] || row['Courses'] || '').toString().trim()

      // Validate required fields
      const rowErrors = []
      if (!staffId) rowErrors.push('Missing Staff ID')
      if (!name) rowErrors.push('Missing Name')
      if (!department) rowErrors.push('Missing Faculty')

      if (rowErrors.length > 0) {
        invalid.push({ row: rowNum, data: row, errors: rowErrors })
        return
      }

      // Parse subjects (format: "CSC301:Database Systems:Feb; CSC302:Web Dev:May")
      let parsedSubjects = []
      if (subjects) {
        parsedSubjects = subjects.split(';').map((s) => {
          const parts = s.trim().split(':')
          return {
            code: (parts[0] || '').trim(),
            name: (parts[1] || '').trim(),
            semester: (parts[2] || 'Feb').trim(),
          }
        }).filter((s) => s.code && s.name)
      }

      // Parse contract end date
      let parsedDate = null
      if (contractEnd && contractType === 'contract') {
        const date = new Date(contractEnd)
        if (!isNaN(date.getTime())) {
          parsedDate = date.toISOString().split('T')[0] // YYYY-MM-DD
        }
      }

      valid.push({
  title,  // ← ADD THIS
  staffId,
  name,
  department,
  contractType: contractType === 'permanent' ? 'permanent' : 'contract',
  contractEnd: parsedDate,
  subjects: parsedSubjects,
})
    })

    return { valid, invalid }
  }

  // ============================================
  // IMPORT TO FIRESTORE
  // ============================================
  const handleImport = async () => {
    if (preview.length === 0) return

    setImporting(true)

    const result = await batchImportLecturers(preview)

    setResult(result)
    setImporting(false)
    setStep(3)

    if (result.success) {
      onImportComplete()
    }
  }

  // ============================================
  // DOWNLOAD TEMPLATE
  // ============================================
  const downloadTemplate = () => {
    const templateData = [
  {
    'Title': 'Dr.',
    'Staff ID': 'F1001',
    'Name': 'Aisha Rahman',
    'Faculty': 'SOCDT',
    'Contract Type': 'contract',
    'Contract End': '2027-08-31',
    'Subjects': 'CSC301:Database Systems:Feb; CSC302:Web Development:May',
  },
  {
    'Title': 'Professor',
    'Staff ID': 'F1002',
    'Name': 'Lim Wei Chen',
    'Faculty': 'SOEFT',
    'Contract Type': 'permanent',
    'Contract End': '',
    'Subjects': 'EEE201:Digital Electronics:Feb',
  },
  {
    'Title': 'Dr.',
    'Staff ID': 'F1003',
    'Name': 'Sarah Abdullah',
    'Faculty': 'SOCM',
    'Contract Type': 'contract',
    'Contract End': '2028-02-29',
    'Subjects': 'ENG102:Academic Writing:May',
  },
]


    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturers')

    // Update column widths:
ws['!cols'] = [
  { wch: 22 }, // Title  ← NEW
  { wch: 12 }, // Staff ID
  { wch: 25 }, // Name
  { wch: 12 }, // Faculty
  { wch: 15 }, // Contract Type
  { wch: 15 }, // Contract End
  { wch: 60 }, // Subjects
]
    XLSX.writeFile(wb, 'lecturer_import_template.xlsx')
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%',
        maxWidth: '700px', maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>📥 Import from Excel</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              Step {step} of 3: {step === 1 ? 'Upload File' : step === 2 ? 'Preview Data' : 'Import Result'}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: '36px', height: '36px', borderRadius: '50%', border: 'none',
            background: '#f3f4f6', fontSize: '18px', cursor: 'pointer',
          }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '28px' }}>

          {/* ============ STEP 1: UPLOAD ============ */}
          {step === 1 && (
            <div>
              {/* Template Download */}
              <div style={{
                background: '#eff6ff', borderRadius: '10px', padding: '16px 20px',
                marginBottom: '20px', border: '1px solid #bfdbfe',
              }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
                  📋 First time? Download the template
                </p>
                <p style={{ fontSize: '13px', color: '#3b82f6', marginBottom: '12px' }}>
                  Use our Excel template to format your data correctly
                </p>
                <button
                  onClick={downloadTemplate}
                  style={{
                    padding: '8px 16px', background: '#2563eb', color: '#fff',
                    border: 'none', borderRadius: '6px', fontSize: '13px',
                    fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  ⬇️ Download Template (.xlsx)
                </button>
              </div>

              {/* File Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #d1d5db', borderRadius: '12px',
                  padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s', background: '#fafbfc',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb'
                  e.currentTarget.style.background = '#eff6ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.background = '#fafbfc'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                  Click to select Excel file
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  Supports .xlsx, .xls, .csv
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Expected Format */}
              <div style={{ marginTop: '20px', background: '#f9fafb', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  📌 Expected Columns:
                </p>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.8' }}>
  <strong>Title</strong> — Professor, Dr., Senior Lecturer, etc. (optional)<br />
  <strong>Staff ID</strong> — e.g. F1001<br />
  <strong>Name</strong> — e.g. Aisha Rahman (without title)<br />
  <strong>Faculty</strong> — SOCDT, SOEFT, SOCM, SOBT, PG, FSAS<br />
  <strong>Contract Type</strong> — "contract" or "permanent"<br />
  <strong>Contract End</strong> — YYYY-MM-DD (leave empty if permanent)<br />
  <strong>Subjects</strong> — CODE:Name:Semester; CODE:Name:Semester
</div>
              </div>

              {/* Errors */}
              {errors.length > 0 && typeof errors[0] === 'string' && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>
                  {errors.map((err, i) => (
                    <p key={i} style={{ fontSize: '13px', color: '#dc2626' }}>⚠️ {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============ STEP 2: PREVIEW ============ */}
          {step === 2 && (
            <div>
              {/* Summary */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  flex: 1, padding: '14px', background: '#d1fae5', borderRadius: '10px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>{preview.length}</div>
                  <div style={{ fontSize: '12px', color: '#065f46' }}>Ready to Import</div>
                </div>
                <div style={{
                  flex: 1, padding: '14px', background: errors.length > 0 ? '#fee2e2' : '#f3f4f6',
                  borderRadius: '10px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: errors.length > 0 ? '#dc2626' : '#6b7280' }}>
                    {errors.length}
                  </div>
                  <div style={{ fontSize: '12px', color: errors.length > 0 ? '#991b1b' : '#6b7280' }}>Rows with Errors</div>
                </div>
              </div>

              {/* Preview Table */}
              <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
  <tr style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
    <th style={thStyle}>Title</th>  {/* ← ADD THIS */}
    <th style={thStyle}>Staff ID</th>
    <th style={thStyle}>Name</th>
    <th style={thStyle}>Faculty</th>
    <th style={thStyle}>Type</th>
    <th style={thStyle}>Subjects</th>
  </tr>
</thead>
<tbody>
  {preview.map((lec, i) => (
    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
      <td style={tdStyle}>{lec.title || '—'}</td>  {/* ← ADD THIS */}
      <td style={tdStyle}>{lec.staffId}</td>
      <td style={tdStyle}>{lec.name}</td>
      <td style={tdStyle}>
        <span style={{
          padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
          fontWeight: '600', background: '#eff6ff', color: '#2563eb',
        }}>
          {lec.department}
        </span>
      </td>
      <td style={tdStyle}>{lec.contractType}</td>
      <td style={tdStyle}>{lec.subjects.length} subject(s)</td>
    </tr>
  ))}
</tbody>
                </table>
              </div>

              {/* Row Errors */}
              {errors.length > 0 && typeof errors[0] === 'object' && (
                <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                    ⚠️ {errors.length} row(s) will be skipped:
                  </p>
                  {errors.slice(0, 5).map((err, i) => (
                    <p key={i} style={{ fontSize: '12px', color: '#991b1b' }}>
                      Row {err.row}: {err.errors.join(', ')}
                    </p>
                  ))}
                  {errors.length > 5 && (
                    <p style={{ fontSize: '12px', color: '#991b1b' }}>...and {errors.length - 5} more</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setStep(1); setPreview([]); setErrors([]) }}
                  style={{
                    padding: '10px 20px', background: '#f3f4f6', border: 'none',
                    borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || preview.length === 0}
                  style={{
                    padding: '10px 24px',
                    background: importing || preview.length === 0 ? '#9ca3af' : '#059669',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    fontSize: '14px', fontWeight: '600',
                    cursor: importing || preview.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {importing ? '⏳ Importing...' : `✅ Import ${preview.length} Lecturer(s)`}
                </button>
              </div>
            </div>
          )}

          {/* ============ STEP 3: RESULT ============ */}
          {step === 3 && result && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              {result.success ? (
                <>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#059669', marginBottom: '8px' }}>
                    Import Successful!
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    {result.imported} lecturer(s) imported to database
                    {result.skipped > 0 && ` · ${result.skipped} skipped (duplicates)`}
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>
                    Import Failed
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    {result.error}
                  </p>
                </>
              )}

              <button
                onClick={onClose}
                style={{
                  padding: '12px 32px', background: '#2563eb', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Table styles
const thStyle = {
  padding: '10px 12px', textAlign: 'left', fontWeight: '600',
  color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '12px',
}

const tdStyle = {
  padding: '10px 12px', color: '#4b5563',
}