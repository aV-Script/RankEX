import { useState, useCallback }  from 'react'
import { useClients }             from '../../hooks/useClients'
import { useGroups }              from '../../hooks/useGroups'
import { useTrainerNav }          from './useTrainerNav'
import { useClientFilters }       from './useClientFilters'
import { usePagination }          from '../../hooks/usePagination'
import { ClientCard }             from './clients-page/ClientCard'
import { FiltersSidebar }         from './clients-page/FiltersSidebar'
import { MobileControls }         from './clients-page/MobileControls'
import { Pagination }             from '../../components/common/Pagination'
import { NewClientView }          from './NewClientView'
import { Skeleton }               from '../../components/common/Skeleton'
import { PAGINATION_PAGE_SIZE }  from '../../config/app.config'

const PAGE_SIZE = PAGINATION_PAGE_SIZE

export function ClientsPage({ trainerId }) {
  const { clients, loading, error, handleAddClient } = useClients(trainerId)
  const { groups }                                   = useGroups(trainerId)
  const { selectClient }                             = useTrainerNav()
  const filters                                      = useClientFilters(clients, groups)
  const [view, setView]                              = useState('list')

  const pagination = usePagination(filters.displayed, PAGE_SIZE)

  const handleAdd    = useCallback(async (formData) => {
    const newClient = await handleAddClient(formData)
    if (newClient) selectClient(newClient)
    return newClient
  }, [handleAddClient, selectClient])

  const handleSelect = useCallback((client) => selectClient(client), [selectClient])

  if (view === 'new') {
    return (
      <NewClientView
        trainerId={trainerId}
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
        onNewClient={() => setView('new')}
      />

      <main className="flex-1 px-4 sm:px-6 py-6 min-w-0">

        <MobileControls
          query={filters.query}
          setQuery={filters.setQuery}
          sortBy={filters.sortBy}
          setSortBy={filters.setSortBy}
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
                ? '\u00a0'
                : `${filters.displayed.length} ${filters.displayed.length === 1 ? 'cliente' : 'clienti'}`
              }
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-2.5 bg-red-500/10 border border-red-400/20 mb-4">
            <p className="text-red-400 font-body text-[13px] m-0">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <Skeleton variant="card" count={6} />
          </div>
        ) : filters.displayed.length === 0 ? (
          <EmptyState>
            {clients.length === 0 ? 'Nessun cliente. Aggiungine uno!' : 'Nessun risultato.'}
          </EmptyState>
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  )
}

function EmptyState({ children }) {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="font-body text-white/20 text-[15px]">{children}</span>
    </div>
  )
}