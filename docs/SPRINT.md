# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

### SPRINT #12 — EPIC-010 Lipedema Edition, terza ondata (30s-STS + Handgrip bilaterale) — aperto il 2026-10-31

**Branch:** `feature/lipedema-module` (allineato a `origin/dev` in `27bfc55` all'apertura).
Rules e functions si deployano solo da qui (ADR-014 rischio #4). **Nessun deploy in prod
del modulo** (DPA non firmato, STORY-029).

**Goal:** il professionista registra 30s-STS e Handgrip con prove multiple per mano,
validità per prova e best calcolato dal server, con storico grezzo — e la logica
bilaterale è pronta per essere riusata da HHD e OLS.

**Story selezionate:**
1. **STORY-035** — 30s-STS (`lipedema_30s_sts`): prova singola come il 2MWT, ma con
   0 da invalidazione "uso braccia" distinto dallo 0 reale, errore tecnico separato da
   deviazione, setup sedia, familiarizzazione non conteggiata.
2. **STORY-036** — Handgrip: introduce l'infrastruttura **bilaterale multi-prova**
   (ordine alternato D-S, validità per prova, best per lato = max delle valide,
   Strongest/Weakest, simmetria, N/kgf con valore nativo conservato), scritta come
   logica condivisa in `utils/lipedema.js` ↔ `shared/lipedema.js` (test di parità).
3. **Criteri di STORY-033 rimandati dal #11, solo la parte bilaterale** — validità per
   prova + best sulle sole valide, dolore per prova e per lato, lato dominante: si
   verificano end-to-end su STORY-036, quindi chiudono insieme a lei.
4. **Workflow GitHub a Node 22** — `ci.yml`, `deploy.yml` (2 job), `e2e.yml` hanno
   ancora `node-version: '20'`, mentre `functions/` gira su Node 22 da `13052d6`.
   Task piccolo, prima del resto: allinea la CI al runtime reale.

**Fuori dal #12, candidati del #13 (motivo):**
- **STORY-037 (HHD) e STORY-038 (OLS)** dipendono da STORY-036. Metterle nello stesso
  sprint significa costruire due test sopra un'infrastruttura bilaterale non ancora
  passata da review e QA: se la review di 036 cambia la forma della logica condivisa,
  si rifanno tre test invece di uno. Il #11 aveva 3 story e ha prodotto 1 HIGH + 3
  MEDIUM in review e 3 bug in QA: quattro test più i criteri 033 più la guida sono
  oltre la capacità reale di un solo sviluppatore. Meglio chiudere 035+036 bene.
- **Guida dei 5 test in `TestGuidePage`** (criterio 033): va scritta quando esistono
  tutti e 5 i test, insieme a 037/038, per non pubblicare istruzioni di test non
  ancora registrabili.
- STORY-039 (storico/trend/non comparabilità) e STORY-040 (PDF) restano dopo.

**Sequenziamento:** workflow Node 22 → 035 (stesso schema del 2MWT, nessuna nuova
infrastruttura) e, in parallelo, design di 036 (Tech Lead: forma della logica bilaterale
condivisa, decimali dopo la conversione kgf→N, lato dominante del paziente o della
valutazione; ux-ui-designer: inserimento guidato delle 6 prove alternate su mobile) →
implementazione 036 + criteri 033 bilaterali → code review (verifica esplicita: logica
bilaterale riusabile da 037/038) → deploy dev (functions → rules → hosting) → **QA
sull'hosting reale** `rankex-app-dev.web.app`, desktop e mobile.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| Workflow GitHub `node-version` 20 → 22 (`ci.yml`, `deploy.yml` ×2, `e2e.yml`) | IN REVIEW | Nessuna dipendenza. Verifica: CI verde su un push del branch. |
| STORY-035 — 30s-STS | IN REVIEW | Riusa schema/callable di STORY-033 come il 2MWT. `stopReasonCode`: stesso catalogo provvisorio del 2MWT. |
| STORY-036 — Handgrip + infrastruttura bilaterale multi-prova | IN REVIEW (implementata su ADR-016 + spec UX) | Decisioni aperte: decimali dopo la conversione (rischio in backlog), lato dominante come dato del paziente o della valutazione (criterio 033). Da loggare in `docs/DECISIONS.md` prima di iniziare. |
| STORY-033 — criteri bilaterali rimandati (validità per prova, best sulle valide, dolore per lato, lato dominante) | IN REVIEW (insieme a STORY-036) | Chiudono con 036, non separatamente. |
| STORY-029 — requisiti non-codice (DPA, testo informativa, privacy draft) | BLOCKED (fuori capacità developer) | Proprietario utente/legale. Bloccano il go-live, non la chiusura sprint. |

**Dipendenze bloccanti / punti di attenzione:**
- **Cloud Functions:** `aggiungiValutazione` estesa a due nuovi `testId`; deploy solo
  `deploy:dev`, runtime Node 22. **Il prossimo deploy delle functions in prod (anche
  per altri motivi) deve usare Node 22**: Node 20 è dismesso da Google dal 30/10.
- **`firestore.rules`:** nessuna modifica prevista (le valutazioni restano
  `write: false`). Se emerge, va segnalata qui prima di farla.
- **Copia speculare** `utils/lipedema.js` ↔ `shared/lipedema.js`: la logica bilaterale
  entra nel test di parità — condizione di DONE (ADR-014 rischio #3). Precedente del
  #11: il test di parità non deve importare file che dipendono da `firebase-functions`
  (la CI non installa `functions/node_modules`, `281bbe4`).
- **Osservazione UX accettata nel #11:** su mobile la barra del form copre la bottom
  tab bar durante la compilazione. Con le 6 prove dell'Handgrip il form è più lungo:
  l'ux-ui-designer lo tiene presente nel design di 036, senza riaprire il tema come
  lavoro di questo sprint.

**Scope creep — regola per questo sprint:** STORY-037…040, la guida test, i bug P3
aperti (BUG-003/005/007/008/010) e i TD aperti (TD-004…010) **non** entrano qui. Lavoro
emerso non pianificato → `docs/BACKLOG.md`.

**Prossimo sprint (candidati), in ordine:**
1. STORY-037 (HHD) e STORY-038 (OLS) sulla logica bilaterale di 036 + guida dei 5 test
   in `TestGuidePage` (ultimo criterio aperto di STORY-033)
2. STORY-039 (storico, trend, non comparabilità)
3. STORY-040 (export PDF paziente)
4. Bug P3 lipedema (BUG-003, BUG-010) se il Product Owner li vuole prima del go-live

---

## Piano sprint successivi (proposta Scrum Master, da confermare)

**Aggiornamento 2026-10-30:** la coda corrente è EPIC-010 (Lipedema Edition) — vedi i
candidati in fondo a Sprint #12. Il piano sotto (EPIC-007/EPIC-005) è precedente e va
rivisto dal Product Owner prima di riaprirlo.

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

# SPRINT #11 — chiuso il 2026-10-31

EPIC-010 Lipedema Edition, seconda ondata (informativa + Valutazione + 2MWT) — aperto
il 2026-10-30, branch `feature/lipedema-module`.

## Goal
Un professionista registra l'informativa e salva/annulla una valutazione 2MWT, con
storico grezzo verificabile. **Raggiunto.**

## Completato
- **STORY-029 (parte tecnica)** — `client.privacyNotice` solo via callable, audit
  `PRIVACY_NOTICE_RECORDED` con soli id, gate `failed-precondition` in
  `aggiungiValutazione` e `salvaBia`, banner sul paziente. Commit `cc42e34`.
- **STORY-033** — infrastruttura Valutazione (subcollection `assessments`, rules
  `write: false`, `aggiungiValutazione`/`annullaValutazione`, annulla + reinserisci,
  snapshot di comparabilità, coppia `utils/lipedema.js` ↔ `shared/lipedema.js` nel test
  di parità), per la parte verificabile col solo 2MWT. Commit `cc42e34`.
- **STORY-034** — 2MWT: distanza calcolata dal server, validazioni, percorso variante,
  stop anticipato, dati clinici opzionali pre/post. Commit `cc42e34`.
- **Code review:** 1 HIGH + 3 MEDIUM, tutti corretti prima della QA.
- **QA dal vivo sull'hosting reale** `rankex-app-dev.web.app` (non vite locale, lezione
  di BUG-009): tutta PASS.
- **BUG-011** (form compilato perso senza conferma), **BUG-012** (barra SALVA non fissa
  su mobile), **BUG-013** ("Ultime valutazioni" senza segnalare variante/interruzione) —
  trovati dalla QA, fixati in `769565d`, **VERIFIED** il 31/10 su rankex-app-dev
  (`27bfc55`).

## Non completato (motivo)
- **Criteri di STORY-033 non verificabili col solo 2MWT** — validità per prova e best
  sulle valide, dolore per lato, lato dominante, guida dei 5 test in `TestGuidePage`.
  Rimandati per scelta, già previsto all'apertura: i bilaterali al #12 con STORY-036,
  la guida con 037/038.
- **STORY-029, requisiti non-codice** (DPA art. 28 firmato, testo dell'informativa,
  privacy draft): BLOCKED, proprietario utente/legale. Bloccano il go-live, non lo
  sprint.
- Deploy in produzione del modulo: non previsto (DPA).

## Blockers
- Nessuno tecnico aperto.
- DPA / testo informativa (vedi sopra) — unico blocco al go-live di EPIC-010.

## Tech debt emerso
- **Runtime Cloud Functions portato a Node 22** (`13052d6`): Google ha dismesso Node 20
  il 30/10. Lavoro non pianificato ma obbligato (senza, niente deploy). Conseguenze
  aperte: (1) il prossimo deploy delle functions in **prod** dovrà usare Node 22;
  (2) i workflow GitHub (`ci.yml`, `deploy.yml`, `e2e.yml`) sono ancora su
  `node-version: '20'` → task nel Sprint #12.
- **CI rotta** da un import del test di parità verso un file che dipende da
  `firebase-functions` (la CI non installa `functions/node_modules`); corretta in
  `281bbe4` separando `shared/timezone.js`. Per la Retrospective: i file `shared/`
  importati dai test di parità devono restare puri, senza dipendenze di `functions/`.
- **Osservazione UX accettata, non un bug:** su mobile la barra del form (z-40) copre la
  bottom tab bar (z-30) durante la compilazione; si esce con INDIETRO, back dell'header
  o swipe, tutti con conferma (BUG-011/012). Da tenere presente nel design dei test
  multi-prova, più lunghi.
- Nessun nuovo TD numerato. Bug P3 e TD-004…010 invariati.

## Prossimo sprint (candidati)
STORY-035 + STORY-036 + criteri bilaterali di STORY-033 + workflow Node 22 → aperto come
Sprint #12, vedi sopra. Poi STORY-037/038 + guida test, 039, 040.

---
# SPRINT #10 — chiuso il 2026-10-30

EPIC-010 Lipedema Edition, prima ondata (fondamenta modulo) — aperto il 2026-10-24,
branch `feature/lipedema-module` da `dev`. Numerazione #10 e non #7: i numeri #7…#9
sono già stati usati su `feature/mobile-app` (TD-004).

## Goal
Un'org lipedema si crea, non mostra né calcola rank/XP, e gestisce pazienti senza
account.

## Completato
- **STORY-030** — modulo `lipedema`, capability esplicite in `getModule` (default
  restrittivo per moduli sconosciuti), terminologia Professionista/Paziente/
  Appuntamento, `shared/modules.js` + check di modulo nelle callable (ADR-008), cambio
  modulo bloccato con pazienti (rules + `OrgDetailView`). Commit `f71f73c`.
- **STORY-031** — niente rank/percentili/gamification nel modulo, lato UI e lato
  callable (XP/campionamento/obiettivi/avatar rifiutati; `chiudiSessione` e `salvaBia`
  senza XP). Commit `f71f73c`.
- **STORY-032** — wizard paziente senza account Auth, email facoltativa, audit
  `CLIENT_CREATED` senza nome; `eliminaCliente` con `listCollections` +
  `recursiveDelete`. Commit `f71f73c`.
- Tutte e tre **verificate dal vivo su rankex-dev** (QA 25/10, due giri: il primo su
  `f71f73c`, il secondo su `b119bfb` dopo i fix).
- **BUG-002** (terminologia hardcoded, P2), **BUG-004** (Elimina visibile a
  staff_readonly, P3), **BUG-006** (upgrade profilo da staff_readonly, P3) — fixati in
  `b119bfb`, **VERIFIED** dal vivo il 25/10.
- **BUG-009** (P0, fuori piano) — la CSP di `firebase.json` non ammetteva
  `*.cloudfunctions.net` in `connect-src`: **ogni** scrittura via callable era
  bloccata sull'hosting reale, produzione inclusa, dalla migrazione BE di luglio. Trovato
  dalla QA sull'hosting dev, fixato (`56905ee` su dev, verificato con smoke test su
  rankex-app-dev/rankex-admin-dev), pubblicato in produzione con hotfix `4f5d08e` su
  `main` il 26/10 (deploy-prod verde, header live verificato), poi riportato su dev
  (`2fb17a1`). Entrato nello sprint senza discussione: un P0 in prod ha precedenza su
  tutto.

## Non completato (motivo)
- Nessuna story pianificata lasciata a metà.
- Deploy in produzione del modulo lipedema: **non previsto** per scelta (nessuna org
  lipedema in prod prima del DPA, STORY-029).

## Blockers
- Nessuno tecnico aperto.
- BUG-009 in prod: header verificato, la prova di scrittura dal vivo in produzione è a
  cura dell'utente (da confermare in `docs/BUGS.md` quando fatta).

## Tech debt emerso
- **Bug P3 aperti** (non bloccanti, fuori sprint): BUG-003 (badge scrivibili
  direttamente su un paziente, stessa causa di TD-005), BUG-005 (tab BIA visibile nel
  soccer), BUG-007 (azioni di scrittura del calendario visibili in readonly), BUG-008
  (area atleta con terminologia PT fissa), BUG-010 (plurale con quantità 1 in lipedema).
- **TD aggiunti in sprint:** TD-007 (soccer dichiara `hasBia`/`hasProfileTypes` false
  ma la UI offre la BIA), TD-008 (`OrgDetailView` senza scelta di
  `terminologyVariant`), TD-009 (audit `CLIENT_DELETED` solo client-side,
  `CLIENT_CREATED` doppio), TD-010 (codice morto degli step 'test' in `useWizard`).
  TD-004/005/006 restano aperti dal design (24/10).
- **Tech debt di processo (per la Retrospective):** la CSP non era coperta da alcun
  test. Gli e2e e la QA locale girano su vite, che non applica gli header di
  `firebase.json`: il blocco di tutte le callable è rimasto invisibile per circa tre
  mesi ed è emerso solo perché la QA di questo sprint ha usato l'hosting dev reale.
  Da discutere: un test che verifichi la CSP rispetto ai domini usati dall'app, o un
  e2e minimo contro l'hosting deployato (suggerimento già in BUG-009); e la QA
  sull'hosting reale come passo fisso prima di chiudere una story che tocca callable.
- Pattern osservato: i fix di BUG-002 hanno toccato 48 file — la terminologia per
  modulo era una superficie più grande di quanto l'inventario ADR-007 prevedesse.

## Prossimo sprint (candidati)
STORY-029 (parte tecnica) + STORY-033 + STORY-034 → aperto come Sprint #11, vedi sopra.
Poi STORY-035/036, 037/038, 039, 040.

---

### SPRINT #6 — EPIC-007: Privacy & Data Protection, remediation P0 — aperto il 2026-09-14, archiviato il 2026-10-24

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

**Archiviato il 2026-10-24 dallo Scrum Master, senza una chiusura formale in questo file.**
Le 4 story tecniche (STORY-015…018) erano DONE su rankex-dev; il lavoro EPIC-007
successivo (DPA, export, cancellazione org, font locali, backup — commit `91d9de7`,
`5fe04fc`, `12e8709`) è stato fatto fuori da questa status board. Una chiusura formale
di Sprint #6 esiste solo su `feature/mobile-app` (commit `bba54ab`), mai arrivata su
`dev` (TD-004). Spostato qui per avere un solo sprint attivo; stato attuale delle
story EPIC-007 in `docs/BACKLOG.md`.

---

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
