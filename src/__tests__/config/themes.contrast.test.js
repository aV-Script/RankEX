import { describe, it, expect } from 'vitest'
import { THEMES } from '../../config/themes.config'

// Testo del bottone primario pieno (components/ui Button, .rx-btn-primary)
const PRIMARY_TEXT = '#04140a'
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

describe('contrasto bottone primario pieno', () => {
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
