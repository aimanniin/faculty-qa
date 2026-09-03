import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllLecturers } from '../services/lecturerService'
import { getEntry } from '../services/entryService'
import { logActivity } from '../services/logService'
import EntryForm from '../components/EntryForm'
import { getCurrentSemester } from '../utils/semester'

const FACULTIES = [
  { code: 'SOCDT', name: 'School of Computing & Digital Technology', icon: '💻', color: '#3b82f6' },
  { code: 'SOEFT', name: 'School of Engineering & Future Technologies', icon: '⚙️', color: '#f59e0b' },
  { code: 'SOCM', name: 'School of Communication & Media', icon: '📰', color: '#8b5cf6' },
  { code: 'SOBT', name: 'School of Business & Technology', icon: '💼', color: '#10b981' },
  { code: 'PG', name: 'Postgraduate Studies', icon: '🎓', color: '#ef4444' },
  { code: 'FSAS', name: 'Faculty of Science & Social Sciences', icon: '🔬', color: '#06b6d4' },
]

export default function Entry() {
  const { profile } = useAuth()
  const role = profile?.role
  const isLecturer = role === 'lecturer'
  const isHod = role === 'hod'

  const [level, setLevel] = useState(1)
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const semesterFilter = getCurrentSemester()

  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [selectedLecturer, setSelectedLecturer] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [existingEntry, setExistingEntry] = useState(null)

  const loadLecturers = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const result = await getAllLecturers()
    if (result.success) setLecturers(result.data || [])
    else setLoadError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => { loadLecturers() }, [loadLecturers])

  const getFaculty = (code) =>
    FACULTIES.find((f) => f.code === code) || { code, name: code, icon: '🏢', color: '#6b7280' }

  // Open a course → load existing entry → show form
  const openCourse = async (course, lecturer) => {
    const lec = lecturer || selectedLecturer
    setSelectedCourse(course)
        const result = await getEntry(lec.staffId || lec.id, course.code, semesterFilter)
    setExistingEntry(result.success ? result.data : null)
    setLevel(4)
  }

  const selectFaculty = (faculty) => {
    setSelectedFaculty(faculty)
    setLevel(2)
  }

  const selectLecturer = (lecturer) => {
    setSelectedLecturer(lecturer)
    if ((lecturer.subjects || []).length === 1) {
      openCourse(lecturer.subjects[0], lecturer)
    } else {
      setLevel(3)
    }
  }

  // Lecturer: jump straight to own courses once loaded
  useEffect(() => {
    if (isLecturer && !loading && lecturers.length > 0 && !selectedLecturer) {
      const me = lecturers.find((l) => (l.staffId || l.id) === profile?.lecturerId)
      if (me) {
        setSelectedLecturer(me)
        setSelectedFaculty(getFaculty(me.department))
        const mine = (me.subjects || []).filter((s) => s.semester === semesterFilter)
        if (mine.length === 1) openCourse(mine[0], me)
        else setLevel(3)
      }
    }
  }, [isLecturer, loading, lecturers])

  // Breadcrumb
  const crumbs = [
    { label: '🏠 Faculties', level: 1 },
    ...(selectedFaculty ? [{ label: selectedFaculty.code, level: 2 }] : []),
    ...(selectedLecturer ? [{ label: selectedLecturer.name, level: 3 }] : []),
    ...(selectedCourse ? [{ label: selectedCourse.code, level: 4 }] : []),
  ]

  // ---- Loading ----
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>Loading...</div>
  }

  // ---- Error ----
  if (loadError) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
        <p style={{ color: '#dc2626', marginBottom: '16px' }}>{loadError}</p>
        <button onClick={loadLecturers} style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          🔄 Try Again
        </button>
      </div>
    )
  }

  // Faculties visible to this role
  const visibleFaculties = isHod
    ? FACULTIES.filter((f) => f.code === profile.facultyCode)
    : FACULTIES

  const filteredLecturers = lecturers.filter((l) => l.department === selectedFaculty?.code)

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px', flexWrap: 'wrap' }}>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {i > 0 && <span style={{ color: '#d1d5db' }}>›</span>}
            {c.level < level && !isLecturer ? (
              <button onClick={() => setLevel(c.level)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                {c.label}
              </button>
            ) : (
              <span style={{ color: '#374151', fontWeight: '600' }}>{c.label}</span>
            )}
          </span>
        ))}
      </div>

           {/* Semester (auto-locked to current) */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Semester:</span>
        {['Feb', 'May', 'Sep'].map((s) => {
          const isCurrent = s === getCurrentSemester()
          return (
            <button
              key={s}
              disabled={!isCurrent}
              style={{
                padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                border: '1px solid ' + (isCurrent ? '#2563eb' : '#e5e7eb'),
                background: isCurrent ? '#2563eb' : '#f3f4f6',
                color: isCurrent ? '#fff' : '#9ca3af',
                cursor: isCurrent ? 'default' : 'not-allowed',
                opacity: isCurrent ? 1 : 0.6,
              }}
            >
              {s}
              {isCurrent && <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.85 }}>(Current)</span>}
            </button>
          )
        })}
      </div>

      {/* ===== LEVEL 1: FACULTY ===== */}
      {level === 1 && !isLecturer && (
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>📋 Select Faculty</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {visibleFaculties.map((f) => {
              const count = lecturers.filter((l) => l.department === f.code).length
              return (
                <div key={f.code} onClick={() => selectFaculty(f)} style={{
                  background: '#fff', borderRadius: '12px', padding: '24px', cursor: 'pointer',
                  border: '2px solid transparent', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all .2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.transform = 'translateY(-3px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>{f.icon}</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{f.code}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>{f.name}</div>
                  <div style={{ fontSize: '13px', color: f.color, fontWeight: '600', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                    👥 {count} lecturer{count !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== LEVEL 2: LECTURER ===== */}
      {level === 2 && !isLecturer && (
        <div>
          {!isLecturer && <button onClick={() => setLevel(1)} style={backBtn}>← Back to Faculties</button>}
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 20px' }}>
            {selectedFaculty?.icon} Select Lecturer in {selectedFaculty?.code}
          </h1>
          {filteredLecturers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
              <p style={{ color: '#6b7280' }}>No lecturers in this faculty yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {filteredLecturers.map((lec) => (
                <div key={lec.id} onClick={() => selectLecturer(lec)} style={{
                  background: '#fff', borderRadius: '10px', padding: '18px', cursor: 'pointer',
                  borderLeft: `4px solid ${selectedFaculty?.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all .2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${selectedFaculty?.color}, ${selectedFaculty?.color}88)`,
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600',
                    }}>
                      {(lec.name || '').split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>
                        {lec.title && <span style={{ color: '#6b7280', fontWeight: '500' }}>{lec.title} </span>}
                        {lec.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>{lec.staffId}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {(lec.subjects || []).map((s, i) => (
                      <span key={i} style={{ padding: '4px 10px', background: '#f3f4f6', borderRadius: '5px', fontSize: '11px', fontWeight: '600', border: '1px solid #e5e7eb' }}>
                        {s.code}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

          {/* ===== LEVEL 3: COURSE ===== */}
      {level === 3 && (
        <div>
          {!isLecturer && <button onClick={() => setLevel(2)} style={backBtn}>← Back to Lecturers</button>}
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 20px' }}>
            📚 Select Course for {selectedLecturer?.name}
          </h1>

          {/* Empty state: no courses in the selected semester */}
          {((selectedLecturer?.subjects || []).filter((c) => c.semester === semesterFilter)).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📅</div>
              <p style={{ color: '#6b7280' }}>
                No courses for {selectedLecturer?.name} in the {semesterFilter} semester. Switch semester above.
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
            {(selectedLecturer?.subjects || []).filter((c) => c.semester === semesterFilter).map((course) => (
              <div key={course.code} onClick={() => openCourse(course)} style={{
                background: '#fff', borderRadius: '10px', padding: '20px', textAlign: 'center',
                cursor: 'pointer', border: '2px solid transparent', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all .2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = selectedFaculty?.color }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent' }}
              >
                <div style={{ fontSize: '20px', fontWeight: '700', color: selectedFaculty?.color }}>{course.code}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{course.name}</div>
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
                  📅 {course.semester} Semester
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== LEVEL 4: FORM ===== */}
      {level === 4 && selectedCourse && (
        <div>
         <button onClick={() => setLevel(3)} style={backBtn}>← Back to Courses</button>
          <EntryForm
            lecturer={selectedLecturer}
            course={selectedCourse}
            faculty={selectedFaculty}
            existingEntry={existingEntry}
            onSaved={() => logActivity(profile, 'SAVE_ENTRY', {
              lecturerId: selectedLecturer?.staffId || selectedLecturer?.id,
              course: selectedCourse?.code,
            })}
          />
        </div>
      )}
    </div>
  )
}

const backBtn = {
  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
  background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px',
  cursor: 'pointer', fontSize: '13px', marginBottom: '16px',
}