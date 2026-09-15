// Rasterizza icon-source.html / splash-source.html in icon.png / splash.png
// usando Chromium via Playwright (già una devDependency del repo principale,
// risolto per risalita di node_modules — nessuna installazione aggiuntiva).
//
// Uso:
//   node resources/generate.mjs
// Poi, con android/ e ios/ già aggiunti (npx cap add android / ios):
//   npx capacitor-assets generate
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const targets = [
  { html: 'icon-source.html', png: 'icon.png', size: 1024 },
  { html: 'splash-source.html', png: 'splash.png', size: 2732 },
]

const browser = await chromium.launch()
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size } })
  await page.goto(`file://${path.join(__dirname, t.html)}`)
  await page.screenshot({ path: path.join(__dirname, t.png), omitBackground: false })
  await page.close()
  console.log(`✓ ${t.png} (${t.size}x${t.size})`)
}
await browser.close()
