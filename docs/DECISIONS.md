# Architecture Decision Log — RankEX

Log append-only delle decisioni tecniche non ovvie, gestito dal Tech Lead. Non è un
duplicato di CLAUDE.md — CLAUDE.md descrive lo stato attuale del sistema, questo file
registra *perché* si è arrivati a una decisione, per non doverla ridiscutere da zero
la prossima volta che sembra "strana".

Formato:

```
## [ADR-XXX] Titolo
**Data:**
**Contesto:**
**Decisione:**
**Alternative scartate:**
**Conseguenze:**
```

---

## [ADR-001] Obiettivi trainer — architettura
**Data:** 2026-09-14
**Contesto:** EPIC-004, prima feature nuova costruita da zero in questo processo (le
precedenti erano tutte verifiche). Nessun modello dati preesistente da cui partire.
**Decisione:**
- Subcollection `clients/{clientId}/goals/{goalId}`, non collection top-level — stesso
  pattern di `notes`, coerente con "dati specifici di un cliente vivono sotto il
  cliente".
- Scrittura via Cloud Function (`aggiungiObiettivo`/`annullaObiettivo`), non
  `updateDoc` diretto — anche se il dato in sé (target+scadenza) non è "sensibile"
  come XP/percentili, è lo stesso pattern già usato per le note (basso rischio ma
  comunque via callable) — seguito per coerenza, non per necessità stretta.
- **Achievement rilevato dentro `salvaCampionamento`**, non con un nuovo trigger o
  Cloud Function schedulata — il percentile è già calcolato lì server-side, verificare
  gli obiettivi attivi nello stesso batch evita di introdurre un secondo punto di
  scrittura sullo stesso dato e non richiede nuova infrastruttura (nessun cron/trigger
  esiste ancora nel progetto per questo genere di cosa).
- **`status: 'missed'` non è salvato**, calcolato al volo confrontando `deadline` con
  oggi (`utils/goals.js`) — evita un cron dedicato solo a marcare la scadenza. Trade-
  off accettato: un obiettivo scaduto resta `status: 'active'` in Firestore finché
  qualcosa non lo tocca di nuovo (achievement tardivo o annullamento manuale) — la UI
  lo mostra comunque come "Scaduto", quindi non è un problema per l'utente finale.
- **Notifica solo al client, non al trainer** — non è stata una scelta, è un vincolo:
  lo schema `notifications` (`{ clientId, message, ... }`) non ha mai supportato un
  destinatario trainer, è un concetto che semplicemente non esiste nell'infrastruttura
  attuale. Se in futuro serve, è un cambio di schema più ampio, fuori scope qui.
**Alternative scartate:** Cloud Function schedulata (pub/sub cron) per marcare i
`missed` — scartata per lo stesso motivo di "non introdurre infrastruttura nuova per
un problema risolvibile a lettura".
**Conseguenze:** se in futuro serve sapere "quanti obiettivi sono scaduti" con una
query Firestore diretta (es. per una dashboard aggregata), lo stato lazy non lo
permette — richiederebbe comunque un giro per scriverlo. Non è un problema per l'uso
attuale (lista per singolo cliente, calcolata client-side).

---

## [ADR-002] Avatar + Negozio — discovery senza implementazione
**Data:** 2026-09-14
**Contesto:** EPIC-005 (Sprint #3), il pezzo più grande della Roadmap futura. La
roadmap stessa impone "allinearsi con il team prima di iniziare" — vincolo esplicito
contro il partire diretti con codice, a differenza di EPIC-004/EPIC-006 dove la
specifica era già abbastanza chiara da poter procedere.
**Decisione:** fare solo discovery (valutazione Product Analyst + scoping tecnico
Tech Lead), zero codice scritto, indipendentemente dallo slancio delle sessioni
precedenti in questo stesso processo (Obiettivi, Runbook, TD-001/TD-002 erano tutti
scope chiaro e action-able da subito — questo non lo è).
**Perché non si procede comunque con un MVP ridotto:** a differenza di feature
precedenti dove "MVP più piccolo" era una scelta tecnica (es. Runbook: meccanismo
prima, contenuto dopo — poi il team ha scelto di fare entrambi insieme), qui il
blocco non è di complessità tecnica ma di **dipendenze esterne reali**: asset
grafici (nessun artista/budget noto), bilanciamento economia (richiede playtesting,
non stimabile), flusso B2B (richiede clienti org interessati, fuori dal controllo
dell'ingegneria). Costruire comunque uno scheletro tecnico senza queste risposte
produrrebbe codice che non si sa se verrà mai usato con contenuti reali — lo stesso
rischio di "costruita e mai raggiunta" che CLAUDE.md documenta già per Wearable/
ContextNav/ClientHUD (roadmap → Product Analyst, criterio esplicito).
**Conseguenze:** EPIC-005 resta in backlog, scoping pronto (`docs/BACKLOG.md` →
STORY-011/012/013) per essere ripreso non appena le domande aperte hanno risposta.
Non blocca gli sprint successivi — sono indipendenti.

---

## [ADR-003] Avatar + Negozio — spike tecnico, override esplicito di ADR-002
**Data:** 2026-09-14
**Contesto:** dopo ADR-002 (raccomandazione di non procedere), presentate 3 opzioni
all'utente via domanda esplicita — parcheggiare, rispondere alle domande aperte, o
spike tecnico senza arte reale. L'utente ha scelto lo spike, **con il rischio
esplicitamente segnalato** ("rischia di restare codice mai davvero raggiunto come già
successo a Wearable/ContextNav") visibile nell'opzione scelta.
**Decisione:** costruito uno spike che valida la meccanica economica (la parte
davvero incerta tecnicamente, per la mia stessa analisi in STORY-012) **senza**
inventare il sistema a 6 slot della visione completa, per cui non esiste arte — si
riusano le 9 immagini avatar già esistenti (`config/avatars.config.js`), con regole
di sblocco demo (livello/acquisto) applicate per suffisso id.
**Scope deliberatamente ridotto rispetto alla visione completa:**
- Monete guadagnate **solo** da sessione presente (`chiudiSessione`) — non da
  rank-up/achievement/streak come nella visione completa, per limitare la superficie
  di modifica a una sola Cloud Function invece di quattro nello spike.
- Nessuna collection `avatar_modules` — regole di sblocco in config (client +
  copia server minimale `avatarUnlocks.js`), non un catalogo gestibile da super_admin.
- Nessun flusso B2B org-custom — resta genuinamente bloccato su una org cliente
  reale, lo spike non lo risolve né tenta di farlo.
**Verificato dal vivo, non solo per lettura di codice:** script one-off contro
rankex-dev (auth REST + invocazione diretta della callable) — rifiuto corretto per
avatar non acquistabile, rifiuto corretto per Monete insufficienti, acquisto riuscito
con decremento Monete e inventario aggiornato, doppio acquisto bloccato
(`already-exists`). Dati di test ripuliti dopo la verifica.
**Conseguenze:** se questo spike non porta a validazione reale (playtest, feedback,
decisione su arte/B2B), è candidato esplicito a rimozione come codice morto in un
futuro audit — esattamente il rischio segnalato in fase di scelta, non nascosto.

---

## [ADR-004] Log dei login falliti — Cloud Function dedicata, non regola Firestore pubblica
**Data:** 2026-09-14
**Contesto:** STORY-017 (EPIC-007, P0), bloccata in attesa di questa decisione. Bug reale
confermato leggendo il codice: `src/features/auth/useLoginForm.js` (riga 28) chiama
`auditLog(AUDIT_ACTIONS.LOGIN_FAILED, { email })` nel catch di un login fallito, ma
`src/utils/auditLog.js` (righe 37-38) fa `return` immediato se `getAuth(app).currentUser`
è `null` — condizione **sempre vera** nell'istante esatto in cui un login è appena
fallito (nessun utente autenticato esiste ancora, né mai esisterà per quel tentativo).
Risultato: zero entry `auth.login_failed` sono mai state scritte, senza che nulla lo
segnali (nessun errore, nessuna eccezione) — lo stesso tipo di "codice che sembra fare
la cosa giusta ma non scrive nulla" già incontrato altrove in questo progetto (vedi
CLAUDE.md → copie speculari, `LOG_MAX_ENTRIES` 20/200). Tre opzioni erano sul tavolo:
(a) regola Firestore che permette `create` non autenticato su `/audit_logs/{logId}`
solo per `action == 'auth.login_failed'`; (b) Cloud Function callable dedicata che
scrive via Admin SDK; (c) instradare l'evento a Cloud Logging invece che a Firestore.

**Decisione:** Opzione (b). Nuova Cloud Function callable `registraLoginFallito`
(region `europe-west1`, stesso pattern delle altre 34 callable — nome in **italiano**
per coerenza con tutte le esistenti, non `logFailedLogin` come nell'esempio testuale
dell'AC), invocabile **senza richiedere autenticazione** (per definizione, chi la chiama
non ha un utente valido in quel momento). Contratto:
- ignora qualunque campo `action` inviato dal client — lo **hardcoda server-side** a
  `'auth.login_failed'`; un chiamante non autenticato non può quindi mai scrivere
  un'azione diversa, requisito esplicito dell'AC della story;
- valida `email` lato server (stringa non vuota, lunghezza ragionevole, forma email
  plausibile) prima di scriverla — nessun altro campo libero accettato dal client;
- scrive direttamente in `/audit_logs` con l'Admin SDK, che bypassa `firestore.rules`
  per definizione (CLAUDE.md → "Backend — Cloud Functions callable": "l'Admin SDK le
  bypassa sempre"). **Nessuna modifica a `firestore.rules` è necessaria per questa
  story** — vedi Conseguenze per l'impatto su STORY-015;
- guardrail minimo anti-abuso: una query prima della scrittura nega/nooppa se la stessa
  email normalizzata ha già prodotto una entry negli ultimi N secondi (es. 10-30s) —
  non ferma un attaccante che ruota email casuali/distribuite, ma riduce il caso più
  economico da eseguire (spam sulla stessa email) al costo di una lettura invece di una
  scrittura per i tentativi in eccesso. Rischio residuo accettato, vedi Conseguenze.

`AUDIT_ACTIONS.LOGIN_FAILED` resta come costante (tipizza il valore in tutto il resto
del codice), ma il percorso di scrittura per questo solo evento cambia rispetto al
pattern standard: **tutte le altre 34 usecase seguono "callable riesce → il client
chiama `auditLog()` per loggare"** (vedi `createClientUseCase.js`); qui è invertito —
è la Cloud Function stessa a scrivere l'entry con l'Admin SDK, perché nel momento in
cui va scritta non esiste alcun utente autenticato lato client che possa farlo. Va
lasciato un commento esplicito in `useLoginForm.js` che spiega perché `LOGIN_FAILED`
non passa da `auditLog()` come tutto il resto — per non ricreare in negativo lo stesso
tipo di trappola silenziosa che questa story stessa risolve.

**Alternative scartate:**
- **(a) Regola Firestore pubblica.** Scartata. Una `create` non autenticata su una
  collection top-level, anche vincolata a un solo valore di `action`, resta una
  scrittura pubblica illimitata nel database primario dell'app. Le Firestore rules non
  hanno alcuna nozione di IP o frequenza di chiamata — non possono implementare un vero
  rate limit — quindi l'unico argine reale è la quota giornaliera del piano. Se il
  progetto fosse su Spark, uno script banale esaurirebbe le 20.000 scritture/giorno
  (quota **condivisa con tutta l'app**, non solo l'audit log) e bloccherebbe ogni
  scrittura legittima per il resto della giornata — un DoS gratuito per l'attaccante.
  Le 34 Cloud Function v2 già in produzione richiedono però il piano Blaze per essere
  deployabili (vincolo noto di Firebase, indipendente da questo progetto) — quindi RankEX
  è quasi certamente già su Blaze, nel qual caso il rischio non è "quota esaurita" ma
  "costo diretto illimitato", peggiore. In più, (a) avrebbe richiesto di toccare
  `firestore.rules` — file "da modificare con estrema cautela" — per introdurre la
  prima scrittura non autenticata mai esistita in questo ruleset, esattamente mentre
  STORY-015 lavora per *restringere* la stessa regola: le due direzioni sarebbero state
  in tensione diretta nello stesso file nello stesso sprint.
- **(c) Cloud Logging.** Tecnicamente valido e fuori dalle quote Firestore, ma
  frammenta la fonte di verità della sicurezza in due sistemi diversi (Firestore
  `audit_logs` per tutto il resto, Cloud Logging solo per i login falliti) — per lo use
  case esplicito "rilevare pattern di brute-force" un super_admin dovrebbe correlare
  due console diverse invece di una singola collection. Richiede anche nuova
  infrastruttura di consultazione: oggi **nessuna UI in-app legge `audit_logs`** — l'unico
  modo di verificarlo è manuale via Firebase Console (vedi `config/runbook.config.js`,
  caso di verifica del LOGOUT) — costruire un accesso a Cloud Logging (permessi IAM,
  query via `@google-cloud/logging`) sarebbe uno sforzo sproporzionato per una story P0
  di sprint, e comunque rimandabile: se in futuro serve un vero sistema anti-brute-force
  (rate limiting per IP, blocco temporaneo account), Cloud Logging + Cloud Armor/Identity
  Platform è la scelta giusta — ma non è ciò che questa story chiede oggi.

**Conseguenze:**
- **STORY-015 e STORY-017 si disaccoppiano.** STORY-017 non tocca `firestore.rules` —
  decade quindi il vincolo "stesso PR/deploy" ipotizzato in `docs/SPRINT.md`/
  `docs/BACKLOG.md` (scritto assumendo l'opzione (a)). Ho aggiornato `docs/BACKLOG.md`
  di conseguenza; le due story procedono e deployano in modo indipendente.
- Le entry scritte da questa Cloud Function avranno **`uid: null`** — nessun utente
  autenticato esiste al momento del fallimento, a differenza di ogni altra entry di
  `audit_logs`, che ha sempre un `uid` reale. È una variazione di schema legittima ma
  da tenere presente se in futuro si costruisce una UI di consultazione dell'audit log.
- Il rate limit per-email non protegge da un attaccante che usa email casuali/distribuite
  — rischio residuo accettato per ora, stessa filosofia già applicata alla rimozione di
  App Check (CLAUDE.md → Sicurezza: "complessità senza beneficio reale" finché non c'è
  evidenza di abuso reale). Se in futuro si osserva abuso concreto su questo endpoint
  specifico, va rivalutato un guardrail più forte (es. App Check applicato alla sola
  callable, non reintrodotto globalmente) — non da costruire preventivamente oggi.
- Nuovi file: `functions/src/callable/registraLoginFallito.js`,
  `usecases/registraLoginFallitoUseCase.js`, export aggiunto in `functions/src/index.js`
  — stesso pattern delle altre 34 callable, nessuna nuova categoria di infrastruttura.
- Non essendoci oggi alcun harness di test per le Cloud Functions (`firebase-functions-test`
  è una devDependency mai usata — zero file `*.test.js` sotto `functions/`), la
  verifica segue lo stesso precedente già usato per lo spike Avatar (ADR-003): uno
  script one-off contro `rankex-dev`, non una nuova suite Mocha/emulatore da zero.
  Aggiunto anche un caso al runbook manuale (`config/runbook.config.js`), stesso
  pattern già usato per verificare LOGOUT — coerenza con la disciplina EPIC-006.

<!-- Nuove decisioni aggiunte qui dal Tech Lead -->

---
## [ADR-006] Lipedema Edition — nome tecnico del moduleType e collocazione dell'"edizione"
**Data:** 2026-10-24
**Contesto:** EPIC-010 (STORY-030). L'utente ha deciso un terzo `moduleType` a livello
org; resta da scegliere il nome tecnico tra `lipedema` e uno generico (es. `clinical`).
Nota di numerazione: questo file su `feature/mobile-app` ha ADR-004/005 diversi
dall'ADR-004 presente su `dev` ("Log dei login falliti"). ADR-006 e seguenti sono
liberi su entrambi i rami (vedi TD-004).
**Decisione:**
- `moduleType: 'lipedema'`, costante `MODULES.LIPEDEMA` in `config/modules.config.js`.
- "Lipedema Edition" è **solo l'etichetta commerciale** del modulo (label in
  `MODULE_OPTIONS`, vedi ADR-007). Non diventa un campo Firestore né un concetto
  separato (niente `edition`, niente `org.variant`). Stesso trattamento di "Soccer
  Academy".
- ID tecnici dei test con prefisso `lipedema_`. I docx ne suggeriscono due
  (`lipedema_2mwt`, `lipedema_30s_sts`); per gli altri tre fisso io:
  `lipedema_handgrip`, `lipedema_hhd_quadriceps`, `lipedema_ols`.
**Alternative scartate:**
- `clinical` generico: promette un riuso per altre patologie che oggi non esiste. Ogni
  modulo RankEX è una batteria di test fissa più una terminologia, e un'altra patologia
  avrebbe batteria, popolazione e regole di privacy proprie, quindi un modulo
  diverso comunque. Dopo il refactor a capability (ADR-007) aggiungere un quarto modulo
  costa una voce di config, quindi non serve un nome "aperto" per prepararsi.
- `clinical` + campo `edition: 'lipedema'`: mette due assi (modulo ed edizione) dove
  ne basta uno, e raddoppia le combinazioni da testare.
**Conseguenze:** il valore `lipedema` finisce in `organizations/{orgId}.moduleType` e
in `users/{uid}.moduleType` (copiato da `creaMembroTeam`). Rinominarlo dopo il primo
deploy richiederebbe una migrazione dati, quindi va considerato definitivo.

---

## [ADR-007] `getModule()` a capability esplicite, default restrittivo, inventario superfici
**Stato:** parzialmente rivisto da ADR-015 (§5 terminologia calendario, §6 cambio modulo)
**Data:** 2026-10-24
**Contesto:** EPIC-010 (STORY-030/031). Oggi `getModule()` restituisce `isSoccer` più
due capability definite per negazione (`hasCategories`/`hasBia: moduleType !==
SOCCER_ACADEMY`), e `getTerminology()` ricade su PT. Diversi file deducono "è soccer"
da `client.categoria` invece che dal modulo. Un terzo modulo erediterebbe in silenzio
tutto il comportamento PT (rank, categorie, percentili). Inventario fatto con `git grep`
sul tree di **`dev`** (= main = prod), non su `feature/mobile-app` che è 29 commit
indietro.
**Decisione:**
1. **Mappa di capability per modulo** in `config/modules.config.js`
   (`MODULE_CAPABILITIES`), con ogni flag dichiarato per ogni modulo, mai ricavato per
   negazione:
   ```
                      personal_training  soccer_academy  lipedema
   hasRank                   true             true         false
   hasGamification           true             true         false   // XP, livelli, streak, Monete, badge
   hasPercentileTests        true             true         false   // campionamenti[]/stats
   hasAssessments            false            false        true    // valutazioni ADR-009
   hasCategories             true             false        false
   hasPlayerRoles            false            true         false
   hasProfileTypes           true             false        false   // tests_only/bia_only/complete + upgrade
   hasBia                    true             false        true
   hasGoals                  true             true         false
   hasGroupRanking           true             true         false   // Classifica/Campioni/Confronto/Analisi
   hasWearable               true             true         false
   hasClientLogin            true             true         false   // account Auth del cliente (ADR-010)
   ```
   `getModule(moduleType)` restituisce `{ moduleType, ...caps, isSoccer }`. `isSoccer`
   resta come alias derivato (`moduleType === SOCCER_ACADEMY`) solo per le
   ramificazioni davvero soccer-specifiche (fasce, ruoli, branding PDF). Va vietato
   (regola in code review) l'uso di `!isSoccer` per dire "è PT".
2. **Default per un modulo sconosciuto:** `getModule('qualcosa')` restituisce
   `RESTRICTED_CAPABILITIES`, cioè tutti i flag `false`, più un `console.warn` in dev.
   Non restituisce PT. Il caso legacy `moduleType` assente (`null`/`undefined`) resta
   mappato **esplicitamente** su PT nei punti in cui l'org entra nell'app
   (`TrainerView.jsx:15`, `OrgAdminView.jsx:25`, `OrgDetailView.jsx:45`, già così), non
   dentro `getModule`. `getTerminology` mantiene il fallback PT: per un modulo
   sconosciuto il problema sono le capability, non le parole.
3. **Etichette e opzioni centralizzate:** `MODULE_OPTIONS = [{ value, label }]` in
   `modules.config.js`. Oggi `MODULE_LABELS` è duplicato in 5 file (AdminDashboard,
   OrgsPage, OrgDetailView, OrgSettingsPage, CreateOrgForm), più un ternario in
   OrgDashboard. Senza centralizzare, il terzo modulo andrebbe aggiunto in 6 punti.
4. **Terminologia `lipedema`:** `trainer: 'Professionista'`, `client: 'Paziente'`,
   `clients: 'Pazienti'`, `group/groups: 'Gruppo/Gruppi'`, più due chiavi nuove
   `assessment/assessments: 'Valutazione/Valutazioni'`. Il valore di
   `session/sessions` (il calendario) resta **aperto per l'utente/UX**: se lo
   chiamiamo "Valutazione", la parola indicherebbe sia l'appuntamento in calendario
   (che include anche le sedute di allenamento, visto che la scheda è in scope) sia il
   record dei test. Proposta: "Seduta"/"Appuntamento". La concordanza di genere
   ("la Paziente") segue il meccanismo già introdotto da STORY-027.
5. **Server:** nuovo `functions/src/shared/modules.js`, copia minima della mappa
   (soltanto `hasGamification`, `hasPercentileTests`, `hasAssessments`, `hasBia`,
   `hasGoals`, `hasProfileTypes`, `hasClientLogin`). Lato server un `moduleType`
   sconosciuto e non nullo **lancia** `failed-precondition` invece di degradare: è un
   dato corrotto, va visto. `null` diventa PT (legacy). Il test di parità in
   `src/__tests__/parity/clientServerParity.test.js` deve coprire anche questa mappa.

**Inventario e modifica prevista per file (tree `dev`):**
| File | Oggi | Cambia in |
|---|---|---|
| `config/modules.config.js` | `isSoccer` + negazioni | capability, `LIPEDEMA`, terminologia, `MODULE_OPTIONS` |
| `admin-pages/CreateOrgForm.jsx` | 2 opzioni hardcoded + `TERMINOLOGY_BY_MODULE` | `MODULE_OPTIONS`, variante `lipedema` |
| `admin-pages/OrgDetailView.jsx` | label + select modulo libera | label; **cambio modulo da/verso `lipedema` bloccato se `clientCount > 0`** (i dati non sono convertibili) |
| `admin-pages/OrgsPage.jsx`, `AdminDashboard.jsx` | label + conteggio pt/soccer | label, conteggio per ogni modulo |
| `org-pages/OrgSettingsPage.jsx`, `OrgDashboard.jsx` | label / ternario `'Soccer':'PT'` | label da config |
| `trainer/ClientsPage.jsx`, `useClientFilters.js` | filtro Categoria/Ruolo per `isSoccer`, sort per media | filtro solo con `hasCategories \|\| hasPlayerRoles`, sort media/rank solo con `hasRank` |
| `clients-page/ClientCard.jsx` | categoria se `!isSoccer`, rank/XP sempre | categoria con `hasCategories`, rank/XP/livello con `hasRank`/`hasGamification` |
| `trainer/NewClientView.jsx`, `new-client-wizard/useWizard.js`, `wizard.config.js`, `WizardProgress.jsx` | `isSoccer` boolean, step account sempre | `getWizardSteps(caps, profileType)`, flusso lipedema senza step account (ADR-010) |
| `trainer/TestGuidePage.jsx` | soccer vs "tutto il resto" | terzo ramo `hasAssessments` → guida dei 5 test lipedema |
| `trainer-calendar/CloseSessionModal.jsx` | preview "+XP · streak" | preview solo con `hasGamification` |
| `groups-page/groupDetailIcons.jsx` (TABS), `GroupDetailView.jsx`, `GroupManageTab.jsx` | 6 tab fisse, rank in gestione | Classifica/Analisi/Confronto solo con `hasGroupRanking`; rank nascosto |
| `groups-page/GroupReportPrint.jsx` | branding `isSoccer`, classifiche | assente in lipedema v1 (decisione UX in STORY-040) |
| `client/ClientDashboard.jsx` | `isSoccer` da `client.categoria` (riga 90), rank BIA | caps da `useTrainerState().moduleType`; niente rank; reset password solo se `client.clientAuthUid` |
| `client-dashboard/ClientDashboardHeader.jsx` | TABS con solo `requiresTests` | ogni tab dichiara la capability richiesta (`test`→`hasPercentileTests`, `valutazioni`→`hasAssessments`, `obiettivi`→`hasGoals`, `trofei`/`attivita`→`hasGamification`, `wearable`→`hasWearable`) |
| `client-dashboard/AtletaTab.jsx`, `client/ClientBadges.jsx`, `bia-view/BiaSummary.jsx` (prop `rank`) | rank/XP/rank BIA | riepilogo paziente senza rank/XP |
| `client-dashboard/ClientReportPrint.jsx` | `isSoccerCat(client.categoria)` | non usato in lipedema: report dedicato (STORY-040) |
| `bia/useBia.js` | `buildBiaUpdate` applica xp/log ottimistici | in lipedema aggiorna solo `lastBia`/`biaHistory` |
| `features/client/**` (area cliente) | — | nessuna modifica: non raggiungibile senza account cliente (ADR-010) |
| `config/runbook.config.js` | — | nuova suite `lipedema` (ADR-014) |

Non montati nel modulo, quindi nessuna modifica interna: `XPTrendChart`, `TrophiesSection`,
`GoalsSection`, `WearableSection`, `GroupLeaderboard`/`Champions`/`Comparison`/`Analysis`,
`campionamento-modal/*`, `StatsChart`, `Pentagon`.
**Alternative scartate:**
- Aggiungere un `isLipedema` accanto a `isSoccer`: dopo due moduli diventa una catena
  di `if`, e il quarto modulo ricadrebbe di nuovo su "tutto il resto = PT".
- Default PT per un modulo sconosciuto (comportamento attuale): è il rischio che
  l'epic stessa segnala. Con il default restrittivo, al peggio una feature manca,
  invece di comparire dove non deve.
**Conseguenze:** `modules.config.test.js` deve fare un test tabellare su tutti e 3 i
moduli, più uno sconosciuto e `null`. L'inventario sopra è la checklist di code review
per STORY-030/031. Ogni file non elencato che in futuro ramifica per modulo deve usare
una capability.

---

## [ADR-008] Gamification OFF garantita lato server
**Stato:** parzialmente rivisto da ADR-015 (§1: nessun gate di consenso su salvaBia; vale il blocco "informativa")
**Data:** 2026-10-24
**Contesto:** STORY-031. L'AC chiede che il blocco non sia aggirabile chiamando le
callable direttamente. Oggi nessuna callable conosce il modulo, a parte `creaMembroTeam`
(che lo copia soltanto). Dal 23/10 su `dev` i trofei automatici sono server-side
(`shared/badges.js` → `autoBadgeFields`, dentro `chiudiSessione` e
`salvaCampionamento`) e `useBadges` non assegna più nulla lato client.
**Decisione:** ogni callable interessata legge **`organizations/{orgId}.moduleType`
server-side**, già validato da `requireOrgAccess`, e risolve le capability con
`shared/modules.js`. Mai da un parametro del client.
| Callable | Comportamento con `hasGamification:false` / modulo lipedema |
|---|---|
| `chiudiSessione` | legge l'org nella transazione (1 lettura in più); scrive slot `status`/`attendees`/`absentees` e l'avanzamento `completedSessions` della scheda attiva (tracciamento, non gioco). **Non tocca il doc paziente**: niente xp, level, log, sessionStreak, sessionCount, coins, badge, né il bonus `PLAN_COMPLETION_XP` |
| `salvaXP` | rifiuta con `failed-precondition` |
| `salvaBia` | scrive solo `lastBia`/`biaHistory`: niente xp, log, notifica XP. Il gate consenso (ADR-013) si applica qui se la decisione legale ci fa ricadere la BIA |
| `salvaCampionamento` | rifiuta (`hasPercentileTests:false`). Le valutazioni passano dalla callable dedicata (ADR-009) |
| `aggiornaProfiloCliente` | rifiuta (`hasProfileTypes:false`) |
| `aggiungiObiettivo` / `annullaObiettivo` | rifiutano (`hasGoals:false`) |
| `creaCliente` | nessun default di gamification nel doc (ADR-010) |
| `acquistaAvatar` | già impossibile (richiede `role: 'client'`, che in lipedema non esiste). Aggiungere comunque il check di modulo, costa 3 righe e protegge se un giorno arriva il login paziente |
| `recalcolaCampionamenti` | salta i clienti delle org lipedema (oggi sarebbe un no-op, perché non hanno `campionamenti`; il salto lo rende esplicito) |
Le notifiche XP/rank/streak non partono perché le callable le creano solo se
`client.clientAuthUid` esiste (ADR-010), e in più perché le scritture sopra non
avvengono.
**Residuo accettato:** la rule `clients/{id}` update permette ancora a
trainer/org_admin di scrivere direttamente `badges`/`badgeShowcase` (assegnazione
manuale da `TrophiesSection`). In lipedema la UI non monta la sezione, ma una scrittura
da console resta possibile. Non attraversa nessun confine di sicurezza: è un membro
fidato che modifica un campo cosmetico della propria org, e quel campo non viene mai
mostrato nel modulo. Renderlo impossibile richiederebbe un `get()` dell'org in ogni
update cliente. Tracciato in TD-005.
**Alternative scartate:**
- Flag `gamification: false` passato dal client nella chiamata: aggirabile per
  costruzione.
- `moduleType` letto da `users/{uid}` del chiamante: è una copia denormalizzata scritta
  alla creazione del membro, e diventa stale se super_admin cambia il modulo dell'org.
  La fonte di verità è l'org.
- Trigger `onDocumentUpdated` che azzera xp/coins a posteriori: corregge invece di
  prevenire, introduce scritture doppie e lascia una finestra in cui il dato è
  sbagliato.
**Conseguenze:** callable da ridistribuire su entrambi i progetti
(`cd functions && npm run deploy:dev`, poi `npm run deploy`), prima dell'hosting che
espone il modulo. Una lettura in più dell'org nelle callable sopra, trascurabile. Il
caso runbook "chiamata diretta a salvaXP su paziente lipedema → errore" diventa
verificabile con uno script one-off come quello già usato in ADR-003.

---

## [ADR-009] Modello dati delle valutazioni Lipedema
**Stato:** parzialmente rivisto da ADR-015 (§3 un solo documento, niente assessmentHealth; §7 2MWT a tratti; Test 04/05) e da ADR-016 (schema `trials[]` e `result` dei test 02/03/04/05, `rawValue/rawUnit` → `nativeValue/nativeUnit`, niente `notExecutedReason`)
**Data:** 2026-10-24
**Contesto:** STORY-033…038. Il modello attuale `campionamenti[]` + `stats: { stat:
percentile }` (array nel doc cliente) non regge prove grezze multiple, prove
bilaterali, metadati di protocollo, deviazioni, valori nativi più convertiti, né la
separazione dei dati sanitari. I 5 docx usano naming diversi tra loro (snake_case,
PascalCase, `OLS_R_trial1_s`): come previsto dal backlog lo unifico qui.
**Decisione:**
1. **Struttura dedicata, non riuso di `campionamenti`.** Nuove subcollection del
   paziente, con path helper in `firebase/paths.js`:
   ```
   assessmentsPath(orgId, clientId)      → organizations/{orgId}/clients/{clientId}/assessments
   assessmentHealthPath(orgId, clientId) → organizations/{orgId}/clients/{clientId}/assessmentHealth
   consentsPath(orgId, clientId)         → organizations/{orgId}/clients/{clientId}/consents   (ADR-013)
   ```
   **Un documento per singolo test eseguito**, non uno per visita. Ogni test ha il suo
   `protocolVersion`, viene annullato singolarmente (ADR-011) e il trend è per test. La
   "Valutazione" come visita (1–5 test nella stessa occasione) è rappresentata da un
   `visitId` comune, generato dal server: nessun documento padre.
2. **Schema `assessments/{assessmentId}`**, camelCase come il resto del codebase:
   ```js
   {
     testId,            // 'lipedema_2mwt'|'lipedema_30s_sts'|'lipedema_handgrip'|'lipedema_hhd_quadriceps'|'lipedema_ols'
     protocolVersion,   // '1.0' (Test 05: vedi questioni aperte)
     visitId,           // raggruppa i test della stessa visita
     performedAt,       // 'YYYY-MM-DDTHH:mm' ora locale Europe/Rome (i docx chiedono data+ora)
     examinerId,        // uid dal token, impostato dal SERVER, mai dal client
     examinerName,      // denormalizzato
     patientAgeYears,   // snapshot età alla data (i docx 03/04 elencano Sex/Age)
     status,            // 'valid' | 'voided'                       (ADR-011)
     outcome,           // 'complete' | 'stopped_early' | 'invalidated'
     setup:  { ... },   // condizioni di esecuzione, per test, vedi sotto
     trials: [          // TUTTE le prove inserite, valide e non valide, nell'ordine di esecuzione
       { seq, side,     // seq 1..n; side 'R'|'L'|null (test monolaterali)
         valid,         // false = prova ripetuta per errore procedurale (docx 03/04/05)
         value,         // valore canonico: m | reps | N | s
         rawValue, rawUnit,   // valore e unità NATIVI dello strumento (03/04), = value/unità canonica altrove
         endReason,     // solo 05: 'foot_touch'|'support_used'|'stance_shift'|'subject_request'|'ceiling'
         ceiling,       // solo 05, calcolato dal server: value === 60.0
         notExecutedReason }  // lato non eseguibile (03/04/05)
     ],
     events: {          // eventi tecnici, NON sanitari
       familiarizationDone, pauseCount, pauseDurationS,
       stopTimeS,                 // 01/02 se outcome === 'stopped_early'
       usedArms, partialRepCounted, technicalError, technicalErrorNote },  // 02
     result: { ... },   // DERIVATO, calcolato SOLO dal server, vedi sotto
     comparability: { ... },  // snapshot dei parametri di comparabilità (ADR-012)
     deviation: { present, note },   // protocol_deviation + protocol_deviation_note
     notes,
     hasHealthData,     // true se esiste il doc gemello in assessmentHealth
     supersedes,        // assessmentId sostituito (ADR-011) | null
     createdAt, createdBy,
     voidedAt, voidedBy, voidReason, supersededBy,   // ADR-011
   }
   ```
   **`setup` per test:**
   - 01: `courseLengthM`, `lapLengthM` (default `2 × courseLengthM`: un giro =
     andata+ritorno, come da docx §16), `assistiveDevice`
     (`none|cane|crutch|rollator|other`) + `assistiveDeviceNote`
   - 02: `chairHeightCm` (default 43.2), `chairHasArmrests`, `armsCrossed`
   - 03: `dominantSide`, `device {brand, model, serial}`, `gripSetting`
   - 04: `dominantSide`, `device {...}`, `fixationMethod` (`belt|manual`), `kneeAngleDeg`
     (default 90), `hipAngleDeg` (in attesa dell'autore), `sensorPosition` (enum:
     `distal_anterior_tibia` + `other` con nota; un testo libero non sarebbe
     confrontabile), `contractionS` (in attesa dell'autore)
   - 05: `dominantSide`, `footwear` (`barefoot|shoes`), `surface` (enum), `maxDurationS: 60`

   **`result` per test (server-side):**
   - 01: `distanceM = round(fullLaps × lapLengthM + partialDistanceM)` (al metro, docx
     §11), `avgSpeedMs`, `durationS` (120 oppure `stopTimeS`). `fullLaps` e
     `partialDistanceM` sono il `trials[0]` (input conservati: `{ fullLaps,
     partialDistanceM }` dentro la prova)
   - 02: `repetitions`. Se `usedArms` → `repetitions: 0` e `outcome: 'invalidated'`
     (docx §19: CDC registra 0, RankEX registra anche il motivo)
   - 03/04: `rightBestN`, `leftBestN` (max delle prove **valide** per lato),
     `strongestSide`, `strongestN`, `weakestN`, `symmetryPct = weakest/strongest × 100`
     (null se manca un lato)
   - 05: `rightBestS`, `leftBestS`, `rightCeiling`, `leftCeiling`, `symmetryPct`

   La logica a "N prove per lato, alternate, best per lato" (03/04/05) è **una sola
   funzione pura** `computeBilateralBest(trials, { trialsPerSide, aggregate: 'max' })`,
   come chiede l'AC di STORY-036.
3. **Dati sanitari separati in `assessmentHealth/{assessmentId}`**, stesso id, scritto
   nella stessa operazione atomica (motivazione in ADR-013):
   ```js
   { testId, painScale: 'nrs_0_10',
     painPre, painPost, painRight, painLeft, trialPain: [{ seq, side, value }],
     dyspneaPre, dyspneaPost, fatiguePre, fatiguePost,          // Borg 0–10
     hrPreBpm, hrPostBpm, spo2PrePct, spo2PostPct,
     bpSysPre, bpDiaPre, bpSysPost, bpDiaPost,
     stopReasonCode, stopReasonNote,   // 01/02: i motivi di stop sono sintomi (dolore toracico, dispnea, capogiro)
     symptomsNote, conditionsNote,     // es. lipo-linfedema concomitante (docx 01 §27)
     createdAt, createdBy }
   ```
   Tutti i campi sono opzionali. Il `outcome: 'stopped_early'` e `stopTimeS` restano
   nel doc principale: servono a chi legge il trend per non confondere un dato
   incompleto con un calo, senza esporre il sintomo.
4. **Scrittura via Cloud Function, non `updateDoc` diretto.** Nuove callable
   `aggiungiValutazione` (accetta `visit: { performedAt, tests: [1..5] }`, scrive
   tutti i doc in un batch) e `annullaValutazione`, con usecases
   `addAssessmentUseCase.js` / `voidAssessmentUseCase.js`. La regola di CLAUDE.md
   ("Perché non tutte le scritture passano da qui") si applica: (a) il risultato
   derivato è "un calcolo che il client non deve poter falsificare", perché l'AC dice
   "calcolato dal sistema, non digitato, stessa regola a ogni salvataggio"; (b)
   `examinerId`/`createdAt` devono essere server-side, altrimenti la tracciabilità
   clinica non regge; (c) il gate consenso sui dati sanitari (ADR-013) deve stare
   dove il client non può saltarlo; (d) la scrittura principale e quella sanitaria
   devono essere atomiche; (e) l'immutabilità (ADR-011) si ottiene con `allow write:
   if false`, che vale solo se scrive l'Admin SDK. Letture dirette da nuovo
   `firebase/services/assessments.js` + hook `useAssessments(orgId, clientId)`.
5. **Lettura senza nuovi indici composti:** `getAssessments` legge tutta la
   subcollection del paziente ordinata per `performedAt` (indice single-field
   automatico) e raggruppa per test e stato lato client. Volume atteso: 5 test × poche
   visite l'anno, quindi poche decine di doc per paziente, nessun impatto sul piano
   Spark. Un `where('testId','==',…).orderBy('performedAt')` richiederebbe un indice
   composto senza un vero beneficio a questi volumi.
6. **Calcoli derivati duplicati client/server:** nuova coppia speculare
   `src/utils/lipedema.js` (preview prima del salvataggio, comparabilità per il trend)
   ↔ `functions/src/shared/lipedema.js` (fonte del valore salvato). Il client mostra,
   il server decide. Coperta dal test di parità esistente (ADR-014). Le label/guide
   dei test vivono solo in `config/lipedemaTests.config.js` (client), stesso principio
   di `testsMeta.js` che è volutamente minimale.
**Alternative scartate:**
- Riuso di `campionamenti[]` con `stats` "grezzi": la stessa chiave significherebbe
  percentile in PT/Soccer e valore grezzo in lipedema. `buildCampionamentoUpdate`,
  `StatsChart`, `ClientReportPrint`, `groupAnalysis.js` e i badge leggono `stats` come
  percentile, quindi ogni consumer andrebbe protetto. In più l'array nel doc cliente
  cresce senza limite e non permette rules diverse per i dati sanitari.
- Un doc per visita con i 5 test annidati: rende complicati l'annullamento del singolo
  test, il versioning per test e la query per trend.
- Scrittura diretta da `firebase/services/` con validazione nelle rules: le rules non
  possono calcolare un max su un array di prove né conversioni kgf→N, e non danno
  atomicità tra due documenti con rules diverse senza logica fragile.
**Conseguenze:** `eliminaCliente` su `dev` cancella le subcollection **per nome**
(`notes`, `goals`), non ricorsivamente sul doc. Le tre nuove subcollection resterebbero
orfane, con dati sanitari residui dopo una cancellazione GDPR. Decisione: in STORY-032
`eliminaCliente` passa a `clientRef.listCollections()` + `recursiveDelete` per ognuna,
così ogni subcollection futura è coperta senza ricordarsela, con test su emulatore
obbligatorio. Lo stesso vale per `eliminaOrganizzazione` (già `recursiveDelete(orgRef)`:
da verificare che copra i nipoti).

---

## [ADR-010] Paziente senza account Firebase Auth (v1)
**Stato:** parzialmente rivisto da ADR-015 (§1 attestazione informativa in creazione; §4 audit log senza nome)
**Data:** 2026-10-24
**Contesto:** STORY-032. `creaCliente` oggi richiede sempre email+password, crea
l'utente Auth e `users/{uid}` con `role: 'client'`, `mustChangePassword: true`. In v1 il
paziente non fa login.
**Decisione:**
- `creaCliente` legge già l'org (per il limite piano). Con `hasClientLogin: false`
  (server-side, ADR-007/008): **non** crea l'utente Auth, **non** scrive `users/{uid}`,
  non richiede password (la rifiuta se arriva), email **facoltativa** (se presente:
  validata nel formato, nessun vincolo di unicità). Scrive `clientAuthUid: null`. La
  scelta dipende solo dal modulo dell'org, mai da un flag del client.
- **Doc paziente minimale:** anagrafica (whitelist `ANAGRAFICA_FIELDS` dedicata:
  `name, dataNascita, eta, sesso, peso, altezza, email`), `misureHistory: []`,
  `biaHistory: []`, `lastBia: null`, `profileType: 'complete'` fisso (riusa il gating
  BIA esistente via `getProfileCategory`; l'upgrade è comunque rifiutato, ADR-008),
  `categoria: null`, `moduleType` **non** copiato. **Nessun** campo di gamification
  (`xp/level/xpNext/rank/rankColor/media/stats/campionamenti/log/sessionStreak/coins/
  avatarPurchased/badges`): l'AC di STORY-031 si verifica sui dati, e un campo assente
  non può essere mostrato per errore. `buildNewClient` non viene chiamato per il modulo.
- `clientCount` e limite piano: invariati (stesso batch `increment(1)`). STORY-032 AC
  "limite piano come negli altri moduli" è soddisfatto senza modifiche.
- `eliminaCliente`: gestisce già `clientAuthUid: null` (salta `users/` e
  `deleteUser`); serve solo il fix sulle subcollection di ADR-009.
- **Reset password:** il bottone in `ClientDashboardHeader` compare solo se
  `client.clientAuthUid`. Il criterio è il dato, non il modulo, quindi vale anche per
  eventuali clienti PT legacy senza account.
- `firestore.rules`: **nessuna modifica** per questo punto. `isOwnClient`/
  `isClientOfOrg` non sono mai veri senza `users/{uid}`, quindi il paziente non ha
  nessun accesso, che è il comportamento voluto.
- Notifiche: le callable le creano solo se `client.clientAuthUid`, e il trigger
  `onNotificationCreated` non trova token. Nessuna notifica orfana.
**Alternative scartate:**
- Account Auth "dormiente" con password casuale: crea credenziali valide per persone
  che non le hanno chieste, una superficie d'attacco in più su dati sanitari, e
  richiede un'email reale. No.
- Flag `withoutAccount` passato dal client: aggirabile, e incoerente con ADR-008.
**Conseguenze:** se in futuro arriva il login paziente, servirà una callable "attiva
accesso" che crea Auth + `users/{uid}` su un paziente esistente, e la rilettura di
tutte le rules `isOwnClient` sulle nuove subcollection (oggi le valutazioni non hanno
un ramo client). Fuori scope v1.

---

## [ADR-011] Correzione di una valutazione: annulla + reinserisci, mai modifica in place
**Data:** 2026-10-24
**Contesto:** STORY-033, AC esplicitamente "da decidere". I docx sono netti: "conservare
ogni prova e non sovrascrivere il dato originale" (02 §17), "audit, controllo qualità"
(03 §17).
**Decisione:**
- I doc `assessments` e `assessmentHealth` sono **immutabili** dopo la creazione. La
  correzione avviene con `annullaValutazione(orgId, clientId, assessmentId, voidReason)`
  (motivo obbligatorio, max 500 caratteri), che imposta `status: 'voided'`,
  `voidedAt`/`voidedBy` server-side, e poi con un nuovo `aggiungiValutazione` che può
  passare `supersedes: <id annullato>`. Il server scrive `supersededBy` sul vecchio doc
  nello stesso batch.
- Le valutazioni annullate restano nello storico (toggle "mostra annullate", default
  off) e sono escluse da trend, delta e PDF.
- **Nessuna cancellazione fisica dall'app.** Si cancella solo con `eliminaCliente`
  (cascata) o `eliminaOrganizzazione`. Rules: `allow create, update, delete: if false`
  su entrambe le subcollection (scrive solo l'Admin SDK).
- **Audit log:** `annullaValutazione` scrive in `audit_logs` l'azione
  `ASSESSMENT_VOIDED` con **soli identificativi** (`orgId, clientId, assessmentId,
  testId`), mai valori, motivo o note (possono contenere dati sanitari, vedi ADR-013).
  La creazione non va in audit: la tracciabilità è già nel doc (`createdBy/createdAt`)
  e loggare ogni salvataggio raddoppierebbe le scritture senza valore.
- Permessi: solo `org_admin`/`trainer` (`requireOrgAccess` esclude già
  `staff_readonly`). Qualunque professionista dell'org può annullare, non solo
  l'autore, coerente con le note.
**Alternative scartate:**
- Modifica in place con history array nel doc: la storia vive nello stesso documento
  che corregge, una rule sbagliata la cancella con la correzione, e il doc sanitario
  andrebbe versionato in parallelo.
- Delete + reinserimento: perde la traccia che un valore errato è esistito, ed è
  esattamente quello che i docx chiedono di non fare.
**Conseguenze:** un typo costa due azioni (annulla + reinserisci) invece di una. Per
ridurre l'attrito la UI può offrire "Correggi", che pre-compila il form con i valori
del doc annullato. Lo storico cresce di un doc per ogni correzione, trascurabile.

---

## [ADR-012] Regole di non comparabilità e precisione numerica
**Stato:** parzialmente rivisto da ADR-015 (§7 2MWT: niente lapLengthM; unità N/kgf confermate), da ADR-016 (§4 precisione/delta, §7 chiavi normalizzate del dispositivo, tolleranze, livello `info` rimandato a STORY-039, delta per lato) e da ADR-019 (badge "diversa dalla precedente", livello `info` del seriale, grafico a tratti)
**Data:** 2026-10-24
**Contesto:** STORY-036 (decimali dopo kgf→N) e STORY-039 (cosa rende due valutazioni
non confrontabili, seriale o modello).
**Decisione — comparabilità:** ogni doc salva in `comparability` lo snapshot dei
parametri sotto, calcolato dal server. Il confronto avviene sempre con la **precedente
valutazione `valid` dello stesso test** (e dello stesso lato). Due livelli di avviso:
`warning` ("non comparabile": il delta resta visibile ma marcato) e `info` ("possibile
differenza").
| Test | `warning` se differisce | `info` |
|---|---|---|
| tutti | `protocolVersion` | — |
| 01 | `courseLengthM`, `lapLengthM`, `assistiveDevice` | — |
| 02 | `chairHeightCm` (oltre ±0.5 cm), `chairHasArmrests`, `armsCrossed` | — |
| 03 | `device.brand`+`device.model`, `gripSetting` | `device.serial` diverso con stesso modello, o seriale mancante su una delle due |
| 04 | `device.brand`+`model`, `fixationMethod`, `kneeAngleDeg` (oltre ±5°), `sensorPosition`, `hipAngleDeg` (quando definito) | `device.serial` come sopra |
| 05 | `maxDurationS`, `footwear`, `surface` | — |
Dispositivo: **modello = criterio di comparabilità, seriale = informativo.** Lo
stesso modello produce valori comparabili tra unità diverse a meno di calibrazione; un
modello diverso no (docx 03 §21, 04 §21). Se l'autore dei protocolli chiede il seriale
come criterio bloccante, basta spostare una riga dalla colonna `info` alla colonna
`warning`.
**Stati che non sono "valori ordinari":** `outcome: 'stopped_early'` (01, ma anche
02 se interrotto), `'invalidated'` (02 con braccia), `ceiling` (05). Sono marcati nel
grafico, e **il delta non viene calcolato** se uno dei due estremi è
`stopped_early`/`invalidated` (mostrato "—" con il motivo). Con `ceiling` il delta è
mostrato con l'etichetta "≥ 60,0 s".
**Decisione — precisione:**
| Grandezza | Input | Salvato | Mostrato |
|---|---|---|---|
| 01 lunghezze | 0.1 m | come inserito | 0.1 m |
| 01 distanza | — | intero (m), arrotondato al metro (docx §11) | intero |
| 02 ripetizioni | intero ≥ 0 | intero | intero |
| 03/04 forza | `rawValue` con al massimo 2 decimali, `rawUnit ∈ {N, kgf}` | `value` in N **non arrotondato** (`raw × 9.80665` per kgf) + raw/unit nativi | N senza decimali; kgf con 1 decimale se l'unità nativa è kgf |
| simmetria | — | double non arrotondato | % con 1 decimale |
| 05 tempo | 0.1 s, `0 < x ≤ 60.0` (oltre 60.0 rifiutato) | 1 decimale; `ceiling = (x === 60.0)` dal server, non modificabile | 1 decimale |
I **delta si calcolano sui valori già arrotondati alla precisione di visualizzazione**,
così la differenza mostrata è sempre coerente con i due numeri mostrati. Il valore non
arrotondato resta disponibile per future analisi.
**Alternative scartate:**
- Seriale come criterio bloccante: con un dinamometro sostituito (guasto, centro
  diverso) tutto lo storico diventerebbe "non comparabile" per una differenza
  fisicamente minore di quella data dal fissaggio.
- Arrotondare N al salvataggio: rende impossibile ricostruire il kgf originale in modo
  esatto e accumula errore se si rifanno conversioni.
- Unità `lbf` (alcuni Jamar analogici mostrano kg/lb): i docx citano solo kgf. Non
  inclusa in v1; aggiungerla è una voce in `rawUnit` (domanda aperta per l'utente).
**Conseguenze:** soglie (±0.5 cm, ±5°) e lista dei parametri sono costanti nominate
in `utils/lipedema.js` (`COMPARABILITY_RULES`). La comparabilità si calcola lato client
al momento della lettura, da uno snapshot salvato dal server: non serve un mirror
server per la comparabilità, solo per i valori derivati.

---

## [ADR-013] Dati sanitari art. 9 — isolamento tecnico e consenso (parte tecnica di STORY-029)
**Stato:** SUPERATO da ADR-015 (base giuridica art. 9(2)(h): niente consents, niente isolamento staff_readonly)
**Data:** 2026-10-24
**Contesto:** STORY-029, bloccante per il rilascio in produzione. Oggi `staff_readonly`
legge tutto nell'org (`canRead` = membro qualunque). La BIA sul doc cliente è già
visibile a `staff_readonly` in PT, e l'utente ha scelto di dichiararlo nel DPA invece
di cambiare il codice (decisione del 24/10). Una restrizione solo in UI darebbe falsa
sicurezza (lezione RX-63).
**Decisione tecnica (mia):**
1. **Isolamento per documento, non per campo:** i campi sanitari opzionali vivono in
   `assessmentHealth/{id}` (ADR-009). Rules:
   ```
   match /assessments/{id}       { allow read: if canRead(orgId);  allow write: if false; }
   match /assessmentHealth/{id}  { allow read: if canWrite(orgId); allow write: if false; }
   match /consents/{id}          { allow read: if canWrite(orgId); allow write: if false; }
   ```
   `canWrite` = super_admin, org_admin, trainer, quindi esclude `staff_readonly` **anche
   in lettura Firestore diretta**, non solo in UI. È il pattern raccomandato in
   CLAUDE.md per RX-63. Se la decisione legale è "(a) staff_readonly vede tutto", si
   cambia una riga (`canWrite` → `canRead`) e nient'altro.
2. **Consenso registrato in app, gestito da callable:** `registraConsensoSanitario` /
   `revocaConsensoSanitario` scrivono un record append-only in `consents/{id}` (`type:
   'health_data'`, `action: 'granted'|'revoked'`, `informativaVersion`, `collectedAt`,
   `collectedBy` = uid dal token) e lo stato corrente denormalizzato
   `client.healthConsent = { status, informativaVersion, at, by }`. `healthConsent`
   **non** entra nella whitelist update diretto delle rules, quindi solo l'Admin SDK
   lo scrive.
3. **Gate server-side:** `aggiungiValutazione` (e `salvaBia` nelle org lipedema, se la
   decisione legale ci fa ricadere la BIA) rifiuta i dati sanitari se
   `healthConsent.status !== 'granted'` **letto dal server**. Il campo di applicazione
   del gate è una costante `CONSENT_SCOPE` in `shared/lipedema.js`, con **default
   conservativo** `'all_assessments'`: nessuna valutazione salvabile senza consenso.
   Se la decisione legale stabilisce che servono soltanto per i campi opzionali, si
   passa a `'health_fields_only'`. La revoca blocca le nuove scritture. I dati già
   salvati restano finché la decisione legale non dice altro.
4. **Niente dati sanitari nei log:** `audit_logs.details` contiene solo id (ADR-011).
   Le callable non fanno `console.log` del payload (solo `err.code`). `getFirebaseErrorMessage`
   lato client non riporta valori.
5. **PDF (STORY-040):** il componente di stampa legge `assessmentHealth` con le stesse
   rules. Uno `staff_readonly` non riceve quei documenti, quindi non può stamparli.
   Il vincolo è architetturale, non una condizione nel JSX.
**Cosa resta decisione legale dell'utente (non tecnica):**
- Base giuridica art. 9(2): (a) consenso esplicito oppure (h) finalità di cura da parte
  di un professionista sanitario soggetto a segreto. Dipende da **chi** sono i
  professionisti delle org (sanitari o no). Con (h) il consenso in app potrebbe non
  servire, ma il meccanismo resta utile come registro.
- **Se i valori grezzi dei test sono già dati relativi alla salute** in questo
  contesto clinico (secondo me probabile): decide `CONSENT_SCOPE`.
- **L'appartenenza stessa a un'org lipedema rivela la diagnosi:** nome del paziente
  più org = dato sanitario. Ne derivano conseguenze sul DPA, su chi è `staff_readonly`
  e sulla lista pazienti, che nessuna regola tecnica sulle valutazioni risolve.
- (a) o (b) per `staff_readonly`, anche per la **BIA** delle pazienti lipedema. Se (b),
  la BIA va spostata dal doc cliente in una subcollection: è lavoro aggiuntivo, oggi
  non stimato in STORY-032/033.
- Destino dei dati alla revoca (conservazione o cancellazione), versione e testo
  dell'informativa, eventuale DPIA (art. 35), aggiornamento di
  `docs/PRIVACY-POLICY-DRAFT.md` e del DPA.
- Note libere (`notes`, `deviation.note`, note paziente): possono contenere dati
  sanitari scritti dal professionista, e la tecnica non può impedirlo. Serve
  un'indicazione d'uso nell'informativa/formazione oppure si trattano come dati sanitari.
**Alternative scartate:**
- Campi sanitari nel doc `assessments` con filtro UI per ruolo: è falsa sicurezza,
  perché il doc arriva comunque al browser di `staff_readonly`.
- Rules field-level: Firestore non filtra campi in lettura, un doc si legge intero o
  non si legge.
- Cifratura applicativa dei campi: gestione chiavi sproporzionata per v1 su Spark, e
  non risolve la visibilità tra ruoli che hanno comunque bisogno della chiave.
**Conseguenze:** due letture per valutazione con dati sanitari (doc + gemello) per
chi ha `canWrite`. Modifica a `firestore.rules`, da deployare su `rankex-dev` e
`fitquest-60a09` (ADR-014). La parte tecnica può essere implementata e verificata su
`rankex-dev` prima della decisione legale. Il rilascio in prod di qualunque salvataggio
di valutazioni resta bloccato su STORY-029.

---

## [ADR-014] Lipedema — impatto su rules/indici/copie speculari/runbook, ordine di implementazione, rischi
**Stato:** parzialmente rivisto da ADR-015 (§8 rules, runbook, ordine, rischi)
**Data:** 2026-10-24
**Contesto:** riepilogo trasversale di EPIC-010 per pianificare sprint e deploy.
**Decisione:**
- **`firestore.rules`** (file "estrema cautela"): +3 match annidati sotto
  `clients/{clientId}` (ADR-013). Nessuna modifica alle whitelist esistenti, nessuna
  logica di modulo nelle rules (tutte le scritture lipedema passano dall'Admin SDK).
  Test su emulatore in `tests/rules/firestore.rules.test.js`: trainer legge
  entrambe, `staff_readonly` legge solo `assessments` e riceve PERMISSION_DENIED su
  `assessmentHealth`/`consents`, scrittura diretta negata a tutti. Deploy con `npm run
  deploy:rules:dev` poi `npm run deploy:rules`, **solo da un branch basato su `dev`**:
  `feature/mobile-app` contiene rules precedenti all'hardening P0 del 23/10, e
  deployarle da lì farebbe regredire la sicurezza in prod.
- **Indici** (`firestore.index.json` su `dev`; CLAUDE.md lo chiama
  `firestore.indexes.json`): **nessun nuovo indice** (ADR-009 §5).
- **Copie speculari nuove o toccate** (stesso rischio di LOG_MAX_ENTRIES 20/200):
  `shared/modules.js` ↔ `config/modules.config.js` (sottoinsieme di capability);
  `shared/lipedema.js` ↔ `utils/lipedema.js` (derivati, bilaterale, ceiling, conversione
  kgf, `CONSENT_SCOPE` solo server). Entrambe vanno aggiunte al test di parità
  `src/__tests__/parity/clientServerParity.test.js`, come condizione di DONE delle
  story. `shared/gamification.js`, `constants.js`, `plans.js`, `testsMeta.js`: **non
  toccati**, il gating avviene nelle callable. Ogni modifica a queste coppie richiede
  `cd functions && npm run deploy:dev` poi `npm run deploy`.
- **Piani SaaS:** nessuna modifica. `getPlanLimits`/`isAtClientLimit` valgono anche per
  il modulo (client: `NewClientView` schermata di blocco; server: `creaCliente`).
  `isAtTrainerLimit` invariato (`MembersPage` / `creaMembroTeam`).
- **`config/runbook.config.js`:** nuova suite `lipedema` con almeno: creazione org
  lipedema (super_admin), creazione paziente senza account, chiusura sessione senza
  variazioni dati paziente, chiamata diretta `salvaXP` → errore, salvataggio di
  ciascuno dei 5 test, annulla+reinserisci, avviso di comparabilità, `staff_readonly`
  senza dati sanitari (UI e lettura diretta), eliminazione paziente con verifica
  subcollection vuote. Più un utente di test `staff_readonly` su un'org lipedema in
  `TEST_USERS`.
- **Ordine di implementazione:**
  0. Branch da `dev` (non da `feature/mobile-app`). Riallineare la numerazione ADR (TD-004).
  1. **STORY-030:** capability, modulo, terminologia, `MODULE_OPTIONS`, admin. Più
     `shared/modules.js` e i check server di ADR-008, **nello stesso rilascio
     functions**: nessuna org lipedema deve esistere prima che le callable la
     riconoscano.
  2. **STORY-031:** gating UI per l'inventario di ADR-007, in parallelo a 3.
  3. **STORY-032:** `creaCliente` senza Auth, fix `eliminaCliente` con
     `listCollections`, wizard.
  4. **STORY-033:** infrastruttura (paths, service, hook, rules, callable
     aggiungi/annulla, `utils/lipedema.js` ↔ `shared/lipedema.js` + parità) **più la
     meccanica tecnica di STORY-029** (consents, gate). La decisione legale procede in
     parallelo dal giorno 1.
  5. **STORY-036** (infrastruttura bilaterale), in parallelo **STORY-034/035**
     (monolaterali, nessuna dipendenza da 036).
  6. **STORY-037/038** dopo 036 **e** dopo le risposte dell'autore (04: durata
     contrazione, angolo anca; 05: `protocolVersion`, dolore).
  7. **STORY-039** (trend + comparabilità) dopo 034–038, anche se il calcolo di
     comparabilità può nascere in 4 come funzione pura testata.
  8. **STORY-040** (PDF) dopo 039 e dopo la decisione legale.
  Ordine di deploy per ogni rilascio: functions dev → rules dev → hosting dev →
  verifica → functions prod → rules prod → merge `main` (hosting prod via CI).
**Rischi principali:**
1. **Dati sanitari orfani** dopo una cancellazione, se `eliminaCliente` non viene
   portato a `listCollections` (impatto alto: GDPR). Mitigazione in STORY-032, test su
   emulatore obbligatorio.
2. **Ereditarietà silenziosa PT** in un file non inventariato. Mitigazione: default
   restrittivo, test tabellare su 3 moduli, inventario come checklist di review, verifica
   a campione di "nessun testo percentile/rank/XP".
3. **Divergenza mirror** sui valori derivati (il client mostra X, il server salva Y).
   Mitigazione: test di parità come condizione di DONE.
4. **Deploy delle rules dal branch sbagliato**, con regressione dell'hardening P0.
5. **Cambio di modulo di un'org esistente con dati:** bloccato in UI se `clientCount
   > 0` (super_admin è fidato, ma l'errore sarebbe irreversibile).
6. **Blocco legale lungo** su STORY-029. Mitigazione: costruire e verificare tutto su
   `rankex-dev`. In prod restano rilasciabili solo le parti senza salvataggio di
   valutazioni.
7. **Ambiguità terminologica "Valutazione"** (calendario o test) e di genere: se non
   decisa prima di STORY-030, costa un secondo giro su tutte le stringhe.
8. Le functions non sono in CI (`deploy.yml` fa solo hosting+rules) e `functions/`
   non ha test: le nuove callable vanno verificate dal vivo su `rankex-dev` con
   script one-off (precedente: ADR-003).
**Alternative scartate:** iniziare dai test (034–038) prima dell'infrastruttura
capability/server. Si avrebbero dati salvati in org che le callable trattano ancora
come PT (XP accreditati su pazienti), da ripulire dopo.
**Conseguenze:** STORY-029 è un requisito di rilascio, non di sviluppo. Le story
034–038 restano bloccate in prod finché non è DONE.

---

## [ADR-015] Lipedema — revisione di ADR-007…014 dopo le decisioni dell'utente (base giuridica, visibilità, terminologia, default di protocollo)
**Data:** 2026-10-24
**Contesto:** l'utente ha risposto alle domande aperte lasciate da ADR-009…014. Il
file è append-only (precedente: ADR-003 supera ADR-002), quindi le parti cambiate sono
raccolte qui e gli ADR precedenti portano una riga `**Stato:**` che rimanda a questo.
Dove questo ADR contraddice uno precedente, vale questo.
**Decisioni dell'utente (input, non decise dal Tech Lead):** base giuridica art.
9(2)(h) (finalità di cura svolta da professionisti sanitari soggetti a segreto), non
il consenso. Nel modulo lipedema **tutto** è dato sanitario: anagrafica inclusa, perché
l'appartenenza all'org rivela la diagnosi. `staff_readonly` vede i dati sanitari.
Cancellazione su richiesta (art. 17), decisa dall'org titolare. Calendario =
"Appuntamento". Cambio modulo bloccato quando l'org ha pazienti. Default di protocollo
provvisori indicati sotto.
**Decisione (traduzione tecnica):**
1. **Niente gate di consenso; attestazione "informativa consegnata" come blocco
   leggero.** Sostituisce ADR-013 §2–§3 e la collection `consents`, che viene
   **eliminata dal design** (non serve un registro di revoche se il consenso non è la
   base del trattamento).
   - Campo sul paziente `client.privacyNotice = { informativaVersion, deliveredAt
     ('YYYY-MM-DD'), recordedBy (uid dal token), recordedAt }`, scritto **solo** via
     callable: nuova `registraInformativaPaziente`, oppure `creaCliente` se il wizard
     raccoglie l'attestazione già alla creazione (checkbox + versione, raccomandato).
     Non entra nella whitelist di update diretto delle rules.
   - Storico: ogni registrazione scrive in `audit_logs` l'azione
     `PRIVACY_NOTICE_RECORDED` con `{ orgId, clientId, informativaVersion }`. Basta come
     traccia di "quale versione e quando" senza una nuova collection. Una nuova
     versione dell'informativa si registra sovrascrivendo il campo.
   - **Blocco server-side:** `aggiungiValutazione` e `salvaBia` (solo org lipedema)
     rifiutano con `failed-precondition` se `privacyNotice` manca. In UI: banner sul
     paziente con l'azione "Registra informativa". È l'unico punto di controllo
     tecnico che abbiamo sull'obbligo informativo (art. 13), e costa una lettura già
     fatta nella stessa transazione.
   - **Non bloccati:** note, misure (`updateDoc` diretto, rules senza conoscenza del
     modulo), scheda, appuntamenti. Sono dati sanitari anche loro, ma bloccarli
     richiederebbe rules consapevoli del modulo (vedi TD-006). Il controllo copre le
     misurazioni cliniche strutturate, che sono il cuore del trattamento.
2. **Tutto è dato sanitario:** stessa base (h) e stesse regole di accesso per
   anagrafica, valutazioni, BIA, note. Conseguenze tecniche:
   - **`audit_logs` nelle org lipedema:** solo identificativi. `creaCliente` oggi mette
     `clientName` in `details` di `CLIENT_CREATED`: per il modulo lipedema va omesso,
     perché nome + org = diagnosi in un log letto da super_admin, cioè da RankEX
     responsabile del trattamento. Lo stesso vale per eventuali altri log futuri con
     nome paziente.
   - Callable senza `console.log` dei payload (ADR-013 §4 resta valido).
3. **Un solo documento per valutazione.** Sostituisce ADR-009 §3 e ADR-013 §1.
   `assessmentHealth` è **eliminata**: dolore/Borg/HR/SpO2/PA, `stopReasonCode`/
   `stopReasonNote`, `symptomsNote`, `conditionsNote`, `trialPain` vanno dentro
   `assessments/{id}` in un sotto-oggetto `clinical: { ... }`, raggruppato per
   leggibilità e non per sicurezza. Il campo `hasHealthData` sparisce. Non resta una
   ragione forte e diversa per tenere la separazione: il solo argomento rimasto (una
   futura vista paziente con meno dati) è ipotetico, e si risolverebbe comunque con un
   modello di accesso nuovo (ADR-010, Conseguenze). La BIA resta sul doc paziente,
   com'è.
4. **Cancellazione (art. 17) e fine rapporto:** nessuna "revoca" in app.
   - `eliminaCliente` resta lo strumento, eseguito quando lo decide l'org titolare. Il
     fix `listCollections()` + `recursiveDelete` (ADR-009, Conseguenze) è **P0**: con
     una sola subcollection nuova (`assessments`) il rischio di orfani resta identico.
     Serve un test su emulatore che verifichi zero documenti residui sotto il paziente
     e zero riferimenti in slot/ricorrenze/gruppi/schede.
   - Backup: su `fitquest-60a09` è attivo il backup giornaliero con retention di 7
     giorni (verificato il 24/10). Un paziente cancellato sparisce dai dati live
     subito, e dai backup entro 7 giorni. Da dichiarare nel DPA e nell'informativa.
     Nessuna azione tecnica: i backup non si editano.
   - Termine di risposta all'interessato (un mese, art. 12(3)): responsabilità
     dell'org, **nessun timer in app**. Niente cancellazione automatica a scadenza in
     v1. Un'eventuale retention policy per org è fuori scope.
   - `audit_logs` conserva dopo la cancellazione solo gli id (punto 2), quindi nessun
     dato identificativo sopravvive nei log.
5. **Terminologia `lipedema`** (completa ADR-007 §4): `session/sessions:
   'Appuntamento'/'Appuntamenti'`; `assessment/assessments: 'Valutazione'/
   'Valutazioni'` = solo il record dei test. Restano `trainer: 'Professionista'`,
   `client(s): 'Paziente/Pazienti'`, `group(s): 'Gruppo/Gruppi'`.
6. **Cambio modulo bloccato da/verso `lipedema` se ci sono pazienti** (sostituisce la
   sola guardia UI di ADR-007):
   - **Rules:** fattibile senza letture aggiuntive, perché `resource.data` è l'org
     stessa. Nel ramo `isSuperAdmin()` dell'update org va aggiunta la condizione: se
     `moduleType` è tra le chiavi modificate e il vecchio **o** il nuovo valore è
     `'lipedema'`, allora `resource.data.get('clientCount', 0) == 0`. PT ↔ soccer
     resta invariato. Va scritta come espressione booleana (niente `if` nelle rules).
   - **UI** (`OrgDetailView.jsx`): opzione `lipedema` disabilitata (o select
     disabilitata se l'org è già lipedema) con il motivo visibile, quando l'org ha
     pazienti. Per il controllo si usa il conteggio clienti reale già caricato dalla
     vista, non solo `clientCount`.
   - Limite noto: un'org legacy **senza** `clientCount` passerebbe la regola (`get`
     restituisce 0). Le org esistenti hanno il counter dal hardening di aprile/ottobre,
     e la UI controlla il conteggio reale, quindi il caso è residuale. Non serve una
     callable.
7. **Default di protocollo provvisori** (tutti `protocolVersion: '1.0'`, da
   ricontrollare con l'autore):
   - **2MWT** (sostituisce `lapLengthM` di ADR-009 e ADR-012): l'operatore inserisce i
     **tratti completi cono→cono** (`fullLengths`) e la `partialDistanceM`. `distanceM
     = round(fullLengths × courseLengthM + partialDistanceM)`. Validazioni:
     `courseLengthM > 0`, `fullLengths ≥ 0` intero, `0 ≤ partialDistanceM <
     courseLengthM`. `courseLengthM` sempre salvato. `lapLengthM` sparisce dallo schema
     e dai criteri di comparabilità di ADR-012 (resta `courseLengthM`).
   - **Unità forza:** solo `N` e `kgf` (confermato, niente `lbf` in v1).
   - **Test 04:** contrazione massimale ~3 s, allineata al Test 03; `setup.contractionS:
     3` di default e registrato. Anca in posizione seduta standard con ~90° di
     flessione: `setup.hipAngleDeg: 90` di default, registrato, ed entra tra i criteri
     `warning` di ADR-012 con la stessa tolleranza di ±5° del ginocchio.
   - **Test 05:** `protocolVersion: '1.0'`; dolore **singolo** 0–10
     (`clinical.pain`), non pre/post, come nel docx.
8. **Impatto aggiornato su rules/runbook/ordine** (rivede ADR-014):
   - `firestore.rules`: **un** match annidato `clients/{clientId}/assessments/{id}`
     (`read: canRead(orgId)`, `write: false`) più la condizione sul cambio modulo del
     punto 6. Niente `assessmentHealth`, niente `consents`. Deploy su entrambi i
     progetti, da un branch basato su `dev` (invariato).
   - Indici: ancora nessuno nuovo.
   - Copie speculari: invariate (`shared/modules.js`, `shared/lipedema.js`).
     `CONSENT_SCOPE` sparisce. In `shared/lipedema.js` entrano le nuove validazioni del
     2MWT.
   - Runbook, suite `lipedema`: tolto il caso "staff_readonly non vede i dati
     sanitari", sostituito da "staff_readonly vede valutazioni e dati clinici ma non ha
     azioni di scrittura (UI + callable rifiutata)". Aggiunti "valutazione/BIA
     rifiutata senza informativa registrata", "cambio modulo di org con pazienti
     rifiutato (UI + scrittura diretta)", "dopo eliminaCliente nessun doc residuo e
     audit_logs senza nome".
   - Ordine: invariato. STORY-029 diventa più piccola: attestazione informativa +
     audit senza nome, nella stessa ondata di STORY-033. Restano **requisiti di
     rilascio non tecnici**: DPA/nomina art. 28 firmata con ogni org lipedema,
     informativa paziente pronta con una versione, `PRIVACY-POLICY-DRAFT.md`/DPA
     aggiornati (popolazione, categorie di dati, base (h), backup 7 giorni).
   - Rischi: esce "blocco legale lungo" (ADR-014 #6), sostituito da "org lipedema
     attivata senza DPA firmato", un controllo di processo per super_admin che il
     codice non può fare. Il rischio #1 (orfani dopo la cancellazione) resta il più
     alto.
**Alternative scartate:**
- Tenere `assessmentHealth` "per sicurezza": sarebbe complessità (doppia lettura,
  scrittura atomica su due doc, due rules) senza un requisito che la giustifichi dopo
  la decisione su `staff_readonly`.
- Attestazione informativa solo in UI, non bloccante: senza controllo server il campo
  diventa facoltativo di fatto, e l'utente ha chiesto esplicitamente un punto di
  controllo.
- Collection `privacyNotices` append-only: è lo stesso costo di `consents` per un dato
  che cambia raramente. `audit_logs` copre lo storico.
- Callable dedicata al cambio modulo invece della rule: aggiungerebbe una callable per
  un'operazione rara di super_admin, mentre la rule è sufficiente e non costa letture.
**Conseguenze:** ADR-013 resta nel log solo come storia della decisione. Sono
cancellate `assessmentHealth`, `consents`, `CONSENT_SCOPE`, le rules `canWrite` sui dati
sanitari, `lapLengthM` e `registraConsensoSanitario`/`revocaConsensoSanitario`.
Diventano attivi `client.privacyNotice`, la callable `registraInformativaPaziente`, il
sotto-oggetto `assessments.clinical`, la condizione sul cambio modulo nelle rules e
`fullLengths` nel 2MWT.

---

## [ADR-016] Lipedema — logica bilaterale multi-prova condivisa, validità per prova, 30s-STS e Handgrip (Sprint #12)
**Data:** 2026-10-31
**Contesto:** Sprint #12: STORY-035 (30s-STS), STORY-036 (Handgrip, introduce la logica
"per lato con N prove" che HHD e OLS riuseranno nel #13), criteri di STORY-033 rimasti
aperti (validità per prova, best sulle sole valide, dolore per lato, lato dominante).
Fonti: docx 02/03 (e 04/05 per progettare la parte comune), codice di
`shared/lipedema.js` ↔ `utils/lipedema.js` (CORE identico riga per riga, registro
`ASSESSMENT_VALIDATORS`, `trials[]` con `seq`/`side`/`valid` già presenti dal 2MWT).
ADR-009 aveva previsto `computeBilateralBest(trials, { trialsPerSide, aggregate })`;
questo ADR ne fissa la forma reale e sostituisce le parti di ADR-009 §2 e ADR-012 che
cambiano. Dove contraddice ADR-009/012, vale questo.

**Decisione:**

1. **Logica bilaterale: una specifica per test + due funzioni generiche, tutto nel
   CORE.**
   - Ogni test bilaterale è una costante di specifica nel CORE (stesso stile di
     `TWO_MINUTE_WALK`), per esempio:
     ```js
     export const HANDGRIP = {
       protocolVersion:      '1.0',
       sides:                ['R', 'L'],      // ordine guidato: si parte da destra
       validTrialsPerSide:   3,
       maxInvalidPerSide:    3,               // prove non valide ammesse oltre le 3 valide
       canonicalUnit:        'N',
       unitFactors:          { N: 1, kgf: 9.80665 },
       inputDecimals:        2,
       maxValue:             1000,            // in unità canonica, solo anti-refuso
       ceiling:              null,            // OLS: 60
     }
     ```
     HHD (#13) e OLS (#13) saranno altre due costanti: HHD come Handgrip (con il suo
     `maxValue`), OLS con `validTrialsPerSide: 2`, `canonicalUnit: 's'`,
     `unitFactors: { s: 1 }`, `inputDecimals: 1`, `ceiling: 60`.
   - `readBilateralTrials(src, spec, fail)` (helper interno): valida e normalizza
     `trials[]`. `computeBilateralResult(trials, spec)` (esportata, pura): calcola i
     derivati. I validatori per test (`validateHandgrip`, poi `validateHhd`,
     `validateOneLegStanding`) leggono setup/clinical/deviation propri e delegano le
     prove a queste due funzioni. Nessun validatore reimplementa best, simmetria o
     conteggio delle valide: è il criterio "riusabile" di STORY-036, da verificare in
     code review.
   - **Punto di estensione per il #13:** un `readTrialExtra(trialSrc, field, fail)`
     facoltativo nella specifica, per i campi per prova che solo un test ha (OLS:
     `endReason`). Non va scritto nel #12: lo si aggiunge con il primo test che lo usa.
   - **Niente parametro `direction`.** Tutti e tre i test bilaterali prendono il
     massimo (docx 03 §16, 04 §16, 05 §17). Un ramo "min" senza un consumer sarebbe
     codice non esercitato da nessun test reale. Se arriva un test bilaterale "meno è
     meglio", si aggiunge allora.
   - **Tutto server-side, come oggi:** il client chiama le stesse funzioni per
     l'anteprima, il server salva il proprio risultato. Il client non invia mai
     `value`, `result` o `ceiling`: se li invia, vengono ignorati.

2. **Schema di una prova bilaterale** (sostituisce `rawValue/rawUnit/
   notExecutedReason/endReason/ceiling` di ADR-009 §2 per 03/04/05):
   ```js
   trials: [{
     seq,            // 1..n contiguo, ordine reale di esecuzione
     side,           // 'R' | 'L'
     valid,          // boolean, obbligatorio
     invalidReason,  // null se valid; altrimenti codice da INVALID_TRIAL_REASONS
     nativeValue,    // numero inserito, nell'unità dello strumento; null ammesso solo se !valid
     nativeUnit,     // copiata da setup.nativeUnit: la prova si descrive da sola (docx 03 §14)
     value,          // canonico (N | s), calcolato dal server, NON arrotondato; null se nativeValue null
     pain,           // NRS 0–10 intero, facoltativo (null)
     note,           // testo facoltativo, max 200 (TEXT_LIMITS.trialNote)
     ceiling,        // solo se spec.ceiling: value === spec.ceiling (OLS)
   }]
   ```
   - `INVALID_TRIAL_REASONS` (CORE, un solo catalogo per i tre test, etichette solo nel
     config client): `technique_error` (posizione, compensazione, impugnatura/cinghia
     scivolata), `timing_error`, `support_or_assistance` (OLS), `external_interruption`,
     `device_error`, `other` (con `note` obbligatoria). Il catalogo è chiuso perché il
     controllo qualità (docx 05 §23) deve poter contare i motivi; un testo libero non si
     conta.
   - **`result` generico** (sostituisce `rightBestN/leftBestN/strongestN/weakestN/
     rightBestS/...` di ADR-009): stessa forma per i tre test, così storico, dettaglio e
     PDF hanno un solo renderer bilaterale.
     ```js
     result: {
       unit,              // spec.canonicalUnit
       validCountBySide,  // { R: 0..3, L: 0..3 }
       sideStatus,        // { R, L }: 'complete' | 'incomplete' | 'not_tested'
       bestBySide,        // { R, L }: max delle valide, SOLO se il lato è 'complete', altrimenti null
       strongestSide,     // 'R' | 'L' | null (null se pari o se manca un lato)
       strongestValue, weakestValue,   // null se manca un lato
       symmetryPct,       // weakest / strongest × 100, non arrotondato; null se manca un lato
       ceilingBySide,     // solo se spec.ceiling: { R, L } = best === ceiling
     }
     ```
   - Dolore per lato (`Pain_Right/Pain_Left` dei docx 03/04): **non** è un input
     separato. Si inserisce per prova (`trials[].pain`, docx 03 §14 / 04 §14) e il
     server deriva `clinical.painMaxBySide = { R, L }` (massimo per lato, null se
     nessun valore). Due input per lo stesso dato (per prova e per lato) potrebbero
     contraddirsi senza che nessuno lo noti.

3. **Validità per prova e regola "N prove valide per lato".**
   - Ogni prova ha `valid` obbligatorio. Una prova non valida resta salvata e si ripete
     (docx 03 §11, 05 §14). Per lato al massimo `validTrialsPerSide` prove valide (una
     quarta valida renderebbe "best di 3" ambiguo: rifiutata) e al massimo
     `maxInvalidPerSide` non valide. Quindi al massimo 6 prove per lato nell'Handgrip,
     5 nell'OLS. Superato il tetto, la prova non si sta eseguendo: il professionista
     segna l'interruzione. Il tetto serve anche contro refusi e documenti senza limite.
   - Valori: prova valida → `nativeValue` obbligatorio, `> 0`, al massimo
     `inputDecimals` decimali, `value ≤ maxValue` (e `≤ ceiling` per OLS, oltre
     rifiutato come in ADR-012). Prova non valida → `nativeValue` facoltativo: se la
     cinghia scivola, spesso non c'è una lettura. Se c'è, si conserva e si valida con
     gli stessi limiti.
   - **Best solo sulle valide, e solo con il lato completo.** `bestBySide[side]` è
     valorizzato solo quando il lato ha esattamente `validTrialsPerSide` prove valide.
     Con meno prove (`incomplete`) o nessuna (`not_tested`) resta `null`, ma le prove
     grezze restano visibili nel dettaglio. È l'AC di STORY-036 ("i best di una mano non
     testata/incompleta restano vuoti senza invalidare l'altra mano"). Un best di 2 prove
     confrontato con un best di 3 sembrerebbe un calo che non c'è.
   - **Ordine D-S alternato: guidato in UI, non imposto dal server.** Il server
     controlla che `seq` sia contiguo e che i lati siano tra quelli della specifica, non
     l'alternanza. Con una prova ripetuta, o con un lato che finisce prima, l'ordine
     reale smette di alternare per motivi legittimi, e un vincolo rigido renderebbe
     impossibile registrarlo com'è stato eseguito. La UI propone come prossimo lato
     quello con meno prove valide (a parità, l'opposto dell'ultimo, e si parte da `R`).
     Un ordine scelto diversamente si registra come deviazione.
   - **Interruzione per sicurezza (Handgrip §19, HHD §19, OLS §20).** Usa
     `events.stoppedEarly` e `clinical.stopReasonCode/stopReasonNote`, come 2MWT/STS.
     Regole:
     - `stoppedEarly === false` → entrambi i lati devono essere `complete`, altrimenti
       errore "Completa le prove o segna l'interruzione".
     - `stoppedEarly === true` → motivo obbligatorio, qualunque conteggio ammesso (anche
       0 prove su un lato: lato non eseguibile per controindicazione, docx 03 §20). Il
       lato completo conserva il suo best. `outcome: 'stopped_early'`.
     - Niente `stopTimeS`: per prove di 3 s non significa nulla.
     - Il catalogo dei motivi è `LIMB_STOP_REASON_CODES` (nuovo, CORE): `acute_pain`,
       `neurological_symptoms`, `dizziness`, `loss_of_control`, `instability`,
       `contraindication`, `patient_request`, `examiner_decision`, `other`. È separato
       da `STOP_REASON_CODES` (2MWT/STS, motivi cardiorespiratori), che **non si
       tocca**: allargarlo farebbe accettare al 2MWT "sintomi neurologici della mano".
     - `notExecutedReason` di ADR-009 sparisce: il lato non eseguito è `not_tested`
       con il motivo dell'interruzione.

4. **Unità e precisione** (conferma ADR-012, con dettagli):
   - Unità inserita **una volta per valutazione** (`setup.nativeUnit ∈ unitFactors`, un
     dinamometro mostra una sola unità) e copiata su ogni prova.
     `value = nativeValue × unitFactors[nativeUnit]` (kgf × 9,80665), **mai arrotondato
     in DB**. `nativeValue` è conservato com'è stato inserito.
   - Visualizzazione: N senza decimali. Se l'unità nativa è kgf, accanto anche kgf con
     1 decimale (dal `nativeValue`, non riconvertito). Simmetria % con 1 decimale. OLS
     in secondi con 1 decimale.
   - Delta (client, ADR-012): si arrotondano i due valori alla precisione mostrata
     (N → intero) e poi si sottraggono. Così la differenza è coerente con i numeri a
     schermo, anche se in DB ci sono 294,1995 e 295,18.
   - L'unità nativa **non** è un criterio di comparabilità: dopo la conversione i valori
     sono nella stessa grandezza. Lo è il modello di dispositivo.

5. **Lato dominante: dato della valutazione, precompilato dalla precedente.**
   - `setup.dominantSide ∈ DOMINANT_SIDES = ['R', 'L', 'both']`, obbligatorio nei test
     bilaterali (mano per 03, gamba per 04/05).
   - Il form lo **precompila** dall'ultima valutazione valida del paziente dello stesso
     arto (03 per la mano; 04/05 per la gamba), già caricata da `useAssessments`. Nessuna
     lettura in più.
   - Non è un criterio di comparabilità.
   - Motivi:
     - Il docx lo elenca tra i campi del record del test (03 §22, 04 §22, 05 §22), e uno
       snapshot per valutazione resta vero anche se in seguito si corregge un refuso.
     - Un campo sul paziente andrebbe scritto o con un `updateDoc` diretto, aggiungendo
       la chiave alla whitelist di `firestore.rules` (file "estrema cautela" + deploy su
       due progetti + test emulatore), o con una nuova callable. Tutto questo per evitare
       un tap a valutazione.
   - Se in futuro serve sul paziente, la precompilazione cambia sorgente e il dato per
     valutazione resta.

6. **30s-STS (STORY-035): prova singola, schema come il 2MWT.**
   - `LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S = 'lipedema_30s_sts'` e la costante
     `SIT_TO_STAND_30S`:
     ```js
     {
       protocolVersion: '1.0',
       durationS: 30,
       standardChairHeightCm: 43.2,
       chairToleranceCm: 0.5,
       minChairHeightCm: 30,
       maxChairHeightCm: 70,
       maxRepetitions: 60,
       maxPauseCount: 10,
     }
     ```
     Tutti i valori sono anti-refuso, non clinici.
   - **Input ripetizioni** (risolve un'ambiguità del docx §14/§16):
     - Si inseriscono le alzate **complete** (`trial.completeRepetitions`, intero ≥ 0)
       e il flag `trial.partialRepCounted`.
     - Lo score lo calcola il server: `repetitions = completeRepetitions +
       (partialRepCounted ? 1 : 0)`.
     - Così la ripetizione parziale finale è distinta per costruzione (docx §16 "il
       software deve distinguere") e non c'è il rischio di contarla due volte. La UI
       mostra il totale in anteprima.
     - `partialRepCounted: true` è ammesso solo se la prova è arrivata ai 30 s: con
       interruzione o uso braccia è un errore.
   - **Uso delle braccia** (`events.usedArms`, boolean obbligatorio):
     - Esito: `outcome: 'invalidated'` (nuovo valore di `ASSESSMENT_OUTCOME`, già
       previsto da ADR-009/012), `result.repetitions: 0`, `result.durationS: null`.
     - La prova resta `valid: false` con `invalidReason: 'used_arms'`. Le alzate fatte
       prima restano in `trial.completeRepetitions` come dato grezzo, se inserite.
     - Uno 0 da invalidazione si distingue da uno 0 reale tramite `outcome`, mai dal
       numero (AC STORY-035).
     - `usedArms` e `stoppedEarly` non possono essere entrambi veri: l'uso delle braccia
       è un motivo tecnico, non un sintomo (docx §19). Un sintomo concomitante va in
       `conditionsNote`.
   - **Stop anticipato:** come 2MWT. `stopTimeS` intero 1–29, motivo da
       `STOP_REASON_CODES` (stesso catalogo provvisorio, come deciso nello sprint),
       `result.durationS = stopTimeS`.
   - **Errore tecnico** (`events.technicalError` boolean + `technicalErrorNote`
     obbligatoria se true, max 500): campo distinto da deviazione e note. Non cambia
     l'esito: è un flag mostrato nello storico. Un errore che invalida la prova si
     gestisce non salvandola o annullandola.
   - `events.familiarizationDone` boolean obbligatorio, non entra nel risultato. Pause:
     come 2MWT, durata ≤ `durationS`.
   - **Setup sedia:**
     - Campi: `chairHeightCm` (1 decimale, default 43,2), `chairHasArmrests`,
       `armsCrossed` (boolean obbligatori), `assistiveDevice: 'none'` fisso (non è un
       input).
     - `isStandardChair = |h − 43,2| ≤ 0,5`. Una sedia fuori tolleranza richiede
       `setup.variantConfirmed`, come il percorso del 2MWT.
     - `chairHasArmrests === true` o `armsCrossed === false` → il server **richiede**
       `deviation.present === true` con descrizione (AC: "deviazione registrata"). Non
       la imposta da solo, perché una deviazione senza descrizione non serve a chi
       rilegge.
   - **Dati clinici:** solo `painPre/Post`, `fatiguePre/Post`, `dyspneaPre/Post` +
     `stopReasonCode/Note` + `conditionsNote`.
     - `readClinical` riceve l'elenco delle chiavi ammesse per test: il 2MWT passa
       quello completo (comportamento invariato). Le chiavi non previste vengono
       ignorate, non salvate come `null`.
     - Niente FC/SpO₂/PA (AC STORY-035).
   - `trials: [{ seq: 1, side: null, valid, invalidReason, completeRepetitions,
     partialRepCounted, value }]`.
   - `comparability: { protocolVersion, chairHeightCm, chairHasArmrests, armsCrossed }`.

7. **Comparabilità e storico** (precisa ADR-012; la parte di STORY-039 resta a lei):
   - `COMPARABILITY_RULES` accetta una `tolerance` facoltativa: issue se `|a − b| >
     tolerance`. Serve per la sedia (±0,5 cm), e nel #13 per ginocchio e anca (±5°).
   - 30s-STS: `protocolVersion`, `chairHeightCm` (±0,5), `chairHasArmrests`,
     `armsCrossed`.
   - **Handgrip:**
     - **Setup:** `dominantSide`, `device { brand, model, serial }` (marca e modello
       obbligatori, seriale facoltativo, max 60 ciascuno), `gripSetting` (testo breve
       obbligatorio, max 40: le impugnature si indicano in modi diversi tra modelli,
       es. "posizione 2"), `nativeUnit`.
     - **Snapshot di comparabilità con chiavi normalizzate dal server:**
       `deviceModelKey = trim+lowercase(brand) + '|' + trim+lowercase(model)`,
       `gripSettingKey`, `deviceSerialKey`. Senza normalizzazione "Jamar" e "jamar "
       darebbero un falso "non comparabile".
     - **Regole `warning`:** `protocolVersion`, `deviceModelKey`, `gripSettingKey`.
   - **Il seriale entra nello snapshot già ora**, anche se il livello `info` di ADR-012
     lo implementa STORY-039: i documenti sono immutabili (ADR-011), quindi tutto ciò
     che una regola futura dovrà confrontare va salvato dal primo giorno.
   - **Esiti non ordinari:** `buildTestHistory` non calcola il delta se uno dei due
     estremi è `stopped_early` **o** `invalidated` (oggi controlla solo
     `stopped_early`). `deltaUnavailable` riporta l'esito.
   - **Bilaterali:**
     - `getPrimaryResult` resta per i monolaterali. Si aggiunge una lettura per lato
       (`bestBySide`), e `buildTestHistory` produce `deltaBySide: { R, L }`.
     - Per ogni lato, il riferimento è la precedente valutazione valida, confrontabile
       e con quel lato `complete`. Il delta c'è se il lato è `complete` in entrambe:
       un Handgrip interrotto con la destra completa ha comunque un delta a destra.
     - Il campo `delta` dei monolaterali non cambia.

8. **Divergenza client/server e test di parità.** Rischio #3 di ADR-014, con la logica
   generica che rende una divergenza più costosa: sbaglierebbe tre test.
   - Tutto ciò che entra nel risultato salvato vive **dentro il CORE**: specifiche,
     cataloghi, `readBilateralTrials`, `computeBilateralResult`, validatori,
     `readClinical`. Il test esistente "CORE identico riga per riga" lo copre già per
     costruzione, senza nuovi meccanismi.
   - **Guardie nuove nel test di parità:**
     - (a) nella copia server, dopo `// ── Fine CORE` non c'è codice, solo spazi.
       Altrimenti una funzione aggiunta lì sfuggirebbe al confronto testuale.
     - (b) `shared/lipedema.js` non contiene `import`. È il vincolo emerso in `281bbe4`:
       la CI non installa `functions/node_modules`, quindi un import di
       `firebase-functions` romperebbe la CI, e un import di un altro `shared/` sposterebbe
       logica fuori dal confronto.
     - (c) `CORE_CONSTANTS` / `CORE_FUNCTIONS` estesi alle nuove esportazioni
       (`SIT_TO_STAND_30S`, `HANDGRIP`, `INVALID_TRIAL_REASONS`,
       `LIMB_STOP_REASON_CODES`, `DOMINANT_SIDES`, `computeBilateralResult`).
   - **Casi comportamentali** (oltre al confronto testuale, perché documentano i casi
     limite):
     - `CASES` di `validateAssessmentInput` per STS: completo, parziale +1, braccia,
       braccia + stop, parziale + stop, sedia variante, braccioli senza deviazione.
     - `CASES` per Handgrip: 6 prove in N, in kgf, con non valide ripetute, 4ª valida,
       tetto delle non valide, stop con un lato a 0, stop con un lato incompleto, non
       valida senza valore.
     - Una griglia su `computeBilateralResult` con `HANDGRIP` **e** una specifica
       sintetica tipo OLS (2 prove, `ceiling: 60`, 1 decimale) definita nel test: la
       parte generica che il #13 userà è esercitata già ora, prima di avere un test OLS.
   - Unit test in `__tests__/utils/lipedema.test.js` per le stesse regole (arrotondamento
     del delta per lato, pareggio → `strongestSide: null`, simmetria non arrotondata).
     Il test di parità dice "uguali", non "giusti".

9. **Cosa non cambia.**
   - `aggiungiValutazione` non si modifica: smista tramite `ASSESSMENT_VALIDATORS`, e due
     voci nuove bastano. `MAX_TESTS_PER_VISIT` e la correzione (stesso `testId`)
     restano validi.
   - **`firestore.rules`: nessuna modifica**: le valutazioni restano `write: false`, il
     lato dominante non è sul paziente.
   - Indici: nessuno.
   - Piani SaaS: nessun impatto (non si creano né trainer né pazienti).
   - Copie speculari toccate: solo `utils/lipedema.js` ↔ `shared/lipedema.js`, quindi
     **ridistribuire le functions** (`cd functions && npm run deploy:dev`; prod non
     prevista finché il DPA non è firmato, STORY-029, e comunque con runtime Node 22).
     Non toccati `gamification`/`constants`/`plans`/`testsMeta`.
   - **2MWT: output identico**, nessun campo nuovo sulla sua prova. Aggiungere per
     esempio `invalidReason: null` cambierebbe `isSameAssessmentData` contro i doc già
     salvati, e una correzione identica risulterebbe "diversa".
   - I form ricevono già i dati dal genitore e salvano tramite `onSave`
     (`TwoMinuteWalkForm`), quindi niente `orgId` nei form, né prop né
     `useTrainerState()`.

10. **Ordine di implementazione per il developer:**
    0. Workflow Node 22 (task dello sprint, indipendente).
    1. **Refactor del CORE a comportamento invariato:**
       - `readClinical(src, fail, keys)`;
       - `ASSESSMENT_OUTCOME.INVALIDATED`;
       - `tolerance` in `COMPARABILITY_RULES`;
       - `buildTestHistory` con esiti non ordinari generici;
       - guardie (a)(b) nel test di parità.

       Parità e unit test esistenti verdi **senza modificare i loro casi**: è la prova
       che il 2MWT non è cambiato.
    2. **STORY-035:**
       - specifica + `validateSitToStand30s` nel CORE + registro;
       - config client (etichette, motivi, `COMPARABILITY_REASON_LABELS`);
       - form model + form (sul modello di `twoMinuteWalkFormModel.js`);
       - badge "invalidato" / "errore tecnico" in `AssessmentBadges`;
       - casi di parità.
    3. **Logica generica:** `readBilateralTrials` + `computeBilateralResult` +
       cataloghi, con unit test sulla specifica sintetica tipo OLS, **prima** di qualunque
       UI Handgrip. Se la forma regge con 2 prove + ceiling, regge anche per il #13.
    4. **STORY-036 + criteri 033:**
       - specifica `HANDGRIP` + validatore;
       - form a 6+ prove guidate (design ux-ui-designer, tenendo conto dell'osservazione
         del #11 sulla barra fissa su mobile);
       - dettaglio multi-prova in `AssessmentDetailModal` (oggi legge solo
         `trials[0]`);
       - storico e `LatestAssessmentsCard` per lato, con `deltaBySide`;
       - precompilazione del lato dominante.
    5. Casi di parità Handgrip + griglia `computeBilateralResult`.
    6. **Runbook** (`config/runbook.config.js`, suite `lipedema`):
       - STS completo con parziale +1;
       - STS uso braccia → 0 marcato "invalidato", nessun delta;
       - STS sedia fuori tolleranza / braccioli → variante e deviazione richieste;
       - Handgrip in kgf → N senza decimali + kgf nativo visibile;
       - prova non valida ripetuta ed esclusa dal best;
       - tetto delle prove non valide;
       - interruzione con un lato incompleto → best vuoto solo su quel lato, l'altro
         conservato e con delta;
       - cambio modello dispositivo → avviso di non comparabilità;
       - lato dominante precompilato dalla valutazione precedente;
       - `staff_readonly` vede le prove ma non salva.
    7. Deploy dev: functions → hosting (rules invariate). QA sull'hosting reale
       `rankex-app-dev.web.app`, desktop e mobile.

**Alternative scartate:**
- **Funzione per test** (`computeHandgripResult`, `computeHhdResult`, ...) invece di
  quella generica: tre copie della stessa regola dentro un file già duplicato
  client/server, e una correzione dovrebbe essere fatta sei volte. È proprio ciò che
  l'AC di STORY-036 chiede di evitare.
- **Prove come campi fissi** (`rightTrial1..3`, come i docx 03/04 §22): non rappresentano
  le prove non valide ripetute né l'ordine reale, e cambierebbero forma per OLS (2 prove).
- **Best sulle valide disponibili anche con il lato incompleto:** confronterebbe best di
  2 e best di 3 come equivalenti. Il dato non va perso: le prove grezze restano.
- **Alternanza D-S imposta dal server:** rifiuterebbe esecuzioni reali e legittime (prova
  ripetuta, lato finito prima).
- **Lato dominante sul paziente:** richiede una modifica a `firestore.rules` o una nuova
  callable, e perde lo snapshot storico (motivi al §5).
- **Dolore per lato come input separato:** due fonti per lo stesso dato, che possono
  divergere.
- **Input "ripetizioni valide" già comprensivo della parziale:** la distinzione chiesta
  dal docx §16 si perderebbe, con il rischio di contarla due volte.
- **Uso braccia come `stopReasonCode`:** mescolerebbe un motivo tecnico con un sintomo
  clinico, e lo 0 non si distinguerebbe in modo affidabile da un'interruzione.
- **Generare la copia server da quella client con uno script di build:** eliminerebbe
  la duplicazione, ma `functions/` ha un deploy indipendente e nessun passo di build
  condiviso. Il confronto testuale del CORE dà la stessa garanzia a costo zero.

**Conseguenze:**
- **Volume:** il CORE cresce (due validatori + logica generica, duplicati), il che rende
  più importante tenerlo puro e dentro i marcatori (guardie al §8). Un Handgrip occupa
  al massimo 12 prove, pochi KB per documento: nessun impatto su limiti o costi.
- **Lavoro del #13:**
  - HHD = specifica + validatore che legge setup (`fixationMethod`, angoli con
    tolleranza ±5°, `sensorPosition`, `contractionS`) e `clinical.painPre`;
  - OLS = specifica con `ceiling` + `readTrialExtra` per `endReason`.

  Nessuna modifica alla logica generica è prevista: se serve, è un segnale da portare
  in review.
- **Dati e precisione:**
  - Il livello `info` (seriale) e il trend restano a STORY-039, ma i dati esistono già
    nello snapshot.
  - `symmetryPct` e `value` non arrotondati sono voluti (ADR-012): chi esporta i dati
    (`export-org.mjs`) vedrà decimali lunghi, ed è corretto così.

**Addendum (review Sprint #12, 2026-10-31):** scelte di implementazione dove il testo
sopra lasciava margine, confermate in code review.
- 30s-STS: `events.usedArmsNote` facoltativa (max 500, `TEXT_LIMITS.usedArmsNote`),
  salvata solo con `usedArms: true`, altrimenti `null`.
- 30s-STS con uso delle braccia: `trials[0].value = 0`, coerente con `result.repetitions`;
  le alzate grezze restano in `completeRepetitions` (facoltative, `null` se non inserite).
- Bilaterali: `ceilingBySide[side]` è `null` quando il lato non ha un best (non `false`).
- Handgrip con stop anticipato: le righe pianificate rimaste vuote sono prove non
  eseguite e il client non le invia; `seq` è l'ordine delle righe inviate.
- STS invalidata nello storico: come `stopped_early` (§7), resta la precedente valida e
  confrontabile per la successiva, che mostra "—" con il motivo; nessun delta da o verso
  di lei. Non è esclusa dal riferimento.
- Handgrip: `HANDGRIP.invalidReasons` (sottoinsieme di `INVALID_TRIAL_REASONS`, senza
  `support_or_assistance`) controllato in `readBilateralTrials`; `normalizeKey` e
  `isStandardChairHeight` esportate dal CORE e usate dai form.

## [ADR-017] Lipedema — HHD quadricipite (STORY-037, Sprint #13)
**Data:** 2026-11-06
**Contesto:** il Test 04 riusa la logica bilaterale di ADR-016 senza modificarla, come
previsto. Fonti: docx 04, ADR-009 §2, ADR-012, ADR-015 §7, tavola `ValutazioneHHD` del
canvas. Qui solo le scelte che quei documenti lasciavano aperte.

**Decisione:**
1. **`HHD_QUADRICEPS`** nel CORE, `testId: 'lipedema_hhd_quadriceps'`, `maxValue: 1500` N
   (solo anti-refuso), motivi di prova non valida come Handgrip.
2. **Setup:** `dominantSide`, `device`, `fixationMethod` (`belt|manual`, un solo campo:
   diverso per lato non è rappresentabile), `kneeAngleDeg` e `hipAngleDeg` (interi,
   default 90), `sensorPosition` (`distal_anterior_tibia|other`, con nota se `other`),
   `contractionS`, `assistiveDevice` + nota, `nativeUnit`. `clinical.painPre` facoltativo.
   Marca, modello e seriale restano tre campi: il canvas ne mostra uno solo, ma l'AC e il
   docx §22 li vogliono separati, e il modello è un criterio di comparabilità.
3. **Fissaggio e gamba dominante senza default** nel form nuovo: si scelgono, o arrivano
   dall'ultima HHD valida. Un default registrerebbe un dato che nessuno ha controllato.
4. **Contrazione:** campo con default 3 s, mai precompilato dalla precedente. Se è diversa
   da 3 il server richiede `deviation.present` con descrizione (stesso schema dei
   braccioli del 30s-STS). Il form attiva la deviazione; tornando a 3 la spegne solo se non
   è stata descritta.
5. **Comparabilità:** `protocolVersion`, `deviceModelKey`, `fixationMethod`,
   `kneeAngleDeg` e `hipAngleDeg` (±5°), `sensorPositionKey` (`other|nota normalizzata`).
   Seriale salvato per STORY-039, non è un criterio; l'ausilio non lo è (test da seduta).
   `computeHhdComparability` è nel CORE: la usano server e form, così l'avviso prima del
   salvataggio e lo snapshot salvato non possono divergere. L'avviso vale anche in
   Correggi e ignora i campi non ancora validi.
6. **Differenza tra i lati: derivata alla lettura** (`getSideDifference`, solo client), non
   in `result`. Aggiungerla a `computeBilateralResult` cambierebbe il `result` di ogni
   Handgrip, e una correzione identica di un documento già salvato risulterebbe diversa
   (ADR-016 §9). I dati per ricalcolarla sono nel documento. Assoluta sui valori mostrati,
   relativa in % del lato più forte (il docx non la definisce): vale 100 − simmetria.
7. **Catalogo stop:** `cramps` aggiunto a `LIMB_STOP_REASON_CODES`, perché il docx 04 §19 lo
   elenca. Vale per tutti i test bilaterali; `STOP_REASON_CODES` non cambia.
8. **Form:** prove, anteprima, stop, dispositivo e unità estratti da `HandgripForm` in
   `BilateralFormParts.jsx`, `useBilateralTrials.js` e `bilateralFormModel.js`, per non
   avere due copie e prepararli a OLS. Comportamento Handgrip invariato. La resa resta
   quella delle righe di prova già in produzione su dev, non la tabella del canvas.

**Conseguenze:**
- `firestore.rules`, indici e `aggiungiValutazione`: nessuna modifica.
- Copia speculare toccata: `shared/lipedema.js`, quindi vanno ridistribuite le functions.
- **Per STORY-038:** la gamba dominante oggi si precompila solo dall'ultima HHD. ADR-016 §5
  chiede di usare anche l'OLS (stesso arto): `createForm` riceve solo la precedente dello
  stesso test, quindi va esteso quando esiste l'OLS.
- `seed-demo-lipedema.mjs` non crea HHD: per ora si inseriscono a mano.

## [ADR-018] Lipedema — One-Leg Standing (STORY-038, Sprint #13)
**Data:** 2026-11-06
**Contesto:** il Test 05 riusa la logica bilaterale di ADR-016. Fonti: docx 05, ADR-009 §2,
ADR-012, ADR-016, tavola `ValutazioneOLS` del canvas (il docx non ha una sezione UI). Qui
solo le scelte che quei documenti lasciavano aperte.

**Decisione:**
1. **`ONE_LEG_STANDING`** nel CORE, `testId: 'lipedema_ols'`: 2 prove valide per lato, 3 non
   valide, secondi con 1 decimale, `ceiling: 60`, `maxValue: null`. Motivi di prova non valida
   senza `device_error` (solo un cronometro; l'errore di cronometraggio è `timing_error`).
2. **Durata massima non modificabile.** La tavola la mostra come campo, qui è in sola lettura:
   il docx §19 dice che un limite diverso è un altro protocollo, e un campo aperto produrrebbe
   proprio quel dato con la stessa `protocolVersion`. Il server scrive `setup.maxDurationS` dalla
   specifica e ignora un valore inviato. È anche un criterio di comparabilità, così un protocollo
   futuro con un altro limite è riconoscibile.
3. **`endReason` per prova**, `OLS_END_REASONS`: i codici di ADR-009 più `safety_stop` (AC).
   - Obbligatorio sulle prove valide, facoltativo sulle non valide: una interruzione esterna non
     è tra i motivi di fine. Una deroga all'AC "per ogni prova", da confermare con l'autore.
   - Coerente con il tetto: `ceiling` solo a 60,0 s, e una prova valida a 60,0 s ha `ceiling`. Il
     form lo imposta da solo se il motivo è vuoto e lo toglie se il tempo cambia. Un motivo scelto a
     mano non si sovrascrive: un refuso di passaggio (6 → 60 → 6,0) non deve farlo perdere, e
     l'incoerenza la segnala la validazione.
   - "Uso di supporto" è una fine di prova (docx §12), "Appoggio o assistenza" una prova non valida
     (docx §16). Il docx non traccia il confine: lo decide chi valuta, il server non li collega.
   - `safety_stop` non implica `events.stoppedEarly`: la seduta può proseguire sull'altra gamba.
4. **`readTrialExtra` è un parametro di `readBilateralTrials`, non un campo della specifica**
   (precisa ADR-016 §1): il test di parità confronta le costanti del CORE per valore, e una
   funzione dentro la specifica non sarebbe mai uguale tra le due copie.
5. **Setup:** `dominantSide`, `footwear` (`barefoot|shoes`), `surface` (`hard_floor|other`, con nota
   se `other`), `assistiveDevice` + nota, `maxDurationS`, `nativeUnit: 's'`. Calzature e gamba
   dominante senza default (come ADR-017 §3). `assistiveDevice` è l'ausilio **abituale** (docx §7),
   nella prova non è ammesso (docx §27): non è un criterio di comparabilità. Occhi aperti, braccia
   lungo i fianchi e nessun ausilio sono fissi nel protocollo: non sono input, un'esecuzione
   diversa si registra come deviazione. Una superficie "Altro" non richiede la deviazione: può
   essere piana e stabile.
6. **Dolore a valore unico:** `clinical.pain` (AC, docx §22 `pain_0_10`), niente dolore per prova
   nel form e niente `painMaxBySide`. Non è in `CLINICAL_RANGES`: una chiave in più lì entrerebbe
   anche nel 2MWT, che le legge tutte, e cambierebbe il suo output (ADR-016 §9).
   `clinical.symptomsNote` (ADR-009 §3) facoltativo, separato dalle condizioni concomitanti.
7. **Comparabilità:** `protocolVersion`, `maxDurationS`, `footwear`, `surfaceKey` (`other|nota
   normalizzata`). `computeOlsComparability` è nel CORE, come per l'HHD.
8. **Gamba dominante condivisa:** `createForm` riceve anche `latestByTest`, e HHD e OLS partono
   dall'ultima valutazione valida tra le due (ADR-016 §5, chiude la conseguenza di ADR-017). Una
   riga dedicata lo dice a chi compila, in entrambi i form: la data della precompilazione del setup
   non vale per questo campo, che può venire dall'altro test.
9. **Tetto a schermo:** badge `TETTO 60 s · D` nello storico e nel riepilogo paziente, riga sì/no per
   lato nel dettaglio ("—" sul lato senza best), mai "≥ 60". Il lato col valore maggiore si chiama
   "Tempo maggiore" (`strongestLabel` nel config): "più forte" non vale per un tempo.

**Conseguenze:**
- `firestore.rules`, indici e `aggiungiValutazione`: nessuna modifica.
- Copia speculare toccata: `shared/lipedema.js`, quindi vanno ridistribuite le functions.
- Il flag nel trend resta da mostrare in STORY-039: i dati ci sono già.
- L'anteprima dei test bilaterali ignora i valori oltre i limiti della specifica: vale anche per
  Handgrip e HHD, dove un refuso oltre il massimo appariva come best fino al salvataggio.
- Le righe di prova hanno sempre `endReason` nello stato del form, vuoto per Handgrip e HHD, che non
  lo inviano: nessun cambiamento nei loro documenti né in `isSameAssessmentData`.
- `seed-demo-lipedema.mjs` non crea OLS: per ora si inseriscono a mano.

## [ADR-019] Lipedema — storico, trend e comparabilità (STORY-039)
**Data:** 2026-11-09
**Contesto:** STORY-039 (storico per test, grafico, delta e avviso di non comparabilità) con le
decisioni dell'utente del 09/11/2026, vincolanti: (1) grafico a tratti, la linea si interrompe a
ogni differenza di livello `warning`, interrotte/invalidate come cerchio ambra fuori dalla linea,
tetto OLS marcato, una serie per lato, annullate fuori dal grafico; (2) delta sempre rispetto
all'ultima valutazione valida confrontabile, con la data, e badge "DIVERSA DALLA PRECEDENTE" quando
la precedente immediata è diversa ma un riferimento esiste; (3) calzature e superficie OLS restano
`warning`, si aggiunge il livello `info` per il seriale del dinamometro; (4) nessun colore
buono/cattivo, nessuna media. Action item della retrospettiva #13 (SPRINT.md, Sprint #14 1-4).
Fonti: ADR-012, ADR-016 §7 e addendum, ADR-017 §5, ADR-018 §7/§9, tavole `PazienteTrend`,
`MobilePazienteTrend`, `Paziente`, `ReportLipedema` del canvas.

**Stato di partenza verificato nel codice:**
- `buildTestHistory` (parte client di `utils/lipedema.js`, fuori dal CORE) calcola già
  `nonComparable` (motivi rispetto alla precedente valida immediata), `reference`/`delta` (ultima
  valida confrontabile), `deltaUnavailable`, e per i bilaterali `deltaBySide`/`referenceBySide`.
  Il caso della nota del 09/11 (delta e badge insieme) è proprio `nonComparable` + `reference`.
- **Il seriale normalizzato è già nello snapshot salvato:** `comparability.deviceSerialKey`
  (`normalizeKey(serial)` o `null`) nell'Handgrip dal primo giorno (ADR-016 §7) e nell'HHD
  (`computeHhdComparability`, ADR-017 §5). Niente da toccare in `aggiungiValutazione`.
- Recharts 2.12 è già una dipendenza (`BiaHistoryChart`, `MisureSection`, `XPTrendChart`, …,
  con `utils/chartTheme`).
- Consumer di `buildTestHistory` / `nonComparable` oggi: `AssessmentsSection` (`HistoryRow`),
  `AssessmentDetailModal`, `AssessmentBadges`, `assessmentFormat.formatMonoDelta` /
  `formatBilateralDelta` (via `assessmentRegistry.formatDelta`), `__tests__/utils/lipedema.test.js`.
  `LatestAssessmentsCard` usa `AssessmentBadges` senza entry dello storico.

**Decisione:**

1. **Dove vive la UI: nella tab VALUTAZIONI esistente (`AssessmentsSection`), con un selettore
   di test.** Niente nuova pagina, route o vista in `ClientDashboard`.
   - Sopra la lista: selettore a schede `role="tablist"` con i 5 `shortName` di
     `LIPEDEMA_TEST_ORDER` (bottoni `role="tab"`, `aria-selected`), in `flex-wrap`, non in uno
     scroller orizzontale (vincolo 360 px). Un test mai eseguito resta selezionabile e mostra
     "Nessuna valutazione di questo test".
   - Sotto: grafico (§3) + legenda + storico del solo test selezionato (le righe di oggi).
   - Test selezionato: stato locale `selectedTestId`, default **derivato** (non salvato) = test
     della valutazione valida più recente, altrimenti il primo di `LIPEDEMA_TEST_ORDER`. Dopo una
     visita il componente si rimonta e mostra l'ultimo test salvato senza codice in più.
   - Motivo: il canvas (`PazienteTrend`) è proprio "storico di un test con selettore", e la tab
     VALUTAZIONI è già lo storico (stesso `assessmentsState`, stessi dialog di dettaglio, Correggi,
     Annulla). Una vista separata duplicherebbe dialog e stato; 5 grafici impilati non stanno a
     360 px. Il "STORICO E TREND →" del canvas resta il "VEDI TUTTE" di `LatestAssessmentsCard`.
   - Espansione riga: si tiene il dettaglio in modale (`AssessmentDetailModal`, già con prove
     grezze e metadati), non l'espansione inline del canvas: l'AC "espandibile" è soddisfatto e non
     si duplica il dettaglio.
   - **Conseguenza sulla QA esistente:** le righe di un test sono visibili solo con quel test
     selezionato. `e2e/qa-dev/tests/lipedema.spec.js` (asserzioni `132 m`, `11 rip.`, `D 226 · S
     195 N` e la correzione) va aggiornato con `getByRole('tab', { name: '2MWT' })` ecc.; i casi
     della suite `lipedema` di `runbook.config.js` che leggono più test nella tab VALUTAZIONI vanno
     riletti e corretti nei passi.

2. **Riga di storico (AC "almeno data, risultato, delta, versione e setup").** Oggi mancano setup,
   versione e professionista. Si aggiunge al registro `ASSESSMENT_UI` una voce
   `formatSetup(assessment)` per test (+ `formatAssessmentSetup` come `formatAssessmentPrimary`),
   letta dai campi salvati, con le etichette già nel config:
   - 2MWT: `percorso 30 m · nessun ausilio · protocollo 1.0`
   - 30s-STS: `sedia 43,2 cm · senza braccioli · braccia incrociate · protocollo 1.0`
   - Handgrip: `Jamar Plus · impugnatura 2 · protocollo 1.0` (marca + modello, non il seriale)
   - HHD: `Marca Modello · cinghia · ginocchio 90° · anca 90° · protocollo 1.0`
   - OLS: `scalza · pavimento rigido · protocollo 1.0`

   Seguono `examinerName` e, sotto i badge, la nota di comparabilità (§5). Ordine della riga: data ·
   risultato; delta; setup · professionista; badge; nota.

3. **Grafico: funzione pura `buildTrendSeries(assessments, testId)` in `utils/lipedema.js`, parte
   client (dopo il CORE), non nel server.** Non entra in nessun valore salvato: è presentazione
   derivata da snapshot salvati, come la comparabilità (ADR-012, conseguenze). Una copia server
   sarebbe codice duplicato senza consumer.
   ```js
   /**
    * @returns {{
    *   sides: Array<'value'|'R'|'L'>,          // ['value'] per i monolaterali, spec.sides per i bilaterali
    *   points: Array<{
    *     assessmentId, performedAt,             // in ordine cronologico crescente
    *     side,                                  // 'value' | 'R' | 'L'
    *     value,                                 // già arrotondato alla precisione mostrata (roundToDecimals)
    *     kind,                                  // 'line' | 'apart'
    *     segment,                               // indice del tratto per lato (0..), null se 'apart'
    *     outcome,                               // per tooltip e testo
    *     ceiling,                               // true solo OLS con ceilingBySide[side] === true
    *   }>,
    *   segmentCountBySide: { [side]: number },
    *   apartCount: number,
    * }}
    */
   ```
   Regole:
   - Solo valutazioni `valid` del test; annullate escluse. Ordine `byMostRecent` invertito.
   - **Monolaterali** (2MWT, STS): `kind: 'apart'` se `outcome ∈ NON_ORDINARY_OUTCOMES`
     (`stopped_early`, `invalidated`), al suo valore salvato (lo 0 di uno STS invalidato si
     distingue per il marcatore e il testo, mai dal numero, come ADR-016 §6). Altrimenti `'line'`.
   - **Bilaterali:** un punto per lato solo se `sideStatus[side] === 'complete'` (c'è un best).
     Il lato completo di una valutazione interrotta è `'line'`: è un best di 3 (o 2) prove valide e
     ha già un delta per lato (ADR-016 §7); il lato non completo non ha punto. Così grafico e delta
     dicono la stessa cosa. Il badge INTERROTTA resta sulla riga e nel tooltip.
     **Confermato dall'utente (09/11/2026, chiusura Sprint #14):** la regola "interrotte come cerchio
     ambra mai unito alla linea" vale solo per i monolaterali; nei bilaterali il lato completo di
     un'interrotta resta sulla linea.
   - **Tratti:** per lato, un punto `'line'` apre un nuovo tratto se
     `getComparabilityIssues(punto, ultimoPuntoLineaDelLato).length > 0`. Si confronta con l'ultimo
     punto della linea, non con gli `'apart'` (che non spezzano né uniscono nulla). A(20 m) → B(15
     m) → C(20 m) = tre tratti: "consecutive confrontabili", C non si ricongiunge ad A. Il livello
     `info` non spezza mai il tratto.
   - Il tetto OLS resta sulla linea (è un valore valido) con un marcatore proprio.
   - Adattatore per Recharts `toTrendChartRows(series)` in
     `features/assessments/assessmentTrend.js` (pura, testabile): una riga per valutazione
     (`x` = indice, etichetta `formatShortDate`), chiavi `${side}:${segment}` per ogni tratto e
     `${side}:apart`. Render in `AssessmentTrendChart.jsx`: `ComposedChart` con un `<Line
     connectNulls>` per tratto (attraversa le righe degli `'apart'` e dell'altro lato, ma non si
     unisce agli altri tratti perché ha un'altra chiave), `<Scatter>` per gli `'apart'` (cerchio
     vuoto `var(--rx-warning)`), `dot` personalizzato per il tetto. Asse X a categorie (le date non
     sono equispaziate, ma due valutazioni dello stesso giorno restano distinte). Asse Y automatico,
     **nessuna** `ReferenceArea`/`ReferenceLine`, nessuna fascia, nessuna media.
   - Colori: monolaterale e lato D `var(--rx-accent)` con marcatore cerchio, lato S
     `var(--rx-accent-2)` con marcatore quadrato (distinguibili senza colore). Tutti i tratti dello
     stesso lato con lo stesso colore: il colore indica il lato, mai un giudizio.
   - Grafico solo con almeno 2 punti nel test; altrimenti il testo "Servono almeno 2 valutazioni per
     il grafico." e lo storico sotto. Altezza 180 px, `ResponsiveContainer` 100 %.

4. **`buildTestHistory`: campi nuovi, nessuno rimosso.**
   ```js
   entry = {
     assessment, reference, delta, deltaUnavailable,      // invariati
     nonComparable,                                        // invariato (motivi vs precedente immediata)
     deltaBySide, referenceBySide,                         // invariati (solo bilaterali)
     previous,      // NUOVO: precedente valida immediata (older[0]) o null
     comparison,    // NUOVO: 'first' | 'same' | 'differs' | 'none_comparable' | null (annullata)
     info,          // NUOVO: [{ reason: 'serial' | 'serialMissing', missingOn: 'current' | 'reference' | null, reference }] — [] se nessuna
   }
   ```
   - `comparison`: `'first'` se non c'è `previous`; `'same'` se `nonComparable` è null;
     `'differs'` se `nonComparable` e `reference` esiste; `'none_comparable'` se `nonComparable` e
     nessun riferimento. Per i bilaterali vale `reference` (la più recente confrontabile), anche se
     un lato ha un riferimento più vecchio: i motivi sono sempre rispetto a `previous`, che è unica.
   - `info` (nuovo `getComparabilityInfo(current, reference)` e `COMPARABILITY_INFO_RULES`, parte
     client): solo Handgrip e HHD, `[{ key: 'deviceSerialKey' }]`. Per una coppia **già
     confrontabile** (stesso modello): entrambi presenti e diversi → `serial`; uno solo `null` →
     `serialMissing` con `missingOn`; entrambi `null` → nulla (ADR-012: "mancante su una delle
     due"; due assenze non dicono niente di nuovo). Calcolato rispetto a ogni riferimento usato da
     un delta: `reference` per i monolaterali, i valori distinti di `referenceBySide` per i
     bilaterali (deduplicati per motivo + id).
   - **Documenti senza il campo:** chiave assente letta come `null` (`?? null`), quindi rientra
     nella regola "seriale mancante". Nessuna migrazione, nessuna modifica alle functions per il
     seriale.
   - Consumer da adeguare: `AssessmentBadges` (§5), `AssessmentDetailModal`, `HistoryRow`.
     `formatMonoDelta`/`formatBilateralDelta` invariati (hanno già la data del riferimento). I test
     esistenti su `nonComparable`/`delta` restano verdi senza modifiche: è la prova di
     compatibilità.

5. **Testi esatti.** Etichette dei motivi: `COMPARABILITY_REASON_LABELS` invariate; nuove
   `COMPARABILITY_INFO_LABELS = { serial: 'seriale diverso', serialMissing: 'seriale non
   registrato' }` in `config/lipedemaTests.config.js`. Date `gg/mm` (`formatShortDate`), come il
   delta di oggi.
   - **Badge** (`AssessmentBadges` riceve `entry` facoltativo al posto di `nonComparable`;
     `LatestAssessmentsCard` non lo passa e resta com'è):
     - `differs` → `DIVERSA DALLA PRECEDENTE · calzature diverse` (motivi uniti da ", "), colore
       `var(--rx-warning)`
     - `none_comparable` → `NON CONFRONTABILE · calzature diverse` (testo di oggi), `var(--rx-warning)`
     - `info` → `INFO · seriale diverso` / `INFO · seriale non registrato`, `var(--rx-text-muted)`:
       informativo, non un avviso
   - **Nota** (`formatComparisonNote(entry)` in `assessmentFormat.js`, `string[]`, in riga sotto i
     badge e nel dettaglio sotto il delta). `<Motivi>` = etichette unite con ", " e " e " prima
     dell'ultima, prima lettera maiuscola:
     - `differs`, con delta: `Calzature diverse dalla valutazione del 07/11: delta rispetto al 05/11.`
       Bilaterale con riferimenti diversi per lato: `…: delta rispetto al 05/11 (D) e al 20/10 (S).`
     - `differs`, senza delta (estremo interrotto/invalidato o nessun lato completo in comune):
       `Calzature diverse dalla valutazione del 07/11: il confronto è con la valutazione del 05/11.`
     - `none_comparable`: `Calzature diverse dalla valutazione del 07/11: non confrontabile con
       nessuna valutazione precedente, delta non calcolato.`
     - `serial`: `Stesso modello di dinamometro, seriale diverso dalla valutazione del 05/11: il
       delta resta valido.`
     - `serialMissing`, `missingOn: 'current'`: `Seriale del dinamometro non registrato in questa
       valutazione (presente in quella del 05/11): il delta resta valido.`
     - `serialMissing`, `missingOn: 'reference'`: `Seriale del dinamometro non registrato nella
       valutazione del 05/11: il delta resta valido.`
   - **Legenda** (sotto il grafico, 11 px, testo + simbolo, mai solo colore):
     - tutti: `● confrontabili, unite dalla linea` · `La linea si interrompe dove cambia un parametro di protocollo o di setup`
     - monolaterali: `○ interrotta o invalidata, fuori dalla linea`
     - bilaterali: `● D destra · ■ S sinistra`
     - OLS: `▲ tetto 60 s`
     - nota fissa: `Il delta è sempre rispetto all'ultima valutazione precedente confrontabile,
       indicata con la data. Nessun valore normativo né giudizio clinico. Le valutazioni annullate
       non sono nel grafico.`
   - **Accessibilità:** il contenitore del grafico ha `role="img"` e `aria-label` da
     `describeTrend(series, test)` (pura, in `assessmentTrend.js`); niente `accessibilityLayer`
     dentro un `role="img"`. Alternativa testuale: lo storico sotto il grafico elenca già ogni
     valore con data, stato e delta; il grafico ha `aria-describedby` verso il titolo dello storico
     e un testo `sr-only` "I valori del grafico sono elencati nello storico qui sotto." Nessuna
     tabella duplicata.
     - monolaterale: `Andamento 2-Minute Walk Test in metri: 4 valutazioni dal 06/08/2026 al
       29/10/2026, 2 tratti confrontabili, fuori dalla linea 1 valutazione interrotta o invalidata.`
       (l'ultima parte solo se `apartCount > 0`)
     - bilaterale: `Andamento Handgrip Dynamometry in newton, una serie per lato: destra 3 valori in
       1 tratto, sinistra 2 valori in 1 tratto.` OLS aggiunge `, 1 tetto a 60 s` se presente.
     - unità per esteso: nuovo campo `unitLabel` in `LIPEDEMA_TESTS` (`metri`, `ripetizioni`,
       `newton`, `newton`, `secondi`).

6. **Helper di pluralizzazione (action item 2): `countLabel(count, singular, plural)` nel CORE.**
   `→ \`${count} ${count === 1 ? singular : plural}\``. In entrambe le copie (CORE identico),
   esportato e aggiunto a `CORE_FUNCTIONS` del test di parità, con casi 0/1/2. Usato da tutti i
   messaggi nuovi con un numero (`describeTrend`, "Servono almeno 2 valutazioni" resta fisso). Nel
   server oggi non ha consumer: c'è perché i messaggi del validatore (BUG-010/015) lo adotteranno
   quando l'utente deciderà quei fix, che **non** fanno parte di questo ADR. `maxDecimalsMessage`
   (BUG-018) resta com'è: "un decimale" non è "n + sostantivo".

7. **Stato di caricamento sulle riletture (action item 3).** `refreshAfterSave` tiene la lista e
   mette `isLoading: true`; `reload` (dopo un annullamento) svuota la lista e mostra gli scheletri
   (comportamento invariato).
   - Durante una rilettura con lista presente: grafico e storico restano visibili con
     `aria-busy="true"` sul contenitore del test e il testo `Aggiornamento in corso…` accanto al
     titolo; `+ NUOVA VALUTAZIONE` disabilitato (già oggi); nel dettaglio CORREGGI e ANNULLA
     VALUTAZIONE disabilitati (nuova prop `isBusy` di `AssessmentDetailModal`: una correzione da uno
     storico non aggiornato potrebbe sostituire un documento già sostituito). Selettore di test,
     "Nascondi annullate" e apertura del dettaglio restano attivi (solo lettura locale).
   - Caso nel runbook (§9) e controllo in `qa:dev` (§10).

8. **Layout a 360 px (action item 4).** Selettore in `flex-wrap`, grafico al 100 % senza larghezza
   minima, margine sinistro dell'asse Y ridotto come in `BiaHistoryChart`, badge già in
   `flex-wrap`, nota a capo libero. Il caso `qa:dev` verifica a 360×640
   `document.documentElement.scrollWidth <= 360` nella tab VALUTAZIONI con il grafico visibile.

9. **Runbook** (`config/runbook.config.js`, suite `lipedema`, `usId: 'STORY-039'`; ultimo id oggi
   TP-072):
   - TP-073 (blocker) — 2MWT A standard, B percorso diverso, C standard: B "NON CONFRONTABILE ·
     percorso diverso" con la nota "non confrontabile con nessuna valutazione precedente"; C
     "DIVERSA DALLA PRECEDENTE · percorso diverso", delta "rispetto al <data di A>" e nota con le
     due date.
   - TP-074 (important) — Handgrip stesso modello: seriale diverso, poi seriale mancante → badge
     INFO, delta presente, la linea non si spezza; modello diverso → tratto nuovo e avviso.
   - TP-075 (blocker) — grafico: tratti per cambio di protocollo, 2MWT interrotto e STS invalidato
     come cerchio fuori dalla linea, annullata assente, bilaterale con due serie, OLS con tetto
     marcato; nessun colore di giudizio, nessuna fascia.
   - TP-076 (important) — accessibilità: lettore di schermo legge l'`aria-label` del grafico, il
     selettore si usa da tastiera (schede).
   - TP-077 (important) — 360 px e riletture: nessuno scroll orizzontale; durante "Aggiornamento in
     corso…" dopo un salvataggio, CORREGGI/ANNULLA e + NUOVA VALUTAZIONE disabilitati.
   - Rilettura dei casi esistenti della suite che contano su più test visibili insieme (§1).

10. **`qa:dev`** (`e2e/qa-dev/tests/lipedema.spec.js`, serial, stessa paziente `E2E-`, nessun
    cleanup nuovo: il teardown cancella già paziente e valutazioni):
    - aggiornare le asserzioni esistenti con il selettore (§1);
    - nuovo `test('storico e trend: tratti e badge di comparabilità')`: 2MWT su percorso variante
      (20 m, conferma variante) poi standard → scheda 2MWT, badge `DIVERSA DALLA PRECEDENTE ·
      percorso diverso`, testo `rispetto al`, `getByRole('img', { name: /2 tratti/ })`; Handgrip con
      stesso modello e seriale `E2E-1` → `INFO · seriale non registrato` e delta presente;
    - stesso test a `setViewportSize({ width: 360, height: 640 })`: `scrollWidth <= 360` con il
      grafico visibile; e `+ NUOVA VALUTAZIONE` disabilitato subito dopo un salvataggio finché la
      rilettura non finisce (lo stesso `toBeEnabled({ timeout })` di oggi, preceduto da
      `toBeDisabled()`).

11. **Cosa non cambia.**
    - `firestore.rules`: nessuna modifica. Indici: nessuno. `aggiungiValutazione`: nessuna
      modifica. Piani SaaS: nessun impatto (non si creano trainer né pazienti). `orgId`: nessun
      nuovo consumer; tutto passa da `assessmentsState`, già prop di `AssessmentsSection`.
    - Copie speculari: solo `utils/lipedema.js` ↔ `shared/lipedema.js` per `countLabel` (§6). Il
      resto è fuori dal CORE. **Functions da ridistribuire su dev** (`cd functions && npm run
      deploy:dev`) per tenere il codice distribuito uguale al repository, senza cambiamenti di
      comportamento; prod non prevista (DPA, ADR-016 §9).
    - Delta dopo una valutazione interrotta/invalidata: resta l'addendum di ADR-016 (la successiva
      mostra "—" con il motivo). Il testo del canvas "Interrotta: non usata come riferimento per il
      delta" non si applica.

**File da toccare:**
- `src/utils/lipedema.js` — CORE: `countLabel`; parte client: `COMPARABILITY_INFO_RULES`,
  `getComparabilityInfo`, `buildTestHistory` (§4), `buildTrendSeries` (§3)
- `functions/src/shared/lipedema.js` — CORE: `countLabel` (identico)
- `src/config/lipedemaTests.config.js` — `COMPARABILITY_INFO_LABELS`, `unitLabel`
- `src/features/assessments/assessmentFormat.js` — `formatComparisonNote`, unione dei motivi
- `src/features/assessments/assessmentRegistry.js` — `formatSetup` per test, `formatAssessmentSetup`
- `src/features/assessments/assessmentTrend.js` (nuovo) — `toTrendChartRows`, `describeTrend`
- `src/features/assessments/AssessmentTrendChart.jsx` (nuovo) — grafico + legenda
- `src/features/assessments/AssessmentsSection.jsx` — selettore, grafico, riga (§2), stato di rilettura
- `src/features/assessments/AssessmentBadges.jsx` — prop `entry`, badge `differs`/`info`
- `src/features/assessments/AssessmentDetailModal.jsx` — nota, badge con `entry`, prop `isBusy`
- `src/config/runbook.config.js` — TP-073…077 + revisione casi esistenti
- `e2e/qa-dev/tests/lipedema.spec.js` — selettore + nuovo test
- Test: `src/__tests__/utils/lipedema.test.js`, `src/__tests__/parity/clientServerParity.test.js`,
  `src/__tests__/features/assessmentTrend.test.js` (nuovo)

**Test Vitest da aggiungere:**
- `buildTestHistory`: `comparison` nei 4 casi (first/same/differs/none_comparable), `previous`;
  `info` con seriale diverso, mancante su `current`, mancante su `reference`, entrambi null
  (nessuna info), chiave assente nel documento (= null), modello diverso (nessuna info, solo
  warning); bilaterale con riferimenti diversi per lato (info su entrambi, deduplicata). Casi
  esistenti invariati.
- `buildTrendSeries`: annullate escluse; ordine crescente; tratto nuovo su `warning`, non su
  `info`; A-B-C con B diverso = 3 tratti; `apart` per `stopped_early`/`invalidated` che non spezza
  il tratto; bilaterale con lato incompleto senza punto e lato completo di un'interrotta sulla
  linea; tetto OLS; valori arrotondati alla precisione mostrata.
- `formatComparisonNote` (tutti i testi del §5), `countLabel` (0/1/2, anche in parità),
  `toTrendChartRows` (chiavi per tratto, righe `apart`), `describeTrend` (mono, bilaterale, OLS).

**Valutazione STORY-040 (PDF) nello stesso sprint: sì, come seconda story, solo dopo che STORY-039
è chiusa** (review + QA). Motivo: riusa senza modifiche `getLatestValidByTest`, `buildTestHistory`,
`formatAssessmentPrimary`/`Delta`/`Setup`, `formatComparisonNote` e (se si vogliono grafici)
`AssessmentTrendChart`; nessuna functions, rules o dato nuovo. Il grosso del rischio (testi e
comparabilità) lo chiude STORY-039. Approccio sintetico:
- `LipedemaReportPrint.jsx` lazy in `features/assessments/`, `window.print()` e `reportPrintKit`
  come `ClientReportPrint`; in `ClientDashboard` il PDF si abilita con `capabilities.hasAssessments`
  oltre a `hasRank` (oggi `canExportPdf={capabilities.hasRank}` lo nasconde), senza
  `PrintPickerModal`, per tutti i ruoli che vedono il paziente (staff_readonly incluso).
- Contenuto: anagrafica, professionista, informativa (versione/data); una riga per test con
  risultato, delta con data, setup, badge come testo e nota di comparabilità; parametri clinici;
  BIA se presente; piè di pagina art. 9 del canvas. Terminologia del modulo, nessun
  rank/percentile/XP/badge.
- Grafici nel PDF: con larghezza fissa (niente `ResponsiveContainer` in stampa), solo se l'utente li
  vuole (domanda 2).
- Report di gruppo: oggi già assente nel modulo (`GroupDetailView` passa
  `canExportPdf={hasGroupRanking}`, `false` per lipedema); la scelta resta all'utente (domanda 1).

**Domande aperte per l'utente:** nessuna per STORY-039. Bloccano solo STORY-040:
1. Report di gruppo nel modulo: assente (com'è oggi) oppure presente senza classifiche (cosa
   mostrerebbe: elenco pazienti con l'ultima data per test?)
2. Grafici nel PDF: sì o no, e quali (il canvas mostra 2MWT e Handgrip destra).
3. "Ultima valutazione per ciascun test" (AC) o "ultima visita" (il canvas: "ULTIMA VISITA ·
   29/10/2026"): se i test sono stati fatti in giorni diversi, il PDF mostra l'ultimo di ciascuno con
   la sua data (proposta) o solo quelli dell'ultimo giorno?

**Risposte dell'utente (09/11/2026), sbloccano STORY-040:**
1. Report di gruppo: **assente** nel modulo lipedema (resta `canExportPdf={hasGroupRanking}`).
2. Grafici nel PDF: **no**, solo tabelle.
3. **Ultima valutazione valida per ciascun test**, ognuna con la propria data.

**Alternative scartate:**
- Vista "Storico e trend" separata (route o `view` di `ClientDashboard`): duplica dialog di
  dettaglio/correzione/annullamento e stato, per un contenuto che la tab VALUTAZIONI ha già.
- Un grafico per test impilati nella tab: illeggibile a 360 px, e il canvas mostra un test alla
  volta.
- `buildTrendSeries` nel CORE con copia server: nessun consumer server, solo più superficie da
  tenere identica.
- Seriale come `warning`: escluso da ADR-012 e dalla decisione dell'utente (3).
- Info anche con entrambi i seriali assenti: segnalerebbe ogni valutazione di chi non registra mai
  il seriale, senza informazione nuova.
- Rinominare `nonComparable` o cambiarne il significato: rompe i test e i consumer esistenti; si
  aggiunge `comparison` accanto.
- Lato completo di un bilaterale interrotto come cerchio fuori dalla linea: il grafico direbbe
  "non ordinario" mentre il delta per lato (ADR-016 §7) lo tratta come valore ordinario.
- Tabella dati duplicata sotto il grafico per l'accessibilità: lo storico è già l'alternativa
  testuale completa.

**Conseguenze:**
- Il selettore cambia la tab VALUTAZIONI per chi la usa oggi (un test alla volta): spec `qa:dev` e
  passi del runbook vanno aggiornati nello stesso cambio.
- `buildTestHistory` resta O(n²) per test: con decine di valutazioni per paziente è trascurabile.
- Il livello `info` vale da subito anche per gli Handgrip/HHD già salvati (lo snapshot c'è):
  nessuna migrazione.
- `countLabel` nel server senza consumer finché l'utente non decide BUG-010/015.

---

## [ADR-020] Rules del documento cliente consapevoli del modulo: trofei e misure nelle org lipedema (BUG-003, TD-005, TD-006)
**Data:** 2026-11-11
**Contesto:** la rule `update` di `organizations/{orgId}/clients/{clientId}` (`firestore.rules`)
ammette per trainer/org_admin una whitelist di campi (`peso`, `altezza`, `misureHistory`,
`badges`, `badgeShowcase`, `wearableEnabled`, `wearable`) senza sapere a quale modulo appartiene
l'org. Ne derivano tre problemi aperti con la stessa causa:
- **BUG-003 (P3):** un trainer di un'org lipedema assegna un badge al paziente con un `updateDoc`
  diretto (`awardBadge` da console): scrittura accettata. ADR-008 garantisce la gamification OFF
  solo nelle callable; `badges`/`badgeShowcase` sono gli unici campi di gamification ancora nella
  whitelist diretta.
- **TD-005:** stesso problema, rimandato il 24/10 per non pagare un `get()` dell'org su ogni
  update cliente di tutti i moduli.
- **TD-006 / ADR-015 §1:** l'attestazione dell'informativa blocca solo `aggiungiValutazione` e
  `salvaBia`; le misure (peso/altezza, `useMisure` → `updateClient`) restano salvabili su un
  paziente senza `privacyNotice`. ADR-015 §1 le aveva lasciate fuori proprio perché le rules non
  conoscono il modulo.

L'utente ha scelto l'opzione (a) della stima del Tech Lead (11/11/2026).

**Opzioni valutate:**

| | Opzione | Costo | Rischio |
|---|---|---|---|
| **a** | Nella rule, `get()` dell'org **solo** se l'update tocca misure o trofei; in lipedema trofei rifiutati e misure ammesse solo con `resource.data.privacyNotice` | Solo `firestore.rules` + test + piccola UI. +1 lettura per scrittura misure/trofei (rara, manuale); wearable invariato | Basso. Una copia in più dell'elenco dei moduli con gamification (§3) |
| b | Denormalizzare `moduleType` sul documento cliente (scritto da `creaCliente`) e leggerlo da `resource.data` | `creaCliente` + script di backfill + deploy functions su entrambi i progetti; 0 letture | Medio: un documento senza il campo (pre-backfill, o scritto da un percorso dimenticato) passerebbe come PT, cioè fail-open sul caso che si vuole bloccare |
| b' | Come b, ma con `get()` dell'org come ripiego quando il campo manca | Come b, più la complessità di due percorsi nella stessa rule | Basso sul dato, alto sulla manutenzione: due fonti di verità per il modulo del cliente, da tenere allineate per sempre |
| c | Togliere misure e trofei dalla whitelist e passarli da callable (`salvaMisure`, `assegnaBadge`) con `getOrgCapabilities` | 2 callable + 2 usecases + rules + deploy functions su entrambi i progetti; latenza e cold start su operazioni oggi istantanee | Basso sul dato, ma riscrive codice funzionante di PT/Soccer (ottimistic update di `useMisure`/`useBadges`) per un problema che esiste solo nel modulo lipedema |
| d | Lasciare com'è (TD-005/006 aperti) | Nessuno | Dato spurio invisibile (BUG-003) e misure sanitarie salvabili senza informativa; il rischio sale con il login paziente (v2) e con le org che lavorano senza registrare l'informativa |

**Decisione:** opzione **a**.

1. **Due funzioni nuove in `firestore.rules`**, nella sezione Helpers, subito dopo
   `isAllowedModuleChange()`:
   ```
   // Moduli con gamification e senza informativa obbligatoria: PT (anche legacy,
   // senza moduleType) e soccer. Ogni altro modulo (lipedema, o uno futuro non
   // ancora censito qui) è trattato in modo restrittivo, come getModule (ADR-007).
   // Speculare a hasGamification in config/modules.config.js e
   // functions/src/shared/modules.js (test in firestore.rules.test.js, ADR-020).
   function isGamifiedModule(moduleType) {
     return moduleType == null || moduleType in ['personal_training', 'soccer_academy'];
   }

   // ADR-020 (BUG-003, TD-005, TD-006): chiamata SOLO quando l'update tocca misure
   // o trofei, così il wearable non paga la lettura dell'org. Fail-closed se l'org
   // non esiste. Nei moduli restrittivi: trofei mai; misure solo con l'informativa
   // registrata (privacyNotice lo scrivono solo le callable, non è nella whitelist).
   function moduleAllowsClientWrite(orgId) {
     let org = get(/databases/$(database)/documents/organizations/$(orgId));
     return org != null && (
       isGamifiedModule(org.data.get('moduleType', null)) ||
       (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['badges', 'badgeShowcase']) &&
        resource.data.get('privacyNotice', null) != null)
     );
   }
   ```
2. **`allow update` del cliente** — cambia solo il ramo trainer/org_admin, con un terzo termine in
   `&&`; ramo super_admin e ramo `isOwnClient` invariati:
   ```
   allow update: if isSuperAdmin() ||
     (canWrite(orgId) &&
      request.resource.data.diff(resource.data).affectedKeys().hasOnly([
        'peso', 'altezza', 'misureHistory',
        'badges', 'badgeShowcase',
        'wearableEnabled', 'wearable',
      ]) &&
      (!request.resource.data.diff(resource.data).affectedKeys().hasAny([
         'peso', 'altezza', 'misureHistory', 'badges', 'badgeShowcase',
       ]) ||
       moduleAllowsClientWrite(orgId))) ||
     (isOwnClient(orgId, clientId) &&
      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['wearable', 'avatarId', 'badgeShowcase']) &&
      (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['avatarId']) ||
       avatarUnlocked(request.resource.data.avatarId, resource.data)));
   ```
   Solo espressioni booleane, nessun `if/return`. **Ordine voluto, sfrutta il cortocircuito di
   `&&`/`||`:**
   - `canWrite` per primo: `staff_readonly`, membri di altre org e non autenticati sono rifiutati
     senza leggere l'org.
   - `hasOnly` per secondo: xp, rank, stats, privacyNotice ecc. sono rifiutati senza leggere l'org.
   - `!hasAny([misure, trofei])` prima di `moduleAllowsClientWrite`: un update di soli
     `wearable`/`wearableEnabled` rende vero il primo termine dell'`||` e la funzione con il `get()`
     non viene mai valutata. Il `get()` sta dentro la funzione e non in un `let` del chiamante,
     proprio per non dipendere da come vengono valutati i `let`.
   - Update misti (es. `wearable` + `peso`) toccano le misure: pagano la lettura, è corretto.
3. **Moduli: elenco consentito, non `!= 'lipedema'`.** `isGamifiedModule` ammette `null`
   (legacy = PT, come in `TrainerView`/`OrgAdminView`), `personal_training` e `soccer_academy`;
   tutto il resto è restrittivo. Per i moduli di oggi è identico a "in lipedema rifiuta", ma un
   modulo nuovo nasce chiuso (come `getModule`, ADR-007) invece che aperto. Conseguenza: è una
   **terza copia** di `hasGamification` (dopo `config/modules.config.js` e
   `functions/src/shared/modules.js`), come `avatarUnlocked` lo è delle soglie avatar. Un modulo
   nuovo con gamification va aggiunto qui; il test data-driven del §5 fallisce se lo si dimentica.
4. **Perimetro.**
   - `privacyNotice` letto da `resource.data` (stato attuale): non è nella whitelist, quindi
     `request.resource.data` non può introdurlo nello stesso update (test esistente in
     `describe('client.privacyNotice')`).
   - super_admin resta senza vincoli, come in tutte le altre rules (customer service).
   - Ramo `isOwnClient` (`badgeShowcase` dal cliente): non toccato. I pazienti lipedema non hanno
     account (ADR-010), quindi il ramo è irraggiungibile. Se arriva il login paziente (v2), va
     esteso con lo stesso `moduleAllowsClientWrite` (vedi Conseguenze).
   - Scritture Admin SDK (`creaCliente` con peso/altezza dal wizard, badge automatici delle
     callable) non passano dalle rules: invariate. ADR-008 resta il presidio server-side.
   - Note, scheda, appuntamenti: restano non bloccati senza informativa (ADR-015 §1 invariato su
     questo punto); qui si chiudono solo le misure, che erano l'unica scrittura clinica diretta.
   - Nessuna callable, nessun usecase, nessun indice, nessuna costante client/server toccata.
     Piani SaaS: nessun impatto (non si creano trainer né pazienti). `orgId`: nessun consumer
     nuovo (`MisureSection` riceve solo props da `ClientDashboard`).

5. **Test in `tests/rules/firestore.rules.test.js`** — nuovo `describe('Update cliente
   consapevole del modulo (ADR-020)')` con fixture proprie nel `beforeEach` del blocco:
   - `orgLip` (`moduleType: 'lipedema'`) con `members/trainerLip` (`trainer`), `members/staffLip`
     (`staff_readonly`) e i rispettivi `users/{uid}`; pazienti `patNoNotice` (senza
     `privacyNotice`) e `patNotice` (con `privacyNotice: { informativaVersion: 'v1', deliveredAt:
     '2026-10-01', recordedBy: 'trainerLip' }`).
   - `orgSoc` (`moduleType: 'soccer_academy'`) e `orgPt` (`moduleType: 'personal_training'`), con
     un trainer e un cliente ciascuna. `org1` (legacy, senza `moduleType`) è già nel `beforeEach`
     globale.
   - `orgGhost`: **nessun documento org**, solo `members/trainerGhost` + `users/trainerGhost` +
     `clients/c1` (Firestore permette subcollection sotto un documento assente).

   Casi (★ = fallisce con la rule di oggi, prova che il cambio serve):
   - ★ lipedema, `patNoNotice`: `{ peso: 70 }`, `{ altezza: 165 }` e `{ peso, misureHistory:
     arrayUnion(...) }` (la forma esatta di `useMisure`) → `assertFails`.
   - lipedema, `patNotice`: gli stessi tre → `assertSucceeds`.
   - ★ lipedema, `patNotice` (con informativa): `{ 'badges.champion': {...} }` (la riproduzione di
     BUG-003) e `{ badgeShowcase: ['champion'] }` → `assertFails`; anche su `patNoNotice`.
   - ★ lipedema: `{ peso: 70, badges: {...} }` su `patNotice` → `assertFails` (le misure valide non
     fanno passare i trofei).
   - lipedema: `{ wearableEnabled: false }` su `patNoNotice` → `assertSucceeds` (invariato).
   - PT esplicito (`orgPt`), PT legacy (`org1`) e Soccer (`orgSoc`): misure, `badges.x` e
     `badgeShowcase` → `assertSucceeds`. Su `org1` lo coprono già i test esistenti di `describe('Trainer
     — update diretto del cliente')`, che devono restare verdi senza modifiche.
   - Wearable senza lettura dell'org: su `orgGhost`, `{ wearableEnabled: false }` → `assertSucceeds`
     e ★ `{ peso: 70 }` → `assertFails`. È la prova del cortocircuito (se il `get()` venisse valutato
     anche per il wearable, l'org assente lo rifiuterebbe) e del fail-closed.
   - `staff_readonly` (`staffLip`): misure su `patNotice` → `assertFails`. `staff1` su `org1` già
     coperto da `describe('staff_readonly')`.
   - Data-driven contro la divergenza (§3): per ogni chiave di `MODULE_CAPABILITIES` importato da
     `functions/src/shared/modules.js` (ESM puro, nessuna dipendenza browser) più un modulo
     inventato (`'futuro'`), creare un'org con quel `moduleType` e verificare che `{ badgeShowcase:
     [] }` riesca **se e solo se** `hasGamification` è `true` (il modulo inventato: rifiutato).
   - Invariati e da non toccare: `describe('client.privacyNotice')` (`{ peso, privacyNotice }`
     rifiutato), `Client self-update`, `Avatar — sblocco`.

6. **UI — misure disabilitate in lipedema senza informativa.**
   - `src/features/client/ClientDashboard.jsx`: conosce già lo stato (`needsPrivacyNotice =
     requiresPrivacyNotice(capabilities) && !client.privacyNotice`, riga ~103, e `client` arriva
     come prop aggiornata da `usePrivacyNotice` → `onClientUpdated`). Passare a `MisureSection`
     `needsPrivacyNotice={needsPrivacyNotice}`, `terminology={terminology}` e
     `onRequestPrivacyNotice={handleOpenPrivacyModal}`, come fa già con `AssessmentsSection` e la
     tab BIA.
   - `src/features/client/client-dashboard/MisureSection.jsx`: con `needsPrivacyNotice` mostra
     `PrivacyNoticeBanner` (da `features/assessments/PrivacyNotice`) in cima alla card, e input
     peso/altezza e AGGIORNA `disabled` con `aria-describedby={PRIVACY_BANNER_ID}`. Valori correnti e
     grafici restano visibili. Prop con default `false`: `ClientDashboardPage.jsx` (area cliente,
     `readonly`) resta invariato.
   - `src/features/assessments/PrivacyNotice.jsx`: il testo del banner oggi dice "le valutazioni e
     la BIA non si possono salvare"; diventa "le valutazioni, la BIA e le misure non si possono
     salvare finché non è registrata." (resta l'azione REGISTRA INFORMATIVA e, in readonly, "Deve
     registrarla un {terminology.trainer}."). Verificato l'11/11: nessun test né spec e2e
     asserisce il testo vecchio (unica occorrenza nel componente).
   - `src/features/client/useMisure.js`: **nessuna modifica.** Il blocco lo dà la UI, il rifiuto
     reale le rules; nel caso residuo (informativa rimossa altrove mentre la scheda è aperta) il
     rollback e il toast "Impossibile aggiornare le misure" di oggi bastano. Il `permission-denied`
     delle rules non distingue la causa, quindi un messaggio specifico lì sarebbe una supposizione.
   - Trofei: nessuna UI da cambiare (`TrophiesSection` non è montata senza `hasGamification`;
     `useBadges` scrive solo su azione dell'utente, nessun effetto al montaggio).

7. **Runbook:** `TP-084` in `src/config/runbook.config.js`, suite `lipedema`, `usId:
   'BUG-003/TD-006'`, severità `important`. Precondizioni: org lipedema su rankex-dev (hosting
   `rankex-app-dev.web.app`, rules deployate), un paziente senza informativa e uno con, account
   trainer e staff_readonly. Passi: (1) paziente senza informativa → tab Misure: banner ambra,
   input e AGGIORNA disabilitati, grafici visibili; (2) console: `updateClient` con `{ peso: 70 }`
   → `permission-denied`; (3) REGISTRA INFORMATIVA dal banner → banner sparisce, AGGIORNA peso
   salva e il grafico si aggiorna; (4) console sul paziente con informativa: `awardBadge(orgId,
   patientId, 'champion', 'qa', 'QA')` e `updateBadgeShowcase` → `permission-denied` (riproduzione
   di BUG-003); (5) staff_readonly: banner con "Deve registrarla un Professionista", nessun input;
   (6) org PT e org Soccer: AGGIORNA misure e assegnazione trofeo funzionano come prima. Atteso:
   misure sanitarie salvabili solo con informativa, nessun trofeo su un paziente, PT/Soccer
   invariati.

8. **Deploy:** solo rules su rankex-dev (`npm run deploy:rules:dev`), più l'hosting dev per la UI;
   **prod allo Sprint #18**, insieme al resto del modulo. Nessun deploy di functions.
   **Attenzione:** `deploy.yml` deploya `firestore:rules` in automatico su `rankex-dev` al push su
   `dev` e su `fitquest-60a09` al merge in `main`. "Prod al #18" vale quindi solo se nessun merge
   `dev → main` porta questa rule prima del #18; se succede, il comportamento in prod per PT/Soccer
   è identico (stesse scritture ammesse, +1 lettura su misure/trofei), quindi un rilascio anticipato
   non rompe niente, ma va scritto nel CHANGELOG.

**File che il developer tocca (e solo questi):**
- `firestore.rules` — `isGamifiedModule`, `moduleAllowsClientWrite`, ramo trainer di `allow update`
  del cliente; aggiornare il commento sopra la rule (cita ADR-020)
- `tests/rules/firestore.rules.test.js` — nuovo `describe` del §5
- `src/features/client/ClientDashboard.jsx` — tre props a `MisureSection`
- `src/features/client/client-dashboard/MisureSection.jsx` — banner + controlli disabilitati
- `src/features/assessments/PrivacyNotice.jsx` — testo del banner
- `src/config/runbook.config.js` — TP-084
- A fix verificato (review + QA): `docs/BUGS.md` BUG-003 → FIXED, `docs/TECH-DEBT.md` TD-005 e
  TD-006 → RESOLVED con rimando a questo ADR

**Alternative scartate:** b, b', c, d della tabella. In sintesi: b e b' introducono una seconda
fonte di verità del modulo sul documento cliente, con migrazione e fail-open sui documenti senza
il campo; c riscrive due flussi funzionanti di PT/Soccer e aggiunge due callable per un problema
del solo modulo lipedema; d lascia aperte misure sanitarie senza informativa. Scartato anche il
`get()` dell'org **incondizionato** in ogni update cliente (la forma rimandata in TD-005): farebbe
pagare la lettura anche al wearable e a ogni altro update, senza beneficio.

**Conseguenze:**
- +1 lettura documento per ogni scrittura diretta di misure o trofei, in tutti i moduli; nessuna
  per il wearable. Scritture manuali e rare: impatto sui costi trascurabile (obiettivo 0 €). Il
  limite di 10 `get()`/`exists()` per richiesta non è a rischio (oggi: `users` + `members` × 2, più
  l'org).
- Terza copia di `hasGamification` nelle rules (§3), coperta dal test data-driven: un modulo
  nuovo con gamification richiede di aggiornare `isGamifiedModule`.
- ADR-015 §1, punto "Non bloccati": le misure escono dall'elenco; note, scheda e appuntamenti
  restano non bloccati.
- Login paziente (v2, ADR-010): il ramo `isOwnClient` ammette `badgeShowcase`; prima di dare un
  account ai pazienti va aggiunto `moduleAllowsClientWrite` anche lì (da ricordare nella story v2).
- Org già attive in lipedema su rankex-dev con pazienti senza informativa: da questo deploy non
  possono più aggiornare le misure finché non la registrano. È il comportamento voluto, coerente
  con BIA e valutazioni.

