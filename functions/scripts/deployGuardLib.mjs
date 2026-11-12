// Logica del guard di deploy delle Cloud Functions (vedi deployGuard.mjs).
// Perimetro controllato: functions/ + firebase.json alla radice (governa source/ignore/predeploy).
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'

const DETACHED_HEAD = 'HEAD'
const ENV_FILE_PATTERN = /^\.env(\..+)?$/
const GUARD_PATHSPEC = ['.', '../firebase.json']

export function evaluateDeployState({ sha, branch, porcelain, remoteBranches, ignoredEnvFiles }) {
  if (!sha) {
    return { ok: false, message: 'Deploy rifiutato: impossibile leggere lo sha di HEAD (git non disponibile o cartella non in un repository).', warnings: [] }
  }
  const dirtyLines = (porcelain ?? '').split(/\r?\n/).filter(line => line.trim() !== '')
  if (dirtyLines.length > 0) {
    return {
      ok: false,
      message:
        'Deploy rifiutato: working tree di functions/ (o firebase.json) non pulito. Committa o scarta queste modifiche prima del deploy:\n' +
        dirtyLines.map(line => `  ${line}`).join('\n'),
      warnings: [],
    }
  }
  const warnings = []
  if (ignoredEnvFiles?.length > 0) {
    warnings.push(
      `AVVISO: file env ignorati da git, caricati dal deploy e non verificabili dal guard: ${ignoredEnvFiles.join(', ')}`,
    )
  }
  if (!remoteBranches || remoteBranches.trim() === '') {
    warnings.push('AVVISO: commit non presente su origin: la riga del CHANGELOG punterebbe a uno sha non pushato.')
  }
  const branchLabel = !branch || branch === DETACHED_HEAD ? 'HEAD scollegato' : branch
  return { ok: true, message: `functions deploy da ${sha} (${branchLabel})`, warnings }
}

function runGit(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
}

function isGitIgnored(cwd, file) {
  try {
    execFileSync('git', ['check-ignore', '-q', '--', file], { cwd, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Solo esistenza dei file env: il contenuto non viene mai letto né stampato.
export function collectDeployState(cwd) {
  const envFiles = readdirSync(cwd).filter(name => ENV_FILE_PATTERN.test(name))
  return {
    sha:             runGit(cwd, ['rev-parse', 'HEAD']).trim(),
    branch:          runGit(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']).trim(),
    // porcelain non va trimmato: lo spazio iniziale di " M file" è significativo
    porcelain:       runGit(cwd, ['status', '--porcelain', '--untracked-files=all', '--ignore-submodules=none', '--', ...GUARD_PATHSPEC]),
    remoteBranches:  runGit(cwd, ['branch', '-r', '--contains', 'HEAD']),
    ignoredEnvFiles: envFiles.filter(name => isGitIgnored(cwd, name)),
  }
}
