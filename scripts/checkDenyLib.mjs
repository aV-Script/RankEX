// Logica di check:deny (vedi check-deny.mjs e CLAUDE.md → "Controprove e working tree"): confronta la
// copia tracciata dei pattern deny (docs/git-deny.json) con `permissions.deny` di .claude/settings.json.
// Node puro, nessuna dipendenza.
import { readFileSync } from 'node:fs'

function readJson(filePath, label) {
  let raw
  try {
    raw = readFileSync(filePath, 'utf8')
  } catch {
    throw new Error(`${label} non leggibile: ${filePath}`)
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`${label} non è un JSON valido: ${filePath}`)
  }
}

// Pattern della copia assenti dai settings (confronto esatto).
export function findMissingDeny(expected, actualDeny) {
  const actual = new Set(actualDeny)
  return expected.filter(pattern => !actual.has(pattern))
}

// Pattern presenti nei settings ma non nella copia (solo avviso).
export function findExtraDeny(expected, actualDeny) {
  const known = new Set(expected)
  return actualDeny.filter(pattern => !known.has(pattern))
}

export function extractSettingsDeny(settings) {
  const deny = settings?.permissions?.deny
  if (!Array.isArray(deny)) {
    throw new Error('settings senza permissions.deny (array atteso)')
  }
  return deny
}

export function extractCopyDeny(copy) {
  const deny = copy?.deny
  if (!Array.isArray(deny)) {
    throw new Error('copia senza deny (array atteso)')
  }
  return deny
}

export function checkDeny(settingsPath, copyPath) {
  const expected = extractCopyDeny(readJson(copyPath, 'Copia deny'))
  const actual = extractSettingsDeny(readJson(settingsPath, 'Settings'))
  const missing = findMissingDeny(expected, actual)
  const extra = findExtraDeny(expected, actual)
  return { ok: missing.length === 0, total: expected.length, missing, extra }
}
