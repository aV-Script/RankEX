import { useEffect } from 'react'
import {
  ICON_TEST, ICON_BIA, ICON_WORKOUT, ICON_CALENDAR, ICON_NOTES, ICON_ACTIVITY,
  ICON_AVATAR, ICON_WEARABLE, ICON_TROFEI, ICON_MISURE, ICON_BACK, ICON_PDF,
  ICON_RESET_PW, ICON_DELETE_CLIENT,
} from './clientDashboardIcons'

const TABS = [
  { id: 'atleta',      label: 'Atleta',      icon: ICON_AVATAR },
  { id: 'test',        label: 'Test',        icon: ICON_TEST,     requiresTests: true },
  { id: 'bia',         label: 'BIA',         icon: ICON_BIA },
  { id: 'allenamento', label: 'Allenamento', icon: ICON_WORKOUT },
  { id: 'calendario',  label: 'Calendario',  icon: ICON_CALENDAR },
  { id: 'note',        label: 'Note',        icon: ICON_NOTES },
  { id: 'attivita',    label: 'Attività',    icon: ICON_ACTIVITY },
  { id: 'misure',      label: 'Misure',      icon: ICON_MISURE },
  { id: 'wearable',    label: 'Wearable',    icon: ICON_WEARABLE },
  { id: 'trofei',      label: 'Trofei',      icon: ICON_TROFEI },
]

/**
 * Header dashboard cliente — back, tab bar scrollabile, menu overflow azioni
 * (PDF / reset password / elimina). Estratto da ClientDashboard.jsx (RX-07).
 */
export function ClientDashboardHeader({
  onBack, tab, onSelectTab, hasTests,
  client, showActions, onToggleActions,
  onExportPdf, onResetPassword, onRequestDelete,
}) {
  const visibleTabs = TABS.filter(t => !t.requiresTests || hasTests)

  // Chiusura da tastiera per il menu overflow — l'unico modo per chiuderlo
  // era prima un click esterno su un div non focusabile.
  useEffect(() => {
    if (!showActions) return
    const handler = e => { if (e.key === 'Escape') onToggleActions() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showActions, onToggleActions])

  return (
    <header
      className="border-b border-white/[.05] sticky top-0 z-30 backdrop-blur-md shrink-0 flex items-stretch"
      style={{ background: 'var(--rx-nav-bg)', height: 44 }}
    >
      {/* ← Back */}
      <button
        onClick={onBack}
        aria-label="Torna ai clienti"
        className="w-10 flex items-center justify-center shrink-0 bg-transparent border-none text-white/40 hover:text-white/70 transition-colors cursor-pointer"
      >
        {ICON_BACK}
      </button>

      {/* Tab bar */}
      <div className="flex-1 relative overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center justify-center h-full min-w-full w-fit">
          {visibleTabs.map(t => (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className="flex items-center gap-1.5 px-3 h-full shrink-0 cursor-pointer border-none bg-transparent relative transition-colors"
              style={{ color: tab === t.id ? 'var(--rx-accent)' : 'rgba(200,212,224,0.35)' }}
            >
              {tab === t.id && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-sm"
                  style={{ background: 'var(--rx-gradient)', boxShadow: '0 0 6px var(--rx-accent-glow)' }}
                />
              )}
              <span style={{ display: 'flex', filter: tab === t.id ? 'drop-shadow(0 0 4px var(--rx-accent-glow))' : 'none' }}>
                {t.icon}
              </span>
              <span className="font-display text-[9px] tracking-[1px] uppercase whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </div>
        {/* Fade destra — affordance scroll su mobile */}
        <div
          className="lg:hidden"
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 40,
            background: 'linear-gradient(to right, transparent, var(--rx-nav-bg))',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Divisore */}
      <div className="w-px self-stretch my-2" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* ⋮ Overflow actions */}
      <div className="relative shrink-0">
        <button
          onClick={onToggleActions}
          aria-label="Azioni"
          className="w-10 h-full flex items-center justify-center bg-transparent border-none text-white/40 hover:text-white/70 transition-colors cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>
          </svg>
        </button>
        {showActions && (
          <>
            <div className="fixed inset-0 z-40" onClick={onToggleActions} />
            <div
              className="absolute right-0 top-full mt-1 z-50 min-w-[168px] py-1 rounded-[4px]"
              style={{ background: 'var(--rx-surface)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
            >
              <button onClick={onExportPdf}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/[.04] transition-colors cursor-pointer bg-transparent border-none text-left font-display text-[10px] tracking-[1.5px] uppercase">
                {ICON_PDF} Esporta PDF
              </button>
              {client.email && (
                <button onClick={onResetPassword}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/[.04] transition-colors cursor-pointer bg-transparent border-none text-left font-display text-[10px] tracking-[1.5px] uppercase">
                  {ICON_RESET_PW} Reset password
                </button>
              )}
              <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <button onClick={onRequestDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-900/20 transition-colors cursor-pointer bg-transparent border-none text-left font-display text-[10px] tracking-[1.5px] uppercase"
                style={{ color: '#f87171' }}>
                {ICON_DELETE_CLIENT} Elimina
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
