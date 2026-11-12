// Logica del controllo `<prev>` per il rollback functions (vedi checkPrev.mjs e CLAUDE.md →
// "Da annotare in CHANGELOG prima di ogni deploy prod"). Node puro + git.
import { execFileSync } from 'node:child_process'

// Runtime atteso dalle functions in prod (`nodejs22`): engines.node deve essere esattamente questo.
export const EXPECTED_NODE = '22'
// Node 18 e 20 dismessi da Cloud Functions (20: 30/10/2026, vedi CLAUDE.md): un commit con questi
// engines non è rideployabile come rollback.
export const RETIRED_NODE_MAJORS = ['18', '20']

const SHA_PATTERN = /^[0-9a-f]{4,40}$/i

export function evaluatePrev({ prevSha, prevEngines, headEngines }) {
  const sha = (prevSha ?? '').trim()
  const headLine = `engines.node HEAD: ${headEngines ?? 'non leggibile'}`
  if (sha === '') {
    return { ok: false, message: 'Uso: node functions/scripts/checkPrev.mjs <sha>. Sha mancante.' }
  }
  if (prevEngines === undefined || prevEngines === null || String(prevEngines).trim() === '') {
    return {
      ok: false,
      message: `<prev> ${sha} NON deployabile: engines.node assente o functions/package.json non leggibile in quel commit.\n${headLine}`,
    }
  }
  const prev = String(prevEngines).trim()
  const major = (prev.match(/\d+/) ?? [''])[0]
  const state = `engines.node ${sha}: ${prev}\n${headLine}`
  if (prev === EXPECTED_NODE) {
    return { ok: true, message: `<prev> ${sha} deployabile (runtime atteso nodejs${EXPECTED_NODE}).\n${state}` }
  }
  if (RETIRED_NODE_MAJORS.includes(major)) {
    return { ok: false, message: `<prev> ${sha} NON deployabile: runtime Node ${major} dismesso da Cloud Functions (solo fix forward).\n${state}` }
  }
  return { ok: false, message: `<prev> ${sha} NON deployabile: engines.node "${prev}" diverso da quello atteso "${EXPECTED_NODE}" (range non ammessi).\n${state}` }
}

// Legge engines.node di functions/package.json in `ref`; undefined se sha/file/JSON/campo non validi.
export function readEnginesNode(repoRoot, ref) {
  if (!SHA_PATTERN.test(ref) && ref !== 'HEAD') return undefined
  try {
    const raw = execFileSync('git', ['show', `${ref}:functions/package.json`], {
      cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    })
    const node = JSON.parse(raw)?.engines?.node
    return typeof node === 'string' ? node : undefined
  } catch {
    return undefined
  }
}
