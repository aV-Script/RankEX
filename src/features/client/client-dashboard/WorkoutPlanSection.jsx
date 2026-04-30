import { useState, useEffect, useCallback } from 'react'
import { SectionLabel }            from '../../../components/ui'
import { WorkoutPlanForm }         from '../../trainer/workout-plans/WorkoutPlanForm'
import {
  getClientPlans,
  addWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
} from '../../../firebase/services/workoutPlans'

/**
 * Sezione schede allenamento nella dashboard trainer.
 * Gestisce creazione / modifica / archivio per un cliente specifico.
 */
export function WorkoutPlanSection({ orgId, clientId, color, readonly }) {
  const [plans,      setPlans]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState('read')   // 'read' | 'form'
  const [editing,    setEditing]    = useState(null)     // piano in modifica
  const [activeDay,  setActiveDay]  = useState(0)
  const [showArchive, setShowArchive] = useState(false)

  useEffect(() => {
    if (!orgId || !clientId) return
    getClientPlans(orgId, clientId).then(data => {
      setPlans(data)
      setLoading(false)
    })
  }, [orgId, clientId])

  const activePlan  = plans.find(p => p.status === 'active') ?? null
  const archived    = plans.filter(p => p.status !== 'active')

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async ({ title, description, days }) => {
    if (editing) {
      // modifica piano esistente
      const updated = { title, description, days }
      await updateWorkoutPlan(orgId, editing.id, updated)
      setPlans(prev => prev.map(p =>
        p.id === editing.id
          ? { ...p, ...updated, updatedAt: new Date().toISOString() }
          : p
      ))
    } else {
      // nuova scheda — archivia la scheda attiva corrente
      if (activePlan) {
        await updateWorkoutPlan(orgId, activePlan.id, { status: 'archived' })
        setPlans(prev => prev.map(p =>
          p.id === activePlan.id ? { ...p, status: 'archived' } : p
        ))
      }
      const ref   = await addWorkoutPlan(orgId, { title, description, clientId, days })
      const newPlan = {
        id:        ref.id,
        title, description, clientId, days,
        status:    'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setPlans(prev => [newPlan, ...prev.filter(p => p.id !== activePlan?.id), ...(activePlan ? [{ ...activePlan, status: 'archived' }] : [])])
    }
    setView('read')
    setEditing(null)
    setActiveDay(0)
  }, [orgId, clientId, activePlan, editing])

  const handleArchive = useCallback(async (plan) => {
    await updateWorkoutPlan(orgId, plan.id, { status: 'archived' })
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'archived' } : p))
  }, [orgId])

  const handleDelete = useCallback(async (plan) => {
    await deleteWorkoutPlan(orgId, plan.id)
    setPlans(prev => prev.filter(p => p.id !== plan.id))
  }, [orgId])

  const handleEdit = (plan) => {
    setEditing(plan)
    setView('form')
    setActiveDay(0)
  }

  const handleBack = () => {
    setView('read')
    setEditing(null)
    setActiveDay(0)
  }

  // ── FORM ──────────────────────────────────────────────────────────────────

  if (view === 'form') {
    return (
      <section className="px-4 sm:px-6 py-6">
        <WorkoutPlanForm
          clientId={clientId}
          initialData={editing}
          onSubmit={handleSubmit}
          onBack={handleBack}
        />
      </section>
    )
  }

  // ── READ ──────────────────────────────────────────────────────────────────

  if (loading) return null

  return (
    <section className="px-4 sm:px-6 py-6">
      <div className="rounded-[4px] p-5 rx-card">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <SectionLabel className="mb-0">◈ Scheda allenamento</SectionLabel>
          {!readonly && (
            <div className="flex gap-2">
              {activePlan && (
                <button
                  onClick={() => handleEdit(activePlan)}
                  className="text-[11px] font-display px-3 py-1.5 rounded-[3px] cursor-pointer border transition-all hover:opacity-80"
                  style={{ color: color + 'cc', borderColor: color + '33', background: color + '08' }}
                >
                  MODIFICA
                </button>
              )}
              <button
                onClick={() => { setEditing(null); setView('form') }}
                className="text-[11px] font-display px-3 py-1.5 rounded-[3px] cursor-pointer border transition-all hover:opacity-80"
                style={{ color, borderColor: color + '55', background: color + '11' }}
              >
                {activePlan ? 'NUOVA SCHEDA' : 'CREA SCHEDA'}
              </button>
            </div>
          )}
        </div>
        {!readonly && activePlan && (
          <p className="font-body text-[11px] text-white/20 text-right mb-3 m-0">
            Creare una nuova scheda archivierà automaticamente quella corrente
          </p>
        )}

        {/* Nessuna scheda attiva */}
        {!activePlan && (
          <p className="font-body text-[13px] text-white/30 py-4 text-center">
            Nessuna scheda attiva assegnata.
          </p>
        )}

        {/* Scheda attiva */}
        {activePlan && (
          <PlanDisplay
            plan={activePlan}
            color={color}
            activeDay={activeDay}
            onDayChange={setActiveDay}
            readonly={readonly}
            onArchive={() => handleArchive(activePlan)}
          />
        )}

        {/* Storico */}
        {archived.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <button
              onClick={() => setShowArchive(v => !v)}
              className="flex items-center gap-2 font-display text-[10px] tracking-[2px] text-white/30 hover:text-white/50 transition-colors bg-transparent border-none cursor-pointer p-0 mb-3"
            >
              <span>{showArchive ? '▾' : '▸'}</span>
              STORICO ({archived.length})
            </button>
            {showArchive && (
              <div className="flex flex-col gap-2">
                {archived.map(plan => (
                  <ArchivedPlanRow
                    key={plan.id}
                    plan={plan}
                    color={color}
                    readonly={readonly}
                    onEdit={() => handleEdit(plan)}
                    onDelete={() => handleDelete(plan)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Sottocomponenti ───────────────────────────────────────────────────────────

function PlanDisplay({ plan, color, activeDay, onDayChange, readonly, onArchive }) {
  // Normalizza: supporta sia il vecchio formato exercises[] che il nuovo days[]
  const days = plan.days?.length
    ? plan.days
    : [{ label: 'Giorno 1', exercises: plan.exercises ?? [] }]

  const safeDay  = Math.min(activeDay, days.length - 1)
  const day      = days[safeDay]
  const exercises = day?.exercises ?? []

  return (
    <div>
      {/* Titolo e descrizione */}
      <h3 className="font-display font-bold text-[16px] text-white mb-1">{plan.title}</h3>
      {plan.description && (
        <p className="font-body text-[13px] text-white/40 mb-3 m-0 leading-relaxed">
          {plan.description}
        </p>
      )}

      {/* Tab giorni — solo se più di uno */}
      {days.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap mb-4 mt-3">
          {days.map((d, i) => (
            <button
              key={i}
              onClick={() => onDayChange(i)}
              className="font-display text-[11px] font-bold px-3 py-1 rounded-[3px] cursor-pointer border transition-all"
              style={safeDay === i
                ? { background: color + '18', borderColor: color + '55', color }
                : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
              }
            >
              {d.label || `Giorno ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Lista esercizi */}
      <div className="flex flex-col gap-2 mt-2">
        {exercises.length === 0 && (
          <p className="font-body text-[12px] text-white/25 py-2 text-center">Nessun esercizio.</p>
        )}
        {exercises.map((ex, index) => (
          <div
            key={index}
            className="rounded-[3px] p-3 flex items-start gap-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="font-display text-[12px] font-bold shrink-0 w-5 pt-0.5" style={{ color: color + '88' }}>
              {index + 1}.
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-display font-bold text-[14px] text-white">{ex.name}</span>
              <div className="flex gap-4 mt-1.5 flex-wrap">
                {ex.sets        && <Chip label="Serie"        value={ex.sets} />}
                {ex.reps        && <Chip label="Rip. / Tempo" value={ex.reps} />}
                {ex.restSeconds && <Chip label="Recupero"     value={`${ex.restSeconds}s`} />}
              </div>
              {ex.notes && (
                <p className="font-body text-[12px] text-white/35 mt-1.5 m-0">{ex.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Azioni scheda attiva */}
      {!readonly && (
        <div className="flex justify-end mt-4">
          <button
            onClick={onArchive}
            className="font-display text-[10px] tracking-[1px] text-white/20 hover:text-white/40 transition-colors bg-transparent border-none cursor-pointer"
          >
            ARCHIVIA
          </button>
        </div>
      )}
    </div>
  )
}

function ArchivedPlanRow({ plan, color, readonly, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [activeDay, setActiveDay] = useState(0)

  const days = plan.days?.length
    ? plan.days
    : [{ label: 'Giorno 1', exercises: plan.exercises ?? [] }]

  const totalExercises = days.reduce((sum, d) => sum + (d.exercises?.length ?? 0), 0)
  const date = plan.updatedAt
    ? new Date(plan.updatedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  return (
    <div
      className="rounded-[3px]"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Row header */}
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => setOpen(v => !v)}
          className="font-display text-[12px] font-bold text-white/50 hover:text-white/70 transition-colors bg-transparent border-none cursor-pointer p-0 text-left flex-1 min-w-0"
        >
          <span className="mr-2 text-white/25">{open ? '▾' : '▸'}</span>
          {plan.title}
        </button>
        <span className="font-body text-[11px] text-white/20 shrink-0">
          {days.length > 1 ? `${days.length} giorni · ` : ''}{totalExercises} es.
        </span>
        {date && <span className="font-body text-[11px] text-white/15 shrink-0">{date}</span>}
        {!readonly && (
          <button
            onClick={onDelete}
            className="text-[11px] bg-transparent border-none cursor-pointer shrink-0 transition-colors"
            style={{ color: 'rgba(255,255,255,0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.15)' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Dettaglio espanso */}
      {open && (
        <div className="px-3 pb-3 border-t border-white/[0.04]">
          {days.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap mt-3 mb-3">
              {days.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDay(i)}
                  className="font-display text-[11px] font-bold px-3 py-1 rounded-[3px] cursor-pointer border transition-all"
                  style={activeDay === i
                    ? { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
                  }
                >
                  {d.label || `Giorno ${i + 1}`}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1.5 mt-2">
            {(days[Math.min(activeDay, days.length - 1)]?.exercises ?? []).map((ex, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-display text-[10px] text-white/20 w-4 shrink-0">{i + 1}.</span>
                <span className="font-display font-bold text-[12px] text-white/55">{ex.name}</span>
                {ex.sets && <span className="font-display text-[11px] text-white/25">{ex.sets}×{ex.reps || '—'}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-[10px] font-semibold tracking-[1px] text-white/25">{label}</span>
      <span className="font-display font-bold text-[12px] text-white/65">{value}</span>
    </div>
  )
}
