import { useState, useMemo, useCallback }          from 'react'
import { usePagination }                           from '../../../hooks/usePagination'
import { Pagination }                              from '../../../components/common/Pagination'
import { ConfirmDialog }                           from '../../../components/common/ConfirmDialog'
import { addClientToGroupSlots, removeClientFromGroupSlots } from '../../../features/calendar/calendarGroupUtils'

const CLIENTS_PAGE_SIZE = 8

export function GroupDetailView({ group, clients, trainerId, onToggleClient, onRename, onDelete, onBack }) {
  const [clientSearch, setClientSearch] = useState('')
  const [isEditing,    setIsEditing]    = useState(false)
  const [editingName,  setEditingName]  = useState(group.name)
  const [showDelete,   setShowDelete]   = useState(false)
  const [toggling,     setToggling]     = useState(null) // clientId in corso

  const today = new Date().toISOString().slice(0, 10)

  const filteredClients = useMemo(() =>
    clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
  , [clients, clientSearch])

  const clientsInGroup = useMemo(() =>
    filteredClients.filter(c => group.clientIds.includes(c.id))
  , [filteredClients, group.clientIds])

  const clientsNotInGroup = useMemo(() =>
    filteredClients.filter(c => !group.clientIds.includes(c.id))
  , [filteredClients, group.clientIds])

  const inGroupPagination    = usePagination(clientsInGroup,    CLIENTS_PAGE_SIZE)
  const notInGroupPagination = usePagination(clientsNotInGroup, CLIENTS_PAGE_SIZE)

  // ── Toggle cliente — aggiorna gruppo + slot futuri ────────────────────────
  const handleToggle = useCallback(async (groupId, clientId) => {
    const isInGroup = group.clientIds.includes(clientId)
    setToggling(clientId)
    try {
      // 1. Aggiorna il gruppo
      await onToggleClient(groupId, clientId)

      // 2. Aggiorna gli slot futuri del gruppo
      if (isInGroup) {
        await removeClientFromGroupSlots(trainerId, groupId, clientId, today)
      } else {
        await addClientToGroupSlots(trainerId, groupId, clientId, today)
      }
    } finally {
      setToggling(null)
    }
  }, [group.clientIds, onToggleClient, trainerId, today])

  const handleRename = useCallback(async () => {
    if (!editingName.trim() || editingName === group.name) {
      setIsEditing(false)
      return
    }
    await onRename(group.id, editingName.trim())
    setIsEditing(false)
  }, [editingName, group.id, group.name, onRename])

  const handleDelete = useCallback(async () => {
    await onDelete(group.id)
    onBack()
  }, [group.id, onDelete, onBack])

  return (
    <div className="min-h-screen text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[.05]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer hover:text-white/60 transition-colors p-0"
        >
          ‹ Gruppi
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <input
                autoFocus
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleRename()
                  if (e.key === 'Escape') { setIsEditing(false); setEditingName(group.name) }
                }}
                className="input-base text-center font-display font-black text-[16px]"
                style={{ minWidth: 200 }}
              />
              <ActionBtn onClick={handleRename} color="#34d399">SALVA</ActionBtn>
              <ActionBtn onClick={() => { setIsEditing(false); setEditingName(group.name) }} muted>ANNULLA</ActionBtn>
            </>
          ) : (
            <span className="font-display font-black text-[16px] text-white">{group.name}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <ActionBtn onClick={() => setIsEditing(true)}>RINOMINA</ActionBtn>
          )}
          <ActionBtn onClick={() => setShowDelete(true)} danger>ELIMINA</ActionBtn>
        </div>
      </div>

      {/* Contenuto */}
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Info gruppo */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-[3px] flex items-center justify-center shrink-0"
            style={{ background: 'rgba(15,214,90,0.08)', border: '1px solid rgba(15,214,90,0.2)' }}
          >
            <span className="font-display font-black text-[20px]" style={{ color: '#0fd65a' }}>
              {group.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-display font-black text-[20px] text-white">{group.name}</div>
            <div className="font-body text-[13px] text-white/30 mt-0.5">
              {group.clientIds.length} {group.clientIds.length === 1 ? 'cliente' : 'clienti'}
            </div>
          </div>
        </div>

        {/* Ricerca */}
        <input
          value={clientSearch}
          onChange={e => setClientSearch(e.target.value)}
          placeholder="Cerca cliente per nome..."
          className="input-base w-full mb-6"
        />

        {/* Clienti nel gruppo */}
        <div className="mb-8">
          <div className="font-display text-[10px] text-white/30 tracking-[2px] mb-3">
            NEL GRUPPO ({clientsInGroup.length})
          </div>
          {inGroupPagination.paginatedItems.length === 0 ? (
            <p className="font-body text-[13px] text-white/20">
              {clientSearch ? 'Nessun risultato.' : 'Nessun cliente in questo gruppo.'}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {inGroupPagination.paginatedItems.map(c => (
                  <ClientRow
                    key={c.id}
                    client={c}
                    inGroup
                    loading={toggling === c.id}
                    onToggle={() => handleToggle(group.id, c.id)}
                  />
                ))}
              </div>
              <Pagination {...inGroupPagination} />
            </>
          )}
        </div>

        {/* Clienti da aggiungere */}
        <div>
          <div className="font-display text-[10px] text-white/30 tracking-[2px] mb-3">
            DA AGGIUNGERE ({clientsNotInGroup.length})
          </div>
          {notInGroupPagination.paginatedItems.length === 0 ? (
            <p className="font-body text-[13px] text-white/20">
              {clientSearch ? 'Nessun risultato.' : 'Tutti i clienti sono già nel gruppo.'}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {notInGroupPagination.paginatedItems.map(c => (
                  <ClientRow
                    key={c.id}
                    client={c}
                    inGroup={false}
                    loading={toggling === c.id}
                    onToggle={() => handleToggle(group.id, c.id)}
                  />
                ))}
              </div>
              <Pagination {...notInGroupPagination} />
            </>
          )}
        </div>
      </div>

      {showDelete && (
        <ConfirmDialog
          title={`Eliminare "${group.name}"?`}
          description="Il gruppo verrà eliminato. I clienti non verranno rimossi dall'app."
          confirmLabel="ELIMINA"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function ClientRow({ client, inGroup, loading, onToggle }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-[3px] transition-all"
      style={inGroup
        ? { background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }
        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }
      }
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-[3px] flex items-center justify-center shrink-0"
          style={inGroup
            ? { background: 'rgba(52,211,153,0.15)' }
            : { background: 'rgba(255,255,255,0.06)' }
          }
        >
          <span
            className="font-display text-[11px]"
            style={{ color: inGroup ? '#34d399' : 'rgba(255,255,255,0.4)' }}
          >
            {client.name?.[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <div className="font-body text-[13px] text-white/70">{client.name}</div>
          {client.rank && (
            <div className="font-display text-[10px] text-white/25 mt-0.5">
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
          : { color: '#0fd65a', borderColor: 'rgba(15,214,90,0.2)',   background: 'rgba(15,214,90,0.06)' }
        }
      >
        {loading ? '...' : inGroup ? 'RIMUOVI' : 'AGGIUNGI'}
      </button>
    </div>
  )
}

function ActionBtn({ onClick, children, color, danger, muted }) {
  return (
    <button
      onClick={onClick}
      className="font-display text-[10px] px-2.5 py-1.5 rounded-[3px] cursor-pointer border transition-all"
      style={
        danger ? { color: '#f87171', borderColor: 'rgba(248,113,113,0.2)', background: 'transparent' } :
        muted  ? { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' } :
        color  ? { color, borderColor: color + '44', background: color + '11' } :
                 { color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }
      }
    >
      {children}
    </button>
  )
}