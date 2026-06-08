import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const OUT      = 'c:/Users/vAito/Desktop/RankEX/scripts/ux-screenshots'
const BASE_URL = 'http://localhost:5199'
const EMAIL    = 'client@test.rankex'
const PASS     = 'ClientTest1'

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function shot(page, name) {
  const fp = path.join(OUT, name)
  await page.screenshot({ path: fp, fullPage: false })
  console.log(`  [screenshot] ${name}`)
}

// Clicca qualsiasi elemento che contenga esattamente il testo (case-insensitive)
async function clickText(page, text) {
  return page.evaluate((t) => {
    const els = [...document.querySelectorAll('button, a, [role="tab"], span, div')]
    for (const el of els) {
      if (el.children.length === 0 && el.textContent.trim().toUpperCase() === t.toUpperCase()) {
        el.click(); return true
      }
    }
    // Fallback: partial match on leaf nodes
    for (const el of els) {
      if (el.textContent.trim().toUpperCase().startsWith(t.toUpperCase())) {
        el.click(); return true
      }
    }
    return false
  }, text)
}

const THEMES = [
  { id: 'rankex',   name: 'RankEX'   },
  { id: 'midnight', name: 'Midnight' },
  { id: 'carbon',   name: 'Carbon'   },
  { id: 'violet',   name: 'Violet'   },
  { id: 'steel',    name: 'Steel'    },
  { id: 'phantom',  name: 'Phantom'  },
  { id: 'mint',     name: 'Mint'     },
]

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx     = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page    = await ctx.newPage()

  // ── Login ──────────────────────────────────────────────────────────────
  console.log('Navigating to', BASE_URL)
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 })
  await sleep(1000)

  await page.fill('input[type="email"]',    EMAIL)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ timeout: 15000, waitUntil: 'networkidle' }).catch(() => {})
  await sleep(2500)
  console.log('Logged in. URL:', page.url())
  await shot(page, '00_logged_in.png')

  // ── Naviga al profilo → TEMA ───────────────────────────────────────────
  async function goProfileTema() {
    // bottom nav: PROFILO
    let ok = await clickText(page, 'PROFILO')
    await sleep(1000)
    // sub-tab TEMA
    ok = await clickText(page, 'TEMA')
    await sleep(800)
    return ok
  }

  // ── Vai all'hub (click center avatar button) ───────────────────────────
  async function goHub() {
    const clicked = await page.evaluate(() => {
      // Il bottone centrale del bottom nav ha un <img> di avatar
      const btns = [...document.querySelectorAll('nav button')]
      for (const b of btns) {
        if (b.querySelector('img')) { b.click(); return true }
      }
      // Fallback: tasto "home" / link /client
      return false
    })
    if (!clicked) await page.goto(BASE_URL + '/client', { waitUntil: 'networkidle' })
    await sleep(1500)
  }

  // Vai prima al tema per poi ciclare
  await goProfileTema()
  await shot(page, '01_profilo_tema_base.png')

  // ── Loop su tutti i temi ───────────────────────────────────────────────
  for (const { id, name } of THEMES) {
    console.log(`\n=== Tema: ${name} ===`)

    // Seleziona il tema
    await goProfileTema()
    await sleep(300)
    const clicked = await clickText(page, name)
    console.log(`  click "${name}":`, clicked)
    await sleep(1200)

    // Screenshot profilo/tema
    await shot(page, `${id}_01_profilo.png`)

    // Screenshot hub
    await goHub()
    await shot(page, `${id}_02_hub.png`)
  }

  await browser.close()
  console.log('\nDone! Screenshots saved to:', OUT)
})().catch(err => {
  console.error('FATAL:', err.message)
  process.exit(1)
})
