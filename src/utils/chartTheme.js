// Tema condiviso per i grafici Recharts (griglia, tick, tooltip) — prima
// ogni grafico (XPTrendChart, BiaHistoryChart, StatsChart, GroupAnalysis)
// reimplementava gli stessi valori con piccole variazioni casuali (0.04 vs
// 0.05 vs 0.06 di opacità griglia, 0.28 vs 0.3 sui tick, ecc.).

export const CHART_GRID_STROKE = 'rgba(255,255,255,0.05)'

export const CHART_TICK_STYLE = { fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Inter' }

export function chartTooltipStyle(color) {
  return {
    contentStyle: {
      background:   'var(--rx-surface)',
      border:       '1px solid var(--rx-border)',
      borderRadius: 4,
      fontFamily:   'Inter',
      fontSize:     12,
    },
    labelStyle: { color: 'rgba(255,255,255,0.4)', fontWeight: 400 },
    itemStyle:  { color, fontWeight: 400 },
  }
}

// Cursore tooltip per LineChart — sostituisce la linea grigia di default di Recharts
export function lineCursor(color) {
  return { stroke: `color-mix(in srgb, ${color} 40%, transparent)`, strokeWidth: 1 }
}

// Cursore tooltip per BarChart (area piena dietro la barra attiva)
export const BAR_CURSOR = { fill: 'rgba(255,255,255,0.04)' }
