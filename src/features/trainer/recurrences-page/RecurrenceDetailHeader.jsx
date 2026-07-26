import { dayLabels } from './recurrenceDetailShared'

export function RecurrenceDetailHeader({ recurrence }) {
  return (
    <div
      className="flex items-center justify-center px-4 sm:px-6 py-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="text-center min-w-0">
        <div className="font-display font-black text-[16px] text-white leading-tight">
          {dayLabels(recurrence.days)}
        </div>
        <div className="font-display text-[11px] mt-0.5" style={{ color: 'var(--rx-green)' }}>
          {recurrence.startTime} — {recurrence.endTime}
        </div>
      </div>
    </div>
  )
}
