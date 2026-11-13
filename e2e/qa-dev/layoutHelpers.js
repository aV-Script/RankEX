/**
 * Costanti e misure comuni agli spec di layout dell'area cliente su rankex-dev
 * (clientNotificationsLayout.spec.js, clientHomeLayout.spec.js; Sprint #21 AI 2 e STORY-048 T6).
 * Le misure sono boundingBox / getBoundingClientRect, mai dichiarazioni.
 */
import { expect } from '@playwright/test'

export const VIEWPORTS = [
  { name: '360x640',  width: 360,  height: 640 },
  { name: '1366x768', width: 1366, height: 768 },
]
/** Da questa larghezza (breakpoint `lg` di Tailwind) la campana e' nella top nav, non nella bottom nav */
export const DESKTOP_MIN_WIDTH = 1024
/** Arrotondamenti di sub-pixel nelle misure */
export const PX_TOLERANCE = 1

export const BELL_NAME = /^Notifiche(, \d+ non let(ta|te))?$/
export const UNREAD_BELL_NAME = /^Notifiche, \d+ non let(ta|te)$/

export function isDesktopViewport(viewport) {
  return viewport.width >= DESKTOP_MIN_WIDTH
}

/** La pagina non scorre in orizzontale */
export async function expectNoHorizontalScroll(page) {
  const scroll = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
  }))
  expect(scroll.scrollWidth, 'scroll orizzontale della pagina').toBeLessThanOrEqual(scroll.clientWidth)
}

/** Il titolo "Notifiche" deve avere spazio: sotto 100 px si sovrappone a chi gli sta accanto (BUG-032) */
const TITLE_MIN_WIDTH = 100
/** Altezza del titolo / altezza di riga: < 1.5 = una riga, >= 2 = a capo */
const TITLE_MAX_LINES_RATIO = 1.5
/** Fallback se `line-height` calcolato e' "normal": rapporto tipico del font */
const NORMAL_LINE_HEIGHT_RATIO = 1.2
/** Padding orizzontale dell'header (px-5 = 20) piu' il bordo: "Chiudi" finisce a questa distanza dal bordo destro */
const CLOSE_RIGHT_INSET_MAX = 30
/** Padding verticale dell'header (py-4 = 16) piu' margine: "Chiudi" sta nella prima riga, non a capo */
const CLOSE_TOP_OFFSET_MAX = 30

/**
 * Misure del pannello notifiche aperto (BUG-032): dentro il viewport, titolo largo e su una riga, controlli
 * dell'header dentro il pannello, "Chiudi" in alto a destra. Ritorna il bottone "Chiudi notifiche".
 */
export async function expectNotificationsPanelLayout(panel, viewport) {
  const panelBox = await panel.boundingBox()
  expect(panelBox).not.toBeNull()
  expect(panelBox.x + panelBox.width, 'pannello dentro il viewport').toBeLessThanOrEqual(viewport.width + PX_TOLERANCE)

  // Titolo: largo almeno TITLE_MIN_WIDTH e su una riga
  const title = panel.locator('#notifications-panel-title')
  await expect(title).toHaveText('Notifiche')
  const titleBox = await title.boundingBox()
  expect(titleBox.width, 'larghezza del titolo').toBeGreaterThanOrEqual(TITLE_MIN_WIDTH)
  const lineHeight = await title.evaluate(element => {
    const parsed = parseFloat(getComputedStyle(element).lineHeight)
    return Number.isNaN(parsed) ? null : parsed
  })
  const fontSize = await title.evaluate(element => parseFloat(getComputedStyle(element).fontSize))
  const singleLineHeight = lineHeight ?? fontSize * NORMAL_LINE_HEIGHT_RATIO
  expect(titleBox.height / singleLineHeight, 'il titolo va a capo').toBeLessThan(TITLE_MAX_LINES_RATIO)

  // Controlli dell'header: visibili, con nome accessibile, dentro il pannello
  const close = panel.getByRole('button', { name: 'Chiudi notifiche' })
  const markAll = panel.getByRole('button', { name: 'Segna tutte come lette' })
  for (const control of [close, markAll]) {
    await expect(control).toBeVisible()
    const box = await control.boundingBox()
    expect(box.x, 'controllo a sinistra del pannello').toBeGreaterThanOrEqual(panelBox.x - PX_TOLERANCE)
    expect(box.x + box.width, 'controllo oltre il bordo destro del pannello')
      .toBeLessThanOrEqual(panelBox.x + panelBox.width + PX_TOLERANCE)
  }

  // BUG-032: "Chiudi" in alto a destra del pannello anche se "Segna tutte" va a capo
  const closeBox = await close.boundingBox()
  const rightInset = panelBox.x + panelBox.width - (closeBox.x + closeBox.width)
  expect(rightInset, '"Chiudi" lontano dal bordo destro').toBeLessThanOrEqual(CLOSE_RIGHT_INSET_MAX)
  expect(closeBox.y - panelBox.y, '"Chiudi" non in alto (a capo)').toBeLessThanOrEqual(CLOSE_TOP_OFFSET_MAX)
  return close
}

/** Rettangolo in coordinate di documento (indipendente dallo scroll), per confrontare elementi in punti diversi della pagina */
export function documentBox(locator) {
  return locator.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height }
  })
}

/** Due rettangoli {x,y,width,height} hanno area in comune (i bordi che si toccano non contano) */
export function rectsOverlap(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}
