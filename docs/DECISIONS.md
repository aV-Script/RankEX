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
