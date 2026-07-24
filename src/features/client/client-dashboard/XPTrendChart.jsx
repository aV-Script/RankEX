import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

const BUCKETS = [
  { id: 'giorno',    label: 'Giorno' },
  { id: 'settimana', label: 'Settimana' },
  { id: 'mese',      label: 'Mese' },
]

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
            <button
              key={b.id}
              onClick={() => setBucket(b.id)}
              className="px-2.5 py-1 rounded-[3px] font-display text-[10px] border cursor-pointer transition-all"
              style={bucket === b.id
                ? { background: color + '33', borderColor: color + '55', color }
                : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
              }
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {!hasTimestamped || chartData.length === 0 ? (
        <p className="text-white/20 font-body text-[13px] text-center py-6">
          {!hasTimestamped
            ? 'Il grafico si riempirà con le prossime attività.'
            : 'Nessun dato per il periodo selezionato.'}
        </p>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Inter' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Inter' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(v) => [`+${v}`, 'XP']}
                contentStyle={{
                  background:   'var(--rx-surface)',
                  border:       '1px solid var(--rx-border)',
                  borderRadius: 4,
                  fontFamily:   'Inter',
                  fontSize:     12,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}
                itemStyle={{ color, fontWeight: 400 }}
              />
              <Bar dataKey="xp" fill={color} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
