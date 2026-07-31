import { IconChevronLeft, IconDelete } from '../../../components/ui/icons'
import { dayLabels }                   from './recurrenceDetailShared'

export function RecurrenceDetailHeader({ recurrence, onBack, isActive, onRequestCancel }) {
  return (
    <div
      className="flex items-center px-4 sm:px-6 py-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <button
        onClick={onBack}
        aria-label="Torna alle ricorrenze"
        className="w-10 shrink-0 flex items-center justify-center bg-transparent border-none text-white/40 hover:text-white/70 transition-colors cursor-pointer"
      >
        <IconChevronLeft />
      </button>
      <div className="flex-1 text-center min-w-0">
        <div className="font-display font-black text-[16px] text-white leading-tight">
          {dayLabels(recurrence.days)}
        </div>
        <div className="font-display text-[11px] mt-0.5" style={{ color: 'var(--rx-accent)' }}>
          {recurrence.startTime} — {recurrence.endTime}
        </div>
      </div>
      {isActive ? (
        <button
          onClick={onRequestCancel}
          aria-label="Cancella ricorrenza"
          className="w-10 shrink-0 flex items-center justify-center bg-transparent border-none transition-opacity cursor-pointer opacity-60 hover:opacity-100"
          style={{ color: '#f87171' }}
        >
          <IconDelete />
        </button>
      ) : (
        // Spacer per bilanciare il bottone indietro e mantenere il titolo centrato
        <div className="w-10 shrink-0" aria-hidden="true" />
      )}
    </div>
  )
}
