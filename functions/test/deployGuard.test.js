import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { evaluateDeployState } from '../scripts/deployGuardLib.mjs'

const SHA = 'ab315f3c1d2e4f5a6b7c8d9e0f1a2b3c4d5e6f70'
const REMOTE = '  origin/dev\n'
const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts')

describe('evaluateDeployState', () => {
  it('tree pulito: ok, il messaggio contiene sha completo e branch', () => {
    const result = evaluateDeployState({ sha: SHA, branch: 'dev', porcelain: '', remoteBranches: REMOTE })
    expect(result.ok).toBe(true)
    expect(result.message).toBe(`functions deploy da ${SHA} (dev)`)
    expect(result.warnings).toEqual([])
  })

  it('porcelain con file: rifiuta ed elenca i file', () => {
    const porcelain = ' M functions/src/callable/creaCliente.js\n?? functions/src/nuovo.js\n'
    const result = evaluateDeployState({ sha: SHA, branch: 'dev', porcelain, remoteBranches: REMOTE })
    expect(result.ok).toBe(false)
    expect(result.message).toContain('functions/src/callable/creaCliente.js')
    expect(result.message).toContain('functions/src/nuovo.js')
  })

  it('rename: rifiuta e mostra la riga intera', () => {
    const result = evaluateDeployState({ sha: SHA, branch: 'dev', porcelain: 'R  a.js -> b.js\n', remoteBranches: REMOTE })
    expect(result.ok).toBe(false)
    expect(result.message).toContain('R  a.js -> b.js')
  })

  it('porcelain con solo whitespace o CRLF: ok', () => {
    const result = evaluateDeployState({ sha: SHA, branch: 'dev', porcelain: '\r\n  \n\r\n', remoteBranches: REMOTE })
    expect(result.ok).toBe(true)
  })

  it('sha vuoto, undefined o null: rifiuta, anche con tree pulito', () => {
    for (const sha of ['', undefined, null]) {
      const result = evaluateDeployState({ sha, branch: 'dev', porcelain: '', remoteBranches: REMOTE })
      expect(result.ok).toBe(false)
      expect(result.message).toContain('sha')
    }
  })

  it('HEAD scollegato: lo dichiara nel messaggio', () => {
    const result = evaluateDeployState({ sha: SHA, branch: 'HEAD', porcelain: '', remoteBranches: REMOTE })
    expect(result.message).toBe(`functions deploy da ${SHA} (HEAD scollegato)`)
  })

  it('commit non presente su origin: ok con avviso', () => {
    const result = evaluateDeployState({ sha: SHA, branch: 'dev', porcelain: '', remoteBranches: '\n' })
    expect(result.ok).toBe(true)
    expect(result.warnings.join(' ')).toContain('non presente su origin')
  })

  it('file env ignorati: ok con avviso che ne elenca i nomi', () => {
    const result = evaluateDeployState({ sha: SHA, branch: 'dev', porcelain: '', remoteBranches: REMOTE, ignoredEnvFiles: ['.env', '.env.rankex-dev'] })
    expect(result.ok).toBe(true)
    expect(result.warnings.join(' ')).toContain('.env, .env.rankex-dev')
  })
})

describe('deployGuard.mjs (integrazione, repo temporaneo)', () => {
  let tmpRoot
  let repoDir
  let noRepoDir

  const git = args => execFileSync('git', args, { cwd: repoDir, stdio: 'ignore' })
  const runGuard = dir => spawnSync(process.execPath, [path.join(dir, 'functions', 'scripts', 'deployGuard.mjs')], { encoding: 'utf8' })

  beforeAll(() => {
    tmpRoot = mkdtempSync(path.join(tmpdir(), 'deploy-guard-'))
    repoDir = path.join(tmpRoot, 'repo')
    noRepoDir = path.join(tmpRoot, 'norepo')
    for (const dir of [repoDir, noRepoDir]) {
      mkdirSync(path.join(dir, 'functions', 'scripts'), { recursive: true })
      for (const name of readdirSync(SCRIPTS_DIR).filter(file => file.endsWith('.mjs'))) {
        cpSync(path.join(SCRIPTS_DIR, name), path.join(dir, 'functions', 'scripts', name))
      }
    }
    writeFileSync(path.join(repoDir, 'firebase.json'), '{}\n')
    git(['init', '-q'])
    git(['config', 'user.email', 'guard@test.local'])
    git(['config', 'user.name', 'guard'])
    git(['config', 'core.autocrlf', 'false'])
    git(['config', 'commit.gpgsign', 'false'])
    git(['add', '-A'])
    git(['commit', '-q', '-m', 'init'])
  })

  afterAll(() => {
    rmSync(tmpRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
  })

  it('tree pulito: exit 0 e stampa lo sha', () => {
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, encoding: 'utf8' }).trim()
    const result = runGuard(repoDir)
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(`functions deploy da ${sha}`)
  })

  it('file untracked in functions/: exit 1 ed elenca il file', () => {
    const probe = path.join(repoDir, 'functions', 'probe.txt')
    writeFileSync(probe, 'x')
    const result = runGuard(repoDir)
    rmSync(probe)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('probe.txt')
  })

  it('firebase.json modificato: exit 1', () => {
    const file = path.join(repoDir, 'firebase.json')
    writeFileSync(file, '{"changed":true}\n')
    const result = runGuard(repoDir)
    writeFileSync(file, '{}\n')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('firebase.json')
  })

  it('fuori da un repository: exit diverso da 0', () => {
    const result = runGuard(noRepoDir)
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Deploy rifiutato')
  })
})
