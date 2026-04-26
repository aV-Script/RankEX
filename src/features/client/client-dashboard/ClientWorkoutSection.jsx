import { useState, useEffect }                from 'react'
import { SectionLabel, EmptyState }          from '../../../components/ui'
import { getWorkoutPlanForClient }           from '../../../firebase/services/workoutPlans'

/**
 * Sezione scheda allenamento nella dashboard cliente.
 * Mostra la scheda attiva assegnata (read-only), con supporto multi-giorno.
 */
export function ClientWorkoutSection({ orgId, clientId, color }) {
  const [plan,      setPlan]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [activeDay, setActiveDay] = useState(0)

  useEffect(() => {
    if (!orgId || !clientId) return
    getWorkoutPlanForClient(orgId, clientId).then(active => {
      setPlan(active)
      setLoading(false)
    })
  }, [orgId, clientId])

  if (loading) return null
  if (!plan) return (
    <section className="px-4 py-6">
      <div className="rounded-[4px] p-5 rx-card">
        <SectionLabel className="mb-2">◈ Scheda allenamento</SectionLabel>
        <EmptyState
          color={color}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="6" y1="20" x2="18" y2="20"/></svg>}
          title="Nessuna scheda assegnata"
          description="Il tuo trainer non ha ancora assegnato una scheda di allenamento."
        />
      </div>
    </section>
  )

  // Normalizza: supporta sia il vecchio formato exercises[] che il nuovo days[]
  const days = plan.days?.length
    ? plan.days
    : [{ label: 'Giorno 1', exercises: plan.exercises ?? [] }]

  const safeDay  = Math.min(activeDay, days.length - 1)
  const day      = days[safeDay]
  const exercises = day?.exercises ?? []

  return (
    <section className="px-4 py-6">
      <div className="rounded-[4px] p-5 rx-card">
        <SectionLabel className="mb-4">◈ Scheda allenamento</SectionLabel>

        <h3 className="font-display font-bold text-[16px] text-white mb-1">{plan.title}</h3>
        {plan.description && (
          <p className="font-body text-[13px] text-white/40 mb-3 m-0 leading-relaxed">
            {plan.description}
          </p>
        )}

        {/* Tab giorni — solo se più di uno */}
        {days.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mb-4 mt-2">
            {days.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
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

        <div className="flex flex-col gap-2 mt-2">
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
      </div>
    </section>
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
