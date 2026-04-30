import { useState, useCallback } from 'react'

const EMPTY_EXERCISE = { name: '', sets: '', reps: '', restSeconds: '', notes: '' }

function makeDay(index) {
  return { label: `Giorno ${index + 1}`, exercises: [{ ...EMPTY_EXERCISE }] }
}

function normalizeExercise(ex) {
  return {
    name:        ex.name        ?? '',
    sets:        ex.sets        != null ? String(ex.sets) : '',
    reps:        ex.reps        ?? '',
    restSeconds: ex.restSeconds != null ? String(ex.restSeconds) : '',
    notes:       ex.notes       ?? '',
  }
}

function initDays(initialData) {
  if (initialData?.days?.length)
    return initialData.days.map(d => ({ ...d, exercises: d.exercises.map(normalizeExercise) }))
  if (initialData?.exercises?.length)
    return [{ label: 'Giorno 1', exercises: initialData.exercises.map(normalizeExercise) }]
  return [makeDay(0)]
}

/**
 * Form creazione / modifica scheda allenamento con supporto multi-giorno.
 * Props:
 *   clientId     — se passato, il selettore cliente è nascosto (contesto dashboard)
 *   clients      — array clienti (solo se clientId non è pre-impostato)
 *   initialData  — piano esistente da modificare
 *   onSubmit     — callback con { title, description, clientId, days }
 *   onBack       — callback annulla
 */
export function WorkoutPlanForm({ clientId, clients, initialData, onSubmit, onBack }) {
  const [title,        setTitle]        = useState(initialData?.title       ?? '')
  const [description,  setDescription]  = useState(initialData?.description ?? '')
  const [selClientId,  setSelClientId]  = useState(initialData?.clientId    ?? '')
  const [days,         setDays]         = useState(() => initDays(initialData))
  const [activeDay,    setActiveDay]    = useState(0)
  const [loading,      setLoading]      = useState(false)
  const [errors,       setErrors]       = useState({})

  // ── Gestione giorni ─────────────────────────────────────────────────────────

  const addDay = () => {
    const next = days.length
    setDays(prev => [...prev, makeDay(next)])
    setActiveDay(next)
  }

  const removeDay = (index) => {
    if (days.length <= 1) return
    setDays(prev => prev.filter((_, i) => i !== index))
    setActiveDay(prev => Math.min(prev, days.length - 2))
  }

  const renameDay = (index, label) =>
    setDays(prev => prev.map((d, i) => i === index ? { ...d, label } : d))

  // ── Gestione esercizi ────────────────────────────────────────────────────────

  const updateExercise = useCallback((dayIdx, exIdx, field, value) => {
    setDays(prev => prev.map((d, di) =>
      di !== dayIdx ? d : {
        ...d,
        exercises: d.exercises.map((ex, ei) =>
          ei !== exIdx ? ex : { ...ex, [field]: value }
        ),
      }
    ))
  }, [])

  const addExercise = (dayIdx) =>
    setDays(prev => prev.map((d, di) =>
      di !== dayIdx ? d : { ...d, exercises: [...d.exercises, { ...EMPTY_EXERCISE }] }
    ))

  const removeExercise = (dayIdx, exIdx) =>
    setDays(prev => prev.map((d, di) =>
      di !== dayIdx ? d : {
        ...d,
        exercises: d.exercises.length > 1 ? d.exercises.filter((_, i) => i !== exIdx) : d.exercises,
      }
    ))

  // ── Validazione e submit ─────────────────────────────────────────────────────

  const validate = () => {
    const e = {}
    if (!title.trim())                       e.title    = 'Il titolo è obbligatorio'
    if (!clientId && !selClientId)           e.clientId = 'Seleziona un cliente'
    if (days.every(d => d.exercises.every(ex => !ex.name.trim())))
      e.exercises = 'Aggiungi almeno un esercizio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || loading) return
    setLoading(true)
    const cleanedDays = days
      .map((d, i) => ({
        label:     d.label.trim() || `Giorno ${i + 1}`,
        exercises: d.exercises
          .filter(ex => ex.name.trim())
          .map(ex => ({
            name:        ex.name.trim(),
            sets:        ex.sets        ? parseInt(ex.sets)     : null,
            reps:        ex.reps        ? ex.reps.trim()        : null,
            restSeconds: ex.restSeconds ? parseInt(ex.restSeconds) : null,
            notes:       (ex.notes ?? '').trim() || null,
          })),
      }))
      .filter(d => d.exercises.length > 0)

    await onSubmit({
      title:       title.trim(),
      description: description.trim() || null,
      clientId:    clientId ?? selClientId,
      days:        cleanedDays,
    })
    setLoading(false)
  }

  const currentDay = days[activeDay] ?? days[0]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/30 font-body text-[13px] hover:text-white/60 transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          ‹ {clientId ? 'Cliente' : 'Schede'}
        </button>
        <span className="font-display font-black text-[16px] text-white">
          {initialData ? 'Modifica scheda' : 'Nuova scheda'}
        </span>
        <div className="w-20" />
      </div>

      <div className="flex flex-col gap-5">

        {/* Dati principali */}
        <div className="rounded-[4px] p-5 rx-card flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[11px] tracking-[2px] text-white/40">TITOLO *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Es. Forza + Ipertrofia — Blocco A"
              className="input-base"
            />
            {errors.title && <span className="text-red-400 text-[11px]">{errors.title}</span>}
          </div>

          {/* Selettore cliente — solo se clientId non è pre-impostato */}
          {!clientId && clients?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[11px] tracking-[2px] text-white/40">CLIENTE *</label>
              <select
                value={selClientId}
                onChange={e => setSelClientId(e.target.value)}
                className="input-base"
              >
                <option value="">Seleziona cliente…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.clientId && <span className="text-red-400 text-[11px]">{errors.clientId}</span>}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-[11px] tracking-[2px] text-white/40">DESCRIZIONE</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Note generali sulla scheda…"
              rows={2}
              className="input-base resize-none"
            />
          </div>
        </div>

        {/* Giorni + esercizi */}
        <div className="rounded-[4px] p-5 rx-card">

          {/* Tab giorni */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            {days.map((day, i) => (
              <div key={i} className="flex items-center gap-1">
                {activeDay === i ? (
                  <input
                    type="text"
                    value={day.label}
                    onChange={e => renameDay(i, e.target.value)}
                    className="font-display text-[11px] font-bold bg-white/10 border border-white/20 rounded-[3px] px-2 py-1 text-white outline-none w-24 text-center"
                  />
                ) : (
                  <button
                    onClick={() => setActiveDay(i)}
                    className="font-display text-[11px] font-bold px-3 py-1 rounded-[3px] cursor-pointer border transition-all"
                    style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
                  >
                    {day.label || `Giorno ${i + 1}`}
                  </button>
                )}
                {days.length > 1 && activeDay === i && (
                  <button
                    onClick={() => removeDay(i)}
                    className="text-white/20 hover:text-red-400 transition-colors text-[11px] bg-transparent border-none cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {days.length < 7 && (
              <button
                onClick={addDay}
                className="font-display text-[11px] bg-transparent border-none cursor-pointer px-1 transition-opacity hover:opacity-70"
                style={{ color: '#0fd65a' }}
              >
                + giorno
              </button>
            )}
          </div>

          {/* Esercizi giorno corrente */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-[11px] font-semibold tracking-[2px] text-white/30">ESERCIZI</span>
              <button
                onClick={() => addExercise(activeDay)}
                className="font-display text-[11px] bg-transparent border-none cursor-pointer transition-opacity hover:opacity-70"
                style={{ color: '#0fd65a' }}
              >
                + aggiungi
              </button>
            </div>
            {errors.exercises && <span className="text-red-400 text-[11px]">{errors.exercises}</span>}
            {currentDay.exercises.map((ex, i) => (
              <ExerciseRow
                key={i}
                index={i}
                exercise={ex}
                total={currentDay.exercises.length}
                onChange={(field, val) => updateExercise(activeDay, i, field, val)}
                onRemove={() => removeExercise(activeDay, i)}
              />
            ))}
          </div>
        </div>

        {/* Azioni */}
        <div className="flex justify-end gap-3">
          <button onClick={onBack} className="btn btn-ghost text-[12px] px-4 py-2">
            ANNULLA
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary text-[12px] px-6 py-2 disabled:opacity-40"
          >
            {loading ? '…' : initialData ? 'SALVA' : 'CREA SCHEDA'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function ExerciseRow({ index, exercise, total, onChange, onRemove }) {
  return (
    <div
      className="rounded-[3px] p-3 flex flex-col gap-2"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-2">
        <span className="font-display text-[10px] text-white/25 shrink-0 w-5">{index + 1}.</span>
        <input
          type="text"
          value={exercise.name}
          onChange={e => onChange('name', e.target.value)}
          placeholder="Nome esercizio"
          className="input-base flex-1 py-1.5 text-[13px]"
        />
        {total > 1 && (
          <button
            onClick={onRemove}
            className="text-white/20 hover:text-red-400 transition-colors text-[12px] bg-transparent border-none cursor-pointer shrink-0"
          >
            ✕
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 pl-7">
        <LabeledInput label="Serie"        value={exercise.sets}        type="number" placeholder="3"    onChange={v => onChange('sets', v)} />
        <LabeledInput label="Rip. / Tempo" value={exercise.reps}                      placeholder="10 / 30s" onChange={v => onChange('reps', v)} />
        <LabeledInput label="Recupero (s)" value={exercise.restSeconds} type="number" placeholder="90"   onChange={v => onChange('restSeconds', v)} />
      </div>
      <div className="pl-7">
        <input
          type="text"
          value={exercise.notes}
          onChange={e => onChange('notes', e.target.value)}
          placeholder="Note (opzionale)"
          className="input-base w-full text-[12px] py-1 text-white/50"
        />
      </div>
    </div>
  )
}

function LabeledInput({ label, value, type = 'text', placeholder, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-[10px] tracking-[1px] text-white/30">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base text-[12px] py-1.5"
      />
    </div>
  )
}
