import { useState, useCallback } from 'react'
import { BadgeMedal }            from '../../../components/ui/BadgeMedal'
import { BADGES, BADGE_TIERS, MANUAL_BADGES } from '../../../config/badges.config'

// ── Icona ✕ ───────────────────────────────────────────────────────────────────

const ICON_X = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ICON_PLUS = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * TrophiesSection — griglia badge per trainer e client.
 *
 * readonly=false (trainer): mostra pulsante assegna badge manuale + revoca.
 * readonly=true  (client):  solo visualizzazione earned/locked.
 */
export function TrophiesSection({
  rawBadges = {},
  earnedBadges = [],
  allBadges = BADGES,
  readonly = false,
  onAward,
  onRevoke,
  color = '#0fd65a',
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [note,       setNote]       = useState('')
  const [picking,    setPicking]    = useState(null)

  const earned = Object.keys(rawBadges)

  const handlePick = useCallback(async (badge) => {
    if (earned.includes(badge.id)) return
    setPicking(badge.id)
    try {
      await onAward?.(badge.id, note || null)
      setNote('')
      setShowPicker(false)
    } finally {
      setPicking(null)
    }
  }, [earned, note, onAward])

  const handleRevoke = useCallback(async (badgeId) => {
    await onRevoke?.(badgeId)
  }, [onRevoke])

  // Separa earned (visibili per primi) e locked (in fondo, opachi)
  const earnedIds  = new Set(earned)
  const earnedList = allBadges.filter(b => earnedIds.has(b.id))
  const lockedList = allBadges.filter(b => !earnedIds.has(b.id))

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
            className="flex items-center gap-1.5 cursor-pointer"
            style={{
              padding:      '6px 12px',
              borderRadius: 6,
              background:   color + '15',
              border:       `1px solid ${color}35`,
              color,
              fontFamily:   'Montserrat, sans-serif',
              fontSize:     10,
              fontWeight:   700,
              letterSpacing:'1.5px',
              textTransform:'uppercase',
            }}
          >
            {ICON_PLUS} Assegna
          </button>
        )}
      </div>

      {/* Griglia earned */}
      {earnedList.length > 0 && (
        <div className="mb-6">
          <div className="font-display text-[8px] tracking-[2.5px] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Ottenuti
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
            {earnedList.map(b => {
              const isManual = b.type === 'manual'
              const tier     = BADGE_TIERS[b.tier]
              return (
                <div key={b.id} className="flex flex-col items-center gap-1.5 relative group">
                  <BadgeMedal badgeId={b.id} unlocked size={64} showLabel />
                  {/* Tier label */}
                  <div className="font-display text-[7px] uppercase tracking-[1px]" style={{ color: tier.color + '80' }}>
                    {tier.label}
                  </div>
                  {/* Revoca (solo manual + !readonly) */}
                  {!readonly && isManual && (
                    <button
                      onClick={() => handleRevoke(b.id)}
                      title="Revoca badge"
                      className="absolute -top-1 -right-1 flex items-center justify-center cursor-pointer rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ width: 18, height: 18, background: '#f87171', border: '1.5px solid #000', color: '#000' }}
                    >
                      {ICON_X}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Griglia locked */}
      {lockedList.length > 0 && (
        <div>
          <div className="font-display text-[8px] tracking-[2.5px] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Bloccati
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
            {lockedList.map(b => (
              <div key={b.id} className="flex flex-col items-center gap-1.5">
                <BadgeMedal badgeId={b.id} unlocked={false} size={64} showLabel />
                <div className="font-display text-[7px] uppercase tracking-[1px]" style={{ color: 'rgba(255,255,255,0.12)' }}>
                  {BADGE_TIERS[b.tier].label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {earnedList.length === 0 && lockedList.length === 0 && (
        <div className="text-center py-12 font-display uppercase tracking-[3px] text-[9px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Nessun badge disponibile
        </div>
      )}

      {/* ── Modal assegna badge manuale ──────────────────────────────────── */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl p-5 animate-in slide-in-from-bottom duration-300"
            style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-black uppercase text-white text-sm tracking-wide">
                Assegna Badge
              </div>
              <button onClick={() => setShowPicker(false)} className="cursor-pointer" style={{ color: 'rgba(255,255,255,0.35)', border: 'none', background: 'none', fontSize: 20, lineHeight: 1 }}>✕</button>
            </div>

            {/* Nota opzionale */}
            <input
              type="text"
              placeholder="Nota opzionale (es. Ottima prestazione!)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="input-base w-full mb-4"
              style={{ fontSize: 13 }}
            />

            {/* Lista badge manuali non ancora assegnati */}
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {MANUAL_BADGES.map(b => {
                const alreadyEarned = earnedIds.has(b.id)
                const tier          = BADGE_TIERS[b.tier]
                return (
                  <button
                    key={b.id}
                    disabled={alreadyEarned || picking === b.id}
                    onClick={() => handlePick(b)}
                    className="flex items-center gap-3 cursor-pointer text-left rounded-lg transition-all"
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
                      </div>
                      <div className="font-body mt-0.5 text-ellipsis overflow-hidden whitespace-nowrap" style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
                        {b.description}
                      </div>
                    </div>
                    <div style={{ fontSize: 9, color: tier.color, fontFamily: 'Montserrat', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', shrink: 0 }}>
                      {tier.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
