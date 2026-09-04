import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllLecturers } from '../services/lecturerService'
import { getCqi, saveCqi } from '../services/cqiService'
import { getEntry, calculateCompletion } from '../services/entryService'
import { getCurrentSemester } from '../utils/semester'
import { logActivity } from '../services/logService'
import LessonPlanForm, { defaultLessonPlan } from '../components/LessonPlanForm'

const FACULTIES = [
  { code: 'SOCDT', name: 'School of Computing & Digital Technology', icon: '💻', color: '#3b82f6' },
  { code: 'SOEFT', name: 'School of Engineering & Future Technologies', icon: '⚙️', color: '#f59e0b' },
  { code: 'SOCM', name: 'School of Communication & Media', icon: '📰', color: '#8b5cf6' },
  { code: 'SOBT', name: 'School of Business & Technology', icon: '💼', color: '#10b981' },
  { code: 'PG', name: 'Postgraduate Studies', icon: '🎓', color: '#ef4444' },
  { code: 'FSAS', name: 'Faculty of Science & Social Sciences', icon: '🔬', color: '#06b6d4' },
]

export default function Cqi() {
  const { profile } = useAuth()
  const role = profile?.role
  const isLecturer = role === 'lecturer'
  const isHod = role === 'hod'
  const semester = getCurrentSemester()

  const [level, setLevel] = useState(1)
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [selectedLecturer, setSelectedLecturer] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [existing, setExisting] = useState(null)
  const [completion, setCompletion] = useState(null)

  const loadLecturers = useCallback(async () => {
    setLoading(true)
    const r = await getAllLecturers()
    if (r.success) setLecturers(r.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadLecturers() }, [loadLecturers])

  const getFaculty = (code) => FACULTIES.find((f) => f.code === code) || { code, name: code, icon: '🏢', color: '#6b7280' }

  const openCourse = async (course, lecturer) => {
    const lec = lecturer || selectedLecturer
    setSelectedCourse(course)
    const [c, e] = await Promise.all([
      getCqi(lec.staffId || lec.id, course.code, semester),
      getEntry(lec.staffId || lec.id, course.code, semester),
    ])
    setExisting(c.success ? c.data : null)
    setCompletion(e.success && e.data ? calculateCompletion(e.data) : null)
    setLevel(4)
  }

  useEffect(() => {
    if (isLecturer && !loading && lecturers.length > 0 && !selectedLecturer) {
      const me = lecturers.find((l) => (l.staffId || l.id) === profile?.lecturerId)
      if (me) {
        setSelectedLecturer(me)
        setSelectedFaculty(getFaculty(me.department))
        const mine = (me.subjects || []).filter((s) => s.semester === semester)
        if (mine.length === 1) openCourse(mine[0], me)
        else setLevel(3)
      }
    }
  }, [isLecturer, loading, lecturers])

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>Loading...</div>

  const visibleFaculties = isHod ? FACULTIES.filter((f) => f.code === profile.facultyCode) : FACULTIES
  const filteredLecturers = lecturers.filter((l) => l.department === selectedFaculty?.code)

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Semester:</span>
        <span style={{ padding: '7px 16px', borderRadius: '20px', background: '#2563eb', color: '#fff', fontSize: '13px', fontWeight: '600' }}>
          {semester} (Current)
        </span>
      </div>

      {level === 1 && (
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>📈 Select Faculty for CQI</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {visibleFaculties.map((f) => (
              <div key={f.code} onClick={() => { setSelectedFaculty(f); setLevel(2) }} style={{ background: '#fff', borderRadius: '12px', padding: '24px', cursor: 'pointer', border: '2px solid transparent', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = f.color }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>{f.icon}</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{f.code}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{f.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {level === 2 && (
        <div>
          {!isLecturer && <button onClick={() => setLevel(1)} style={backBtn}>← Back</button>}
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 20px' }}>Select Lecturer in {selectedFaculty?.code}</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {filteredLecturers.map((lec) => (
              <div key={lec.id} onClick={() => { setSelectedLecturer(lec); (lec.subjects || []).filter((s) => s.semester === semester).length === 1 ? openCourse((lec.subjects || []).filter((s) => s.semester === semester)[0], lec) : setLevel(3) }} style={{ background: '#fff', borderRadius: '10px', padding: '18px', cursor: 'pointer', borderLeft: `4px solid ${selectedFaculty?.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontWeight: '600' }}>{lec.title && <span style={{ color: '#6b7280', fontWeight: '500' }}>{lec.title} </span>}{lec.name}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>{lec.staffId}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {level === 3 && (
        <div>
          <button onClick={() => setLevel(2)} style={backBtn}>← Back</button>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 20px' }}>Select Course for {selectedLecturer?.name}</h1>
          {((selectedLecturer?.subjects || []).filter((c) => c.semester === semester)).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px' }}>
              <p style={{ color: '#6b7280' }}>No courses in the {semester} semester.</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
            {(selectedLecturer?.subjects || []).filter((c) => c.semester === semester).map((course) => (
              <div key={course.code} onClick={() => openCourse(course)} style={{ background: '#fff', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: selectedFaculty?.color }}>{course.code}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{course.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {level === 4 && selectedCourse && (
        <div>
          <button onClick={() => setLevel(3)} style={backBtn}>← Back to Courses</button>
          <CqiForm lecturer={selectedLecturer} course={selectedCourse} faculty={selectedFaculty} semester={semester} existing={existing} completion={completion}
            onSaved={() => logActivity(profile, 'SAVE_CQI', { lecturerId: selectedLecturer?.staffId, course: selectedCourse?.code })} />
        </div>
      )}
    </div>
  )
}

function CqiForm({ lecturer, course, faculty, semester, existing, completion, onSaved }) {
  // ✅ lessonPlan state is NOW inside CqiForm where it's used
  const [lessonPlan, setLessonPlan] = useState(existing?.lessonPlan || defaultLessonPlan(semester))
  
  const [clos, setClos] = useState(existing?.clos || [
    { clo: 'CLO 1', target: 70, actual: '' },
    { clo: 'CLO 2', target: 70, actual: '' },
    { clo: 'CLO 3', target: 70, actual: '' },
  ])
  const [strengths, setStrengths] = useState(existing?.strengths || '')
  const [weaknesses, setWeaknesses] = useState(existing?.weaknesses || '')
  const [actions, setActions] = useState(existing?.actions || '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const setClo = (i, field, value) => setClos((p) => p.map((c, x) => (x === i ? { ...c, [field]: value } : c)))

  const handleSave = async () => {
    setSaving(true)
    const r = await saveCqi({
      lecturerId: lecturer.staffId || lecturer.id,
      courseCode: course.code,
      facultyCode: faculty.code,
      semester,
      clos,
      strengths,
      weaknesses,
      actions,
      lessonPlan,  // ✅ Now lessonPlan is defined in this scope
    })
    setSaving(false)
    setToast(r.success ? '✅ CQI ' + r.action : '❌ ' + r.error)
    if (r.success) onSaved?.()
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', borderLeft: `4px solid ${faculty.color}`, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700' }}>{course.code} — {course.name}</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{lecturer.name} · {faculty.code} · {semester}</div>
        </div>
        {completion !== null && (
          <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#eff6ff', color: '#2563eb', fontWeight: '700', fontSize: '13px' }}>
            KPI Completion: {completion}%
          </span>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px' }}>🎯 CLO / PLO Attainment Analysis</h3>
        {clos.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ width: '70px', fontWeight: '700', color: '#2563eb', fontSize: '14px' }}>{c.clo}</span>
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Target %</label>
            <input type="number" value={c.target} onChange={(e) => setClo(i, 'target', e.target.value)} style={inp} />
            <label style={{ fontSize: '12px', color: '#6b7280' }}>Actual %</label>
            <input type="number" value={c.actual} onChange={(e) => setClo(i, 'actual', e.target.value)} placeholder="e.g. 78" style={inp} />
            {c.actual !== '' && (
              <span style={{ fontSize: '12px', fontWeight: '700', color: Number(c.actual) >= Number(c.target) ? '#059669' : '#dc2626' }}>
                {Number(c.actual) >= Number(c.target) ? '✅ Met' : '⚠️ Below target'}
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px' }}>📝 CQI Report</h3>
        <Field label="What went well (strengths)">
          <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={3} style={{ ...inp, width: '100%' }} />
        </Field>
        <Field label="Issues / weaknesses">
          <textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} rows={3} style={{ ...inp, width: '100%' }} />
        </Field>
        <Field label="Corrective actions for next semester">
          <textarea value={actions} onChange={(e) => setActions(e.target.value)} rows={3} style={{ ...inp, width: '100%' }} />
        </Field>
      </div>

      {/* ✅ LessonPlanForm with correct state */}
      <LessonPlanForm lp={lessonPlan} onChange={setLessonPlan} course={course} lecturer={lecturer} semester={semester} />

      <button onClick={handleSave} disabled={saving} style={{ padding: '12px 28px', background: saving ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        {saving ? '⏳ Saving...' : '💾 Save CQI'}
      </button>

      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', padding: '14px 24px', borderRadius: '10px', background: toast.startsWith('❌') ? '#dc2626' : '#059669', color: '#fff', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 2000 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return <div style={{ marginBottom: '14px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>{label}</label>{children}</div>
}

const inp = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none' }
const backBtn = { display: 'inline-flex', padding: '10px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginBottom: '16px' }