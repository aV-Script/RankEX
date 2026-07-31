export const SLOT_STATUS = Object.freeze({
  PLANNED:   'planned',
  COMPLETED: 'completed',
  SKIPPED:   'skipped',
})

// Colore/etichetta per status slot — unica fonte, prima ridichiarata
// identica in SlotCard.jsx, EventBlock.jsx, MonthView.jsx, CalendarSidebar.jsx.
export const SLOT_STATUS_COLORS = Object.freeze({
  [SLOT_STATUS.PLANNED]:   '#00c8ff',
  [SLOT_STATUS.COMPLETED]: '#34d399',
  [SLOT_STATUS.SKIPPED]:   '#6b7280',
})

export const SLOT_STATUS_LABELS = Object.freeze({
  [SLOT_STATUS.PLANNED]:   'PIANIFICATA',
  [SLOT_STATUS.COMPLETED]: 'COMPLETATA',
  [SLOT_STATUS.SKIPPED]:   'SALTATA',
})
