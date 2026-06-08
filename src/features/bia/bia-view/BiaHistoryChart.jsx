import { useState }                                    from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip,
         ResponsiveContainer, CartesianGrid }          from 'recharts'
import { SectionLabel }                                from '../../../components/ui'
import { BIA_PARAMS }                                  from '../../../constants/bia'

/**
 * Grafico andamento storico BIA.
 */
export function BiaHistoryChart({ biaHistory, color }) {
  const displayParams  = BIA_PARAMS.filter(p => !p.computed)
  const [selectedParam, setSelectedParam] = useState(displayParams[0].key)

  if (!biaHistory || biaHistory.length < 2) {
    return (
      <div
        className="rounded-[4px] p-5 rx-card"
      >
        <SectionLabel>◈ Andamento BIA</SectionLabel>
        <p className="text-white/20 font-body text-[13px] text-center py-4">
          Servono almeno 2 misurazioni per visualizzare l'andamento.
        </p>
      </div>
    )
  }

  const param     = displayParams.find(p => p.key === selectedParam)
  const chartData = [...biaHistory].reverse().map(b => ({
    name:  b.date,
    value: b[selectedParam] ?? 0,
  }))

  return (
    <div
      className="rounded-[4px] p-5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <SectionLabel>◈ Andamento BIA</SectionLabel>

      {/* Selector parametro */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {displayParams.map(p => (
          <button
            key={p.key}
            onClick={() => setSelectedParam(p.key)}
            className="px-3 py-1 rounded-[3px] font-display text-[11px] border cursor-pointer transition-all"
            style={selectedParam === p.key
              ? { background: color + '33', borderColor: color + '55', color }
              : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
            }
          >
            {p.label}
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
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [`${v} ${param?.unit ?? ''}`, param?.label]}
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
    </div>
  )
}
