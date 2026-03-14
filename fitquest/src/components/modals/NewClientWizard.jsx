import { useState, useMemo } from 'react'
import { Modal, Input, Button, Field } from '../ui'
import { CATEGORIE, STATS } from '../../constants'
import { calcPercentile, calcStatMedia } from '../../utils/percentile'
import { getRankFromMedia } from '../../constants'
import { Pentagon } from '../ui/Pentagon'

const TOTAL_STEPS    = 7
const EMPTY_ANAGRAFICA = { name: '', eta: '', sesso: 'M', peso: '', altezza: '', categoria: 'Amatoriale' }
const EMPTY_TESTS      = { forza: '', mobilita: '', equilibrio: '', esplosivita: '', resistenza: '' }

export function NewClientWizard({ onClose, onAdd }) {
  const [step,       setStep]       = useState(0)
  const [anagrafica, setAnagrafica] = useState(EMPTY_ANAGRAFICA)
  const [tests,      setTests]      = useState(EMPTY_TESTS)
  const [account,    setAccount]    = useState({ email: '', password: '' })
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
    const result = {}
    STATS.forEach(s => {
      const val = parseFloat(tests[s.key])
      result[s.key] = isNaN(val) ? 0 : calcPercentile(s.key, val, anagrafica.sesso, parseInt(anagrafica.eta))
    })
    return result
  }, [tests, anagrafica])

  const media   = calcStatMedia(allStats)
  const rankObj = getRankFromMedia(media)

  // ── Validazioni ────────────────────────────────────────────────────────────
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

  const validateAccount = () => {
    const e = {}
    if (!account.email.trim() || !account.email.includes('@')) e.email = 'Email non valida'
    if (!account.password || account.password.length < 8) e.password = 'Password minimo 8 caratteri'
    else if (!/[0-9]/.test(account.password)) e.password = 'La password deve contenere almeno un numero'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (step === 0 && !validateStep0()) return
    if (step >= 1 && step <= 5 && !validateStatStep()) return
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!validateAccount()) return
    setLoading(true)
    try {
      await onAdd({
        ...anagrafica,
        eta:        parseInt(anagrafica.eta),
        peso:       parseFloat(anagrafica.peso),
        altezza:    parseFloat(anagrafica.altezza),
        testValues: { ...tests },
        stats:      allStats,
        email:      account.email.trim(),
        password:   account.password,
      })
      onClose()
    } catch (err) {
      setErrors({ email: err.message })
      setLoading(false)
    }
  }

  const isLastStep  = step === TOTAL_STEPS - 1
  const progressPct = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <Modal title={stepTitle(step)} onClose={onClose} size="lg">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-[11px] text-white/30 font-display mb-1.5">
          <span>Step {step + 1} di {TOTAL_STEPS}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="bg-white/[.08] rounded-full h-1.5">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, #3b82f6, ${rankObj.color})` }}
          />
        </div>
      </div>

      {/* ── Layout a due colonne su desktop ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Colonna sinistra: pannello contestuale */}
        <div className="hidden lg:flex flex-col gap-4 w-56 xl:w-64 shrink-0">
          <StepSidebar
            step={step}
            anagrafica={anagrafica}
            statStep={statStep}
            livePercentile={livePercentile}
            allStats={allStats}
            rankObj={rankObj}
            media={media}
          />
        </div>

        {/* Colonna destra (o unica su mobile): il form vero */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {step === 0 && (
            <AnagraficaStep
              data={anagrafica}
              onChange={(k, v) => setAnagrafica(p => ({ ...p, [k]: v }))}
              errors={errors}
            />
          )}
          {step >= 1 && step <= 5 && (
            <TestStep
              stat={statStep}
              value={tests[statStep.key]}
              onChange={v => setTests(p => ({ ...p, [statStep.key]: v }))}
              percentile={livePercentile}
              error={errors[statStep.key]}
            />
          )}
          {step === 6 && (
            <AccountStep
              data={account}
              onChange={(k, v) => setAccount(p => ({ ...p, [k]: v }))}
              errors={errors}
              rankObj={rankObj}
              media={media}
              allStats={allStats}
            />
          )}

          {/* Navigazione */}
          <div className={`flex gap-3 mt-2 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="bg-transparent border border-white/10 rounded-xl px-5 py-3 text-white/50 font-display text-[12px] cursor-pointer hover:text-white/70 transition-colors"
              >
                ‹ INDIETRO
              </button>
            )}
            {!isLastStep
              ? <Button variant="primary" className="flex-1" onClick={next}>AVANTI ›</Button>
              : <Button variant="primary" className="flex-1" loading={loading} onClick={handleSubmit}>CREA CLIENTE</Button>
            }
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Sidebar contestuale desktop ───────────────────────────────────────────────

function StepSidebar({ step, anagrafica, statStep, livePercentile, allStats, rankObj, media }) {
  const color = rankObj.color

  // Step 0: icona + descrizione cosa stiamo facendo
  if (step === 0) return (
    <div className="flex flex-col gap-3 h-full">
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="font-display text-[10px] text-white/30 tracking-[2px] mb-3">STEP 1 DI 7</div>
        <div className="font-display font-black text-[32px] text-white leading-none mb-2">Anagrafica</div>
        <p className="m-0 font-body text-[13px] text-white/40 leading-relaxed">
          Nome, età, sesso e dati fisici del cliente. Questi dati vengono usati per calibrare i percentili dei test.
        </p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="font-display text-[10px] text-white/30 tracking-[2px] mb-2">PERCHÉ SERVONO</div>
        {[
          ['Età + sesso', 'determinano la fascia percentile di riferimento'],
          ['Peso + altezza', 'vengono salvati nel profilo ma non influenzano i test'],
          ['Categoria', 'classifica il cliente nel tuo roster'],
        ].map(([bold, rest]) => (
          <div key={bold} className="flex gap-2 mb-2">
            <div className="w-1 h-1 rounded-full bg-white/20 mt-2 shrink-0" />
            <p className="m-0 font-body text-[12px] text-white/40">
              <span className="text-white/60">{bold}</span> {rest}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  // Step 1-5: descrizione test + preview percentile grande
  if (step >= 1 && step <= 5 && statStep) {
    const pColor = livePercentile === null ? 'rgba(255,255,255,0.3)'
      : livePercentile >= 75 ? '#6ee7b7'
      : livePercentile >= 40 ? '#f59e0b'
      : '#f87171'
    return (
      <div className="flex flex-col gap-3 h-full">
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="font-display text-[10px] text-white/30 tracking-[2px] mb-2">TEST {step} DI 5</div>
          <div className="font-display font-black text-[22px] text-white leading-tight mb-1">{statStep.test}</div>
          <p className="m-0 font-body text-[13px] text-white/40 leading-relaxed">{statStep.desc}</p>
        </div>
        <div
          className="rounded-2xl p-5 text-center flex-1 flex flex-col items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${pColor}22` }}
        >
          {livePercentile === null ? (
            <div className="font-body text-[12px] text-white/20">Inserisci il valore per vedere il punteggio</div>
          ) : (
            <>
              <div className="font-display text-[10px] text-white/30 tracking-[2px] mb-2">PUNTEGGIO</div>
              <div className="font-display font-black text-[64px] leading-none" style={{ color: pColor }}>
                {livePercentile}
              </div>
              <div className="font-body text-[12px] mt-1" style={{ color: pColor }}>
                {scoreLabel(livePercentile)}
              </div>
            </>
          )}
        </div>
        {/* Pentagon con le stat raccolte finora */}
        <div className="rounded-2xl p-4 flex flex-col items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="font-display text-[9px] text-white/20 tracking-[2px]">PROFILO ATTUALE</div>
          <Pentagon stats={allStats} color={color} size={100} />
        </div>
      </div>
    )
  }

  // Step 6: rank assegnato + riepilogo stat
  if (step === 6) return (
    <div className="flex flex-col gap-3 h-full">
      <div className="rounded-2xl p-5 text-center" style={{ background: color + '11', border: `1px solid ${color}33` }}>
        <div className="font-display text-[10px] text-white/30 tracking-[2px] mb-2">RANK ASSEGNATO</div>
        <div className="font-display font-black text-[52px] leading-none" style={{ color }}>{rankObj.label}</div>
        <div className="font-body text-[12px] text-white/30 mt-1">Media: {Math.round(media)}/100</div>
      </div>
      <div className="rounded-2xl p-4 flex flex-col items-center gap-2 flex-1"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Pentagon stats={allStats} color={color} size={120} />
        {STATS.map(s => (
          <div key={s.key} className="w-full flex items-center gap-2">
            <span className="text-[11px] w-4">{s.icon}</span>
            <span className="font-body text-[10px] text-white/40 flex-1">{s.label}</span>
            <span className="font-display text-[11px]" style={{ color }}>{allStats[s.key]}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return null
}

// ── Steps form ────────────────────────────────────────────────────────────────

function AnagraficaStep({ data, onChange, errors }) {
  return (
    <div className="flex flex-col gap-3.5">
      <Field label="Nome e Cognome" error={errors.name}>
        <Input placeholder="Es. Mario Rossi" value={data.name}
          onChange={e => onChange('name', e.target.value)} autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Età" error={errors.eta}>
          <Input type="number" placeholder="Es. 35" value={data.eta}
            onChange={e => onChange('eta', e.target.value)} />
        </Field>
        <Field label="Sesso">
          <div className="flex gap-2">
            {['M', 'F'].map(s => (
              <button key={s} onClick={() => onChange('sesso', s)}
                className={`flex-1 py-2.5 rounded-xl font-display text-[13px] border-2 transition-all cursor-pointer
                  ${data.sesso === s ? 'bg-blue-500/20 border-blue-400 text-white' : 'bg-white/[.05] border-transparent text-white/50 hover:bg-white/10'}`}>
                {s === 'M' ? 'M' : 'F'}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso (kg)" error={errors.peso}>
          <Input type="number" placeholder="Es. 75" value={data.peso}
            onChange={e => onChange('peso', e.target.value)} />
        </Field>
        <Field label="Altezza (cm)" error={errors.altezza}>
          <Input type="number" placeholder="Es. 175" value={data.altezza}
            onChange={e => onChange('altezza', e.target.value)} />
        </Field>
      </div>
      <Field label="Categoria">
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
    <div className="flex flex-col gap-4">
      {/* Card descrizione test — visibile solo su mobile (desktop la vede nella sidebar) */}
      <div className="lg:hidden rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="font-display text-[13px] text-white mb-1">{stat.test}</div>
        <div className="font-body text-[13px] text-white/50">{stat.desc}</div>
      </div>

      <Field label={`Risultato (${stat.unit})`} error={error}>
        <Input type="number" placeholder={`Valore in ${stat.unit}`} value={value}
          onChange={e => onChange(e.target.value)} autoFocus />
      </Field>

      {/* Preview percentile su mobile */}
      <div className="lg:hidden rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {percentile === null ? (
          <div className="text-white/30 font-body text-[13px]">Inserisci il valore per vedere il punteggio</div>
        ) : (
          <>
            <div className="font-display text-[11px] text-white/30 tracking-[2px] mb-2">PUNTEGGIO {stat.label.toUpperCase()}</div>
            <div className="font-display text-[48px] font-black" style={{ color }}>{percentile}</div>
            <div className="font-body text-[12px] mt-1" style={{ color }}>{scoreLabel(percentile)}</div>
          </>
        )}
      </div>
    </div>
  )
}

function AccountStep({ data, onChange, errors, rankObj, media, allStats }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Rank preview — solo mobile (desktop nella sidebar) */}
      <div className="lg:hidden rounded-2xl p-4 border text-center"
        style={{ borderColor: rankObj.color + '44', background: rankObj.color + '11' }}>
        <div className="font-display text-[11px] text-white/30 tracking-[3px] mb-1">RANK ASSEGNATO</div>
        <div className="font-display text-[40px] font-black" style={{ color: rankObj.color }}>{rankObj.label}</div>
        <div className="font-body text-[12px] text-white/30 mt-0.5">Media: {Math.round(media)}/100</div>
      </div>

      <div className="pt-2">
        <div className="font-display text-[11px] text-white/30 tracking-[2px] mb-4">ACCOUNT CLIENTE</div>
        <div className="flex flex-col gap-3">
          <Field label="Email cliente" error={errors.email}>
            <Input type="email" placeholder="email@esempio.com" value={data.email}
              onChange={e => onChange('email', e.target.value)} autoFocus />
          </Field>
          <Field label="Password temporanea" error={errors.password}>
            <Input type="password" placeholder="Min. 8 caratteri, almeno 1 numero" value={data.password}
              onChange={e => onChange('password', e.target.value)} />
          </Field>
          <p className="m-0 text-white/25 font-body text-[12px]">
            Il cliente dovrà cambiare la password al primo accesso.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────



function stepTitle(step) {
  if (step === 0) return 'Nuovo cliente — dati anagrafici'
  if (step <= 5)  return `Test ${step}/5 — ${STATS[step - 1].label}`
  return 'Account cliente'
}

function scoreLabel(pct) {
  if (pct >= 90) return 'Eccellente'
  if (pct >= 75) return 'Ottimo'
  if (pct >= 50) return 'Nella media'
  if (pct >= 25) return 'Sotto la media'
  return 'Da migliorare'
}
