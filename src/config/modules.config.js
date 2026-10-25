/**
 * Configurazione moduli di dominio RankEX.
 * Fonte di verità per terminologie, test fissi e comportamento per moduleType.
 */

import { calcAge } from '../utils/validation'
import { isDev }   from '../utils/env'

// ── Moduli ────────────────────────────────────────────────────────────────────

export const MODULES = {
  PERSONAL_TRAINING: 'personal_training',
  SOCCER_ACADEMY:    'soccer_academy',
  LIPEDEMA:          'lipedema',
}

// ── Etichette modulo ──────────────────────────────────────────────────────────
// Unica fonte per select e badge dell'area admin/org (prima duplicata in 6 file).
// shortLabel: dove lo spazio è poco (StatCard di OrgDashboard).

export const MODULE_OPTIONS = [
  { value: MODULES.PERSONAL_TRAINING, label: 'Personal Training', shortLabel: 'PT' },
  { value: MODULES.SOCCER_ACADEMY,    label: 'Soccer Academy',    shortLabel: 'Soccer' },
  { value: MODULES.LIPEDEMA,          label: 'Lipedema Edition',  shortLabel: 'Lipedema' },
]

// Varianti di terminologia selezionabili per modulo (CreateOrgForm, OrgDetailView).
// La prima è il default quando si sceglie o si cambia il modulo.
export const TERMINOLOGY_VARIANTS_BY_MODULE = {
  [MODULES.PERSONAL_TRAINING]: [
    { value: 'pt',  label: 'PT — Trainer / Cliente' },
    { value: 'gym', label: 'GYM — Personal Trainer / Membro' },
  ],
  [MODULES.SOCCER_ACADEMY]: [
    { value: 'soccer', label: 'Soccer — Coach / Allievo' },
  ],
  [MODULES.LIPEDEMA]: [
    { value: 'lipedema', label: 'Lipedema — Professionista / Paziente' },
  ],
}

// ── Capability per modulo ─────────────────────────────────────────────────────
// Ogni flag è dichiarato per ogni modulo, mai ricavato per negazione da un altro
// modulo (ADR-007): un modulo nuovo non eredita in silenzio il comportamento PT.
// Copia server (sottoinsieme): functions/src/shared/modules.js — se cambi un flag
// presente in entrambe, aggiorna tutte e due (test di parità in src/__tests__/parity).

export const CAPABILITY_KEYS = [
  'hasRank',
  'hasGamification',     // XP, livelli, streak, Monete, badge
  'hasPercentileTests',  // campionamenti[] / stats
  'hasAssessments',      // valutazioni (ADR-009)
  'hasCategories',       // categorie PT health/active/athlete
  'hasPlayerRoles',      // ruoli soccer
  'hasProfileTypes',     // tests_only / bia_only / complete + upgrade
  'hasBia',
  'hasGoals',
  'hasGroupRanking',     // Classifica / Campioni / Confronto / Analisi
  'hasWearable',
  'hasClientLogin',      // account Auth del cliente (ADR-010)
]

export const MODULE_CAPABILITIES = {
  [MODULES.PERSONAL_TRAINING]: {
    hasRank: true,  hasGamification: true,  hasPercentileTests: true,  hasAssessments: false,
    hasCategories: true,  hasPlayerRoles: false, hasProfileTypes: true,  hasBia: true,
    hasGoals: true,  hasGroupRanking: true,  hasWearable: true,  hasClientLogin: true,
  },
  [MODULES.SOCCER_ACADEMY]: {
    hasRank: true,  hasGamification: true,  hasPercentileTests: true,  hasAssessments: false,
    hasCategories: false, hasPlayerRoles: true,  hasProfileTypes: false, hasBia: false,
    hasGoals: true,  hasGroupRanking: true,  hasWearable: true,  hasClientLogin: true,
  },
  [MODULES.LIPEDEMA]: {
    hasRank: false, hasGamification: false, hasPercentileTests: false, hasAssessments: true,
    hasCategories: false, hasPlayerRoles: false, hasProfileTypes: false, hasBia: true,
    hasGoals: false, hasGroupRanking: false, hasWearable: false, hasClientLogin: false,
  },
}

// Modulo sconosciuto: nessuna capability. Al peggio una feature manca, invece di
// comparire dove non deve (ADR-007 §2).
export const RESTRICTED_CAPABILITIES = Object.freeze(
  Object.fromEntries(CAPABILITY_KEYS.map(key => [key, false]))
)

// Moduli i cui dati cliente non sono convertibili da/verso gli altri moduli:
// il cambio di modulo è bloccato se l'org ha già clienti (ADR-015 §6). Stessa
// regola in firestore.rules → isAllowedModuleChange.
const MODULES_WITH_INCOMPATIBLE_DATA = [MODULES.LIPEDEMA]

// ── Terminologie ──────────────────────────────────────────────────────────────
// Ogni variante mappa i concetti generici al termine di dominio corretto.
//
// Concordanza grammaticale (BUG-002): i termini cambiano genere da un modulo
// all'altro ("la sessione" / "l'appuntamento"), quindi le frasi non si possono
// comporre con un aggettivo fisso. Ogni variante dichiara, oltre ai nomi:
//   clientGender / sessionGender / groupGender
//                                → 'm' | 'f', per nuovo/a, nessun/a, chiuso/a,
//                                  creati/e… via byClientGender / bySessionGender
//                                  / byGroupGender
//   theClient, theClients, theSession, theSessions, theAthletes, theGroup
//                                → il termine minuscolo con l'articolo
//                                  determinativo già giusto (il/l'/la/i/gli/le)
//   toTheClients, toTheGroups    → con la preposizione "a" articolata (ai/agli/alle)
//   thisGroup, inTheGroup, ofTheGroup, toTheGroup, fromTheGroup
//                                → questo/a, nel/nella, del/della, al/alla, dal/dalla
//   athlete / athletes           → chi viene allenato nei testi sportivi già
//                                  esistenti (tab "Atleta", gruppi): "Atleta"
//                                  nei moduli con gamification, il paziente in
//                                  lipedema
//   trainers                     → plurale di trainer (contatori del team)
// Le forme sono scritte per esteso invece di essere derivate da regole: i
// termini sono pochi e così ogni frase si legge direttamente qui.

export const TERMINOLOGY_KEYS = [
  'trainer', 'trainers', 'client', 'clients', 'group', 'groups', 'session', 'sessions',
  'athlete', 'athletes', 'clientGender', 'sessionGender', 'groupGender',
  'theClient', 'theClients', 'toTheClients', 'theSession', 'theSessions', 'theAthletes',
  'theGroup', 'thisGroup', 'inTheGroup', 'ofTheGroup', 'toTheGroup', 'fromTheGroup', 'toTheGroups',
]

export const TERMINOLOGIES = {
  personal_training: {
    trainer:   'Trainer',
    trainers:  'Trainer',
    client:    'Cliente',
    clients:   'Clienti',
    group:     'Gruppo',
    groups:    'Gruppi',
    session:   'Sessione',
    sessions:  'Sessioni',
    athlete:   'Atleta',
    athletes:  'Atleti',
    clientGender:  'm',
    sessionGender: 'f',
    theClient:     'il cliente',
    theClients:    'i clienti',
    toTheClients:  'ai clienti',
    theSession:    'la sessione',
    theSessions:   'le sessioni',
    theAthletes:   'gli atleti',
    groupGender:   'm',
    theGroup:      'il gruppo',
    thisGroup:     'questo gruppo',
    inTheGroup:    'nel gruppo',
    ofTheGroup:    'del gruppo',
    toTheGroup:    'al gruppo',
    fromTheGroup:  'dal gruppo',
    toTheGroups:   'ai gruppi',
  },
  gym: {
    trainer:  'Personal Trainer',
    trainers: 'Personal Trainer',
    client:   'Membro',
    clients:  'Membri',
    group:    'Classe',
    groups:   'Classi',
    session:  'Allenamento',
    sessions: 'Allenamenti',
    athlete:  'Atleta',
    athletes: 'Atleti',
    clientGender:  'm',
    sessionGender: 'm',
    theClient:     'il membro',
    theClients:    'i membri',
    toTheClients:  'ai membri',
    theSession:    "l'allenamento",
    theSessions:   'gli allenamenti',
    theAthletes:   'gli atleti',
    groupGender:   'f',
    theGroup:      'la classe',
    thisGroup:     'questa classe',
    inTheGroup:    'nella classe',
    ofTheGroup:    'della classe',
    toTheGroup:    'alla classe',
    fromTheGroup:  'dalla classe',
    toTheGroups:   'alle classi',
  },
  soccer_academy: {
    trainer:  'Coach',
    trainers: 'Coach',
    client:   'Allievo',
    clients:  'Allievi',
    group:    'Squadra',
    groups:   'Squadre',
    session:  'Allenamento',
    sessions: 'Allenamenti',
    athlete:  'Atleta',
    athletes: 'Atleti',
    clientGender:  'm',
    sessionGender: 'm',
    theClient:     "l'allievo",
    theClients:    'gli allievi',
    toTheClients:  'agli allievi',
    theSession:    "l'allenamento",
    theSessions:   'gli allenamenti',
    theAthletes:   'gli atleti',
    groupGender:   'f',
    theGroup:      'la squadra',
    thisGroup:     'questa squadra',
    inTheGroup:    'nella squadra',
    ofTheGroup:    'della squadra',
    toTheGroup:    'alla squadra',
    fromTheGroup:  'dalla squadra',
    toTheGroups:   'alle squadre',
  },
  lipedema: {
    trainer:     'Professionista',
    trainers:    'Professionisti',
    client:      'Paziente',
    clients:     'Pazienti',
    group:       'Gruppo',
    groups:      'Gruppi',
    session:     'Appuntamento',
    sessions:    'Appuntamenti',
    athlete:     'Paziente',
    athletes:    'Pazienti',
    clientGender:  'm',
    sessionGender: 'm',
    theClient:     'il paziente',
    theClients:    'i pazienti',
    toTheClients:  'ai pazienti',
    theSession:    "l'appuntamento",
    theSessions:   'gli appuntamenti',
    theAthletes:   'i pazienti',
    groupGender:   'm',
    theGroup:      'il gruppo',
    thisGroup:     'questo gruppo',
    inTheGroup:    'nel gruppo',
    ofTheGroup:    'del gruppo',
    toTheGroup:    'al gruppo',
    fromTheGroup:  'dal gruppo',
    toTheGroups:   'ai gruppi',
    // Solo il record dei test (STORY-033), mai uno slot di calendario (ADR-015 §5)
    assessment:  'Valutazione',
    assessments: 'Valutazioni',
  },
}

// Fallback quando l'org non è caricata: risolto una volta in TrainerProvider; i
// componenti montati anche nell'area cliente (senza provider) lo usano come default
export const DEFAULT_TERMINOLOGY = TERMINOLOGIES.personal_training

/**
 * Sceglie la forma maschile o femminile secondo il genere di un termine.
 * @example byGender(t.sessionGender, 'Nuovo', 'Nuova') + ' ' + t.session.toLowerCase()
 * @param {'m'|'f'} gender — clientGender / sessionGender della terminologia
 * @param {string} masculine
 * @param {string} feminine
 */
export function byGender(gender, masculine, feminine) {
  return gender === 'f' ? feminine : masculine
}

/** byGender sul genere di session/sessions: bySessionGender(t, 'Nuovo', 'Nuova') */
export function bySessionGender(terminology, masculine, feminine) {
  return byGender(terminology.sessionGender, masculine, feminine)
}

/** byGender sul genere di client/clients: byClientGender(t, 'Nessun', 'Nessuna') */
export function byClientGender(terminology, masculine, feminine) {
  return byGender(terminology.clientGender, masculine, feminine)
}

/** byGender sul genere di group/groups: byGroupGender(t, 'il primo', 'la prima') */
export function byGroupGender(terminology, masculine, feminine) {
  return byGender(terminology.groupGender, masculine, feminine)
}

/** Prima lettera maiuscola, per le forme con articolo a inizio frase ("L'appuntamento…"). */
export function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

// ── Ruoli dei membri dell'org ─────────────────────────────────────────────────
// Il ruolo `trainer` prende il nome del modulo (Trainer / Coach / Professionista…).

/** Opzioni del select ruolo (Team, nuovo membro). */
export function getMemberRoleOptions(terminology) {
  return [
    { value: 'trainer',        label: terminology.trainer },
    { value: 'staff_readonly', label: 'Solo lettura' },
    { value: 'org_admin',      label: 'Admin' },
  ]
}

/** Etichette del badge autore nelle note (cliente e gruppo). */
export function getNoteRoleLabels(terminology) {
  return {
    trainer:        terminology.trainer,
    org_admin:      'Admin',
    staff_readonly: 'Staff',
    client:         terminology.athlete,
  }
}

// ── Ruoli soccer (etichetta visiva) ───────────────────────────────────────────

export const PLAYER_ROLES = [
  { value: 'goalkeeper', label: 'Portiere' },
  { value: 'defender',   label: 'Difensore' },
  { value: 'midfielder', label: 'Centrocampista' },
  { value: 'forward',    label: 'Attaccante' },
]

// ── Test fissi soccer ─────────────────────────────────────────────────────────
// Per personal_training i test dipendono dalla categoria del cliente.
// Per soccer i test dipendono dalla fascia d'età (categoria).

export const SOCCER_FIXED_TESTS = {
  soccer_youth:  ['single_leg_stance', 'sprint_10m', 'shuttle_run_30m', 'standing_long_jump', 't_test_mini'],
  soccer_junior: ['y_balance_anterior', 'sprint_20m', 't_test_soccer_junior', 'standing_long_jump', 'six_minute_run'],
  soccer:        ['y_balance', 'standing_long_jump', '505_cod_agility', 'sprint_20m', 'beep_test'],
}

// ── Fasce d'età soccer ────────────────────────────────────────────────────────
// categoria 'soccer_youth'  → Pulcini    (7-9 anni)
// categoria 'soccer_junior' → Esordienti (10-13 anni)
// categoria 'soccer'        → Senior     (14+ anni)

export const SOCCER_AGE_GROUPS = [
  { value: 'soccer_youth',  label: 'Pulcini',    desc: 'Atleti 7-9 anni' },
  { value: 'soccer_junior', label: 'Esordienti', desc: 'Atleti 10-13 anni' },
  { value: 'soccer',        label: 'Senior',     desc: 'Atleti 14+ anni' },
]

// ── Helper: fascia d'età soccer da età anagrafica ─────────────────────────────

/**
 * Deriva la categoria soccer dall'età del cliente.
 * @param {number} eta — età in anni
 * @returns {'soccer_youth'|'soccer_junior'|'soccer'}
 */
export function getCategoriaFromEta(eta) {
  const age = Number(eta)
  if (isNaN(age) || age < 10) return 'soccer_youth'
  if (age < 14)               return 'soccer_junior'
  return 'soccer'
}

/**
 * Categoria con cui valutare il cliente oggi.
 * Per il soccer la fascia dipende dall'età attuale, non da quella alla creazione:
 * `client.categoria` veniva calcolata una volta sola, e un Pulcino che compiva 10
 * anni restava valutato con test e tabelle 7-9. Speculare a
 * functions/src/shared/soccer.js → resolveCategoria (che la salva a ogni campionamento).
 */
export function resolveCategoria(client) {
  const categoria = client?.categoria
  if (!categoria?.startsWith('soccer')) return categoria
  const age = calcAge(client.dataNascita) ?? client.eta
  return age === null || age === undefined ? categoria : getCategoriaFromEta(age)
}

// ── Helper: ottieni terminologia ──────────────────────────────────────────────

/**
 * @param {string} moduleType — 'personal_training' | 'soccer_academy' | 'lipedema'
 * @param {string} [variant]  — 'gym' per GYM variant di personal_training
 * @returns {object} terminologia
 */
export function getTerminology(moduleType, variant) {
  if (variant && TERMINOLOGIES[variant]) return TERMINOLOGIES[variant]
  return TERMINOLOGIES[moduleType] ?? DEFAULT_TERMINOLOGY
}

/**
 * Modulo con capability esplicite. Un moduleType sconosciuto (o assente) riceve
 * RESTRICTED_CAPABILITIES, mai quelle PT: il caso legacy `moduleType` assente è
 * mappato su PT esplicitamente dove l'org entra nell'app (TrainerView,
 * OrgAdminView, OrgDetailView), non qui.
 * `isSoccer` resta solo per le ramificazioni davvero soccer-specifiche (fasce,
 * ruoli, branding PDF) — non usare `!isSoccer` per dire "è PT".
 * @param {string} moduleType
 * @returns {object} modulo config
 */
export function getModule(moduleType) {
  const capabilities = MODULE_CAPABILITIES[moduleType]
  if (!capabilities && isDev) {
    console.warn(`[modules.config] moduleType sconosciuto: ${moduleType} — nessuna capability attiva`)
  }
  return {
    moduleType,
    ...(capabilities ?? RESTRICTED_CAPABILITIES),
    isSoccer:   moduleType === MODULES.SOCCER_ACADEMY,
    fixedTests: moduleType === MODULES.SOCCER_ACADEMY ? SOCCER_FIXED_TESTS : null,
  }
}

/**
 * Etichetta del modulo per l'area admin/org. `moduleType` assente = org legacy
 * PT (stessa convenzione di TrainerView/OrgAdminView); un valore sconosciuto
 * viene mostrato così com'è, non travestito da PT.
 * @param {string|null|undefined} moduleType
 * @param {{ short?: boolean }} [options]
 */
export function getModuleLabel(moduleType, { short = false } = {}) {
  const option = MODULE_OPTIONS.find(opt => opt.value === (moduleType ?? MODULES.PERSONAL_TRAINING))
  if (!option) return moduleType
  return short ? option.shortLabel : option.label
}

/**
 * Il cambio di modulo da o verso un modulo con dati non convertibili (lipedema)
 * è permesso solo se l'org non ha clienti. PT ↔ soccer resta sempre permesso.
 * Speculare alla rule isAllowedModuleChange in firestore.rules.
 * @param {string|null|undefined} fromModule — `null` = PT legacy
 * @param {string} toModule
 * @param {number} clientCount
 */
export function isModuleChangeAllowed(fromModule, toModule, clientCount) {
  const from = fromModule ?? MODULES.PERSONAL_TRAINING
  if (from === toModule) return true
  const touchesIncompatible = MODULES_WITH_INCOMPATIBLE_DATA.includes(from) ||
    MODULES_WITH_INCOMPATIBLE_DATA.includes(toModule)
  return !touchesIncompatible || clientCount === 0
}
