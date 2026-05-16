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
import { useRegisterContextMenu }        from '../../context/NavMenuContext'

const PAGE_SIZE = PAGINATION_PAGE_SIZE

const SORT_OPTIONS = [
  ['name',  'Nome A→Z'],
  ['rank',  'Rank'],
  ['level', 'Livello'],
]

const ICON_CLIENTS = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const ICON_NEW_CLIENT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/>
    <line x1="16" y1="11" x2="22" y2="11"/>
  </svg>
)

const CLIENTS_CTX = [{ id: '__new__', label: 'Nuovo', icon: ICON_NEW_CLIENT }]

export function ClientsPage({ orgId, clients = [], clientsLoading: loading = false, clientsError: error = null, onAddClient }) {
  const { moduleType } = useTrainerState()
  const isSoccer       = getModule(moduleType).isSoccer
  const { groups }     = useGroups(orgId)
  const { selectClient } = useTrainerNav()
  const filters          = useClientFilters(clients, groups, isSoccer)
  const [view, setView]  = useState('list')

  const ctxItems = view === 'list' ? CLIENTS_CTX : []
  useRegisterContextMenu('Clienti', ctxItems, null, id => { if (id === '__new__') setView('new') })

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
      />
    )
  }

  return (
    <div className="min-h-screen">

      {/* ── Intestazione + filtri ─────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-5 pb-3 flex flex-col gap-3">
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

        </div>
      </div>

      {/* ── Lista ─────────────────────────────────────────────────────────────── */}
      <main className="px-4 sm:px-6 pb-24">
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
            title={clients.length === 0 ? 'Nessun cliente' : 'Nessun risultato'}
            description={clients.length === 0
              ? 'Aggiungi il primo cliente per iniziare.'
              : 'Prova a cambiare i filtri di ricerca.'
            }
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
  )
}

function FilterRow({ label, children }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-display text-[9px] tracking-[2px] uppercase shrink-0 w-[52px] text-right" style={{ color: 'rgba(200,212,224,0.22)' }}>
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
        ? { background: 'rgba(15,214,90,0.12)', borderColor: 'rgba(15,214,90,0.35)', color: '#0fd65a' }
        : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
      }
    >
      {children}
    </button>
  )
}
