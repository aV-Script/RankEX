import { useState } from 'react'
import { updateClient } from '../../../../firebase/services/clients'
import {
  SoccerAvatar, SKIN_TONES, HAIR_COLORS, FACIAL_HAIR_COLORS,
  AVATAR_OPTIONS, JERSEY_PALETTE, HAT_PALETTE, ACCESSORIES_PALETTE, HAT_TOPS,
} from './SoccerAvatar'

// ── Labels ────────────────────────────────────────────────────────────────────

const SKIN_LABELS = {
  ivory: 'Avorio', porcelain: 'Porcellana', pale: 'Pallida', light: 'Chiara',
  fair: 'Chiara+', lightMedium: 'M.Chiara', sand: 'Sabbia', medium: 'Media',
  golden: 'Dorata', warmMedium: 'Calda', olive: 'Olivastra', tan: 'Abbronzata',
  caramel: 'Caramello', deepTan: 'Bronzo', sienna: 'Siena', brown: 'Bruna',
  toffee: 'Toffee', deepBrown: 'Bruna+', mahogany: 'Mogano', dark: 'Scura',
}

const STYLE_LABELS = {
  buzz: 'Rasato', shavedSides: 'Rasato+',
  short: 'Corto', caesar: 'Scalato', sidePart: 'Con riga', wavy: 'Mosso',
  round: 'Tondo', shortCurly: 'Riccio', spiky: 'Punk', shaggy: 'Spettinato',
  mullet: 'Mullet', medium: 'Medio', bob: 'Bob', mia: 'Mia W.',
  long: 'Lungo', straight2: 'Liscio 2', strand: 'Ciocca', bigHair: 'Voluminoso',
  bun: 'Chignon', frida: 'Frida',
  curly: 'Ricci', curvy: 'Ondulato', afro: 'Afro', afroBand: 'Afro+',
  dreads: 'Dreads', dreads2: 'Dreads 2', dreads3: 'Dreads 3',
  hat: 'Cappello', hijab: 'Hijab', turban: 'Turbante',
  winterHat1: 'Invernale 1', winterHat2: 'Invernale 2',
  winterHat3: 'Invernale 3', winterHat4: 'Invernale 4',
}

const HAIR_LABELS = {
  black: 'Nero', darkBrown: 'Marr.sc.', brown: 'Castano', medBrown: 'Marrone',
  auburn: 'Ramato', red: 'Rosso', copper: 'Rame', darkBlond: 'Biondo sc.',
  blond: 'Biondo', lightBlond: 'Biondo ch.', ginger: 'Zenzero',
  platinum: 'Platino', white: 'Bianco', teal: 'Turchese', blue: 'Blu',
  purple: 'Viola', pink: 'Rosa', green: 'Verde', silver: 'Argento',
  rainbow: 'Fantasia',
}

const FACIAL_HAIR_LABELS = {
  none: 'Nessuna', beardLight: 'Barba legg.', beardMedium: 'Barba med.',
  beardMajestic: 'Barba lunga', moustacheFancy: 'Baffi eleg.', moustacheMagnum: 'Baffi larghi',
}

const FACIAL_HAIR_COLOR_LABELS = {
  black: 'Nero', darkBrown: 'Marr.sc.', brown: 'Castano', auburn: 'Ramato',
  red: 'Rosso', blond: 'Biondo', ginger: 'Zenzero', platinum: 'Platino',
  white: 'Bianco', silver: 'Argento',
}

const EXPRESSION_LABELS = {
  happy: 'Felice', fired_up: 'Carico', focused: 'Concentrato', confident: 'Sicuro',
  cool: 'Cool', cheeky: 'Birichino', proud: 'Orgoglioso', angry: 'Arrabbiato',
  sneaky: 'Furbo', surprised: 'Sorpreso', wink: 'Occhiolino', sleepy: 'Assonnato',
  lovestruck: 'Innamorato', dizzy: 'Stordito', eating: 'Affamato',
  worried: 'Preoccupato', tough: 'Duro', excited: 'Entusiasta',
  joker: 'Burlone', neutral: 'Neutro',
}

const ACCESSORY_LABELS = {
  none: 'Nessuno', sunglasses: 'Occhiali', wayfarers: 'Wayfarer',
  round: 'Tondi', prescription01: 'Vista 1', prescription02: 'Vista 2',
  kurt: 'Kurt', eyepatch: 'Benda',
}

const CLOTHING_LABELS = {
  jersey: 'Maglia', vneck: 'V-Neck', scoop: 'Scollato', polo: 'Polo',
  hoodie: 'Felpa', graphic: 'Grafica', overall: 'Tutone',
  blazer: 'Blazer', sweater: 'Maglione',
}

const CLOTHING_GRAPHIC_LABELS = {
  bat: 'Pipistrello', bear: 'Orso', cumbia: 'Cumbia', deer: 'Cervo',
  diamond: 'Diamante', hola: 'Hola', pizza: 'Pizza', resist: 'Resist',
  skull: 'Teschio', skullOutline: 'Teschio 2',
}

// ── Icone sezioni ─────────────────────────────────────────────────────────────

const ICON_SKIN = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const ICON_HAIR_STYLE = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 3c0 6 3 9.5 6 9.5S18 9 18 3"/>
    <line x1="12" y1="12.5" x2="12" y2="20"/>
  </svg>
)
const ICON_HAIR_COLOR = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2a5 5 0 0 1 5 5c0 5-5 9-5 9S7 12 7 7a5 5 0 0 1 5-5z"/>
    <circle cx="12" cy="7" r="1.5" fill="currentColor"/>
  </svg>
)
const ICON_BEARD = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M8 14c0 0-2 1-2 4h12c0-3-2-4-2-4"/>
    <path d="M10 18c0 0 0 2 2 2s2-2 2-2"/>
  </svg>
)
const ICON_BEARD_COLOR = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M8 14c0 0-2 1-2 4h12c0-3-2-4-2-4"/>
    <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
)
const ICON_EXPRESSION = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/>
    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/>
  </svg>
)
const ICON_ACCESSORY = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="5" cy="12" r="2"/>
    <circle cx="19" cy="12" r="2"/>
    <path d="M7 12h5M14 12h3"/>
    <path d="M3 12C3 7 5 5 9 5h6c4 0 6 2 6 7"/>
  </svg>
)
const ICON_ACC_COLOR = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="5" cy="12" r="2"/>
    <circle cx="19" cy="12" r="2"/>
    <path d="M7 12h10"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
)
const ICON_CLOTHING = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
  </svg>
)
const ICON_GRAPHIC = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)
const ICON_JERSEY_COLOR = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 3a9 9 0 0 1 9 9"/>
  </svg>
)
const ICON_NUMBER = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M9 8v8M15 8v8M6 12h12"/>
  </svg>
)

// ── Bottom sheet height (mobile) ──────────────────────────────────────────────
const PANEL_H = 340

// ── Componente ────────────────────────────────────────────────────────────────

export function AvatarEditor({ client, clientId, orgId, color }) {
  const saved = client.avatar ?? {}

  const validOr = (val, opts, fallback) => opts.includes(val) ? val : fallback

  const [skinTone,         setSkinTone]         = useState(validOr(saved.skinTone,        AVATAR_OPTIONS.skinTone,        'light'))
  const [hairStyle,        setHairStyle]        = useState(validOr(saved.hairStyle,       AVATAR_OPTIONS.hairStyle,       'short'))
  const [hairColor,        setHairColor]        = useState(validOr(saved.hairColor,       AVATAR_OPTIONS.hairColor,       'black'))
  const [facialHair,       setFacialHair]       = useState(validOr(saved.facialHair,      AVATAR_OPTIONS.facialHair,      'none'))
  const [facialHairColor,  setFacialHairColor]  = useState(validOr(saved.facialHairColor, AVATAR_OPTIONS.facialHairColor, 'black'))
  const [expression,       setExpression]       = useState(validOr(saved.expression,      AVATAR_OPTIONS.expression,      'happy'))
  const [accessory,        setAccessory]        = useState(validOr(saved.accessory,       AVATAR_OPTIONS.accessory,       'none'))
  const [accessoriesColor, setAccessoriesColor] = useState(saved.accessoriesColor ?? '#262e33')
  const [clothing,         setClothing]         = useState(validOr(saved.clothing,        AVATAR_OPTIONS.clothing,        'jersey'))
  const [clothingGraphic,  setClothingGraphic]  = useState(validOr(saved.clothingGraphic, AVATAR_OPTIONS.clothingGraphic, 'bat'))
  const [jerseyColor,      setJerseyColor]      = useState(saved.jerseyColor ?? null)
  const [hatColor,         setHatColor]         = useState(saved.hatColor    ?? null)
  const [number,           setNumber]           = useState(saved.number      ?? '')
  const [saving,           setSaving]           = useState(false)
  const [savedOk,          setSavedOk]          = useState(false)
  const [saveError,        setSaveError]        = useState(false)
  const [openSection,      setOpenSection]      = useState(null)
  const [drawerOpen,       setDrawerOpen]       = useState(false)

  const isHatTop = HAT_TOPS.has(hairStyle)

  const current = {
    skinTone, hairStyle, hairColor,
    facialHair, facialHairColor,
    expression,
    accessory, accessoriesColor,
    clothing, clothingGraphic, jerseyColor,
    hatColor, number,
  }

  const toggle = (id) => setOpenSection(prev => prev === id ? null : id)

  const SECTIONS = [
    { id: 'skinTone',    label: 'Carnagione',                              icon: ICON_SKIN },
    { id: 'hairStyle',   label: 'Capelli / Copricapo',                     icon: ICON_HAIR_STYLE },
    { id: 'hairColor',   label: isHatTop ? 'Colore copricapo' : 'Colore capelli', icon: ICON_HAIR_COLOR },
    { id: 'facialHair',  label: 'Barba & Baffi',                           icon: ICON_BEARD },
    ...(facialHair !== 'none' ? [{ id: 'facialHairColor', label: 'Colore barba', icon: ICON_BEARD_COLOR }] : []),
    { id: 'expression',  label: 'Espressione',                             icon: ICON_EXPRESSION },
    { id: 'accessory',   label: 'Accessori',                               icon: ICON_ACCESSORY },
    ...(accessory !== 'none' ? [{ id: 'accessoriesColor', label: 'Colore accessori', icon: ICON_ACC_COLOR }] : []),
    { id: 'clothing',    label: 'Stile maglia',                            icon: ICON_CLOTHING },
    ...(clothing === 'graphic' ? [{ id: 'clothingGraphic', label: 'Grafica maglia', icon: ICON_GRAPHIC }] : []),
    { id: 'jerseyColor', label: 'Colore maglia',                           icon: ICON_JERSEY_COLOR },
    { id: 'number',      label: 'Numero maglia',                           icon: ICON_NUMBER },
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateClient(orgId, clientId, { avatar: current })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    } catch (err) {
      console.error('[AvatarEditor] save failed', { orgId, clientId, err })
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  // ── Contenuto sezione (usato da accordion desktop + bottom sheet mobile) ──
  const renderContent = (id) => {
    switch (id) {

      case 'skinTone':
        return (
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_OPTIONS.skinTone.map(key => (
              <ColorSwatch key={key} bg={SKIN_TONES[key]} label={SKIN_LABELS[key]}
                size={40} active={skinTone === key} color={color} onClick={() => setSkinTone(key)} />
            ))}
          </div>
        )

      case 'hairStyle':
        return (
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_OPTIONS.hairStyle.map(s => (
              <AvatarChip key={s} label={STYLE_LABELS[s]} active={hairStyle === s}
                color={color} onClick={() => setHairStyle(s)}>
                <SoccerAvatar {...current} hairStyle={s} color={color} width={64} />
              </AvatarChip>
            ))}
          </div>
        )

      case 'hairColor':
        return isHatTop ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setHatColor(null)}
              className="flex items-center gap-3 cursor-pointer rounded-[5px] px-3 py-2"
              style={{
                background: hatColor === null ? color + '12' : 'rgba(255,255,255,0.02)',
                border:     hatColor === null ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.07)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}60` }} />
              <div>
                <div className="font-display font-black text-[9px] tracking-[2px] uppercase"
                  style={{ color: hatColor === null ? color : 'rgba(255,255,255,0.55)' }}>
                  Segui il rank
                </div>
                <div className="font-display text-[7px]" style={{ color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>
                  Cambia con il progresso
                </div>
              </div>
            </button>
            <div className="grid grid-cols-5 gap-2 justify-items-center">
              {HAT_PALETTE.map(hex => (
                <CircleSwatch key={hex} hex={hex} active={hatColor === hex}
                  color={color} onClick={() => setHatColor(hex)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_OPTIONS.hairColor.map(key => (
              <ColorSwatch key={key} bg={HAIR_COLORS[key]} label={HAIR_LABELS[key]}
                size={40} active={hairColor === key} color={color} onClick={() => setHairColor(key)} />
            ))}
          </div>
        )

      case 'facialHair':
        return (
          <div className="grid grid-cols-3 gap-2">
            {AVATAR_OPTIONS.facialHair.map(f => (
              <AvatarChip key={f} label={FACIAL_HAIR_LABELS[f]} active={facialHair === f}
                color={color} onClick={() => setFacialHair(f)}>
                <SoccerAvatar {...current} facialHair={f} color={color} width={76} />
              </AvatarChip>
            ))}
          </div>
        )

      case 'facialHairColor':
        return (
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_OPTIONS.facialHairColor.map(key => (
              <ColorSwatch key={key} bg={FACIAL_HAIR_COLORS[key]} label={FACIAL_HAIR_COLOR_LABELS[key]}
                size={40} active={facialHairColor === key} color={color} onClick={() => setFacialHairColor(key)} />
            ))}
          </div>
        )

      case 'expression':
        return (
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_OPTIONS.expression.map(e => (
              <AvatarChip key={e} label={EXPRESSION_LABELS[e]} active={expression === e}
                color={color} onClick={() => setExpression(e)}>
                <SoccerAvatar {...current} expression={e} color={color} width={72} />
              </AvatarChip>
            ))}
          </div>
        )

      case 'accessory':
        return (
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_OPTIONS.accessory.map(a => (
              <AvatarChip key={a} label={ACCESSORY_LABELS[a]} active={accessory === a}
                color={color} onClick={() => setAccessory(a)}>
                <SoccerAvatar {...current} accessory={a} color={color} width={72} />
              </AvatarChip>
            ))}
          </div>
        )

      case 'accessoriesColor':
        return (
          <div className="grid grid-cols-5 gap-2 justify-items-center">
            {ACCESSORIES_PALETTE.map(hex => (
              <CircleSwatch key={hex} hex={hex} active={accessoriesColor === hex}
                color={color} onClick={() => setAccessoriesColor(hex)} />
            ))}
          </div>
        )

      case 'clothing':
        return (
          <div className="grid grid-cols-3 gap-2">
            {AVATAR_OPTIONS.clothing.map(c => (
              <AvatarChip key={c} label={CLOTHING_LABELS[c]} active={clothing === c}
                color={color} onClick={() => setClothing(c)}>
                <SoccerAvatar {...current} clothing={c} color={color} width={80} />
              </AvatarChip>
            ))}
          </div>
        )

      case 'clothingGraphic':
        return (
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_OPTIONS.clothingGraphic.map(g => (
              <AvatarChip key={g} label={CLOTHING_GRAPHIC_LABELS[g]} active={clothingGraphic === g}
                color={color} onClick={() => setClothingGraphic(g)}>
                <SoccerAvatar {...current} clothingGraphic={g} color={color} width={60} />
              </AvatarChip>
            ))}
          </div>
        )

      case 'jerseyColor':
        return (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setJerseyColor(null)}
              className="flex items-center gap-3 cursor-pointer rounded-[5px] px-3 py-2"
              style={{
                background: jerseyColor === null ? color + '12' : 'rgba(255,255,255,0.02)',
                border:     jerseyColor === null ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.07)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}60` }} />
              <div>
                <div className="font-display font-black text-[9px] tracking-[2px] uppercase"
                  style={{ color: jerseyColor === null ? color : 'rgba(255,255,255,0.55)' }}>
                  Segui il rank
                </div>
                <div className="font-display text-[7px]" style={{ color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>
                  Cambia con il progresso
                </div>
              </div>
            </button>
            <div className="grid grid-cols-5 gap-2 justify-items-center">
              {JERSEY_PALETTE.map(hex => (
                <CircleSwatch key={hex} hex={hex} active={jerseyColor === hex}
                  color={color} onClick={() => setJerseyColor(hex)} />
              ))}
            </div>
          </div>
        )

      case 'number':
        return (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="Es. 10"
              value={number}
              onChange={e => setNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              className="input-base"
              style={{ textAlign: 'center', fontSize: 24, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.1em', padding: '12px' }}
            />
            <p className="font-display text-[8px] tracking-[1px] text-center" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Lascia vuoto per non mostrare il numero
            </p>
          </div>
        )

      default:
        return null
    }
  }

  // ── Save button label helper ──────────────────────────────────────────────
  const saveLabel = saving ? '…' : savedOk ? '✓ SALVATO' : saveError ? '✗ ERRORE' : 'SALVA AVATAR'

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP — avatar showcase sinistra + accordion destra
          ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex" style={{ minHeight: 'calc(100svh - 80px)' }}>

        {/* Showcase sticky */}
        <div
          className="flex flex-col items-center shrink-0 sticky top-0 w-[44%] h-[calc(100svh-80px)]"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="w-full px-7 pt-6 shrink-0">
            <span className="font-display text-[7px] tracking-[5px] uppercase" style={{ color: 'rgba(255,255,255,0.20)' }}>
              Character Editor
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center w-full">
            <SoccerAvatar {...current} color={color} width={230} />
          </div>
          <div className="w-full px-7 pb-7 flex flex-col items-center gap-3 shrink-0">
            <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="font-display font-black uppercase text-center text-white" style={{ fontSize: 15, letterSpacing: '0.1em' }}>
              {client.name}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rx-btn-primary font-display tracking-[3px] py-3 rounded-[4px] cursor-pointer disabled:opacity-50 transition-all"
              style={{ fontSize: 10 }}
            >
              {saveLabel}
            </button>
          </div>
        </div>

        {/* Accordion */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {SECTIONS.map((sec, i) => {
            const isOpen = openSection === sec.id
            return (
              <div key={sec.id} style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderLeft:   isOpen ? `3px solid ${color}` : '3px solid transparent',
                transition:   'border-color 0.2s ease',
              }}>
                <button
                  onClick={() => toggle(sec.id)}
                  className="w-full flex items-center gap-4 cursor-pointer text-left"
                  style={{ padding: '14px 20px' }}
                >
                  <div className="shrink-0 flex items-center justify-center rounded-[4px]" style={{
                    width: 36, height: 36,
                    background: isOpen ? color + '18' : 'rgba(255,255,255,0.04)',
                    border:     isOpen ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.07)',
                    color:      isOpen ? color : 'rgba(255,255,255,0.35)',
                    transition: 'all 0.2s ease',
                  }}>
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
                {isOpen && (
                  <div className="px-4 pt-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {renderContent(sec.id)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE — avatar full-screen + drawer laterale sovrapposto
          ════════════════════════════════════════════════════════════════════ */}
      <div
        className="lg:hidden"
        style={{ position: 'relative', height: 'calc(100svh - 80px)', overflow: 'hidden' }}
      >

        {/* Avatar — sempre visibile sullo sfondo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <span className="font-display uppercase"
            style={{ fontSize: 7, letterSpacing: '5px', color: 'rgba(255,255,255,0.18)', fontFamily: 'Montserrat, sans-serif' }}>
            Character Editor
          </span>
          <SoccerAvatar {...current} color={color} width={220} />
          <div className="font-display font-black uppercase text-white"
            style={{ fontSize: 14, letterSpacing: '0.08em', textShadow: `0 0 28px ${color}28` }}>
            {client.name}
          </div>
          {/* Tasti azione — visibili quando il drawer è chiuso */}
          <div className="flex gap-3 mt-1" style={{ opacity: drawerOpen ? 0 : 1, transition: 'opacity 0.2s ease', pointerEvents: drawerOpen ? 'none' : 'auto' }}>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 font-display font-black uppercase cursor-pointer"
              style={{ fontSize: 9, letterSpacing: '2px', padding: '10px 18px', borderRadius: 6, background: color + '18', color, border: `1.5px solid ${color}55`, boxShadow: `0 0 24px ${color}18` }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Modifica
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="font-display font-black uppercase cursor-pointer disabled:opacity-50"
              style={{ fontSize: 9, letterSpacing: '2px', padding: '10px 18px', borderRadius: 6, background: color, color: '#000', fontFamily: 'Montserrat, sans-serif' }}
            >
              {saving ? '…' : savedOk ? '✓' : saveError ? '✗' : 'Salva'}
            </button>
          </div>
        </div>

        {/* Backdrop semitrasparente */}
        <div
          className="absolute inset-0"
          style={{
            background:     'rgba(0,0,0,0.55)',
            backdropFilter: drawerOpen ? 'blur(3px)' : 'blur(0px)',
            zIndex:         10,
            opacity:        drawerOpen ? 1 : 0,
            pointerEvents:  drawerOpen ? 'auto' : 'none',
            transition:     'opacity 0.28s ease',
          }}
          onClick={() => { setOpenSection(null); setDrawerOpen(false) }}
        />

        {/* Drawer — scivola da destra */}
        <div style={{
          position:            'absolute',
          top: 0, right: 0, bottom: 0,
          width:               '83%',
          background:          'rgba(4,7,12,0.98)',
          backdropFilter:      'blur(32px)',
          WebkitBackdropFilter:'blur(32px)',
          borderLeft:          '1px solid rgba(255,255,255,0.08)',
          boxShadow:           '-8px 0 48px rgba(0,0,0,0.7)',
          zIndex:              20,
          display:             'flex',
          flexDirection:       'column',
          transform:           drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition:          'transform 0.32s cubic-bezier(0.32,0,0.08,1)',
        }}>

          {/* Header drawer */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {openSection ? (
              <button
                onClick={() => setOpenSection(null)}
                className="flex items-center justify-center cursor-pointer shrink-0"
                style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
            ) : null}
            <div className="flex-1 min-w-0">
              <div className="font-display text-[6px] tracking-[3px] uppercase" style={{ color: color + '65' }}>
                {openSection ? 'Modifica' : 'Character Editor'}
              </div>
              <div className="font-display font-black uppercase text-white truncate" style={{ fontSize: 11, letterSpacing: '1.5px' }}>
                {openSection ? SECTIONS.find(s => s.id === openSection)?.label : 'Personalizza'}
              </div>
            </div>
            <button
              onClick={() => { setOpenSection(null); setDrawerOpen(false) }}
              className="flex items-center justify-center cursor-pointer shrink-0"
              style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.40)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Body drawer */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {openSection ? (
              // Contenuto sezione selezionata
              <div className="p-4">{renderContent(openSection)}</div>
            ) : (
              // Lista sezioni
              SECTIONS.map((sec, i) => (
                <button
                  key={sec.id}
                  onClick={() => setOpenSection(sec.id)}
                  className="w-full flex items-center gap-3 cursor-pointer text-left"
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="shrink-0 flex items-center justify-center rounded-[5px]"
                    style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.32)' }}>
                    {sec.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[6px] tracking-[2px] uppercase" style={{ color: 'rgba(255,255,255,0.20)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="font-display font-black uppercase truncate" style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)' }}>
                      {sec.label}
                    </div>
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ color: 'rgba(255,255,255,0.22)', flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ))
            )}
          </div>

          {/* Save nel drawer */}
          <div className="px-4 py-3 shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rx-btn-primary font-display tracking-[3px] py-3 rounded-[4px] cursor-pointer disabled:opacity-50"
              style={{ fontSize: 10 }}
            >
              {saveLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── ColorSwatch ───────────────────────────────────────────────────────────────

function ColorSwatch({ bg, label, active, color, onClick, size = 48 }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 cursor-pointer">
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: bg,
        border:     active ? `3px solid ${color}` : '3px solid rgba(255,255,255,0.10)',
        boxShadow:  active ? `0 0 0 2px ${color}30, 0 0 12px ${color}50` : 'none',
        transform:  active ? 'scale(1.12)' : 'scale(1)',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }} />
      <span className="font-display uppercase text-center leading-tight"
        style={{
          fontSize:      6,
          letterSpacing: '0.8px',
          color:         active ? color : 'rgba(255,255,255,0.28)',
          transition:    'color 0.15s',
          maxWidth:      size + 8,
          wordBreak:     'break-word',
        }}>
        {label}
      </span>
    </button>
  )
}

// ── CircleSwatch ──────────────────────────────────────────────────────────────

function CircleSwatch({ hex, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer mx-auto block"
      style={{
        width:        40,
        height:       40,
        borderRadius: '50%',
        background:   hex,
        border:       active ? '3px solid white' : '3px solid rgba(255,255,255,0.08)',
        boxShadow:    active ? `0 0 0 2px ${hex}80, 0 0 12px ${hex}60` : 'none',
        transform:    active ? 'scale(1.12)' : 'scale(1)',
        transition:   'all 0.15s ease',
        flexShrink:   0,
      }}
    />
  )
}

// ── AvatarChip ────────────────────────────────────────────────────────────────

function AvatarChip({ label, active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center overflow-hidden cursor-pointer rounded-[5px]"
      style={{
        background: active ? color + '12' : 'rgba(255,255,255,0.02)',
        border:     active ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.07)',
        boxShadow:  active ? `0 0 0 1px ${color}20, 0 4px 14px ${color}25` : 'none',
        transform:  active ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 0.15s ease',
      }}
    >
      <div className="w-full flex justify-center" style={{ lineHeight: 0 }}>
        {children}
      </div>
      <span className="font-display tracking-[1px] uppercase py-1"
        style={{ fontSize: 7, color: active ? color : 'rgba(255,255,255,0.28)' }}>
        {label}
      </span>
    </button>
  )
}
