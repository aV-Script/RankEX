import { SectionLabel } from '../../../components/ui'
import { WEEK_DAYS, sectionStyle, EditBtn, WarningNote, ActionRow } from './recurrenceDetailShared'

export function RecurrenceScheduleSection({
  recurrence, isActive, saving,
  editingTime, onStartEditTime, startTime, setStartTime, endTime, setEndTime, onSaveTime, onCancelTime,
  editingDays, onStartEditDays, days, setDays, onSaveDays, onCancelDays,
}) {
  return (
    <div className="grid md:grid-cols-2 gap-5">

      {/* Orario */}
      <section className="p-5" style={sectionStyle}>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel className="mb-0">ORARIO</SectionLabel>
          {isActive && !editingTime && (
            <EditBtn onClick={onStartEditTime} />
          )}
        </div>

        {editingTime ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-display text-[11px] font-semibold text-white/30 tracking-[2px] block mb-1.5">INIZIO</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="input-base w-full" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="font-display text-[11px] font-semibold text-white/30 tracking-[2px] block mb-1.5">FINE</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="input-base w-full" style={{ colorScheme: 'dark' }} />
              </div>
            </div>
            <WarningNote text="La modifica aggiorna tutti gli slot futuri collegati." />
            <ActionRow
              onCancel={onCancelTime}
              onSave={onSaveTime}
              saving={saving}
            />
          </div>
        ) : (
          <div className="font-display font-black text-[24px]" style={{ color: 'var(--rx-green)' }}>
            {recurrence.startTime} → {recurrence.endTime}
          </div>
        )}
      </section>

      {/* Giorni */}
      <section className="p-5" style={sectionStyle}>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel className="mb-0">GIORNI</SectionLabel>
          {isActive && !editingDays && (
            <EditBtn onClick={onStartEditDays} />
          )}
        </div>

        {editingDays ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {WEEK_DAYS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDays(prev =>
                    prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
                  )}
                  aria-pressed={days.includes(value)}
                  className="w-10 h-10 font-display text-[11px] cursor-pointer border transition-all"
                  style={days.includes(value)
                    ? { background: 'color-mix(in srgb, var(--rx-green) 15%, transparent)', borderColor: 'var(--rx-green)', color: '#fff', borderRadius: '4px' }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', borderRadius: '4px' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <WarningNote text="La modifica dei giorni non aggiorna gli slot esistenti." />
            <ActionRow
              onCancel={onCancelDays}
              onSave={onSaveDays}
              saving={saving}
              saveDisabled={days.length === 0}
            />
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {WEEK_DAYS.filter(({ value }) => recurrence.days.includes(value)).map(({ label }) => (
              <span
                key={label}
                className="font-display text-[11px] px-3 py-1.5 rounded-[3px]"
                style={{ background: 'color-mix(in srgb, var(--rx-green) 12%, transparent)', color: 'var(--rx-green)' }}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
