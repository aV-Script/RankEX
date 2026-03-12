import { useState, useMemo } from 'react'
import { Modal, Input, Button } from '../ui'
import { STATS } from '../../constants'
import { calcPercentile, calcStatMedia } from '../../utils/percentile'
import { getRankFromMedia } from '../../constants'
import { Pentagon } from '../ui/Pentagon'

export function CampionamentoModal({ client, onClose, onSave }) {
  const EMPTY = Object.fromEntries(STATS.map(s => [s.key, '']))
  const [tests,   setTests]   = useState(EMPTY)
  const [note,    setNote]    = useState('')
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  // Calcola tutti i percentili live
  const liveStats = useMemo(() => {
    const result = {}
    STATS.forEach(s => {
      const val = parseFloat(tests[s.key])
      result[s.key] = isNaN(val) ? null : calcPercentile(s.key, val, client.sesso, client.eta)
    })
    return result
  }, [tests, client])

  // Statistiche complete (sostituisce null con 0) per preview rank
  const statsForPreview = useMemo(() => {
    const result = {}
    STATS.forEach(s => { result[s.key] = liveStats[s.key] ?? client.stats?.[s.key] ?? 0 })
    return result
  }, [liveStats, client.stats])

  const filledCount = STATS.filter(s => liveStats[s.key] !== null).length
  const newMedia    = calcStatMedia(statsForPreview)
  const newRankObj  = getRankFromMedia(newMedia)
  const oldMedia    = calcStatMedia(client.stats ?? {})
  const oldRankObj  = getRankFromMedia(oldMedia)
  const rankChanged = newRankObj.label !== oldRankObj.label

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
    <Modal title="Nuovo campionamento" onClose={onClose} size="xl">
      {/*
        Layout desktop: colonna sinistra (input) | colonna destra (preview live)
        Su mobile: colonna singola, preview collassata sotto
      */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Colonna sinistra: i 5 input ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <p className="m-0 text-white/40 text-[13px] font-body">
            {client.name} · {client.sesso} · {client.eta} anni
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            {STATS.map(s => {
              const live  = liveStats[s.key]
              const color = live === null ? 'rgba(255,255,255,0.25)'
                : live >= 75 ? '#6ee7b7'
                : live >= 40 ? '#f59e0b'
                : '#f87171'
              const prev  = client.stats?.[s.key]
              const delta = live !== null && prev !== undefined ? live - prev : null

              return (
                <div
                  key={s.key}
                  className="rounded-2xl p-4 transition-colors"
                  style={{
                    background: live !== null ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${live !== null ? color + '33' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {/* Header riga */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <span className="font-display text-[12px] text-white/80">
                        {s.icon} {s.label}
                      </span>
                      <span className="text-white/25 font-body text-[10px] ml-1.5">{s.test}</span>
                    </div>
                    {live !== null && (
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-[20px] font-black leading-none" style={{ color }}>
                          {live}
                        </span>
                        <span className="font-body text-[10px] text-white/30">/100</span>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder={`0`}
                      value={tests[s.key]}
                      onChange={e => setTests(p => ({ ...p, [s.key]: e.target.value }))}
                      className="flex-1"
                    />
                    <span className="text-white/30 font-body text-[11px] whitespace-nowrap w-12 text-right">
                      {s.unit}
                    </span>
                  </div>

                  {/* Delta e barra */}
                  <div className="mt-2.5">
                    {live !== null && (
                      <div className="h-[3px] rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{ width: `${live}%`, background: color }}
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      {delta !== null ? (
                        <span
                          className="font-display text-[10px]"
                          style={{ color: delta > 0 ? '#34d399' : delta < 0 ? '#f87171' : 'rgba(255,255,255,0.2)' }}
                        >
                          {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '— invariato'} rispetto al precedente
                        </span>
                      ) : (
                        <span className="font-body text-[10px] text-white/20">
                          Precedente: {prev ?? '—'}
                        </span>
                      )}
                      {errors[s.key] && (
                        <span className="text-red-400 font-body text-[10px]">{errors[s.key]}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Note */}
          <Input
            placeholder="Note sul campionamento (opzionale)..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />

          <Button variant="primary" className="w-full" loading={loading} onClick={handleSave}>
            SALVA CAMPIONAMENTO
          </Button>
        </div>

        {/* ── Colonna destra: preview live (solo desktop) ── */}
        <div className="hidden lg:flex flex-col gap-4 w-64 xl:w-72 shrink-0">
          {/* Rank preview */}
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: newRankObj.color + '11',
              border: `1px solid ${newRankObj.color}33`,
            }}
          >
            <div className="font-display text-[10px] text-white/30 tracking-[3px] mb-2">RANK PROIETTATO</div>
            <div
              className="font-display font-black text-[48px] leading-none"
              style={{ color: newRankObj.color }}
            >
              {newRankObj.label}
            </div>
            <div className="font-body text-[12px] text-white/40 mt-1">
              Media: {Math.round(newMedia)}/100
            </div>
            {rankChanged && (
              <div className="mt-3 rounded-lg px-3 py-1.5 text-[11px] font-display"
                style={{
                  background: newMedia > oldMedia ? '#34d39922' : '#f8717122',
                  color: newMedia > oldMedia ? '#34d399' : '#f87171',
                  border: `1px solid ${newMedia > oldMedia ? '#34d39944' : '#f8717144'}`,
                }}>
                {newMedia > oldMedia ? '▲' : '▼'} {oldRankObj.label} → {newRankObj.label}
              </div>
            )}
          </div>

          {/* Pentagon live */}
          <div
            className="rounded-2xl p-5 flex flex-col items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="font-display text-[10px] text-white/30 tracking-[3px]">STATISTICHE</div>
            <Pentagon stats={statsForPreview} color={newRankObj.color} size={160} />
            <div className="w-full flex flex-col gap-2">
              {STATS.map(s => {
                const val = statsForPreview[s.key]
                const isNew = liveStats[s.key] !== null
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <span className="text-[12px] w-4">{s.icon}</span>
                    <span className="font-body text-[11px] text-white/40 flex-1">{s.label}</span>
                    <div className="w-16 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${val}%`,
                        background: isNew ? newRankObj.color : 'rgba(255,255,255,0.2)',
                      }} />
                    </div>
                    <span
                      className="font-display text-[11px] w-5 text-right"
                      style={{ color: isNew ? newRankObj.color : 'rgba(255,255,255,0.3)' }}
                    >
                      {val}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contatore campi completati */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="font-body text-[12px] text-white/40">Test completati</span>
            <span className="font-display text-[14px]" style={{ color: filledCount === 5 ? '#34d399' : '#f59e0b' }}>
              {filledCount}/5
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
