import { TABLES, STAT_DIRECTION, getAgeGroup } from './tables'

/**
 * Calcola il punteggio (0-100) per una statistica dato il valore del test.
 *
 * Le tabelle ora includono i punti di ancoraggio per percentile 0 e 100
 * (calcolati per estrapolazione lineare dagli estremi 5-10 e 90-95).
 * L'interpolazione lineare copre quindi l'intero range senza salti.
 *
 * - "direct"  (forza, mobilità):                 valore alto = score alto
 * - "inverse" (resistenza, equilibrio, espl.):   valore basso = score alto
 */
export function calcPercentile(stat, value, sesso, age) {
  const direction = STAT_DIRECTION[stat]
  const ageGroup  = getAgeGroup(stat, age)
  const table     = TABLES[stat]?.[sesso]?.[ageGroup]

  if (!table) return 0

  // Costruisce array { val, pct } ordinato per valore crescente
  const points = Object.entries(table)
    .map(([pct, val]) => ({ pct: Number(pct), val: Number(val) }))
    .sort((a, b) => a.val - b.val)

  const first = points[0]
  const last  = points[points.length - 1]

  // Fuori range superiore
  if (direction === 'direct'  && value >= last.val)  return 100
  if (direction === 'inverse' && value <= first.val) return 100

  // Fuori range inferiore
  if (direction === 'direct'  && value <= first.val) return 0
  if (direction === 'inverse' && value >= last.val)  return 0

  // Interpolazione lineare tra i due punti adiacenti
  for (let i = 0; i < points.length - 1; i++) {
    const lo = points[i]
    const hi = points[i + 1]

    if (value >= lo.val && value <= hi.val) {
      const ratio = (value - lo.val) / (hi.val - lo.val)
      const score = lo.pct + ratio * (hi.pct - lo.pct)
      return Math.min(100, Math.max(0, Math.round(score)))
    }
  }

  return 0
}

/**
 * Calcola tutte e 5 le statistiche.
 */
export function calcAllStats(testResults, sesso, age) {
  return {
    forza:       calcPercentile('forza',       Number(testResults.forza),       sesso, age),
    mobilita:    calcPercentile('mobilita',    Number(testResults.mobilita),    sesso, age),
    equilibrio:  calcPercentile('equilibrio',  Number(testResults.equilibrio),  sesso, age),
    esplosivita: calcPercentile('esplosivita', Number(testResults.esplosivita), sesso, age),
    resistenza:  calcPercentile('resistenza',  Number(testResults.resistenza),  sesso, age),
  }
}

/**
 * Calcola la media delle 5 statistiche.
 */
export function calcStatMedia(stats) {
  const vals = Object.values(stats).filter(v => typeof v === 'number')
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}
