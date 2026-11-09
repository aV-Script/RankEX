/**
 * QA automatica contro rankex-dev (STORY-041): org fisse, account e guardie.
 * Usato dallo script di seed, dal setup/teardown Playwright e dagli spec.
 *
 * Tutto qui gira SOLO contro rankex-dev: ogni ingresso chiama una guardia e si
 * ferma se il progetto o l'host sono altri (fitquest-60a09 compreso).
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname, resolve }   from 'path'
import { fileURLToPath }            from 'url'

export const DEV_PROJECT_ID = 'rankex-dev'
export const QA_BASE_URL    = 'https://rankex-app-dev.web.app'
const QA_HOSTNAME           = 'rankex-app-dev.web.app'

/** Prefisso dei dati creati dagli spec: il teardown cancella solo questi */
export const E2E_PREFIX = 'E2E-'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const ENV_TEST_PATH = join(ROOT, '.env.test')
export const AUTH_DIR      = join(ROOT, 'e2e', '.auth', 'qa-dev')

const ROLE_SLUG = { org_admin: 'admin', trainer: 'trainer', staff_readonly: 'staff' }

/** Prefisso email riservato alla suite: il seed non tocca account fuori da qui */
export const QA_EMAIL_PREFIX = 'qadev.'

/** Le 3 org fisse, una per modulo, con un cliente/paziente di base */
export const QA_ORGS = {
  pt: {
    orgId: 'qa-pt', name: 'QA PT', moduleType: 'personal_training', terminologyVariant: 'pt',
    baseClient: {
      name: 'QA Cliente PT', dataNascita: '1990-05-15', sesso: 'M', peso: 75, altezza: 178,
      categoria: 'active', profileType: 'complete', email: 'qadev.pt.cliente@test.rankex',
    },
  },
  soccer: {
    orgId: 'qa-soccer', name: 'QA Soccer', moduleType: 'soccer_academy', terminologyVariant: 'soccer',
    baseClient: {
      name: 'QA Allievo Senior', dataNascita: '2010-03-10', sesso: 'M', peso: 60, altezza: 170,
      categoria: 'soccer', ruolo: 'midfielder', profileType: 'tests_only', email: 'qadev.soccer.allievo@test.rankex',
    },
  },
  lipedema: {
    orgId: 'qa-lipedema', name: 'QA Lipedema', moduleType: 'lipedema', terminologyVariant: 'lipedema',
    baseClient: {
      name: 'QA Paziente', dataNascita: '1985-07-01', sesso: 'F', peso: 74, altezza: 166,
      privacyNotice: { informativaVersion: 'QA-1.0', deliveredAt: '2026-11-01' },
    },
  },
}

/**
 * Utenti per ruolo di un'org: email deterministiche, password unica da .env.test.
 * Prefisso "qadev." riservato a questa suite: "qa.*" è già usato dagli account della
 * QA manuale (es. qa.lipedema.trainer in demo-lipedema)
 */
export function qaUsers(moduleKey) {
  return Object.entries(ROLE_SLUG).map(([role, slug]) => ({
    role,
    key:   `${moduleKey}-${slug}`,
    email: `${QA_EMAIL_PREFIX}${moduleKey}.${slug}@test.rankex`,
    name:  `QA ${moduleKey} ${slug}`,
  }))
}

export function authStatePath(userKey) {
  return join(AUTH_DIR, `${userKey}.json`)
}

// ── Guardie ───────────────────────────────────────────────────────────────────

/** Il service account deve essere di rankex-dev: rifiuta qualsiasi altro progetto */
export function loadDevServiceAccount(path) {
  if (!path) throw new Error('Service account mancante: imposta QA_DEV_SERVICE_ACCOUNT in .env.test o passalo come argomento')
  const fullPath = resolve(ROOT, path)
  if (!existsSync(fullPath)) throw new Error(`Service account non trovato: ${fullPath}`)
  const serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'))
  if (serviceAccount.project_id !== DEV_PROJECT_ID) {
    throw new Error(`Rifiutato: il service account è di "${serviceAccount.project_id}", non di ${DEV_PROJECT_ID}`)
  }
  // project_id è un campo libero del JSON: anche l'identità deve essere di rankex-dev
  if (!String(serviceAccount.client_email ?? '').endsWith(`@${DEV_PROJECT_ID}.iam.gserviceaccount.com`)) {
    throw new Error(`Rifiutato: ${serviceAccount.client_email} non è un service account di ${DEV_PROJECT_ID}`)
  }
  return serviceAccount
}

/** Il Firestore Admin effettivamente inizializzato deve essere quello di rankex-dev */
export function assertDevFirestore(db) {
  if (db.projectId !== DEV_PROJECT_ID) {
    throw new Error(`Rifiutato: Firestore Admin punta a "${db.projectId}", non a ${DEV_PROJECT_ID}`)
  }
}

/** .env.development deve puntare a rankex-dev (il seed usa la sua API key per le callable) */
export function loadDevClientEnv() {
  const env = parseEnvFile(join(ROOT, '.env.development'))
  if (env.VITE_FIREBASE_PROJECT_ID !== DEV_PROJECT_ID) {
    throw new Error(`Rifiutato: .env.development punta a "${env.VITE_FIREBASE_PROJECT_ID}", non a ${DEV_PROJECT_ID}`)
  }
  return env
}

/** L'host della suite è fisso: qualsiasi altro URL viene rifiutato */
export function assertQaBaseUrl(url) {
  if (new URL(url).hostname !== QA_HOSTNAME) {
    throw new Error(`Rifiutato: la QA automatica gira solo su ${QA_BASE_URL}, non su ${url}`)
  }
}

export function readEnvTest() {
  return parseEnvFile(ENV_TEST_PATH)
}

function parseEnvFile(path) {
  if (!existsSync(path)) return {}
  return Object.fromEntries(
    readFileSync(path, 'utf8').split(/\r?\n/)
      .map(line => line.match(/^([^#=]+)=(.*)$/)).filter(Boolean)
      .map(([, key, value]) => [key.trim(), value.trim()]),
  )
}
