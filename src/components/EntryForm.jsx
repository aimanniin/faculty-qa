import { useState, useEffect } from 'react'
import { saveEntry, calculateCompletion } from '../services/entryService'

const STATUS_OPTIONS = ['Completed', 'Pending', 'Not Started']
const STATUS_OPTIONS_TEACHING = ['Completed', 'In Progress', 'Not Started']
const ASSESSMENT_TYPES = ['Quiz', 'Test', 'Midterm', 'Assignment', 'Lab', 'Project']

export default function EntryForm({ lecturer, course, faculty, existingEntry, onSaved }) {
  const [semester, setSemester] = useState(course.semester || 'Feb')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Section 1: Pre-Semester
  const [lessonPlan, setLessonPlan] = useState('Not Started')
  const [teachingMaterial, setTeachingMaterial] = useState('Not Started')
  const [coursera, setCoursera] = useState('Not Started')
  const [curriculum, setCurriculum] = useState('Not Started')
  const [assessments, setAssessments] = useState({})

  // Section 2: Teaching
  const [panopto, setPanopto] = useState('Not Started')
  const [attendanceStatus, setAttendanceStatus] = useState('Not Started')
  const [attendanceClasses, setAttendanceClasses] = useState('')
  const [courseworkStatus, setCourseworkStatus] = useState('Not Started')
  const [courseworkPending, setCourseworkPending] = useState('')
  const [examVettingStatus, setExamVettingStatus] = useState('Not Started')
  const [examVettingDate, setExamVettingDate] = useState('')

  // Section 3: QA
  const [finalMarks, setFinalMarks] = useState('Not Started')
  const [cloPlo, setCloPlo] = useState('Not Started')
  const [dcf, setDcf] = useState('Not Started')

  // Section 4: Research
  const [knowledgeSharing, setKnowledgeSharing] = useState('Not Started')
  const [publications, setPublications] = useState(0)
  const [grant, setGrant] = useState('None')
  const [industry, setIndustry] = useState('None')
  const [engagementType, setEngagementType] = useState('None')
  const [engagementDays, setEngagementDays] = useState('')
  const [engagementStatus, setEngagementStatus] = useState('')

  // Load existing data
  useEffect(() => {
    if (existingEntry) {
      const e = existingEntry
      if (e.preSemester) {
        setLessonPlan(e.preSemester.lessonPlan || 'Not Started')
        setTeachingMaterial(e.preSemester.teachingMaterial || 'Not Started')
        setCoursera(e.preSemester.coursera || 'Not Started')
        setCurriculum(e.preSemester.curriculum || 'Not Started')
        if (e.preSemester.assessments) {
          const a = {}
          e.preSemester.assessments.forEach((item) => {
            a[item.type] = { checked: true, status: item.status, description: item.description || '' }
          })
          setAssessments(a)
        }
      }
      if (e.teaching) {
        setPanopto(e.teaching.panopto || 'Not Started')
        setAttendanceStatus(e.teaching.attendanceStatus || 'Not Started')
        setAttendanceClasses(e.teaching.attendanceClasses || '')
        setCourseworkStatus(e.teaching.courseworkStatus || 'Not Started')
        setCourseworkPending(e.teaching.courseworkPending || '')
        setExamVettingStatus(e.teaching.examVettingStatus || 'Not Started')
        setExamVettingDate(e.teaching.examVettingDate || '')
      }
      if (e.qa) {
        setFinalMarks(e.qa.finalMarks || 'Not Started')
        setCloPlo(e.qa.cloPlo || 'Not Started')
        setDcf(e.qa.dcf || 'Not Started')
      }
      if (e.research) {
        setKnowledgeSharing(e.research.knowledgeSharing || 'Not Started')
        setPublications(e.research.publications || 0)
        setGrant(e.research.grant || 'None')
        setIndustry(e.research.industry || 'None')
        setEngagementType(e.research.engagementType || 'None')
        setEngagementDays(e.research.engagementDays || '')
        setEngagementStatus(e.research.engagementStatus || '')
      }
    }
  }, [existingEntry])

  const toggleAssessment = (type) => {
    setAssessments((prev) => ({
      ...prev,
      [type]: prev[type]?.checked
        ? { ...prev[type], checked: false }
        : { checked: true, status: 'Not Started', description: '' },
    }))
  }

  const markSectionComplete = (section) => {
    if (section === 1) {
      setLessonPlan('Completed')
      setTeachingMaterial('Completed')
      setCoursera('Completed')
      setCurriculum('Completed')
      ASSESSMENT_TYPES.forEach((t) => {
        setAssessments((prev) => ({ ...prev, [t]: { checked: true, status: 'Completed', description: '' } }))
      })
    } else if (section === 2) {
      setPanopto('Completed')
      setAttendanceStatus('Completed')
      setCourseworkStatus('Completed')
      setExamVettingStatus('Completed')
    } else if (section === 3) {
      setFinalMarks('Completed')
      setCloPlo('Completed')
      setDcf('Completed')
    } else if (section === 4) {
      setKnowledgeSharing('Completed')
      setGrant('Secured')
      setIndustry('Active')
    }
  }

  const getProgress = () => {
    const entry = collectData()
    return calculateCompletion(entry)
  }

  const collectData = () => ({
    lecturerId: lecturer.staffId || lecturer.id,
    courseCode: course.code,
    facultyCode: faculty.code,
    semester,
    preSemester: {
      lessonPlan,
      teachingMaterial,
      coursera,
      curriculum,
      assessments: Object.entries(assessments)
        .filter(([, v]) => v.checked)
        .map(([type, v]) => ({ type, status: v.status, description: v.description || null })),
    },
    teaching: {
      panopto,
      attendanceStatus,
      attendanceClasses: attendanceClasses ? parseInt(attendanceClasses) : null,
      courseworkStatus,
      courseworkPending: courseworkPending || null,
      examVettingStatus,
      examVettingDate: examVettingDate || null,
    },
    qa: { finalMarks, cloPlo, dcf },
    research: {
      knowledgeSharing,
      publications: parseInt(publications) || 0,
      grant,
      industry,
      engagementType,
      engagementDays: engagementDays || null,
      engagementStatus: engagementStatus || null,
    },
  })

  const handleSave = async () => {
    setSaving(true)
    const data = collectData()
    const result = await saveEntry(data)

    if (result.success) {
      setToast({ message: `✅ Entry ${result.action} successfully!`, type: 'success' })
      onSaved?.()
    } else {
      setToast({ message: '❌ ' + result.error, type: 'error' })
    }

    setSaving(false)
    setTimeout(() => setToast(null), 3000)
  }

  const handleReset = () => {
    if (!window.confirm('Reset all fields to default?')) return
    setLessonPlan('Not Started'); setTeachingMaterial('Not Started')
    setCoursera('Not Started'); setCurriculum('Not Started')
    setAssessments({})
    setPanopto('Not Started'); setAttendanceStatus('Not Started')
    setAttendanceClasses(''); setCourseworkStatus('Not Started')
    setCourseworkPending(''); setExamVettingStatus('Not Started')
    setExamVettingDate('')
    setFinalMarks('Not Started'); setCloPlo('Not Started'); setDcf('Not Started')
    setKnowledgeSharing('Not Started'); setPublications(0)
    setGrant('None'); setIndustry('None')
    setEngagementType('None'); setEngagementDays(''); setEngagementStatus('')
  }

  const progress = getProgress()

  return (
    <div>
      {/* Form Header */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${faculty.color}`,
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${faculty.color}, ${faculty.color}88)`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: '18px',
            }}>
              {(lecturer.name || '').split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>
                {lecturer.title && <span style={{ color: '#6b7280', fontWeight: '500' }}>{lecturer.title} </span>}
                {lecturer.name}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                {lecturer.staffId} · {faculty.code} · {course.code} - {course.name}
              </div>
            </div>
          </div>

          {/* Progress Ring */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '60px', height: '60px' }}>
              <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="30" cy="30" r="24" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle
                  cx="30" cy="30" r="24" fill="none" stroke={faculty.color} strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                fontSize: '14px', fontWeight: '700', color: faculty.color,
              }}>
                {progress}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Pre-Semester */}
      <SectionCard title="1. Pre-Semester Readiness" color={faculty.color} onMarkComplete={() => markSectionComplete(1)}>
        <FormRow label="Lesson Plan Approved">
          <Select value={lessonPlan} onChange={setLessonPlan} options={STATUS_OPTIONS} />
        </FormRow>
        <FormRow label="Teaching Material / Slides">
          <Select value={teachingMaterial} onChange={setTeachingMaterial} options={STATUS_OPTIONS} />
        </FormRow>

        <div style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px' }}>Assessment Components</div>
          {ASSESSMENT_TYPES.map((type) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', minWidth: '120px' }}>
                <input type="checkbox" checked={assessments[type]?.checked || false} onChange={() => toggleAssessment(type)} style={{ width: '16px', height: '16px' }} />
                {type}
              </label>
              {assessments[type]?.checked && (
                <Select value={assessments[type].status} onChange={(v) => setAssessments((prev) => ({ ...prev, [type]: { ...prev[type], status: v } }))} options={STATUS_OPTIONS} small />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', minWidth: '120px' }}>
              <input type="checkbox" checked={assessments['Others']?.checked || false} onChange={() => toggleAssessment('Others')} style={{ width: '16px', height: '16px' }} />
              Others
            </label>
            {assessments['Others']?.checked && (
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <Select value={assessments['Others'].status} onChange={(v) => setAssessments((prev) => ({ ...prev, Others: { ...prev.Others, status: v } }))} options={STATUS_OPTIONS} small />
                <input type="text" value={assessments['Others'].description || ''} onChange={(e) => setAssessments((prev) => ({ ...prev, Others: { ...prev.Others, description: e.target.value } }))} placeholder="e.g. Case Study, Viva" style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '13px' }} />
              </div>
            )}
          </div>
        </div>

        <FormRow label="Coursera Course Builder">
          <Select value={coursera} onChange={setCoursera} options={STATUS_OPTIONS} />
        </FormRow>
        <FormRow label="Curriculum (Table 4)">
          <Select value={curriculum} onChange={setCurriculum} options={STATUS_OPTIONS} />
        </FormRow>
      </SectionCard>

      {/* SECTION 2: Teaching & Assessment */}
      <SectionCard title="2. Teaching & Assessment" color={faculty.color} onMarkComplete={() => markSectionComplete(2)}>
        <FormRow label="Panopto (Every Class)">
          <Select value={panopto} onChange={setPanopto} options={STATUS_OPTIONS_TEACHING} />
        </FormRow>

        <FormRow label="Attendance Update">
          <Select value={attendanceStatus} onChange={setAttendanceStatus} options={STATUS_OPTIONS_TEACHING} />
        </FormRow>
        {attendanceStatus === 'In Progress' && (
          <ConditionalBox>
            <label style={condLabel}>Classes Logged:</label>
            <input type="number" value={attendanceClasses} onChange={(e) => setAttendanceClasses(e.target.value)} placeholder="e.g. 10" min="0" max="14" style={inputStyle} />
          </ConditionalBox>
        )}

        <FormRow label="Coursework Marks (W12)">
          <Select value={courseworkStatus} onChange={setCourseworkStatus} options={STATUS_OPTIONS} />
        </FormRow>
        {courseworkStatus === 'Pending' && (
          <ConditionalBox>
            <label style={condLabel}>Pending Assessments:</label>
            <input type="text" value={courseworkPending} onChange={(e) => setCourseworkPending(e.target.value)} placeholder="e.g. Assignment 2" style={inputStyle} />
          </ConditionalBox>
        )}

        <FormRow label="Exam Submission & Vetting">
          <Select value={examVettingStatus} onChange={setExamVettingStatus} options={STATUS_OPTIONS} />
        </FormRow>
        {examVettingStatus === 'Pending' && (
          <ConditionalBox>
            <label style={condLabel}>Vetting Date:</label>
            <input type="date" value={examVettingDate} onChange={(e) => setExamVettingDate(e.target.value)} style={inputStyle} />
          </ConditionalBox>
        )}
      </SectionCard>

      {/* SECTION 3: QA, CQI & Evaluation */}
      <SectionCard title="3. QA, CQI & Evaluation" color={faculty.color} onMarkComplete={() => markSectionComplete(3)}>
        <FormRow label="Final Marks & Moderation">
          <Select value={finalMarks} onChange={setFinalMarks} options={STATUS_OPTIONS} />
        </FormRow>
        <FormRow label="CLO / PLO Analysis & CQI">
          <Select value={cloPlo} onChange={setCloPlo} options={STATUS_OPTIONS} />
        </FormRow>
        <FormRow label="Digital Course File (DCF)">
          <Select value={dcf} onChange={setDcf} options={STATUS_OPTIONS} />
        </FormRow>
      </SectionCard>

      {/* SECTION 4: Research & Impact */}
      <SectionCard title="4. Research & Institutional Impact" color={faculty.color} onMarkComplete={() => markSectionComplete(4)}>
        <FormRow label="Knowledge Sharing Session">
          <Select value={knowledgeSharing} onChange={setKnowledgeSharing} options={STATUS_OPTIONS} />
        </FormRow>
        <FormRow label="Paper Publication (Scopus/WoS)">
          <input type="number" value={publications} onChange={(e) => setPublications(e.target.value)} min="0" style={{ ...inputStyle, width: '100px' }} />
        </FormRow>
        <FormRow label="Grant">
          <Select value={grant} onChange={setGrant} options={['Secured', 'Applied', 'None']} />
        </FormRow>
        <FormRow label="Industry Collaboration">
          <Select value={industry} onChange={setIndustry} options={['Active', 'In Progress', 'None']} />
        </FormRow>
        <FormRow label="Engagement Activity">
          <Select value={engagementType} onChange={setEngagementType} options={['None', 'Marketing', 'Community']} />
        </FormRow>
        {engagementType === 'Marketing' && (
          <ConditionalBox>
            <label style={condLabel}>Days Attended:</label>
            <Select value={engagementDays} onChange={setEngagementDays} options={['1 Day', '2 Days', '3 Days', '4 Days', '5+ Days']} small />
          </ConditionalBox>
        )}
        {(engagementType === 'Marketing' || engagementType === 'Community') && (
          <ConditionalBox>
            <label style={condLabel}>Status:</label>
            <Select value={engagementStatus} onChange={setEngagementStatus} options={['Completed', 'In Progress', 'Scheduled']} small />
          </ConditionalBox>
        )}
      </SectionCard>

      {/* SAVE BAR */}
      <div style={{
        position: 'sticky', bottom: 0, background: '#fff', padding: '16px 20px',
        marginTop: '20px', borderRadius: '10px', boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Progress: <strong style={{ color: faculty.color }}>{progress}%</strong> complete
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}>
            <option value="Feb">Feb Semester</option>
            <option value="May">May Semester</option>
            <option value="Sep">Sep Semester</option>
          </select>
          <button onClick={handleReset} style={{ padding: '10px 18px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
            ↻ Reset
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', background: saving ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '⏳ Saving...' : '💾 Save Entry'}
          </button>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '20px', padding: '14px 24px',
          borderRadius: '10px', background: toast.type === 'error' ? '#dc2626' : '#059669',
          color: '#fff', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 2000,
        }}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

// Sub-components
function SectionCard({ title, color, onMarkComplete, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: '10px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{title}</h3>
        <button onClick={onMarkComplete} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
          ✓ Mark All Complete
        </button>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

function FormRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ fontSize: '14px', fontWeight: '500' }}>{label}</div>
      {children}
    </div>
  )
}

function Select({ value, onChange, options, small }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: small ? '6px 10px' : '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: small ? '12px' : '13px', outline: 'none', minWidth: small ? '120px' : '160px' }}>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

function ConditionalBox({ children }) {
  return (
    <div style={{ margin: '8px 0', padding: '10px', background: '#f9fafb', borderRadius: '6px', borderLeft: '3px solid #2563eb' }}>
      {children}
    </div>
  )
}

const inputStyle = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none' }
const condLabel = { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '5px', fontWeight: '600' }