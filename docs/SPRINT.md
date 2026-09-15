# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

### SPRINT #6 — EPIC-007: Privacy & Data Protection, remediation P0 — aperto il 2026-09-14

**Perché ora, fuori sequenza:** l'utente ha richiesto esplicitamente priorità massima sui
risultati del Privacy & Data Protection Audit appena consegnato dal Product Owner
(EPIC-007). Questo sprint scavalca il piano precedente (che vedeva solo EPIC-005 completa
come candidato) e si dedica **esclusivamente** a EPIC-007.

**Goal:** chiudere le story P0 di EPIC-007 risolvibili con solo lavoro tecnico in questo
sprint — STORY-015 (hardening regole `audit_logs`), STORY-016 (cascade delete completo in
`eliminaCliente`), STORY-017 (log reale dei login falliti, previa decisione Tech Lead) e
STORY-018 (messaggio di errore login generico) — mentre si avvia in parallelo, **fuori
capacità developer**, la raccolta di contenuti/decisioni per le altre due P0 dell'epic,
STORY-019 e STORY-020, oggi bloccate su input legale/di prodotto non producibile da chi
scrive codice.

**Story selezionate (P0 di EPIC-007 — STORY-015..020):**
- STORY-015 — hardening regola `create` su `/audit_logs/{logId}` (anti-spoofing uid/email/campi extra)
- STORY-016 — cascade delete completo in `eliminaCliente` (note, goal, slot, ricorrenze, notifiche, schede)
- STORY-017 — log reale dei login falliti (oggi silenzioso, nessuna entry scritta) — richiede prima una scelta di design Tech Lead tra 3 opzioni
- STORY-018 — messaggio di errore login generico (anti account-enumeration)
- STORY-019 — Privacy Policy + Cookie Policy in-app — **tracciata nello sprint per visibilità, non nella capacità developer** (vedi nota "Scorporo" sotto)
- STORY-020 — consenso genitoriale per minori soccer_academy — **tracciata nello sprint per visibilità, non nella capacità developer** (vedi nota "Scorporo" sotto)

**Sequenziamento (aggiornato dopo ADR-004 del Tech Lead — vedi `docs/DECISIONS.md`):**
1. STORY-018 parte subito — fix isolato di una riga, nessuna dipendenza.
2. STORY-015 e STORY-016 in parallelo — indipendenti tra loro (015 tocca solo
   `firestore.rules`, 016 tocca solo `eliminaCliente`).
3. STORY-017 è stata sbloccata dal Tech Lead (ADR-004): opzione (b), nuova Cloud
   Function callable `registraLoginFallito` (Admin SDK, invocabile senza auth, con
   throttle anti-spam) — **non tocca `firestore.rules`**, quindi non ha più alcun
   coordinamento di deploy con STORY-015. Procede indipendente in parallelo alle altre tre.
4. In parallelo, **fuori dallo sprint di sviluppo**: track "raccolta input" per
   STORY-019 e STORY-020 (vedi sotto).

**Status board:**

| Task | Status | Note |
|------|--------|------|
| STORY-018 — messaggio di errore login generico | **DEPLOYED (rankex-dev)** | Codice mergiato in `dev` (`ddef4a0`) e deployato: rules+functions live su rankex-dev. **Hosting rankex-dev non ancora ridistribuito** (dipende dal push su origin, bloccato — vedi Blockers) — il fix è verificabile solo in locale (`npm run dev`) finché l'hosting non si aggiorna. |
| STORY-015 — hardening regola `create` su `audit_logs` | **DONE (rankex-dev)** | `firestore.rules` deployata su rankex-dev (2026-09-15, worktree isolato `epic-007-privacy-remediation` → merge in `dev`). 47/47 test rules verdi pre-deploy. Non ancora su `fitquest-60a09` (prod). |
| STORY-016 — cascade delete completo in `eliminaCliente` | **DONE (rankex-dev)** | Verifica fixture live eseguita con successo su `test-org-pt`: creato un cliente reale con nota+obiettivo+slot+ricorrenza+notifica+scheda, chiamato `eliminaCliente`, confermato — cliente e subcollection `notes`/`goals` cancellati, notifica e scheda cancellate, slot/ricorrenza (condivisi) ripuliti del riferimento ma non cancellati per intero. `clientCount` ripristinato dopo il test (il fixture non passava da `creaCliente`). Nessun residuo lasciato sull'org di test. Non ancora su prod. |
| STORY-017 — log reale dei login falliti | **DONE (rankex-dev)** | `registraLoginFallito` deployata ("Successful create operation") + indice composito deployato. **Smoke test live eseguito con successo**: chiamata diretta all'endpoint HTTPS (`curl` verso `europe-west1-rankex-dev.cloudfunctions.net/registraLoginFallito`) → `{"result":{"ok":true}}`, HTTP 200 — la funzione scrive senza errori (un fallimento della write via Admin SDK avrebbe fatto fallire la callable con 500). Non ancora su prod. |
| STORY-019 — Privacy Policy + Cookie Policy in-app | BLOCKED (fuori capacità developer) | Track parallelo aperto: "raccogliere contenuto legale" — proprietario utente/consulente esterno. Non impegna il developer, non condiziona la chiusura di questo sprint. |
| STORY-020 — consenso genitoriale minori | BLOCKED (fuori capacità developer) | Track parallelo aperto: "raccogliere decisione Titolare del trattamento + modalità di raccolta consenso" — proprietario utente. Non impegna il developer, non condiziona la chiusura di questo sprint. |

**Blockers:**
- Deploy su rankex-dev completato il 2026-09-15: `firestore.rules`, indice
  composito `audit_logs`, e tutte le 34 Cloud Functions (incl. `eliminaCliente`
  aggiornata e `registraLoginFallito` nuova). Eseguito da un worktree isolato
  (`epic-007-privacy-remediation`, poi fast-forward in `dev` in locale) per non
  interferire con una sessione concorrente attiva su `feature/mobile-app` nella
  cartella di lavoro condivisa.
- Il branch `dev` locale è avanzato oltre `ddef4a0` (fix + aggiornamenti di
  processo) ma non è stato ancora inviato a origin — resta da fare
  manualmente. Finché non arriva su origin: nessun aggiornamento automatico
  dell'hosting rankex-dev, e chi lavora su altre copie del repository non vede
  questi commit.
- **Verifica fixture live STORY-016 completata** (2026-09-15): cliente di test
  reale su `test-org-pt` con nota+obiettivo+slot+ricorrenza+notifica+scheda →
  `eliminaCliente` → tutte le verifiche passate, zero residui, `clientCount`
  ripristinato. Script one-off eliminato dopo l'uso (non era pensato per
  riutilizzo — path relativi specifici a questo ambiente).
- **Tutte e 4 le story in capacità developer (STORY-015/016/017/018) sono ora
  DONE su rankex-dev.** Resta: ripetere l'intera sequenza di deploy su
  `fitquest-60a09` (prod) dopo un merge `dev`→`main`, e il push di `dev` su
  origin (vedi sopra) come prerequisito.
- STORY-019 e STORY-020 restano bloccate su input non tecnico (contenuto legale
  approvato + decisione dell'utente su Titolare del trattamento/raccolta consenso
  minori) — nessuna stima di sviluppo possibile finché non arrivano. Vedi nota
  "Scorporo" sotto per come vengono gestite senza tenere in ostaggio lo sprint.

**Tech debt di processo emerso in questo sprint (per la Retrospective):** il primo
giro di implementazione delle 4 story ha introdotto, oltre allo scope approvato,
un'intera feature non richiesta e non passata da product-owner/tech-lead (scaffold
app mobile nativa Capacitor/Android, hook `useNativeBackButton`/`useNativePush`,
wiring FCM in `firestore.rules`/`clients.js`, trigger push notification) — inclusi
build artifact Android/Gradle binari nel working tree. Rilevato e rimosso
interamente prima della code review (nessuna traccia arrivata a quello stadio).
Causa non accertata (non è possibile determinare dal solo working tree se sia stato
un errore di scope del Developer o un'interferenza esterna). Azione da valutare in
Retrospective: verificare lo scope effettivo di ogni implementazione (`git status`
completo, non solo i file attesi) subito dopo ogni sessione di sviluppo, prima di
passare a code review — non solo per gli sprint sensibili come questo.

**Nota Scrum Master — scorporo delle story bloccate dallo sprint tecnico:**
STORY-019 e STORY-020 restano nell'epic e sono elencate sopra per tracciabilità (priorità
P0, richiesta esplicita dell'utente), ma **non fanno parte della capacità di sviluppo di
questo sprint** e non ne condizionano la chiusura. Motivo: un lead time legale/di
decisione (contenuto Privacy Policy approvato, scelta Titolare del trattamento) non è
stimabile né accelerabile da lavoro tecnico, e tenerle "IN PROGRESS" nello sprint
tecnico per un tempo indefinito violerebbe il principio FINIRE > INIZIARE — lo sprint
rischierebbe di non chiudere mai in attesa di un input che non dipende dal developer.
Al posto di bloccare l'intero sprint, apro subito un **task parallelo non-developer**
("raccogliere contenuto/decisione") con proprietario l'utente, che può procedere in
qualunque momento senza aspettare la chiusura di questo sprint. Quando input e decisione
arrivano, STORY-019/020 (insieme a STORY-021 e STORY-026, bloccate per lo stesso motivo
ma priorità P1/P2) diventano un candidato naturale per un prossimo sprint — non serve
uno sprint "parallelo" formale con la sua status board: basta non far dipendere la
chiusura di *questo* sprint dal loro esito.

---

## Piano sprint successivi (proposta Scrum Master, da confermare)

Sequenza indicativa, non calendarizzata — un solo sviluppatore, quindi ogni sprint parte
solo a chiusura del precedente. Priorità e ordine sono una proposta di ingegneria, non
una decisione di business: rivedere prima di aprire ciascuno sprint.

EPIC-003 (Streak presenze) ed EPIC-004 (Obiettivi trainer) erano **già implementate**
prima di aprire i rispettivi sprint. EPIC-005 (Avatar + Negozio) è stata scoperta
(Sprint #3, raccomandazione di non procedere) ma l'utente ha scelto comunque uno spike
tecnico ridotto (Sprint #4, STORY-014, override esplicito — vedi ADR-003), deployato
su prod. TD-001/TD-002 risolti. EPIC-002 chiusa (Sprint #5).

**EPIC-007 (Privacy & Data Protection) ha ora priorità massima — richiesta esplicita
dell'utente sui risultati del Privacy & Data Protection Audit — e precede EPIC-005
completa nella coda.** Sprint #6 (sopra) copre le sole P0 tecniche. Candidati per gli
sprint successivi, in ordine:

**Candidati aperti (in ordine di priorità):**
1. **Resto di EPIC-007, P0 rimaste bloccate** — STORY-019 (Privacy Policy/Cookie Policy)
   e STORY-020 (consenso genitoriale minori), non appena il contenuto legale/la
   decisione dell'utente arrivano dal track parallelo aperto in Sprint #6. Priorità
   massima non appena sbloccate, a prescindere da cos'altro è in coda in quel momento.
2. **EPIC-007, P1** — STORY-021 (verifica regione Firestore, bloccata sull'utente ma
   verifica leggera), STORY-022 (self-hosting font, READY, nessun blocco), STORY-023
   (script di backup interim, READY per la parte tecnica). Candidati naturali per
   **Sprint #7**, dimensionati per stare insieme in un solo sprint senza ripetere il
   pattern "troppe story a metà".
3. **EPIC-007, P2** — STORY-024 (minimizzazione dati sensibili per `staff_readonly`),
   STORY-025 (rimuovere/correggere `deleteOrganization`, READY), STORY-026 (policy di
   retention, BLOCKED su decisione utente — stesso track parallelo di STORY-019/020).
4. **EPIC-007, P3** — STORY-027 (rimuovere `VITE_FIREBASE_MEASUREMENT_ID`, READY),
   STORY-028 (export dati strutturato per il cliente, READY ma richiede una scelta di
   flusso UX minima prima di stimare).
5. **EPIC-005 completa — Avatar + Negozio**, dopo EPIC-007, se/quando le domande aperte
   in `docs/BACKLOG.md` hanno risposta (asset grafici, priorità rispetto alla
   gamification esistente, bilanciamento economia). Non riconsiderare prima che
   EPIC-007 sia sostanzialmente chiusa, salvo diversa istruzione esplicita dell'utente.

---

## Storico sprint chiusi

### SPRINT #5 — EPIC-002: pulizia debito minore — chiuso il 2026-09-14

**Goal:** chiudere le due ultime story P3 in backlog, nessuna dipendenza esterna.

**Completato:**
- STORY-003 — rimosso il wrapper `calcPercentile` (0 consumer applicativi già
  confermato da lug 2026). Test dedicato rimosso (era tautologico senza il wrapper),
  commento residuo in `tables.js` corretto, CLAUDE.md aggiornato. 211/211 test verdi.
- STORY-004 — `VITE_GOOGLE_FIT_CLIENT_ID` rimossa da `.env.example`, previa conferma
  esplicita dell'utente (nessun flusso OAuth diretto pianificato che la usi).

**Non completato:** nessuno.

**Blockers:** nessuno.

**Tech debt emerso:** nessuno.

**Prossimo sprint (candidati):** nessun item P1/P2 aperto — solo EPIC-005 completa,
bloccata sulle stesse dipendenze esterne di sempre (vedi Sprint #3/#4).

---

### SPRINT #4 — Avatar + Negozio: spike tecnico (override ADR-002) — chiuso il 2026-09-14

**Goal:** dopo la raccomandazione di non procedere (Sprint #3), l'utente ha scelto
esplicitamente — tra 3 opzioni presentate, rischio incluso nella descrizione — uno
spike tecnico senza arte reale. Non un nuovo sprint pianificato, una continuazione
diretta della stessa conversazione/decisione.

**Completato:**
- STORY-014 — meccanica Monete + negozio riusando le 9 immagini avatar esistenti
  (nessuna arte nuova, nessun sistema a 6 slot, nessun flusso B2B — scope ridotto
  rispetto alla visione completa, per scelta esplicita, vedi ADR-003).
- Guadagno Monete solo da sessione presente (`chiudiSessione`), acquisto via nuova
  Cloud Function `acquistaAvatar` con transazione Firestore (non batch).
- **Verificato dal vivo contro rankex-dev**, non solo per lettura di codice: script
  one-off con auth REST + invocazione diretta della callable — rifiuti corretti
  (avatar non acquistabile, Monete insufficienti, doppio acquisto), acquisto riuscito
  con decremento Monete e inventario aggiornato. Dati di test ripuliti dopo la verifica.
- 5 nuovi test unitari (`isAvatarUnlocked`), build+lint+vitest puliti.

**Non completato:** deploy su prod — resta su rankex-dev in attesa di conferma.

**Blockers:** nessuno tecnico.

**Tech debt emerso:** nessuno nuovo. Rischio già dichiarato in ADR-003: se questo
spike non porta a validazione reale, è candidato esplicito a rimozione come codice
morto in un futuro audit (stesso destino di Wearable/ContextNav documentato altrove).

**Prossimo sprint (candidati):** EPIC-002 (pulizia minore) resta l'unico item senza
dipendenze esterne. Deploy prod dello spike, se l'utente lo conferma.

---

### SPRINT #3 — Avatar + Negozio: discovery — chiuso il 2026-09-14

**Goal:** valutare EPIC-005 (Product Analyst + Tech Lead), zero codice, come richiesto
esplicitamente dalla Roadmap futura ("allinearsi con il team prima di iniziare").

**Completato:**
- STORY-011 — valutazione valore: **raccomandazione di non procedere ora**. Non un
  giudizio tecnico, tre dipendenze esterne reali (asset grafici, bilanciamento
  economia via playtesting, flusso B2B che richiede org clienti interessate) che il
  codice da solo non risolve.
- STORY-012 — modello economico: fonti di Monete confermate dalla roadmap, importi
  non definibili senza playtesting. Superficie di integrazione tecnica identificata:
  tocca più Cloud Function esistenti coordinate (chiudiSessione, salvaCampionamento,
  salvaBia, sistema badge), non una sola nuova.
- STORY-013 — scoping tecnico: modello dati raffinato, pronto da riprendere. Stimato
  più grande di Obiettivi+Runbook insieme se/quando si procede.

**Non completato:** l'implementazione — per scelta, non per blocco tecnico (vedi ADR-002).

**Blockers:** risposte dell'utente su priorità/budget arte/validazione economia — non
risposte che il processo può dare da solo.

**Tech debt emerso:** nessuno — discovery pura, zero codice toccato.

**Prossimo sprint (candidati):** EPIC-002 (pulizia minore, eseguibile subito) se
EPIC-005 resta bloccata; EPIC-005 stessa se le domande aperte si sbloccano.

---

### SPRINT #2 — Obiettivi trainer (+ Runbook manuale fuori piano) — chiuso il 2026-09-14

**Goal:** implementare EPIC-004 (target percentile su un test, con scadenza,
achievement rilevato server-side) — deviazione dal piano originale, che puntava su
EPIC-003 (Streak presenze), risultata già implementata prima di aprire lo sprint.

**Completato:**
- STORY-008 — modello dati + rules (7 nuovi test rules verdi su emulatore)
- STORY-009 — UI trainer (solo vista trainer — client-side è fast-follow)
- STORY-010 — notifica achievement (rilevamento server-side in salvaCampionamento)
- EPIC-006 (Runbook manuale) — aggiunta fuori piano, richiesta dall'utente durante la
  verifica di STORY-009/010. Completata nella stessa finestra invece di rimandarla a
  un nuovo sprint: indipendente da Obiettivi, piccola abbastanza da non giustificare
  l'overhead di un sprint a parte.

**Deploy prod — 2026-09-14:**
Cloud Functions + rules lanciate a mano da terminale (bloccate dal classificatore auto
sul comando diretto `npm run deploy` — girate poi dall'utente), poi `dev` → `main` (mai
pushato su origin prima d'ora in questa sessione, 15 commit) → push accettato → CI +
deploy.yml automatico → hosting + rules su fitquest-60a09. Verificato via
`firebase functions:list` (funzioni presenti) e `gh run view` (CI success, Deploy to
Firebase success).

**E2E fallito sullo stesso push, ma confermato preesistente:** stessi 2 test falliti
già su `main` dal 3 agosto 2026 (stesso file, stessa riga, stesso errore — confrontato
run per run) — non una regressione di questo sprint. Loggato come TD-002, uno dei due
è un bug comportamentale reale (non solo test fragile): `staff_readonly` vede il
bottone "+ NUOVO CLIENTE" che dovrebbe essere nascosto.

**Non completato:** nessuno.

**Blockers:** nessuno.

**Tech debt emerso:** TD-002 (vedi sopra). TD-001 (2 test rules preesistenti, trovati
durante STORY-008) resta OPEN, non collegato a questo sprint.

**Prossimo sprint (candidati):** vedi "Piano sprint successivi" in cima al file.

---

### SPRINT #1 — Correttezza dati e sicurezza residua — chiuso il 2026-09-14

**Goal:** chiudere i due problemi con impatto diretto su dati reali/sicurezza già
documentati in CLAUDE.md, prima di aprire qualunque nuova feature.

**Completato:**
- STORY-001 — rollback percentili soccer (4 test): **già risolto** prima dell'apertura
  dello sprint (branch mergiato in dev il 09/05, ulteriore fix 01/07). Nessun codice
  toccato, nessun deploy — solo verifica + correzione di CLAUDE.md, che non era mai
  stato aggiornato dopo il merge.
- STORY-002 — chiusura RX-63 (accessToken wearable): 0 client coinvolti su dev+prod.
  Nessuna azione di codice necessaria (il campo resta nello schema per un'eventuale
  riattivazione futura, remediation già documentata per quel momento).

**Non completato:** nessuno — entrambe le story P1 chiuse, EPIC-002 (P3, filler) non
toccata, resta in backlog libero.

**Blockers:** nessuno.

**Tech debt emerso — non di codice, di processo:** entrambe le story P1 di questo
sprint erano *già risolte* quando lo sprint è stato pianificato — il Product Owner le
aveva costruite leggendo sezioni di CLAUDE.md rimaste non aggiornate dopo il lavoro
reale (percentili: merge del 09/05 mai riportato in doc; wearable: già noto, RX-63 era
comunque da verificare non da presumere risolto). **Causa radice:** CLAUDE.md non ha
un trigger che lo marchi "da rivedere" quando lo stato che descrive cambia — dipende
dalla disciplina di chi fa il merge nell'aggiornarlo nello stesso commit. Non è un
problema nuovo: CLAUDE.md stesso documenta più round di audit passati con lo stesso
pattern (file/feature rimossi ma mai tolti dalla documentazione). Da tenere a mente per
la prossima Retrospective: vale la pena una story dedicata a un controllo periodico di
coerenza CLAUDE.md↔codice, invece di scoprirlo story per story.

**Prossimo sprint (candidati):** SPRINT #2 — Streak presenze (EPIC-003), come da piano
originale — nessuna revisione necessaria, EPIC-003/004/005 non toccate da quanto emerso
qui.

_(Nota a posteriori: anche EPIC-003 si è rivelata già implementata all'apertura dello
Sprint #2 — vedi sopra. Stesso pattern, seconda volta di fila.)_

---

<!-- Ogni sprint chiuso viene appeso qui dallo Scrum Master -->
