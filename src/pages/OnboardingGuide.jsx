import { useState } from 'react'

const TABS = [
  { id: 'pre', label: '1. Pre-Semester (Wk 0)' },
  { id: 'during', label: '2. During Semester (Wk 1-14)' },
  { id: 'post', label: '3. Post-Semester' },
  { id: 'sops', label: 'Key SOPs & Audits' },
]

const CONTENT = {
  pre: [
    {
      color: '#2563eb',
      badge: 'Due: Week 0',
      title: 'Course Unit Guide and Lesson Plan',
      desc: 'All lecturers must submit the course unit guide and lesson plan for assigned courses to the Dean prior to commencement.',
      checklist: [
        'Course Info, Study period & credit allocation',
        'Coursework details, release date, criteria, and rubrics finalized',
        'Coursera component details',
        'Plagiarism & AI use requirements stated',
      ],
            buttons: [
        { icon: '📄', label: 'Download Template: Course Guide', href: '/templates/UNIMY-Lesson-Plan.docx' },
        { icon: '📽️', label: 'Download PPT Template (UNIMY)', href: '/templates/PPT-UNIMY-TEMPLATE.pdf' },
      ],
    },
    {
      color: '#f59e0b',
      badge: 'Due: Week 0',
      title: 'LMS Folder Setup (BAC Learn)',
      desc: 'All courses must follow the standard LMS folder setup prescribed by BAC Learn. Folders must be populated by Week 0.',
      checklist: [
        'Course Unit Guide (Downloadable) uploaded',
        'Lecture Slides / Notes (Downloadable) uploaded',
        'Practice Questions uploaded',
        "Coursework's Assignment uploaded",
        'Additional Resources uploaded',
        { text: 'Coursera Links active and verified', },
      ],
      alerts: [
        { type: 'red', title: 'AUDIT CHECK', text: 'The HOP will submit a status update on all courses to the Dean before classes start (prior to Week 1). The Dean will report to the Dean of Academic Affairs by Week 1. By Week 3, if the required upload has not been submitted, the Dean will issue a show-cause letter, followed by a warning letter from HR.' },
      ],
    },
  ],
  during: [
    {
      color: '#10b981',
      badge: 'Daily / Week 1 - 14',
      title: 'Class Delivery & Attendance',
      checklist: [
        'Brief students on Unit Guide during Week 1',
        { text: 'Record all classes via Panopto', },
        { text: 'Log student attendance for every scheduled session', },
      ],
      buttons: [
        { icon: '🎥', label: 'Open Panopto Guide', href: '/templates/Panopto-Guide.pdf', open: true },
      ],
      alerts: [
        { type: 'yellow', title: 'STRICT NO CANCELLATION POLICY', text: 'All classes must be conducted as scheduled. If you are on MC or EL, you MUST notify the Dean or HOP the night before or before the class begins so that a substitute lecturer or alternative learning activity can be arranged. The HOP or substitute lecturer must attend the class, inform the students, and record their attendance.' },
        { type: 'red', title: 'AUDIT CHECK', text: 'Conduct floor walk audits daily at random times. Any unnotified absences will be reported directly to DVC and CTO. Deans will issue show-cause letters for recurring or persistent cases of absenteeism, followed by a warning letter from HR.' },
      ],
    },
    {
      color: '#8b5cf6',
      badge: 'Due: Week 7',
      title: 'Final Examination Vetting and Submission',
      checklist: [
        { text: 'Prepare and submit the final examination documents, including:', sub: ['Question Papers (Set A and Set B)', 'Answer Schemes / Marking Rubrics', 'Table of Specifications (TOS)', 'Examination Vetting Forms', 'All documents must be submitted through Campus One within the stipulated deadline.'] },
        { text: 'Undergo the Vetting Process', sub: ['Ensure all examination papers are reviewed by the appointed vetter.', 'Address and incorporate all comments, corrections, and recommendations provided during the vetting process.'] },
        { text: 'Submit Final Corrected Version', sub: ['Upload the revised and approved examination papers and supporting documents to Campus One.', 'Ensure all required approvals are obtained before final submission.'] },
      ],
      alerts: [
        { type: 'red', title: 'AUDIT CHECK', text: 'Failure to submit complete examination documents or comply with the vetting requirements may result in delays to examination approval and administration. All outstanding examination submissions will be reported by the Examination Unit to the Dean of Academic Affairs (DOA), and the responsible staff may be required to provide a written explanation through a show-cause letter issued by the DOA.' },
      ],
    },
    {
      color: '#f59e0b',
      badge: 'Due: Week 12',
      title: 'Coursework Marks Release and Feedback',
      checklist: [
        'Mark, discuss, and provide Coursework feedback to students',
        'Lecturer to submit ALL Coursework marks in CampusOne / LMS GradeBook',
        'Dean / HOP to approve and release the Coursework marks in CampusOne',
        'Lecturer release Coursework marks to students via CampusOne / LMS Gradebook by Week 12',
      ],
      alerts: [
        { type: 'yellow', title: 'CLASS COMPLIANCE REQUIREMENT', text: "Week 1-14: All teaching and learning delivery, including revision classes, shall be completed within this period. All coursework assessments, class activities, and feedback loops must be finalized by the end of Week 14. Week 15: Study Week - reserved for students' examination preparation. Only academic consultations may be conducted. No classes, presentations, assessments, or other teaching and learning activities are permitted." },
        { type: 'red', title: 'AUDIT CHECK', text: 'The Dean will report to the Dean of Academic Affairs. If the coursework marks are not submitted by Week 13, the Dean will issue a show-cause letter, followed by a warning letter from HR.' },
      ],
    },
  ],
  post: [
    {
      color: '#ef4444',
      badge: 'Due: Week 17',
      title: 'Final Marks & School Meeting',
      checklist: [
        'Final Exams marking and moderation.',
        'School Meeting: Discuss student status, review updates to Table 4, and address any Teaching and Learning-related matters, issues, or updates',
      ],
    },
    {
      color: '#2563eb',
      badge: 'Due: Week 18',
      title: 'CQI & Digital Course File (DCF)',
      desc: 'Closing the academic loop is mandatory for MQA compliance.',
      checklist: [
        { text: 'Generate CLO / PLO attainment analysis', },
        { text: 'CQI (Continuous Quality Improvement) report',},
        { text: 'Compile and upload all artifacts to the Digital Course File (DCF)',},
      ],
      alerts: [
        { type: 'red', title: 'AUDIT CHECK', text: 'The Dean will report to the Dean of Academic Affairs by Week 18. If the coursework marks are not submitted by Week 18, the Dean will issue a show-cause letter, followed by a warning letter from HR.' },
      ],
    },
  ],
}

const SOP_ROWS = [
  { issue: 'Class Tardiness & Absences', sop: 'No class cancellation. MC/EL must be notified to Dean/HOP the night before to arrange replacement/activities.', audit: 'Daily floor walk @ 10am & 3pm. Absences reported to Mr. Thillai. HR to issue show-cause letter based on DVC report.', highlight: true },
  { issue: 'LMS Readiness (BAC Learn)', sop: 'Standard LMS folders (SUG, Slides, Practice, Coursera) must be fully populated by Wk 0.', audit: 'HOP pre-checks 2 weeks before class. Dean submits final status report to DVC on Wk 1.' },
  { issue: 'Coursework & Grading', sop: 'CW marks in CampusOne by Wk 12. Released to students by Wk 13. Failed CW gets redo + revision.', audit: 'HOP/Dean submits CW release status to DVC on Wk 12. Exams Dept (Mr Gobi) oversees protocols.' },
  { issue: 'Student Real-Time Feedback', sop: 'Classrooms equipped with reporting systems.', audit: 'Set up QR code in each class for real-time tracking of academic/non-academic issues.' },
]

function CheckItem({ item, onAction }) {
  const text = typeof item === 'string' ? item : item.text
  const sub = typeof item === 'string' ? null : item.sub
  const action = typeof item === 'string' ? null : item.action
  const href = typeof item === 'string' ? null : item.href

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>✓</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>{text}</span>
        {sub && (
          <ul style={{ margin: '6px 0 0 4px', paddingLeft: '16px' }}>
            {sub.map((s, k) => (
              <li key={k} style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '3px', listStyle: 'disc' }}>{s}</li>
            ))}
          </ul>
        )}
               {action && (
          href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '6px', color: '#2563eb', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
              🔗 {action}
            </a>
          ) : (
            <button onClick={() => onAction(action)} style={{ display: 'inline-block', marginTop: '6px', background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              🔗 {action}
            </button>
          )
        )}
      </div>
    </div>
  )
}

export default function OnboardingGuide() {
  const [tab, setTab] = useState('pre')
  const [toast, setToast] = useState(null)

  const notify = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const cards = CONTENT[tab] || []

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>📘 Lecturer Onboarding & QA Handbook</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Your semester roadmap - key deliverables, deadlines and audit policies.</p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', border: 'none', background: tab === t.id ? '#1e3a8a' : '#f3f4f6', color: tab === t.id ? '#fff' : '#374151' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'sops' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {cards.map((card, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', borderTop: '5px solid ' + card.color, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '24px' }}>
              <span style={{ display: 'inline-block', background: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '6px 12px', borderRadius: '6px', marginBottom: '14px' }}>{card.badge}</span>
              <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>{card.title}</h3>
              {card.desc && <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px', lineHeight: 1.6 }}>{card.desc}</p>}

              {card.checklist && card.checklist.map((item, j) => (
                <CheckItem key={j} item={item} onAction={(a) => notify('📎 ' + a + ' - will be provided by your faculty office')} />
              ))}

              {card.alerts && card.alerts.map((a, k) => (
                <div key={k} style={{ marginTop: '14px', padding: '14px 16px', borderRadius: '6px', background: a.type === 'red' ? '#fee2e2' : '#fef9c3', borderLeft: '4px solid ' + (a.type === 'red' ? '#dc2626' : '#f59e0b') }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: a.type === 'red' ? '#b91c1c' : '#b45309', letterSpacing: '0.5px', marginBottom: '6px' }}>{a.title}</div>
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>{a.text}</div>
                </div>
              ))}

                            {card.buttons && card.buttons.map((b, m) =>
                b.href ? (
                  <a
                    key={m}
                    href={b.href}
                    download={!b.open}
                    target={b.open ? '_blank' : undefined}
                    rel={b.open ? 'noopener noreferrer' : undefined}
                    style={{ display: 'block', width: '100%', marginTop: '10px', padding: '12px', background: '#eef2f7', border: '1px solid #dbe3ee', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#1e3a8a', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                  >
                    {b.icon} {b.label}
                  </a>
                ) : (
                  <button key={m} onClick={() => notify('📎 ' + b.label + ' - will be provided by your faculty office')} style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#eef2f7', border: '1px solid #dbe3ee', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#1e3a8a', cursor: 'pointer' }}>
                    {b.icon} {b.label}
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#f8fafc', borderRadius: '12px', borderTop: '5px solid #2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '24px' }}>
          <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>Executive Summary: Non-Compliance & Corrective Actions</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '18px' }}>Faculty must strictly adhere to the following directives to ensure institutional quality and operational efficiency.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#eef2f7' }}>
                  <th style={th}>Issue / Category</th>
                  <th style={th}>Mandatory SOP</th>
                  <th style={th}>Audit / Corrective Measure</th>
                </tr>
              </thead>
              <tbody>
                {SOP_ROWS.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ ...td, fontWeight: '700', color: '#0f172a' }}>{r.issue}</td>
                    <td style={td}>{r.sop}</td>
                    <td style={{ ...td, background: r.highlight ? '#fee2e2' : 'transparent' }}>{r.audit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', padding: '14px 24px', borderRadius: '10px', background: '#1e3a8a', color: '#fff', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 2000 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

const th = { padding: '12px', textAlign: 'left', fontWeight: '700', color: '#0f172a', fontSize: '13px' }
const td = { padding: '14px 12px', color: '#334155', lineHeight: 1.6, verticalAlign: 'top' }