# Lezione 23 — Roadmap finale: competenze, punti deboli, piano di studio
[← Indice](00-indice.md)

Questo capitolo non segue la struttura delle altre 22 lezioni. È un bilancio: cosa sai fare
adesso, cosa il corso ha deliberatamente lasciato fuori (e dove trovarlo quando ti servirà), quali
concetti del corso sono i più insidiosi per chi arriva dal "vibe coding" e merita rifare sul serio,
e un piano concreto in quattro fasi per passare da "ho letto tutto" a "sono autonomo su questo
progetto".

## Cosa hai imparato — roadmap delle competenze acquisite

### Modulo 0 — Fondamenta React nel progetto
| Lezione | Cosa hai imparato |
|---|---|
| [01 — Bootstrap dell'app](01-bootstrap-app.md) | La traccia di avvio reale: `main.jsx` → `BrowserRouter`/`ToastProvider` → `App.jsx` → `useAuth`/`useSessionTimeout`/`useVersionCheck` → `ErrorBoundary` → `DomainGuard` → `AppRouter`, e perché l'ordine di questi wrapper non è arbitrario. |
| [02 — JSX, componenti funzionali e props](02-jsx-componenti-props.md) | Come RankEX compone UI esclusivamente con function component, senza una singola eccezione stilistica (l'unica eccezione tecnica, `ErrorBoundary`, l'hai vista nel Modulo 5). |
| [03 — Styling: Tailwind v4 + design tokens](03-styling-tailwind-tokens.md) | Il modello CSS-first di Tailwind v4 (niente `tailwind.config.js` classico), le CSS custom properties `--rx-*` e la relazione (spesso disallineata) con `design/tokens.js`. |

### Modulo 1 — Stato e hook
| Lezione | Cosa hai imparato |
|---|---|
| [04 — useState e form controllati](04-usestate-form.md) | Il pattern di base per form gestiti in React, applicato ai form reali del progetto (login, creazione cliente, ecc.). |
| [05 — useEffect e ciclo di vita](05-useeffect-lifecycle.md) | Quando un effect serve davvero (sincronizzare con qualcosa di esterno a React) contro quando è solo un `useState` derivato mascherato male. |
| [06 — Custom hook, useCallback e closures](06-custom-hook-usecallback.md) | Come i custom hook del progetto (es. `useClients.js`) incapsulano stato + fetch + optimistic update, e le trappole delle closure stantie con `useCallback`. |
| [07 — Context API + useReducer](07-context-usereducer.md) | `TrainerContext` come esempio reale di stato condiviso a livello di sottoalbero, con `useReducer` per transizioni di stato più strutturate di una sequenza di `useState`. |

### Modulo 2 — Routing e autenticazione
| Lezione | Cosa hai imparato |
|---|---|
| [08 — React Router, lazy loading, ProtectedRoute](08-react-router-protected-route.md) | Come `routes.config.jsx` mappa ruolo → componente, e come `ProtectedRoute` blocca l'accesso prima ancora che il componente monti. |
| [09 — Firebase Auth e ciclo utente→profilo→org](09-firebase-auth.md) | Il flusso `useAuth.js`: da `onAuthStateChanged` a `user` → `profile` (`/users/{uid}`) → `org` (`/organizations/{orgId}`), e i tre stati distinti `undefined`/`null`/valore lungo il percorso. |
| [10 — Multi-tenancy: orgId, ruoli, DomainGuard](10-multitenancy-domainguard.md) | Perché `orgId` è "sempre il primo argomento" (convenzione architetturale più importante del progetto secondo l'indice del corso), e come `DomainGuard` separa dominio app/admin solo in produzione. |

### Modulo 3 — Firebase / dati
| Lezione | Cosa hai imparato |
|---|---|
| [11 — Modello dati Firestore e path helpers](11-firestore-data-model-paths.md) | La struttura `organizations/{orgId}/...` e perché ogni path passa da `firebase/paths.js` invece di essere scritto a mano ovunque. |
| [12 — Letture dirette Firestore](12-firestore-letture-dirette.md) | Come `firebase/services/*.js` legge da Firestore (`getDocs`/`getDoc`) senza passare da Cloud Functions — il ramo "lettura" dell'architettura ibrida. |
| [13 — Cloud Functions callable e il layer usecases/](13-cloud-functions-usecases.md) | Il ramo "scrittura": perché le operazioni sensibili (creare/eliminare cliente, XP, campionamenti) passano da `httpsCallable` invece che da scritture dirette Firestore lato client. |
| [14 — Optimistic UI con rollback](14-optimistic-ui-rollback.md) | Il pattern uniforme snapshot → update ottimistico → chiamata reale → rollback su errore, e la duplicazione voluta del calcolo XP tra client e Cloud Function. |
| [15 — Realtime con onSnapshot](15-realtime-onsnapshot.md) | Dove RankEX usa il realtime Firestore (calendario, notifiche) e dove invece sceglie deliberatamente fetch on-mount per risparmiare quota sul piano Spark. |
| [16 — Firestore Security Rules](16-firestore-security-rules.md) | La sintassi limitata delle regole (niente `if/return`, solo espressioni booleane), `userProfile()` null-safe, e i limiti di piano applicati solo su `create`. |

### Modulo 4 — Logica di dominio
| Lezione | Cosa hai imparato |
|---|---|
| [17 — Funzioni pure e unit test](17-funzioni-pure-unit-test.md) | Perché `utils/gamification.js`, `utils/bia.js` e simili sono scritti come funzioni pure testabili in isolamento — la base della piramide dei test che hai visto applicata nella Lezione 22. |
| [18 — Algoritmi statistici di dominio (percentili)](18-algoritmi-percentili.md) | `calcPercentileEx`, `getAgeGroupClamped`, il parametro `testKey` per risolvere l'ambiguità tra test che condividono la stessa `stat`, e la differenza tra tabelle percentili validate e stime interne. |
| [19 — Config-driven UI](19-config-driven-ui.md) | Come `modules.config.js`, `plans.config.js` e `trainer.config.jsx` guidano il comportamento dell'app da dati statici, evitando `if (moduleType === ...)` sparsi ovunque nel codice. |

### Modulo 5 — Qualità e produzione
| Lezione | Cosa hai imparato |
|---|---|
| [20 — Error boundaries e gestione errori](20-error-boundaries.md) | L'unica eccezione della codebase alla regola "solo function component" (`ErrorBoundary`), il pattern fallback come render-prop, e `getFirebaseErrorMessage` per tradurre errori Firebase in italiano. |
| [21 — Sicurezza applicativa](21-sicurezza-applicativa.md) | L'audit log append-only, il motivo tecnico reale per cui `getAuth(app)` in `auditLog.js` resta lazy, `validatePassword` come firma condivisa, timeout di sessione proporzionali al potere del ruolo, e i limiti strutturali di un'app Firebase puro-frontend. |
| [22 — Testing e CI/CD](22-testing-cicd.md) | La piramide dei test (unit/rules/e2e) applicata al progetto, perché le Security Rules richiedono un emulatore, e cosa fanno davvero (letto riga per riga) `ci.yml`, `e2e.yml`, `deploy.yml` — incluso il deploy automatico anche su `dev`. |

### Chiusura
| Lezione | Cosa hai imparato |
|---|---|
| 23 — questa lezione | Una mappa di cosa sai, cosa non è stato coperto, dove sono i trabocchetti concettuali, e un piano concreto per continuare da solo. |

## Cosa il corso NON copre — argomenti del progetto ancora da approfondire da soli

Il corso è ampio ma non esaustivo — RankEX è un progetto reale, e un progetto reale è sempre più
grande di 23 lezioni. Questo elenco è stato costruito verificando con Glob/Grep quali cartelle e
feature esistono davvero nel codice e non compaiono nel titolo di nessuna lezione dell'indice.
Nessuna di queste è "segreta": sono tutte raggiungibili applicando esattamente gli stessi pattern
che hai visto nel corso, semplicemente il tempo non è bastato a coprirle una per una.

- **Recharts e i componenti grafico nel dettaglio.** Il corso menziona Recharts nello stack e la
  Lezione 20 tratta gli `ErrorBoundary` che li avvolgono, ma non entra nel merito di *come* sono
  costruiti i grafici stessi. Da esplorare da solo:
  [`StatsChart.jsx`](../../src/features/client/StatsChart.jsx),
  [`BiaHistoryChart.jsx`](../../src/features/bia/bia-view/BiaHistoryChart.jsx),
  [`XPTrendChart.jsx`](../../src/features/client/client-dashboard/XPTrendChart.jsx),
  [`GroupAnalysis.jsx`](../../src/features/trainer/groups-page/GroupAnalysis.jsx) (che oltre a un
  `LineChart` Recharts costruisce anche una heatmap e un radar SVG **fatti a mano**, non con
  Recharts — un caso interessante di "quando la libreria non basta, si scrive SVG diretto").
- **Il wizard multi-step di creazione cliente.** `components/modals/new-client-wizard/` ha 6 step
  (`StepAnagrafica`, `StepCategoria`, `StepRuolo`, `StepProfileType`, `StepBia`, `StepAccount`),
  più `WizardNav.jsx`, `WizardProgress.jsx` e `useWizard.js` — la macchina a stati che decide
  quali step mostrare in base al modulo (`personal_training` vs `soccer_academy`, 3 step fissi
  per il secondo secondo CLAUDE.md) non è mai stata percorsa lezione per lezione.
- **L'altro modal complesso, `campionamento-modal/`.** `TestInput.jsx` e `RankPreview.jsx` — il
  form con cui un trainer registra un nuovo campionamento, che internamente usa proprio
  `calcPercentileEx` (Lezione 18) e `ageWarnings` per il banner ambra di età fuori fascia, ma la
  UI stessa non è stata analizzata.
- **L'export PDF via `window.print()`.**
  [`ClientReportPrint.jsx`](../../src/features/client/client-dashboard/ClientReportPrint.jsx) e
  [`GroupReportPrint.jsx`](../../src/features/trainer/groups-page/GroupReportPrint.jsx) — la
  tecnica "zero dipendenze, il browser genera il PDF nativamente" descritta in CLAUDE.md
  (CSS `@media print` iniettato in `document.head`) non è mai stata mostrata in dettaglio.
- **Il layer `firebase/services/` oltre a `clients.js`/`auth.js`.** La Lezione 12 (letture
  dirette) usa presumibilmente `clients.js` come esempio canonico (è quello citato nella mappa
  delle dipendenze dell'indice); restano da esplorare da soli
  [`calendar.js`](../../src/firebase/services/calendar.js),
  [`groups.js`](../../src/firebase/services/groups.js),
  [`badges.js`](../../src/firebase/services/badges.js),
  [`workoutPlans.js`](../../src/firebase/services/workoutPlans.js),
  [`groupNotes.js`](../../src/firebase/services/groupNotes.js),
  [`notifications.js`](../../src/firebase/services/notifications.js) — stesso pattern (`orgId`
  come primo argomento), applicazioni diverse.
- **Le altre Cloud Functions oltre agli esempi della Lezione 13.** `functions/src/callable/`
  contiene **32 file** (non 31 — numero corretto ago 2026 dopo un conteggio diretto: `src/usecases/`
  ne ha 31, uno in meno, ed è esattamente `recalcolaCampionamenti.js` a mancare da lì — vedi
  Lezione 13, § "l'eccezione alla regola delle 31").
  Creazione/eliminazione cliente, XP/campionamento e ora anche `recalcolaCampionamenti.js` (la sola
  callable senza un usecase dedicato, invocata da `AdminDashboard.jsx`) sono trattate in dettaglio
  nella Lezione 13. Restano da verificare da soli funzioni come `aggiornaGruppo.js`,
  `aggiungiRicorrenza.js`, `estendirRicorrenza.js`, `chiudiSessione.js`, `salvaBia.js` — non
  garantite come coperte, leggi la Lezione 13 e confrontala con l'elenco reale in
  [`functions/src/callable/`](../../functions/src/callable).
- **Il sistema di gamification "trofei" (badge).** `config/badges.config.js`, `hooks/useBadges.js`
  (con `checkAutoBadges` che gira ad ogni cambio dati cliente), il componente
  [`TrophiesSection.jsx`](../../src/features/client/client-dashboard/TrophiesSection.jsx) e
  [`BadgeMedal.jsx`](../../src/components/ui/BadgeMedal.jsx) — una feature "IMPLEMENTATA — lug
  2026" secondo CLAUDE.md, mai nominata in nessun titolo di lezione.
- **Il sistema Avatar.** `config/avatars.config.js` (catalogo avatar fissi per org),
  [`AvatarDisplay.jsx`](../../src/features/client/client-view/avatar/AvatarDisplay.jsx) e
  [`AvatarPicker.jsx`](../../src/features/client/client-view/avatar/AvatarPicker.jsx) — distinto
  dal "Sistema Avatar + Negozio" di roadmap futura in CLAUDE.md (quello è *non ancora
  implementato*; questo invece è codice reale e funzionante oggi).
- **`ThemeContext.jsx` e `config/themes.config.js` oltre a quanto accennato nel Modulo 0.** Il
  corso probabilmente tocca le CSS custom properties `--rx-*` nella Lezione 03 (styling), ma il
  sistema completo — 7 temi, `applyTheme()` che riscrive le CSS variable a runtime e inietta un
  `<style>` per il background, persistenza `localStorage['rankex-theme']`, `ThemePicker.jsx`,
  `ThemeDevPanel.jsx` (overlay solo dev, `Ctrl+Shift+T`) — è una feature a sé che meriterebbe una
  lezione propria e non l'ha avuta.
- **L'intera area calendario UI.** `useCalendar.js`/`useRecurrences.js` (probabilmente toccati
  nella Lezione 05 o 15 come esempio di effect/realtime), ma i componenti
  `trainer-calendar/WeekView.jsx`, `MonthView.jsx`, `DayView.jsx`, `SlotPopup.jsx`,
  `RecurrenceModal.jsx`, `AddSlotModal.jsx`, `CloseSessionModal.jsx` — la UI vera e propria del
  calendario, con le sue viste multiple e la sincronizzazione gruppo/ricorrenza/slot descritta in
  CLAUDE.md — non è stata percorsa componente per componente.
- **Il Groups Analytics Hub nel dettaglio UI.** `GroupLeaderboard.jsx`, `GroupChampions.jsx`,
  `GroupComparison.jsx` (radar SVG multi-overlay), `GroupNotes.jsx` — la logica di dominio
  sottostante (`groupAnalysis.test.js` in `__tests__/utils/`) potrebbe essere toccata nella
  Lezione 17, ma i componenti React che la consumano no.
- **L'area super_admin oltre alla Lezione 10.** `AdminDashboard.jsx`, `OrgDetailView.jsx` (barre
  progresso utilizzo piano), `CreateOrgForm.jsx` — menzionati solo di striscio nella mappa di
  routing per ruolo.
- **La feature Wearable residua.** `WearableSection.jsx` e `useWearable.js` (solo lato trainer,
  dopo la rimozione del lato client documentata in CLAUDE.md) — un caso interessante di "feature
  parzialmente disattivata mantenuta nel codice", mai discusso nel corso.

## Le aree più insidiose — dove concentrare gli sforzi

Il corso è stato generato tutto insieme, su tua richiesta esplicita — questo significa che **non
esiste uno storico reale di come hai risposto ai quiz**. Qualunque affermazione su "hai sbagliato
spesso la domanda X" sarebbe inventata, e non lo farò. Quello che posso fare, da chi ha appena
attraversato tutto il codice per scrivere queste lezioni, è dirti onestamente **quali concetti
sono strutturalmente i più densi di trabocchetti per chi arriva dal "vibe coding"** — cioè da chi
ha visto il codice funzionare, ma non necessariamente ha dovuto ragionare sul *perché* funziona
proprio così e non in un altro modo. Ti consiglio di rifare sul serio, da solo, senza guardare le
risposte, i quiz delle lezioni legate a questi concetti — è il primo vero esercizio di
autovalutazione di questo corso.

1. **Letture dirette vs scritture callable (Modulo 3, Lezioni 12-13).** È la distinzione
   architetturale più facile da "sapere a memoria" e più difficile da applicare istintivamente
   quando scrivi codice nuovo. Chi viene dal vibe coding tende, per riflesso, a scrivere
   `updateDoc` ovunque perché "funziona" — il progetto invece impone una regola precisa (scritture
   sensibili → Cloud Function, letture → dirette) che va capita nel *perché*, non solo osservata.
   Rifai il quiz della Lezione 13 e chiediti, per ogni domanda, "avrei saputo rispondere prima di
   aver letto il codice, o l'ho solo intuito ora?"

2. **La duplicazione voluta del calcolo XP tra client e Cloud Function (Lezione 14, optimistic
   UI).** È controintuitivo: perché scrivere la stessa logica (`calcSessionXP`,
   `buildXPUpdate`) due volte, una in `utils/gamification.js` (client) e una nel corrispondente
   file in `functions/src/shared/gamification.js` (server)? Chi non ha interiorizzato bene
   l'optimistic update tende a pensare "è ridondante, andrebbe unificato" — mentre è
   **esattamente il punto**: il client calcola per aggiornare la UI istantaneamente (UX), il
   server ricalcola per essere l'unica fonte di verità autorevole (sicurezza) — se i due
   calcoli divergessero, vincerebbe sempre il server. Rifai il quiz della Lezione 14.

3. **`useReducer` contro `useState` — quando la scelta è giustificata e quando è solo
   preferenza.** `TrainerContext` (Lezione 07) usa `useReducer` per il cliente selezionato;
   moltissimi altri hook nel progetto usano `useState` semplice anche per stati con più campi
   correlati. La domanda insidiosa non è "quale dei due è giusto", è "cosa rende *questo* caso
   specifico più adatto a un reducer" — tipicamente: transizioni di stato con più azioni distinte
   che modificano gli stessi dati in modi correlati, non un insieme di variabili indipendenti.

4. **La sintassi limitata delle Firestore Rules (Lezione 16).** Chi ha scritto JavaScript per
   anni si aspetta `if`/`return` dentro una funzione. Le regole Firestore non lo permettono — solo
   espressioni booleane. Questo produce codice che "sembra strano" a un occhio abituato a
   JavaScript normale (ternari annidati, `&&`/`||` incatenati) ma è l'unica forma valida. È un
   concetto piccolo ma che genera errori di sintassi frustranti la prima volta che si prova a
   modificare `firestore.rules` da soli — CLAUDE.md lo marca esplicitamente come file "da
   modificare con estrema cautela" per questo.

5. **I tre stati `undefined`/`null`/valore in `useAuth` (Lezione 09).** La differenza tra "non
   ho ancora controllato" (`undefined`, stato iniziale prima che Firebase Auth risponda), "ho
   controllato e non c'è nessuno loggato" (`null`), e "c'è un utente" (l'oggetto vero) è un
   pattern che chi viene dal vibe coding spesso collassa erroneamente in un semplice booleano
   `isLoggedIn` — perdendo la capacità di distinguere "sto ancora caricando, mostra uno
   spinner" da "ho finito di caricare e non c'è nessuno, mostra il login". Un bug classico
   generato da questa confusione: un redirect al login che scatta per una frazione di secondo
   anche per un utente che in realtà è loggato, semplicemente perché Firebase non ha ancora
   risposto.

## Piano di studio per l'autonomia

**Fase 1 — Rilettura guidata e ripetizione degli esercizi, senza aiuto.**
Rileggi le 23 lezioni nell'ordine dell'indice, ma questa volta chiudi il file *prima* di leggere
"Risposte e spiegazioni" e "Esercizi" — prova davvero a risolverli aprendo tu il codice sorgente,
cronometrandoti se ti aiuta a restare onesto. Obiettivo di questa fase: essere in grado di
spiegare a voce alta, senza guardare gli appunti, perché `orgId` è sempre il primo argomento
(Lezione 10) e perché la Cloud Function ricalcola l'XP invece di fidarsi del client (Lezione 14).
Se una spiegazione non ti viene naturale, è il segnale di dove tornare a leggere.

**Fase 2 — Modificare una feature esistente end-to-end, in autonomia.**
Scegli una modifica piccola ma che attraversi *tutti* gli strati dell'architettura: UI → hook →
usecase/service → Firestore rules. Esempio concreto: aggiungi un campo `note` opzionale al form
`CreateMemberForm.jsx` (Modulo "Membro del team" di CLAUDE.md) — dovrai toccare il componente
form, il service/usecase `createMemberUseCase.js`, eventualmente il documento `/users/{uid}` e
`organizations/{orgId}/members/{uid}`, e verificare che `firestore.rules` permetta comunque la
scrittura di quel nuovo campo per un `org_admin`. Il criterio di successo non è "compila", è "hai
saputo giustificare ogni file che hai toccato senza chiedere aiuto".

**Fase 3 — Aggiungere una feature nuova completa, seguendo le convenzioni del progetto.**
Scegli una voce reale dalla sezione "Roadmap futura" di CLAUDE.md (es. "Obiettivi trainer — coach
fissa target su test specifico per un cliente, sistema monitora e notifica al raggiungimento" —
la voce più piccola e autocontenuta della lista) e progettala rispettando i pattern che hai visto:
un nuovo campo nel modello dati cliente, un hook dedicato, un service o usecase coerente con il
resto (scrittura via Cloud Function se è un'operazione sensibile, come le altre), una nuova voce
in `notifications.js`/`useNotifications.js` per il "notifica al raggiungimento". Non serve
implementarla per intero al primo colpo — anche solo lo schema dati + la Cloud Function callable
+ un test unitario sulla logica di verifica soglia è un traguardo concreto della fase.

**Fase 4 — Cloud Functions e Security Rules con test automatici, prima in `rankex-dev`.**
Questa è la fase più delicata, e va affrontata per ultima apposta. Prendi confidenza con
`npm run test:rules` (Lezione 22) scrivendo un test nuovo per un invariante non ancora coperto in
`tests/rules/firestore.rules.test.js` (es. quello proposto nella Challenge della Lezione 22 —
isolamento tra client della stessa org). Solo dopo aver verificato in locale contro l'emulatore,
prova a modificare per davvero una Cloud Function esistente (es. aggiungere un campo di validazione
a `creaCliente.js`), deploya **solo** su `rankex-dev` (`npm run deploy:rules:dev`, mai
direttamente su `fitquest-60a09`) e verifica manualmente il comportamento in quell'ambiente prima
di anche solo considerare un merge verso `main`. Questa è l'unica fase in cui un errore può
davvero rompere qualcosa per utenti reali (se toccata in produzione) — il motivo per cui esiste
un intero progetto Firebase (`rankex-dev`) dedicato proprio a poter sbagliare in sicurezza prima
di quel passaggio.
