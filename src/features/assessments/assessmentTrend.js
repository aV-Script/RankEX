// Adattatori del grafico di andamento (ADR-019): dalla serie di
// utils/lipedema.js → buildTrendSeries alle righe di Recharts e al testo
// alternativo. Pure, senza React.
import { countLabel, BILATERAL_TESTS, TREND_KIND } from '../../utils/lipedema'
import { SIDE_LABELS } from '../../config/lipedemaTests.config'
import { formatDate, formatShortDate, getSameDayDates } from './assessmentFormat'

export function getLineKey(side, segment) {
  return `${side}:${segment}`
}

export function getApartKey(side) {
  return `${side}:apart`
}

/**
 * Una riga per valutazione (x = indice: due valutazioni dello stesso giorno restano
 * distinte), con una chiave per tratto `${lato}:${tratto}` e `${lato}:apart` per le
 * interrotte/invalidate. `points` conserva il punto di ogni chiave per tooltip e marcatori.
 * @param {object} series — buildTrendSeries
 * @returns {{ rows: object[], lines: Array<{ key, side, segment }>, aparts: Array<{ key, side }> }}
 */
export function toTrendChartRows(series) {
  const rows    = []
  const rowById = new Map()
  const lines   = []
  const aparts  = []
  // Giorni con più valutazioni: l'etichetta dell'asse mostra anche l'ora
  const sameDayDates = getSameDayDates(
    [...new Map(series.points.map(point => [point.assessmentId, point.performedAt])).values()],
  )

  for (const point of series.points) {
    let row = rowById.get(point.assessmentId)
    if (!row) {
      row = { x: rows.length, label: formatShortDate(point.performedAt, sameDayDates), performedAt: point.performedAt, points: {} }
      rowById.set(point.assessmentId, row)
      rows.push(row)
    }
    const isApart = point.kind === TREND_KIND.APART
    const key     = isApart ? getApartKey(point.side) : getLineKey(point.side, point.segment)
    row[key]        = point.value
    row.points[key] = point
    if (isApart) {
      if (!aparts.some(item => item.key === key)) aparts.push({ key, side: point.side })
    } else if (!lines.some(item => item.key === key)) {
      lines.push({ key, side: point.side, segment: point.segment })
    }
  }
  return { rows, lines, aparts }
}

/**
 * Alternativa testuale del grafico (aria-label), ADR-019 §5. Il numero di
 * valutazioni è quello dei punti per i monolaterali; per i bilaterali si
 * descrive ogni lato.
 * @param {object} series — buildTrendSeries
 * @param {{ id: string, name: string, unitLabel: string }} test — voce di LIPEDEMA_TESTS
 */
export function describeTrend(series, test) {
  const { points, sides, segmentCountBySide, apartCount } = series
  const bilateral = BILATERAL_TESTS[test.id]
  if (!bilateral) {
    const dates    = points.map(point => point.performedAt)
    const segments = segmentCountBySide[sides[0]] ?? 0
    const parts = [
      `${countLabel(points.length, 'valutazione', 'valutazioni')} dal ${formatDate(dates[0])} al ${formatDate(dates[dates.length - 1])}`,
      countLabel(segments, 'tratto confrontabile', 'tratti confrontabili'),
    ]
    if (apartCount > 0) {
      parts.push(`fuori dalla linea ${countLabel(apartCount, 'valutazione interrotta o invalidata', 'valutazioni interrotte o invalidate')}`)
    }
    return `Andamento ${test.name} in ${test.unitLabel}: ${parts.join(', ')}.`
  }

  const perSide = sides.map(side => {
    const values = points.filter(point => point.side === side).length
    return `${SIDE_LABELS[side].label} ${countLabel(values, 'valore', 'valori')} in ${countLabel(segmentCountBySide[side] ?? 0, 'tratto', 'tratti')}`
  })
  const ceilings = points.filter(point => point.ceiling).length
  const ceilingText = ceilings > 0 ? `, ${countLabel(ceilings, 'tetto', 'tetti')} a ${bilateral.spec.ceiling} s` : ''
  return `Andamento ${test.name} in ${test.unitLabel}, una serie per lato: ${perSide.join(', ')}${ceilingText}.`
}
