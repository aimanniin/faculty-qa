const inp = { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }
const lbl = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }
const rmBtn = { padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }
const addBtn = { padding: '7px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '8px' }

export function defaultLessonPlan(semester) {
  const year = new Date().getFullYear()
  return {
    programme: '',
    academicSession: (semester || '') + ' ' + year,
    creditHours: '',
    emailRoom: '',
    synopsis: '',
    clos: [
      { statement: '', taxonomy: '', plo: '' },
      { statement: '', taxonomy: '', plo: '' },
    ],
    weeks: Array.from({ length: 14 }, (_, i) => ({ week: i + 1, topic: '', clo: '', delivery: '', mode: 'Physical', deliverables: '' })),
    assessments: [
      { title: '', weight: '', format: '', due: '' },
      { title: '', weight: '', format: '', due: '' },
      { title: '', weight: '', format: '', due: '' },
    ],
    requiredText: '',
    approvedBy: '',
  }
}

export default function LessonPlanForm({ lp, onChange, course, lecturer }) {
  const up = (patch) => onChange({ ...lp, ...patch })

  const setClo = (i, f, v) => up({ clos: lp.clos.map((c, x) => (x === i ? { ...c, [f]: v } : c)) })
  const addClo = () => up({ clos: [...lp.clos, { statement: '', taxonomy: '', plo: '' }] })
  const rmClo = (i) => up({ clos: lp.clos.filter((_, x) => x !== i) })

  const setWeek = (i, f, v) => up({ weeks: lp.weeks.map((w, x) => (x === i ? { ...w, [f]: v } : w)) })

  const setAssessment = (i, f, v) => up({ assessments: lp.assessments.map((a, x) => (x === i ? { ...a, [f]: v } : a)) })
  const addAssessment = () => up({ assessments: [...lp.assessments, { title: '', weight: '', format: '', due: '' }] })
  const rmAssessment = (i) => up({ assessments: lp.assessments.filter((_, x) => x !== i) })

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', borderTop: '5px solid #0ea5e9' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>📄 Lesson Plan (Unit Study Guide)</h3>
      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Complete following the UNIMY USG & Lesson Plan template.</p>

      {/* 1. General info */}
      <SectionTitle n="1" t="General Course Information & Academic Team" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div><label style={lbl}>Programme</label><input value={lp.programme} onChange={(e) => up({ programme: e.target.value })} placeholder="e.g. Bachelor of Computer Science" style={inp} /></div>
        <div><label style={lbl}>Academic Session</label><input value={lp.academicSession} onChange={(e) => up({ academicSession: e.target.value })} style={inp} /></div>
        <div><label style={lbl}>Course Title & Code</label><input value={(course?.name || '') + ' (' + (course?.code || '') + ')'} disabled style={{ ...inp, background: '#f3f4f6' }} /></div>
        <div><label style={lbl}>Credit Hours</label><input value={lp.creditHours} onChange={(e) => up({ creditHours: e.target.value })} placeholder="e.g. 3" style={inp} /></div>
        <div><label style={lbl}>Course Lecturer</label><input value={lecturer?.name || ''} disabled style={{ ...inp, background: '#f3f4f6' }} /></div>
        <div><label style={lbl}>Email / Room</label><input value={lp.emailRoom} onChange={(e) => up({ emailRoom: e.target.value })} placeholder="email / room" style={inp} /></div>
      </div>

      {/* 2. Synopsis & CLOs */}
      <SectionTitle n="2" t="Course Synopsis & Learning Outcomes" />
      <label style={lbl}>Synopsis</label>
      <textarea value={lp.synopsis} onChange={(e) => up({ synopsis: e.target.value })} rows={3} placeholder="Brief overview of the course themes and industry relevance..." style={{ ...inp, marginBottom: '12px' }} />
      {lp.clos.map((c, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
          <input value={c.statement} onChange={(e) => setClo(i, 'statement', e.target.value)} placeholder={'CLO ' + (i + 1) + ' statement'} style={inp} />
          <input value={c.taxonomy} onChange={(e) => setClo(i, 'taxonomy', e.target.value)} placeholder="e.g. C2" style={inp} />
          <input value={c.plo} onChange={(e) => setClo(i, 'plo', e.target.value)} placeholder="e.g. PLO1" style={inp} />
          <button onClick={() => rmClo(i)} style={rmBtn}>✕</button>
        </div>
      ))}
      <button onClick={addClo} style={addBtn}>+ Add CLO</button>

      {/* 3. 14-week plan */}
      <SectionTitle n="3" t="14-Week Lesson Plan & Student Learning Time (SLT)" />
      {lp.weeks.map((w, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 2fr 56px 1.2fr 86px 1fr', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textAlign: 'center' }}>{w.week}</span>
          <input value={w.topic} onChange={(e) => setWeek(i, 'topic', e.target.value)} placeholder="Topic" style={inp} />
          <input value={w.clo} onChange={(e) => setWeek(i, 'clo', e.target.value)} placeholder="CLO" style={inp} />
          <input value={w.delivery} onChange={(e) => setWeek(i, 'Delivery', e.target.value)} placeholder="Delivery Method" style={inp} />
          <select value={w.mode} onChange={(e) => setWeek(i, 'mode', e.target.value)} style={inp}>
            <option>Physical</option>
            <option>Online</option>
          </select>
          <input value={w.deliverables} onChange={(e) => setWeek(i, 'deliverables', e.target.value)} placeholder="Deliverables" style={inp} />
        </div>
      ))}

      {/* 4. Assessments */}
      <SectionTitle n="4" t="Summary of Assessments" />
      {lp.assessments.map((a, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 64px 1.4fr 86px auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
          <input value={a.title} onChange={(e) => setAssessment(i, 'title', e.target.value)} placeholder="Assessment title" style={inp} />
          <input value={a.weight} onChange={(e) => setAssessment(i, 'weight', e.target.value)} placeholder="%" style={inp} />
          <input value={a.format} onChange={(e) => setAssessment(i, 'format', e.target.value)} placeholder="Length / format" style={inp} />
          <input value={a.due} onChange={(e) => setAssessment(i, 'due', e.target.value)} placeholder="Due" style={inp} />
          <button onClick={() => rmAssessment(i)} style={rmBtn}>✕</button>
        </div>
      ))}
      <button onClick={addAssessment} style={addBtn}>+ Add Assessment</button>

      {/* 5. Integrity & resources */}
      <SectionTitle n="5" t="Academic Integrity & Resources" />
      <div style={{ background: '#fef9c3', borderLeft: '4px solid #f59e0b', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#334155', lineHeight: 1.6, marginBottom: '12px' }}>
        Honesty is essential. Plagiarism, cheating, and uncredited collaboration are violations. Submissions must yield a Turnitin score below 30% (excluding references). Unauthorized AI-generated content will result in a void / further deduction of marks.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div><label style={lbl}>Required Text</label><input value={lp.requiredText} onChange={(e) => up({ requiredText: e.target.value })} placeholder="Author, Year. Title. Edition. Publisher." style={inp} /></div>
        <div><label style={lbl}>Approved By (Dean/HOP)</label><input value={lp.approvedBy} onChange={(e) => up({ approvedBy: e.target.value })} placeholder="Name" style={inp} /></div>
      </div>
      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>
        Prepared By: <strong>{lecturer?.name || '-'}</strong> · Date: <strong>{new Date().toLocaleDateString()}</strong>
      </p>
    </div>
  )
}

function SectionTitle({ n, t }) {
  return <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '16px 0 10px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>{n}. {t}</div>
}