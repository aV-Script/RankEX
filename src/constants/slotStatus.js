export const SLOT_STATUS = Object.freeze({
  PLANNED:   'planned',
  COMPLETED: 'completed',
  SKIPPED:   'skipped',
})

// Colore/etichetta per status slot — unica fonte, prima ridichiarata
// identica in EventBlock.jsx e MonthView.jsx.
export const SLOT_STATUS_COLORS = Object.freeze({
  [SLOT_STATUS.PLANNED]:   '#00c8ff',
  [SLOT_STATUS.COMPLETED]: '#34d399',
  [SLOT_STATUS.SKIPPED]:   '#6b7280',
})
