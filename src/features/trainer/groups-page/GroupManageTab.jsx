import { Pagination } from '../../../components/common/Pagination'
import { EmptyState, SectionLabel } from '../../../components/ui'

const ICON_EMPTY_CLIENTS = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
)

/**
 * Tab "Gestione" del hub gruppo — tre colonne: atleti nel gruppo, riepilogo,
 * atleti da aggiungere. Estratto da GroupDetailView.jsx (RX-07).
 */
export function GroupManageTab({
  clientsInGroup, totalClients, clientsNotInGroupCount,
  clientSearch, onSearchChange,
  inGroupPagination, notInGroupPagination,
  toggling, onRequestToggle,
}) {
  return (
    <div className="px-4 sm:px-6 pt-4 pb-12 flex flex-col gap-4">

      {/* Tre colonne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Col 1: Nel gruppo */}
        <div className="rounded-[4px] p-5 rx-card">
          <SectionLabel className="mb-5">
            ◈ Nel gruppo <span className="text-white/60 ml-1">({clientsInGroup.length})</span>
          </SectionLabel>
          {inGroupPagination.paginatedItems.length === 0 ? (
            <EmptyState
              icon={ICON_EMPTY_CLIENTS}
              title={clientSearch ? 'Nessun risultato' : 'Nessun atleta nel gruppo'}
              description={clientSearch ? undefined : 'Aggiungi atleti dalla colonna destra.'}
            />
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {inGroupPagination.paginatedItems.map(c => (
                  <ClientRow key={c.id} client={c} inGroup loading={toggling === c.id} onToggle={() => onRequestToggle(c, true)} />
                ))}
              </div>
              <Pagination {...inGroupPagination} />
            </>
          )}
        </div>

        {/* Col 2: Riepilogo gruppo */}
        <div className="rounded-[4px] p-5 rx-card">
          <SectionLabel className="mb-5">◈ Riepilogo</SectionLabel>
          <div className="flex flex-col gap-2 mb-4">
            <ManageStat label="Nel gruppo"    value={clientsInGroup.length}                 color="var(--rx-accent)" />
            <ManageStat label="Disponibili"   value={totalClients - clientsInGroup.length}  />
            <ManageStat label="Totale atleti" value={totalClients}                          />
          </div>
          {clientsInGroup.length < 2 && (
            <div
              className="px-3 py-3 rounded-[3px] font-body text-[12px] text-white/35 leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {clientsInGroup.length === 0
                ? 'Aggiungi almeno 2 atleti per sbloccare Classifica, Analisi e Confronto.'
                : 'Aggiungi un altro atleta per sbloccare Classifica, Analisi e Confronto.'}
            </div>
          )}
        </div>

        {/* Col 3: Da aggiungere */}
        <div className="rounded-[4px] p-5 rx-card">
          <SectionLabel color="rgba(255,255,255,0.3)" className="mb-3">
            ◈ Da aggiungere <span className="text-white/60 ml-1">({clientsNotInGroupCount})</span>
          </SectionLabel>
          <input
            value={clientSearch}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Cerca per nome..."
            aria-label="Cerca atleta da aggiungere"
            className="input-base w-full mb-4"
          />
          {notInGroupPagination.paginatedItems.length === 0 ? (
            <EmptyState
              icon={ICON_EMPTY_CLIENTS}
              title={clientSearch ? 'Nessun risultato' : 'Tutti nel gruppo'}
              description={clientSearch ? undefined : 'Tutti gli atleti sono già in questo gruppo.'}
            />
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {notInGroupPagination.paginatedItems.map(c => (
                  <ClientRow key={c.id} client={c} inGroup={false} loading={toggling === c.id} onToggle={() => onRequestToggle(c, false)} />
                ))}
              </div>
              <Pagination {...notInGroupPagination} />
            </>
          )}
        </div>

      </div>

    </div>
  )
}

function ClientRow({ client, inGroup, loading, onToggle }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-[3px] transition-all"
      style={inGroup
        ? { background: 'color-mix(in srgb, var(--rx-accent) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-accent) 15%, transparent)' }
        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }
      }
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-[3px] flex items-center justify-center shrink-0"
          style={inGroup ? { background: 'color-mix(in srgb, var(--rx-accent) 15%, transparent)' } : { background: 'rgba(255,255,255,0.05)' }}
        >
          <span className="font-display text-[11px]" style={{ color: inGroup ? 'var(--rx-accent)' : 'rgba(255,255,255,0.35)' }}>
            {client.name?.[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <div className="font-display font-bold text-[13px] text-white/80">{client.name}</div>
          {client.rank && (
            <div className="font-display text-[10px] text-white/30 mt-0.5">
              {client.rank} · Lv.{client.level}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={loading}
        className="font-display text-[10px] px-3 py-1.5 rounded-[3px] cursor-pointer border transition-all disabled:opacity-40"
        style={inGroup
          ? { color: '#f87171', borderColor: 'rgba(248,113,113,0.2)', background: 'transparent' }
          : { color: 'var(--rx-accent)', borderColor: 'color-mix(in srgb, var(--rx-accent) 20%, transparent)',   background: 'color-mix(in srgb, var(--rx-accent) 6%, transparent)' }
        }
      >
        {loading ? '...' : inGroup ? 'RIMUOVI' : 'AGGIUNGI'}
      </button>
    </div>
  )
}

function ManageStat({ label, value, color }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-[3px]"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="font-display text-[10px] tracking-[1px] text-white/30">{label}</span>
      <span className="font-display font-black text-[16px]" style={{ color: color ?? 'rgba(255,255,255,0.55)' }}>
        {value}
      </span>
    </div>
  )
}
