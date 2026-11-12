// Carica il codebase reale in un processo Node separato, come fa la Firebase CLI al deploy.
// Dentro Vitest l'interop CJS/ESM è più permissiva (un `import { x }` inesistente da un modulo
// CommonJS passa), quindi l'import va fatto con il loader ESM nativo di Node: un export sbagliato
// (es. `import { logger } from 'firebase-functions/logger'`) fa fallire il test invece del deploy
// ("Functions codebase could not be analyzed successfully").
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const FUNCTIONS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMPORT_TIMEOUT_MS = 30000

describe('src/index.js', () => {
  it('si importa con il loader ESM nativo di Node ed esporta le callable', () => {
    const script = "import('./src/index.js').then(m => console.log(Object.keys(m).length))"
    const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: FUNCTIONS_ROOT,
      encoding: 'utf8',
      timeout: IMPORT_TIMEOUT_MS,
    })
    expect(Number(out.trim())).toBeGreaterThan(0)
  })
})
