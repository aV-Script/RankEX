import { useState, useMemo } from 'react'
import { Modal, Input, Button } from '../ui'
import { calcPercentile, calcStatMedia } from '../../utils/percentile'
import { getRankFromMedia, getStatsConfig } from '../../constants'
import { Pentagon } from '../ui/Pentagon'

export function CampionamentoModal({ client, onClose, onSave }) {
  const config    = getStatsConfig(client.categoria)
  const statKeys  = config.map(t => t.stat)
  const statLabels= config.map(t => t.label)

  // Stato input test
  const EMPTY = Object.fromEntries(statKeys.map(k => [k, '']))
  const [tests, setTests] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Percentili live dai valori input
  const liveStats = useMemo(() => {
    const result = {}
    statKeys.forEach((k, i) => {
      const test = config[i]
      let live = null

      if (test.variables && test.formula) {
        const varsValues = {}
        let incomplete = false
        test.variables.forEach(v => {
          const val = Number(tests[v.key])
          if (tests[v.key] === '' || isNaN(val)) incomplete = true
          varsValues[v.key] = val
        })
        live = !incomplete
          ? calcPercentile(test.stat, test.formula(varsValues), client.sesso, client.eta)
          : null
      } else {
        const raw = tests[k]
        const val = raw === '' ? null : Number(raw)
        live = val !== null ? calcPercentile(k, val, client.sesso, client.eta) : null
      }

      result[k] = live
    })
    return result
  }, [tests, client.sesso, client.eta, statKeys, config])

  // Stats complete per preview (sostituisce null con precedente o 0)
  const statsForPreview = useMemo(() => {
    const result = {}
    statKeys.forEach(k => {
      result[k] = liveStats[k] ?? client.stats?.[k] ?? 0
    })
    return result
  }, [liveStats, client.stats, statKeys])

  // Calcolo rank e media
  const filledCount = statKeys.filter(k => liveStats[k] !== null).length
  const newMedia    = calcStatMedia(statsForPreview)
  const newRankObj  = getRankFromMedia(newMedia)
  const oldMedia    = calcStatMedia(client.stats ?? {})
  const oldRankObj  = getRankFromMedia(oldMedia)
  const rankChanged = newRankObj.label !== oldRankObj.label

  // Validazione input
  const validate = () => {
    const e = {}
    statKeys.forEach((k, i) => {
      const test = config[i]
      if (test.variables) {
        test.variables.forEach(v => {
          const val = Number(tests[v.key])
          if (isNaN(val) || val < 0) e[v.key] = 'Valore non valido'
        })
      } else {
        const val = Number(tests[k])
        if (isNaN(val) || val < 0) e[k] = 'Valore non valido'
      }
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Salvataggio
  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const newStats = {}
      statKeys.forEach((k, i) => {
        const test = config[i]
        if (test.variables && test.formula) {
          const varsValues = {}
          test.variables.forEach(v => { varsValues[v.key] = Number(tests[v.key]) })
          const finalValue = test.formula(varsValues)
          newStats[k] = calcPercentile(test.stat, finalValue, client.sesso, client.eta) ?? 0
        } else {
          const val = Number(tests[k])
          newStats[k] = val ? calcPercentile(k, val, client.sesso, client.eta) ?? 0 : 0
        }
      })
      await onSave(newStats, { ...tests })
      onClose()
    } catch {
      setLoading(false)
    }
  }

  return (
    <Modal title="Nuovo campionamento" onClose={onClose} size="xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Colonna sinistra: input */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <p className="m-0 text-white/40 text-[13px] font-body">
            {client.name} · {client.sesso} · {client.eta} anni
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            {statKeys.map((k, i) => {
              const test = config[i]
              const live = liveStats[k]
              const prev = client.stats?.[k]
              const delta = live !== null && prev !== undefined ? live - prev : null
              const color =
                live === null ? 'rgba(255,255,255,0.25)' :
                live >= 75 ? '#6ee7b7' :
                live >= 40 ? '#f59e0b' :
                '#f87171'

              return (
                <div key={k} className="rounded-2xl p-4 transition-colors"
                  style={{
                    background: live !== null ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${live !== null ? color + '33' : 'rgba(255,255,255,0.06)'}`
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <span className="font-display text-[12px] text-white/80">{test.label}</span>
                      <span className="text-white/25 font-body text-[10px] ml-1.5">{test.test}</span>
                    </div>
                    {live !== null && (
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-[20px] font-black leading-none" style={{ color }}>{live}</span>
                        <span className="font-body text-[10px] text-white/30">/100</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {test.variables ? (
                      test.variables.map(v => (
                        <div key={`${k}_${v.key}`} className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={tests[v.key] ?? ''}
                            onChange={e => setTests(p => ({ ...p, [v.key]: e.target.value }))}
                            className="flex-1"
                          />
                          <span className="text-white/30 font-body text-[11px] w-12 text-right">{v.unit}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={tests[k]}
                          onChange={e => setTests(p => ({ ...p, [k]: e.target.value }))}
                          className="flex-1"
                        />
                        <span className="text-white/30 font-body text-[11px] w-12 text-right">{test.unit}</span>
                      </div>
                    )}
                  </div>

                  {live !== null && (
                    <div className="mt-2.5 h-[3px] rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${live}%`, background: color }} />
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] mt-1">
                    {delta !== null ? (
                      <span style={{ color: delta > 0 ? '#34d399' : delta < 0 ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
                        {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '— invariato'} rispetto al precedente
                      </span>
                    ) : (
                      <span className="text-white/20">Precedente: {prev ?? '—'}</span>
                    )}
                    {errors[k] && <span className="text-red-400">{errors[k]}</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <Button variant="primary" className="w-full" loading={loading} onClick={handleSave}>
            SALVA CAMPIONAMENTO
          </Button>
        </div>

        {/* Colonna destra: preview live */}
        <div className="hidden lg:flex flex-col gap-4 w-64 xl:w-72 shrink-0">
          <div className="rounded-2xl p-5 text-center" style={{ background: newRankObj.color + '11', border: `1px solid ${newRankObj.color}33` }}>
            <div className="font-display text-[10px] text-white/30 tracking-[3px] mb-2">RANK PROIETTATO</div>
            <div className="font-display font-black text-[48px]" style={{ color: newRankObj.color }}>{newRankObj.label}</div>
            <div className="font-body text-[12px] text-white/40 mt-1">Media: {Math.round(newMedia)}/100</div>
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

          <div className="rounded-2xl p-5 flex flex-col items-center gap-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="font-display text-[10px] text-white/30 tracking-[3px]">STATISTICHE</div>
            <Pentagon stats={statsForPreview} statKeys={statKeys} statLabels={statLabels} color={newRankObj.color} size={160} />
          </div>

          <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="font-body text-[12px] text-white/40">Test completati</span>
            <span className="font-display text-[14px]" style={{ color: filledCount === statKeys.length ? '#34d399' : '#f59e0b' }}>{filledCount}/{statKeys.length}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}