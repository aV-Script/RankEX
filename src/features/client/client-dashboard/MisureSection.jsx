import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

function MisureLineChart({ data = [], dataKey, label, unit, color }) {
  const sorted = [...data]
    .filter(r => r[dataKey] !== undefined)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (sorted.length < 2) {
    return (
      <div
        className="rounded-[4px] p-4 mt-4 rx-card"
      >
        <div className="font-display text-[10px] tracking-[3px] uppercase mb-2" style={{ color: 'var(--rx-green)' }}>
          ◈ {label}
        </div>
        <p className="text-white/20 font-body text-[13px] text-center py-3">
          Servono almeno 2 misurazioni per visualizzare l'andamento.
        </p>
      </div>
    )
  }

  const chartData = sorted.map(r => ({
    name:  new Date(r.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
    value: r[dataKey],
  }))

  return (
    <div
      className="rounded-[4px] p-4 mt-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="font-display text-[10px] tracking-[3px] uppercase mb-3" style={{ color: 'var(--rx-green)' }}>
        ◈ {label}
      </div>
      <div className="h-36">
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
              formatter={(v) => [`${v} ${unit}`, label]}
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

export function MisureSection({ client, color, isSoccer, readonly, onUpdate }) {
  const [peso,   setPeso]   = useState(client.peso    ?? '')
  const [altezza, setAltezza] = useState(client.altezza ?? '')
  const [saving, setSaving] = useState(false)

  const misureHistory = client.misureHistory ?? []

  const handleSave = async () => {
    const p = parseFloat(peso)
    const a = parseFloat(altezza)
    const patch = {}
    if (!isNaN(p) && p > 0)              patch.peso    = p
    if (!isNaN(a) && a > 0 && isSoccer) patch.altezza = a
    if (Object.keys(patch).length === 0) return

    setSaving(true)
    try {
      await onUpdate(client, patch)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="px-4 pt-6">
      <div className="rounded-[4px] p-5 rx-card">
        <div className="font-display text-[10px] tracking-[3px] uppercase mb-4" style={{ color: 'var(--rx-green)' }}>
          ◈ Misure
        </div>

        {/* Valori correnti */}
        <div className="flex gap-6 mb-4">
          <div>
            <div className="font-display text-[9px] text-white/25 tracking-[2px] mb-0.5">PESO</div>
            <div className="font-display font-bold text-[22px]" style={{ color }}>
              {client.peso ?? '—'}
              <span className="text-[12px] text-white/30 ml-1">kg</span>
            </div>
          </div>
          {isSoccer && (
            <div>
              <div className="font-display text-[9px] text-white/25 tracking-[2px] mb-0.5">ALTEZZA</div>
              <div className="font-display font-bold text-[22px]" style={{ color }}>
                {client.altezza ?? '—'}
                <span className="text-[12px] text-white/30 ml-1">cm</span>
              </div>
            </div>
          )}
        </div>

        {/* Form aggiornamento — solo trainer, non readonly */}
        {!readonly && (
          <div className="flex gap-3 items-end pt-2 pb-1">
            <div className="flex flex-col gap-1">
              <label className="font-display text-[9px] text-white/30 tracking-[1.5px]">PESO (kg)</label>
              <input
                type="number"
                value={peso}
                onChange={e => setPeso(e.target.value)}
                className="input-base w-24"
                step="0.1"
                min="0"
              />
            </div>
            {isSoccer && (
              <div className="flex flex-col gap-1">
                <label className="font-display text-[9px] text-white/30 tracking-[1.5px]">ALTEZZA (cm)</label>
                <input
                  type="number"
                  value={altezza}
                  onChange={e => setAltezza(e.target.value)}
                  className="input-base w-24"
                  step="0.5"
                  min="0"
                />
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rx-btn-primary font-display text-[10px] tracking-[1.5px] px-4 py-2 rounded-[3px] cursor-pointer disabled:opacity-50"
            >
              {saving ? '…' : 'AGGIORNA'}
            </button>
          </div>
        )}

        {/* Charts */}
        <MisureLineChart
          data={misureHistory}
          dataKey="peso"
          label="Andamento peso"
          unit="kg"
          color={color}
        />
        {isSoccer && (
          <MisureLineChart
            data={misureHistory}
            dataKey="altezza"
            label="Andamento altezza"
            unit="cm"
            color={color}
          />
        )}
      </div>
    </section>
  )
}
