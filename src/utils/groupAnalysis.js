/**
 * Funzioni pure per Gruppi & Analytics Hub.
 * Estratte da GroupAnalysis.jsx e GroupComparison.jsx per essere testabili
 * in isolamento (nessuna dipendenza da React/Recharts/DOM).
 */
import { ALL_TESTS } from '../constants/index'

function labelForStat(key) {
  return ALL_TESTS.find(t => t.stat === key)?.label ?? key
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
export function heatColor(val) {
  if (val == null) return { bg: 'transparent', text: 'rgba(255,255,255,0.15)' }
  if (val >= 67)   return { bg: 'color-mix(in srgb, var(--rx-green) 15%, transparent)', text: 'var(--rx-green)' }
  if (val >= 34)   return { bg: 'rgba(250,204,21,0.12)',  text: '#facc15' }
  return               { bg: 'rgba(248,113,113,0.13)', text: '#f87171' }
}

export function buildHeatmap(clients) {
  const statKeys = new Set()
  clients.forEach(c => Object.keys(c.stats ?? {}).forEach(k => statKeys.add(k)))
  const statCols = Array.from(statKeys).map(key => ({ key, label: labelForStat(key) }))

  const sorted   = [...clients].sort((a, b) => a.name.localeCompare(b.name))
  const heatRows = sorted.map(c => ({ client: c, vals: statCols.map(col => c.stats?.[col.key] ?? null) }))

  const averageRow = statCols.map(col => {
    const vals = clients.map(c => c.stats?.[col.key]).filter(v => v != null)
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null
  })

  return { statCols, heatRows, averageRow }
}

// ── Riepilogo gruppo ────────────────────────────────────────────────────────────
export function buildGroupSummary(clients) {
  const withLevel = clients.filter(c => c.level != null)
  const avgLevel  = withLevel.length
    ? Math.round(withLevel.reduce((s, c) => s + c.level, 0) / withLevel.length)
    : null

  const rankCount = {}
  clients.forEach(c => { if (c.rank) rankCount[c.rank] = (rankCount[c.rank] ?? 0) + 1 })
  const topRankLabel = Object.entries(rankCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const statSums   = {}
  const statCounts = {}
  clients.forEach(c => Object.entries(c.stats ?? {}).forEach(([k, v]) => {
    statSums[k]   = (statSums[k]   ?? 0) + v
    statCounts[k] = (statCounts[k] ?? 0) + 1
  }))
  const statMeans = Object.entries(statSums).map(([k, sum]) => ({
    key: k, label: labelForStat(k), mean: sum / statCounts[k],
  }))

  const best  = statMeans.reduce((top, s) => s.mean > (top?.mean ?? -Infinity) ? s : top, null)
  const worst = statMeans.reduce((bot, s) => s.mean < (bot?.mean ??  Infinity) ? s : bot, null)

  return { avgLevel, topRankLabel, best, worst }
}

// ── Trend nel tempo ──────────────────────────────────────────────────────────────
export function buildTrendStatOptions(clients) {
  const keys = new Set()
  clients.forEach(c =>
    c.campionamenti?.forEach(camp =>
      Object.keys(camp.stats ?? {}).forEach(k => keys.add(k))
    )
  )
  return [
    { key: 'media', label: 'Media' },
    ...Array.from(keys).map(key => ({ key, label: labelForStat(key) })),
  ]
}

export function buildTrendChartData(clients, selected) {
  const dateMap = new Map()
  clients.forEach(c => {
    c.campionamenti?.forEach(camp => {
      if (!camp.date) return
      const val = selected === 'media' ? camp.media : camp.stats?.[selected]
      if (val == null) return
      const entry = dateMap.get(camp.date) ?? []
      entry.push(val)
      dateMap.set(camp.date, entry)
    })
  })
  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date:   date.slice(5).replace('-', '/'),
      valore: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
      n:      vals.length,
    }))
}

// ── Confronto atleti ─────────────────────────────────────────────────────────────
export function pickDefaultComparisonClients(clients, max = 2) {
  return [...clients]
    .filter(c => c.media != null)
    .sort((a, b) => b.media - a.media)
    .slice(0, max)
    .map(c => c.id)
}

export function buildComparisonStatCols(selectedClients) {
  const keys = new Set()
  selectedClients.forEach(c => Object.keys(c.stats ?? {}).forEach(k => keys.add(k)))
  return Array.from(keys).map(key => ({ key, label: labelForStat(key) }))
}

export function isMaxValue(clients, key, clientId) {
  const client = clients.find(c => c.id === clientId)
  const val    = client?.stats?.[key]
  if (val == null) return false
  return clients.every(o => o.id === clientId || (o.stats?.[key] ?? -1) <= val)
}

// ── Radar multi-overlay (geometria pura) ──────────────────────────────────────────
export function computeRadarAngles(n) {
  return Array.from({ length: n }, (_, i) => (Math.PI * 2 * i) / n - Math.PI / 2)
}

export function computeRadarOuterPoints(cx, cy, R, angles) {
  return angles.map(a => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }))
}

/**
 * Punti del poligono radar per un singolo atleta.
 * I valori vengono clampati a [0, 100] prima di essere proiettati sul raggio.
 */
export function buildRadarPolygon(cx, cy, R, angles, statKeys, stats) {
  return statKeys.map((key, i) => {
    const val = Math.min(100, Math.max(0, stats?.[key] ?? 0))
    return { x: cx + (val / 100) * R * Math.cos(angles[i]), y: cy + (val / 100) * R * Math.sin(angles[i]) }
  })
}
