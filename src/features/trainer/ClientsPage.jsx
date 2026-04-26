import { useState, useCallback }  from 'react'
import { useGroups }              from '../../hooks/useGroups'
import { useTrainerNav }          from './useTrainerNav'
import { useTrainerState }        from '../../context/TrainerContext'
import { getModule }              from '../../config/modules.config'
import { useClientFilters }       from './useClientFilters'
import { usePagination }          from '../../hooks/usePagination'
import { ClientCard }             from './clients-page/ClientCard'
import { FiltersSidebar }         from './clients-page/FiltersSidebar'
import { MobileControls }         from './clients-page/MobileControls'
import { Pagination }             from '../../components/common/Pagination'
import { NewClientView }          from './NewClientView'
import { Skeleton }               from '../../components/common/Skeleton'
import { EmptyState }             from '../../components/ui'
import { PAGINATION_PAGE_SIZE }  from '../../config/app.config'

const PAGE_SIZE = PAGINATION_PAGE_SIZE

const ICON_CLIENTS = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

export function ClientsPage({ orgId, clients = [], clientsLoading: loading = false, clientsError: error = null, onAddClient }) {
  const { moduleType }  = useTrainerState()
  const isSoccer        = getModule(moduleType).isSoccer
  const { groups }      = useGroups(orgId)
  const { selectClient }                             = useTrainerNav()
  const filters                                      = useClientFilters(clients, groups, isSoccer)
  const [view, setView]                              = useState('list')

  const pagination = usePagination(filters.filteredClients, PAGE_SIZE)

  const handleAdd    = useCallback(async (formData) => {
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
    <div className="flex min-h-screen">

      <FiltersSidebar
        {...filters}
        groups={groups}
        isSoccer={isSoccer}
        onNewClient={() => setView('new')}
      />

      <main className="flex-1 px-4 sm:px-6 py-6 min-w-0">

        {/* Titolo mobile */}
        <div className="lg:hidden mb-4">
          <h1 className="font-display font-black text-[22px] text-white m-0">I tuoi clienti</h1>
          {!loading && (
            <p className="font-body text-white/30 text-[13px] m-0 mt-0.5">
              {filters.filteredClients.length} {filters.filteredClients.length === 1 ? 'cliente' : 'clienti'}
            </p>
          )}
        </div>

        <MobileControls
          query={filters.query}
          onQueryChange={filters.onQueryChange}
          sortBy={filters.sortBy}
          onSortByChange={filters.onSortByChange}
          onNewClient={() => setView('new')}
        />

        {/* Header desktop */}
        <div className="hidden lg:flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-black text-[24px] text-white m-0">
              I tuoi clienti
            </h1>
            <p className="font-body text-white/30 text-[13px] m-0 mt-0.5">
              {loading
                ? ' '
                : `${filters.filteredClients.length} ${filters.filteredClients.length === 1 ? 'cliente' : 'clienti'}`
              }
            </p>
          </div>
        </div>

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
                <ClientCard
                  key={client.id}
                  client={client}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            <Pagination {...pagination} />
          </div>
        )}
      </main>
    </div>
  )
}
