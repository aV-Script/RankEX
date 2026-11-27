// Verifica che i moduli di src/ importati dagli script in scripts/*.mjs si risolvano
// con il loader ESM nativo di Node (senza Vite): un import senza estensione, o con
// un alias, funziona nel bundle ma qui fa ERR_MODULE_NOT_FOUND (modello:
// functions/test/indexImport.test.js).
//
// Gli script non si possono importare: eseguono main() al top-level contro Firebase.
// Si segue quindi il grafo degli import relativi per testo (script -> helper in e2e/ ...)
// e si importano direttamente i moduli di src/ raggiunti (puri, senza side effect):
// il loader nativo risolve da solo i loro import transitivi, che e' dove si rompe.
import { existsSync, readdirSync, readFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url))
const SRC_DIR = resolve(SCRIPTS_DIR, '..', 'src')
const SPECIFIER_RE = /\bfrom\s+['"](\.{1,2}\/[^'"]+)['"]|\bimport\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g

const targets = new Map()
const visited = new Set()

function collect(file, origin) {
  if (visited.has(file) || !existsSync(file)) return
  visited.add(file)
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(SPECIFIER_RE)) {
    const target = resolve(dirname(file), match[1] ?? match[2])
    if (target.startsWith(SRC_DIR)) targets.set(target, origin)
    else collect(target, origin)
  }
}

for (const name of readdirSync(SCRIPTS_DIR).filter(entry => entry.endsWith('.mjs'))) {
  collect(join(SCRIPTS_DIR, name), name)
}

let failures = 0
for (const [target, script] of targets) {
  try {
    await import(pathToFileURL(target).href)
    console.log(`ok   ${script} -> ${target}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL ${script} -> ${target}\n     ${error.code ?? ''} ${error.message}`)
  }
}

console.log(`${targets.size} moduli src/ verificati, ${failures} errori`)
process.exit(failures > 0 ? 1 : 0)
