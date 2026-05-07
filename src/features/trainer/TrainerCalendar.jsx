import { useState, useCallback }           from 'react'
import { useCalendar }                     from '../../features/calendar/useCalendar'
import { Skeleton }                        from '../../components/common/Skeleton'
import { CalendarHeader }                  from './trainer-calendar/CalendarHeader'
import { MonthView }                       from './trainer-calendar/MonthView'
import { WeekView }                        from './trainer-calendar/WeekView'
import { DayView }                         from './trainer-calendar/DayView'
import { SlotPopup }                       from './trainer-calendar/SlotPopup'
import { CloseSessionModal }               from './trainer-calendar/CloseSessionModal'
import { AddSlotModal }                    from './trainer-calendar/AddSlotModal'
import { RecurrenceModal }                 from './trainer-calendar/RecurrenceModal'
import { useGroups }                       from '../../hooks/useGroups'
import { useRegisterContextMenu }          from '../../context/NavMenuContext'

const ICON_CAL_MONTH = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <rect x="7" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/>
    <rect x="11" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/>
  </svg>
)
const ICON_CAL_WEEK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const ICON_CAL_DAY = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="15" x2="16" y2="15"/>
  </svg>
)
const ICON_NEW_SESSION = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
)
const ICON_RECURRENCE = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)

const CALENDAR_NAV_ITEMS = [
  { id: 'month',          label: 'Mese',       icon: ICON_CAL_MONTH },
  { id: 'week',           label: 'Settimana',  icon: ICON_CAL_WEEK },
  { id: 'day',            label: 'Giorno',     icon: ICON_CAL_DAY },
  { id: '__recurrence__', label: 'Ricorrenza', icon: ICON_RECURRENCE },
  { id: '__session__',    label: 'Sessione',   icon: ICON_NEW_SESSION },
]

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
    await handleCloseSlot(closeModal.id, attendeeIds, clients)
    setCloseModal(null)
    onRefreshClients?.()
  }, [closeModal, handleCloseSlot, clients, onRefreshClients])

  const handleSkip = useCallback(async (slotId) => {
    setPopup(null)
    await handleSkipSlot(slotId)
  }, [handleSkipSlot])

  const handleDelete = useCallback(async (slotId) => {
    setPopup(null)
    await handleDeleteSlot(slotId)
  }, [handleDeleteSlot])

  const handleViewRecurrence = useCallback((recurrenceId) => {
    setPopup(null)
    onNavigate?.('recurrences', { initialRecurrenceId: recurrenceId })
  }, [onNavigate])

  const handleContextNav = useCallback((id) => {
    if (id === 'month' || id === 'week' || id === 'day') setView(id)
    else if (id === '__session__')    setAddModal({ date: today, startTime: '09:00' })
    else if (id === '__recurrence__') setRecurrenceModal(true)
  }, [setView, today])

  useRegisterContextMenu('Calendario', CALENDAR_NAV_ITEMS, view, handleContextNav)

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

      {isLoading ? (
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
          onSave={async (data) => { await handleAddSlot(data); setAddModal(null) }}
        />
      )}

      {/* Modal ricorrenza */}
      {recurrenceModal && (
        <RecurrenceModal
          clients={clients}
          groups={groups}
          onClose={() => setRecurrenceModal(false)}
          onSave={async (data) => { await handleAddRecurrence(data); setRecurrenceModal(false) }}
        />
      )}

    </div>
  )
}
