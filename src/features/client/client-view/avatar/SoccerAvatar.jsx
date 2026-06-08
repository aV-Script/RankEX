// SoccerAvatar — DiceBear avataaars, tutte le opzioni disponibili

import { useMemo }      from 'react'
import { createAvatar } from '@dicebear/core'
import * as avataaars   from '@dicebear/avataaars'

// ── Skin tones (20) ───────────────────────────────────────────────────────────

const SKIN_HEX = {
  ivory:       'fef3e9',
  porcelain:   'fce4d0',
  pale:        'f8d8b4',
  light:       'ffdbb4',
  fair:        'f5c89e',
  lightMedium: 'f0b878',
  sand:        'e8a56b',
  medium:      'd08b5b',
  golden:      'c87941',
  warmMedium:  'c06a3c',
  olive:       'b5752a',
  tan:         'ae5d29',
  caramel:     'a05020',
  deepTan:     '9a4218',
  sienna:      '8f3c1a',
  brown:       '8b4a26',
  toffee:      '7a3a1e',
  deepBrown:   '6b3318',
  mahogany:    '5a2a14',
  dark:        '4a312c',
}

// ── Colori capelli (20) ───────────────────────────────────────────────────────

const HAIR_HEX = {
  black:      '2c1b18',
  darkBrown:  '3d1c02',
  brown:      '724133',
  medBrown:   '9a6040',
  auburn:     '922d0e',
  red:        'c93305',
  copper:     'a0522d',
  darkBlond:  'b58143',
  blond:      'f4d150',
  lightBlond: 'fce08a',
  ginger:     'd45a00',
  platinum:   'd0c5a0',
  white:      'e8e1e1',
  teal:       '2d8a8a',
  blue:       '2255aa',
  purple:     '7722aa',
  pink:       'dd55aa',
  green:      '228844',
  silver:     'a0a8b8',
  rainbow:    'ff6699',
}

// ── Colori barba/baffi (10) ───────────────────────────────────────────────────

const FACIAL_HAIR_HEX = {
  black:     '2c1b18',
  darkBrown: '3d1c02',
  brown:     '724133',
  auburn:    '922d0e',
  red:       'c93305',
  blond:     'f4d150',
  ginger:    'd45a00',
  platinum:  'd0c5a0',
  white:     'e8e1e1',
  silver:    'a0a8b8',
}

// ── Stili capelli/copricapo (34 — tutti gli option DiceBear) ─────────────────

const HAIR_STYLE_MAP = {
  // cortissimi
  buzz:        'sides',
  shavedSides: 'shavedSides',
  // corti
  short:       'shortFlat',
  caesar:      'theCaesar',
  sidePart:    'theCaesarAndSidePart',
  wavy:        'shortWaved',
  round:       'shortRound',
  shortCurly:  'shortCurly',
  spiky:       'frizzle',
  shaggy:      'shaggy',
  // medi
  mullet:      'shaggyMullet',
  medium:      'longButNotTooLong',
  bob:         'bob',
  mia:         'miaWallace',
  // lunghi
  long:        'straight01',
  straight2:   'straight02',
  strand:      'straightAndStrand',
  bigHair:     'bigHair',
  bun:         'bun',
  frida:       'frida',
  // ricci / afro
  curly:       'curly',
  curvy:       'curvy',
  afro:        'fro',
  afroBand:    'froBand',
  // dreads
  dreads:      'dreads01',
  dreads2:     'dreads02',
  dreads3:     'dreads',
  // copricapo (usano hatColor invece di hairColor)
  hat:         'hat',
  hijab:       'hijab',
  turban:      'turban',
  winterHat1:  'winterHat1',
  winterHat2:  'winterHat02',
  winterHat3:  'winterHat03',
  winterHat4:  'winterHat04',
}

// ── Espressioni (20) ──────────────────────────────────────────────────────────

const EXPRESSION_MAP = {
  happy:      { mouth: ['smile'],      eyebrows: ['raisedExcitedNatural'], eyes: ['happy']    },
  fired_up:   { mouth: ['screamOpen'], eyebrows: ['raisedExcitedNatural'], eyes: ['surprised'] },
  focused:    { mouth: ['serious'],    eyebrows: ['angryNatural'],         eyes: ['default']   },
  confident:  { mouth: ['smile'],      eyebrows: ['flatNatural'],          eyes: ['squint']    },
  cool:       { mouth: ['default'],    eyebrows: ['flatNatural'],          eyes: ['side']      },
  cheeky:     { mouth: ['tongue'],     eyebrows: ['raisedExcitedNatural'], eyes: ['wink']      },
  proud:      { mouth: ['twinkle'],    eyebrows: ['defaultNatural'],       eyes: ['default']   },
  angry:      { mouth: ['grimace'],    eyebrows: ['angry'],                eyes: ['default']   },
  sneaky:     { mouth: ['smile'],      eyebrows: ['upDownNatural'],        eyes: ['eyeRoll']   },
  surprised:  { mouth: ['disbelief'],  eyebrows: ['raisedExcited'],        eyes: ['surprised'] },
  wink:       { mouth: ['smile'],      eyebrows: ['raisedExcitedNatural'], eyes: ['wink']      },
  sleepy:     { mouth: ['default'],    eyebrows: ['upDownNatural'],        eyes: ['closed']    },
  lovestruck: { mouth: ['smile'],      eyebrows: ['raisedExcitedNatural'], eyes: ['hearts']    },
  dizzy:      { mouth: ['default'],    eyebrows: ['defaultNatural'],       eyes: ['xDizzy']    },
  eating:     { mouth: ['eating'],     eyebrows: ['defaultNatural'],       eyes: ['default']   },
  worried:    { mouth: ['concerned'],  eyebrows: ['sadConcernedNatural'],  eyes: ['default']   },
  tough:      { mouth: ['serious'],    eyebrows: ['unibrowNatural'],       eyes: ['squint']    },
  excited:    { mouth: ['twinkle'],    eyebrows: ['raisedExcited'],        eyes: ['happy']     },
  joker:      { mouth: ['tongue'],     eyebrows: ['upDownNatural'],        eyes: ['winkWacky'] },
  neutral:    { mouth: ['default'],    eyebrows: ['defaultNatural'],       eyes: ['default']   },
}

// ── Accessori (7 — tutti quelli DiceBear) ─────────────────────────────────────

const ACCESSORY_MAP = {
  none:           { accessoriesProbability: 0 },
  sunglasses:     { accessories: ['sunglasses'],     accessoriesProbability: 100 },
  wayfarers:      { accessories: ['wayfarers'],      accessoriesProbability: 100 },
  round:          { accessories: ['round'],          accessoriesProbability: 100 },
  prescription01: { accessories: ['prescription01'], accessoriesProbability: 100 },
  prescription02: { accessories: ['prescription02'], accessoriesProbability: 100 },
  kurt:           { accessories: ['kurt'],           accessoriesProbability: 100 },
  eyepatch:       { accessories: ['eyepatch'],       accessoriesProbability: 100 },
}

// ── Abbigliamento (9 — tutti quelli DiceBear) ─────────────────────────────────

const CLOTHING_MAP = {
  jersey:  'shirtCrewNeck',
  vneck:   'shirtVNeck',
  scoop:   'shirtScoopNeck',
  polo:    'collarAndSweater',
  hoodie:  'hoodie',
  graphic: 'graphicShirt',
  overall: 'overall',
  blazer:  'blazerAndShirt',
  sweater: 'blazerAndSweater',
}

// ── Barba & Baffi (6 — tutti quelli DiceBear + nessuno) ──────────────────────

const FACIAL_HAIR_MAP = {
  none:            { facialHairProbability: 0 },
  beardLight:      { facialHair: ['beardLight'],      facialHairProbability: 100 },
  beardMedium:     { facialHair: ['beardMedium'],     facialHairProbability: 100 },
  beardMajestic:   { facialHair: ['beardMajestic'],   facialHairProbability: 100 },
  moustacheFancy:  { facialHair: ['moustacheFancy'],  facialHairProbability: 100 },
  moustacheMagnum: { facialHair: ['moustacheMagnum'], facialHairProbability: 100 },
}

// ── Grafica maglia (10 — tutti quelli DiceBear) ───────────────────────────────

const CLOTHING_GRAPHIC_MAP = {
  bat:         'bat',
  bear:        'bear',
  cumbia:      'cumbia',
  deer:        'deer',
  diamond:     'diamond',
  hola:        'hola',
  pizza:       'pizza',
  resist:      'resist',
  skull:       'skull',
  skullOutline:'skullOutline',
}

// ── Palette colori maglia (20) ────────────────────────────────────────────────

export const JERSEY_PALETTE = [
  '#ef4444', '#dc2626', '#f97316', '#ea580c', '#eab308',
  '#ca8a04', '#22c55e', '#16a34a', '#15803d', '#3b82f6',
  '#1d4ed8', '#0284c7', '#06b6d4', '#0891b2', '#8b5cf6',
  '#7c3aed', '#ec4899', '#db2777', '#f1f5f9', '#1e293b',
]

// ── Palette colori copricapo (20) ─────────────────────────────────────────────

export const HAT_PALETTE = [
  '#262e33', '#65c9ff', '#5199e4', '#25557c', '#e6e6e6', '#929598',
  '#3c4f5c', '#b1e2ff', '#a7ffc4', '#ffdeb5', '#ffafb9', '#ffffb1',
  '#ff488e', '#ff5c5c', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#8b5cf6',
]

// ── Palette colori accessori (15) ─────────────────────────────────────────────

export const ACCESSORIES_PALETTE = [
  '#262e33', '#65c9ff', '#5199e4', '#25557c', '#e6e6e6', '#929598',
  '#3c4f5c', '#b1e2ff', '#a7ffc4', '#ffdeb5', '#ffafb9', '#ffffb1',
  '#ff488e', '#ff5c5c', '#ffffff',
]

// ── Stili che usano hatColor (non hairColor) ──────────────────────────────────

export const HAT_TOPS = new Set([
  'hat', 'hijab', 'turban', 'winterHat1', 'winterHat2', 'winterHat3', 'winterHat4',
])

// ── Exports per l'editor ──────────────────────────────────────────────────────

export const SKIN_TONES = Object.fromEntries(
  Object.entries(SKIN_HEX).map(([k, v]) => [k, '#' + v])
)

export const HAIR_COLORS = Object.fromEntries(
  Object.entries(HAIR_HEX).map(([k, v]) => [k, '#' + v])
)

export const FACIAL_HAIR_COLORS = Object.fromEntries(
  Object.entries(FACIAL_HAIR_HEX).map(([k, v]) => [k, '#' + v])
)

export const AVATAR_OPTIONS = {
  skinTone:        Object.keys(SKIN_HEX),
  hairColor:       Object.keys(HAIR_HEX),
  hairStyle:       Object.keys(HAIR_STYLE_MAP),
  expression:      Object.keys(EXPRESSION_MAP),
  accessory:       Object.keys(ACCESSORY_MAP),
  clothing:        Object.keys(CLOTHING_MAP),
  facialHair:      Object.keys(FACIAL_HAIR_MAP),
  facialHairColor: Object.keys(FACIAL_HAIR_HEX),
  clothingGraphic: Object.keys(CLOTHING_GRAPHIC_MAP),
}

import { useTheme } from '../../../../context/ThemeContext'

// ── Componente ────────────────────────────────────────────────────────────────

export function SoccerAvatar({
  color            = '#0fd65a',
  skinTone         = 'light',
  hairColor        = 'black',
  hairStyle        = 'short',
  expression       = 'happy',
  accessory        = 'none',
  clothing         = 'jersey',
  jerseyColor      = null,
  facialHair       = 'none',
  facialHairColor  = 'black',
  clothingGraphic  = 'bat',
  hatColor         = null,
  accessoriesColor = '#262e33',
  number           = '',
  width,
  height,
  style,
  className,
}) {
  const { theme } = useTheme()
  const surfaceHex = (theme.vars['--rx-surface'] ?? '#0d1520').replace('#', '')

  const w = parseInt(width)  || 160
  const h = parseInt(height) || w

  const dataUri = useMemo(() => {
    const bgHex  = surfaceHex
    const kitHex = jerseyColor      ? jerseyColor.replace('#', '')       : (color ?? '#0fd65a').replace('#', '')
    const hatHex = hatColor         ? hatColor.replace('#', '')          : bgHex
    const accHex = accessoriesColor ? accessoriesColor.replace('#', '')  : '262e33'
    const hair   = HAIR_STYLE_MAP[hairStyle]       ?? HAIR_STYLE_MAP.short
    const expr   = EXPRESSION_MAP[expression]      ?? EXPRESSION_MAP.happy
    const acc    = ACCESSORY_MAP[accessory]        ?? ACCESSORY_MAP.none
    const cloth  = CLOTHING_MAP[clothing]          ?? CLOTHING_MAP.jersey
    const fHair  = FACIAL_HAIR_MAP[facialHair]     ?? FACIAL_HAIR_MAP.none
    const graph  = CLOTHING_GRAPHIC_MAP[clothingGraphic] ?? CLOTHING_GRAPHIC_MAP.bat

    const svg = createAvatar(avataaars, {
      seed:             `${skinTone}-${hairColor}-${hairStyle}-${expression}-${accessory}-${clothing}-${jerseyColor}-${facialHair}-${facialHairColor}-${clothingGraphic}-${hatColor}-${accessoriesColor}`,
      size:             w,
      style:            ['circle'],
      backgroundColor:  ['transparent'],
      skinColor:        [SKIN_HEX[skinTone]              ?? SKIN_HEX.light],
      top:              [hair],
      hairColor:        [HAIR_HEX[hairColor]             ?? HAIR_HEX.black],
      clothing:         [cloth],
      clothesColor:     [kitHex],
      clothingGraphic:  [graph],
      hatColor:         [hatHex],
      nose:             ['default'],
      accessoriesColor: [accHex],
      facialHairColor:  [FACIAL_HAIR_HEX[facialHairColor] ?? FACIAL_HAIR_HEX.black],
      ...expr,
      ...acc,
      ...fHair,
    }).toString()

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }, [skinTone, hairColor, hairStyle, expression, accessory, clothing, jerseyColor,
      facialHair, facialHairColor, clothingGraphic, hatColor, accessoriesColor, color, w, surfaceHex])

  return (
    <div
      className={className}
      style={{ position: 'relative', width: w, height: h, flexShrink: 0, ...style }}
    >
      <img src={dataUri} width={w} height={h} alt="avatar" draggable={false}
        style={{ display: 'block', userSelect: 'none', position: 'relative' }} />

      {number && (
        <div style={{
          position:       'absolute',
          left:           0,
          right:          0,
          bottom:         Math.round(h * 0.115),
          display:        'flex',
          justifyContent: 'center',
          pointerEvents:  'none',
        }}>
          <span style={{
            fontFamily: 'Montserrat, Arial Black, sans-serif',
            fontWeight: 900,
            fontSize:   Math.round(w * 0.135),
            color:      'rgba(255,255,255,0.90)',
            textShadow: '0 1px 6px rgba(0,0,0,0.70)',
            lineHeight:  1,
            userSelect:  'none',
          }}>
            {number}
          </span>
        </div>
      )}
    </div>
  )
}
