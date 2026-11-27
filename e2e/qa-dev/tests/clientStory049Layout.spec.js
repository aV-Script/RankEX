/**
 * STORY-049 (Sprint #22): area cliente a 360 px su rankex-dev, misurata con boundingBox / scrollWidth a 360x640
 * e 1366x768 sul cliente di base di qa-pt.
 *   AC1  hub: etichette intere, dentro il viewport, senza sovrapposizioni
 *   AC2  vetrina trofei con 5 badge: dentro la card, niente scroll orizzontale, label non sovrapposte
 *   AC3  STATUS: barre >= 80 px col valore visibile, pentagono dentro la card
 *
 * Precondizioni QA: `npm run qa:dev:seed` lanciato (cliente di base con primo accesso fatto e 5 badge manuali in
 * vetrina, `planSeedBadges`). AC3 richiede un campionamento del cliente di base (>= 3 stat > 0), che il seed NON
 * scrive: la QA lo fa dalla UI trainer; se manca il test salta con la ragione (non fallisce).
 * La spec non modifica dati.
 */
import { test, expect } from '../fixtures.js'
import { qaClientUsers } from '../qaDev.config.js'
import {
  VIEWPORTS, PX_TOLERANCE, expectNoHorizontalScroll, documentBox, textDocumentBox, rectsOverlap, rectInside,
  scrollToViewportCenter, readAccessibleName,
} from '../layoutHelpers.js'

const PENTAGON_NODE_COUNT = 5
const HUB_TEST_INDEX      = 0
const HUB_TROPHIES_INDEX  = 1
const HUB_LABELS          = ['TEST', 'TROFEI', 'CALENDARIO', 'SCHEDA', 'PROFILO']
const SHOWCASE_SIZE       = 5
/** Larghezza minima della traccia di una barra STATUS (AC3) */
const STAT_TRACK_MIN_WIDTH = 80
/** Stat > 0 necessarie per dire che il cliente di base ha un campionamento */
const MIN_SAMPLED_STATS = 3

const SEED_HINT = 'precondizione QA mancante (5 badge in vetrina): rilancia npm run qa:dev:seed'
const SAMPLING_SKIP_REASON = 'il cliente di base qa-pt non ha un campionamento (< 3 stat > 0): lo fa la QA dalla UI trainer (salvaCampionamento)'

const userKey = qaClientUsers('pt')[0].key

async function openHub(openAs) {
  const page = await openAs(userKey)
  await expect(page.getByRole('progressbar'), 'Home non caricata').toBeVisible()
  const nodes = page.locator('button[style*="position: absolute"][style*="z-index: 2"]')
  await expect(nodes, 'nodi del pentagono').toHaveCount(PENTAGON_NODE_COUNT)
  return { page, nodes }
}

for (const viewport of VIEWPORTS) {
  test.describe(`STORY-049 area cliente qa-pt a ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('AC1 hub: etichette intere, dentro il viewport, senza sovrapposizioni', async ({ openAs }) => {
      const { page, nodes } = await openHub(openAs)
      await page.evaluate(() => window.scrollTo(0, 0))

      const labelBoxes = []
      const nodeBoxes = []
      for (let index = 0; index < PENTAGON_NODE_COUNT; index++) {
        const node = nodes.nth(index)
        const label = node.locator('span')
        const name = await readAccessibleName(label)
        expect(name, `etichetta del nodo ${index} troncata o diversa`).toBe(HUB_LABELS[index])
        // Il box del testo: l'etichetta e' `nowrap`, quindi il suo box coincide col testo
        const box = await textDocumentBox(label)
        expect(box.x, `etichetta ${name} oltre il bordo sinistro`).toBeGreaterThanOrEqual(-PX_TOLERANCE)
        expect(box.x + box.width, `etichetta ${name} oltre il bordo destro`).toBeLessThanOrEqual(viewport.width + PX_TOLERANCE)
        labelBoxes.push({ name, box })
        nodeBoxes.push(await documentBox(node))
      }

      labelBoxes.forEach(({ name, box }, index) => {
        labelBoxes.slice(index + 1).forEach(other => {
          expect(rectsOverlap(box, other.box), `etichette ${name} e ${other.name} si sovrappongono`).toBe(false)
        })
        nodeBoxes.forEach((nodeBox, nodeIndex) => {
          if (nodeIndex === index) return
          expect(rectsOverlap(box, nodeBox), `etichetta ${name} si sovrappone al bottone ${HUB_LABELS[nodeIndex]}`).toBe(false)
        })
      })
      await expectNoHorizontalScroll(page)
    })

    test('AC2 vetrina trofei: 5 badge dentro la card, niente scroll orizzontale, label non sovrapposte', async ({ openAs }) => {
      const { page, nodes } = await openHub(openAs)
      await nodes.nth(HUB_TROPHIES_INDEX).click()

      const showcase = page.getByTestId('trophy-showcase')
      await expect(showcase, SEED_HINT).toBeVisible()
      const medals = showcase.getByRole('img')
      await expect(medals, SEED_HINT).toHaveCount(SHOWCASE_SIZE)
      await scrollToViewportCenter(showcase)

      const containerBox = await documentBox(showcase)
      const labels = showcase.locator('div.font-display').filter({ hasNotText: /Profilo \(/ })
      await expect(labels, 'label dei badge').toHaveCount(SHOWCASE_SIZE)

      const medalBoxes = []
      const labelBoxes = []
      for (let index = 0; index < SHOWCASE_SIZE; index++) {
        const medalBox = await documentBox(medals.nth(index))
        // Il testo della label, non il suo box: una parola lunga ("PERSEVERANZA") trabocca dal max-width
        const labelBox = await textDocumentBox(labels.nth(index))
        expect(rectInside(medalBox, containerBox), `badge ${index} fuori dalla card`).toBe(true)
        expect(rectInside(labelBox, containerBox), `label del badge ${index} fuori dalla card`).toBe(true)
        medalBoxes.push(medalBox)
        labelBoxes.push(labelBox)
      }
      labelBoxes.forEach((box, index) => {
        labelBoxes.slice(index + 1).forEach((other, offset) => {
          expect(rectsOverlap(box, other), `label ${index} e ${index + 1 + offset} si sovrappongono`).toBe(false)
        })
        medalBoxes.forEach((medalBox, medalIndex) => {
          if (medalIndex !== index) expect(rectsOverlap(box, medalBox), `label ${index} sopra il badge ${medalIndex}`).toBe(false)
        })
      })

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(scrollWidth, 'scroll orizzontale della pagina').toBeLessThanOrEqual(viewport.width)

      // A 1366 i 5 badge restano su una riga
      if (viewport.width >= 1024) {
        const tops = medalBoxes.map(box => box.y)
        expect(Math.max(...tops) - Math.min(...tops), 'a 1366 i badge non stanno su una riga').toBeLessThanOrEqual(PX_TOLERANCE)
      }
    })

    test('AC3 STATUS: barre >= 80 px con il valore visibile, pentagono dentro la card', async ({ openAs }) => {
      const { page, nodes } = await openHub(openAs)
      await nodes.nth(HUB_TEST_INDEX).click()

      const stats = page.getByTestId('stats-section')
      await expect(stats, 'sezione STATUS').toBeVisible()
      const tracks = stats.getByTestId('stats-track')
      const trackCount = await tracks.count()
      expect(trackCount, 'barre STATUS').toBeGreaterThan(0)

      const values = []
      for (let index = 0; index < trackCount; index++) {
        values.push(Number((await readAccessibleName(tracks.nth(index).locator('xpath=following-sibling::span[1]'))).trim()))
      }
      test.skip(values.filter(value => value > 0).length < MIN_SAMPLED_STATS, SAMPLING_SKIP_REASON)

      await scrollToViewportCenter(stats)
      for (let index = 0; index < trackCount; index++) {
        const track = tracks.nth(index)
        const trackBox = await track.boundingBox()
        expect(trackBox.width, `barra ${index}: traccia troppo stretta`).toBeGreaterThanOrEqual(STAT_TRACK_MIN_WIDTH)
        const valueSpan = track.locator('xpath=following-sibling::span[1]')
        await expect(valueSpan, `barra ${index}: valore non visibile`).toBeVisible()
        await expect(valueSpan).toHaveText(/^\d+$/)
      }

      // Il pentagono, con le sue etichette, sta dentro la card che contiene STATUS
      const card = page.locator('.rx-card', { has: stats })
      const cardBox = await documentBox(card)
      const radar = stats.getByRole('img', { name: /^Radar percentili/ })
      expect(rectInside(await documentBox(radar), cardBox), 'pentagono fuori dalla card').toBe(true)
      const radarLabels = radar.locator('text')
      const labelCount = await radarLabels.count()
      expect(labelCount, 'etichette del radar').toBeGreaterThan(0)
      for (let index = 0; index < labelCount; index++) {
        expect(rectInside(await textDocumentBox(radarLabels.nth(index)), cardBox), `etichetta ${index} del radar fuori dalla card`).toBe(true)
      }
      await expectNoHorizontalScroll(page)
    })
  })
}
