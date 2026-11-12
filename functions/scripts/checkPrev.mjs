// Controllo del commit `<prev>` per il rollback functions: stampa engines.node di <prev> e di HEAD
// (da `git show HEAD:functions/package.json`, cioè l'ultimo commit, non il disco) e rifiuta un runtime
// dismesso o diverso da quello atteso. Uso: node functions/scripts/checkPrev.mjs <sha>
// Qualsiasi errore imprevisto = exit 1.
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { evaluatePrev, readEnginesNode } from './checkPrevLib.mjs'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

function main() {
  const prevSha = process.argv[2]
  const result = evaluatePrev({
    prevSha,
    prevEngines: prevSha ? readEnginesNode(REPO_ROOT, prevSha.trim()) : undefined,
    headEngines: readEnginesNode(REPO_ROOT, 'HEAD'),
  })
  if (!result.ok) {
    console.error(result.message)
    process.exit(1)
  }
  console.log(result.message)
}

try {
  main()
} catch {
  console.error('checkPrev: errore imprevisto.')
  process.exit(1)
}
