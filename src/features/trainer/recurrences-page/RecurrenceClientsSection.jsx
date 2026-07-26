import { SectionLabel, EmptyState } from '../../../components/ui'
import { sectionStyle } from './recurrenceDetailShared'

const ICON_CLIENTS = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

export function RecurrenceClientsSection({
  recurrenceId, isActive, recurrenceClients, hasCandidates, availableClients,
  clientSearch, onSearchChange, onAddClient, onRemoveClient,
}) {
  return (
    <section className="p-5" style={sectionStyle}>
      <SectionLabel>CLIENTI ({recurrenceClients.length})</SectionLabel>

      <div className="flex flex-col gap-1.5 mb-4">
        {recurrenceClients.length === 0 ? (
          <EmptyState icon={ICON_CLIENTS} title="Nessun cliente" description="Aggiungi un cliente a questa ricorrenza." />
        ) : recurrenceClients.map(c => (
          <div
            key={c.id}
            className="flex items-center justify-between px-3 py-2.5 rounded-[3px]"
            style={{ background: 'color-mix(in srgb, var(--rx-green) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-green) 15%, transparent)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 flex items-center justify-center rounded-[3px] shrink-0"
                style={{ background: 'color-mix(in srgb, var(--rx-green) 15%, transparent)' }}
              >
                <span className="font-display text-[10px]" style={{ color: 'var(--rx-green)' }}>
                  {c.name[0].toUpperCase()}
                </span>
              </div>
              <span className="font-display font-bold text-[13px] text-white/80">{c.name}</span>
            </div>
            {isActive && (
              <button
                onClick={() => onRemoveClient(recurrenceId, c.id)}
                className="font-display text-[10px] px-2.5 py-1 cursor-pointer border transition-all bg-transparent"
                style={{ borderRadius: '3px', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
              >
                RIMUOVI
              </button>
            )}
          </div>
        ))}
      </div>

      {isActive && hasCandidates && (
        <div>
          <div className="font-display text-[11px] font-semibold tracking-[2px] mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            AGGIUNGI CLIENTE
          </div>
          <input
            value={clientSearch}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Cerca per nome..."
            aria-label="Cerca cliente da aggiungere alla ricorrenza"
            className="input-base w-full mb-2"
            style={{ fontSize: 12 }}
          />
          {availableClients.length === 0 ? (
            <p className="font-body text-[12px] text-white/60">Nessun risultato.</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {availableClients.map(c => (
                <button
                  key={c.id}
                  onClick={() => onAddClient(recurrenceId, c.id)}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer border text-left transition-all rounded-[3px]"
                  style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--rx-green) 25%, transparent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  <span className="font-display font-bold text-[12px] text-white/60">{c.name}</span>
                  <span className="font-display text-[10px]" style={{ color: 'var(--rx-green)' }}>+ AGGIUNGI</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
