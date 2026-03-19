import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Card, SectionLabel } from '../ui'
import { getStatsConfig } from '../../constants'

export function StatsChart({ campionamenti, color, categoria = 'health' }) {

  const config = getStatsConfig(categoria)

  const [selectedStat, setSelectedStat] = useState(config[0].stat)
  const [navIndex, setNavIndex] = useState(0)
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


  // Dati grafico
  const chartData = [...campionamenti].reverse().map((c, i) => {
    const value = c.stats?.[selectedStat]
    return {
      name:  c.date,
      value: value ?? 0,
      media: c.media ?? 0,
      index: i,
    }
  })

  const sorted       = [...campionamenti]
  const totalNav     = sorted.length
  const currentCamp  = sorted[navIndex]
  const prevCamp     = sorted[navIndex + 1]

  const stat = config.find(s => s.stat === selectedStat)



  return (
    <Card>
      <SectionLabel>📈 Andamento Statistiche</SectionLabel>

      {/* SELECTOR */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {config.map(s => (
          <button
            key={s.stat}
            onClick={() => setSelectedStat(s.stat)}
            className={`px-3 py-1 rounded-lg font-display text-[11px] border cursor-pointer transition-all
              ${selectedStat === s.stat
                ? 'text-white border-transparent'
                : 'text-white/30 border-white/10 hover:text-white/50 bg-transparent'}`}
            style={selectedStat === s.stat
              ? { background: color + '33', borderColor: color + '55', color }
              : {}}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* GRAFICO */}
      <div className="h-40 mb-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(v) => [v, stat?.label]} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* resto invariato */}
    </Card>
  )
}