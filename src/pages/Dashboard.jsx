import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllLecturers } from '../services/lecturerService'
import { getAllEntries, calculateCompletion } from '../services/entryService'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const FACULTY_COLORS = {
  SOCDT: '#3b82f6', SOEFT: '#f59e0b', SOCM: '#8b5cf6',
  SOBT: '#10b981', PG: '#ef4444', FSAS: '#06b6d4',
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [lecturers, setLecturers] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const role = profile?.role
  const isLecturer = role === 'lecturer'
  const isScoped = role === 'hod' || role === 'lecturer'

  useEffect(() => {
    (async () => {
      const [lec, ent] = await Promise.all([getAllLecturers(), getAllEntries()])
      setLecturers(lec.data || [])
      setEntries(ent.data || [])
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>Loading dashboard...</div>
  }

  // ---- Scope data by role ----
  const scopedLecturers = isScoped
    ? lecturers.filter((l) => l.department === profile.facultyCode)
    : lecturers
  const scopedEntries = isScoped
    ? entries.filter((e) => e.facultyCode === profile.facultyCode)
    : entries

  // ---- Stats ----
  const avgCompletion = scopedEntries.length
    ? Math.round(scopedEntries.reduce((s, e) => s + calculateCompletion(e), 0) / scopedEntries.length)
    : 0

  // Faculty comparison (avg completion per faculty)
  const facultyData = Object.keys(FACULTY_COLORS)
    .map((code) => {
      const facEntries = entries.filter((e) => e.facultyCode === code)
      const avg = facEntries.length
        ? Math.round(facEntries.reduce((s, e) => s + calculateCompletion(e), 0) / facEntries.length)
        : 0
      return { code, avg }
    })

  // Status distribution
  let completed = 0, pending = 0, notStarted = 0
  scopedEntries.forEach((e) => {
    const fields = [
      e.preSemester?.lessonPlan, e.preSemester?.teachingMaterial, e.preSemester?.coursera, e.preSemester?.curriculum,
      e.teaching?.panopto, e.teaching?.attendanceStatus, e.teaching?.courseworkStatus, e.teaching?.examVettingStatus,
      e.qa?.finalMarks, e.qa?.cloPlo, e.qa?.dcf,
      e.research?.knowledgeSharing, e.research?.grant, e.research?.industry,
    ]
    fields.forEach((v) => {
      if (v === 'Completed' || v === 'Secured' || v === 'Active') completed++
      else if (v === 'Pending' || v === 'In Progress' || v === 'Applied') pending++
      else notStarted++
    })
  })
  const statusData = [
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'In Progress', value: pending, color: '#f59e0b' },
    { name: 'Not Started', value: notStarted, color: '#ef4444' },
  ].filter((d) => d.value > 0)

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
        {isScoped ? `📊 ${profile.facultyCode} Dashboard` : '📊 All Dashboard'}
      </h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
        {isLecturer ? 'Faculty overview (names hidden)' : 'Full overview with details'}
      </p>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <StatCard label="Lecturers" value={scopedLecturers.length} color="#2563eb" />
        <StatCard label="KPI Entries" value={scopedEntries.length} color="#7c3aed" />
        <StatCard label="Avg Completion" value={`${avgCompletion}%`} color="#059669" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>🏢 Faculty Comparison (Avg Completion)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={facultyData}>
              <XAxis dataKey="code" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                {facultyData.map((f, i) => (
                  <Cell key={i} fill={FACULTY_COLORS[f.code]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>📈 Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {statusData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lecturer Table — HIDDEN for lecturer role */}
      {!isLecturer ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>👥 Lecturer Overview</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={th}>Lecturer</th>
                  <th style={th}>Faculty</th>
                  <th style={th}>Courses</th>
                  <th style={th}>Entries</th>
                </tr>
              </thead>
              <tbody>
                {scopedLecturers.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={td}>
                      {l.title && <span style={{ color: '#6b7280' }}>{l.title} </span>}
                      {l.name}
                    </td>
                    <td style={td}>{l.department}</td>
                    <td style={td}>{(l.subjects || []).length}</td>
                    <td style={td}>{entries.filter((e) => e.lecturerId === (l.staffId || l.id)).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px', textAlign: 'center', color: '#1e40af', fontSize: '13px' }}>
          🔒 Individual lecturer names are hidden for your role.
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '13px', color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '700', color, marginTop: '4px' }}>{value}</div>
    </div>
  )
}

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: '12px' }
const td = { padding: '10px 12px', color: '#4b5563' }