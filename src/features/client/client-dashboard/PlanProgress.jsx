import { getPlanProgress, normalizePlanDays } from '../../../utils/workoutPlans'
import { PLAN_COMPLETION_XP }                  from '../../../constants'
import { bySessionGender, DEFAULT_TERMINOLOGY } from '../../../config/modules.config'

/**
 * Avanzamento della scheda: sessioni svolte (dal calendario, a ogni presenza
 * registrata alla chiusura della sessione), barra se ci sono sessioni previste,
 * giorno consigliato per il prossimo allenamento. Usato da trainer e cliente.
 * showXP=false (moduli senza gamification) omette il bonus XP di fine scheda.
 * terminology: del modulo (vista trainer); l'area cliente usa il default.
 */
export function PlanProgress({ plan, color, showXP = true, terminology = DEFAULT_TERMINOLOGY }) {
  const { done, target, pct, completed, nextDayIndex } = getPlanProgress(plan)
  const sessionLabel  = terminology.session.toLowerCase()
  const sessionsLabel = terminology.sessions.toLowerCase()
  const doneLabel     = bySessionGender(terminology, done === 1 ? 'svolto' : 'svolti', done === 1 ? 'svolta' : 'svolte')
  const days    = normalizePlanDays(plan)
  const nextDay = days[nextDayIndex]?.label ?? `Giorno ${nextDayIndex + 1}`

  return (
    <div
      className="rounded-[3px] px-3 py-2.5 my-3"
      style={{ background: color + '0d', border: `1px solid ${color}26` }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="font-display text-[11px] font-bold text-white/75">
          {target
            ? `${terminology.session} ${Math.min(done, target)} di ${target}`
            : `${done} ${done === 1 ? sessionLabel : sessionsLabel} ${doneLabel}`}
          {target && done > target && <span className="text-white/40 font-normal"> · {done - target} in più</span>}
        </span>
        <span className="font-display text-[10px] tracking-[1px] uppercase" style={{ color }}>
          {completed
            ? (showXP ? `✓ Completata · +${PLAN_COMPLETION_XP} XP` : '✓ Completata')
            : `Prossimo: ${nextDay}`}
        </span>
      </div>
      {target && (
        <div
          className="h-1 rounded-full overflow-hidden mt-2"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(done, target)}
          aria-label="Avanzamento scheda"
        >
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
    </div>
  )
}
