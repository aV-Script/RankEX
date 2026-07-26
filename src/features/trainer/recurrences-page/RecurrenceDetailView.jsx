import { useState, useCallback, useMemo } from 'react'
import { ConfirmDialog }                  from '../../../components/common/ConfirmDialog'
import { useRegisterContextMenu }         from '../../../context/NavMenuContext'
import { useToast }                       from '../../../hooks/useToast'
import { IconChevronLeft }                from '../../../components/ui/icons'
import { RecurrenceDetailHeader }         from './RecurrenceDetailHeader'
import { RecurrenceSummaryBar }           from './RecurrenceSummaryBar'
import { RecurrenceScheduleSection }      from './RecurrenceScheduleSection'
import { RecurrencePeriodSection }        from './RecurrencePeriodSection'
import { RecurrenceClientsSection }       from './RecurrenceClientsSection'
import { STATUS_INFO, weeksBetween }      from './recurrenceDetailShared'

const ICON_BACK = <IconChevronLeft />
const ICON_CANCEL_REC = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)

export function RecurrenceDetailView({
  recurrence, clients,
  onBack, onUpdateTime, onUpdateDays,
  onExtendPeriod, onAddClient, onRemoveClient, onCancel,
}) {
  const toast = useToast()
  const [editingTime, setEditingTime] = useState(false)
  const [editingDays, setEditingDays] = useState(false)
  const [editingEnd,  setEditingEnd]  = useState(false)
  const [showCancel,  setShowCancel]  = useState(false)
  const [cancelling,  setCancelling]  = useState(false)
  const [clientSearch,setClientSearch]= useState('')

  const [startTime,  setStartTime] = useState(recurrence.startTime)
  const [endTime,    setEndTime]   = useState(recurrence.endTime)
  const [days,       setDays]      = useState(recurrence.days)
  const [newEndDate, setNewEndDate] = useState(recurrence.endDate)
  const [saving,     setSaving]    = useState(false)

  const recurrenceClients = recurrence.clientIds
    .map(id => clients.find(c => c.id === id))
    .filter(Boolean)

  const candidateClients = useMemo(() =>
    clients.filter(c => !recurrence.clientIds.includes(c.id))
  , [clients, recurrence.clientIds])

  const availableClients = useMemo(() => {
    if (!clientSearch.trim()) return candidateClients
    const q = clientSearch.toLowerCase()
    return candidateClients.filter(c => c.name?.toLowerCase().includes(q))
  }, [candidateClients, clientSearch])

  const isActive = recurrence.status === 'active'
  const statusInfo = STATUS_INFO[recurrence.status ?? 'active']
  const weeks = weeksBetween(recurrence.startDate, recurrence.endDate)

  const handleSaveTime = useCallback(async () => {
    setSaving(true)
    try { await onUpdateTime(recurrence.id, startTime, endTime); setEditingTime(false) }
    finally { setSaving(false) }
  }, [recurrence.id, startTime, endTime, onUpdateTime])

  const handleSaveDays = useCallback(async () => {
    setSaving(true)
    try { await onUpdateDays(recurrence.id, days); setEditingDays(false) }
    finally { setSaving(false) }
  }, [recurrence.id, days, onUpdateDays])

  const handleSaveEnd = useCallback(async () => {
    setSaving(true)
    try { await onExtendPeriod(recurrence.id, newEndDate); setEditingEnd(false) }
    finally { setSaving(false) }
  }, [recurrence.id, newEndDate, onExtendPeriod])

  const handleConfirmCancel = useCallback(async () => {
    if (cancelling) return
    setCancelling(true)
    try {
      await onCancel(recurrence.id)
      onBack()   // naviga via solo se la cancellazione è riuscita davvero
    } catch {
      toast.error('Impossibile cancellare la ricorrenza')
      setShowCancel(false)
    } finally {
      setCancelling(false)
    }
  }, [cancelling, recurrence.id, onCancel, onBack, toast])

  const recCtxItems = useMemo(() => [
    { id: '__back__',   label: 'Ricorrenze', icon: ICON_BACK },
    isActive && { id: '__cancel__', label: 'Cancella', icon: ICON_CANCEL_REC, isDanger: true },
  ].filter(Boolean), [isActive])

  const handleRecCtxNav = useCallback((id) => {
    if (id === '__back__') onBack()
    else if (id === '__cancel__') setShowCancel(true)
  }, [onBack])

  useRegisterContextMenu('Ricorrenza', recCtxItems, null, handleRecCtxNav)

  return (
    <div className="min-h-screen text-white rx-animate-in">

      <RecurrenceDetailHeader recurrence={recurrence} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

        <RecurrenceSummaryBar
          recurrence={recurrence}
          clientsCount={recurrenceClients.length}
          weeks={weeks}
          statusInfo={statusInfo}
        />

        <RecurrenceScheduleSection
          recurrence={recurrence}
          isActive={isActive}
          saving={saving}
          editingTime={editingTime}
          onStartEditTime={() => setEditingTime(true)}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          onSaveTime={handleSaveTime}
          onCancelTime={() => setEditingTime(false)}
          editingDays={editingDays}
          onStartEditDays={() => setEditingDays(true)}
          days={days}
          setDays={setDays}
          onSaveDays={handleSaveDays}
          onCancelDays={() => { setEditingDays(false); setDays(recurrence.days) }}
        />

        <RecurrencePeriodSection
          recurrence={recurrence}
          isActive={isActive}
          weeks={weeks}
          saving={saving}
          editingEnd={editingEnd}
          onStartEditEnd={() => setEditingEnd(true)}
          newEndDate={newEndDate}
          setNewEndDate={setNewEndDate}
          onSaveEnd={handleSaveEnd}
          onCancelEnd={() => { setEditingEnd(false); setNewEndDate(recurrence.endDate) }}
        />

        <RecurrenceClientsSection
          recurrenceId={recurrence.id}
          isActive={isActive}
          recurrenceClients={recurrenceClients}
          hasCandidates={candidateClients.length > 0}
          availableClients={availableClients}
          clientSearch={clientSearch}
          onSearchChange={setClientSearch}
          onAddClient={onAddClient}
          onRemoveClient={onRemoveClient}
        />
      </div>

      {showCancel && (
        <ConfirmDialog
          variant="danger"
          title="Cancellare la ricorrenza?"
          description="Tutti gli slot futuri collegati verranno eliminati. Gli slot passati rimangono invariati."
          confirmLabel="CANCELLA"
          loading={cancelling}
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowCancel(false)}
        />
      )}
    </div>
  )
}
