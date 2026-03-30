import { SectionLabel }  from '../../../components/ui'
import { ClientCalendar } from '../ClientCalendar'

/**
 * Riepilogo sessioni del cliente — vista trainer.
 * Mostra il calendario con lo stato delle sessioni pianificate
 * e completate per il cliente selezionato.
 */
export function ClientSessionsSummary({ clientId, sessionsPerWeek }) {
  return (
    <section className="px-6 py-6">
      <div
        className="rounded-[4px] p-5 rx-card"
      >
        <SectionLabel>◈ Calendario allenamenti</SectionLabel>
        <ClientCalendar
          clientId={clientId}
          sessionsPerWeek={sessionsPerWeek}
        />
      </div>
    </section>
  )
}