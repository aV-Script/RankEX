import { describe, it, expect } from 'vitest'
import {
  heatColor, buildHeatmap, buildGroupSummary,
  buildTrendStatOptions, buildTrendChartData,
  pickDefaultComparisonClients, buildComparisonStatCols, isMaxValue,
  computeRadarAngles, computeRadarOuterPoints, buildRadarPolygon,
} from '../../utils/groupAnalysis'

const clients = [
  {
    id: 'a', name: 'Anna Bianchi', level: 10, rank: 'Oro',
    media: 72,
    stats: { velocita: 80, resistenza: 60 },
    campionamenti: [
      { date: '2026-01-01', media: 70, stats: { velocita: 75, resistenza: 55 } },
      { date: '2026-02-01', media: 74, stats: { velocita: 80, resistenza: 60 } },
    ],
  },
  {
    id: 'b', name: 'Bruno Verdi', level: 20, rank: 'Oro',
    media: 90,
    stats: { velocita: 40, resistenza: 20 },
    campionamenti: [
      { date: '2026-01-01', media: 50, stats: { velocita: 35, resistenza: 15 } },
      { date: '2026-02-01', media: 55, stats: { velocita: 40, resistenza: 20 } },
    ],
  },
  {
    id: 'c', name: 'Carla Neri', level: null, rank: 'Argento',
    media: null,
    stats: {},
    campionamenti: [],
  },
]

describe('heatColor', () => {
  it('restituisce il colore neutro per valori nulli', () => {
    expect(heatColor(null).text).toBe('rgba(255,255,255,0.15)')
  })
  it('classifica >=67 come verde (fascia alta)', () => {
    expect(heatColor(67).text).toBe('var(--rx-green)')
    expect(heatColor(100).text).toBe('var(--rx-green)')
  })
  it('classifica 34-66 come giallo (fascia media)', () => {
    expect(heatColor(34).text).toBe('#facc15')
    expect(heatColor(66).text).toBe('#facc15')
  })
  it('classifica <34 come rosso (fascia bassa)', () => {
    expect(heatColor(0).text).toBe('#f87171')
    expect(heatColor(33).text).toBe('#f87171')
  })
})

describe('buildHeatmap', () => {
  it('ordina le righe per nome cliente', () => {
    const { heatRows } = buildHeatmap(clients)
    expect(heatRows.map(r => r.client.id)).toEqual(['a', 'b', 'c'])
  })
  it('include tutte le colonne stat viste in almeno un cliente', () => {
    const { statCols } = buildHeatmap(clients)
    expect(statCols.map(c => c.key).sort()).toEqual(['resistenza', 'velocita'])
  })
  it('usa null per i clienti senza quella stat', () => {
    const { heatRows, statCols } = buildHeatmap(clients)
    const carla = heatRows.find(r => r.client.id === 'c')
    expect(carla.vals).toEqual(statCols.map(() => null))
  })
  it('calcola la media di colonna ignorando i null', () => {
    const { averageRow, statCols } = buildHeatmap(clients)
    const velocitaIdx = statCols.findIndex(c => c.key === 'velocita')
    // (80 + 40) / 2 = 60 — Carla non ha la stat, non deve influenzare la media
    expect(averageRow[velocitaIdx]).toBe(60)
  })
  it('con lista vuota restituisce colonne e righe vuote', () => {
    expect(buildHeatmap([])).toEqual({ statCols: [], heatRows: [], averageRow: [] })
  })
})

describe('buildGroupSummary', () => {
  it('calcola il livello medio ignorando i clienti senza livello', () => {
    // (10 + 20) / 2 = 15 — Carla (level: null) esclusa
    expect(buildGroupSummary(clients).avgLevel).toBe(15)
  })
  it('trova il rank più frequente', () => {
    expect(buildGroupSummary(clients).topRankLabel).toBe('Oro')
  })
  it('individua la stat con media più alta e più bassa', () => {
    const { best, worst } = buildGroupSummary(clients)
    expect(best.key).toBe('velocita')   // (80+40)/2 = 60
    expect(worst.key).toBe('resistenza') // (60+20)/2 = 40
  })
  it('con lista vuota non esplode e restituisce valori null', () => {
    expect(buildGroupSummary([])).toEqual({ avgLevel: null, topRankLabel: null, best: null, worst: null })
  })
})

describe('buildTrendStatOptions', () => {
  it('include sempre "media" come prima opzione', () => {
    const opts = buildTrendStatOptions(clients)
    expect(opts[0].key).toBe('media')
  })
  it('deduplica le stat viste nei campionamenti di più clienti', () => {
    const opts = buildTrendStatOptions(clients)
    const keys = opts.map(o => o.key)
    expect(keys.filter(k => k === 'velocita')).toHaveLength(1)
  })
})

describe('buildTrendChartData', () => {
  it('aggrega per data e calcola la media tra i clienti', () => {
    const data = buildTrendChartData(clients, 'media')
    // 2026-01-01: (70+50)/2 = 60 · 2026-02-01: (74+55)/2 = 64.5 -> 65 (round)
    expect(data).toEqual([
      { date: '01/01', valore: 60, n: 2 },
      { date: '02/01', valore: 65, n: 2 },
    ])
  })
  it('è ordinato cronologicamente', () => {
    const data = buildTrendChartData(clients, 'media')
    const dates = data.map(d => d.date)
    expect(dates).toEqual([...dates].sort())
  })
  it('con una stat specifica legge da camp.stats invece che da camp.media', () => {
    const data = buildTrendChartData(clients, 'velocita')
    // 2026-01-01: (75+35)/2 = 55
    expect(data[0].valore).toBe(55)
  })
  it('ignora campionamenti senza la stat richiesta', () => {
    const data = buildTrendChartData(clients, 'inesistente')
    expect(data).toEqual([])
  })
})

describe('pickDefaultComparisonClients', () => {
  it('sceglie i clienti con media più alta, esclude chi non ha media', () => {
    // Bruno (90) > Anna (72); Carla (null) esclusa
    expect(pickDefaultComparisonClients(clients, 2)).toEqual(['b', 'a'])
  })
  it('rispetta il limite massimo', () => {
    expect(pickDefaultComparisonClients(clients, 1)).toEqual(['b'])
  })
})

describe('buildComparisonStatCols', () => {
  it('unisce le stat viste tra i clienti selezionati', () => {
    const cols = buildComparisonStatCols(clients.slice(0, 2))
    expect(cols.map(c => c.key).sort()).toEqual(['resistenza', 'velocita'])
  })
})

describe('isMaxValue', () => {
  it('è true solo per il cliente con il valore più alto sulla stat', () => {
    expect(isMaxValue(clients, 'velocita', 'a')).toBe(true)  // 80 > 40
    expect(isMaxValue(clients, 'velocita', 'b')).toBe(false)
  })
  it('è false quando il cliente non ha quella stat', () => {
    expect(isMaxValue(clients, 'velocita', 'c')).toBe(false)
  })
})

describe('geometria radar', () => {
  it('computeRadarAngles distribuisce n angoli equidistanti a partire da -90°', () => {
    const angles = computeRadarAngles(4)
    expect(angles).toHaveLength(4)
    expect(angles[0]).toBeCloseTo(-Math.PI / 2)
    expect(angles[2]).toBeCloseTo(Math.PI / 2)
  })

  it('computeRadarOuterPoints proietta i punti sul cerchio di raggio R', () => {
    const angles = computeRadarAngles(4)
    const points = computeRadarOuterPoints(50, 50, 40, angles)
    points.forEach(p => {
      const dist = Math.hypot(p.x - 50, p.y - 50)
      expect(dist).toBeCloseTo(40)
    })
  })

  it('buildRadarPolygon proietta un valore 100 sul punto esterno del raggio', () => {
    const angles = computeRadarAngles(2)
    const pts = buildRadarPolygon(50, 50, 40, angles, ['a', 'b'], { a: 100, b: 0 })
    expect(Math.hypot(pts[0].x - 50, pts[0].y - 50)).toBeCloseTo(40)
    expect(pts[1]).toEqual({ x: 50, y: 50 }) // valore 0 -> centro
  })

  it('buildRadarPolygon clampa i valori fuori [0, 100]', () => {
    const angles = computeRadarAngles(2)
    const clamped = buildRadarPolygon(50, 50, 40, angles, ['a', 'b'], { a: 150, b: -20 })
    const full    = buildRadarPolygon(50, 50, 40, angles, ['a', 'b'], { a: 100, b: 0 })
    expect(clamped).toEqual(full)
  })

  it('buildRadarPolygon tratta le stat mancanti come 0', () => {
    const angles = computeRadarAngles(1)
    const pts = buildRadarPolygon(50, 50, 40, angles, ['mancante'], {})
    expect(pts[0]).toEqual({ x: 50, y: 50 })
  })
})
