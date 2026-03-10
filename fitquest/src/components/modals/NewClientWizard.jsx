import { useState, useMemo } from 'react'
import { Modal, Input, Button } from '../ui'
import { CATEGORIE, STATS } from '../../constants'
import { calcPercentile, calcStatMedia } from '../../utils/percentile'
import { getRankFromMedia } from '../../constants'

const TOTAL_STEPS = 6 // 1 anagrafica + 5 test (no avatar step)
const EMPTY_ANAGRAFICA = { name: '', eta: '', sesso: 'M', peso: '', altezza: '', categoria: 'Amatoriale' }
const EMPTY_TESTS = { forza: '', mobilita: '', equilibrio: '', esplosivita: '', resistenza: '' }

export function NewClientWizard({ onClose, onAdd }) {
  const [step,       setStep]       = useState(0)
  const [anagrafica, setAnagrafica] = useState(EMPTY_ANAGRAFICA)
  const [tests,      setTests]      = useState(EMPTY_TESTS)
  const [loading,    setLoading]    = useState(false)
  const [errors,     setErrors]     = useState({})

  const statStep = STATS[step - 1]

  const livePercentile = useMemo(() => {
    if (!statStep) return null
    const val = parseFloat(tests[statStep.key])
    if (isNaN(val)) return null
    return calcPercentile(statStep.key, val, anagrafica.sesso, parseInt(anagrafica.eta))
  }, [statStep, tests, anagrafica.sesso, anagrafica.eta])

  const allStats = useMemo(() => {
    if (step < TOTAL_STEPS - 1) return null
    const result = {}
    STATS.forEach(s => {
      const val = parseFloat(tests[s.key])
      result[s.key] = isNaN(val) ? 0 : calcPercentile(s.key, val, anagrafica.sesso, parseInt(anagrafica.eta))
    })
    return result
  }, [step, tests, anagrafica])

  const validateStep0 = () => {
    const e = {}
    if (!anagrafica.name.trim()) e.name = 'Inserisci il nome'
    if (!anagrafica.eta || isNaN(anagrafica.eta) || +anagrafica.eta < 16 || +anagrafica.eta > 100) e.eta = 'Età non valida'
    if (!anagrafica.peso || isNaN(anagrafica.peso)) e.peso = 'Peso non valido'
    if (!anagrafica.altezza || isNaN(anagrafica.altezza)) e.altezza = 'Altezza non valida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStatStep = () => {
    const key = STATS[step - 1].key
    const val = parseFloat(tests[key])
    if (isNaN(val) || val < 0) { setErrors({ [key]: 'Inserisci un valore valido' }); return false }
    setErrors({})
    return true
  }

  const next = () => {
    if (step === 0 && !validateStep0()) return
    if (step >= 1 && step <= 5 && !validateStatStep()) return
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onAdd({
        ...anagrafica,
        eta:      parseInt(anagrafica.eta),
        peso:     parseFloat(anagrafica.peso),
        altezza:  parseFloat(anagrafica.altezza),
        testValues: { ...tests },
        stats:    allStats,
      })
      onClose()
    } catch { setLoading(false) }
  }

  const isLastStep  = step === TOTAL_STEPS - 1
  const progressPct = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <Modal title={stepTitle(step)} onClose={onClose}>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-[11px] text-white/30 font-display mb-1.5">
          <span>Step {step + 1} di {TOTAL_STEPS}</span><span>{progressPct}%</span>
        </div>
        <div className="bg-white/[.08] rounded-full h-1.5">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-[width] duration-500"
            style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {step === 0 && <AnagraficaStep data={anagrafica} onChange={(k, v) => setAnagrafica(p => ({ ...p, [k]: v }))} errors={errors} />}
      {step >= 1 && step <= 5 && (
        <TestStep stat={statStep} value={tests[statStep.key]}
          onChange={v => setTests(p => ({ ...p, [statStep.key]: v }))}
          percentile={livePercentile} error={errors[statStep.key]} />
      )}
      {isLastStep && <SummaryStep anagrafica={anagrafica} stats={allStats} />}

      <div className={`flex gap-3 mt-6 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="bg-transparent border border-white/10 rounded-xl px-5 py-3 text-white/50 font-display text-[12px] cursor-pointer hover:text-white/70 transition-colors">
            ‹ INDIETRO
          </button>
        )}
        {!isLastStep
          ? <Button variant="primary" className="flex-1" onClick={next}>AVANTI ›</Button>
          : <Button variant="primary" className="flex-1" loading={loading} onClick={handleSubmit}>SALVA CLIENTE</Button>
        }
      </div>
    </Modal>
  )
}

function AnagraficaStep({ data, onChange, errors }) {
  return (
    <div className="flex flex-col gap-3.5">
      <Field label="Nome e Cognome" error={errors.name}>
        <Input placeholder="Es. Mario Rossi" value={data.name} onChange={e => onChange('name', e.target.value)} autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Età" error={errors.eta}>
          <Input type="number" placeholder="Es. 35" value={data.eta} onChange={e => onChange('eta', e.target.value)} />
        </Field>
        <Field label="Sesso">
          <div className="flex gap-2">
            {['M', 'F'].map(s => (
              <button key={s} onClick={() => onChange('sesso', s)}
                className={`flex-1 py-2.5 rounded-xl font-display text-[13px] border-2 transition-all cursor-pointer
                  ${data.sesso === s ? 'bg-blue-500/20 border-blue-400 text-white' : 'bg-white/[.05] border-transparent text-white/50 hover:bg-white/10'}`}>
                {s === 'M' ? '♂ Uomo' : '♀ Donna'}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso (kg)" error={errors.peso}>
          <Input type="number" placeholder="Es. 75" value={data.peso} onChange={e => onChange('peso', e.target.value)} />
        </Field>
        <Field label="Altezza (cm)" error={errors.altezza}>
          <Input type="number" placeholder="Es. 175" value={data.altezza} onChange={e => onChange('altezza', e.target.value)} />
        </Field>
      </div>
      <Field label="Categoria Cliente">
        <div className="flex gap-2">
          {CATEGORIE.map(c => (
            <button key={c} onClick={() => onChange('categoria', c)}
              className={`flex-1 py-2.5 rounded-xl font-display text-[11px] border-2 transition-all cursor-pointer
                ${data.categoria === c ? 'bg-blue-500/20 border-blue-400 text-white' : 'bg-white/[.05] border-transparent text-white/50 hover:bg-white/10'}`}>
              {c}
            </button>
          ))}
        </div>
      </Field>
    </div>
  )
}

function TestStep({ stat, value, onChange, percentile, error }) {
  const color = percentile === null ? '#60a5fa'
    : percentile >= 75 ? '#6ee7b7' : percentile >= 40 ? '#f59e0b' : '#f87171'
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white/[.04] rounded-2xl p-4 border border-white/[.06]">
        <div className="font-display text-[13px] text-white mb-1">{stat.test}</div>
        <div className="font-body text-[13px] text-white/50">{stat.desc}</div>
      </div>
      <Field label={`Risultato (${stat.unit})`} error={error}>
        <Input type="number" placeholder={`Inserisci il valore in ${stat.unit}`} value={value}
          onChange={e => onChange(e.target.value)} autoFocus />
      </Field>
      <div className="bg-white/[.03] rounded-2xl p-4 border border-white/[.06] text-center">
        {percentile === null ? (
          <div className="text-white/30 font-body text-[13px]">Inserisci il valore per vedere il risultato</div>
        ) : (
          <>
            <div className="font-display text-[11px] text-white/30 tracking-[2px] mb-2">PUNTEGGIO {stat.label.toUpperCase()}</div>
            <div className="font-display text-[48px] font-black" style={{ color }}>{percentile}</div>
            <div className="font-body text-[12px] mt-1" style={{ color }}>{scoreLabel(percentile)}</div>
            {percentile >= 100 && <div className="mt-2 text-[12px] font-body text-yellow-400">🏆 Valore massimo!</div>}
          </>
        )}
      </div>
    </div>
  )
}

function SummaryStep({ anagrafica, stats }) {
  if (!stats) return null
  const media   = calcStatMedia(stats)
  const rankObj = getRankFromMedia(media)
  return (
    <div className="flex flex-col gap-4">
      {/* Rank preview */}
      <div className="rounded-2xl p-5 border text-center" style={{ borderColor: rankObj.color + '44', background: rankObj.color + '11' }}>
        <div className="font-display text-[11px] text-white/30 tracking-[3px] mb-2">RANK ASSEGNATO</div>
        <div className="font-display text-[52px] font-black" style={{ color: rankObj.color }}>{rankObj.label}</div>
        <div className="font-body text-[13px] text-white/40 mt-1">Media: {media}/100</div>
      </div>
      {/* Stats */}
      <div className="flex flex-col gap-2">
        {STATS.map(s => {
          const val   = stats?.[s.key] ?? 0
          const color = val >= 75 ? '#6ee7b7' : val >= 40 ? '#f59e0b' : '#f87171'
          return (
            <div key={s.key} className="flex items-center gap-3">
              <span className="w-4 text-[14px]">{s.icon}</span>
              <span className="w-24 font-body text-[13px] text-white/60">{s.label}</span>
              <div className="flex-1 bg-white/[.06] rounded-full h-[5px]">
                <div className="h-full rounded-full" style={{ width: `${val}%`, background: color }} />
              </div>
              <span className="w-8 text-right font-display text-[11px]" style={{ color }}>{val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <div className="text-white/40 text-[11px] font-display tracking-wider mb-1.5">{label.toUpperCase()}</div>
      {children}
      {error && <p className="m-0 mt-1 text-red-400 font-body text-[12px]">{error}</p>}
    </div>
  )
}

function stepTitle(step) {
  if (step === 0) return '👤 Dati Anagrafici'
  if (step <= 5)  return `📊 Test ${STATS[step - 1].label}`
  return '✅ Riepilogo'
}

function scoreLabel(pct) {
  if (pct >= 90) return 'Eccellente'
  if (pct >= 75) return 'Ottimo'
  if (pct >= 50) return 'Nella media'
  if (pct >= 25) return 'Sotto la media'
  return 'Da migliorare'
}
