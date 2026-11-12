// Guard del deploy delle Cloud Functions: stampa lo sha da cui si deploya e rifiuta un working tree
// sporco in functions/ o in firebase.json. Cross-platform: solo Node + git.
// Usato da `npm run deploy` e `deploy:dev` (functions/package.json) prima di `firebase deploy`.
// main() parte sempre (niente controllo "sono il main"): qualsiasi errore imprevisto = exit 1.
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { evaluateDeployState, collectDeployState } from './deployGuardLib.mjs'

const FUNCTIONS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function main() {
  let result
  try {
    result = evaluateDeployState(collectDeployState(FUNCTIONS_ROOT))
  } catch {
    result = { ok: false, message: 'Deploy rifiutato: impossibile verificare lo stato git (git non disponibile o cartella non in un repository).', warnings: [] }
  }
  result.warnings.forEach(warning => console.error(warning))
  if (!result.ok) {
    console.error(result.message)
    process.exit(1)
  }
  console.log(result.message)
}

try {
  main()
} catch {
  console.error('Deploy rifiutato: errore imprevisto nel guard.')
  process.exit(1)
}
