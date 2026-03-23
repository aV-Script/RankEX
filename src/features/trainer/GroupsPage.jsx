import { useState, useMemo, useCallback } from 'react'
import { useGroups }                      from '../../hooks/useGroups'
import { useClients }                     from '../../hooks/useClients'
import { usePagination }                  from '../../hooks/usePagination'
import { Pagination }                     from '../../components/common/Pagination'
import { GroupCard }                      from './groups-page/GroupCard'
import { GroupDetailView }                from './groups-page/GroupDetailView'
import { GroupsSidebar }                  from './groups-page/GroupSidebar'
import { Skeleton }                       from '../../components/common/Skeleton'
import { PAGINATION_PAGE_SIZE }           from '../../config/app.config'

const GROUPS_PAGE_SIZE = PAGINATION_PAGE_SIZE

export function GroupsPage({ trainerId }) {
  const { groups, loading, handleAddGroup, handleRenameGroup, handleToggleClient, handleDeleteGroup } = useGroups(trainerId)
  const { clients } = useClients(trainerId)

  const [view,         setView]         = useState('list') // 'list' | 'detail'
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupSearch,  setGroupSearch]  = useState('')
  const [showNew,      setShowNew]      = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  // ── Filtro e paginazione gruppi ───────────────────────────────────────────
  const filteredGroups = useMemo(() =>
    groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
  , [groups, groupSearch])

  const pagination = usePagination(filteredGroups, GROUPS_PAGE_SIZE)

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!newGroupName.trim()) return
    await handleAddGroup(newGroupName.trim())
    setNewGroupName('')
    setShowNew(false)
  }, [newGroupName, handleAddGroup])

  const handleSelectGroup = useCallback((group) => {
    setSelectedGroup(group)
    setView('detail')
  }, [])

  const handleBack = useCallback(() => {
    setView('list')
    setSelectedGroup(null)
  }, [])

  // Aggiorna selectedGroup quando i gruppi cambiano
  const currentGroup = useMemo(() =>
    selectedGroup ? groups.find(g => g.id === selectedGroup.id) ?? selectedGroup : null
  , [groups, selectedGroup])

  // ── Vista dettaglio ───────────────────────────────────────────────────────
  if (view === 'detail' && currentGroup) {
    return (
      <GroupDetailView
        group={currentGroup}
        clients={clients}
        onToggleClient={handleToggleClient}
        onRename={handleRenameGroup}
        onDelete={handleDeleteGroup}
        onBack={handleBack}
      />
    )
  }

  // ── Vista lista ───────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen">

      <GroupsSidebar
        groupSearch={groupSearch}
        setGroupSearch={setGroupSearch}
        onNewGroup={() => setShowNew(true)}
        totalGroups={groups.length}
      />

      <main className="flex-1 px-4 sm:px-6 py-6 min-w-0">

        {/* Header */}
        <div className="hidden lg:flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-black text-[24px] text-white m-0">
              I tuoi gruppi
            </h1>
            <p className="font-body text-white/30 text-[13px] m-0 mt-0.5">
              {loading
                ? '\u00a0'
                : `${filteredGroups.length} ${filteredGroups.length === 1 ? 'gruppo' : 'gruppi'}`
              }
            </p>
          </div>
        </div>

        {/* Mobile — ricerca + nuovo */}
        <div className="lg:hidden mb-5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display font-black text-[22px] text-white m-0">Gruppi</h1>
            <button
              onClick={() => setShowNew(true)}
              className="px-4 py-2 text-[11px] rounded-xl font-display tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}
            >
              NUOVO
            </button>
          </div>
          <input
            value={groupSearch}
            onChange={e => setGroupSearch(e.target.value)}
            placeholder="Cerca gruppo..."
            className="input-base w-full"
          />
        </div>

        {/* Form nuovo gruppo */}
        {showNew && (
          <div
            className="rounded-2xl p-4 mb-5 flex gap-3"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <input
              autoFocus
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  handleCreate()
                if (e.key === 'Escape') { setShowNew(false); setNewGroupName('') }
              }}
              placeholder="Nome gruppo..."
              className="input-base flex-1"
            />
            <button
              onClick={handleCreate}
              className="font-display text-[11px] px-4 py-2 rounded-xl cursor-pointer border-0 transition-opacity hover:opacity-85"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}
            >
              CREA
            </button>
            <button
              onClick={() => { setShowNew(false); setNewGroupName('') }}
              className="font-display text-[11px] px-4 py-2 rounded-xl cursor-pointer border border-white/10 bg-transparent text-white/40 hover:text-white/70 transition-all"
            >
              ANNULLA
            </button>
          </div>
        )}

        {/* Lista gruppi */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <Skeleton variant="card" count={6} />
          </div>
        ) : filteredGroups.length === 0 ? (
          <EmptyState>
            {groups.length === 0 ? 'Nessun gruppo. Creane uno!' : 'Nessun gruppo trovato.'}
          </EmptyState>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {pagination.paginatedItems.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  clients={clients}
                  onClick={() => handleSelectGroup(group)}
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