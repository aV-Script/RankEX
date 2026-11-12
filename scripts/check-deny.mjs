// Verifica che ogni pattern di docs/git-deny.json sia ancora in .claude/settings.json → permissions.deny.
// Uso: node scripts/check-deny.mjs [settingsPath] [copyPath]  (npm run check:deny)
// exit 0 = tutti presenti (pattern in più nei settings: solo avviso); exit 1 = mancanti o errore.
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { checkDeny } from './checkDenyLib.mjs'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_SETTINGS = path.join(REPO_ROOT, '.claude', 'settings.json')
const DEFAULT_COPY = path.join(REPO_ROOT, 'docs', 'git-deny.json')

function main() {
  const settingsPath = process.argv[2] ?? DEFAULT_SETTINGS
  const copyPath = process.argv[3] ?? DEFAULT_COPY
  const { ok, total, missing, extra } = checkDeny(settingsPath, copyPath)
  if (extra.length > 0) {
    console.warn(`check:deny avviso: ${extra.length} pattern nei settings non presenti nella copia (aggiornare docs/git-deny.json):`)
    extra.forEach(pattern => console.warn(`  + ${pattern}`))
  }
  if (!ok) {
    console.error(`check:deny FALLITO: ${missing.length}/${total} pattern mancanti nei settings:`)
    missing.forEach(pattern => console.error(`  - ${pattern}`))
    process.exit(1)
  }
  console.log(`check:deny ok: ${total}/${total} pattern presenti`)
}

try {
  main()
} catch (error) {
  console.error(`check:deny FALLITO: ${error.message}`)
  process.exit(1)
}
