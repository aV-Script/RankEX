/**
 * Layout e accessibilita' del pannello notifiche cliente su rankex-dev (Sprint #21 AI 2).
 * Misurato con boundingBox, non dichiarato: BUG-032 (header schiacciato, titolo sovrapposto, "Chiudi"
 * che finiva a capo) e BUG-033/036 (campane senza nome accessibile). Le misure dell'header del pannello
 * stanno in layoutHelpers.js (`expectNotificationsPanelLayout`), le usa anche la spec della Home.
 *
 * Precondizione QA: cliente di base di qa-pt (qadev.pt.cliente@test.rankex) con primo accesso fatto e
 * >= 1 notifica non letta (`qa-seed-notif-*`), cioe' `npm run qa:dev:seed` lanciato. La spec NON segna
 * nulla come letto: le notifiche seed sono idempotenti e non vengono ricreate non lette.
 */
import { test, expect } from '../fixtures.js'
import { qaClientUsers } from '../qaDev.config.js'
import {
  VIEWPORTS, BELL_NAME, UNREAD_BELL_NAME, isDesktopViewport, expectNoHorizontalScroll,
  expectNotificationsPanelLayout,
} from '../layoutHelpers.js'

const CLIENT_USER_KEY = qaClientUsers('pt')[0].key

for (const viewport of VIEWPORTS) {
  test.describe(`pannello notifiche cliente a ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('campana col nome, header misurato, focus su Chiudi e ritorno alla campana', async ({ openAs }) => {
      const page = await openAs(CLIENT_USER_KEY)
      const isDesktop = isDesktopViewport(viewport)

      // Desktop: la top nav con la campana esiste solo fuori dall'hub (la Home ha "Vedi tutte", coperta da
      // clientHomeLayout.spec.js), quindi qui si entra in una sezione (Calendario)
      if (isDesktop) await page.getByRole('button', { name: 'Calendario', exact: true }).click()

      // BUG-033/036: la campana visibile ha il nome accessibile, con le non lette (precondizione del seed)
      const bell = page.getByRole('button', { name: BELL_NAME })
      await expect(bell, 'una sola campana visibile a questo viewport').toHaveCount(1)
      await expect(bell, 'serve >= 1 notifica non letta: rilancia npm run qa:dev:seed').toHaveAccessibleName(UNREAD_BELL_NAME)
      const bellNameBefore = await bell.getAttribute('aria-label')

      await bell.click()
      const panel = page.getByRole('dialog', { name: 'Notifiche' })
      await expect(panel).toBeVisible()

      await expectNoHorizontalScroll(page)
      const close = await expectNotificationsPanelLayout(panel, viewport)

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
