/**
 * Le callable devono attendere audit e side effect prima del return: dopo il
 * return l'istanza Cloud Functions può essere fermata e la promise troncata
 * (voce di audit persa). Analisi testuale dei sorgenti in src/callable.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const CALLABLE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'callable')

// Chiamate che restituiscono una promise di side effect da attendere:
// funzione libera (writeAudit) e metodi di Firestore/Auth Admin SDK
const SIDE_EFFECT_PATTERNS = [
  { label: 'writeAudit', source: String.raw`(?<![\w$.])writeAudit\s*\(` },
  { label: 'metodo', source: String.raw`\.(?:commit|recursiveDelete|createUser|deleteUser|deleteUsers)\s*\(` },
]

/** Toglie commenti e contenuto delle stringhe, preservando righe e colonne. */
function stripCommentsAndStrings(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length))
    .replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, m => m[0] + ' '.repeat(m.length - 2) + m[0])
}

/** @returns {string[]} "file:riga chiamata" per ogni chiamata non attesa */
export function findUnawaitedSideEffects(source, file = 'source') {
  const clean = stripCommentsAndStrings(source)
  const found = []
  for (const { source: pattern } of SIDE_EFFECT_PATTERNS) {
    const re = new RegExp(pattern, 'g')
    let match
    while ((match = re.exec(clean)) !== null) {
      const before = clean.slice(0, match.index)
      // istruzione corrente: dall'ultimo ; { } o a-capo fino alla chiamata
      const statementStart = /[^;{}\n]*$/.exec(before)[0]
      const isAwaitedOrReturned = /\b(?:await|return)\b/.test(statementStart)
      const isDeclaration = /\bfunction\s*\*?\s*$/.test(before)
      if (isAwaitedOrReturned || isDeclaration || isInsideAwaitedPromiseAll(before)) continue
      found.push(`${file}:${before.split('\n').length} ${match[0].trim()}`)
    }
  }
  return found
}

/** True se l'indice cade dentro un `await Promise.all(` / `return Promise.all(` ancora aperto. */
function isInsideAwaitedPromiseAll(before) {
  const re = /(?:\bawait|\breturn)\s+Promise\.all\s*\(/g
  let last = null
  let match
  while ((match = re.exec(before)) !== null) last = match
  if (!last) return false
  let depth = 0
  for (const ch of before.slice(last.index + last[0].length - 1)) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
  }
  return depth > 0
}

describe('findUnawaitedSideEffects (self-test)', () => {
  it('segnala writeAudit non atteso', () => {
    expect(findUnawaitedSideEffects('async function f() {\n  writeAudit(x)\n}', 'f.js')).toEqual(['f.js:2 writeAudit('])
  })
  it('accetta await, return e Promise.all atteso', () => {
    expect(findUnawaitedSideEffects('await writeAudit(x)')).toEqual([])
    expect(findUnawaitedSideEffects('return writeAudit(x)')).toEqual([])
    expect(findUnawaitedSideEffects('await Promise.all([a(), writeAudit(x)])')).toEqual([])
  })
  it('segnala writeAudit in un Promise.all non atteso', () => {
    expect(findUnawaitedSideEffects('Promise.all([writeAudit(x)])')).toHaveLength(1)
  })
  it('segnala batch.commit() non atteso, accetta await batch.commit()', () => {
    expect(findUnawaitedSideEffects('async function f() {\n  batch.commit()\n}', 'f.js')).toEqual(['f.js:2 .commit('])
    expect(findUnawaitedSideEffects('await batch.commit()')).toEqual([])
    expect(findUnawaitedSideEffects('try { await getAuth().deleteUsers(uids) } catch {}')).toEqual([])
    expect(findUnawaitedSideEffects('getAuth().deleteUser(uid)')).toHaveLength(1)
    expect(findUnawaitedSideEffects('db.recursiveDelete(ref)')).toHaveLength(1)
  })
  it('ignora commenti, stringhe e import', () => {
    expect(findUnawaitedSideEffects('// writeAudit(x)\n/* writeAudit(y) */\nconst s = "writeAudit(z)"')).toEqual([])
    expect(findUnawaitedSideEffects("import { writeAudit } from '../shared/actor.js'")).toEqual([])
  })
})

describe('callable: audit e side effect attesi prima del return', () => {
  it('nessuna chiamata non attesa in src/callable', () => {
    const violations = readdirSync(CALLABLE_DIR)
      .filter(file => file.endsWith('.js'))
      .flatMap(file => findUnawaitedSideEffects(readFileSync(join(CALLABLE_DIR, file), 'utf8'), `src/callable/${file}`))
    expect(violations, `Side effect non attesi:\n${violations.join('\n')}`).toEqual([])
  })
})
