import { useEffect } from 'react'
import {
  ICON_BACK, ICON_MANAGE, ICON_LEADERBOARD, ICON_ANALYSIS, ICON_COMPARE,
  ICON_SESSIONS, ICON_NOTES, ICON_RENAME, ICON_PDF, ICON_DELETE,
} from './groupDetailIcons'

const SUB_TABS = [
  { id: 'manage',      label: 'Gestione',   icon: ICON_MANAGE      },
  { id: 'leaderboard', label: 'Classifica', icon: ICON_LEADERBOARD },
  { id: 'analysis',    label: 'Analisi',    icon: ICON_ANALYSIS    },
  { id: 'comparison',  label: 'Confronto',  icon: ICON_COMPARE     },
  { id: 'sessions',    label: 'Sessioni',   icon: ICON_SESSIONS    },
  { id: 'notes',       label: 'Note',       icon: ICON_NOTES       },
]

/**
 * Header hub gruppo — back, tab bar (o input rinomina inline), menu overflow
 * (Rinomina / Esporta PDF / Elimina). Estratto da GroupDetailView.jsx (RX-07).
 */
export function GroupDetailHeader({
  onBack, terminology, subView, onSelectTab,
  isEditing, editingName, onEditingNameChange, onSaveRename, onCancelRename,
  showActions, onToggleActions, onOpenRename, onExportPdf, onRequestDelete,
}) {
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
      style={{ background: 'rgba(7,9,14,0.92)', height: 44 }}
    >
      {/* ← Back */}
      <button
        onClick={onBack}
        aria-label={`Torna a ${terminology.groups}`}
        className="w-10 flex items-center justify-center shrink-0 bg-transparent border-none text-white/40 hover:text-white/70 transition-colors cursor-pointer"
      >
        {ICON_BACK}
      </button>

      {/* Tab bar — centrati */}
      <div className="flex-1 relative overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {isEditing ? (
          <div className="flex items-center justify-center gap-2 h-full px-2">
            <input
              autoFocus
              value={editingName}
              onChange={e => onEditingNameChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  onSaveRename()
                if (e.key === 'Escape') onCancelRename()
              }}
              className="input-base font-display font-black text-[12px]"
              style={{ minWidth: 100, maxWidth: 160 }}
            />
            <ActionBtn onClick={onSaveRename} color="var(--rx-accent)">SALVA</ActionBtn>
            <ActionBtn onClick={onCancelRename} muted>ANN.</ActionBtn>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-w-full w-fit">
            {SUB_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                aria-current={subView === t.id ? 'page' : undefined}
                className="flex items-center gap-1.5 px-3 h-full shrink-0 cursor-pointer border-none bg-transparent relative transition-colors"
                style={{ color: subView === t.id ? 'var(--rx-accent)' : 'rgba(200,212,224,0.35)' }}
              >
                {subView === t.id && (
                  <div
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-sm"
                    style={{ background: 'var(--rx-gradient)', boxShadow: '0 0 6px color-mix(in srgb, var(--rx-accent) 45%, transparent)' }}
                  />
                )}
                <span style={{ display: 'flex', filter: subView === t.id ? 'drop-shadow(0 0 4px color-mix(in srgb, var(--rx-accent) 50%, transparent))' : 'none' }}>
                  {t.icon}
                </span>
                <span className="font-display text-[9px] tracking-[1px] uppercase whitespace-nowrap">{t.label}</span>
              </button>
            ))}
          </div>
        )}
        {/* Fade destra — affordance scroll su mobile */}
        {!isEditing && (
          <div
            className="lg:hidden"
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: 40,
              background: 'linear-gradient(to right, transparent, var(--rx-nav-bg))',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Divisore */}
      <div className="w-px self-stretch my-2" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* ⋮ Overflow actions */}
      <div className="relative shrink-0">
        <button
          onClick={onToggleActions}
          aria-label={`Azioni ${terminology.group.toLowerCase()}`}
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
              className="absolute right-0 top-full mt-1 z-50 min-w-[152px] py-1 rounded-[4px]"
              style={{ background: 'rgba(13,20,30,0.98)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
            >
              <button onClick={onOpenRename}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/[.04] transition-colors cursor-pointer bg-transparent border-none text-left font-display text-[10px] tracking-[1.5px] uppercase">
                {ICON_RENAME} Rinomina
              </button>
              <button onClick={onExportPdf}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/[.04] transition-colors cursor-pointer bg-transparent border-none text-left font-display text-[10px] tracking-[1.5px] uppercase">
                {ICON_PDF} Esporta PDF
              </button>
              <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <button onClick={onRequestDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-900/20 transition-colors cursor-pointer bg-transparent border-none text-left font-display text-[10px] tracking-[1.5px] uppercase"
                style={{ color: '#f87171' }}>
                {ICON_DELETE} Elimina
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

function actionBtnStyle(danger, muted, color) {
  if (danger) return { color: '#f87171',                  borderColor: 'rgba(248,113,113,0.2)', background: 'transparent' }
  if (muted)  return { color: 'rgba(255,255,255,0.3)',    borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }
  if (color)  return { color,                             borderColor: color + '44',            background: color + '11'  }
  return              { color: 'rgba(255,255,255,0.4)',   borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }
}

function ActionBtn({ onClick, children, color, danger, muted }) {
  return (
    <button
      onClick={onClick}
      className="font-display text-[10px] px-2.5 py-1.5 rounded-[3px] cursor-pointer border transition-all"
      style={actionBtnStyle(danger, muted, color)}
    >
      {children}
    </button>
  )
}
