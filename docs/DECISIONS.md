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

## [ADR-004] Processo di cancellazione dati (diritto all'oblio GDPR) — manuale, non self-service
**Data:** 2026-09-15
**Contesto:** STORY-021 (EPIC-008, Privacy & Compliance). RankEX oggi non ha un
flusso self-service "cancella il mio account/i miei dati" né un processo documentato
per rispondere a una richiesta di cancellazione — bloccante per compilare il Google
Play Data Safety form e per una Privacy Policy completa (vedi `docs/
PRIVACY-POLICY-DRAFT.md`).
**Decisione:** processo **manuale, mediato dal supporto**, non un flusso self-service
nuovo:
1. La richiesta arriva a RankEX o all'organizzazione (canale di supporto, non ancora
   formalizzato — `[DA DEFINIRE]` l'indirizzo/modulo esatto)
2. Verifica identità del richiedente (email registrata coincidente)
3. Esecuzione da parte di org_admin (per un proprio membro/cliente) o super_admin (per
   qualunque org) usando gli strumenti amministrativi **già esistenti**:
   `eliminaCliente` (cliente) o `rimuoviMembroTeam` (membro team) — entrambi già
   cancellano account Firebase Auth + documento `/users/{uid}` + counter piano
**Perché non un flusso self-service:** RankEX è B2B con un numero contenuto di
organizzazioni/utenti — costruire un flusso self-service (UI + callable + conferma
email + gestione edge case tipo "cliente con schede/note ancora attive") è una
superficie di lavoro non piccola per un volume di richieste atteso basso. Stesso
principio già applicato ad altre decisioni di questo processo (non costruire per
scenari ipotetici, vedi CLAUDE.md).
**Scoperta durante questa story, non prevista all'apertura:** verificando se
`eliminaCliente` fosse davvero sufficiente per una cancellazione GDPR-completa, è
emerso che **non lo era** — cancellava il documento cliente ma lasciava orfane le
subcollection `notes`/`goals` in Firestore (BUG-001, `docs/BUGS.md`). Fixato nella
stessa sessione: `eliminaCliente.js` ora usa `db.recursiveDelete(clientRef)` invece di
`batch.delete(clientRef)`. Senza questo fix, la decisione "il processo manuale con gli
strumenti esistenti basta" sarebbe stata presa su una premessa falsa.
**Non ancora verificato:** il fix non è stato testato contro l'emulatore o
`rankex-dev` (solo `node --check` sintattico) — da fare prima di considerare questa
ADR pienamente chiusa e prima di qualunque deploy prod.
**Alternative scartate:** flusso self-service con conferma email + Cloud Function
dedicata — rimandato, non scartato in assoluto: se il volume di richieste cresce o se
un'organizzazione enterprise lo richiede contrattualmente, va riconsiderato.
**Conseguenze:** `docs/PRIVACY-POLICY-DRAFT.md` §7 e il Google Play Data Safety form
(STORY-022) possono ora descrivere un processo reale, non un placeholder. Il SLA di
risposta (GDPR art. 12(3) suggerisce 30 giorni) resta `[DA DEFINIRE]` — è una
decisione di servizio, non tecnica.

---

## [ADR-005] Back button Android — stack di "azioni indietro" generico invece di history reale
**Data:** 2026-09-15
**Contesto:** STORY-028 (trovata da code-reviewer durante STORY-026). Verificato che
`useTrainerNav.js` gestisce la navigazione trainer con puro `useState`, zero
`history.pushState`/`popstate`, e che quindi il fallback `window.history.back()` in
`useNativeBackButton.js` non può affidabilmente tornare "indietro di una pagina"
nell'app. Scoping richiesto prima di implementare (nessun device disponibile in
questo ambiente per verifica dal vivo).

**Blast radius — verificato file per file, non assunto:** il pattern è sistemico, non
isolato al trainer. Grep su tutto `src/` per `useNavigate`/`useLocation`/
`history.pushState`/`popstate` non trova **nessun** risultato fuori da
`useModalStack.js`/`useNativeBackButton.js` (solo commenti). `react-router-dom` è
usato esclusivamente per i 4 route dichiarativi di primo livello in
`routes.config.jsx` (`/admin`, `/org`, `/trainer`, `/client`), tutti raggiunti via
`<Navigate replace />` (mai `push`) — sia da `AppRouter.jsx` sia da
`ProtectedRoute.jsx`. Ogni ruolo gestisce la propria navigazione interna con
`useState` locale, confermato leggendo il codice di ciascuno:
- **trainer + org_admin**: condividono lo stesso hook `useTrainerNav.js` (`page` +
  `selectedClient` via `TrainerContext`) — `OrgAdminView.jsx` lo importa
  direttamente da `features/trainer/`.
- **super_admin**: `SuperAdminView.jsx` — `useState` locale per `page` e
  `selectedOrg`, hook dedicato assente.
- **client**: `ClientDashboardPage.jsx` — `useState` locale per `activeTab`/
  `testTab`/`profiloTab` (Pentagon Hub).
Nessuna asimmetria tra ruoli: stesso gap ovunque.

**Il bug reale è più specifico di quanto ipotizzato in STORY-028 — non "va su una
schermata stale", ma "back minimizza sempre l'app":** `canGoBack` (passato da
`@capacitor/app`) riflette la history reale della WebView. Dato che l'unica
navigazione a URL reale dell'app sono i 4 redirect di `routes.config.jsx`, tutti
`replace` (mai un secondo entry reale), e che non esiste alcun `navigate()`
push/deep-link/`appUrlOpen` nel codice (verificato via grep, zero risultati),
`canGoBack` è nella pratica **sempre `false`** in uso normale. Il ramo pericoloso
`window.history.back()` (quello che potrebbe atterrare su una schermata
pre-inizializzazione SPA) è quindi probabilmente **dead code** oggi; il sintomo
dominante e concretamente riproducibile è invece che **ogni pressione di back senza
un modal aperto esegue `App.minimizeApp()`** — anche dentro al wizard nuovo cliente,
dentro a `ClientDashboard`/`GroupDetailView`/`RecurrenceDetailView`/`OrgDetailView`,
dove l'utente si aspetta di tornare al livello superiore, non di uscire dall'app.

**Web non ha lo stesso problema attivo, per un motivo diverso da "nessuno usa il
back fisico":** `useNativeBackButton()` è no-op fuori da Capacitor
(`isNativeApp()` controlla `window.Capacitor?.isNativePlatform?.()`, `undefined` in
browser) — su web questo codice non gira affatto, il back del browser resta gestito
nativamente da Chrome/Firefox/ecc. Lo stesso gap architetturale (nessuna history SPA
reale) esiste anche lì in teoria, ma nessun codice fa una promessa esplicita di
"back = torna alla pagina precedente dell'app" sul web — è il comportamento
implicito, generico, di qualunque SPA a URL singolo, non una feature costruita e
rotta. Su mobile invece il codice *tenta* esplicitamente questa semantica e fallisce
silenziosamente. La priorità è quindi legittimamente mobile-only.

**Decisione:** opzione (b) — generalizzare lo stack già esistente e già in
produzione (`hooks/useModalStack.js`, STORY-026) da "stack di modal aperti" a
"stack di azioni indietro", invece di introdurre `history.pushState`/`popstate`
reale (opzione a).
- Rinominare le API generiche (`pushModalClose`→`pushBackAction`,
  `closeTopModal`→`triggerTopBackAction`, `hasOpenModal`→`hasBackAction`) — la
  logica interna non cambia, è già agnostica rispetto al contenuto (un semplice
  LIFO di callback), solo il nome oggi implica erroneamente "solo modal". Il
  wrapper `useModalBackButton(onClose)` resta invariato per `Modal`/`ConfirmDialog`.
  Nuovo wrapper `useViewBackButton(onBack)` per viste/step non-modali, stessa forma.
- `useNativeBackButton.js` consulta un solo stack invece di due concetti separati,
  ed **elimina completamente `canGoBack`/`window.history.back()`**: se lo stack ha
  un'azione, la esegue; altrimenti `App.minimizeApp()` sempre — mai più un salto
  verso una WebView history che l'app non controlla. Questo fallback è per
  costruzione **uguale o migliore** del comportamento attuale in ogni caso (oggi
  `canGoBack` è quasi sempre `false` → già minimizza; nel raro caso fosse `true`,
  oggi rischia di atterrare altrove, con la modifica minimizza in modo prevedibile
  invece) — verificabile per lettura di codice, senza device.
- **Principio guida per cosa registrare sullo stack (wave 2):** il back fisico
  replica **esattamente** l'azione del back-affordance già visibile a schermo,
  dove esiste — non si inventa una nuova semantica. Verificato che questi
  affordance esistono già, con handler già isolati e riusabili senza ambiguità:
  - `useTrainerNav.js`: quando `selectedClient` è impostato, registra
    `deselectClient` — copre sia `TrainerView.jsx` sia `OrgAdminView.jsx` con
    un'unica modifica, essendo l'hook condiviso.
  - `GroupDetailView.jsx` / `RecurrenceDetailView.jsx`: registrano il prop
    `onBack` già ricevuto (già usato dal chevron-back nell'header, RX-42).
  - `SuperAdminView.jsx`: quando `selectedOrg` è impostato, registra
    `() => setSelectedOrg(null)` (stessa azione del prop `onBack` già passato a
    `OrgDetailView`).
  - `NewClientView.jsx`/`useWizard.js`: registra lo stesso handler già cablato sul
    chevron-back dell'header (`onBack`, che oggi esce sempre dal wizard verso la
    lista clienti indipendentemente dallo step — non un nuovo comportamento "step
    indietro", solo mirror di quello che il bottone visibile già fa oggi).
  - `ClientDashboardPage.jsx`: quando `activeTab !== 'home'`, registra
    `() => setActiveTab('home')` — stessa azione già eseguita ritoccando la stessa
    icona attiva nella bottom nav.
  Nessuna di queste è una nuova decisione UX: sono tutte il mirror di un
  comportamento già shippato e (presumibilmente) già rivisto per lo schermo
  interessato. Stima: ~8 file toccati, ognuno con un'aggiunta isolata di poche
  righe (stesso hook `useEffect`-based già validato da STORY-026), zero modifiche
  al modello di stato esistente.
- **Esplicitamente fuori scope, richiede input Product/UX prima di essere chiuso**:
  il back tra pagine di primo livello dello stesso ruolo che sono "sorelle", non
  "genitore/figlio" (es. trainer: Dashboard↔Clienti↔Gruppi↔Calendario tramite la
  nav principale; client: le sezioni del Pentagon Hub) — qui non esiste un
  back-affordance visibile da imitare, perché non c'è una gerarchia. Due semantiche
  ragionevoli in competizione: "minimizza sempre" (comportamento odierno di fatto,
  e convenzione comune nelle app Android con bottom-nav — es. Gmail/Instagram) vs
  "torna all'ultima pagina di primo livello visitata" (richiederebbe comunque un
  mini-stack, ma con una domanda di prodotto vera: quante voci ricordare, se
  ricordarle tra sessioni, ecc.). Raccomandazione tecnica: default a "minimizza"
  (= non registrare nulla per i cambi tab di primo livello, lasciando il fallback
  fare il suo lavoro) finché Product/UX non chiede esplicitamente il contrario — è
  il comportamento a costo zero, coerente con l'unica convenzione Android già
  citata in CLAUDE.md, e non blocca la wave 2 sopra.
**Alternative scartate:**
- **(a) `history.pushState`/`popstate` reale**: la soluzione "corretta" in teoria,
  ma sproporzionata qui — richiederebbe instrumentare ogni pezzo di stato
  "pagina/tab" nell'app (almeno `useTrainerNav`, `SuperAdminView`, `useWizard`,
  `ClientDashboardPage`, `GroupDetailView`, `RecurrenceDetailView`, verosimilmente
  altri non ancora auditati come `TrainerCalendar` month/week/day) per tenerlo
  sincronizzato manualmente con la URL — doppio stato che può divergere, in
  competizione con i 4 `<Routes>` dichiarativi già esistenti e con `ProtectedRoute`
  (che fa `replace` assumendo di essere l'unico a toccare la history). Cambierebbe
  anche il comportamento del back del **browser desktop** per ogni tab-switch
  interno, un cambio di UX per tutta l'utenza web non richiesto da questa story.
  Scartata per lo stesso principio già applicato altrove nel backlog ("non
  costruire quello che non è stato capito") — qui in più non sarebbe nemmeno
  verificabile dal vivo in questa sessione (nessun device).
- **Wrapper di sola compatibilità (mantenere `canGoBack`/`history.back()` come
  ulteriore fallback dopo lo stack)**: scartata — è la fonte del bug originale
  (WebView history che l'app non controlla né può prevedere), e si è verificato
  che `canGoBack` è quasi sempre `false` comunque: tenerlo non aggiunge copertura
  reale, solo il rischio residuo che si voleva eliminare.
**Conseguenze:** la wave 1 (rimozione di `window.history.back()`, fallback sempre a
`minimizeApp`) è sicura da spedire senza device — per costruzione non peggiora
nessun caso odierno, verificabile leggendo il codice. La wave 2 (registrazione dei
back-affordance già esistenti) resta comunque raccomandata per QA su device reale
prima del rilascio in produzione (nessun modo di simulare l'evento `backButton` di
Capacitor fuori da una WebView Android vera) — stessa cautela già presa per STORY-026
("non verificato su device reale"). La semantica del back tra pagine di primo
livello resta esplicitamente aperta e non bloccante: va posta a Product/UX come
domanda separata, non decisa unilateralmente qui.

---
<!-- Nuove decisioni aggiunte qui dal Tech Lead -->
