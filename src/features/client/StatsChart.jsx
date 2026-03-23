import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Card, SectionLabel } from '../../components/ui'
import { getStatsConfig }     from '../../constants'

export function StatsChart({ campionamenti, color, categoria = 'health' }) {
  const config = getStatsConfig(categoria)

  // ── Hook prima di qualsiasi return condizionale ───────────────────────────
  const [selectedStat, setSelectedStat] = useState(config[0]?.stat ?? '')

  // ── Guard — almeno 2 campionamenti ────────────────────────────────────────
  if (!campionamenti || campionamenti.length < 2) {
    return (
      <Card>
        <SectionLabel>📈 Andamento</SectionLabel>
        <p className="text-white/20 font-body text-[13px] text-center py-4">
          Servono almeno 2 campionamenti per visualizzare l'andamento.
        </p>
      </Card>
    )
  }

  const stat      = config.find(s => s.stat === selectedStat)
  const chartData = [...campionamenti].reverse().map(c => ({
    name:  c.date,
    value: c.stats?.[selectedStat] ?? 0,
    media: c.media ?? 0,
  }))

  return (
    <Card>
      <SectionLabel>📈 Andamento Statistiche</SectionLabel>

      {/* Selector stat */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {config.map(s => (
          <button
            key={s.stat}
            onClick={() => setSelectedStat(s.stat)}
            className="px-3 py-1 rounded-lg font-display text-[11px] border cursor-pointer transition-all"
            style={selectedStat === s.stat
              ? { background: color + '33', borderColor: color + '55', color }
              : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Grafico */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Rajdhani' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Rajdhani' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [v, stat?.label]}
              contentStyle={{
                background: 'rgba(10,22,40,0.97)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontFamily: 'Rajdhani',
                fontSize: 12,
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
              itemStyle={{ color }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 3 }}
              activeDot={{ fill: color, r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}