import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { evaluatePrev } from '../scripts/checkPrevLib.mjs'

const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts')

describe('evaluatePrev', () => {
  it('22: ok, stampa engines di prev e HEAD', () => {
    const result = evaluatePrev({ prevSha: 'abc1234', prevEngines: '22', headEngines: '22' })
    expect(result.ok).toBe(true)
    expect(result.message).toContain('engines.node abc1234: 22')
    expect(result.message).toContain('engines.node HEAD: 22')
  })

  it('20 e 18: rifiuta come dismesso', () => {
    for (const engines of ['20', '18']) {
      const result = evaluatePrev({ prevSha: 'abc1234', prevEngines: engines, headEngines: '22' })
      expect(result.ok).toBe(false)
      expect(result.message).toContain('dismesso')
    }
  })

  it('range ">=22" e "^22": rifiuto esplicito', () => {
    for (const engines of ['>=22', '^22']) {
      const result = evaluatePrev({ prevSha: 'abc1234', prevEngines: engines, headEngines: '22' })
      expect(result.ok).toBe(false)
      expect(result.message).toContain('range non ammessi')
    }
  })

  it('engines mancante: rifiuta', () => {
    for (const engines of [undefined, null, '']) {
      expect(evaluatePrev({ prevSha: 'abc1234', prevEngines: engines, headEngines: '22' }).ok).toBe(false)
    }
  })

  it('sha vuoto o assente: rifiuta', () => {
    for (const prevSha of ['', '  ', undefined]) {
      const result = evaluatePrev({ prevSha, prevEngines: '22', headEngines: '22' })
      expect(result.ok).toBe(false)
      expect(result.message).toContain('Sha mancante')
    }
  })
})

describe('checkPrev.mjs (integrazione, repo temporaneo)', () => {
  const MISSING_SHA = 'deadbeefdeadbeef'
  let tmpRoot
  let repoDir
  let node20Sha
  let node22Sha

  const git = args => execFileSync('git', args, { cwd: repoDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  const commitEngines = node => {
    writeFileSync(path.join(repoDir, 'functions', 'package.json'), JSON.stringify({ engines: { node } }))
    git(['add', '-A'])
    git(['commit', '-q', '-m', `engines ${node}`])
    return git(['rev-parse', 'HEAD']).trim()
  }
  const run = args => spawnSync(process.execPath, [path.join(repoDir, 'functions', 'scripts', 'checkPrev.mjs'), ...args], { encoding: 'utf8' })

  beforeAll(() => {
    tmpRoot = mkdtempSync(path.join(tmpdir(), 'check-prev-'))
    repoDir = path.join(tmpRoot, 'repo')
    mkdirSync(path.join(repoDir, 'functions', 'scripts'), { recursive: true })
    for (const name of ['checkPrev.mjs', 'checkPrevLib.mjs']) {
      cpSync(path.join(SCRIPTS_DIR, name), path.join(repoDir, 'functions', 'scripts', name))
    }
    git(['init', '-q'])
    git(['config', 'user.email', 'check@test.local'])
    git(['config', 'user.name', 'check'])
    git(['config', 'core.autocrlf', 'false'])
    git(['config', 'commit.gpgsign', 'false'])
    node20Sha = commitEngines('20')
    node22Sha = commitEngines('22')
  })

  afterAll(() => {
    rmSync(tmpRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
  })

  it('commit Node 22: exit 0', () => {
    const result = run([node22Sha])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(`engines.node ${node22Sha}: 22`)
    expect(result.stdout).toContain('engines.node HEAD: 22')
  })

  it('commit Node 20: exit 1', () => {
    const result = run([node20Sha])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('dismesso')
  })

  it('sha inesistente: exit 1', () => {
    expect(run([MISSING_SHA]).status).toBe(1)
  })

  it('senza argomento: exit 1', () => {
    expect(run([]).status).toBe(1)
  })
})
