import { InfoChip, sectionStyle, dateFmt } from './recurrenceDetailShared'

export function RecurrenceSummaryBar({ recurrence, clientsCount, weeks, statusInfo }) {
  return (
    <div
      className="px-5 py-4 flex flex-wrap gap-x-8 gap-y-3 rounded-[4px]"
      style={sectionStyle}
    >
      <InfoChip label="STATUS">
        <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
      </InfoChip>
      <InfoChip label="PERIODO">
        {dateFmt(recurrence.startDate)} → {dateFmt(recurrence.endDate)}
        {weeks != null && (
          <span className="font-body text-[11px] text-white/30 ml-2">({weeks} sett.)</span>
        )}
      </InfoChip>
      <InfoChip label="CLIENTI">
        <span style={{ color: 'var(--rx-accent)' }}>{clientsCount}</span>
      </InfoChip>
    </div>
  )
}
