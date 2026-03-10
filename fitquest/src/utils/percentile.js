import { TABLES, STAT_DIRECTION, getAgeGroup } from './tables'

/**
 * Calcola il punteggio (0-100) per una statistica dato il valore del test.
 *
 * Logica:
 * - Le tabelle mappano: percentile → valore di test
 * - "direct"  (forza, mobilità):    valore alto = score alto
 * - "inverse" (resistenza, equilibrio, esplosività): valore basso = score alto
 *
 * Per le stat inverse la tabella ha già i percentili corretti
 * (es. 95° percentile = valore basso di bpm perché è il migliore).
 * Quindi usiamo direttamente il percentile come score — non serve invertire nulla.
 * Dobbiamo solo interpolare nel verso giusto.
 */
export function calcPercentile(stat, value, sesso, age) {
  const direction = STAT_DIRECTION[stat]
  const ageGroup  = getAgeGroup(stat, age)
  const table     = TABLES[stat]?.[sesso]?.[ageGroup]

  if (!table) return 0

  // Array di punti { val, pct } ordinato per val crescente
  const points = Object.entries(table)
    .map(([pct, val]) => ({ pct: Number(pct), val: Number(val) }))
    .sort((a, b) => a.val - b.val)

  // Per stat DIRETTE: val crescente = pct crescente
  // Es. forza: 34kg=5°pct, 64kg=95°pct → score = pct direttamente

  // Per stat INVERSE: val crescente = pct decrescente
  // Es. resistenza: 81bpm=95°pct, 136bpm=5°pct
  // Quando val è basso (buono) vogliamo score alto.
  // I punti ordinati per val crescente hanno pct decrescente → score = pct direttamente

  // In entrambi i casi usiamo il percentile come score, l'interpolazione
  // lavora sulle coppie (val, pct) già corrette dalla tabella.

  // Fuori range: valore migliore del 95° → 100
  if (direction === 'direct'  && value >= points[points.length - 1].val) return 100
  if (direction === 'inverse' && value <= points[0].val)                  return 100

  // Fuori range: valore peggiore del 5° → 0
  if (direction === 'direct'  && value <= points[0].val)                  return 0
  if (direction === 'inverse' && value >= points[points.length - 1].val)  return 0

  // Interpolazione lineare tra i due punti adiacenti che contengono il valore
  for (let i = 0; i < points.length - 1; i++) {
    const lo = points[i]
    const hi = points[i + 1]

    if (value >= lo.val && value <= hi.val) {
      const ratio = (value - lo.val) / (hi.val - lo.val)
      // Per direct:  pct cresce con val → interpoliamo in avanti
      // Per inverse: pct decresce con val → interpoliamo in avanti ma risultato scende
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
    equilibrio:  calcPercentile('equilibrio',  Number(testResults.equilibrio),  sesso, age),
    resistenza:  calcPercentile('resistenza',  Number(testResults.resistenza),  sesso, age),
    mobilita:    calcPercentile('mobilita',    Number(testResults.mobilita),    sesso, age),
    esplosivita: calcPercentile('esplosivita', Number(testResults.esplosivita), sesso, age),
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
