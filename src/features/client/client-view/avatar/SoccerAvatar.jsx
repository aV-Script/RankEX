// SoccerAvatar — SVG illustrato cartoon. Mount point per layer 3D futuro.
// viewBox 0 0 100 152 — proporzioni atletiche (testa 22%, corpo 78%)

export const SKIN_TONES = {
  light:  '#f2c497',
  medium: '#c8824a',
  tan:    '#a0612a',
  dark:   '#6b3a1f',
}

export const HAIR_COLORS = {
  black: '#1a0f0a',
  brown: '#4a2c17',
  blond: '#c8962c',
  red:   '#8b2500',
  white: '#d0c8b8',
}

export const AVATAR_OPTIONS = {
  skinTone:   Object.keys(SKIN_TONES),
  hairColor:  Object.keys(HAIR_COLORS),
  hairStyle:  ['short', 'spiky', 'curly', 'long', 'mohawk'],
  expression: ['happy', 'determined', 'cool', 'excited'],
  pose:       ['standing', 'confident', 'ready', 'celebrate'],
}

// ── Coordinate principali ────────────────────────────────────────────────────────
// Testa: cx=50 cy=20 r=17   → y 3–37
// Collo: y=35–46
// Maglia: y=44–94
// Shorts: y=92–114
// Gambe:  y=100–130
// Calze:  y=122–140
// Scarpe: y=134–150

export function SoccerAvatar({
  color      = '#0fd65a',
  skinTone   = 'light',
  hairColor  = 'black',
  hairStyle  = 'short',
  expression = 'happy',
  pose       = 'standing',
  number     = '10',
  width,
  height,
  style,
  className,
}) {
  const skin = SKIN_TONES[skinTone] ?? skinTone
  const hair = HAIR_COLORS[hairColor] ?? hairColor
  const kit  = color
  const dark = 'rgba(0,0,0,0.18)'
  const line = 'rgba(0,0,0,0.25)'
  const sw   = 1.0

  return (
    <svg
      viewBox="0 0 100 152"
      width={width}
      height={height}
      style={style}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Boots  line={line} sw={sw} />
      <Socks  kit={kit}  line={line} sw={sw} />
      <Legs   skin={skin} line={line} sw={sw} pose={pose} />
      <Shorts kit={kit}  line={line} sw={sw} />
      <Jersey kit={kit}  dark={dark} line={line} sw={sw} number={number} />
      <Arms   kit={kit}  skin={skin} line={line} sw={sw} pose={pose} />
      <Neck   skin={skin} line={line} sw={sw} />
      <Head   skin={skin} line={line} sw={sw} />
      <Ears   skin={skin} line={line} sw={sw} />
      <Hair   hairStyle={hairStyle} color={hair} line={line} sw={sw} />
      <Face   expression={expression} hair={hair} line={line} />
    </svg>
  )
}

// ── Scarpe ────────────────────────────────────────────────────────────────────────

function Boots({ line, sw }) {
  return (
    <>
      <path d="M29,136 L29,146 Q29,150 34,150 L46,150 Q50,150 50,146 L49,136 Z"
        fill="#111827" stroke={line} strokeWidth={sw} />
      <rect x="31" y="137" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.10)" />
      <path d="M51,136 L52,146 Q52,150 56,150 L68,150 Q72,150 71,146 L71,136 Z"
        fill="#111827" stroke={line} strokeWidth={sw} />
      <rect x="53" y="137" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.10)" />
    </>
  )
}

// ── Calze ─────────────────────────────────────────────────────────────────────────

function Socks({ kit, line, sw }) {
  return (
    <>
      <rect x="30" y="120" width="15" height="22" rx="2" fill="white" stroke={line} strokeWidth={sw} />
      <rect x="30" y="126" width="15" height="4"  fill={kit} opacity="0.55" />
      <rect x="30" y="132" width="15" height="2"  fill={kit} opacity="0.28" />
      <rect x="55" y="120" width="15" height="22" rx="2" fill="white" stroke={line} strokeWidth={sw} />
      <rect x="55" y="126" width="15" height="4"  fill={kit} opacity="0.55" />
      <rect x="55" y="132" width="15" height="2"  fill={kit} opacity="0.28" />
    </>
  )
}

// ── Gambe ─────────────────────────────────────────────────────────────────────────

function Legs({ skin, line, sw, pose }) {
  if (pose === 'celebrate') {
    return (
      <>
        <rect x="30" y="100" width="15" height="24" rx="3" fill={skin} stroke={line} strokeWidth={sw} />
        <rect x="33" y="102" width="5"  height="18" rx="2.5" fill="rgba(255,255,255,0.12)" />
        <path d="M55,100 Q56,114 64,120 Q70,122 72,118 L70,100 Z"
          fill={skin} stroke={line} strokeWidth={sw} />
      </>
    )
  }
  return (
    <>
      <rect x="30" y="100" width="15" height="24" rx="3" fill={skin} stroke={line} strokeWidth={sw} />
      <rect x="55" y="100" width="15" height="24" rx="3" fill={skin} stroke={line} strokeWidth={sw} />
      <rect x="33" y="102" width="5" height="18" rx="2.5" fill="rgba(255,255,255,0.12)" />
      <rect x="58" y="102" width="5" height="18" rx="2.5" fill="rgba(255,255,255,0.12)" />
    </>
  )
}

// ── Pantaloncini ──────────────────────────────────────────────────────────────────

function Shorts({ kit, line, sw }) {
  return (
    <>
      <path d="M23,92 L27,116 L44,116 L50,102 L56,116 L73,116 L77,92 Z"
        fill="#111827" stroke={line} strokeWidth={sw} />
      <rect x="23" y="92" width="54" height="5" fill={kit} opacity="0.25" />
    </>
  )
}

// ── Maglia ────────────────────────────────────────────────────────────────────────

function Jersey({ kit, dark, line, sw, number }) {
  return (
    <>
      <path d="M20,50 L24,94 L76,94 L80,50 L65,44 L50,48 L35,44 Z"
        fill={kit} stroke={line} strokeWidth={sw} />
      <path d="M20,50 L24,94 L31,94 L28,50 Z" fill={dark} />
      <path d="M80,50 L76,94 L69,94 L72,50 Z" fill={dark} />
      {/* Colletto */}
      <path d="M40,46 Q50,54 60,46" fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Numero */}
      <text x="50" y="76" textAnchor="middle" fill="rgba(255,255,255,0.90)"
        fontSize="15" fontWeight="bold" fontFamily="'Montserrat','Arial',sans-serif"
        style={{ userSelect: 'none' }}>
        {number}
      </text>
    </>
  )
}

// ── Braccia ───────────────────────────────────────────────────────────────────────

function Arms({ kit, skin, line, sw, pose }) {
  if (pose === 'confident') {
    return (
      <>
        <path d="M22,52 L10,66 L14,70 L26,56 Z"      fill={kit}  stroke={line} strokeWidth={sw} />
        <path d="M10,66 L12,80 L22,78 L14,70 Z"      fill={skin} stroke={line} strokeWidth={sw} />
        <path d="M78,52 L90,66 L86,70 L74,56 Z"      fill={kit}  stroke={line} strokeWidth={sw} />
        <path d="M90,66 L88,80 L78,78 L86,70 Z"      fill={skin} stroke={line} strokeWidth={sw} />
      </>
    )
  }
  if (pose === 'ready') {
    return (
      <>
        <path d="M21,50 L7,68 L15,74 L25,54 Z"       fill={kit}  stroke={line} strokeWidth={sw} />
        <path d="M7,68 L5,84 L15,86 L15,74 Z"        fill={skin} stroke={line} strokeWidth={sw} />
        <path d="M79,50 L93,68 L85,74 L75,54 Z"      fill={kit}  stroke={line} strokeWidth={sw} />
        <path d="M93,68 L95,84 L85,86 L85,74 Z"      fill={skin} stroke={line} strokeWidth={sw} />
      </>
    )
  }
  if (pose === 'celebrate') {
    return (
      <>
        <path d="M21,50 L9,68 L17,72 L25,54 Z"       fill={kit}  stroke={line} strokeWidth={sw} />
        <path d="M9,68 L7,82 L17,84 L17,72 Z"        fill={skin} stroke={line} strokeWidth={sw} />
        {/* Braccio destro alzato */}
        <path d="M79,50 L87,30 L81,26 L74,48 Z"      fill={kit}  stroke={line} strokeWidth={sw} />
        <path d="M87,30 L85,14 L79,16 L81,26 Z"      fill={skin} stroke={line} strokeWidth={sw} />
        <ellipse cx="82" cy="12" rx="5" ry="4"        fill={skin} stroke={line} strokeWidth={sw} />
        <path d="M78,11 L86,11" stroke={line} strokeWidth="0.8" opacity="0.4" />
        <path d="M78,13 L86,13" stroke={line} strokeWidth="0.8" opacity="0.4" />
      </>
    )
  }
  return (
    <>
      <path d="M20,50 L10,72 L18,76 L26,54 Z"        fill={kit}  stroke={line} strokeWidth={sw} />
      <path d="M10,72 L8,86 L18,88 L18,76 Z"         fill={skin} stroke={line} strokeWidth={sw} />
      <path d="M80,50 L90,72 L82,76 L74,54 Z"        fill={kit}  stroke={line} strokeWidth={sw} />
      <path d="M90,72 L92,86 L82,88 L82,76 Z"        fill={skin} stroke={line} strokeWidth={sw} />
    </>
  )
}

// ── Collo / Testa / Orecchie ──────────────────────────────────────────────────────

function Neck({ skin, line, sw }) {
  return <rect x="44" y="35" width="12" height="13" rx="4" fill={skin} stroke={line} strokeWidth={sw} />
}

function Head({ skin, line, sw }) {
  return <circle cx="50" cy="20" r="17" fill={skin} stroke={line} strokeWidth={sw} />
}

function Ears({ skin, line, sw }) {
  return (
    <>
      <ellipse cx="33" cy="22" rx="3.5" ry="4.5" fill={skin} stroke={line} strokeWidth={sw} />
      <ellipse cx="67" cy="22" rx="3.5" ry="4.5" fill={skin} stroke={line} strokeWidth={sw} />
      <ellipse cx="33" cy="22" rx="1.8" ry="2.8" fill="rgba(0,0,0,0.07)" />
      <ellipse cx="67" cy="22" rx="1.8" ry="2.8" fill="rgba(0,0,0,0.07)" />
    </>
  )
}

// ── Capelli ───────────────────────────────────────────────────────────────────────

function Hair({ hairStyle, color, line, sw }) {
  switch (hairStyle) {
    case 'spiky':  return <SpikyHair  color={color} line={line} sw={sw} />
    case 'curly':  return <CurlyHair  color={color} line={line} sw={sw} />
    case 'long':   return <LongHair   color={color} line={line} sw={sw} />
    case 'mohawk': return <MohawkHair color={color} line={line} sw={sw} />
    default:       return <ShortHair  color={color} line={line} sw={sw} />
  }
}

function ShortHair({ color, line, sw }) {
  return (
    <>
      <path d="M33,18 Q35,3 50,2 Q65,3 67,18 Q65,8 50,7 Q35,8 33,18 Z"
        fill={color} stroke={line} strokeWidth={sw} />
      <path d="M33,18 Q31,14 33,28 Q34,22 36,22 Z" fill={color} />
      <path d="M67,18 Q69,14 67,28 Q66,22 64,22 Z" fill={color} />
      <path d="M37,10 Q40,14 38,18" fill={color} opacity="0.55" />
      <path d="M44,7  Q47,12 45,16" fill={color} opacity="0.45" />
    </>
  )
}

function SpikyHair({ color, line, sw }) {
  return (
    <>
      <path d="M33,18 Q35,8 50,4 Q65,8 67,18 Q62,12 50,11 Q38,12 33,18 Z"
        fill={color} stroke={line} strokeWidth={sw} />
      <path d="M36,14 L33,1  L41,12 Z" fill={color} stroke={line} strokeWidth="0.7" />
      <path d="M47,8  L46,0  L54,7  Z" fill={color} stroke={line} strokeWidth="0.7" />
      <path d="M59,10 L63,1  L66,12 Z" fill={color} stroke={line} strokeWidth="0.7" />
      <path d="M33,18 Q31,14 33,28 Q34,22 36,22 Z" fill={color} />
      <path d="M67,18 Q69,14 67,28 Q66,22 64,22 Z" fill={color} />
    </>
  )
}

function CurlyHair({ color, line, sw }) {
  // Archi sovrapposti → aspetto riccio naturale (non cerchi=nonna)
  return (
    <>
      {/* corona di riccioli con archi SVG */}
      <path
        d="M33,20
           A5,6 0 0 0 43,20
           A5,6 0 0 0 53,20
           A5,6 0 0 0 63,20
           A4,5 0 0 0 67,22
           Q67,30 63,30 Q50,34 37,30 Q33,30 33,24 Z"
        fill={color} stroke={line} strokeWidth={sw}
      />
      {/* secondo strato più alto per volume */}
      <path
        d="M35,18
           A4,5 0 0 0 44,16
           A4,5 0 0 0 53,18
           A4,5 0 0 0 62,16
           A4,5 0 0 0 66,19"
        fill={color} stroke="none"
      />
    </>
  )
}

function LongHair({ color, line, sw }) {
  return (
    <>
      <path d="M33,18 Q35,3 50,2 Q65,3 67,18 Q65,8 50,7 Q35,8 33,18 Z"
        fill={color} stroke={line} strokeWidth={sw} />
      <path d="M33,18 Q27,30 27,50 Q29,58 34,56 Q32,40 36,26 Z"
        fill={color} stroke={line} strokeWidth={sw} />
      <path d="M67,18 Q73,30 73,50 Q71,58 66,56 Q68,40 64,26 Z"
        fill={color} stroke={line} strokeWidth={sw} />
      <path d="M34,56 Q50,62 66,56 Q64,40 50,40 Q36,40 34,56 Z"
        fill={color} opacity="0.70" />
      <path d="M37,10 Q40,14 38,18" fill={color} opacity="0.5" />
    </>
  )
}

function MohawkHair({ color, line, sw }) {
  return (
    <>
      <path d="M44,20 Q44,6 50,2 Q56,6 56,20 Q53,16 50,14 Q47,16 44,20 Z"
        fill={color} stroke={line} strokeWidth={sw} />
      <path d="M46,12 L48,3 L52,3 L54,12 Q51,10 50,9 Q49,10 46,12 Z"
        fill={color} stroke={line} strokeWidth={sw} />
      <path d="M33,18 Q31,14 33,28 Q35,22 37,22 Z" fill={color} opacity="0.18" />
      <path d="M67,18 Q69,14 67,28 Q65,22 63,22 Z" fill={color} opacity="0.18" />
    </>
  )
}

// ── Espressioni ───────────────────────────────────────────────────────────────────

function Face({ expression, hair, line }) {
  switch (expression) {
    case 'determined': return <DeterminedFace hair={hair} line={line} />
    case 'cool':       return <CoolFace       hair={hair} line={line} />
    case 'excited':    return <ExcitedFace    hair={hair} line={line} />
    default:           return <HappyFace      hair={hair} line={line} />
  }
}

function HappyFace({ hair, line }) {
  return (
    <>
      <ellipse cx="43" cy="21" rx="4.5" ry="5.0" fill="white" stroke={line} strokeWidth="0.8" />
      <ellipse cx="57" cy="21" rx="4.5" ry="5.0" fill="white" stroke={line} strokeWidth="0.8" />
      <circle cx="43.5" cy="21.5" r="3.2" fill="#3b2410" />
      <circle cx="57.5" cy="21.5" r="3.2" fill="#3b2410" />
      <circle cx="43.5" cy="21.5" r="1.8" fill="#0d0d0d" />
      <circle cx="57.5" cy="21.5" r="1.8" fill="#0d0d0d" />
      <circle cx="44.6" cy="19.8" r="1.1" fill="white" />
      <circle cx="58.6" cy="19.8" r="1.1" fill="white" />
      <path d="M38,13.5 Q43,11 48,13.5" stroke={hair} strokeWidth="2.0" fill="none" strokeLinecap="round" />
      <path d="M52,13.5 Q57,11 62,13.5" stroke={hair} strokeWidth="2.0" fill="none" strokeLinecap="round" />
      <path d="M48,26 Q50,29 52,26" stroke="rgba(0,0,0,0.16)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M44,32 Q50,37 56,32" stroke="#c07060" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <path d="M45.5,33.5 Q50,36.5 54.5,33.5" fill="rgba(180,60,60,0.22)" />
      <ellipse cx="38" cy="27" rx="4" ry="2.8" fill="#ffb3a0" opacity="0.22" />
      <ellipse cx="62" cy="27" rx="4" ry="2.8" fill="#ffb3a0" opacity="0.22" />
    </>
  )
}

function DeterminedFace({ hair, line }) {
  return (
    <>
      <ellipse cx="43" cy="21" rx="4.5" ry="3.8" fill="white" stroke={line} strokeWidth="0.8" />
      <ellipse cx="57" cy="21" rx="4.5" ry="3.8" fill="white" stroke={line} strokeWidth="0.8" />
      <circle cx="43.5" cy="21.5" r="2.8" fill="#3b2410" />
      <circle cx="57.5" cy="21.5" r="2.8" fill="#3b2410" />
      <circle cx="43.5" cy="21.5" r="1.6" fill="#0d0d0d" />
      <circle cx="57.5" cy="21.5" r="1.6" fill="#0d0d0d" />
      <circle cx="44.4" cy="20.2" r="1.0" fill="white" />
      <circle cx="58.4" cy="20.2" r="1.0" fill="white" />
      {/* Sopracciglia aggrottate */}
      <path d="M38,13 Q43,15 48,13" stroke={hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M52,13 Q57,15 62,13" stroke={hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M46,13.5 L48,15.5" stroke={hair} strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
      <path d="M54,13.5 L52,15.5" stroke={hair} strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
      <path d="M48,26 Q50,29 52,26" stroke="rgba(0,0,0,0.16)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M44,33 Q50,32 56,33" stroke="#c07060" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </>
  )
}

function CoolFace({ hair, line }) {
  return (
    <>
      <ellipse cx="43" cy="21" rx="4.5" ry="5.0" fill="white" stroke={line} strokeWidth="0.8" />
      <ellipse cx="57" cy="22" rx="4.5" ry="3.4" fill="white" stroke={line} strokeWidth="0.8" />
      <path d="M52.5,19 Q57,21 61.5,19" stroke={line} strokeWidth="0.9" fill="none" />
      <circle cx="43.5" cy="21.5" r="3.2" fill="#3b2410" />
      <circle cx="57.5" cy="22.5" r="2.6" fill="#3b2410" />
      <circle cx="43.5" cy="21.5" r="1.8" fill="#0d0d0d" />
      <circle cx="57.5" cy="22.5" r="1.5" fill="#0d0d0d" />
      <circle cx="44.6" cy="19.8" r="1.1" fill="white" />
      <circle cx="58.4" cy="21.2" r="0.9" fill="white" />
      <path d="M38,12 Q43,9.5 48,12" stroke={hair} strokeWidth="2.0" fill="none" strokeLinecap="round" />
      <path d="M52,14 Q57,12 62,14" stroke={hair} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M48,26 Q50,29 52,26" stroke="rgba(0,0,0,0.16)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M44,33 Q50,35 56,31" stroke="#c07060" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </>
  )
}

function ExcitedFace({ hair, line }) {
  return (
    <>
      <ellipse cx="43" cy="20" rx="5.5" ry="6.0" fill="white" stroke={line} strokeWidth="0.8" />
      <ellipse cx="57" cy="20" rx="5.5" ry="6.0" fill="white" stroke={line} strokeWidth="0.8" />
      <circle cx="43.5" cy="20.5" r="4.0" fill="#3b2410" />
      <circle cx="57.5" cy="20.5" r="4.0" fill="#3b2410" />
      <circle cx="43.5" cy="20.5" r="2.3" fill="#0d0d0d" />
      <circle cx="57.5" cy="20.5" r="2.3" fill="#0d0d0d" />
      <circle cx="45.0" cy="18.6" r="1.4" fill="white" />
      <circle cx="59.0" cy="18.6" r="1.4" fill="white" />
      <path d="M37,11 Q43,8  49,11" stroke={hair} strokeWidth="2.0" fill="none" strokeLinecap="round" />
      <path d="M51,11 Q57,8  63,11" stroke={hair} strokeWidth="2.0" fill="none" strokeLinecap="round" />
      <path d="M48,26 Q50,29 52,26" stroke="rgba(0,0,0,0.16)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M43,32 Q50,39 57,32" stroke="#c07060" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <path d="M44.5,33.5 Q50,38 55.5,33.5 Q50,37 44.5,33.5 Z" fill="white" opacity="0.85" />
      <ellipse cx="38" cy="27" rx="4" ry="2.8" fill="#ffb3a0" opacity="0.28" />
      <ellipse cx="62" cy="27" rx="4" ry="2.8" fill="#ffb3a0" opacity="0.28" />
    </>
  )
}
