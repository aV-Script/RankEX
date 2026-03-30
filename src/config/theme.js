/**
 * Rank EX Design System — Palette ufficiale
 *
 * Verde  → R e gemme verdi del logo
 * Ciano  → fulmine elettrico
 * Blu    → freccia della X
 * Metallo → struttura pentagonale
 */
export const theme = {
  colors: {
    // ── Sfondi ──────────────────────────────────────────────
    background:   '#080c12',   // background profondo del logo
    surface:      '#0d1520',   // pannelli metallici
    surfaceAlt:   '#111820',   // texture esagonale
    surfaceHover: '#161e2e',   // hover state

    // ── Bordi ───────────────────────────────────────────────
    border:       'rgba(10,215,90,0.15)',   // verde sottile
    borderHover:  'rgba(10,215,90,0.35)',
    borderActive: 'rgba(10,215,90,0.6)',
    borderMetal:  'rgba(138,155,176,0.15)', // metallico

    // ── Testo ───────────────────────────────────────────────
    text:          '#ffffff',
    textSecondary: '#c8d4e0',
    textMuted:     'rgba(200,212,224,0.4)',
    textDisabled:  'rgba(200,212,224,0.2)',

    // ── Verde (dalla R del logo) ─────────────────────────────
    green:       '#0fd65a',   // verde corpo
    greenBright: '#1aff6e',   // verde bordi luminosi
    greenDark:   '#0a8a3a',   // verde ombra
    greenGlow:   'rgba(15,214,90,0.15)',

    // ── Ciano/Blu (dal fulmine) ──────────────────────────────
    cyan:        '#00c8ff',   // ciano elettrico
    cyanBright:  '#4db8ff',   // alone del fulmine
    blue:        '#0066cc',   // blu profondo
    blueGlow:    'rgba(0,200,255,0.15)',

    // ── Metallico (dalla struttura) ──────────────────────────
    metalLight:  '#8a9bb0',
    metalMid:    '#4a5568',
    metalDark:   '#1e2a38',

    // ── Gradienti principali ─────────────────────────────────
    gradientPrimary:
      'linear-gradient(135deg, #1aff6e 0%, #0fd65a 30%, #00c8ff 70%, #4db8ff 100%)',
    gradientGreen:
      'linear-gradient(135deg, #0a8a3a 0%, #0fd65a 50%, #1aff6e 100%)',
    gradientCyan:
      'linear-gradient(135deg, #0066cc 0%, #00c8ff 50%, #4db8ff 100%)',
    gradientMetal:
      'linear-gradient(135deg, #1e2a38 0%, #4a5568 50%, #8a9bb0 100%)',
    gradientSubtle:
      'linear-gradient(135deg, rgba(15,214,90,0.08) 0%, rgba(0,200,255,0.08) 100%)',

    // ── Glow ────────────────────────────────────────────────
    glowGreen: 'rgba(15,214,90,0.25)',
    glowCyan:  'rgba(0,200,255,0.25)',
    glowMetal: 'rgba(138,155,176,0.1)',

    // ── Stato ───────────────────────────────────────────────
    success: '#0fd65a',   // verde logo
    warning: '#f59e0b',
    error:   '#f87171',
    info:    '#00c8ff',   // ciano logo

    // ── Decorativo ──────────────────────────────────────────
    hexGrid:    'rgba(0,200,255,0.04)',  // reticolo esagonale
    dataLine:   'rgba(15,214,90,0.08)',
  },

  shadows: {
    cardGreen:  '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(15,214,90,0.1)',
    cardCyan:   '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,200,255,0.1)',
    cardMetal:  '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(138,155,176,0.1)',
    glowGreen:  '0 0 20px rgba(15,214,90,0.3), 0 0 40px rgba(15,214,90,0.15)',
    glowCyan:   '0 0 20px rgba(0,200,255,0.3), 0 0 40px rgba(0,200,255,0.15)',
    glowBright: '0 0 60px rgba(15,214,90,0.4), 0 0 20px rgba(0,200,255,0.3)',
    text:       '0 0 10px rgba(15,214,90,0.5)',
  },

  shape: {
    xs:     '2px',
    sm:     '3px',
    md:     '4px',
    lg:     '6px',
    xl:     '8px',
    card:   '4px',
    button: '3px',
    badge:  '2px',
  },
}
