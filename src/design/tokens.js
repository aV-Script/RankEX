/**
 * Design tokens RankEX.
 * Fonte di verità per spacing, tipografia, colori, ombre, motion, z-index.
 * Usa questi in linea con le CSS variables definite nel foglio globale.
 */

// ── Spacing ───────────────────────────────────────────────────────────────────
export const SPACE = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
}

// ── Tipografia ────────────────────────────────────────────────────────────────
export const TYPE = {
  display:  { fontFamily: 'Montserrat, sans-serif', fontWeight: 900 },
  body:     { fontFamily: 'Inter, sans-serif',       fontWeight: 400 },

  sizes: {
    xs:   '10px',
    sm:   '11px',
    base: '13px',
    md:   '14px',
    lg:   '16px',
    xl:   '20px',
    '2xl':'24px',
    '3xl':'32px',
    '4xl':'48px',
  },

  tracking: {
    tight:  '-0.02em',
    normal:  '0',
    wide:    '0.05em',
    widest:  '0.12em',
    label:   '0.15em',
  },
}

// ── Colori ────────────────────────────────────────────────────────────────────
export const COLOR = {
  // Elevazione sfondo (5 livelli)
  bgBase:    '#07090e',
  bgSurface: '#0c1219',
  bgRaised:  '#0f1820',
  bgOverlay: '#131e2a',
  bgFloat:   '#1a2638',

  // Brand verde (dalla R del logo)
  green400:  '#1dff6b',
  green500:  '#0ec452',
  green600:  '#0fd65a',
  greenDark: '#085c28',

  // Brand ciano/blu (dal fulmine)
  cyan400:   '#5dd4ff',
  cyan500:   '#2ecfff',
  cyan600:   '#00c8ff',
  blue500:   '#1a7fd4',

  // Testo
  textPrimary:   '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textTertiary:  'rgba(255,255,255,0.4)',
  textMuted:     'rgba(255,255,255,0.25)',

  // Bordi
  borderSubtle:  'rgba(255,255,255,0.04)',
  borderDefault: 'rgba(255,255,255,0.08)',
  borderStrong:  'rgba(255,255,255,0.15)',
  borderFocus:   '#0fd65a',

  // Stato
  success: '#0fd65a',
  warning: '#f59e0b',
  error:   '#f87171',
  info:    '#00c8ff',
}

// ── Gradienti ─────────────────────────────────────────────────────────────────
export const GRADIENT = {
  primary: 'linear-gradient(135deg, #1aff6e 0%, #0fd65a 30%, #00c8ff 70%, #4db8ff 100%)',
  green:   'linear-gradient(135deg, #085c28 0%, #0fd65a 50%, #1dff6b 100%)',
  cyan:    'linear-gradient(135deg, #1a7fd4 0%, #00c8ff 50%, #5dd4ff 100%)',
  subtle:  'linear-gradient(135deg, rgba(15,214,90,0.08) 0%, rgba(0,200,255,0.08) 100%)',
}

// ── Ombre ─────────────────────────────────────────────────────────────────────
export const SHADOW = {
  sm:    '0 2px 8px rgba(0,0,0,0.4)',
  md:    '0 4px 16px rgba(0,0,0,0.5)',
  lg:    '0 8px 32px rgba(0,0,0,0.6)',
  green: '0 0 20px rgba(15,214,90,0.25), 0 4px 16px rgba(0,0,0,0.5)',
  cyan:  '0 0 20px rgba(0,200,255,0.25), 0 4px 16px rgba(0,0,0,0.5)',
}

// ── Radii ─────────────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   '3px',
  md:   '4px',
  lg:   '6px',
  xl:   '8px',
  '2xl':'12px',
  full: '9999px',
}

// ── Motion ────────────────────────────────────────────────────────────────────
export const MOTION = {
  durationFast:   '100ms',
  durationNormal: '200ms',
  durationSlow:   '350ms',
  easingStandard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easingSpring:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easingExit:     'cubic-bezier(0.4, 0, 1, 1)',
}

// ── Z-index ───────────────────────────────────────────────────────────────────
export const Z = {
  base:    0,
  raised:  10,
  dropdown:20,
  sticky:  30,
  overlay: 40,
  modal:   50,
  toast:   60,
  tooltip: 70,
}
