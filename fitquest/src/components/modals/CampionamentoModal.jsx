import { useState, useMemo } from 'react'
import { Modal, Input, Button } from '../ui'
import { STATS } from '../../constants'
import { calcPercentile } from '../../utils/percentile'

export function CampionamentoModal({ client, onClose, onSave }) {
  const EMPTY = Object.fromEntries(STATS.map(s => [s.key, '']))
  const [tests,   setTests]   = useState(EMPTY)
  const [note,    setNote]    = useState('')
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  const liveStats = useMemo(() => {
    const result = {}
    STATS.forEach(s => {
      const val = parseFloat(tests[s.key])
      result[s.key] = isNaN(val) ? null : calcPercentile(s.key, val, client.sesso, client.eta)
    })
    return result
  }, [tests, client])

  const validate = () => {
    const e = {}
    STATS.forEach(s => {
      const val = parseFloat(tests[s.key])
      if (isNaN(val) || val < 0) e[s.key] = 'Valore non valido'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const newStats = {}
      STATS.forEach(s => { newStats[s.key] = liveStats[s.key] })
      await onSave(newStats, { ...tests }, note.trim())
      onClose()
    } catch {
      setLoading(false)
    }
  }

  return (
    <Modal title="📊 Nuovo Campionamento" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="m-0 text-white/50 text-[13px] font-body">
          Inserisci i risultati dei test. Le statistiche verranno ricalcolate automaticamente.
        </p>

        {STATS.map(s => {
          const live = liveStats[s.key]
          const color = live === null ? 'rgba(255,255,255,0.3)'
            : live >= 75 ? '#6ee7b7'
            : live >= 40 ? '#f59e0b'
            : '#f87171'

          return (
            <div key={s.key} className="bg-white/[.03] rounded-2xl p-4 border border-white/[.06]">
              <div className="flex items-center justify-between mb-2">
                <div className="font-display text-[12px] text-white/70">
                  {s.icon} {s.label}
                  <span className="text-white/30 font-body text-[11px] ml-2 normal-case">({s.test})</span>
                </div>
                {live !== null && (
                  <div className="font-display text-[18px] font-bold" style={{ color }}>{live}</div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder={`${s.unit}`}
                  value={tests[s.key]}
                  onChange={e => setTests(p => ({ ...p, [s.key]: e.target.value }))}
                  className="flex-1"
                />
                <span className="text-white/30 font-body text-[12px] whitespace-nowrap">{s.unit}</span>
              </div>

              {/* Confronto con precedente */}
              {live !== null && client.stats[s.key] !== undefined && (
                <DeltaBadge prev={client.stats[s.key]} curr={live} />
              )}

              {errors[s.key] && (
                <p className="m-0 mt-1 text-red-400 font-body text-[12px]">{errors[s.key]}</p>
              )}
            </div>
          )
        })}

        <Input
          placeholder="Note (opzionale)..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        <Button variant="primary" className="w-full" loading={loading} onClick={handleSave}>
          💾 SALVA CAMPIONAMENTO
        </Button>
      </div>
    </Modal>
  )
}

function DeltaBadge({ prev, curr }) {
  const delta = curr - prev
  if (delta === 0) return null
  const positive = delta > 0
  return (
    <div className={`mt-1.5 text-[11px] font-display ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? '▲' : '▼'} {positive ? '+' : ''}{delta} rispetto al precedente
    </div>
  )
}
