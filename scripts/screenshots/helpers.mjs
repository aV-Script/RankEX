import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

export const BASE_URL = 'https://rankex-app-dev.web.app'
export const ADMIN_URL = 'https://rankex-admin-dev.web.app'

export const VIEWPORTS = {
  mobile:  { width: 390,  height: 844 },
  tablet:  { width: 834,  height: 1194 },
  desktop: { width: 1440, height: 900 },
}

export const OUT_DIR = 'c:/Users/vAito/Desktop/RankEX/screenshots'

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

export async function newPage(browser, breakpoint) {
  const context = await browser.newContext({
    viewport: VIEWPORTS[breakpoint],
    deviceScaleFactor: 2,
  })
  return context.newPage()
}

export async function shot(page, breakpoint, name) {
  const dir = path.join(OUT_DIR, breakpoint)
  fs.mkdirSync(dir, { recursive: true })
  const filepath = path.join(dir, `${name}.png`)
  await page.screenshot({ path: filepath, fullPage: false })
  console.log(`  [OK] ${breakpoint}/${name}.png`)
}

export async function login(page, baseUrl, email, password) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await sleep(1200)
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="mail" i]')
  if (!emailInput) throw new Error('Email input not found')
  await emailInput.fill(email)
  const passInput = await page.$('input[type="password"]')
  if (!passInput) throw new Error('Password input not found')
  await passInput.fill(password)
  const submitBtn = await page.$('button[type="submit"], button:has-text("Accedi"), button:has-text("Login"), button:has-text("Entra")')
  if (!submitBtn) throw new Error('Submit button not found')
  await submitBtn.click()
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {})
  await sleep(2000)
}

/** Clicca il primo elemento il cui testo esatto (case-insensitive) matcha uno dei pattern. */
export async function clickText(page, labelPatterns, { timeout = 400 } = {}) {
  for (const pattern of labelPatterns) {
    try {
      const found = await page.evaluate((txt) => {
        const all = document.querySelectorAll('button, a, [role="tab"], [role="button"], nav *, label')
        for (const el of all) {
          const t = (el.textContent || '').trim().toUpperCase()
          if (t === txt.toUpperCase()) {
            el.scrollIntoView({ block: 'center' })
            el.click()
            return true
          }
        }
        return false
      }, pattern)
      if (found) {
        await sleep(timeout)
        return true
      }
    } catch { /* noop */ }
  }
  return false
}

/**
 * Clicca l'elemento più "profondo" (meno figli) il cui testo CONTIENE uno dei
 * pattern. Cerca prima solo tra elementi interattivi reali (button/a/role) —
 * altrimenti un wrapper come `#root > div` (che ha anch'esso un solo figlio)
 * può vincere il tie-break sul conteggio figli essendo visitato per primo in
 * document order, venendo cliccato al posto del vero bottone.
 */
export async function clickContains(page, labelPatterns, { timeout = 400 } = {}) {
  for (const pattern of labelPatterns) {
    try {
      const found = await page.evaluate((txt) => {
        const upper = txt.toUpperCase()
        const pick = (selector) => {
          const all = document.querySelectorAll(selector)
          let best = null
          for (const el of all) {
            const t = (el.textContent || '').trim().toUpperCase()
            if (t.includes(upper)) {
              if (!best || el.children.length < best.children.length) best = el
            }
          }
          return best
        }
        const best = pick('button, a, [role="tab"], [role="button"]') ?? pick('nav *, div, span, li, h1, h2, h3')
        if (best) {
          best.scrollIntoView({ block: 'center' })
          best.click()
          return true
        }
        return false
      }, pattern)
      if (found) {
        await sleep(timeout)
        return true
      }
    } catch { /* noop */ }
  }
  return false
}

/**
 * Come clickText, ma considera solo elementi il cui bounding rect inizia
 * sotto minY — utile per scegliere la sotto-tab locale invece della nav
 * globale quando condividono lo stesso testo (es. "CALENDARIO", "NOTE").
 */
export async function clickTextBelow(page, labelPatterns, minY, maxY = 300, { timeout = 400 } = {}) {
  for (const pattern of labelPatterns) {
    try {
      const found = await page.evaluate(({ txt, minY, maxY }) => {
        const upper = txt.toUpperCase()
        const all = document.querySelectorAll('button, a, [role="tab"], [role="button"]')
        for (const el of all) {
          const t = (el.textContent || '').trim().toUpperCase()
          const top = el.getBoundingClientRect().top
          if (t === upper && top >= minY && top <= maxY) {
            el.scrollIntoView({ block: 'center' })
            el.click()
            return true
          }
        }
        return false
      }, { txt: pattern, minY, maxY })
      if (found) {
        await sleep(timeout)
        return true
      }
    } catch { /* noop */ }
  }
  return false
}

/**
 * Chiude un modal cliccando il suo backdrop (div.fixed.inset-0 con onClick={onClose}).
 * Non tutti i modal gestiscono il tasto Escape (es. RecurrenceModal, CreateOrgForm
 * non hanno un listener keydown — solo AddSlotModal ce l'ha) quindi affidarsi a
 * page.keyboard.press('Escape') lascia il modal aperto e sovrapposto al passo
 * successivo. Cliccare il backdrop direttamente (invece di coordinate) funziona
 * indipendentemente da questo.
 */
export async function closeModal(page, { timeout = 400 } = {}) {
  const closed = await page.evaluate(() => {
    const overlays = document.querySelectorAll('div.fixed.inset-0')
    if (overlays.length === 0) return false
    overlays[overlays.length - 1].click()
    return true
  })
  if (closed) await sleep(timeout)
  return closed
}

/** Clicca il bottone dello slot (EventBlock) — riconosciuto da classi fisse, non dal testo. */
export async function clickSlotEvent(page, { timeout = 600 } = {}) {
  const found = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const b of buttons) {
      if (b.className.includes('absolute') && b.className.includes("rounded-[3px]") && /\d{2}:\d{2}/.test(b.textContent)) {
        b.scrollIntoView({ block: 'center' })
        b.click()
        return true
      }
    }
    return false
  })
  if (found) await sleep(timeout)
  return found
}

export async function fillByPlaceholder(page, placeholder, value) {
  const el = await page.$(`input[placeholder="${placeholder}"]`)
  if (!el) return false
  await el.fill(value)
  return true
}

/**
 * Clicca un bottone tramite aria-label esatto, con fallback su un vero
 * elemento <button> (non div/span) il cui testo combacia — utile per sidebar
 * icon-only dove il testo visibile esiste solo in un tooltip pointer-events:none
 * che clickText/clickContains rischiano di trovare e cliccare a vuoto.
 */
export async function clickNavLabel(page, label, { timeout = 600 } = {}) {
  const found = await page.evaluate((lbl) => {
    const byAria = document.querySelector(`button[aria-label="${lbl}"]`)
    if (byAria) { byAria.click(); return true }
    const buttons = document.querySelectorAll('button')
    for (const b of buttons) {
      if ((b.textContent || '').trim().toUpperCase() === lbl.toUpperCase()) {
        b.click()
        return true
      }
    }
    return false
  }, label)
  if (found) await sleep(timeout)
  return found
}

export async function launchBrowser() {
  return chromium.launch({ headless: true })
}
