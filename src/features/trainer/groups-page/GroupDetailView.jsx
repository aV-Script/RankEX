import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react'
import { usePagination }                             from '../../../hooks/usePagination'
import { ConfirmDialog }                             from '../../../components/common/ConfirmDialog'
import { GroupToggleDialog }                         from './GroupToggleDialog'
import { GroupDetailHeader }                         from './GroupDetailHeader'
import { GroupManageTab }                            from './GroupManageTab'
import { GroupLeaderboard }                          from './GroupLeaderboard'
import { GroupChampions }                            from './GroupChampions'
import { GroupAnalysis }                             from './GroupAnalysis'
import { GroupComparison }                           from './GroupComparison'
import { getSlotsByGroup }                           from '../../../firebase/services/calendar'
// Montato solo dietro il flusso di export PDF — lazy-load per non pesare
// sul bundle iniziale dell'hub gruppo.
const GroupReportPrint = lazy(() =>
  import('./GroupReportPrint').then(m => ({ default: m.GroupReportPrint }))
)
import { GroupNotes }                               from './GroupNotes'
import { GroupSessionsPanel }                        from './GroupSessionsPanel'
import {
  addClientToGroupSlots,
  removeClientFromGroupSlots,
} from '../../../features/calendar/calendarGroupUtils'
import { EmptyState, SectionLabel } from '../../../components/ui'
import { IconLeaderboard, IconAnalysis, IconCompare } from './groupDetailIcons'
import { ErrorBoundary } from '../../../components/common/ErrorBoundary'
import { ChartErrorFallback } from '../../../components/common/ChartErrorFallback'
import { useToast }           from '../../../hooks/useToast'
import { PrintPickerModal }   from '../../../components/common/PrintPickerModal'

const CLIENTS_PAGE_SIZE = 8
const SOCCER_CATS = ['soccer_youth', 'soccer_junior', 'soccer']

// ── Componente principale ─────────────────────────────────────────────────────

export function GroupDetailView({ group, clients, orgId, onToggleClient, onRename, onDelete, onBack, terminology }) {
  const toast = useToast()
  const [subView,      setSubView]      = useState('manage')
  const [clientSearch, setClientSearch] = useState('')
  const [isEditing,    setIsEditing]    = useState(false)
  const [editingName,  setEditingName]  = useState(group.name)
  const [showDelete,   setShowDelete]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [toggleDialog, setToggleDialog] = useState(null)
  const [toggling,     setToggling]     = useState(null)
  const [slots,        setSlots]        = useState([])
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [showPrint,       setShowPrint]       = useState(false)
  const [showPrintPicker, setShowPrintPicker] = useState(false)
  const [printMode,       setPrintMode]       = useState('dark')
  const [showActions,     setShowActions]     = useState(false)

  useEffect(() => {
    if (!orgId || !group.id) return
    setSlotsLoading(true)
    const from = new Date()
    from.setDate(from.getDate() - 90)
    getSlotsByGroup(orgId, group.id, from.toISOString().slice(0, 10))
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [orgId, group.id])

  const allClientsInGroup = useMemo(() =>
    clients.filter(c => group.clientIds.includes(c.id))
  , [clients, group.clientIds])

  const mixedFascia = useMemo(() => {
    const fasce = new Set(allClientsInGroup.map(c => c.categoria).filter(v => SOCCER_CATS.includes(v)))
    return fasce.size > 1
  }, [allClientsInGroup])

  const filteredClients = useMemo(() =>
    clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
  , [clients, clientSearch])

  const clientsInGroup    = allClientsInGroup
  const clientsNotInGroup = useMemo(() => filteredClients.filter(c => !group.clientIds.includes(c.id)), [filteredClients, group.clientIds])

  const inGroupPagination    = usePagination(clientsInGroup,    CLIENTS_PAGE_SIZE)
  const notInGroupPagination = usePagination(clientsNotInGroup, CLIENTS_PAGE_SIZE)

  const handleRequestToggle = useCallback((client, isRemoving) => {
    setToggleDialog({ client, isRemoving })
  }, [])

  const handleConfirmToggle = useCallback(async () => {
    const { client, isRemoving } = toggleDialog
    setToggling(client.id)
    setToggleDialog(null)
    try {
      await onToggleClient(group.id, client.id)
      if (isRemoving) {
        await removeClientFromGroupSlots(orgId, group.id, client.id)
      } else {
        await addClientToGroupSlots(orgId, group.id, client.id)
      }
    } catch {
      toast.error(`Aggiornamento ${terminology.group.toLowerCase()} non riuscito`)
    } finally {
      setToggling(null)
    }
  }, [toggleDialog, group.id, onToggleClient, orgId, toast, terminology.group])

  const handleRename = useCallback(async () => {
    if (!editingName.trim() || editingName === group.name) { setIsEditing(false); return }
    await onRename(group.id, editingName.trim())
    setIsEditing(false)
  }, [editingName, group.id, group.name, onRename])

  const handleDelete = useCallback(async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await onDelete(group.id)
      onBack()   // naviga via solo se l'eliminazione è riuscita davvero
    } catch {
      toast.error(`Eliminazione ${terminology.group.toLowerCase()} non riuscita`)
      setShowDelete(false)
    } finally {
      setDeleting(false)
    }
  }, [deleting, group.id, onDelete, onBack, toast, terminology.group])

  const handleCancelRename = useCallback(() => {
    setIsEditing(false)
    setEditingName(group.name)
  }, [group.name])

  const handleToggleActions = useCallback(() => {
    setShowActions(v => !v)
  }, [])

  const handleOpenRename = useCallback(() => {
    setShowActions(false)
    setIsEditing(true)
  }, [])

  const handleExportPdf = useCallback(() => {
    setShowActions(false)
    setShowPrintPicker(true)
  }, [])

  const handleRequestDelete = useCallback(() => {
    setShowActions(false)
    setShowDelete(true)
  }, [])

  return (
    <div className="min-h-screen text-white flex flex-col">

      <GroupDetailHeader
        onBack={onBack}
        terminology={terminology}
        subView={subView}
        onSelectTab={setSubView}
        isEditing={isEditing}
        editingName={editingName}
        onEditingNameChange={setEditingName}
        onSaveRename={handleRename}
        onCancelRename={handleCancelRename}
        showActions={showActions}
        onToggleActions={handleToggleActions}
        onOpenRename={handleOpenRename}
        onExportPdf={handleExportPdf}
        onRequestDelete={handleRequestDelete}
      />

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto w-full flex flex-col flex-1">

        {/* ── Avviso fascia mista ── */}
        {mixedFascia && (
          <div className="mx-4 sm:mx-6 mt-3 px-4 py-3 rounded-[3px] font-body text-[12px] leading-relaxed"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
            ⚠ {terminology.group} con atleti di fasce d'età diverse: Classifica, Analisi e Confronto potrebbero non essere significativi.
          </div>
        )}

        {/* ── Contenuto tab ── */}
        <div key={subView} className="rx-animate-in flex-1">

        {subView === 'leaderboard' && (
          allClientsInGroup.length < 2 ? (
            <EmptyState
              icon={<IconLeaderboard size={20} />}
              title="Classifica non disponibile"
              description="Aggiungi almeno 2 atleti per vedere la classifica e i campioni per disciplina."
            />
          ) : (
            <div className="px-4 sm:px-6 pt-4 pb-12 flex flex-col gap-4">
              <GroupChampions clients={allClientsInGroup} />
              <div className="rounded-[4px] p-5 rx-card">
                <SectionLabel className="mb-5">◈ Classifica</SectionLabel>
                <GroupLeaderboard clients={allClientsInGroup} />
              </div>
            </div>
          )
        )}

        {subView === 'analysis' && (
          allClientsInGroup.length < 2 ? (
            <EmptyState
              icon={<IconAnalysis size={20} />}
              title="Analisi non disponibile"
              description="Aggiungi almeno 2 atleti per sbloccare heatmap e report miglioramenti."
            />
          ) : (
            <div className="px-4 sm:px-6 pt-4 pb-12">
              <ErrorBoundary fallback={ChartErrorFallback}>
                <GroupAnalysis clients={allClientsInGroup} />
              </ErrorBoundary>
            </div>
          )
        )}

        {subView === 'comparison' && (
          allClientsInGroup.length < 2 ? (
            <EmptyState
              icon={<IconCompare size={20} />}
              title="Confronto non disponibile"
              description="Aggiungi almeno 2 atleti per confrontare le loro statistiche e l'andamento nel tempo."
            />
          ) : (
            <div className="px-4 sm:px-6 pt-4 pb-12">
              <ErrorBoundary fallback={ChartErrorFallback}>
                <GroupComparison clients={allClientsInGroup} />
              </ErrorBoundary>
            </div>
          )
        )}

        {subView === 'manage' && (
          <GroupManageTab
            clientsInGroup={allClientsInGroup}
            totalClients={clients.length}
            clientsNotInGroupCount={clientsNotInGroup.length}
            clientSearch={clientSearch}
            onSearchChange={setClientSearch}
            inGroupPagination={inGroupPagination}
            notInGroupPagination={notInGroupPagination}
            toggling={toggling}
            onRequestToggle={handleRequestToggle}
          />
        )}

        {subView === 'sessions' && (
          <div className="px-4 sm:px-6 pt-4 pb-12">
            <GroupSessionsPanel slots={slots} loading={slotsLoading} />
          </div>
        )}

        {subView === 'notes' && (
          <div className="px-4 sm:px-6 pt-4 pb-12">
            <GroupNotes orgId={orgId} groupId={group.id} />
          </div>
        )}

        </div> {/* fine rx-animate-in */}
      </div>


      {showPrintPicker && (
        <PrintPickerModal
          onSelect={(m) => { setPrintMode(m); setShowPrintPicker(false); setShowPrint(true) }}
          onCancel={() => setShowPrintPicker(false)}
        />
      )}
      {showPrint && (
        <Suspense fallback={null}>
          <GroupReportPrint
            group={group}
            clients={allClientsInGroup}
            mode={printMode}
            onClose={() => setShowPrint(false)}
          />
        </Suspense>
      )}

      {toggleDialog && (
        <GroupToggleDialog
          client={toggleDialog.client}
          group={group}
          orgId={orgId}
          isRemoving={toggleDialog.isRemoving}
          onConfirm={handleConfirmToggle}
          onCancel={() => setToggleDialog(null)}
        />
      )}

      {showDelete && (
        <ConfirmDialog
          variant="danger"
          title={`Eliminare "${group.name}"?`}
          description={`${terminology.group} da eliminare — gli atleti non verranno rimossi dall'app.`}
          confirmLabel="ELIMINA"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
