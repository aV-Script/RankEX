/**
 * Barra di progresso e titolo dello step corrente.
 */
export function WizardProgress({ step, totalSteps, title, progressPct }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-display text-[11px] text-white/40">{title}</span>
        <span className="font-display text-[11px] text-white/25">
          Step {step + 1} di {totalSteps}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #0fd65a, #00c8ff)' }}
        />
      </div>
    </div>
  )
}