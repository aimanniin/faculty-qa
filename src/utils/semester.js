// Returns the active semester for a given date
// Feb : mid-Feb (15)  -> mid-May (14)
// May : mid-May (15)  -> mid-Sep (14)
// Sep : mid-Sep (15)  -> mid-Feb (14)  (wraps across year end)
export function getCurrentSemester(date = new Date()) {
  const m = date.getMonth() + 1 // 1-12
  const d = date.getDate()
  const md = m * 100 + d        // e.g. Feb 15 = 215

  if (md >= 215 && md < 515) return 'Feb'   // Feb 15 - May 14
  if (md >= 515 && md < 915) return 'May'   // May 15 - Sep 14
  return 'Sep'                              // Sep 15 - Feb 14
}