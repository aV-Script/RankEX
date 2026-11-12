import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  findMissingDeny,
  findExtraDeny,
  extractSettingsDeny,
} from '../../../scripts/checkDenyLib.mjs'

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../scripts/check-deny.mjs')
const PATTERNS = ['Bash(git reset --hard:*)', 'Bash(git clean:*)', 'PowerShell(git restore:*)']

describe('checkDenyLib', () => {
  it('nessun mancante se tutti i pattern sono presenti', () => {
    expect(findMissingDeny(PATTERNS, [...PATTERNS])).toEqual([])
  })

  it('elenca il pattern mancante', () => {
    expect(findMissingDeny(PATTERNS, [PATTERNS[0], PATTERNS[2]])).toEqual([PATTERNS[1]])
  })

  it('confronto esatto: una variante non conta come presente', () => {
    expect(findMissingDeny(PATTERNS, ['Bash(git reset --hard)', PATTERNS[1], PATTERNS[2]])).toEqual([PATTERNS[0]])
  })

  it('pattern in più nei settings = extra, non mancanti', () => {
    const actual = [...PATTERNS, 'Bash(rm -rf:*)']
    expect(findMissingDeny(PATTERNS, actual)).toEqual([])
    expect(findExtraDeny(PATTERNS, actual)).toEqual(['Bash(rm -rf:*)'])
  })

  it('settings senza permissions o con deny non array: errore', () => {
    expect(() => extractSettingsDeny({})).toThrow()
    expect(() => extractSettingsDeny({ permissions: {} })).toThrow()
    expect(() => extractSettingsDeny({ permissions: { deny: 'Bash(git clean:*)' } })).toThrow()
    expect(() => extractSettingsDeny(null)).toThrow()
  })
})

describe('check-deny.mjs (integrazione)', () => {
  let dir
  let copyPath
  const write = (name, content) => {
    const filePath = path.join(dir, name)
    writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content))
    return filePath
  }
  const run = (settingsPath) => spawnSync(process.execPath, [SCRIPT, settingsPath, copyPath], { encoding: 'utf8' })

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'check-deny-'))
    copyPath = write('copy.json', { deny: PATTERNS })
  })
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('exit 0 se tutti i pattern sono presenti', () => {
    const result = run(write('ok.json', { permissions: { deny: PATTERNS } }))
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('3/3')
  })

  it('exit 0 con avviso se ci sono pattern in più', () => {
    const result = run(write('extra.json', { permissions: { deny: [...PATTERNS, 'Bash(x:*)'] } }))
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('Bash(x:*)')
  })

  it('exit 1 se manca un pattern, e lo elenca', () => {
    const result = run(write('missing.json', { permissions: { deny: PATTERNS.slice(1) } }))
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(PATTERNS[0])
  })

  it('exit 1 con JSON malformato', () => {
    expect(run(write('bad.json', '{ non json')).status).toBe(1)
  })

  it('exit 1 con file assente', () => {
    expect(run(path.join(dir, 'assente.json')).status).toBe(1)
  })

  it('exit 1 senza permissions.deny', () => {
    expect(run(write('noperm.json', {})).status).toBe(1)
  })
})
