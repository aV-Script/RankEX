import { useState, useCallback }           from 'react'
import { useCalendar }                     from '../../features/calendar/useCalendar'
import { Skeleton }                        from '../../components/common/Skeleton'
import { CalendarHeader }                  from './trainer-calendar/CalendarHeader'
import { MonthView }                       from './trainer-calendar/MonthView'
import { WeekView }                        from './trainer-calendar/WeekView'
import { DayView }                         from './trainer-calendar/DayView'
import { SlotPopup }                       from './trainer-calendar/SlotPopup'
import { ConfirmDialog }                   from '../../components/common/ConfirmDialog'
import { CloseSessionModal }               from './trainer-calendar/CloseSessionModal'
import { AddSlotModal }                    from './trainer-calendar/AddSlotModal'
import { RecurrenceModal }                 from './trainer-calendar/RecurrenceModal'
import { useGroups }                       from '../../hooks/useGroups'

export function TrainerCalendar({ orgId, clients = [], onRefreshClients, onNavigate }) {
  const {
    slots, isLoading,
    currentDate, view,
    setView, navigate, goToToday,
    handleAddSlot, handleAddRecurrence,
    handleCloseSlot, handleSkipSlot, handleDeleteSlot,
  } = useCalendar(orgId)

  const { groups } = useGroups(orgId)
  const today = new Date().toISOString().slice(0, 10)

  // ── Stato UI ──────────────────────────────────────────────────────────────
  const [popup,          setPopup]          = useState(null) // { slot, x, y }
  const [closeModal,     setCloseModal]     = useState(null) // slot
  const [addModal,       setAddModal]       = useState(null) // { date, startTime }
  const [recurrenceModal, setRecurrenceModal] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null) // slotId in attesa di conferma
  const [deleting,        setDeleting]        = useState(false)

  // ── Handlers UI ───────────────────────────────────────────────────────────
  const handleSlotClick = useCallback((slot, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x    = Math.min(rect.left, window.innerWidth - 300)
    const y    = Math.min(rect.bottom + 8, window.innerHeight - 400)
    setPopup({ slot, x, y })
  }, [])

  const handleEmptyClick = useCallback((date, startTime) => {
    setAddModal({ date, startTime })
  }, [])

  const handleCloseSession = useCallback((slot) => {
    setPopup(null)
    setCloseModal(slot)
  }, [])

  const handleConfirmClose = useCallback(async (attendeeIds) => {
    await handleCloseSlot(closeModal.id, attendeeIds)
    setCloseModal(null)
    onRefreshClients?.()
  }, [closeModal, handleCloseSlot, onRefreshClients])

  const handleSkip = useCallback(async (slotId) => {
    setPopup(null)
    await handleSkipSlot(slotId)
  }, [handleSkipSlot])

  const handleDelete = useCallback((slotId) => {
    setPopup(null)
    setPendingDeleteId(slotId)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (deleting || !pendingDeleteId) return
    setDeleting(true)
    try {
      await handleDeleteSlot(pendingDeleteId)
      setPendingDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }, [deleting, pendingDeleteId, handleDeleteSlot])

  const handleViewRecurrence = useCallback((recurrenceId) => {
    setPopup(null)
    onNavigate?.('recurrences', { initialRecurrenceId: recurrenceId })
  }, [onNavigate])

  const pastPlannedCount = slots.filter(s => s.status === 'planned' && s.date < today).length

  const viewProps = {
    currentDate,
    slots,
    clients,
    today,
    onSlotClick:  handleSlotClick,
    onEmptyClick: handleEmptyClick,
  }

  return (
    <div className="text-white flex flex-col h-screen">

      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onNavigate={navigate}
        onToday={goToToday}
        onViewChange={setView}
        onAddSession={() => setAddModal({ date: today, startTime: '09:00' })}
        onAddRecurrence={() => setRecurrenceModal(true)}
      />

      {pastPlannedCount > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2 font-body text-[12px] shrink-0"
          style={{ background: 'rgba(251,191,36,0.07)', borderBottom: '1px solid rgba(251,191,36,0.18)', color: 'rgba(251,191,36,0.75)' }}
        >
          <span>⚠</span>
          <span>
            {pastPlannedCount === 1
              ? '1 sessione passata non chiusa'
              : `${pastPlannedCount} sessioni passate non chiuse`}
            {' '}— chiudile per assegnare XP agli atleti.
          </span>
        </div>
      )}

      {isLoading && slots.length === 0 ? (
        <div className="flex-1 flex flex-col gap-3 p-6">
          <Skeleton variant="list" count={8} />
        </div>
      ) : (
        <>
          {view === 'month' && <MonthView {...viewProps} />}
          {view === 'week'  && <WeekView  {...viewProps} />}
          {view === 'day'   && <DayView   {...viewProps} />}
        </>
      )}

      {/* Popup dettaglio slot */}
      {popup && (
        <SlotPopup
          slot={popup.slot}
          clients={clients}
          position={{ x: popup.x, y: popup.y }}
          onClose={() => setPopup(null)}
          onCloseSession={() => handleCloseSession(popup.slot)}
          onSkip={() => handleSkip(popup.slot.id)}
          onDelete={() => handleDelete(popup.slot.id)}
          onViewRecurrence={handleViewRecurrence}
        />
      )}

      {/* Conferma eliminazione slot */}
      {pendingDeleteId && (
        <ConfirmDialog
          variant="danger"
          title="Eliminare la sessione?"
          description="La sessione verrà eliminata definitivamente. L'operazione non può essere annullata."
          confirmLabel="ELIMINA"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}

      {/* Modal chiusura sessione */}
      {closeModal && (
        <CloseSessionModal
          slot={closeModal}
          clients={clients}
          onClose={() => setCloseModal(null)}
          onConfirm={handleConfirmClose}
        />
      )}

      {/* Modal nuova sessione */}
      {addModal && (
        <AddSlotModal
          date={addModal.date}
          startTime={addModal.startTime}
          clients={clients}
          groups={groups}
          slots={slots}
          onClose={() => setAddModal(null)}
          onSave={async (data) => { const slot = await handleAddSlot(data); if (slot) setAddModal(null) }}
        />
      )}

      {/* Modal ricorrenza */}
      {recurrenceModal && (
        <RecurrenceModal
          clients={clients}
          groups={groups}
          onClose={() => setRecurrenceModal(false)}
          onSave={async (data) => { const id = await handleAddRecurrence(data); if (id) setRecurrenceModal(false) }}
        />
      )}

    </div>
  )
}
