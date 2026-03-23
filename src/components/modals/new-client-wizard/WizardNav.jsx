import { Button } from '../../ui'

/**
 * Navigazione wizard — bottoni indietro e avanti/crea.
 */
export function WizardNav({ step, isLastStep, loading, onPrev, onNext, onSubmit }) {
  return (
    <div className={`flex gap-3 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
      {step > 0 && (
        <button
          onClick={onPrev}
          className="bg-transparent border border-white/10 rounded-xl px-5 py-3 text-white/50 font-display text-[12px] cursor-pointer hover:text-white/70 transition-colors"
        >
          ‹ INDIETRO
        </button>
      )}
      {isLastStep ? (
        <Button variant="primary" className="flex-1" loading={loading} onClick={onSubmit}>
          CREA CLIENTE
        </Button>
      ) : (
        <Button variant="primary" className="flex-1" onClick={onNext}>
          AVANTI ›
        </Button>
      )}
    </div>
  )
}