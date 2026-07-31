import { ProgressTrack } from '../../ui/XPBar'

/**
 * Barra di progresso e titolo dello step corrente.
 */
export function WizardProgress({ step, totalSteps, title, progressPct }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-display text-[11px] text-white/40">{title}</span>
        <span className="font-display text-[11px] text-white/60">
          Step {step + 1} di {totalSteps}
        </span>
      </div>
      <ProgressTrack
        pct={progressPct}
        color="var(--rx-gradient)"
        trackColor="rgba(255,255,255,0.06)"
        height="h-1"
        duration="duration-300"
      />
    </div>
  )
}