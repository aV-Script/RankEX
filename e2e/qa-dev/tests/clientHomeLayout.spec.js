/**
 * Layout, accessibilita' e terminologia della Home cliente su rankex-dev (Sprint #21, STORY-048 T6).
 * Misurato con boundingBox / getBoundingClientRect a 360x640 e 1366x768, per il cliente di base di qa-pt e
 * per l'allievo di base di qa-soccer. Estende la spec del pannello notifiche (AI 2): costanti e misure comuni
 * in layoutHelpers.js, il pannello di `clientNotificationsLayout.spec.js` raggiunge la campana da Calendario,
 * qui il pannello si apre dalla Home con "Vedi tutte".
 *
 * Precondizione QA (`npm run qa:dev:seed` lanciato): cliente/allievo di base con primo accesso fatto,
 * >= 1 slot pianificato da oggi (`qa-seed-slot-upcoming-1`) e >= 1 notifica non letta (`qa-seed-notif-*`
 * tra le 2 mostrate nella Home). Se mancano la spec fallisce con un messaggio che lo dice (non salta).
 * La spec NON segna nulla come letto e non modifica dati.
 */
import { test, expect } from '../fixtures.js'
import { qaClientUsers } from '../qaDev.config.js'
import {
  VIEWPORTS, PX_TOLERANCE, BELL_NAME, isDesktopViewport, expectNoHorizontalScroll, expectNotificationsPanelLayout,
  documentBox, rectsOverlap,
} from '../layoutHelpers.js'

/** Altezza della bottom nav fissa dell'area cliente sotto `lg` (ClientBottomNav: `height: 62`) */
const BOTTOM_NAV_HEIGHT = 62
/** Area minima di un controllo toccabile, in px per lato */
const TOUCH_TARGET_MIN = 44
const PENTAGON_NODE_COUNT = 5
/** Indice del nodo Calendario nel pentagono (PENTAGON_SECTIONS: test, trofei, calendario, scheda, profilo) */
const CALENDAR_NODE_INDEX = 2

const PRECONDITION_HINT = 'precondizione QA mancante (slot futuro e >= 1 notifica non letta nella Home): rilancia npm run qa:dev:seed'

/** Terminologia attesa in Home per modulo: STRISCIA "<sessioni> di fila", titolo di PROSSIMA col genere giusto */
const MODULES = [
  {
    moduleKey: 'pt', label: 'qa-pt (cliente)',
    streakText: /sessioni di fila/i, nextTitle: /^Prossima\b/,
  },
  {
    moduleKey: 'soccer', label: 'qa-soccer (allievo)',
    streakText: /allenamenti di fila/i, nextTitle: /^Prossimo\b/,
    forbidden: [/Categoria/, /\bsession[ei]\b/i],
  },
]

/** Blocchi e controlli della Home, raggruppati per non ripetere i locatori */
function homeLocators(page) {
  const notifications = page.getByRole('region', { name: 'Ultime notifiche' })
  return {
    header: page.locator('header', { has: page.getByRole('progressbar') }),
    progressbar: page.getByRole('progressbar'),
    streak: page.getByRole('region', { name: 'Striscia' }),
    next: page.getByRole('button', { name: /^Prossim[oa]\b/ }),
    notifications,
    seeAll: page.getByRole('button', { name: 'Vedi tutte le notifiche' }),
    unreadDots: notifications.getByRole('img', { name: 'Non letta' }),
    coins: page.getByText(/^\d+ MONETE$/),
    nodes: page.locator('button[style*="position: absolute"][style*="z-index: 2"]'),
    bell: page.getByRole('button', { name: BELL_NAME }),
  }
}

async function openHome(openAs, userKey) {
  const page = await openAs(userKey)
  const home = homeLocators(page)
  await expect(home.progressbar, 'Home non caricata').toBeVisible()
  // Slot futuro: PROSSIMA e' un bottone con data e orario, non "Nessun/Nessuna ... in programma"
  await expect(home.next, PRECONDITION_HINT).toBeVisible()
  await expect(home.next, PRECONDITION_HINT).not.toContainText(/in programma/i)
  await expect(home.unreadDots.first(), PRECONDITION_HINT).toBeVisible()
  return { page, home }
}

/** Il locatore, interamente dentro il viewport e sopra la bottom nav (dopo averlo portato in vista) */
async function expectFullyInViewport(locator, viewport, what) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  expect(box, `${what}: nessun riquadro`).not.toBeNull()
  const navHeight = isDesktopViewport(viewport) ? 0 : BOTTOM_NAV_HEIGHT
  expect(box.x, `${what} oltre il bordo sinistro`).toBeGreaterThanOrEqual(-PX_TOLERANCE)
  expect(box.x + box.width, `${what} oltre il bordo destro`).toBeLessThanOrEqual(viewport.width + PX_TOLERANCE)
  expect(box.y, `${what} sopra il viewport`).toBeGreaterThanOrEqual(-PX_TOLERANCE)
  expect(box.y + box.height, `${what} coperto dalla bottom nav o fuori viewport`)
    .toBeLessThanOrEqual(viewport.height - navHeight + PX_TOLERANCE)
  return box
}

for (const moduleCase of MODULES) {
  const userKey = qaClientUsers(moduleCase.moduleKey)[0].key

  for (const viewport of VIEWPORTS) {
    test.describe(`Home cliente ${moduleCase.label} a ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })
      const isDesktop = isDesktopViewport(viewport)

      test('nessun scroll orizzontale, STRISCIA e PROSSIMA sulla stessa riga, ultima card raggiungibile', async ({ openAs }) => {
        const { page, home } = await openHome(openAs, userKey)
        await expectNoHorizontalScroll(page)

        // STRISCIA e PROSSIMA: stessa riga (y uguale) e dentro il viewport, a 360 come a 1366
        const streakBox = await expectFullyInViewport(home.streak, viewport, 'STRISCIA')
        const nextBox = await expectFullyInViewport(home.next, viewport, 'PROSSIMA')
        expect(Math.abs(streakBox.y - nextBox.y), 'STRISCIA e PROSSIMA non sono sulla stessa riga').toBeLessThanOrEqual(PX_TOLERANCE)
        expect(streakBox.x + streakBox.width, 'STRISCIA e PROSSIMA si sovrappongono').toBeLessThanOrEqual(nextBox.x + PX_TOLERANCE)
        // PROSSIMA puo' andare a capo ma il testo non esce dalla card
        const nextOverflow = await home.next.evaluate(element => element.scrollWidth - element.clientWidth)
        expect(nextOverflow, 'testo di PROSSIMA fuori dalla card').toBeLessThanOrEqual(PX_TOLERANCE)

        // Ultima card (ULTIME NOTIFICHE) raggiungibile scorrendo e non coperta dalla bottom nav
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
        const lastBox = await home.notifications.boundingBox()
        const navHeight = isDesktop ? 0 : BOTTOM_NAV_HEIGHT
        expect(lastBox.y + lastBox.height, 'ultima card sotto la bottom nav o fuori viewport')
          .toBeLessThanOrEqual(viewport.height - navHeight + PX_TOLERANCE)
        await expectNoHorizontalScroll(page)
      })

      test('pentagono: 5 nodi interi, almeno 44x44, disgiunti fra loro e dai blocchi nuovi', async ({ openAs }) => {
        const { page, home } = await openHome(openAs, userKey)
        await expect(home.nodes, 'nodi del pentagono').toHaveCount(PENTAGON_NODE_COUNT)

        for (let index = 0; index < PENTAGON_NODE_COUNT; index++) {
          const node = home.nodes.nth(index)
          const box = await expectFullyInViewport(node, viewport, `nodo ${index}`)
          expect(box.width, `nodo ${index} troppo stretto`).toBeGreaterThanOrEqual(TOUCH_TARGET_MIN)
          expect(box.height, `nodo ${index} troppo basso`).toBeGreaterThanOrEqual(TOUCH_TARGET_MIN)
        }

        await page.evaluate(() => window.scrollTo(0, 0))
        const nodeBoxes = []
        for (let index = 0; index < PENTAGON_NODE_COUNT; index++) nodeBoxes.push(await documentBox(home.nodes.nth(index)))
        const blockBoxes = {
          'testata': await documentBox(home.header),
          'STRISCIA': await documentBox(home.streak),
          'PROSSIMA': await documentBox(home.next),
          'ULTIME NOTIFICHE': await documentBox(home.notifications),
          'badge Monete': await documentBox(home.coins),
        }

        nodeBoxes.forEach((boxA, indexA) => {
          nodeBoxes.slice(indexA + 1).forEach((boxB, offset) => {
            expect(rectsOverlap(boxA, boxB), `nodo ${indexA} e nodo ${indexA + 1 + offset} si sovrappongono`).toBe(false)
          })
          for (const [blockName, blockBox] of Object.entries(blockBoxes)) {
            expect(rectsOverlap(boxA, blockBox), `nodo ${indexA} si sovrappone a ${blockName}`).toBe(false)
          }
        })
      })

      test('Monete e "Vedi tutte" visibili e dentro il viewport, barra XP accessibile', async ({ openAs }) => {
        const { page, home } = await openHome(openAs, userKey)

        await page.evaluate(() => window.scrollTo(0, 0))
        await expect(home.coins).toHaveCount(1)
        await expect(home.coins).toBeVisible()
        await expectFullyInViewport(home.coins, viewport, 'badge Monete')

        await expect(home.seeAll).toBeVisible()
        const seeAllBox = await expectFullyInViewport(home.seeAll, viewport, '"Vedi tutte"')
        expect(seeAllBox.height, '"Vedi tutte" troppo basso').toBeGreaterThanOrEqual(TOUCH_TARGET_MIN)

        // Barra XP: ruolo, valori e nome accessibile; il testo "LIVELLO n · x / y XP" e' visibile
        const { progressbar } = home
        await expect(progressbar).toHaveAttribute('aria-valuemin', '0')
        const valueNow = Number(await progressbar.getAttribute('aria-valuenow'))
        const valueMax = Number(await progressbar.getAttribute('aria-valuemax'))
        expect(Number.isFinite(valueNow), 'aria-valuenow numerico').toBe(true)
        expect(valueMax, 'aria-valuemax almeno 1').toBeGreaterThanOrEqual(1)
        await expect(progressbar).toHaveAttribute('aria-label', /^Livello \d+: .+ di .+ XP$/)
        await expect(home.header).toContainText(/LIVELLO \d+ · .+ \/ .+ XP/)
      })

      test('terminologia del modulo in Home', async ({ openAs }) => {
        const { page, home } = await openHome(openAs, userKey)
        await expect(home.streak).toContainText(moduleCase.streakText)
        await expect(home.next).toContainText(moduleCase.nextTitle)
        for (const pattern of moduleCase.forbidden ?? []) {
          await expect(page.locator('body'), `termine non ammesso in Home: ${pattern}`).not.toContainText(pattern)
        }
      })

      test('"Vedi tutte" apre il pannello: focus su Chiudi, Esc torna su "Vedi tutte", nulla segnato come letto', async ({ openAs }) => {
        const { page, home } = await openHome(openAs, userKey)
        const unreadBefore = await home.unreadDots.count()
        // Sotto lg la campana e' nella bottom nav: il suo nome contiene il conteggio delle non lette
        const bellNameBefore = isDesktop ? null : await home.bell.getAttribute('aria-label')

        await home.seeAll.scrollIntoViewIfNeeded()
        await home.seeAll.click()
        const panel = page.getByRole('dialog', { name: 'Notifiche' })
        await expect(panel).toBeVisible()
        await expectNoHorizontalScroll(page)
        const close = await expectNotificationsPanelLayout(panel, viewport)

        await expect(close, 'primo focus su "Chiudi"').toBeFocused()
        await page.keyboard.press('Escape')
        await expect(panel).toBeHidden()
        await expect(home.seeAll, 'il focus deve tornare su "Vedi tutte"').toBeFocused()

        // Aprire e chiudere non segna nulla come letto
        await expect(home.unreadDots).toHaveCount(unreadBefore)
        if (!isDesktop) await expect(home.bell).toHaveAttribute('aria-label', bellNameBefore)
      })

      test('"XP ×N,N" della Home uguale a quello di Calendario › STRISCIA', async ({ openAs }) => {
        const { page, home } = await openHome(openAs, userKey)
        const streakText = await home.streak.innerText()
        const multiplier = streakText.match(/XP ×\d+,\d/)?.[0]
        expect(multiplier, 'moltiplicatore "XP ×N,N" assente dalla card STRISCIA').toBeTruthy()

        await home.nodes.nth(CALENDAR_NODE_INDEX).click()
        const calendarStreak = page.getByText('STRISCIA', { exact: true }).locator('..')
        await expect(calendarStreak, 'Calendario › STRISCIA').toContainText(multiplier)
      })
    })
  }
}
