/**
 * Layout e accessibilita' del pannello notifiche cliente su rankex-dev (Sprint #21 AI 2).
 * Misurato con boundingBox, non dichiarato: BUG-032 (header schiacciato, titolo sovrapposto, "Chiudi"
 * che finiva a capo) e BUG-033/036 (campane senza nome accessibile).
 *
 * Precondizione QA: cliente di base di qa-pt (qadev.pt.cliente@test.rankex) con primo accesso fatto e
 * >= 1 notifica non letta (`qa-seed-notif-*`), cioe' `npm run qa:dev:seed` lanciato. La spec NON segna
 * nulla come letto: le notifiche seed sono idempotenti e non vengono ricreate non lette.
 */
import { test, expect } from '../fixtures.js'
import { qaClientUsers } from '../qaDev.config.js'

const CLIENT_USER_KEY = qaClientUsers('pt')[0].key

const VIEWPORTS = [
  { name: '360x640',   width: 360,  height: 640 },
  { name: '1366x768',  width: 1366, height: 768 },
]
/** Da questa larghezza (breakpoint `lg` di Tailwind) la campana e' nella top nav, non nella bottom nav */
const DESKTOP_MIN_WIDTH = 1024

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
/** Arrotondamenti di sub-pixel nelle misure */
const PX_TOLERANCE = 1

const BELL_NAME = /^Notifiche(, \d+ non let(ta|te))?$/
const UNREAD_BELL_NAME = /^Notifiche, \d+ non let(ta|te)$/

for (const viewport of VIEWPORTS) {
  test.describe(`pannello notifiche cliente a ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('campana col nome, header misurato, focus su Chiudi e ritorno alla campana', async ({ openAs }) => {
      const page = await openAs(CLIENT_USER_KEY)
      const isDesktop = viewport.width >= DESKTOP_MIN_WIDTH

      // Desktop: la top nav con la campana esiste solo fuori dall'hub, si entra in una sezione (Calendario)
      if (isDesktop) await page.getByRole('button', { name: 'Calendario', exact: true }).click()

      // BUG-033/036: la campana visibile ha il nome accessibile, con le non lette (precondizione del seed)
      const bell = page.getByRole('button', { name: BELL_NAME })
      await expect(bell, 'una sola campana visibile a questo viewport').toHaveCount(1)
      await expect(bell, 'serve >= 1 notifica non letta: rilancia npm run qa:dev:seed').toHaveAccessibleName(UNREAD_BELL_NAME)
      const bellNameBefore = await bell.getAttribute('aria-label')

      await bell.click()
      const panel = page.getByRole('dialog', { name: 'Notifiche' })
      await expect(panel).toBeVisible()

      // Nessuno scroll orizzontale della pagina
      const scroll = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
      }))
      expect(scroll.scrollWidth, 'scroll orizzontale della pagina').toBeLessThanOrEqual(scroll.clientWidth)

      const panelBox = await panel.boundingBox()
      expect(panelBox).not.toBeNull()
      expect(panelBox.x + panelBox.width, 'pannello dentro il viewport').toBeLessThanOrEqual(viewport.width + PX_TOLERANCE)

      // Titolo: largo almeno TITLE_MIN_WIDTH e su una riga
      const title = panel.locator('#notifications-panel-title')
      await expect(title).toHaveText('Notifiche')
      const titleBox = await title.boundingBox()
      expect(titleBox.width, 'larghezza del titolo').toBeGreaterThanOrEqual(TITLE_MIN_WIDTH)
      const lineHeight = await title.evaluate(element => {
        const style = getComputedStyle(element)
        const parsed = parseFloat(style.lineHeight)
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

      // Primo focus su "Chiudi" (decisione Sprint #21)
      await expect(close).toBeFocused()

      // Esc chiude e il focus torna alla campana
      await page.keyboard.press('Escape')
      await expect(panel).toBeHidden()
      await expect(bell).toBeFocused()

      // Aprire e chiudere non ha segnato nulla come letto: il nome della campana (conteggio) e' invariato
      await expect(bell).toHaveAttribute('aria-label', bellNameBefore)
    })
  })
}
