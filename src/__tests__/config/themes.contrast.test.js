import { describe, it, expect } from 'vitest'
import { THEMES } from '../../config/themes.config'

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const indexCss = readFileSync(fileURLToPath(new URL('../../index.css', import.meta.url)), 'utf8')

// Testo del bottone primario pieno (components/ui Button, .rx-btn-primary):
// letto dalla variabile CSS, unica fonte del valore
const PRIMARY_TEXT = indexCss.match(/--rx-primary-text:\s*(#[0-9a-fA-F]{6})\s*;/)?.[1]
const ADMIN_ACCENT = '#f87171'
const MIN_CONTRAST = 4.5

function toLinear(channel) {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => toLinear(parseInt(value.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

// Bottoni di components/ui (Button): valori letti dal sorgente, unica fonte
const uiSource = readFileSync(fileURLToPath(new URL('../../components/ui/index.jsx', import.meta.url)), 'utf8')
const DANGER_BACKGROUND = uiSource.match(/DANGER_BACKGROUND = '(#[0-9a-fA-F]{6})'/)?.[1]
const NEUTRAL_ALPHA = Number(uiSource.match(/neutral: \{[^}]*color:\s*'rgba\(255,255,255,([\d.]+)\)'/)?.[1])

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  return [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16))
}

// Bianco con alpha composto sul fondo (il Modal usa --rx-surface)
function whiteOver(alpha, backgroundHex) {
  const channels = hexToRgb(backgroundHex).map(channel => Math.round(255 * alpha + channel * (1 - alpha)))
  return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}

describe('contrasto bottoni danger e neutral', () => {
  it('legge danger e neutral da components/ui', () => {
    expect(DANGER_BACKGROUND).toBe('#dc2626')
    expect(NEUTRAL_ALPHA).toBe(0.6)
  })

  it(`danger: bianco su ${DANGER_BACKGROUND} >= ${MIN_CONTRAST}:1`, () => {
    expect(contrast('#ffffff', DANGER_BACKGROUND)).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })

  THEMES.forEach(theme => {
    it(`tema ${theme.id}: neutral (bianco ${NEUTRAL_ALPHA * 100}%) su --rx-surface >= ${MIN_CONTRAST}:1`, () => {
      const surface = theme.vars['--rx-surface']
      const ratio = contrast(whiteOver(NEUTRAL_ALPHA, surface), surface)
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST)
    })
  })
})

describe('contrasto bottone primario pieno', () => {
  it('legge il testo del primario da --rx-primary-text', () => {
    expect(PRIMARY_TEXT).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('copre tutti e 7 i temi', () => {
    expect(THEMES).toHaveLength(7)
  })

  THEMES.forEach(theme => {
    it(`tema ${theme.id}: testo scuro su --rx-accent >= ${MIN_CONTRAST}:1`, () => {
      expect(contrast(PRIMARY_TEXT, theme.vars['--rx-accent'])).toBeGreaterThanOrEqual(MIN_CONTRAST)
    })
  })

  it(`area super_admin (${ADMIN_ACCENT}) >= ${MIN_CONTRAST}:1`, () => {
    expect(contrast(PRIMARY_TEXT, ADMIN_ACCENT)).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })
})
