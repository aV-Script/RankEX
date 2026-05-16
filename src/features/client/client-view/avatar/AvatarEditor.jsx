import { useState } from 'react'
import { updateClient } from '../../../../firebase/services/clients'
import {
  SoccerAvatar, SKIN_TONES, HAIR_COLORS, AVATAR_OPTIONS,
} from './SoccerAvatar'

const SKIN_LABELS  = { light: 'Chiara', medium: 'Media', tan: 'Olivastra', dark: 'Scura' }
const HAIR_LABELS  = { black: 'Neri', brown: 'Castani', blond: 'Biondi', red: 'Rossi', white: 'Bianchi' }
const STYLE_LABELS = { short: 'Corto', spiky: 'A punte', curly: 'Ricci', long: 'Lungo', mohawk: 'Mohawk' }
const EXPR_LABELS  = { happy: 'Felice', determined: 'Deciso', cool: 'Cool', excited: 'Entusiasta' }
const POSE_LABELS  = { standing: 'In piedi', confident: 'Sicuro', ready: 'Pronto', celebrate: 'Esulta' }

const SECTIONS = [
  {
    id: 'skinTone', label: 'Carnagione',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  },
  {
    id: 'hairColor', label: 'Colore capelli',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a5 5 0 0 1 5 5c0 5-5 9-5 9S7 12 7 7a5 5 0 0 1 5-5z" /><circle cx="12" cy="7" r="1.5" fill="currentColor" /></svg>,
  },
  {
    id: 'hairStyle', label: 'Stile capelli',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3c0 6 3 9.5 6 9.5S18 9 18 3" /><line x1="12" y1="12.5" x2="12" y2="20" /></svg>,
  },
  {
    id: 'expression', label: 'Espressione',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" /></svg>,
  },
  {
    id: 'pose', label: 'Posa',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="4" r="2" /><path d="M9 9h6l-1 5-2 7M9 14l-2 7" /></svg>,
  },
]

export function AvatarEditor({ client, clientId, orgId, color }) {
  const saved = client.avatar ?? {}
  const [skinTone,    setSkinTone]   = useState(saved.skinTone   ?? 'light')
  const [hairColor,   setHairColor]  = useState(saved.hairColor  ?? 'black')
  const [hairStyle,   setHairStyle]  = useState(saved.hairStyle  ?? 'short')
  const [expression,  setExpression] = useState(saved.expression ?? 'happy')
  const [pose,        setPose]       = useState(saved.pose       ?? 'standing')
  const [saving,      setSaving]     = useState(false)
  const [saved2,      setSaved2]     = useState(false)
  const [openSection, setOpenSection] = useState(null)

  const current = { skinTone, hairColor, hairStyle, expression, pose }
  const toggle  = (id) => setOpenSection(prev => prev === id ? null : id)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateClient(orgId, clientId, { avatar: current })
      setSaved2(true)
      setTimeout(() => setSaved2(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row" style={{ minHeight: 'calc(100svh - 80px)' }}>

      {/* ── Showcase avatar (sticky desktop) ────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col items-center shrink-0 sticky top-0 w-[44%] h-[calc(100svh-80px)]"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Label */}
        <div className="w-full px-7 pt-6 shrink-0">
          <span className="font-display text-[7px] tracking-[5px] uppercase" style={{ color: 'rgba(255,255,255,0.20)' }}>
            Character Editor
          </span>
        </div>

        {/* Avatar centrato */}
        <div className="flex-1 flex items-center justify-center w-full">
          <SoccerAvatar {...current} color={color} width={240} />
        </div>

        {/* Nome + salva */}
        <div className="w-full px-7 pb-7 flex flex-col items-center gap-3 shrink-0">
          <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="font-display font-black uppercase text-center text-white"
            style={{ fontSize: 15, letterSpacing: '0.1em' }}>
            {client.name}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rx-btn-primary font-display tracking-[3px] py-3 rounded-[4px] cursor-pointer disabled:opacity-50 transition-all"
            style={{ fontSize: 10 }}
          >
            {saving ? '…' : saved2 ? '✓ SALVATO' : 'SALVA AVATAR'}
          </button>
        </div>
      </div>

      {/* ── Mobile: avatar compatto in cima ─────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-4 px-5 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SoccerAvatar {...current} color={color} width={70} />
        <div className="flex-1 min-w-0">
          <div className="font-display font-black uppercase text-white truncate"
            style={{ fontSize: 13, letterSpacing: '0.08em' }}>
            {client.name}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rx-btn-primary font-display tracking-[2px] shrink-0 cursor-pointer disabled:opacity-50"
          style={{ fontSize: 9, padding: '8px 14px', borderRadius: 4 }}
        >
          {saving ? '…' : saved2 ? '✓' : 'SALVA'}
        </button>
      </div>

      {/* ── Sezioni accordion ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto">

        {SECTIONS.map((sec, i) => {
          const isOpen = openSection === sec.id
          return (
            <div
              key={sec.id}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderLeft:   isOpen ? `3px solid ${color}` : '3px solid transparent',
                transition:   'border-color 0.2s ease',
              }}
            >
              {/* Header */}
              <button
                onClick={() => toggle(sec.id)}
                className="w-full flex items-center gap-4 cursor-pointer text-left"
                style={{ padding: '18px 20px' }}
              >
                <div
                  className="shrink-0 flex items-center justify-center rounded-[4px] transition-all"
                  style={{
                    width:      40,
                    height:     40,
                    background: isOpen ? color + '18' : 'rgba(255,255,255,0.04)',
                    border:     isOpen ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.07)',
                    color:      isOpen ? color : 'rgba(255,255,255,0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {sec.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-display text-[7px] tracking-[2px] uppercase mb-0.5"
                    style={{ color: isOpen ? color + '65' : 'rgba(255,255,255,0.18)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="font-display font-black uppercase"
                    style={{ fontSize: 10, color: isOpen ? color : 'rgba(255,255,255,0.55)', transition: 'color 0.2s ease' }}>
                    {sec.label}
                  </div>
                </div>

                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={isOpen ? color : 'rgba(255,255,255,0.20)'}
                  strokeWidth="2" strokeLinecap="round" className="shrink-0"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s ease' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Contenuto espanso */}
              {isOpen && (
                <div className="px-5 pt-3 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {sec.id === 'skinTone' && (
                    <div className="flex flex-wrap gap-4">
                      {AVATAR_OPTIONS.skinTone.map(key => (
                        <ColorSwatch key={key} bg={SKIN_TONES[key]} label={SKIN_LABELS[key]}
                          active={skinTone === key} color={color} onClick={() => setSkinTone(key)} />
                      ))}
                    </div>
                  )}
                  {sec.id === 'hairColor' && (
                    <div className="flex flex-wrap gap-4">
                      {AVATAR_OPTIONS.hairColor.map(key => (
                        <ColorSwatch key={key} bg={HAIR_COLORS[key]} label={HAIR_LABELS[key]}
                          active={hairColor === key} color={color} onClick={() => setHairColor(key)} />
                      ))}
                    </div>
                  )}
                  {sec.id === 'hairStyle' && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {AVATAR_OPTIONS.hairStyle.map(s => (
                        <AvatarChip key={s} label={STYLE_LABELS[s]} active={hairStyle === s}
                          color={color} onClick={() => setHairStyle(s)}>
                          <SoccerAvatar {...current} hairStyle={s} color={color} width={88} />
                        </AvatarChip>
                      ))}
                    </div>
                  )}
                  {sec.id === 'expression' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {AVATAR_OPTIONS.expression.map(e => (
                        <AvatarChip key={e} label={EXPR_LABELS[e]} active={expression === e}
                          color={color} onClick={() => setExpression(e)}>
                          <SoccerAvatar {...current} expression={e} color={color} width={88} />
                        </AvatarChip>
                      ))}
                    </div>
                  )}
                  {sec.id === 'pose' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {AVATAR_OPTIONS.pose.map(p => (
                        <AvatarChip key={p} label={POSE_LABELS[p]} active={pose === p}
                          color={color} onClick={() => setPose(p)}>
                          <SoccerAvatar {...current} pose={p} color={color} width={88} />
                        </AvatarChip>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

      </div>
    </div>
  )
}

// ── Swatch colore ─────────────────────────────────────────────────────────────

function ColorSwatch({ bg, label, active, color, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer">
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: bg,
        border:    active ? `3px solid ${color}` : '3px solid rgba(255,255,255,0.10)',
        boxShadow: active ? `0 0 0 3px ${color}28, 0 0 16px ${color}50` : 'none',
        transform: active ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.15s ease',
      }} />
      <span className="font-display text-[8px] tracking-[1.5px] uppercase"
        style={{ color: active ? color : 'rgba(255,255,255,0.28)', transition: 'color 0.15s' }}>
        {label}
      </span>
    </button>
  )
}

// ── Chip mini avatar ──────────────────────────────────────────────────────────

function AvatarChip({ label, active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center overflow-hidden cursor-pointer rounded-[5px]"
      style={{
        background: active ? color + '12' : 'rgba(255,255,255,0.02)',
        border:    active ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.07)',
        boxShadow: active ? `0 0 0 1px ${color}20, 0 4px 16px ${color}25` : 'none',
        transform: active ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 0.15s ease',
      }}
    >
      <div className="w-full flex justify-center" style={{ lineHeight: 0 }}>
        {children}
      </div>
      <span className="font-display tracking-[1.5px] uppercase py-1.5"
        style={{ fontSize: 8, color: active ? color : 'rgba(255,255,255,0.28)' }}>
        {label}
      </span>
    </button>
  )
}
