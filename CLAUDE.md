# RankEX — Documento Tecnico

## Stack
- React 18 + Vite
- Firebase JS SDK 12 (Auth + Firestore + Hosting multisito) — `@grpc/grpc-js` forzato a
  1.14.6 via `overrides` in package.json: anche firebase 13 lo fissa a ~1.9, vulnerabile
- Tailwind CSS v4
- React Router v6
- Recharts (grafici)

---

## Prodotto

RankEX è una piattaforma SaaS multi-tenant per il tracking
delle performance atletiche. Supporta tre moduli di dominio
con terminologie, test e comportamenti UI diversi.

### Moduli

**personal_training** — PT e GYM
- Categorie cliente: `health` / `active` / `athlete`
- Test: 5 per categoria (13 totali, alcuni condivisi)
- Terminologia PT:  Trainer / Cliente / Gruppo / Sessione
- Terminologia GYM: Personal Trainer / Membro / Classe / Allenamento
- Profili: `tests_only` / `bia_only` / `complete`

**soccer_academy** — accademie calcistiche
- Fasce d'età: 3 gruppi con test differenziati
  - `soccer_youth`  → Pulcini    (7-9 anni)
  - `soccer_junior` → Esordienti (10-13 anni)
  - `soccer`        → Senior     (14+ anni)
- Ruolo è solo etichetta visiva: `goalkeeper` / `defender` / `midfielder` / `forward`
- Test per fascia (definiti in `SOCCER_FIXED_TESTS` dict in `config/modules.config.js`):
  - Pulcini (7-9):      `single_leg_stance`, `sprint_10m`, `shuttle_run_30m`, `standing_long_jump`, `t_test_mini`
  - Esordienti (10-13): `y_balance_anterior`, `sprint_20m`, `t_test_soccer_junior`, `standing_long_jump`, `six_minute_run`
  - Senior (14+):       `y_balance`, `standing_long_jump`, `505_cod_agility`, `sprint_20m`, `beep_test`
- Terminologia: Coach / Allievo / Squadra / Allenamento
- Profili: `tests_only` (unico)
- `client.categoria` = `'soccer_youth'` | `'soccer_junior'` | `'soccer'` — chiave interna
  per `getTestsForCategoria`. Non è mostrata in UI (il ruolo è il badge visivo).
  Badge fascia: Pulcini → giallo `#facc15`, Esordienti → viola `#a78bfa`, Senior → nessun badge.
- Configurazione fasce: `SOCCER_AGE_GROUPS` in `config/modules.config.js`
- `categoria` derivata automaticamente da `eta` via `getCategoriaFromEta(eta)` in `config/modules.config.js`
  (età < 10 → `soccer_youth`, 10-13 → `soccer_junior`, 14+ → `soccer`)
  e **ricalcolata a ogni campionamento** dall'età attuale (`resolveCategoria`, client in
  `config/modules.config.js` + server in `functions/src/shared/soccer.js`, che la salva):
  prima restava quella della creazione. Riallineamento dati: `scripts/sync-fasce-soccer.mjs`.

**lipedema** — RankEX Lipedema Edition (EPIC-010, in sviluppo da ott 2026)
- Nessun rank, percentile né gamification (XP, livelli, badge, Monete, streak, obiettivi):
  solo storicizzazione dei risultati di 5 test (2MWT, 30s Sit-to-Stand, Handgrip,
  Handheld Dynamometry quadricipite, One-Leg Standing) — protocolli in `lipidemia/*.docx`
  (non tracciati), decisioni in `docs/DECISIONS.md` → ADR-006…015
- Terminologia: Professionista / Paziente / Gruppo / Appuntamento / Valutazione
- Paziente **senza account**: `creaCliente` non crea Auth né `/users/{uid}`, email
  facoltativa, nessun campo di gamification sul doc; il paziente non accede all'app (v1)
- Tutto il modulo è dato sanitario (art. 9(2)(h) GDPR): l'audit `CLIENT_CREATED` non
  contiene il nome
- Fuori da dev (prod/UAT) `lipedema` non è selezionabile da super_admin né in `CreateOrgForm` né in
  `OrgDetailView`: `IS_LIPEDEMA_SELECTABLE` / `getSelectableModuleOptions` in `config/modules.config.js`.
  Solo UI (le rules non lo impediscono); si toglie quando STORY-029 (DPA + informativa) è chiusa
- Cambio di `moduleType` da/verso `lipedema` bloccato se l'org ha clienti
  (`isAllowedModuleChange` in `firestore.rules` + `OrgDetailView`)
- Informativa: `client.privacyNotice` scritto solo via `registraInformativaPaziente` (o dal
  wizard via `creaCliente`); senza, `aggiungiValutazione` e `salvaBia` sono rifiutati
- Valutazioni: subcollection `clients/{id}/assessments` immutabile (rules: lettura membri org,
  scrittura negata), callable `aggiungiValutazione` (con correzione atomica `supersedes`) e
  `annullaValutazione`. Risultati, validazione e comparabilità calcolati nel blocco CORE di
  `functions/src/shared/lipedema.js`, identico a `src/utils/lipedema.js` (test di parità; il
  file server non deve importare nulla). UI per test in `features/assessments/assessmentRegistry.js`.
  Implementati tutti e 5 i test (logica bilaterale generica per Handgrip, HHD e OLS, ADR-016/017/018;
  parti comuni dei form in `BilateralFormParts`, `useBilateralTrials`, `bilateralFormModel`). Guida
  dei test in `config/lipedemaGuide.config.js` (istruzioni verbali testuali dai docx) e
  `features/trainer/test-guide/LipedemaTestGuide.jsx`; trend e PDF: STORY-039-040
- Sequenza di visita (STORY-042): solo navigazione client tra i form (`assessmentVisit.js`, stato in
  `ClientDashboard`). Nessun documento "visita": ogni test è una valutazione a sé, salvata alla conferma.
  `handleAddAssessment` restituisce `{ refreshed }`, la rilettura dello storico da cui si precompila il test successivo

### Capability per modulo
`getModule(moduleType)` (`config/modules.config.js`) restituisce flag espliciti per ogni
modulo (`hasRank`, `hasGamification`, `hasPercentileTests`, `hasBia`, `hasGoals`,
`hasClientLogin`, `hasCategories`, `hasPlayerRoles`, `hasProfileTypes`, `hasGroupRanking`,
`hasWearable`, `hasAssessments`). Un `moduleType` sconosciuto riceve tutto `false`; il
legacy `null` va mappato a PT nei punti di ingresso (`TrainerView`, `OrgAdminView`), non
dentro `getModule`. **Ramificare sempre sulle capability**, mai su `!isSoccer` per dire
"è PT": `isSoccer` resta solo per ciò che è davvero soccer (fasce, ruoli).
Lato server le callable leggono il modulo dall'org con `getOrgCapabilities(db, orgId)`
(`functions/src/shared/orgModule.js`, flag in `shared/modules.js` — copia speculare
coperta da `clientServerParity.test.js`) e rifiutano XP/campionamento/obiettivi/avatar
per i moduli senza gamification; `chiudiSessione` e `salvaBia` non danno XP.

### Profili cliente (`profileType`)
```
tests_only → solo test, ha rank                     (tutti i moduli)
bia_only   → solo BIA, no rank                      (solo PT)
complete   → test + BIA, rank calcolato solo dai test (solo PT)
```

---

## Architettura account

### Tipo account
Tutti gli utenti appartengono a una organizzazione.
Un personal trainer solo = organizzazione con 1 membro.

### Ruoli utente
```
super_admin      → visibilità globale, customer service
org_admin        → gestione completa della propria org
trainer          → lettura + scrittura operativa
staff_readonly   → solo lettura
client           → solo i propri dati
```

### Documento utente in Firestore
Tutti gli utenti con accesso hanno un documento `/users/{uid}` (i pazienti del modulo
`lipedema` non ne hanno: nessun account, `clientAuthUid: null`), creato sempre dall'Admin SDK
(`creaCliente` / `creaMembroTeam`: le rules non permettono di crearlo dal client).
I client lo hanno con `role: 'client'`, ma i loro dati operativi (stats,
campionamenti, ecc.) stanno in
`/organizations/{orgId}/clients/{clientId}`.
Il documento `/users/{uid}` del client contiene:
`{ role: 'client', orgId, clientId, trainerId, mustChangePassword }`.

---

## Struttura Firestore

```
users/{uid}
  role, orgId, clientId, moduleType,
  terminologyVariant, mustChangePassword

organizations/{orgId}
  name, moduleType, terminologyVariant,
  plan, ownerId, status, createdAt,
  memberCount,   // counter atomico — aggiornato via batch in addMember/removeMember
  clientCount    // counter atomico — aggiornato via batch in addClient/deleteClient

  members/{uid}
    role, name, email, joinedAt

  clients/{clientId}
    notes/{noteId}       // thread + commenti — subcollection del cliente
  slots/{slotId}
  groups/{groupId}
  recurrences/{recId}
  notifications/{notId}
  workoutPlans/{planId}

audit_logs/{logId}
  action, uid, email, timestamp,
  userAgent, details, env
  // append-only — solo super_admin legge, mai modificabile

qa_runs/{runId}
  suiteIds, results, counts, runBy, runByEmail, finishedAt
  // storico esecuzioni del runbook manuale — solo super_admin legge/scrive
```

### Path helpers
Tutti i path Firestore passano da `src/firebase/paths.js`:
```js
clientsPath(orgId)            → organizations/{orgId}/clients
slotsPath(orgId)              → organizations/{orgId}/slots
groupsPath(orgId)             → organizations/{orgId}/groups
recurrencesPath(orgId)        → organizations/{orgId}/recurrences
notificationsPath(orgId)      → organizations/{orgId}/notifications
notesPath(orgId, clientId)    → organizations/{orgId}/clients/{clientId}/notes
goalsPath(orgId, clientId)    → organizations/{orgId}/clients/{clientId}/goals
workoutPlansPath(orgId)       → organizations/{orgId}/workoutPlans
```

### Firestore Rules — pattern corretto

`userProfile()` restituisce `{}` se il documento non esiste
(null-safe tramite `let p = get(...); return p == null ? {} : p.data`).

I client leggono `/organizations/{orgId}` tramite `isClientOfOrg(orgId)`:
```js
function isClientOfOrg(orgId) {
  return isAuth() && userProfile().role == 'client' && userProfile().orgId == orgId;
}
```

Org_admin può aggiornare `role` negli `/users/{uid}` dei propri membri
tramite `isOrgAdminForMember(targetUid)` (rule separata nel file).

### Firestore Rules — limiti piano

**Le regole non applicano più i limiti piano (fix sicurezza ott 2026).** I limiti li
applicano solo `creaCliente` / `creaMembroTeam` (`functions/src/shared/plans.js`), e le
regole impediscono al client ogni scrittura che li aggirerebbe:
- `users/{uid}` create → solo `super_admin` (prima un trainer poteva creare un profilo
  `role: 'super_admin'` per un nuovo account Auth)
- `clients/{id}` e `members/{uid}` create → solo `super_admin` (una create diretta
  saltava limite e counter)
- `memberCount` / `clientCount` → nessuna scrittura client (prima ±1 ripetibile
  all'infinito: bastava decrementare per superare il limite)
- `organizations/{orgId}` create/delete → solo `super_admin`

Ogni nuova creazione di utenti/clienti/membri va fatta in una Cloud Function, mai
allargando queste regole. Test: `tests/rules/firestore.rules.test.js`, in CI.

Le regole Firestore **non supportano `if/return`** dentro le funzioni:
usare solo espressioni booleane (`&&`, `||`, ternario).

---

## Piani SaaS

Fonte di verità: `src/config/plans.config.js` — `free`: 1 trainer · 10 clienti; `pro`: 5 trainer · 100 clienti;
`enterprise`: illimitati. I counter `memberCount`/`clientCount` sono mantenuti **atomicamente** dalle Cloud
Functions (Admin SDK) nello stesso batch: `creaMembroTeam`/`rimuoviMembroTeam` → `increment(±1)` su
`org.memberCount`; `creaCliente`/`eliminaCliente` → `increment(±1)` su `org.clientCount`.

**UI — blocchi al limite:** `MembersPage` banner giallo + "AGGIUNGI" disabilitato; `NewClientView` schermata di
blocco invece del wizard; `OrgSettingsPage` piano corrente in sola lettura con i limiti (lo cambia solo
super_admin); `OrgDetailView` (super_admin) barre progresso utilizzo.
Import (nessun alias per `src/`, import relativi): `import { getPlanLimits, isAtTrainerLimit, isAtClientLimit } from '../../config/plans.config'`

## Modelli dati

### Cliente (`clients/{clientId}`)
```js
{
  name, eta, sesso, peso, altezza,
  email, clientAuthUid,
  categoria,       // 'health'|'active'|'athlete'|'soccer'|'soccer_youth'
  profileType,     // 'tests_only'|'bia_only'|'complete'
  ruolo,           // solo soccer: 'goalkeeper'|'defender'|'midfielder'|'forward'
  level, xp, xpNext,
  rank, rankColor, media,
  stats:           {},
  campionamenti:   [],
  log:             [],   // ogni entry: { date, action, xp, ts } — ts: Date.now() usato da XPTrendChart
  sessionsPerWeek,
  biaHistory:      [],
  lastBia:         null,
  misureHistory:   [],   // { date, peso?, altezza? } — storico tab Misure
  badges:          {},   // { [badgeId]: { awardedAt, awardedBy, note? } } — vedi config/badges.config.js
  badgeShowcase:   [],   // fino a 5 badgeId in evidenza sul profilo
  coins:           0,    // Monete negozio avatar — spike EPIC-005, guadagnate solo
                          // per sessione presente (chiudiSessione), vedi Roadmap futura
  avatarPurchased: [],   // avatarId acquistati nel negozio (unlockType: 'purchase')
}
```

### Nota (`clients/{clientId}/notes/{noteId}`)
```js
{ text, authorId, authorName, authorRole /* trainer|org_admin|staff_readonly|client */,
  parentId /* null = thread root | noteId = commento */, createdAt }
```
**Regola:** il client è sempre in sola lettura sulle note — non può creare né commenti né
note proprie (`firestore.rules` limita `create`/`delete` a `canWrite(orgId)`, la Cloud
Function `aggiungiNota` rifiuta esplicitamente `role === 'client'`, e `NotesSection` è
montata `readonly` in `ClientDashboardPage.jsx`). La cancellazione a cascata (root + commenti)
la fa la Cloud Function `eliminaNota`.

### Scheda Allenamento (`workoutPlans/{planId}`)
```js
{ title, description, clientId,
  days: [{ label: 'Giorno 1', exercises: [{ name, sets, reps, restSeconds, notes }] }],  // max 7 giorni
  status: 'active'|'archived',
  targetSessions,     // 1-200 o null — scelte dal trainer
  completedSessions,  // scritto da chiudiSessione — mai dal client
  completedAt,        // scritto da chiudiSessione al raggiungimento di targetSessions
  createdAt, updatedAt }
```
Ogni sessione chiusa con presenza fa avanzare di uno la scheda `active` dell'atleta, nella
stessa transazione di `chiudiSessione`. Raggiunte le `targetSessions` l'atleta riceve
`PLAN_COMPLETION_XP` (100, speculare in `constants/index.js` e
`functions/src/shared/constants.js`) una volta sola, con voce di log e notifica.
`aggiornaSchedaAllenamento` accetta `targetSessions` ma non `completedSessions`/`completedAt`.
Giorno consigliato: `getPlanProgress` in `utils/workoutPlans.js`. L'anteprima XP di
`CloseSessionModal` non include il bonus scheda. Backward compat: vecchi documenti con
`exercises[]` flat normalizzati a `[{ label: 'Giorno 1', exercises }]` lato client. Il client
vede la scheda `active` assegnata a sé in read-only.

### Obiettivo (`clients/{clientId}/goals/{goalId}`)
```js
{ testKey,            // test in ALL_TESTS/TESTS_META
  testLabel,          // denormalizzato dal client alla creazione (il BE non ha label/unit dei test)
  targetPercentile,   // 1-100
  deadline,           // 'YYYY-MM-DD'
  note,               // opzionale
  status,             // 'active' | 'achieved' | 'cancelled'
  createdAt, createdBy, achievedAt, achievedPercentile }
```
`status: 'missed'` **non esiste in Firestore**: è calcolato al volo lato client
(`utils/goals.js` → `isGoalMissed`/`getGoalDisplayStatus`). L'achievement è scritto solo
server-side in `functions/src/callable/salvaCampionamento.js`: se il test dell'obiettivo è tra
quelli appena valutati (`testMeta.categories.includes(categoria)`) e il percentile è
`>= targetPercentile`, marca `achieved` e notifica. Mai calcolato o scritto dal client; il client
legge in sola lettura, non crea né annulla.

### Slot (`slots/{slotId}`)
```js
{
  date, startTime, endTime,
  clientIds:   [],
  groupIds:    [],
  status:      'planned'|'completed'|'skipped',
  attendees:   [],   // presenti — ricevono XP
  absentees:   [],   // assenti — nessun XP
  recurrenceId: null,
  createdAt,
}
```

### Ricorrenza (`recurrences/{recId}`)
```js
{
  clientIds, groupIds,
  days:       [],          // [1,3,5] = Lun/Mer/Ven
  startDate, endDate,
  startTime, endTime,
  status:     'active'|'ended'|'cancelled',
  createdAt,
}
```

### Gruppo (`groups/{groupId}`)
```js
{ name, clientIds: [] }
```

### Notifica (`notifications/{notId}`)
```js
{ clientId, message, date, type, read, readAt, createdAt }
```


Dettagli: docs/ARCHITECTURE-NOTES.md → BIA — singola misurazione (e Modelli dati estesi)

## Struttura cartelle

Versione compatta (primo/secondo livello + file chiave).
Albero completo e cronistoria delle rimozioni: docs/ARCHITECTURE-NOTES.md → Struttura cartelle.

```
src/
├── app/           App.jsx, AppRouter.jsx (routing per ruolo), routes.config.jsx
├── components/
│   ├── common/    ConfirmDialog, DomainGuard (blocco dominio+ruolo), ErrorBoundary/ErrorFallback,
│   │              ChartErrorFallback, LoadingScreen (data-testid="loading"), Pagination, ProtectedRoute,
│   │              ReadonlyBanner/Guard, PrintPickerModal, SessionWarningDialog, Toast
│   ├── layout/    TrainerShell.jsx (usa SOLO AppNav) + trainer-shell/{AppNav, navItems.config.jsx}
│   ├── ui/        index.jsx (Card, Badge, Modal, Input, Button, Field, EmptyState, XPBar...), icons.jsx,
│   │              BadgeMedal, ThemePicker, XPBar, Pentagon
│   └── modals/new-client-wizard/   (steps/StepRuolo.jsx per soccer)
├── config/        modules.config.js, plans.config.js, badges.config.js, avatars.config.js,
│                  themes.config.js, app.config.js, runbook.config.js
├── constants/     index.js (RANKS, CATEGORIE, getTestsForCategoria...), tests.js, formulas.js, bia.js
├── context/       TrainerContext, ReadonlyContext, ThemeContext, ToastContext
├── features/
│   ├── admin/     area super_admin (AdminShell, SuperAdminView, admin-pages/: Dashboard, Orgs, OrgDetailView,
│   │              CreateOrgForm, AdminProfilePage, RunbookPage)
│   ├── auth/      LoginPage, useAuth, useLoginForm, components/
│   ├── bia/       useBia (no args, orgId da useTrainerState), BiaView, bia-view/
│   ├── calendar/  useCalendar, useRecurrences, calendarGroupUtils
│   ├── client/    area cliente: ClientView, useClient (unico onSnapshot), CampionamentoView, ClientDashboard
│   │              (vista trainer), client-view/ (hub pentagono, ClientDashboardPage), client-dashboard/ (sezioni)
│   ├── notification/  NotificationsPanel
│   ├── org/       area org_admin: OrgAdminView, org-pages/ (Dashboard, MembersPage, OrgSettingsPage, CreateMemberForm)
│   └── trainer/   TrainerView, trainer.config.jsx (PAGES), ClientsPage, GroupsPage, TrainerCalendar,
│                  RecurrencesPage, NewClientView, TestGuidePage, ProfilePage + sottocartelle per pagina
├── firebase/      config.js, paths.js (path helpers), services/ (vedi sotto)
├── usecases/      34 wrapper httpsCallable (uno per callable) — zero logica
├── hooks/         useClients(orgId, userId?), useGroups, useNotes, useGoals, useBadges, useNotifications,
│                  useRunbook, useWearable, usePagination, useSessionTimeout, useToast, useFocusTrap...
└── utils/         auditLog, bia, calendarUtils, env, firebaseErrors, gamification, percentile, tables,
                   goals, validation, workoutPlans
```
`firebase/services/`: letture dirette + pochi update a basso rischio. `clients.js` solo letture +
`updateClient` (peso/altezza, avatarId); `org.js` organizations CRUD + membri in sola lettura +
`updateMember` (solo ruolo) — creazione e rimozione membro passano SEMPRE da Cloud Function
(`creaMembroTeam`/`rimuoviMembroTeam`), anche da super_admin (serve a cancellare anche `/users/{uid}`,
account Auth e `memberCount`: bug reale fixato lug 2026); `notes.js`/`goals.js` solo lettura;
`runbook.js` scrittura diretta (`qa_runs`, solo super_admin); `badges.js`, `wearable.js`,
`workoutPlans.js`, `calendar.js`/`groups.js`/`notifications.js` (orgId primo arg), `auth.js`, `users.js`, `db.js`.

## Backend — Cloud Functions callable (`functions/`)

Pacchetto Node **separato** alla radice (proprio `package.json`/`node_modules`, nessun import da `src/`, deploy
indipendente da hosting/rules). Gestisce le scritture sensibili tramite il layer `usecases/` — 36 callable
(region europe-west1) in `functions/src/callable/`, una per operazione: creaCliente, eliminaCliente,
creaMembroTeam, rimuoviMembroTeam, aggiornaRuoloMembro, salvaXP, salvaCampionamento, salvaBia,
aggiornaProfiloCliente, chiudiSessione, saltaSlot, aggiungi/aggiorna/elimina
Slot/Gruppo/Nota/SchedaAllenamento/Ricorrenza, aggiungiObiettivo/annullaObiettivo, ecc.
`src/index.js` le esporta; `triggers/` per le non-callable.
`functions/src/shared/` = copie server-side minimali di logica `src/`, SENZA dipendenze browser: `auth.js`
(requireAuth/requireRole/requireOrgAccess/requireOrgAdmin/requireOrgMemberOrClient), `plans.js` (limiti piano:
le rules NON proteggono le callable, l'Admin SDK le bypassa), `gamification.js`, `constants.js`,
`testsMeta.js` (volutamente minimale: key/stat/direction/ageGroup/categories/variables, niente label/unit/guide),
`percentile/tables/bia/formulas/calendarUtils.js`, `avatarUnlocks.js`, `badges.js`, `orgModule.js`/`modules.js`, `soccer.js`.


### Pattern client ↔ server
```
Componente/hook (src/)
  → usecases/xUseCase.js          httpsCallable wrapper, zero logica
    → functions/src/callable/x.js onCall — auth/ruolo/org, poi business logic
      → functions/src/shared/*.js calcolo, con Admin SDK per leggere/scrivere
```
`requireOrgAccess`/`requireOrgAdmin` in `shared/auth.js` sono l'equivalente server-side
delle Firestore rules per le callable — **obbligatorie** in ogni nuova callable che
tocca dati di un'org, perché l'Admin SDK bypassa sempre `firestore.rules`.
**Audit e side effect vanno attesi prima del return** (`await writeAudit(...)`): dopo il return
l'istanza può essere fermata e la promise troncata (voce di audit persa). `writeAudit` non blocca
la callable e logga l'errore (solo `action` e `code`, mai message/details: dati sanitari). Verificato da
`functions/test/sideEffectsAwaited.test.js` (scansiona `src/callable/*.js`: `writeAudit`,
`commit`/`recursiveDelete`/`createUser`/`deleteUser(s)`) e `functions/test/writeAudit.test.js`.
`functions/test/indexImport.test.js` importa `src/index.js` con il loader ESM nativo di Node (come la CLI
al deploy): Vitest accetta named import inesistenti da moduli CommonJS (`firebase-functions/logger`
esporta `error`/`warn`..., non `logger`), Node no.

### Copie speculari — rischio di divergenza
`shared/gamification.js`, `shared/constants.js`, `shared/plans.js`, `shared/testsMeta.js`
sono duplicati manuali (non importati) delle fonti in `src/`, perché `functions/` non ha
accesso a `src/`. **Nessun controllo automatico le mantiene sincronizzate** — un valore
cambiato da un lato e non dall'altro diverge silenziosamente (è già successo:
`LOG_MAX_ENTRIES` era 20 lato client e 200 lato server fino a lug 2026, poi riallineato a
200 su entrambi; il testo del log campionamento/XP aveva la stessa divergenza, risolta
passando la descrizione già calcolata dal client — vedi `saveCampionamentoUseCase.js`).
**Quando si modifica una di queste costanti/funzioni, aggiornare sempre entrambe le copie
e ridistribuire le functions** (`cd functions && npm run deploy:dev` poi `npm run deploy`).

### Perché non tutte le scritture passano da qui
Solo le scritture che toccano contatori piano (`memberCount`/`clientCount`), creano
account Firebase Auth, o richiedono un calcolo che il client non deve poter falsificare
(XP, percentili, limiti piano) passano da Cloud Function. Aggiornamenti diretti a basso
rischio su campi propri del cliente (peso/altezza in `useMisure.js`, avatarId in
`AvatarPicker.jsx`) restano `updateDoc` diretti da `firebase/services/clients.js`.

---


## Principi architetturali

### Separation of concerns
```
Hook        → logica, stato, fetch Firestore
Componenti  → render, composizione UI
Services    → LETTURE dirette Firestore (+ pochi update diretti a basso rischio)
Usecases    → SCRITTURE sensibili — wrapper httpsCallable verso Cloud Functions
Utils       → funzioni pure, nessun side effect
Config      → dati statici, nessuna logica
```
`Services` e `Usecases` si dividono le responsabilità di I/O: le letture restano dirette
(veloci, meno overhead), le scritture che toccano contatori piano, validazioni server-side
o dati sensibili passano dalle Cloud Functions. Vedi sezione "Backend — Cloud Functions
callable" più sotto.

### Ottimistic updates — pattern uniforme
```js
const snapshot = state
setState(optimisticValue)   // 1. aggiorna UI subito
try {
  await firestoreCall()     // 2. chiama Firestore
} catch {
  setState(snapshot)        // 3. rollback se errore
}
```

### Single source of truth
```
constants/tests.js       → direction, ageGroup, guide, categories
constants/bia.js         → range clinici, XP_BIA
config/modules.config.js → terminologia, test fissi per modulo
config/plans.config.js   → limiti piano (trainer, clienti)
utils/gamification.js    → XP, rank, livello (speculare a functions/src/shared/gamification.js)
```

### Data-driven UI
```
trainer.config.js           → PAGES map (id → componente)
routes.config.jsx           → PROTECTED_ROUTES per ruolo
trainer-shell/navItems.config.jsx → NAV_ITEMS + ORG_ADMIN_NAV_ITEMS
modules.config.js           → comportamento per moduleType
plans.config.js             → PLAN_LIMITS, PLAN_OPTIONS
```

### Readonly mode (staff_readonly)
```
ReadonlyContext  → boolean globale
ReadonlyGuard    → nasconde elementi di modifica
ReadonlyBanner   → banner informativo in cima
```

### orgId come primo argomento
Tutte le funzioni service e tutti gli hook operativi accettano
`orgId` come primo parametro. Per i trainer,
`orgId = profile?.orgId ?? user.uid`
(backward compat: trainer solo usano il proprio uid come orgId).

**Prop vs useTrainerState() — quale usare:**
```
Componenti in PAGES (trainer.config.jsx) e i loro figli diretti
  → orgId arriva come prop da TrainerLayout (già passato a <CurrentPage orgId={orgId} .../>)
  → propagarlo esplicitamente come prop lungo la catena diretta pagina → sotto-vista
    (es. GroupsPage → GroupDetailView), NON richiamare useTrainerState() in questi casi

Hook/componenti annidati in profondità, non collegati alla catena di prop
della pagina (es. useBia, useWearable, useMisure — usati da sezioni della
dashboard cliente lontane dal punto in cui orgId entra come prop)
  → usare useTrainerState() per evitare prop-drilling su più livelli
```
Evitare di mescolare i due pattern per lo stesso dato all'interno della stessa
catena di componenti — se un componente riceve già `orgId` da un genitore
diretto, non richiamare `useTrainerState()` per lo stesso valore.

---

## Comportamento UI per modulo

Il `moduleType` è disponibile in tutta l'area trainer tramite
`useTrainerState()` → `{ moduleType, orgPlan }`. Le capability di
`getModule(moduleType)` (vedi "Capability per modulo") sono la fonte di verità per
qualsiasi ramificazione condizionale; `isSoccer` solo per fasce e ruoli.

### ClientsPage — differenze soccer vs PT
| Aspetto               | personal_training        | soccer_academy                      |
|-----------------------|--------------------------|-------------------------------------|
| Colonna identificativa| Categoria (health/active…)| Ruolo (portiere/…)                 |
| Badge sul client card | categoria colorata        | ruolo colorato + badge "Piccoli" (giallo) se soccer_youth |
| Filtro laterale       | per categoria            | per ruolo + FASCIA (se presenti entrambe) |

Filtro FASCIA nel pannello filtri inline di `ClientsPage.jsx` appare **solo** quando ci
sono allievi sia Senior che Piccoli (cioè `fasce.length > 1`). Gestito in `useClientFilters.js`.

### NewClientView — differenze soccer vs PT
| Campo                | personal_training         | soccer_academy               |
|----------------------|---------------------------|------------------------------|
| Categoria            | select obbligatorio        | NON mostrare                 |
| Fascia d'età         | NON mostrare               | NON mostrare — derivata da `eta` |
| Ruolo                | NON mostrare               | StepRuolo da PLAYER_ROLES    |
| `categoria` salvato  | valore selezionato         | `getCategoriaFromEta(calcAge(dataNascita))` |
| `profileType`        | select (tests/bia/complete)| sempre `'tests_only'`        |

Gli step li costruisce `getWizardSteps(capabilities, profileType)` in `wizard.config.js`:
- PT: anagrafica → profilo → categoria (assente se `bia_only`) → account
- Soccer: anagrafica → ruolo → account
- Lipedema (e modulo sconosciuto): anagrafica → contatto (email facoltativa, nessun account)
La `categoria` (fascia d'età) viene derivata automaticamente dalla data di nascita al momento del submit.

**Blocco piano:** se `clients.length >= getPlanLimits(orgPlan).clients`,
NewClientView mostra una schermata di blocco invece del wizard.

### TestGuidePage — filtraggio per modulo
La guida deve mostrare solo i test pertinenti al modulo:
- PT: test filtrati per `client.categoria` o tutti e 13
- Soccer: solo i 5 test fissi (`SOCCER_FIXED_TESTS`)

```js
// Logica corretta per ottenere i test da mostrare
const tests = isSoccer
  ? ALL_TESTS.filter(t => t.categories.includes(soccerFascia))   // 'soccer_youth' | 'soccer_junior' | 'soccer'
  : ALL_TESTS   // o filtrati per la categoria selezionata
```

### RecurrencesPage — filtraggio status
Mostrare solo ricorrenze con `status === 'active'` (default).
Le ricorrenze `'ended'` e `'cancelled'` sono collassate in una
sezione "Archivio" in fondo alla pagina (toggle `showArchive`, default false).
La lista attive è paginata (10 per pagina).

---

## Calcolo percentili — nota tecnica

- `calcPercentileEx(stat, value, sex, age, testKey?)` (`utils/percentile.js`) → `{ value: number|null, outOfRange }`.
  `calcPercentile` è stato rimosso: usare `calcPercentileEx(...).value` se serve solo il numero.
- Età fuori fascia: `getAgeGroupClamped(testKey, age, sex)` (`utils/tables.js`) usa la fascia più
  vicina e segnala `outOfRange: true` (banner ambra `ageWarning` in `TestInput`); `group: null` solo
  se non esiste nessuna tabella per quel test/sesso.
- In `useCampionamento.js` usare `calcPercentileEx` e passare **sempre `test.key`** come 5° argomento
  (stat condivise: `resistenza` è in 5 test con tabelle proprie). Il hook espone `ageWarnings`.


Dettagli: docs/ARCHITECTURE-NOTES.md → Calcolo percentili — nota tecnica

## Design system

### Font
`font-display` → Montserrat (titoli, label, bottoni, numeri), `font-body` → Inter (testo).
Serviti dall'app (`src/fonts.css`, `@fontsource-variable/*`, importato in `main.jsx`), **non** da Google
Fonts: non reintrodurre `@import` da `fonts.googleapis.com` (la CSP in `firebase.json` non lo permette).

### Elevation, colori brand, background
5 livelli: L0 `#07090e`, L1 `#0c1219`, L2 `#0f1820`, L3 `#131e2a`, L4 `#1a2638`. Brand: verde corpo
`#0ec452` (primario UI), verde neon `#1dff6b`, ciano `#2ecfff`, blu `#1a7fd4`, rosso admin `#f87171`.
Background globale CSS-only su `html` in `src/index.css`; `body`/`#root` trasparenti.

### Select / dropdown — regola CSS
Gli elementi `<select>` devono usare `.input-base` **e** avere
esplicitamente `color` e `background` impostati per garantire
la leggibilità su tutti i browser (i browser applicano stili
nativi bianchi/grigi di default):
```css
/* Pattern corretto */
.input-base {
  color: var(--text-primary);
  background: var(--bg-surface);
}
/* Anche le option devono ereditare il colore */
select.input-base option {
  background: var(--bg-overlay);
  color: var(--text-primary);
}
```

### Classi CSS globali (verificate contro `src/index.css`)
`.rx-card`, `.rx-btn-primary`, `.rx-badge`, `.input-base` (+ `.input-compact`), `.rx-hex-bg`/`.bg-hex`,
`.rx-grid-bg`, `.rx-glow-text`, `.rx-animate-in`, `.no-scrollbar`, `.toast-in`, `.skip-to-content`.
Altre classi (`.card`, `.btn*`, `.badge*`, `.skeleton`, `.text-gradient`, `.rx-text-green/cyan`...)
**non esistono**: le varianti di `Card`/`Button`/`Badge` (`components/ui/index.jsx`) sono prop JS + style inline.

### Token principali (CSS variables)
`--rx-bg/surface/surface-alt/card-bg/nav-bg`, `--rx-accent(-bright/-dark/-glow)`, `--rx-accent-2(-glow)`,
`--rx-text/text-muted/border`, `--rx-gradient(-accent/-accent-2)` — definiti in `index.css`, sovrascritti
per tema da `config/themes.config.js`. I nomi `--rx-accent`/`--rx-accent-2` sono slot neutri riassegnati
per tema (non legati a un colore). Le var `--bg-*`, `--border-*`, `--text-primary/secondary/tertiary`,
`--green-400`, `--shadow-*`, `--duration-*`, `--radius-*` **non esistono** (nomenclatura di `design/tokens.js`,
mai importato). `--rx-blue`/`--rx-metal*` rimosse.


Dettagli: docs/ARCHITECTURE-NOTES.md → Design system (Background brand, Elevation, Colori brand, Token principali)

## Test atletici

### personal_training — per categoria
```
health (5):   sit_and_reach, flamingo_test, ymca_step_test,
              dinamometro_hand_grip, sit_to_stand
active (5):   y_balance, dinamometro_hand_grip, ymca_step_test,
              standing_long_jump, sprint_10m
athlete (5):  drop_jump_rsi, t_test_agility, yo_yo_ir1,
              sprint_20m, cmj
```
`dinamometro_hand_grip` e `ymca_step_test` condivisi
tra health e active → `categories: ['health', 'active']`

### soccer_academy — test per fascia (3 fasce implementate)
```
Pulcini (7-9):      single_leg_stance, sprint_10m, shuttle_run_30m, standing_long_jump, t_test_mini
Esordienti (10-13): y_balance_anterior, sprint_20m, t_test_soccer_junior, standing_long_jump, six_minute_run
Senior (14+):       y_balance, standing_long_jump, 505_cod_agility, sprint_20m, beep_test
```
Il campo `categories` in `constants/tests.js` specifica a quali fasce appartiene ogni test:
- test esclusivi Pulcini    → `categories: ['soccer_youth']`
- test esclusivi Esordienti → `categories: ['soccer_junior']`
- test esclusivi Senior     → `categories: ['soccer']`
- `standing_long_jump` condiviso tra tutte e 3 → `categories: ['soccer_youth', 'soccer_junior', 'soccer']`
- test condivisi con PT     → aggiungere anche `'active'` / `'athlete'` ecc.


Dettagli: docs/ARCHITECTURE-NOTES.md → Tabelle percentili soccer — stato e fonti (fonti, calibrazioni, ageGroup per test)

### Y Balance Test — formula bilaterale
Il test raccoglie i valori di **entrambi gli arti** (DX e SX) separatamente:
```
variables: ANT_dx, PM_dx, PL_dx, ANT_sx, PM_sx, PL_sx, lunghezza_dx, lunghezza_sx
formulaType: 'y_balance_composite'
```
La formula calcola il Composite Score per ciascun arto e ne restituisce la media:
```js
dx = (ANT_dx + PM_dx + PL_dx) / (3 × lunghezza_dx) × 100
sx = (ANT_sx + PM_sx + PL_sx) / (3 × lunghezza_sx) × 100
result = (dx + sx) / 2
```
`lunghezza_dx` / `lunghezza_sx`: da ASIS al malleolo mediale, una misura per arto.

---

## Gamification

```js
XP_PER_LEVEL_MULTIPLIER = 1.08          // xpNext di partenza = 500 (NEW_CLIENT_DEFAULTS, creaCliente.js)
calcSessionXP(baseXP, streak) → round(baseXP × (1 + min(streak × 0.1, 1.0)))   // streak 10 = ×2.0
LOG_MAX_ENTRIES = 200                   // client (constants/index.js) e server allineati
XP_CAMPIONAMENTO = { FIRST: 50, NONE: 10, PARTIAL: 30 /*1 stat*/, MOST: 60 /*2-3*/, ALL: 100 /*4+*/ }
XP_BIA = { FIRST_MEASUREMENT: 50, ALL: 100, MOST: 60, PARTIAL: 30, NONE: 10 }
// parametri chiave BIA: fatMassPercent↓, muscleMassKg↑, waterPercent↑, visceralFat↓
```
Il rank dipende SOLO dai test atletici — mai dalla BIA. Curva livelli: vedi note.


Dettagli: docs/ARCHITECTURE-NOTES.md → Gamification

## BIA — Bioimpedenziometria

Solo `personal_training` (soccer: solo `tests_only`). Upgrade categoria: `tests_only → complete`
mantiene stats/campionamenti e azzera `biaHistory`; `bia_only → complete` mantiene `biaHistory` e
azzera stats/campionamenti. Direzioni dei parametri e profili: vedi note.


Dettagli: docs/ARCHITECTURE-NOTES.md → BIA — Bioimpedenziometria (Profili cliente, Upgrade categoria, Parametri BIA)

## Wearable — Google Fit

Feature disattivata (audit lug 2026, RX-62): nessun entry point client; `WearableSection.jsx` (solo
trainer) mostra "non disponibile" e permette solo DISABILITA. Se si reintroduce serve un nuovo entry
point client **e** va prima risolto RX-63 (`client.wearable.accessToken` leggibile da ogni membro
dell'org, incluso `staff_readonly`: spostare il token in una subcollection con regole strette prima di
tornare a scriverlo).


Dettagli: docs/ARCHITECTURE-NOTES.md → Wearable — Google Fit

## Runbook manuale (QA)

Casi manuali non coperti da unit test in `config/runbook.config.js` (`RUNBOOK_SUITES`, id TP-XXX,
severità `blocker`/`important`/`nice`); esecuzioni tracciate in `qa_runs/{runId}` (top-level, solo
`super_admin`, scrittura diretta), UI `admin-pages/RunbookPage.jsx`. **Ogni nuova feature che tocca
UI/Auth/Firestore in modo non coperto da unit test aggiunge un caso nel runbook** (come un test Vitest
per la logica pura). `docs/test-plan.md` è superseded.


Dettagli: docs/ARCHITECTURE-NOTES.md → Runbook manuale (QA)

## QA automatica contro rankex-dev (STORY-041)

Suite Playwright sull'hosting `rankex-app-dev.web.app` (non vite locale: copre anche CSP/header),
esecuzione manuale, non in CI. Separata da `playwright.config.js` (vite locale + CI, account di
`seed-test-accounts.mjs`).
```
npm run qa:dev:seed   → scripts/seed-qa-orgs.mjs [service-account-rankex-dev.json]: org fisse
                        qa-pt / qa-soccer / qa-lipedema, org_admin+trainer+staff_readonly
                        (qadev.<modulo>.<ruolo>@test.rankex) e un cliente di base. Idempotente
npm run qa:dev        → playwright.qa-dev.config.js, spec in e2e/qa-dev/tests/
```
- Solo rankex-dev: seed, setup e teardown rifiutano un service account o un `.env.development`
  di un altro progetto, e un host diverso (`e2e/qa-dev/qaDev.config.js`).
- `.env.test` (gitignored): `QA_DEV_SERVICE_ACCOUNT` (path) e `QA_DEV_PASSWORD`, scritti dal seed.
- Gli spec creano solo clienti `E2E-…`; setup e teardown li cancellano con slot, ricorrenze,
  notifiche, valutazioni e account (Admin SDK, `e2e/qa-dev/cleanup.js`).
- Il setup crea in `qa-pt` un gruppo `E2E-gruppo-<runId>` e uno slot di ieri (`e2eMarker: 'E2E-slot-<runId>'`)
  per i casi di `roles.spec.js` su popup slot e dettaglio gruppo; id in `e2e/.auth/qa-dev/e2e-fixtures.json`.
  Setup e teardown li cancellano (anche i residui di run interrotti).
- Il seed non tocca mai un account esistente di un'altra org (prefisso `qadev.`: `qa.*` è della
  QA manuale).
- **Non deployare l'hosting mentre gira `npm run qa:dev`**: la suite gira contro l'hosting
  deployato, un deploy a metà mischia due build (e fa comparire il banner RICARICA). Prima il
  deploy, poi `qa:dev`, mai in parallelo.

## Calendario

Vista default settimana (`month | week | day`). `handleCloseSlot(slotId, attendeeIds, clientsData)` → XP solo
agli attendees, notifica agli absentees; `handleSkipSlot(slotId)` → `status: 'skipped'`, nessun XP.
Ricorrenza = entità di primo livello (`active|ended|cancelled`): modifica orario aggiorna gli slot futuri;
cancella elimina gli slot futuri; `clientIds` sincronizzati con gli slot futuri via `addClientToRecurrence`.

### Sync gruppo/calendario
Toggle cliente in gruppo → `GroupToggleDialog` mostra preview (slot futuri + ricorrenze); conferma →
1. aggiorna `group.clientIds` 2. aggiorna slot futuri non ricorrenti 3. aggiorna ricorrenze attive + loro slot
futuri. Slot passati invariati.

## Routing per ruolo

```
super_admin    → SuperAdminView  (AdminShell, accent rosso)
org_admin      → OrgAdminView   (TrainerView + pagine org)
trainer        → TrainerView
staff_readonly → TrainerView con readonly=true
client         → ClientView
```

---

## Convenzioni codice

### Naming
```
Handler interni:  handleNomeAzione
Callback props:   onNomeEvento
Booleani:         isLoading, hasClients, canSave
Array:            clients.map(client => ...)  (mai c => ...)
Costanti:         SCREAMING_SNAKE_CASE
Magic numbers:    sempre come costante nominata
```

### Import — fonte corretta
```
calcSessionXP          → utils/gamification
calcMonthlyCompletion  → features/calendar/useCalendar
getProfileCategory     → constants/bia
getModule              → config/modules.config
getTerminology         → config/modules.config
SOCCER_AGE_GROUPS      → config/modules.config
isSoccer               → getModule(moduleType).isSoccer
getPlanLimits          → config/plans.config
orgPlan                → useTrainerState().orgPlan
auditLog               → utils/auditLog
AUDIT_ACTIONS          → utils/auditLog
isDev / isProduction   → utils/env
isAdminDomain          → utils/env
useNotes               → hooks/useNotes
getClientPlans         → firebase/services/workoutPlans (trainer: tutte le schede del cliente)
getWorkoutPlanForClient → firebase/services/workoutPlans (client: scheda attiva, query filtrata)
```

### Ordine sezioni in ogni file
```
1. Import esterni
2. Import interni (hooks → utils → components → constants)
3. Costanti locali
4. Componente/hook principale
5. Componenti locali
6. Funzioni helper pure
```

---

## Processo di sviluppo — team AI

RankEX ha un set di subagent dedicati in `.claude/agents/*.md`, uno per ruolo, pensati per
richieste non banali — non per ogni piccolo fix. Documenti di processo in `docs/`:
`BACKLOG.md`, `SPRINT.md`, `DECISIONS.md`, `BUGS.md`, `TECH-DEBT.md`, `CHANGELOG.md`.
**Questi file tracciano solo lo stato del lavoro** (cosa è pianificato, in corso, deciso,
rotto) — non duplicano MAI la documentazione di prodotto/architettura/design, che resta
esclusivamente in questo file (single source of truth, stesso principio già applicato a
`utils/gamification.js` vs la sua copia server).

### Pipeline

```
richiesta
  → product-analyst   (solo se il valore non è ovvio — vale la pena costruirla?)
  → product-owner       → docs/BACKLOG.md  (Epic → Story → Task, acceptance criteria, priorità)
  → scrum-master         → docs/SPRINT.md   (cosa entra nello sprint, status board)
  → ux-ui-designer + tech-lead                (design coerente + approccio tecnico;
                                                 tech-lead logga su docs/DECISIONS.md)
  → developer                                  (implementa SOLO quanto è READY nello sprint)
  → code-reviewer        → invoca /code-review (qualità del codice, non del comportamento)
  → qa-engineer            → docs/BUGS.md se trova problemi (verifica il comportamento
                              reale, es. via /run — non fidarsi del self-report)
  → (fix → code-reviewer → qa-engineer di nuovo, se serve)
  → release-manager        → docs/CHANGELOG.md (prima di merge dev→main o deploy manuale)
  → retrospective            (a fine sprint, non ad ogni task)
```

Si invoca un ruolo con l'`Agent` tool passando `subagent_type: <nome>` (es. `tech-lead`,
`qa-engineer`). Non serve un agente "orchestratore" separato: la sessione principale
dispatcha nell'ordine sopra.

### Quando saltare la pipeline

RankEX è mantenuto da un solo sviluppatore — il processo serve a disambiguare, non a
burocratizzare l'ovvio. Per un fix di una riga, un typo, o un bug con causa e soluzione già
chiare, si implementa direttamente, senza passare da tutti i ruoli. La pipeline completa
vale per feature nuove o cambi che toccano permessi, piani, o dati sensibili.

**Principio guida:** *"Non costruire quello che non è stato capito."* — non far partire il
Developer se manca un backlog approvato o un'analisi tecnica del Tech Lead per un cambio
non banale.

---


### Regole di efficienza (token)
- Agenti su Sonnet (`model:` nel frontmatter di `.claude/agents/*.md`), tranne `tech-lead`.
- Pipeline corta per story chiare: pianificazione nella sessione principale → `developer` → una review.
  `product-owner`/`ux-ui-designer`/`tech-lead` solo per feature nuove o decisioni vere.
- Review `medium` di default; `high` solo per rules/permessi/cancellazione dati/limiti piano.
- QA dal vivo con browser una volta a fine sprint e solo sul nuovo, con org di test fissa su `rankex-dev`.
- Nei prompt agli agenti indicare i file esatti da leggere.
- Una sessione nuova (o `/compact`) per sprint.

---

## Checklist: aggiungere funzionalità
### Nuovo test atletico
1. Aggiungi in `constants/tests.js` con tutti i campi
2. Aggiungi tabella percentili in `utils/tables.js`
3. Se soccer: imposta `categories` in base alla fascia specifica:
   - solo Pulcini    → `['soccer_youth']`
   - solo Esordienti → `['soccer_junior']`
   - solo Senior     → `['soccer']`
   - più fasce       → es. `['soccer_junior', 'soccer']`
4. Nessun altro file da modificare

### Nuova pagina trainer
1. Crea componente in `features/trainer/`
2. Aggiungi in `features/trainer/trainer.config.jsx`
3. Aggiungi in `trainer-shell/navItems.config.jsx` (NAV_ITEMS)
4. Nessun altro file da modificare

### Note/commenti per un cliente
Service `firebase/services/notes.js` (lettura), hook `useNotes(orgId, clientId, { role, name })`,
scritture via `aggiungiNota`/`eliminaNota`; `NotesSection` già in `ClientDashboard` e
`ClientDashboardPage`. Il client è in sola lettura (vedi Modelli dati → Nota).

### Obiettivo
Service `goals.js` (`getGoals`, sola lettura); usecases `addGoalUseCase` (→ `aggiungiObiettivo`) e
`cancelGoalUseCase` (→ `annullaObiettivo`); hook `useGoals(orgId, clientId)`; UI `GoalsSection`
(trainer: tab OBIETTIVI; client: hub → Test → Obiettivi, `readonly`). Achievement solo server-side.
Rules: create/update solo `canWrite(orgId)`, read anche `isOwnClient`, delete sempre `false` (si annulla
via update di stato: mantiene lo storico).

### Scheda allenamento
Service `firebase/services/workoutPlans.js`: `getClientPlans(orgId, clientId)` (trainer: tutte),
`getWorkoutPlanForClient(orgId, clientId)` (client: attiva), add/update/delete. UI trainer
`WorkoutPlanSection` + `WorkoutPlanForm` (crea nuova → archivia automaticamente la scheda attiva);
UI client `ClientWorkoutSection` read-only. Rules: `allow read: if canRead(orgId) || (isClientOfOrg(orgId)
&& resource.data.clientId == userProfile().clientId)` — vale anche sulle query solo se il client filtra
per `clientId` (una query senza quel filtro viene rifiutata).

### Rules sul documento cliente (ott 2026)
Update diretti ammessi — tutto il resto (XP, livello, Monete, rank, stats,
campionamenti, log, BIA, streak, acquisti) passa solo dalle Cloud Functions:
- trainer/org_admin: `peso`, `altezza`, `misureHistory`, `badges`, `badgeShowcase`,
  `wearableEnabled`, `wearable`
- cliente: `wearable`, `badgeShowcase`, `avatarId` solo se sbloccato (funzione
  `avatarUnlocked` nelle rules, speculare a `config/avatars.config.js` e
  `functions/src/shared/avatarUnlocks.js` — terza copia delle soglie, da tenere allineata)
- `delete` del cliente: solo super_admin; il flusso normale è `eliminaCliente`.
Un nuovo campo scritto direttamente dal client va aggiunto alla lista nelle rules,
con un test in `tests/rules/firestore.rules.test.js`.


Dettagli: docs/ARCHITECTURE-NOTES.md → Dashboard cliente — layout / Tab Misure e XP Trend / Export PDF atleta

### Nuova pagina org_admin (solo)
1. Crea componente in `features/org/org-pages/`
2. Aggiungi in `features/org/OrgAdminView.jsx` (mappa `ORG_PAGES`)
3. Aggiungi la voce in `ORG_ADMIN_NAV_ITEMS` (`components/layout/trainer-shell/navItems.config.jsx`)

### Membro del team
Flusso creazione: OrgAdminView → MembersPage → CreateMemberForm
→ `createMemberUseCase` → Cloud Function `creaMembroTeam`: account Auth, `/users/{uid}`,
  `members/{uid}` e `increment(1)` su `org.memberCount` in un unico batch (Admin SDK)

Cambio ruolo: `updateMemberRoleUseCase` → Cloud Function `aggiornaRuoloMembro` (batch su `members/` e `users/`)
Permesso Firestore: `isOrgAdminForMember(uid)` nella regola update di `/users/{uid}`.

MembersPage è accessibile da org_admin tramite nav item "Team" (`ORG_ADMIN_NAV_ITEMS`
in `navItems.config.jsx`). Mostra banner di blocco e disabilita il bottone se
`members.length >= getPlanLimits(org?.plan).trainers`.

### Nuova organizzazione (super_admin)
Flusso: SuperAdminView → OrgsPage → CreateOrgForm
→ `createOrganization(orgId, data)` → orgId = slug(name) + random suffix
→ `ownerId` viene da `user.uid` passato via `SuperAdminView → OrgsPage (currentUserUid) → CreateOrgForm (ownerUid)`

### Fine contratto di un'organizzazione (DPA, sezione 7)
1. **Esportare i dati** se l'org li vuole indietro:
   `node scripts/export-org.mjs <service-account.json> <orgId>` → `exports/<orgId>-<data>/`
   con `completo.json` (tutto l'albero dell'org + profili + email) e CSV per Excel
   (clienti, campionamenti, BIA, staff). Sola lettura. `exports/` è in `.gitignore`:
   contiene dati personali, va consegnata con un canale protetto e poi cancellata.
2. **Cancellare l'org**: `OrgDetailView` → "Zona pericolosa" → ELIMINA ORGANIZZAZIONE
   (bisogna digitare il nome) → `deleteOrganizationUseCase` → Cloud Function
   `eliminaOrganizzazione` (solo super_admin, ricontrolla il nome lato server). Cancella gli
   account Auth di staff e clienti, i loro `/users/{uid}`, poi l'org con tutte le
   subcollection (`recursiveDelete`). Non tocca mai utenti `super_admin`. Se si interrompe,
   si può rilanciare: l'org viene cancellata per ultima.
3. I backup giornalieri (vedi "Monitoraggio costi") conservano ancora i dati per 7 giorni:
   è la durata da dichiarare all'org come cancellazione definitiva.

---

## File da NON modificare
```
utils/tables.js        → solo aggiungere nuove tabelle
firebase/config.js     → configurazione Firebase
firestore.index.json   → aggiungere solo, mai rimuovere
firestore.rules        → modificare con estrema cautela
```

## File critici — modificare con cautela
```
utils/gamification.js        → importato da molti hook
constants/tests.js           → fonte di verità test
features/calendar/useCalendar.js → logica calendario
hooks/useClients.js          → ottimistic updates, firma: (orgId, userId?)
firebase/paths.js            → fonte di verità path Firestore
firebase/services/auth.js    → auth instance + setPersistence + logout con audit
firebase/services/clients.js → solo letture + updateClient diretto (basso rischio)
firebase/services/org.js     → membri: letture + updateMember diretto (solo ruolo).
                                Rimozione SEMPRE via Cloud Function, anche da super_admin.
functions/src/callable/*.js  → creaCliente/eliminaCliente/creaMembroTeam/
                                rimuoviMembroTeam usano batch + counter (Admin SDK)
usecases/*.js                → wrapper httpsCallable — non contengono logica,
                                solo il mapping verso la Cloud Function
utils/percentile.js          → usare calcPercentileEx per ageWarnings; passare sempre testKey come 5° arg
utils/auditLog.js            → getAuth lazy — non spostare a livello modulo
utils/env.js                 → fonte di verità ambienti e domini
components/common/DomainGuard.jsx → logica separazione domini
config/plans.config.js       → fonte di verità limiti piano
utils/validation.js          → importato da 16 file; firma validatePassword usata ovunque
```

---

## Sicurezza

### Hardening implementato (apr 2026)

**Firestore Rules:**
- `memberRole()` null-safe (ritorna `null` se il membro non esiste)
- `isOrgAdminForMember()` valida il nuovo `role` (solo `org_admin`, `trainer`, `staff_readonly`: niente escalation a `super_admin`)
- `mustChangePassword` scrivibile dal client solo con `false`
- `memberCount`/`clientCount` non scrivibili dal client; create `users`/`clients`/`members` e create/delete
  `organizations` solo super_admin
- `rimuoviMembroTeam` verifica che l'uid sia membro dell'org del chiamante

**Auth & Session:** `ChangePasswordScreen` richiede re-auth con la password temporanea prima di
`updatePassword`; session timeout client 24 ore; audit log su login, logout, creazione/eliminazione
cliente, cambio password/email/ruolo, rimozione membro.

**Password policy** (`utils/validation.js`): `validatePassword` → minimo 8 caratteri + almeno 1 numero + 1 maiuscola.

**HTTP Security Headers** (entrambi i target Hosting): CSP (script `'self'`, style `'unsafe-inline'`,
connect Firebase/Google), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

**App Check — RIMOSSO (mag 2026):** non reintrodurre (la CSP bloccava reCAPTCHA causando loop di login);
nessuna `VITE_RECAPTCHA_SITE_KEY`. Domini autorizzati Firebase Auth configurati a mano in Console
(`rankex-app.web.app`, `rankex-admin.web.app`). `isAdminDomain()` (`utils/env.js`) riconosce 3 hostname
(`admin.rankex.app`, `admin-uat.rankex.app`, `rankex-admin.web.app`); in `isDev` ritorna sempre `false`.

**Limitazioni note:** session timeout solo client-side; `signOut()` non revoca il refresh token (~1h residua).


Dettagli: docs/ARCHITECTURE-NOTES.md → Sicurezza (testo originale con cronologia)

## Ambienti e infrastruttura

### Progetti Firebase
```
rankex-dev      → sviluppo locale (npm run dev)
fitquest-60a09  → produzione     (npm run build / deploy)
```

### File .env
`.env.development` (`VITE_ENV=development`, `rankex-dev`) e `.env.production` (`VITE_ENV=production`,
`fitquest-60a09`), entrambi gitignored; template `.env.example`. Non esistono più
`VITE_GOOGLE_FIT_CLIENT_ID`, `VITE_FIREBASE_MEASUREMENT_ID` (Analytics mai usato: se reintrodotto serve
prima un banner di consenso cookie) né `VITE_RECAPTCHA_SITE_KEY`.

### Hosting Firebase — multisito
`rankex-app.web.app` → trainer, org_admin, client, staff_readonly; `rankex-admin.web.app` → solo super_admin.
Configurato in `firebase.json` (targets) + `.firebaserc` (site IDs).

### DomainGuard — separazione domini
`components/common/DomainGuard.jsx`, attivo solo in production (`!isDev`): app domain + super_admin →
schermata bloccata + link admin; admin domain + non super_admin → schermata bloccata + link app. In
development è disattivato.

### Session timeout — `useSessionTimeout(role)`
super_admin 30 min · org_admin 2 ore · trainer 8 ore · staff_readonly 8 ore · client 24 ore. Il timer si
azzera su mousemove/keypress/touchstart/scroll; chiamato in `App.jsx` con `profile?.role`.

### Audit log — `auditLog(action, details?)`
`utils/auditLog.js` scrive in `/audit_logs/{logId}` (append-only, solo super_admin legge).
`import { auditLog, AUDIT_ACTIONS } from 'utils/auditLog'`. **IMPORTANTE:** `getAuth(app)` in
`auditLog.js` è chiamato dentro la funzione (lazy), non a livello di modulo: non spostarlo (conflitto con
`setPersistence` in `auth.js`). Elenco azioni e punti di integrazione: vedi note.
`CLIENT_CREATED` e `CLIENT_DELETED` non passano dal client: li scrivono solo `creaCliente` ed
`eliminaCliente` (`writeAudit`, env `functions`, una voce per operazione). Il nome del cliente sta nei
`details` solo se il modulo ha `hasClientNameInAudit` (PT e soccer sì, lipedema no, modulo sconosciuto no):
criterio sul modulo (`getOrgCapabilities`), mai sul dato.

### Branching e CI/CD
```
dev   → sviluppo quotidiano, push liberi → CI (lint + build)
main  → produzione, solo merge da dev   → CI + Deploy automatico Firebase
```
Workflow GitHub Actions:
- `ci.yml`     → runs on push dev/main + PR to main
- `deploy.yml` → si attiva via `workflow_run` su "CI" completata con successo, **su
  entrambi** i branch `main` e `dev` — due job mutuamente esclusivi filtrati per
  `head_branch`: `deploy-prod` (→ `fitquest-60a09`) e `deploy-dev` (→ `rankex-dev`),
  entrambi deployano solo hosting + firestore:rules
- `e2e.yml`    → stesso trigger di `ci.yml`, workflow indipendente — un fallimento qui
  non blocca né ritarda `deploy.yml`, che ascolta solo l'esito di "CI"
- **Le Cloud Functions non fanno parte del deploy automatico** — vanno rilasciate a mano
  da `functions/` con `npm run deploy:dev` / `npm run deploy` (vedi sotto)

### npm scripts deploy
```
npm run deploy:rules         → rules su fitquest-60a09 (prod)
npm run deploy:rules:dev     → rules su rankex-dev (dev)
npm run deploy:app           → hosting rankex-app        (prod)
npm run deploy:admin         → hosting rankex-admin      (prod)
npm run deploy:all           → hosting entrambi          (prod)
npm run deploy:app:dev       → hosting rankex-app-dev    (dev, build --mode development)
npm run deploy:admin:dev     → hosting rankex-admin-dev  (dev, build --mode development)
npm run deploy:all:dev       → hosting entrambi          (dev, build --mode development)
```
Tutti usano `cross-env NODE_OPTIONS=--dns-result-order=ipv4first`
(fix DNS IPv6 su Windows — necessario su questa macchina).

**Cloud Functions — script separati, dentro `functions/` (non nella root):**
```
cd functions
npm run deploy:dev   → cross-env ... firebase deploy --only functions --project rankex-dev
npm run deploy       → cross-env ... firebase deploy --only functions --project fitquest-60a09
```
Non ci sono script per singola funzione — `deploy`/`deploy:dev` ridistribuiscono sempre
tutte le callable in `functions/src/callable/`. Non fanno parte di `deploy.yml` (CI/CD):
vanno lanciati manualmente, sempre prima su `rankex-dev` per verifica.
Anche gli script di `functions/` (`serve`, `deploy`, `deploy:dev`, `logs`) usano `cross-env
NODE_OPTIONS=--dns-result-order=ipv4first` (`cross-env` è devDependency di `functions/`): senza, su questa
macchina falliscono con "Failed to list functions" / "Failed to make request".

---

## Deploy Firestore rules

Dopo ogni modifica a `firestore.rules`, deploya su entrambi i progetti:
```
npm run deploy:rules       # → prod (fitquest-60a09)
npm run deploy:rules:dev   # → dev  (rankex-dev)
```

---

## Rilascio in produzione

Processo stabile e generico. Lo stato di **ogni** rilascio (commit, esiti, rollback con commit reali)
sta in `docs/CHANGELOG.md`, in una voce "non rilasciata / in rilascio" in cima, non qui. Ogni deploy su
`fitquest-60a09` richiede il via libera esplicito dell'utente, uno per passo.

**Ordine: functions prima, poi merge `dev → main`.** Il merge fa partire `deploy.yml` (CI + hosting + rules
prod); le functions no, sono a mano. Callable nuove/cambiate devono restare compatibili con client e rules
vecchi (nella finestra tra i due passi c'è ancora la build vecchia); il contrario lascia client nuovi che
chiamano callable inesistenti, o azioni senza audit. Regola generale: si rilascia prima il layer che resta
compatibile col vecchio. Se un rilascio richiede l'ordine opposto, va motivato nella voce di CHANGELOG. Il
merge segue **subito** il deploy functions (finestra corta). Per `qa:dev` vale la regola già scritta in
"QA automatica" (mai deploy hosting in parallelo).

Comandi: da Git Bash, `NODE_OPTIONS=--dns-result-order=ipv4first <cmd>`; da PowerShell
`$env:NODE_OPTIONS='--dns-result-order=ipv4first'; <cmd>`. `firebase` = CLI globale in PATH (non è
devDependency del repo; `npx firebase` non funziona, `npx firebase-tools` sì).

### Pre-flight (tutto verde, su HEAD di `dev`)
```
npm run build · npm run lint · npm run test:run
npm run test:rules                  # emulatore Firestore (serve Java), come in ci.yml
cd functions && npm test
```
- `qa:dev` verde sull'**ultimo** hosting dev (stesso commit che va in prod); `docs/BUGS.md` senza P0/P1 aperti.
- Env: `.env.production` con `VITE_ENV=production` e `VITE_FIREBASE_PROJECT_ID=fitquest-60a09` (controllare
  solo queste due righe, mai stampare il file); stessa cosa per `.env.development` (`rankex-dev`). La build di
  `deploy.yml` usa i secrets GitHub `VITE_FIREBASE_*` (prod) e `FIREBASE_TOKEN`: non dipende dai `.env` locali.
- Diff verso la produzione: `git fetch && git diff origin/main -- firestore.rules firestore.index.json` e
  `git diff --stat origin/main -- functions/src`; callable nuove: `git diff --name-status origin/main --
  functions/src/callable | grep ^A`. Per il confronto con la produzione usare gli **export** di
  `functions/src/index.js` (non i file in `callable/`) contro `firebase functions:list --project
  fitquest-60a09` (sola lettura): nuove = negli export e non in prod; attese dopo il deploy = prod + nuove.
- Cambio runtime Node (`functions/package.json` → `engines`, es. 20 → 22) = cambio di runtime di **tutte** le
  functions al deploy: è un rischio a sé (dipendenze, cold start). Dichiararlo nel CHANGELOG; il pre-flight
  `cd functions && npm test` gira già sul Node locale, controllare che sia quello nuovo (`node -v`).
- Costanti speculari client/server (vedi "Copie speculari") allineate; indici e rules compatibili col vecchio client.
- Dati prod da verificare **prima** (a cura dell'utente in Console) se il rilascio introduce nuovi valori/capability
  (es. `moduleType` sconosciuto nelle org: le callable lo bloccano).

### Da annotare in CHANGELOG prima di ogni deploy prod
- Commit in prod: hosting + rules = `git rev-parse origin/main`; functions = commit dell'ultimo deploy functions
  prod (ultima voce CHANGELOG che lo registra; in mancanza `git log -1 origin/main -- functions/` come stima, da
  dichiarare "da confermare"). Se ignoto, scriverlo: il rollback functions non è garantito.
- Rollback per layer, con i commit reali (`<prev>` = commit annotato sopra):
  - **rules**: Console → Firestore → Rules → cronologia, ripubblica la versione precedente. Da CLI (non usa il
    working tree): cartella temporanea con `git show <prev>:firestore.rules > firestore.rules` e un
    `firebase.json` con `{"firestore":{"rules":"firestore.rules"}}`, poi lì (con `NODE_OPTIONS` ipv4first)
    `firebase deploy --only firestore:rules --project fitquest-60a09`. Non tocca gli indici. `npm run
    deploy:rules` pubblica il file del working tree: va bene solo se è già lo stato precedente. Un push
    successivo su `main` ripubblica le rules di `main`: dopo un rollback manuale, o si ripristina anche `main`
    o non si pusha.
  - **functions**: `git worktree add <cartella-esterna-al-repo> <prev>` (cartella separata, **niente junction**
    per `node_modules`), poi nella cartella del worktree, con `NODE_OPTIONS` ipv4first (comandi per Git Bash o
    PowerShell come sopra): `cd functions && npm ci`, quindi
    `npx firebase-tools deploy --only functions --project fitquest-60a09` (o `firebase` globale). Non usare
    `npm run deploy` del commit vecchio: chiama `firebase` senza `cross-env` né devDependency. Torna anche il
    runtime Node del commit vecchio. Finito, `git worktree remove` **solo dopo** aver verificato che
    `functions/node_modules` sia una cartella reale e non una junction (su Windows `worktree remove` seguirebbe
    la junction e cancellerebbe il `node_modules` reale).
    **Callable nuove al rollback:** la CLI le trova in prod ma non nel codice vecchio e propone di cancellarle.
    In modo interattivo rispondere **No** (restano, innocue); `--force` le cancella; in modo non interattivo
    senza `--force` il deploy **fallisce**. Per cancellarle volutamente:
    `firebase functions:delete <a> <b> <c> --region europe-west1 --project fitquest-60a09`.
  - **hosting**: Console → Hosting → Release history → Rollback, **per entrambi** i siti `rankex-app` e
    `rankex-admin`. Un push successivo su `main` lo sovrascrive (deploy hosting a ogni merge): dopo il rollback
    non pushare su `main` finché non è corretto. Alternativa CLI `firebase hosting:clone`: verificare la
    sintassi con `--help` prima.

### Deploy
1. `cd functions && npm run deploy` (via libera). Annotare ora ed esito in CHANGELOG. Subito dopo
   `firebase functions:list --project fitquest-60a09`: callable attese = prod + nuove (conteggio) e runtime
   atteso per tutte (es. `nodejs22`); una sola con runtime diverso = deploy parziale, fermarsi.
2. Subito dopo, merge `dev → main` e push (via libera separato): `deploy.yml` → CI, hosting, rules. Annotare il run id.
3. Controllare i run subito dopo il push: `gh run list --branch main --limit 5`, poi `gh run watch <id>` sul
   run "CI" e, a CI verde, su "Deploy to Firebase" (job `deploy-prod`). **Stop** se CI è rosso, se `deploy.yml`
   non parte entro qualche minuto dalla fine della CI, o se `deploy-prod` fallisce (limite indicativo: ~15
   minuti dal push; oltre, trattarlo come fallito).
   **Se CI di main fallisce o `deploy.yml` non parte:** hosting e rules prod restano alla versione vecchia
   (stato sicuro: le callable nuove sono compatibili con client e rules vecchi), ma la finestra A si
   prolunga (doppia voce audit su `client.deleted`). Prima scelta: **fix forward** su `dev` → nuovo merge su
   `main` (ripetere pre-flight sul fix). Il rollback delle functions **non** è richiesto. Dichiarare l'evento
   e la durata della finestra nel CHANGELOG; se `deploy-prod` fallisce a metà (hosting sì, rules no o
   viceversa) annotare quale layer è passato e rilanciare il run fallito (`gh run rerun <id>`) dopo il fix.

### Verifica post-deploy
- Console → Functions: callable attese presenti, nessun errore nei log (`cd functions && npm run logs`);
  `firebase functions:list` per conteggio e runtime (vedi Deploy 1).
- `audit_logs`: Console Firebase → Firestore (progetto `fitquest-60a09`) → collezione `audit_logs`, ordinata per
  `timestamp` decrescente: cercare voci con `env: functions` successive al deploy (creazione/eliminazione
  cliente, login fallito). Solo super_admin legge: non da client.
- Smoke test **in sola lettura** col super_admin su `rankex-admin`: login, lista org, dettaglio di una org PT e di
  una Soccer; mai salvare. Verificare le differenze di ambiente note (es. in prod la select modulo non offre
  Lipedema in "NUOVA" né nel dettaglio org).
- Client con build vecchia aperta: deve comparire il banner RICARICA.
- Costi Firebase in Console dopo 24 ore (vedi sotto).

---

## Monitoraggio costi Firebase

Piano Blaze, obiettivo 0 € (fascia gratuita). `rankex-dev` ha un budget con limite rigido a 1 € su Cloud Run
Functions (a 0 € il servizio veniva sospeso: deploy falliti con "Container Healthcheck failed"); immagini
funzioni in Artifact Registry cancellate dopo 1 giorno su entrambi i progetti. `onSnapshot` solo in
`features/client/useClient.js`; calendario e notifiche usano `getDocs` one-shot. Backup Firestore giornaliero
(7 giorni) solo su prod `fitquest-60a09`; un backup si ripristina sempre in un **nuovo** database.

Dettagli: docs/ARCHITECTURE-NOTES.md → Monitoraggio costi Firebase (Piano attuale, Dove controllare, Ottimizzazioni, Blaze, Backup Firestore)

## Roadmap futura

Evoluzioni pianificate non implementate (Avatar+Negozio, moduli org custom, ecc.); sezione di riferimento,
allinearsi con il team prima di iniziare. Stato reale: spike avatar parziale (`client.coins` solo da
`chiudiSessione`, `acquistaAvatar` transazionale, regole di sblocco in `avatars.config.js` + copia server).

Dettagli: docs/ARCHITECTURE-NOTES.md → Roadmap futura (Sistema Avatar + Negozio, Gamification avanzata, Gestione allenamento)
