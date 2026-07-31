import { useState, useMemo, useCallback } from 'react'
import { useGroups }                      from '../../hooks/useGroups'
import { useClients }                     from '../../hooks/useClients'
import { usePagination }                  from '../../hooks/usePagination'
import { useTrainerState }                from '../../context/TrainerContext'
import { Pagination }                     from '../../components/common/Pagination'
import { GroupCard }                      from './groups-page/GroupCard'
import { GroupDetailView }                from './groups-page/GroupDetailView'
import { Skeleton }                       from '../../components/common/Skeleton'
import { EmptyState, Button }             from '../../components/ui'
import { PAGINATION_PAGE_SIZE }           from '../../config/app.config'

const GROUPS_PAGE_SIZE = PAGINATION_PAGE_SIZE

const ICON_NEW_GROUP = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
)

export function GroupsPage({ orgId }) {
  const { groups, isLoading, handleAddGroup, handleRenameGroup, handleToggleClient, handleDeleteGroup } = useGroups(orgId)
  const { clients } = useClients(orgId)
  const { terminology } = useTrainerState()

  const [view,          setView]          = useState('list')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupSearch,   setGroupSearch]   = useState('')
  const [showNew,       setShowNew]       = useState(false)
  const [newGroupName,  setNewGroupName]  = useState('')
  const [creating,      setCreating]      = useState(false)

  const filteredGroups = useMemo(() =>
    groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
  , [groups, groupSearch])

  const pagination = usePagination(filteredGroups, GROUPS_PAGE_SIZE)

  const handleCreate = useCallback(async () => {
    if (!newGroupName.trim() || creating) return
    setCreating(true)
    try {
      await handleAddGroup(newGroupName.trim())
      setNewGroupName('')
      setShowNew(false)
    } finally {
      setCreating(false)
    }
  }, [newGroupName, creating, handleAddGroup])

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
        terminology={terminology}
      />
    )
  }

  return (
    <div className="min-h-screen">

      {/* ── Intestazione + ricerca ────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-5 pb-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            value={groupSearch}
            onChange={e => setGroupSearch(e.target.value)}
            placeholder={`Cerca ${terminology.group.toLowerCase()}...`}
            className="input-base input-compact flex-1"
          />
          <button
            onClick={() => setShowNew(true)}
            className="rx-btn-primary font-display text-[10px] tracking-[1.5px] py-1.5 px-3 rounded-[3px] cursor-pointer shrink-0"
          >
            + NUOVO
          </button>
        </div>
      </div>

      {/* ── Form nuovo gruppo ─────────────────────────────────────────────────── */}
      {showNew && (
        <div
          className="mx-4 sm:mx-6 mb-3 rounded-[4px] p-4 flex gap-3"
          style={{ background: 'color-mix(in srgb, var(--rx-accent) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-accent) 15%, transparent)' }}
        >
          <input
            autoFocus
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  handleCreate()
              if (e.key === 'Escape') { setShowNew(false); setNewGroupName('') }
            }}
            placeholder={`Nome ${terminology.group.toLowerCase()}...`}
            className="input-base flex-1"
          />
          <Button onClick={handleCreate} loading={creating}>
            CREA
          </Button>
          <Button variant="neutral" onClick={() => { setShowNew(false); setNewGroupName('') }} disabled={creating}>
            ANNULLA
          </Button>
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
            title={groups.length === 0 ? `Nessun ${terminology.group.toLowerCase()}` : 'Nessun risultato'}
            description={groups.length === 0
              ? `Crea il primo ${terminology.group.toLowerCase()} per organizzare i ${terminology.clients.toLowerCase()}.`
              : 'Prova a cambiare il termine di ricerca.'
            }
            action={groups.length === 0 ? { label: `Crea ${terminology.group.toLowerCase()}`, onClick: () => setShowNew(true) } : undefined}
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
