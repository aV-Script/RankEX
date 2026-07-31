import { useState, useCallback }         from 'react'
import { useGroups }                      from '../../hooks/useGroups'
import { useTrainerNav }                  from './useTrainerNav'
import { useTrainerState }                from '../../context/TrainerContext'
import { getModule }                      from '../../config/modules.config'
import { PLAYER_ROLES, SOCCER_AGE_GROUPS } from '../../config/modules.config'
import { useClientFilters }              from './useClientFilters'
import { usePagination }                 from '../../hooks/usePagination'
import { ClientCard }                    from './clients-page/ClientCard'
import { Pagination }                    from '../../components/common/Pagination'
import { NewClientView }                 from './NewClientView'
import { Skeleton }                      from '../../components/common/Skeleton'
import { EmptyState }                    from '../../components/ui'
import { PAGINATION_PAGE_SIZE }          from '../../config/app.config'

const PAGE_SIZE = PAGINATION_PAGE_SIZE

const SORT_OPTIONS = [
  ['name',  'Nome A→Z'],
  ['rank',  'Rank'],
  ['level', 'Livello'],
]

const ICON_CLIENTS = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

export function ClientsPage({ orgId, clients = [], clientsLoading: loading = false, clientsError: error = null, onAddClient, onNavigate }) {
  const { moduleType, terminology } = useTrainerState()
  const isSoccer       = getModule(moduleType).isSoccer
  const { groups }     = useGroups(orgId)
  const { selectClient } = useTrainerNav()
  const filters          = useClientFilters(clients, groups, isSoccer)
  const [view, setView]  = useState('list')

  const pagination = usePagination(filters.filteredClients, PAGE_SIZE)

  const handleAdd = useCallback(async (formData) => {
    const newClient = await onAddClient(formData)
    if (newClient) selectClient(newClient)
    return newClient
  }, [onAddClient, selectClient])

  const handleSelect = useCallback((client) => selectClient(client), [selectClient])

  if (view === 'new') {
    return (
      <NewClientView
        orgId={orgId}
        onAdd={handleAdd}
        onBack={() => setView('list')}
        clients={clients}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div className="min-h-screen lg:flex">

      {/* ── Sidebar filtri — solo desktop ────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-white/[.05] p-6 gap-5 sticky top-0 h-screen overflow-y-auto">
        <button
          onClick={() => setView('new')}
          className="rx-btn-primary font-display text-[11px] tracking-[1.5px] py-2.5 px-4 rounded-[3px] cursor-pointer"
        >
          + NUOVO {terminology.client.toUpperCase()}
        </button>

        <SidebarSection label="Ricerca">
          <input
            placeholder="Cerca per nome..."
            value={filters.query}
            onChange={e => filters.onQueryChange(e.target.value)}
            className="input-base input-compact w-full"
          />
        </SidebarSection>

        <SidebarSection label="Ordina">
          {SORT_OPTIONS.map(([val, label]) => (
            <FilterChip key={val} active={filters.sortBy === val} onClick={() => filters.onSortByChange(val)}>
              {label}
            </FilterChip>
          ))}
        </SidebarSection>

        {filters.categorie.length > 1 && (
          <SidebarSection label={isSoccer ? 'Ruolo' : 'Categoria'}>
            {filters.categorie.map(val => {
              const label = isSoccer && val !== 'tutti'
                ? (PLAYER_ROLES.find(r => r.value === val)?.label ?? val)
                : val.charAt(0).toUpperCase() + val.slice(1)
              return (
                <FilterChip key={val} active={filters.filterCategoria === val} onClick={() => filters.onCategoriaChange(val)}>
                  {label}
                </FilterChip>
              )
            })}
          </SidebarSection>
        )}

        {isSoccer && filters.fasce.length > 1 && (
          <SidebarSection label="Fascia">
            {filters.fasce.map(val => {
              const label = val === 'tutti'
                ? 'Tutti'
                : (SOCCER_AGE_GROUPS.find(g => g.value === val)?.label ?? val)
              return (
                <FilterChip key={val} active={filters.filterFascia === val} onClick={() => filters.onFasciaChange(val)}>
                  {label}
                </FilterChip>
              )
            })}
          </SidebarSection>
        )}

        {groups.length > 0 && (
          <SidebarSection label={terminology.group}>
            <FilterChip active={filters.filterGroup === null} onClick={() => filters.onGroupChange(null)}>
              Tutti
            </FilterChip>
            {groups.map(g => (
              <FilterChip key={g.id} active={filters.filterGroup === g.id} onClick={() => filters.onGroupChange(g.id)}>
                {g.name} <span className="opacity-40">({g.clientIds.length})</span>
              </FilterChip>
            ))}
          </SidebarSection>
        )}
      </aside>

      <div className="flex-1 min-w-0">

        {/* ── Intestazione + filtri — solo mobile/tablet ─────────────────────── */}
        <div className="lg:hidden px-4 sm:px-6 pt-5 pb-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              placeholder="Cerca per nome..."
              value={filters.query}
              onChange={e => filters.onQueryChange(e.target.value)}
              className="input-base input-compact flex-1"
            />
            <button
              onClick={() => setView('new')}
              className="rx-btn-primary font-display text-[10px] tracking-[1.5px] py-1.5 px-3 rounded-[3px] cursor-pointer shrink-0"
            >
              + NUOVO
            </button>
          </div>

          <div className="flex flex-col gap-2">

            <FilterRow label="Ordina">
              {SORT_OPTIONS.map(([val, label]) => (
                <FilterChip key={val} active={filters.sortBy === val} onClick={() => filters.onSortByChange(val)}>
                  {label}
                </FilterChip>
              ))}
            </FilterRow>

            {filters.categorie.length > 1 && (
              <FilterRow label={isSoccer ? 'Ruolo' : 'Categoria'}>
                {filters.categorie.map(val => {
                  const label = isSoccer && val !== 'tutti'
                    ? (PLAYER_ROLES.find(r => r.value === val)?.label ?? val)
                    : val.charAt(0).toUpperCase() + val.slice(1)
                  return (
                    <FilterChip key={val} active={filters.filterCategoria === val} onClick={() => filters.onCategoriaChange(val)}>
                      {label}
                    </FilterChip>
                  )
                })}
              </FilterRow>
            )}

            {isSoccer && filters.fasce.length > 1 && (
              <FilterRow label="Fascia">
                {filters.fasce.map(val => {
                  const label = val === 'tutti'
                    ? 'Tutti'
                    : (SOCCER_AGE_GROUPS.find(g => g.value === val)?.label ?? val)
                  return (
                    <FilterChip key={val} active={filters.filterFascia === val} onClick={() => filters.onFasciaChange(val)}>
                      {label}
                    </FilterChip>
                  )
                })}
              </FilterRow>
            )}

            {groups.length > 0 && (
              <FilterRow label={terminology.group}>
                <FilterChip active={filters.filterGroup === null} onClick={() => filters.onGroupChange(null)}>
                  Tutti
                </FilterChip>
                {groups.map(g => (
                  <FilterChip key={g.id} active={filters.filterGroup === g.id} onClick={() => filters.onGroupChange(g.id)}>
                    {g.name} <span className="opacity-40">({g.clientIds.length})</span>
                  </FilterChip>
                ))}
              </FilterRow>
            )}

          </div>
        </div>

        {/* ── Lista ───────────────────────────────────────────────────────────── */}
        <main className="px-4 sm:px-6 pb-24 lg:pt-6">
          {error && (
            <div className="rounded-[3px] px-4 py-2.5 bg-red-500/10 border border-red-400/20 mb-4">
              <p className="text-red-400 font-body text-[13px] m-0">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <Skeleton variant="card" count={6} />
            </div>
          ) : filters.filteredClients.length === 0 ? (
            <EmptyState
              icon={ICON_CLIENTS}
              title={clients.length === 0 ? `Nessun ${terminology.client.toLowerCase()}` : 'Nessun risultato'}
              description={clients.length === 0
                ? `Aggiungi il primo ${terminology.client.toLowerCase()} per iniziare.`
                : 'Prova a cambiare i filtri di ricerca.'
              }
              action={clients.length === 0 ? { label: `Aggiungi ${terminology.client.toLowerCase()}`, onClick: onAddClient } : undefined}
            />
          ) : (
            <div className="rx-animate-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {pagination.paginatedItems.map(client => (
                  <ClientCard key={client.id} client={client} onSelect={handleSelect} />
                ))}
              </div>
              <Pagination {...pagination} />
            </div>
          )}
        </main>

      </div>
    </div>
  )
}

function SidebarSection({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-[9px] tracking-[2px] uppercase" style={{ color: 'rgba(200,212,224,0.22)' }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterRow({ label, children }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-display text-[9px] tracking-[2px] uppercase shrink-0 whitespace-nowrap" style={{ color: 'rgba(200,212,224,0.22)' }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="rounded-[3px] px-2.5 py-1 font-display text-[10px] tracking-wide cursor-pointer border transition-all whitespace-nowrap"
      style={active
        ? { background: 'color-mix(in srgb, var(--rx-accent) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--rx-accent) 35%, transparent)', color: 'var(--rx-accent)' }
        : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
      }
    >
      {children}
    </button>
  )
}
