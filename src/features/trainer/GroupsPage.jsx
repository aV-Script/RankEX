import { useState, useMemo, useCallback } from 'react'
import { useGroups }                      from '../../hooks/useGroups'
import { useClients }                     from '../../hooks/useClients'
import { usePagination }                  from '../../hooks/usePagination'
import { Pagination }                     from '../../components/common/Pagination'
import { GroupCard }                      from './groups-page/GroupCard'
import { GroupDetailView }                from './groups-page/GroupDetailView'
import { Skeleton }                       from '../../components/common/Skeleton'
import { EmptyState }                     from '../../components/ui'
import { PAGINATION_PAGE_SIZE }           from '../../config/app.config'
import { useRegisterContextMenu }         from '../../context/NavMenuContext'

const GROUPS_PAGE_SIZE = PAGINATION_PAGE_SIZE

const ICON_NEW_GROUP = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
)

const GROUPS_CTX = [{ id: '__new__', label: 'Nuovo', icon: ICON_NEW_GROUP }]

export function GroupsPage({ orgId }) {
  const { groups, isLoading, handleAddGroup, handleRenameGroup, handleToggleClient, handleDeleteGroup } = useGroups(orgId)
  const { clients } = useClients(orgId)

  const [view,          setView]          = useState('list')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupSearch,   setGroupSearch]   = useState('')
  const [showNew,       setShowNew]       = useState(false)
  const [newGroupName,  setNewGroupName]  = useState('')

  const ctxItems = view === 'list' ? GROUPS_CTX : []
  useRegisterContextMenu('Gruppi', ctxItems, null, id => { if (id === '__new__') setShowNew(true) })

  const filteredGroups = useMemo(() =>
    groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
  , [groups, groupSearch])

  const pagination = usePagination(filteredGroups, GROUPS_PAGE_SIZE)

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

  const currentGroup = useMemo(() =>
    selectedGroup ? groups.find(g => g.id === selectedGroup.id) ?? selectedGroup : null
  , [groups, selectedGroup])

  if (view === 'detail' && currentGroup) {
    return (
      <GroupDetailView
        group={currentGroup}
        clients={clients}
        orgId={orgId}
        onToggleClient={handleToggleClient}
        onRename={handleRenameGroup}
        onDelete={handleDeleteGroup}
        onBack={handleBack}
      />
    )
  }

  return (
    <div className="min-h-screen">

      {/* ── Intestazione + ricerca ────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-5 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-black text-[22px] sm:text-[24px] text-white m-0">
            I tuoi gruppi
          </h1>
          <div className="flex items-center gap-3">
            {!isLoading && (
              <span className="font-display text-[11px] text-white/30">
                {filteredGroups.length}{' '}
                {filteredGroups.length === 1 ? 'gruppo' : 'gruppi'}
              </span>
            )}
            <button
              onClick={() => setShowNew(true)}
              className="rx-btn-primary font-display text-[10px] tracking-[1.5px] py-1.5 px-3 rounded-[3px] cursor-pointer"
            >
              + NUOVO
            </button>
          </div>
        </div>

        <input
          value={groupSearch}
          onChange={e => setGroupSearch(e.target.value)}
          placeholder="Cerca gruppo..."
          className="input-base w-full"
        />
      </div>

      {/* ── Form nuovo gruppo ─────────────────────────────────────────────────── */}
      {showNew && (
        <div
          className="mx-4 sm:mx-6 mb-3 rounded-[4px] p-4 flex gap-3"
          style={{ background: 'rgba(15,214,90,0.06)', border: '1px solid rgba(15,214,90,0.15)' }}
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
            className="font-display text-[11px] px-4 py-2 rounded-[3px] cursor-pointer border-0 transition-opacity hover:opacity-85"
            style={{ background: 'rgba(15,214,90,0.07)', border: '1px solid rgba(15,214,90,0.35)', color: '#0fd65a' }}
          >
            CREA
          </button>
          <button
            onClick={() => { setShowNew(false); setNewGroupName('') }}
            className="font-display text-[11px] px-4 py-2 rounded-[3px] cursor-pointer border border-white/10 bg-transparent text-white/40 hover:text-white/70 transition-all"
          >
            ANNULLA
          </button>
        </div>
      )}

      {/* ── Lista gruppi ──────────────────────────────────────────────────────── */}
      <main className="px-4 sm:px-6 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <Skeleton variant="card" count={6} />
          </div>
        ) : filteredGroups.length === 0 ? (
          <EmptyState
            icon={ICON_NEW_GROUP}
            title={groups.length === 0 ? 'Nessun gruppo' : 'Nessun risultato'}
            description={groups.length === 0
              ? 'Crea il primo gruppo per organizzare i clienti.'
              : 'Prova a cambiare il termine di ricerca.'
            }
          />
        ) : (
          <div className="rx-animate-in">
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
          </div>
        )}
      </main>

    </div>
  )
}
