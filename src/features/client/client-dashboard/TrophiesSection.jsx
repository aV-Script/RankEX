import { useState, useCallback } from 'react'
import { BadgeMedal }            from '../../../components/ui/BadgeMedal'
import { IconClose }             from '../../../components/ui/icons'
import { EmptyState }            from '../../../components/ui'
import { ConfirmDialog }         from '../../../components/common/ConfirmDialog'
import { BADGES, BADGE_TIERS, MANUAL_BADGES } from '../../../config/badges.config'

const ICON_TROPHY = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)

const MAX_SHOWCASE = 5

// ── Icone ─────────────────────────────────────────────────────────────────────

const ICON_PIN = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
)
const ICON_PLUS = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const ICON_X = <IconClose size={10} />

// ── Data assegnazione ────────────────────────────────────────────────────────

function formatAwarded(ts) {
  if (!ts) return null
  try {
    return new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return null }
}

// ── Componente ────────────────────────────────────────────────────────────────

export function TrophiesSection({
  rawBadges = {},
  earnedBadges = [],
  allBadges = BADGES,
  showcase = [],
  readonly = false,
  badgeProgress = {},
  onAward,
  onRevoke,
  onUpdateShowcase,
  color = 'var(--rx-accent)',
}) {
  const [showPicker,     setShowPicker]     = useState(false)
  const [note,           setNote]           = useState('')
  const [picking,        setPicking]        = useState(null)
  const [confirmRevoke,  setConfirmRevoke]  = useState(null)
  const [revoking,       setRevoking]       = useState(false)

  const earned    = Object.keys(rawBadges)
  const earnedSet = new Set(earned)

  const [localShowcase, setLocalShowcase] = useState(showcase)
  const currentShowcase = localShowcase.length ? localShowcase : showcase

  const toggleShowcase = useCallback(async (badgeId) => {
    const snapshot = currentShowcase
    const next = currentShowcase.includes(badgeId)
      ? currentShowcase.filter(id => id !== badgeId)
      : currentShowcase.length < MAX_SHOWCASE
        ? [...currentShowcase, badgeId]
        : currentShowcase
    setLocalShowcase(next)
    try {
      await onUpdateShowcase?.(next)
    } catch {
      setLocalShowcase(snapshot)
    }
  }, [currentShowcase, onUpdateShowcase])

  const handlePick = useCallback(async (badge) => {
    if (earnedSet.has(badge.id)) return
    setPicking(badge.id)
    try {
      await onAward?.(badge.id, note || null)
      setNote('')
      setShowPicker(false)
    } finally {
      setPicking(null)
    }
  }, [earnedSet, note, onAward])

  const handleRevoke = useCallback(async (badgeId) => {
    if (currentShowcase.includes(badgeId)) {
      const snapshot = currentShowcase
      const next = currentShowcase.filter(id => id !== badgeId)
      setLocalShowcase(next)
      try {
        await onUpdateShowcase?.(next)
      } catch {
        setLocalShowcase(snapshot)
      }
    }
    await onRevoke?.(badgeId)
  }, [currentShowcase, onUpdateShowcase, onRevoke])

  const handleConfirmRevoke = useCallback(async () => {
    if (!confirmRevoke || revoking) return
    setRevoking(true)
    try {
      await handleRevoke(confirmRevoke.id)
      setConfirmRevoke(null)
    } finally {
      setRevoking(false)
    }
  }, [confirmRevoke, revoking, handleRevoke])

  const earnedList = earnedBadges
  const lockedList = allBadges.filter(b => !earnedSet.has(b.id))

  return (
    <section className="px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-display text-[10px] tracking-[3px] uppercase mb-0.5" style={{ color }}>
            ◈ Trofei
          </div>
          <div className="font-display font-black uppercase text-white text-sm tracking-wide">
            {earnedList.length} / {allBadges.length} sbloccati
          </div>
        </div>
        {!readonly && (
          <button
            onClick={() => setShowPicker(true)}
            className="font-display flex items-center gap-1.5 cursor-pointer"
            style={{
              padding: '6px 12px', borderRadius: 6,
              background: color + '15', border: `1px solid ${color}35`, color,
              fontSize: 10, fontWeight: 700,
              letterSpacing: '1.5px', textTransform: 'uppercase',
            }}
          >
            {ICON_PLUS} Assegna
          </button>
        )}
      </div>

      {/* ── Showcase preview ─────────────────────────────────────────────── */}
      {earnedList.length > 0 && (
        <div className="mb-6 rounded-[4px] p-4">
          <div className="font-display text-[8px] tracking-[2.5px] uppercase mb-3 flex items-center gap-2" style={{ color: color + '80' }}>
            {ICON_PIN}
            Profilo ({currentShowcase.length}/{MAX_SHOWCASE})
            {!!onUpdateShowcase && (
              <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>
                — tocca un badge per aggiungerlo
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {Array.from({ length: MAX_SHOWCASE }).map((_, i) => {
              const id = currentShowcase[i]
              return id ? (
                <div key={id} className="relative">
                  <BadgeMedal badgeId={id} unlocked size={68} showLabel />
                  {!!onUpdateShowcase && (
                    <button
                      onClick={() => toggleShowcase(id)}
                      aria-label="Rimuovi dalla vetrina"
                      className="absolute -top-1 -right-1 flex items-center justify-center cursor-pointer rounded-full"
                      style={{ width: 18, height: 18, background: '#374151', border: '1.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
                    >
                      {ICON_X}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  key={i}
                  style={{
                    width: 68, height: 68, borderRadius: '50%',
                    border: '2px dashed rgba(255,255,255,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 18 }}>+</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Badge earned ─────────────────────────────────────────────────── */}
      {earnedList.length > 0 && (
        <div className="mb-6">
          <div className="font-display text-[8px] tracking-[2.5px] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Ottenuti
          </div>
          <div className="flex flex-col">
            {earnedList.map((b, idx) => {
              const isPinned  = currentShowcase.includes(b.id)
              const canPin    = !!onUpdateShowcase && (isPinned || currentShowcase.length < MAX_SHOWCASE)
              const tier      = BADGE_TIERS[b.tier]
              const meta      = rawBadges[b.id] ?? {}
              const dateStr   = formatAwarded(meta.awardedAt)
              const isLast    = idx === earnedList.length - 1
              return (
                <div
                  key={b.id}
                  className="flex items-start gap-3 relative"
                  style={{
                    padding:      '14px 0',
                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Medal */}
                  <div className="shrink-0">
                    <BadgeMedal badgeId={b.id} unlocked size={52} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="font-display font-black uppercase text-white" style={{ fontSize: 12, letterSpacing: '0.5px', lineHeight: 1.2 }}>
                      {b.label}
                    </div>
                    <div className="font-body mt-1 leading-snug" style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>
                      {b.description}
                    </div>
                    {meta.note && (
                      <div className="font-body mt-1 leading-snug italic" style={{ fontSize: 10, color: color + '90' }}>
                        "{meta.note}"
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="font-display uppercase" style={{ fontSize: 8, color: tier.color, fontWeight: 700, letterSpacing: '1px' }}>
                        {tier.label}
                      </span>
                      {b.type === 'manual' && (
                        <span className="font-display uppercase" style={{ fontSize: 7, color: 'rgba(255,255,255,0.22)', letterSpacing: '1px' }}>
                          · Trainer
                        </span>
                      )}
                      {dateStr && (
                        <span className="font-display uppercase" style={{ fontSize: 7, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.5px' }}>
                          · {dateStr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Azioni top-right */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {!!onUpdateShowcase && (
                      <button
                        onClick={() => toggleShowcase(b.id)}
                        title={isPinned ? 'Rimuovi dal profilo' : currentShowcase.length >= MAX_SHOWCASE ? 'Profilo pieno' : 'Mostra sul profilo'}
                        aria-pressed={isPinned}
                        disabled={!canPin}
                        className="flex items-center justify-center cursor-pointer rounded-full transition-opacity"
                        style={{
                          width: 22, height: 22,
                          background:  isPinned ? color : 'rgba(30,40,55,0.95)',
                          border:      `1.5px solid ${isPinned ? color : 'rgba(255,255,255,0.15)'}`,
                          color:       isPinned ? '#000' : 'rgba(255,255,255,0.45)',
                          opacity:     canPin ? 1 : 0.3,
                        }}
                      >
                        {ICON_PIN}
                      </button>
                    )}
                    {!readonly && b.type === 'manual' && (
                      <button
                        onClick={() => setConfirmRevoke(b)}
                        title="Revoca badge"
                        className="flex items-center justify-center cursor-pointer rounded-full"
                        style={{ width: 22, height: 22, background: 'rgba(248,113,113,0.12)', border: '1.5px solid rgba(248,113,113,0.30)', color: '#f87171' }}
                      >
                        {ICON_X}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Badge locked ─────────────────────────────────────────────────── */}
      {lockedList.length > 0 && (
        <div>
          <div className="font-display text-[8px] tracking-[2.5px] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Bloccati
          </div>
          <div className="flex flex-col">
            {lockedList.map((b, idx) => {
              const prog   = b.type === 'auto' ? badgeProgress[b.id] : null
              const pct    = prog ? Math.round((prog.current / prog.total) * 100) : 0
              const tier   = BADGE_TIERS[b.tier]
              const isLast = idx === lockedList.length - 1
              return (
                <div
                  key={b.id}
                  className="flex items-start gap-3"
                  style={{
                    padding:      '14px 0',
                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  {/* Medal */}
                  <div className="shrink-0">
                    <BadgeMedal badgeId={b.id} unlocked={false} size={52} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="font-display font-black uppercase" style={{ fontSize: 12, letterSpacing: '0.5px', lineHeight: 1.2, color: 'rgba(255,255,255,0.30)' }}>
                      {b.label}
                    </div>
                    <div className="font-body mt-1 leading-snug" style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
                      {b.description}
                    </div>
                    {b.type === 'manual' && (
                      <div className="font-display mt-1.5 uppercase" style={{ fontSize: 7, letterSpacing: '1px', color: 'rgba(255,255,255,0.15)' }}>
                        Assegnato dal trainer
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="font-display uppercase" style={{ fontSize: 8, color: 'rgba(255,255,255,0.12)', fontWeight: 700, letterSpacing: '1px' }}>
                        {tier.label}
                      </span>
                      {prog && (
                        <span className="font-display uppercase" style={{ fontSize: 7, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.5px' }}>
                          {prog.current}/{prog.total}
                        </span>
                      )}
                    </div>
                    {prog && (
                      <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 6 }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: pct > 0 ? color + '60' : 'transparent',
                          borderRadius: 2, transition: 'width 600ms ease',
                        }} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {earnedList.length === 0 && lockedList.length === 0 && (
        <EmptyState color={color} icon={ICON_TROPHY} title="Nessun badge disponibile" />
      )}

      {/* ── Modal assegna badge manuale ──────────────────────────────────── */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-t-[4px] p-5 animate-in slide-in-from-bottom duration-300"
            style={{ background: 'var(--rx-surface)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-black uppercase text-white text-sm tracking-wide">
                Assegna Badge
              </div>
              <button onClick={() => setShowPicker(false)} aria-label="Chiudi" className="cursor-pointer flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.35)', border: 'none', background: 'none' }}>
                <IconClose size={14} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Nota opzionale (es. Ottima prestazione!)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="input-base w-full mb-4"
              style={{ fontSize: 13 }}
            />
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {MANUAL_BADGES.map(b => {
                const alreadyEarned = earnedSet.has(b.id)
                const tier          = BADGE_TIERS[b.tier]
                return (
                  <button
                    key={b.id}
                    disabled={alreadyEarned || picking === b.id}
                    onClick={() => handlePick(b)}
                    className="flex items-center gap-3 cursor-pointer text-left rounded-[3px] transition-all"
                    style={{
                      padding:    '10px 12px',
                      background: alreadyEarned ? 'rgba(255,255,255,0.03)' : color + '09',
                      border:     `1px solid ${alreadyEarned ? 'rgba(255,255,255,0.06)' : color + '25'}`,
                      opacity:    alreadyEarned ? 0.4 : 1,
                    }}
                  >
                    <BadgeMedal badgeId={b.id} unlocked={!alreadyEarned} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-black text-white" style={{ fontSize: 11, letterSpacing: '1px' }}>
                        {b.label}
                        {alreadyEarned && <span style={{ color, marginLeft: 6, fontSize: 9 }}>✓ assegnato</span>}
                      </div>
                      <div className="font-body mt-0.5 text-ellipsis overflow-hidden whitespace-nowrap" style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
                        {b.description}
                      </div>
                    </div>
                    <div className="font-display" style={{ fontSize: 9, color: tier.color, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', flexShrink: 0 }}>
                      {tier.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {confirmRevoke && (
        <ConfirmDialog
          title={`Revocare "${confirmRevoke.label}"?`}
          description="Il badge verrà rimosso dal profilo dell'atleta e, se in evidenza, anche dalla vetrina."
          confirmLabel="REVOCA"
          variant="danger"
          loading={revoking}
          onConfirm={handleConfirmRevoke}
          onCancel={() => setConfirmRevoke(null)}
        />
      )}
    </section>
  )
}
