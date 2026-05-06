const STEPS_LOW    = 4000
const STEPS_MEDIUM = 8000

export function getActivityLevel(stepsAvg7d) {
  if (stepsAvg7d == null) return null
  if (stepsAvg7d >= STEPS_MEDIUM) return { state: 'high',   color: '#1aff6e', label: 'Molto attivo' }
  if (stepsAvg7d >= STEPS_LOW)    return { state: 'medium', color: '#facc15', label: 'Attivo' }
  return                                 { state: 'low',    color: '#f87171', label: 'Sedentario' }
}

export function formatSteps(n) {
  if (n == null) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export function formatDistance(meters) {
  if (meters == null) return '—'
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`
}

export function formatCalories(kcal) {
  if (kcal == null) return '—'
  return kcal >= 1000 ? `${(kcal / 1000).toFixed(1)}k` : String(Math.round(kcal))
}

export function formatSleep(hours) {
  if (hours == null || hours === 0) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatSyncTime(timestamp) {
  if (!timestamp) return null
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const diff  = Date.now() - date.getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'ora'
  if (mins < 60)  return `${mins} min fa`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h fa`
  return `${Math.floor(hrs / 24)}g fa`
}
