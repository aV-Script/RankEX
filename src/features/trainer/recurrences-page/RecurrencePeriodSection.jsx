import { SectionLabel } from '../../../components/ui'
import { sectionStyle, dateFmt, ActionRow } from './recurrenceDetailShared'

export function RecurrencePeriodSection({
  recurrence, isActive, weeks, saving,
  editingEnd, onStartEditEnd, newEndDate, setNewEndDate, onSaveEnd, onCancelEnd,
}) {
  return (
    <section className="p-5" style={sectionStyle}>
      <div className="flex items-center justify-between mb-4">
        <SectionLabel className="mb-0">PERIODO</SectionLabel>
        {isActive && !editingEnd && (
          <button
            onClick={onStartEditEnd}
            className="font-display text-[10px] text-white/30 cursor-pointer hover:text-white/60 bg-transparent border-none"
          >
            ESTENDI
          </button>
        )}
      </div>

      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-display font-black text-[16px] text-white/80">
          {dateFmt(recurrence.startDate)}
        </span>
        <span className="text-white/25 text-[14px]">→</span>
        <span className="font-display font-black text-[16px] text-white/80">
          {dateFmt(recurrence.endDate)}
        </span>
        {weeks != null && (
          <span className="font-body text-[12px] text-white/30 ml-1">{weeks} settimane</span>
        )}
      </div>

      {editingEnd && (
        <div className="flex flex-col gap-3 mt-4">
          <div>
            <label className="font-display text-[11px] font-semibold text-white/30 tracking-[2px] block mb-1.5">NUOVA DATA FINE</label>
            <input
              type="date" value={newEndDate} min={recurrence.endDate}
              onChange={e => setNewEndDate(e.target.value)}
              className="input-base w-full" style={{ colorScheme: 'dark' }}
            />
          </div>
          <ActionRow
            onCancel={onCancelEnd}
            onSave={onSaveEnd}
            saving={saving}
            saveLabel="ESTENDI"
            saveDisabled={!newEndDate || newEndDate <= recurrence.endDate}
          />
        </div>
      )}
    </section>
  )
}
