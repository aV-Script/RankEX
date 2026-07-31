// Icone tab + config TABS di GroupDetailView.jsx — estratte per ridurre le
// dimensioni del componente (RX-07: spostamento puro, nessuna modifica
// comportamentale).
import { IconChevronLeft, IconPdf, IconDelete } from '../../../components/ui/icons'

export const ICON_MANAGE = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

// Parametrizzate su `size` — servono sia nella tab bar (13px, TABS sotto)
// sia negli EmptyState "servono almeno 2 atleti" di GroupDetailView (20px)
// e nella classifica standalone di GroupLeaderboard (20px). Prima duplicate
// a mano in ognuno dei 3 punti.
export function IconLeaderboard({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 20 18 10"/>
      <polyline points="12 20 12 4"/>
      <polyline points="6 20 6 14"/>
    </svg>
  )
}
export function IconAnalysis({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )
}
export function IconCompare({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
export const ICON_LEADERBOARD = <IconLeaderboard />
export const ICON_ANALYSIS    = <IconAnalysis />
export const ICON_COMPARE     = <IconCompare />
export const ICON_SESSIONS = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
export const ICON_NOTES = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
export const ICON_RENAME = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
export const ICON_PDF = <IconPdf size={13} />
export const ICON_DELETE = <IconDelete size={13} />
export const ICON_BACK = <IconChevronLeft />

export const TABS = [
  { id: '__back__',    label: 'Gruppi',    icon: ICON_BACK        },
  { id: 'manage',     label: 'Gestione',  icon: ICON_MANAGE      },
  { id: 'leaderboard', label: 'Classifica',icon: ICON_LEADERBOARD },
  { id: 'analysis',   label: 'Analisi',   icon: ICON_ANALYSIS    },
  { id: 'comparison', label: 'Confronto', icon: ICON_COMPARE     },
  { id: 'sessions',   label: 'Sessioni',  icon: ICON_SESSIONS    },
  { id: 'notes',      label: 'Note',      icon: ICON_NOTES       },
  { id: '__rename__', label: 'Rinomina',  icon: ICON_RENAME      },
  { id: '__pdf__',    label: 'PDF',       icon: ICON_PDF         },
  { id: '__delete__', label: 'Elimina',   icon: ICON_DELETE, isDanger: true },
]
