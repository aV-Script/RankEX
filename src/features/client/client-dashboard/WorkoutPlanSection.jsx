import { useState, useEffect, useCallback } from 'react'
import { SectionLabel, DayTabs, EmptyState } from '../../../components/ui'
import { IconChevronDown }               from '../../../components/ui/icons'
import { ConfirmDialog }                 from '../../../components/common/ConfirmDialog'
import { WorkoutPlanForm }               from '../../trainer/workout-plans/WorkoutPlanForm'
import { getClientPlans }                from '../../../firebase/services/workoutPlans'
import { addWorkoutPlanUseCase }         from '../../../usecases/addWorkoutPlanUseCase'
import { updateWorkoutPlanUseCase }      from '../../../usecases/updateWorkoutPlanUseCase'
import { deleteWorkoutPlanUseCase }      from '../../../usecases/deleteWorkoutPlanUseCase'
import { useToast }                      from '../../../hooks/useToast'
import { normalizePlanDays }             from '../../../utils/workoutPlans'
import { useTrainerState }               from '../../../context/TrainerContext'

/**
 * Sezione schede allenamento nella dashboard trainer.
 * Gestisce creazione / modifica / archivio per un cliente specifico.
 */
export function WorkoutPlanSection({ orgId, clientId, color, readonly }) {
  const { error: toastError } = useToast()
  const { terminology } = useTrainerState()
  const [plans,      setPlans]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState('read')   // 'read' | 'form'
  const [editing,    setEditing]    = useState(null)     // piano in modifica
  const [activeDay,  setActiveDay]  = useState(0)
  const [showArchive, setShowArchive] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)   // piano in attesa di conferma eliminazione
  const [deleting,   setDeleting]   = useState(false)
  const [pendingArchive, setPendingArchive] = useState(null) // piano in attesa di conferma archiviazione
  const [archiving,  setArchiving]  = useState(false)

  useEffect(() => {
    if (!orgId || !clientId) return
    getClientPlans(orgId, clientId)
      .then(data => setPlans(data))
      .catch(() => toastError('Impossibile caricare le schede'))
      .finally(() => setLoading(false))
  }, [orgId, clientId, toastError])

  const activePlan  = plans.find(p => p.status === 'active') ?? null
  const archived    = plans.filter(p => p.status !== 'active')

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async ({ title, description, days }) => {
    try {
      if (editing) {
        const updated = { title, description, days }
        await updateWorkoutPlanUseCase(orgId, editing.id, updated)
        setPlans(prev => prev.map(p =>
          p.id === editing.id
            ? { ...p, ...updated, updatedAt: new Date().toISOString() }
            : p
        ))
      } else {
        // Il BE archivia automaticamente la scheda attiva corrente
        const newId   = await addWorkoutPlanUseCase(orgId, clientId, title, description, days)
        const newPlan = {
          id: newId, title, description, clientId, days,
          status:    'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setPlans(prev => [
          newPlan,
          ...prev.map(p => p.id === activePlan?.id ? { ...p, status: 'archived' } : p),
        ])
      }
      setView('read')
      setEditing(null)
      setActiveDay(0)
    } catch {
      toastError('Impossibile salvare la scheda')
    }
  }, [orgId, clientId, activePlan, editing, toastError])

  const handleArchive = useCallback(async (plan) => {
    setArchiving(true)
    try {
      await updateWorkoutPlanUseCase(orgId, plan.id, { status: 'archived' })
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'archived' } : p))
      setPendingArchive(null)
    } catch {
      toastError('Impossibile archiviare la scheda')
    } finally {
      setArchiving(false)
    }
  }, [orgId, toastError])

  const handleDelete = useCallback(async (plan) => {
    setDeleting(true)
    try {
      await deleteWorkoutPlanUseCase(orgId, plan.id)
      setPlans(prev => prev.filter(p => p.id !== plan.id))
      setPendingDelete(null)
    } catch {
      toastError('Impossibile eliminare la scheda')
    } finally {
      setDeleting(false)
    }
  }, [orgId, toastError])

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
          terminology={terminology}
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
          <p className="font-body text-[11px] text-white/60 text-right mb-3 m-0">
            Creare una nuova scheda archivierà automaticamente quella corrente
          </p>
        )}

        {/* Nessuna scheda attiva */}
        {!activePlan && (
          <EmptyState
            color={color}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="6" y1="20" x2="18" y2="20"/></svg>}
            title="Nessuna scheda attiva"
            description="Crea una scheda per assegnarla a questo cliente."
          />
        )}

        {/* Scheda attiva */}
        {activePlan && (
          <PlanDisplay
            plan={activePlan}
            color={color}
            activeDay={activeDay}
            onDayChange={setActiveDay}
            readonly={readonly}
            onArchive={() => setPendingArchive(activePlan)}
          />
        )}

        {/* Storico */}
        {archived.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <button
              onClick={() => setShowArchive(v => !v)}
              className="flex items-center gap-2 font-display text-[10px] tracking-[2px] text-white/30 hover:text-white/50 transition-colors bg-transparent border-none cursor-pointer p-0 mb-3"
            >
              <IconChevronDown size={10} rotated={showArchive} />
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
                    onDelete={() => setPendingDelete(plan)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          variant="danger"
          title="Eliminare la scheda?"
          description={`"${pendingDelete.title}" verrà eliminata definitivamente. L'operazione non può essere annullata.`}
          confirmLabel="ELIMINA"
          loading={deleting}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {pendingArchive && (
        <ConfirmDialog
          title="Archiviare la scheda?"
          description={`"${pendingArchive.title}" verrà spostata nello storico. Potrai comunque consultarla in seguito.`}
          confirmLabel="ARCHIVIA"
          loading={archiving}
          onConfirm={() => handleArchive(pendingArchive)}
          onCancel={() => setPendingArchive(null)}
        />
      )}
    </section>
  )
}

// ── Sottocomponenti ───────────────────────────────────────────────────────────

function PlanDisplay({ plan, color, activeDay, onDayChange, readonly, onArchive }) {
  const days = normalizePlanDays(plan)

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
        <div className="mb-4 mt-3">
          <DayTabs days={days} activeDay={safeDay} onChange={onDayChange} color={color} />
        </div>
      )}

      {/* Lista esercizi */}
      <div className="flex flex-col gap-2 mt-2">
        {exercises.length === 0 && (
          <p className="font-body text-[12px] text-white/60 py-2 text-center">Nessun esercizio.</p>
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
            className="font-display text-[10px] tracking-[1px] text-white/60 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer"
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
          <span className="inline-flex mr-2 text-white/25 align-middle"><IconChevronDown size={10} rotated={open} /></span>
          {plan.title}
        </button>
        <span className="font-body text-[11px] text-white/60 shrink-0">
          {days.length > 1 ? `${days.length} giorni · ` : ''}{totalExercises} es.
        </span>
        {date && <span className="font-body text-[11px] text-white/60 shrink-0">{date}</span>}
        {!readonly && (
          <>
            <button
              onClick={onEdit}
              className="font-display text-[10px] tracking-[1px] bg-transparent border-none cursor-pointer shrink-0 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.color = color }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
            >
              MODIFICA
            </button>
            <button
              onClick={onDelete}
              aria-label="Elimina scheda"
              className="text-[11px] bg-transparent border-none cursor-pointer shrink-0 transition-colors"
              style={{ color: 'rgba(255,255,255,0.15)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.15)' }}
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* Dettaglio espanso */}
      {open && (
        <div className="px-3 pb-3 border-t border-white/[0.04]">
          {days.length > 1 && (
            <div className="mt-3 mb-3">
              <DayTabs days={days} activeDay={activeDay} onChange={setActiveDay} color={color} />
            </div>
          )}
          <div className="flex flex-col gap-1.5 mt-2">
            {(days[Math.min(activeDay, days.length - 1)]?.exercises ?? []).map((ex, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-display text-[10px] text-white/20 w-4 shrink-0">{i + 1}.</span>
                <span className="font-display font-bold text-[12px] text-white/55">{ex.name}</span>
                {ex.sets && <span className="font-display text-[11px] text-white/60">{ex.sets}×{ex.reps || '—'}</span>}
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
      <span className="font-display text-[10px] font-semibold tracking-[1px] text-white/60">{label}</span>
      <span className="font-display font-bold text-[12px] text-white/65">{value}</span>
    </div>
  )
}
