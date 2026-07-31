import { Button } from '../../ui'
import { IconChevronLeft } from '../../ui/icons'

/**
 * Navigazione wizard — bottoni indietro e avanti/crea.
 */
export function WizardNav({ step, isLastStep, loading, onPrev, onNext, onSubmit }) {
  return (
    <div className={`flex gap-3 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
      {step > 0 && (
        <Button variant="neutral" onClick={onPrev} className="flex items-center gap-1.5">
          <IconChevronLeft size={12} /> INDIETRO
        </Button>
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