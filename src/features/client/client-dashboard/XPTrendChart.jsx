import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { EmptyState, SegmentedToggle } from '../../../components/ui'
import { CHART_GRID_STROKE, CHART_TICK_STYLE, chartTooltipStyle, BAR_CURSOR } from '../../../utils/chartTheme'

const BUCKETS = [
  { id: 'giorno',    label: 'Giorno' },
  { id: 'settimana', label: 'Settimana' },
  { id: 'mese',      label: 'Mese' },
]

const ICON_TREND = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

function getMondayKey(ts) {
  const d = new Date(ts)
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function toItLabel(isoDate) {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}

function toMonthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
}

export function XPTrendChart({ log = [], color }) {
  const [bucket, setBucket] = useState('settimana')

  const hasTimestamped = log.some(e => e.ts)

  const chartData = useMemo(() => {
    const entries = log.filter(e => e.ts && e.xp > 0)
    if (entries.length === 0) return []

    const map = new Map()
    for (const entry of entries) {
      let key, label
      if (bucket === 'giorno') {
        key   = new Date(entry.ts).toISOString().slice(0, 10)
        label = toItLabel(key)
      } else if (bucket === 'settimana') {
        key   = getMondayKey(entry.ts)
        label = toItLabel(key)
      } else {
        key   = new Date(entry.ts).toISOString().slice(0, 7)
        label = toMonthLabel(key)
      }
      if (!map.has(key)) map.set(key, { key, label, xp: 0 })
      map.get(key).xp += entry.xp
    }

    return [...map.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-30)
  }, [log, bucket])

  return (
    <div className="rounded-[4px] p-5 rx-card">
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-[10px] tracking-[3px] uppercase" style={{ color }}>
          ◈ Andamento XP
        </div>
        <div className="flex gap-1">
          {BUCKETS.map(b => (
            <SegmentedToggle
              key={b.id}
              active={bucket === b.id}
              onClick={() => setBucket(b.id)}
              color={color}
              className="px-2.5 py-1 rounded-[3px] text-[10px]"
            >
              {b.label}
            </SegmentedToggle>
          ))}
        </div>
      </div>

      {!hasTimestamped || chartData.length === 0 ? (
        <EmptyState
          color={color}
          icon={ICON_TREND}
          title={!hasTimestamped ? 'In arrivo' : 'Nessun dato'}
          description={!hasTimestamped
            ? 'Il grafico si riempirà con le prossime attività.'
            : 'Nessun dato per il periodo selezionato.'}
        />
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 5, right: 5, bottom: 0, left: -20 }} accessibilityLayer>
              <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="label"
                tick={CHART_TICK_STYLE}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={CHART_TICK_STYLE}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={BAR_CURSOR}
                formatter={(v) => [`+${v}`, 'XP']}
                {...chartTooltipStyle(color)}
              />
              <Bar dataKey="xp" fill={color} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
