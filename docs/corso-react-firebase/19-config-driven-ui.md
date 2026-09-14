# Lezione 19 — Config-driven UI
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire come RankEX decide "quale componente mostrare" e "come si chiama questa cosa per
questo cliente" senza scrivere `if`/`switch` sparsi nei componenti — centralizzando le
decisioni in oggetti di configurazione dichiarativi. Al termine saprai leggere
`trainer.config.jsx`, `navItems.config.jsx` e `modules.config.js`, spiegare perché "aggiungere
una pagina trainer" richiede toccare solo 2 file, e discutere onestamente i limiti di questo
approccio quando la config cresce.

## Concetti teorici

**Config-driven UI** (anche detta *data as code* o *dichiarativo invece di imperativo*) è un
pattern in cui il comportamento di un'interfaccia — quale componente renderizzare, quale testo
mostrare, quale campo nascondere — non è scritto come una sequenza di controlli condizionali
dentro i componenti, ma **letto da una struttura dati** (un oggetto, un array, una mappa
`chiave → valore`) definita a parte. Il componente diventa "stupido": non decide, esegue.
Chi decide è la config.

Il caso limite più semplice del pattern è una mappa `id → componente`:

```js
// invece di questo (imperativo, if/else)
function renderPage(page) {
  if (page === 'clients') return <ClientsPage />
  if (page === 'groups')  return <GroupsPage />
  if (page === 'calendar') return <TrainerCalendar />
  // ... e così via, un ramo per ogni pagina
}

// ...si scrive questo (dichiarativo, lookup su oggetto)
const PAGES = { clients: ClientsPage, groups: GroupsPage, calendar: TrainerCalendar }
const CurrentPage = PAGES[page] ?? PAGES.clients
```

> ### 📎 Approfondimento: config-driven UI / data as code
> Pensa alla differenza tra **un elettricista che collega ogni interruttore con un cavo
> dedicato** e **un quadro elettrico con etichette**. Nel primo caso, per capire cosa fa
> l'interruttore 4 devi seguire fisicamente il cavo fino alla lampada. Nel secondo, leggi
> l'etichetta sul quadro: "Interruttore 4 → Lampada cucina". Se un domani sposti la lampada
> cucina su un altro interruttore, nel primo caso devi rifare il cablaggio; nel secondo,
> aggiorni un'etichetta. Config-driven UI è il quadro elettrico: la "mappatura" tra un
> identificatore (`'clients'`) e il suo comportamento reale (il componente `ClientsPage`) è
> dichiarata in un unico posto leggibile, non sparsa nell'implementazione. Il vantaggio non è
> solo estetico: **un nuovo collaboratore può capire "quali pagine esistono" leggendo un
> oggetto di 6 righe**, senza dover leggere il router o ogni singolo componente.

Il pattern si estende oltre le mappe `id → componente`: in RankEX lo troviamo anche per
"terminologia per modulo" (`TERMINOLOGIES`), "quali test sono fissi per una fascia d'età"
(`SOCCER_FIXED_TESTS`), "quali voci di navigazione mostrare" (`getNavItems`/`NAV_ITEMS`). In
tutti i casi lo schema è lo stesso: **una struttura dati dichiarativa, letta da codice generico
che non conosce i dettagli di dominio.**

## Dove compare nel progetto

- [`src/config/modules.config.js`](../../src/config/modules.config.js) — `MODULES`,
  `TERMINOLOGIES`, `PLAYER_ROLES`, `SOCCER_FIXED_TESTS`, `SOCCER_AGE_GROUPS`,
  `getCategoriaFromEta`, `getTerminology`, `getModule`.
- [`src/features/trainer/trainer.config.jsx`](../../src/features/trainer/trainer.config.jsx) —
  la mappa `PAGES` (id → componente) per l'area trainer.
- [`src/components/layout/trainer-shell/navItems.config.jsx`](../../src/components/layout/trainer-shell/navItems.config.jsx) —
  `getNavItems(terminology)`, `ORG_ADMIN_NAV_ITEMS`.
- [`src/features/trainer/TrainerView.jsx`](../../src/features/trainer/TrainerView.jsx) (riga
  44) e [`src/features/org/OrgAdminView.jsx`](../../src/features/org/OrgAdminView.jsx) (righe
  14-19, 49) — dove `PAGES`/`ORG_PAGES` vengono effettivamente consumate.
- [`src/components/layout/trainer-shell/AppNav.jsx`](../../src/components/layout/trainer-shell/AppNav.jsx) —
  consuma `getNavItems`/`ORG_ADMIN_NAV_ITEMS` per renderizzare la nav bar desktop/mobile.
- Consumo di `getModule(moduleType).isSoccer` in produzione (5 file reali, verificati via
  grep): `ClientsPage.jsx` (riga 35), `clients-page/ClientCard.jsx` (riga 12),
  `groups-page/GroupReportPrint.jsx` (riga 19), `NewClientView.jsx` (riga 19),
  `TestGuidePage.jsx` (riga 18).

## Analisi del codice

### `trainer.config.jsx` — la mappa `PAGES`

```js
// src/features/trainer/trainer.config.jsx — file completo, 21 righe
import { lazy }             from 'react'
import { ClientsPage }      from './ClientsPage'
import { TrainerCalendar }  from './TrainerCalendar'
import { ProfilePage }      from './ProfilePage'
import { GroupsPage }       from './GroupsPage'
import { RecurrencesPage }  from './RecurrencesPage'

// Aperta raramente rispetto alle altre pagine — lazy-load per non pesare
// sul bundle iniziale dell'area trainer.
const TestGuidePage = lazy(() =>
  import('./TestGuidePage').then(m => ({ default: m.TestGuidePage }))
)

export const PAGES = {
  clients:     ClientsPage,
  calendar:    TrainerCalendar,
  guide:       TestGuidePage,
  groups:      GroupsPage,
  recurrences: RecurrencesPage,
  profile:     ProfilePage,
}
```

L'intero file è la definizione di un solo oggetto: `PAGES`. Le chiavi (`clients`, `calendar`,
`guide`, `groups`, `recurrences`, `profile`) sono stringhe che corrispondono esattamente agli
`id` definiti in `navItems.config.jsx` (li vedi tra poco) — questa corrispondenza per
convenzione, non imposta dal type system (il progetto è JavaScript puro, non TypeScript), è
ciò che collega "quale voce di menu è attiva" a "quale componente va mostrato". Da notare che
`TestGuidePage` è avvolto in `lazy()` — un dettaglio di performance non legato al pattern
config-driven in sé, ma che il pattern rende semplice da applicare selettivamente: basta
cambiare *come* si ottiene il riferimento al componente (`lazy(() => import(...))` invece di
un import statico), la forma della mappa (`id → riferimento renderizzabile`) resta identica, e
il resto del codice che consuma `PAGES` non sa né gli importa che uno dei componenti sia
caricato in modo differito.

### Dove `PAGES` viene letta: `TrainerView.jsx`

```js
// src/features/trainer/TrainerView.jsx righe 37-44 (estratto)
function TrainerLayout({ user, orgId }) {
  const { page, navKey, navParams, selectedClient, navigateTo, deselectClient } = useTrainerNav()
  const {
    clients, isLoading, fetchError,
    fetchClients,
    handleAddClient, handleCampionamento, handleDeleteClient,
  } = useClients(orgId, user.uid)
  const CurrentPage = PAGES[page] ?? PAGES.clients
```

Questa singola riga, `const CurrentPage = PAGES[page] ?? PAGES.clients`, **sostituisce
interamente** quello che altrimenti sarebbe uno `switch` con 6 case (uno per ogni pagina) o
una catena di `if (page === 'clients') ... else if (page === 'groups') ...`. `page` è una
stringa di stato gestita da `useTrainerNav` (`useState('clients')`, secondo il file
`useTrainerNav.js`) — tipicamente cambiata cliccando una voce della nav bar. Il fallback
`?? PAGES.clients` è la difesa contro un valore di `page` che non corrisponde a nessuna chiave
nota (es. uno stato residuo, o — più realisticamente — un refactoring futuro che rinomina una
chiave di `PAGES` senza aggiornare tutti i luoghi che impostano `page`): invece di
renderizzare `undefined` (che React tratterebbe come "nessun componente", schermata bianca),
si torna sempre a una pagina di default sicura.

`CurrentPage` è poi usata come un componente React qualunque: `<CurrentPage orgId={orgId}
trainerId={user.uid} clients={clients} ... {...(navParams ?? {})} />` (righe 62-73). Ogni
pagina nella mappa riceve lo stesso set di prop "standard" più eventuali `navParams`
specifici — un altro beneficio della config-driven UI: **tutte le pagine condividono lo stesso
"contratto" di ingresso**, quindi aggiungerne una nuova non richiede logica di wiring
specifica, solo aggiungerla alla mappa.

### Estendere la mappa senza toccarla: `OrgAdminView.jsx`

```js
// src/features/org/OrgAdminView.jsx righe 8-19 (estratto)
import { PAGES }           from '../trainer/trainer.config'
import { OrgDashboard }    from './org-pages/OrgDashboard'
import { MembersPage }     from './org-pages/MembersPage'
import { OrgSettingsPage } from './org-pages/OrgSettingsPage'

// Pagine aggiuntive per org_admin
const ORG_PAGES = {
  ...PAGES,
  org_dashboard: OrgDashboard,
  members:       MembersPage,
  org_settings:  OrgSettingsPage,
}
```

Questo è, a mio avviso, l'esempio più istruttivo del pattern in tutto il progetto: `org_admin`
ha bisogno delle stesse pagine di un trainer normale **più** tre pagine esclusive
(dashboard org, team, impostazioni). Invece di duplicare l'intera mappa `PAGES` o di
introdurre logica condizionale dentro `trainer.config.jsx` ("se l'utente è org_admin, aggiungi
anche..."), `OrgAdminView.jsx` **compone** una nuova mappa con lo spread operator:
`{ ...PAGES, org_dashboard: OrgDashboard, ... }`. `trainer.config.jsx` non sa nulla
dell'esistenza di `ORG_PAGES` — è un file completamente indipendente da quale ruolo lo
consuma. Poi, simmetricamente a `TrainerView.jsx`:

```js
// src/features/org/OrgAdminView.jsx riga 49
const CurrentPage = ORG_PAGES[page] ?? ORG_PAGES.clients
```

Stessa identica riga, mappa diversa. È la dimostrazione concreta di cosa intende `CLAUDE.md`
quando, nella checklist "Nuova pagina org_admin (solo)", dice di modificare *solo*
`features/org/OrgAdminView.jsx` (la mappa `PAGES` map) e la sidebar — mai
`trainer.config.jsx`, che resta la fonte di verità delle pagine condivise.

### `navItems.config.jsx` — perché è una funzione, non un oggetto statico

```js
// src/components/layout/trainer-shell/navItems.config.jsx righe 1-17 (estratto)
export function getNavItems(terminology = {}) {
  return [
  {
    id:    'clients',
    label: terminology.clients ?? 'Clienti',
    icon: ( <svg ...>...</svg> ),
  },
  {
    id:    'groups',
    label: terminology.groups ?? 'Gruppi',
    icon: ( <svg ...>...</svg> ),
  },
  // 'calendar', 'recurrences', 'guide', 'profile' — label fisse, non da terminology
  ]
}
```

A differenza di `PAGES` (un oggetto statico, valutato una sola volta all'import), le voci di
navigazione sono generate da una **funzione**, `getNavItems(terminology)`. Il motivo è nel
commento in cima al file reale: "le label Clienti/Gruppi variano per modulo/variante
terminologica (PT/GYM/Soccer)". Un oggetto statico non potrebbe "sapere" se mostrare
"Clienti" (personal_training), "Membri" (gym) o "Allievi" (soccer_academy) — quell'informazione
arriva solo a runtime, quando si conosce l'organizzazione dell'utente loggato. Notare che solo
`clients` e `groups` (righe 8, 20) leggono da `terminology`; le altre quattro voci
(`calendar`, `recurrences`, `guide`, `profile`) hanno label fisse in italiano — un dettaglio
che rivela come la terminologia di dominio (Cliente/Trainer/Gruppo/Sessione, secondo
`TERMINOLOGIES` in `modules.config.js`) copra solo un sottoinsieme dei concetti dell'app, non
ogni stringa visibile.

`ORG_ADMIN_NAV_ITEMS` (righe 76-89), invece, è di nuovo un array statico — una sola voce
(`Team`) sempre uguale, senza bisogno di terminologia dinamica. Il consumo in `AppNav.jsx`
mostra lo stesso pattern di composizione visto per `ORG_PAGES`:

```js
// src/components/layout/trainer-shell/AppNav.jsx righe 6-10
const { userRole, terminology } = useTrainerState()
const navItems     = getNavItems(terminology)
const allNavItems  = userRole === 'org_admin'
  ? [...navItems, ...ORG_ADMIN_NAV_ITEMS]
  : navItems
```

Ancora uno spread (`[...navItems, ...ORG_ADMIN_NAV_ITEMS]`), stessa logica di
"pagine base + pagine extra per un ruolo specifico" già vista per `ORG_PAGES` — la
composizione avviene su due strutture parallele e indipendenti (una mappa `id → componente`
in `trainer.config.jsx`/`OrgAdminView.jsx`, un array `{id, label, icon}` in
`navItems.config.jsx`/`AppNav.jsx`) che devono restare sincronizzate manualmente per `id` —
un accoppiamento implicito su cui torniamo nella sezione "Errori comuni".

### `modules.config.js` — centralizzare le differenze di dominio

```js
// src/config/modules.config.js righe 59-74
export const SOCCER_FIXED_TESTS = {
  soccer_youth:  ['single_leg_stance', 'sprint_10m', 'shuttle_run_30m', 'standing_long_jump', 't_test_mini'],
  soccer_junior: ['y_balance_anterior', 'sprint_20m', 't_test_soccer_junior', 'standing_long_jump', 'six_minute_run'],
  soccer:        ['y_balance', 'standing_long_jump', '505_cod_agility', 'sprint_20m', 'beep_test'],
}

export const SOCCER_AGE_GROUPS = [
  { value: 'soccer_youth',  label: 'Pulcini',    desc: 'Atleti 7-9 anni' },
  { value: 'soccer_junior', label: 'Esordienti', desc: 'Atleti 10-13 anni' },
  { value: 'soccer',        label: 'Senior',     desc: 'Atleti 14+ anni' },
]
```

`SOCCER_FIXED_TESTS` è il tipo di dato che, senza config-driven UI, tenterebbe di infilarsi
come logica condizionale dentro ogni componente che ha bisogno di sapere "quali test mostrare
per questo atleta soccer" — `TestGuidePage`, il wizard di creazione cliente, il modale di
campionamento. Centralizzandolo in un'unica mappa `fascia → array di test.key`, ogni
consumatore fa solo un lookup (`SOCCER_FIXED_TESTS[categoria]`, o indirettamente tramite
`ALL_TESTS.filter(t => t.categories.includes(categoria))`, come visto nella Lezione 18 a
proposito di `constants/tests.js`) invece di reimplementare la logica di quali test
appartengono a quale fascia.

```js
// src/config/modules.config.js righe 106-114
export function getModule(moduleType) {
  return {
    moduleType,
    isSoccer:    moduleType === MODULES.SOCCER_ACADEMY,
    fixedTests:  moduleType === MODULES.SOCCER_ACADEMY ? SOCCER_FIXED_TESTS : null,
    hasCategories: moduleType !== MODULES.SOCCER_ACADEMY,
    hasBia:      moduleType !== MODULES.SOCCER_ACADEMY,
  }
}
```

`getModule` è il punto di accesso unico per qualunque componente debba ramificare il proprio
comportamento in base al modulo. Non restituisce solo un booleano `isSoccer`: restituisce un
piccolo oggetto di "capacità" (`hasCategories`, `hasBia`, `fixedTests`) — un pattern detto a
volte *feature flags per dominio*: invece di sparpagliare `moduleType === 'soccer_academy'` in
punti diversi del codice (fragile: basta un refactoring del nome della stringa e tutto si
rompe silenziosamente), si passa dal significato di business (`isSoccer`, `hasBia`) invece
che dal valore grezzo. `isSoccer` è il campo di gran lunga più usato: lo trovi identico,
parola per parola, in cinque componenti reali e non collegati tra loro nell'albero JSX —
`ClientsPage.jsx:35`, `clients-page/ClientCard.jsx:12`, `groups-page/GroupReportPrint.jsx:19`,
`NewClientView.jsx:19`, `TestGuidePage.jsx:18` — sempre nella stessa forma:

```js
const isSoccer = getModule(moduleType).isSoccer
```

Il vero comportamento condizionale poi ovviamente resta nel componente (`if (isSoccer) return
<VistaCalcio /> ...`) — `getModule` non elimina la ramificazione, la rende però basata su un
significato di dominio esplicito invece che su un confronto di stringa ripetuto e soggetto a
errori di battitura in ogni punto in cui servirebbe.

Un esempio concreto di uso reale, leggermente più ricco della "logica corretta" semplificata
che `CLAUDE.md` mostra come pseudocodice illustrativo:

```js
// src/features/trainer/TestGuidePage.jsx righe 16-26 (estratto)
export function TestGuidePage() {
  const { moduleType } = useTrainerState()
  const isSoccer       = getModule(moduleType).isSoccer

  // ...
  const [soccerFascia, setSoccerFascia] = useState('soccer')
  const soccerTests = isSoccer ? ALL_TESTS.filter(t => t.categories.includes(soccerFascia)) : null
```

Nel codice reale il filtro non è "tutti i test con categoria `'soccer'`" (come nello
pseudocodice semplificato in `CLAUDE.md`), ma è parametrizzato sulla fascia selezionata
dall'utente (`soccerFascia`, che può essere `'soccer_youth'`, `'soccer_junior'` o `'soccer'`)
— coerente col fatto che il modulo soccer ha *tre* fasce con test diversi, non un blocco
unico. È un buon promemoria che gli esempi semplificati nella documentazione tecnica servono a
comunicare l'idea, non a essere copiati parola per parola: il codice reale è quasi sempre un
po' più articolato.

## Diagramma mentale

```
                     ┌──────────────────────────────┐
                     │  modules.config.js             │
                     │  MODULES, TERMINOLOGIES,       │
                     │  SOCCER_FIXED_TESTS, getModule │
                     └───────────────┬────────────────┘
                                     │ letto da
              ┌──────────────────────┼──────────────────────┐
              ▼                                              ▼
┌──────────────────────────┐                  ┌──────────────────────────┐
│  trainer.config.jsx        │                  │  navItems.config.jsx       │
│  PAGES = { id → Componente }│                  │  getNavItems(terminology)  │
└───────────┬────────────────┘                  └───────────┬────────────────┘
            │ esteso via spread                              │ esteso via spread
            ▼                                                ▼
┌──────────────────────────┐                  ┌──────────────────────────┐
│  OrgAdminView.jsx           │                  │  AppNav.jsx                 │
│  ORG_PAGES = {...PAGES,     │                  │  allNavItems = [...nav,     │
│    org_dashboard, members}  │                  │    ...ORG_ADMIN_NAV_ITEMS]  │
└───────────┬────────────────┘                  └───────────┬────────────────┘
            │                                                │
            ▼                                                ▼
   CurrentPage = PAGES[page]                    <button onClick={() => onNavigate(item.id)}>
   ?? PAGES.clients                                   {item.label}
   (lookup, zero if/switch)                     (id qui deve combaciare con
                                                  una chiave di PAGES/ORG_PAGES)
```

## Errori comuni

1. **Disallineare `id` tra `navItems.config.jsx` e `PAGES`.** I due file non sono legati da
   nessun controllo automatico (JavaScript puro, non TypeScript con union type condiviso): se
   aggiungi una voce di nav con `id: 'reports'` ma dimentichi di aggiungere `reports:
   ReportsPage` a `PAGES`, cliccare quella voce imposta `page = 'reports'`, e
   `PAGES[page] ?? PAGES.clients` silenziosamente ricade su `ClientsPage` — nessun errore a
   console, solo un comportamento sbagliato scoperto manualmente cliccando.

2. **Aggiungere logica condizionale dentro `trainer.config.jsx` invece di usare la
   composizione.** Se in futuro qualcuno, per aggiungere una pagina solo super_admin,
   scrivesse `clients: userRole === 'super_admin' ? SuperClientsPage : ClientsPage` dentro
   `PAGES`, romperebbe l'assunzione che `trainer.config.jsx` sia una mappa statica e
   indipendente dal ruolo — il pattern corretto, dimostrato da `OrgAdminView.jsx`, è comporre
   una mappa derivata altrove (`{ ...PAGES, ... }`), non far penetrare la logica di ruolo nella
   config di base.

3. **Confrontare `moduleType` con stringhe letterali invece di usare `getModule(...)`.**
   Scrivere `if (moduleType === 'soccer_academy')` funziona, ma se il valore della costante
   `MODULES.SOCCER_ACADEMY` cambiasse (improbabile ma possibile in un refactoring), ogni
   occorrenza letterale andrebbe aggiornata a mano; `getModule(moduleType).isSoccer` invece
   dipende da un solo punto (righe 106-114 di `modules.config.js`).

4. **Dimenticare che `TERMINOLOGIES` ha tre chiavi, non due.** `MODULES` definisce solo due
   `moduleType` (`personal_training`, `soccer_academy`), ma `TERMINOLOGIES` ne ha tre
   (`personal_training`, `gym`, `soccer_academy`) — `gym` non è un `moduleType` a sé, è una
   *variante terminologica* di `personal_training` selezionata tramite
   `org.terminologyVariant` (vedi il modello dati in `CLAUDE.md`) e risolta da
   `getTerminology(moduleType, variant)` (righe 97-100): se `variant` esiste in
   `TERMINOLOGIES`, vince quello, indipendentemente dal `moduleType` di base. Confondere
   "modulo" e "variante terminologica" porta a bug del tipo "perché questa org GYM ha
   `moduleType: 'personal_training'` invece di un fantomatico `'gym'`?"

## Best Practice

**Perché questo pattern rende vera l'affermazione "aggiungere una pagina trainer richiede
toccare solo 2 file"** (`CLAUDE.md`, sezione "Checklist: Nuova pagina trainer"): il componente
che consuma la config (`TrainerLayout` in `TrainerView.jsx`) non deve mai cambiare quando
cambia *l'insieme* delle pagine disponibili — cambia solo quando cambia *come* le pagine
vengono renderizzate (es. un nuovo layout condiviso). Aggiungere una pagina è quindi
un'operazione puramente additiva su due file dichiarativi (`trainer.config.jsx` per il
componente, `navItems.config.jsx` per la voce di menu), mai una modifica di logica esistente —
il rischio di rompere una pagina già funzionante toccandone un'altra si riduce
strutturalmente, perché non c'è un `if`/`switch` centrale che cresce e si complica a ogni
aggiunta.

**Il trade-off onesto, guardando le dimensioni reali dei file.** `modules.config.js` è oggi
115 righe, `trainer.config.jsx` 21 righe, `navItems.config.jsx` 97 righe (in gran parte SVG
inline delle icone, non logica) — tutti file piccoli, leggibili per intero in pochi minuti.
Questo è precisamente il punto di forza attuale del pattern nel progetto: la config è ancora
"a colpo d'occhio". Ma il pattern non è gratuito nel lungo periodo: **una config-driven UI
scala bene in ampiezza (più chiavi nella stessa mappa) ma può diventare essa stessa difficile
da leggere se la logica dentro ogni voce cresce in profondità** — `getModule`, per esempio, è
già passato da un semplice booleano a un piccolo oggetto di 4 capacità (`isSoccer`,
`fixedTests`, `hasCategories`, `hasBia`); se in futuro RankEX aggiungesse un terzo modulo di
dominio (oltre a `personal_training`/`soccer_academy`) con esigenze diverse dalle prime due,
`getModule` rischierebbe di riempirsi di condizioni annidate specifiche per ogni modulo,
finendo per spostare la complessità dai componenti (dove almeno sarebbe visibile nel contesto
d'uso) dentro un unico file che deve conoscere le regole di *tutti* i moduli
contemporaneamente. La regola pratica, non scritta esplicitamente nel codice ma osservabile
dalla sua forma attuale, sembra essere: la config resta un oggetto/funzione **dichiarativa e
senza side effect** (nessuna chiamata Firestore, nessun hook), il comportamento vero resta nei
componenti che la leggono — è il momento in cui una "config" comincia a contenere `if`
annidati specifici per ogni caso che segnala che sta silenziosamente diventando essa stessa
logica di business travestita da dati.

## Quiz

1. Cosa restituisce `PAGES['pagina_inesistente']` in `trainer.config.jsx`?
   - A) Lancia un errore a compile-time
   - B) `undefined` — gestito poi dal fallback `?? PAGES.clients` nel chiamante
   - C) Restituisce automaticamente `ClientsPage`
   - D) React genera un warning ma renderizza comunque una pagina vuota

2. Perché `getNavItems` è una funzione e non un array statico esportato direttamente?
   - A) Per motivi di performance — le funzioni sono più veloci degli array
   - B) Perché le label di alcune voci (Clienti/Gruppi) dipendono dalla terminologia dell'organizzazione, nota solo a runtime
   - C) Perché React richiede che le liste di navigazione siano sempre funzioni
   - D) È un errore di design, dovrebbe essere un oggetto statico

3. Come fa `OrgAdminView.jsx` a ottenere le pagine extra per org_admin senza modificare
   `trainer.config.jsx`?
   - A) Importa `trainer.config.jsx` e lo modifica dinamicamente a runtime
   - B) Duplica manualmente tutte le voci di `PAGES` in un nuovo file
   - C) Compone una nuova mappa `ORG_PAGES` con lo spread operator: `{ ...PAGES, org_dashboard: ..., members: ... }`
   - D) Usa un `if (userRole === 'org_admin')` dentro ogni singolo componente pagina

4. `MODULES` in `modules.config.js` definisce quanti valori di `moduleType`?
   - A) 3 — personal_training, gym, soccer_academy
   - B) 2 — personal_training, soccer_academy (gym è una variante terminologica, non un moduleType)
   - C) 1 — solo soccer_academy è realmente implementato
   - D) Un numero variabile, definito a runtime da ogni organizzazione

5. Cosa restituisce `getModule('soccer_academy').fixedTests`?
   - A) `null`
   - B) L'oggetto `SOCCER_FIXED_TESTS` con le tre fasce (`soccer_youth`, `soccer_junior`, `soccer`)
   - C) Un array piatto di tutti i test soccer senza distinzione di fascia
   - D) Il valore di `PLAYER_ROLES`

6. Se dimentichi di aggiungere `reports: ReportsPage` a `PAGES` dopo aver aggiunto una voce
   di navigazione con `id: 'reports'`, cosa succede cliccando quella voce?
   - A) L'app crasha con un errore React
   - B) Viene mostrato un messaggio "pagina non trovata"
   - C) `PAGES['reports']` è `undefined`, il fallback `?? PAGES.clients` mostra silenziosamente ClientsPage
   - D) TypeScript blocca la build prima ancora di arrivare a runtime

7. Perché `isSoccer = getModule(moduleType).isSoccer` è preferibile a
   `moduleType === 'soccer_academy'` ripetuto in ogni componente?
   - A) Non c'è alcuna differenza pratica tra i due approcci
   - B) `getModule` è più veloce da eseguire a runtime
   - C) Centralizza il confronto in un solo punto (`modules.config.js`), riducendo il rischio che un refactoring del valore della costante rompa silenziosamente confronti sparsi in più file
   - D) `===` non funziona correttamente con le stringhe in JavaScript

8. Che relazione c'è tra `terminologyVariant: 'gym'` e `moduleType`?
   - A) `gym` è un terzo `moduleType` indipendente da `personal_training`
   - B) `gym` è una variante terminologica applicata sopra `moduleType: 'personal_training'`, letta da `getTerminology(moduleType, variant)`
   - C) `gym` sostituisce completamente `soccer_academy`
   - D) Non esiste alcuna variante `gym` nel codice

9. Nell'array restituito da `getNavItems(terminology)`, quali voci NON leggono da
   `terminology`?
   - A) Nessuna, tutte le sei voci sono dinamiche
   - B) Solo `clients`
   - C) `calendar`, `recurrences`, `guide`, `profile` — hanno label fisse in italiano
   - D) Solo `groups`

10. Qual è il rischio esplicitamente discusso in "Best Practice" se un ipotetico terzo modulo
    di dominio venisse aggiunto a RankEX?
    - A) Nessun rischio, il pattern scala all'infinito senza problemi
    - B) `getModule` potrebbe riempirsi di condizioni specifiche per ogni modulo, spostando complessità di business dentro un file che dovrebbe restare puramente dichiarativo
    - C) Bisognerebbe riscrivere `trainer.config.jsx` da zero
    - D) React non supporta più di due moduli contemporaneamente

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** JavaScript non lancia errori per l'accesso a una chiave inesistente di un oggetto
   plain — restituisce `undefined`. È esattamente il caso che il fallback `??` in
   `TrainerView.jsx` (riga 44) gestisce.

2. **B.** Il commento in cima al file reale lo dice esplicitamente: le label di
   `clients`/`groups` variano per modulo/variante terminologica, un'informazione nota solo a
   runtime (dipende dall'org dell'utente loggato), quindi non può essere un valore statico
   fissato all'import del modulo.

3. **C.** Righe 14-19 di `OrgAdminView.jsx`: `const ORG_PAGES = { ...PAGES, org_dashboard:
   OrgDashboard, members: MembersPage, org_settings: OrgSettingsPage }`. Nessuna modifica a
   `trainer.config.jsx`.

4. **B.** `MODULES = { PERSONAL_TRAINING: 'personal_training', SOCCER_ACADEMY:
   'soccer_academy' }` (righe 8-11) — solo due valori. `gym` esiste solo in `TERMINOLOGIES`
   come variante, discusso al punto 4 di "Errori comuni".

5. **B.** Riga 110 di `modules.config.js`: `fixedTests: moduleType === MODULES.SOCCER_ACADEMY
   ? SOCCER_FIXED_TESTS : null` — per `soccer_academy` restituisce l'intero oggetto con le tre
   fasce, non un array piatto (C) né `null` (A, che sarebbe corretto solo per
   `personal_training`).

6. **C.** Nessun crash, nessun messaggio esplicito: `PAGES['reports']` è semplicemente
   `undefined`, e `PAGES[page] ?? PAGES.clients` (riga 44 di `TrainerView.jsx`) ricade
   silenziosamente sulla pagina clienti — un comportamento "sbagliato in silenzio", non un
   errore rumoroso. Il progetto è JavaScript puro, quindi D è falsa: non c'è alcun controllo
   a compile-time su questo disallineamento.

7. **C.** È la spiegazione data in "Errori comuni" punto 3 e "Analisi del codice": centralizza
   il confronto, riduce il rischio di refactoring incompleti. B è inventata (non c'è
   differenza di performance misurabile per un confronto così semplice).

8. **B.** `getTerminology(moduleType, variant)` (righe 97-100 di `modules.config.js`): se
   `variant` è fornito ed esiste in `TERMINOLOGIES`, ha priorità sul `moduleType` di base.
   `gym` non è un valore mai assegnato a `moduleType` nel codice — è un valore di
   `terminologyVariant`.

9. **C.** Verificato leggendo l'intero file `navItems.config.jsx`: solo le voci `clients`
   (riga 8: `terminology.clients ?? 'Clienti'`) e `groups` (riga 20: `terminology.groups ??
   'Gruppi'`) leggono da `terminology`; le altre quattro hanno stringhe fisse.

10. **B.** Discusso esplicitamente nella sezione "Best Practice": il rischio non è che il
    pattern smetta di funzionare, ma che `getModule` (o config analoghe) accumulino
    condizioni specifiche per ogni nuovo modulo, diventando esse stesse logica di business
    complessa nascosta dietro un'apparenza di "semplice dato".

## Esercizi

1. **Livello base.** Apri `trainer.config.jsx` e `navItems.config.jsx` fianco a fianco. Elenca
   tutte le chiavi/id presenti in entrambi i file e verifica manualmente che combacino
   esattamente (suggerimento: dovrebbero essere 6 in ciascuno). È il controllo che, come
   discusso in "Errori comuni", nessun tool automatico fa per te in questo progetto.

2. **Livello base.** Leggi `getModule` (righe 106-114 di `modules.config.js`) e scrivi a mano,
   senza eseguire codice, cosa restituirebbe `getModule('personal_training')` per ciascuno
   dei quattro campi (`isSoccer`, `fixedTests`, `hasCategories`, `hasBia`).

3. **Livello intermedio.** `ORG_PAGES` in `OrgAdminView.jsx` aggiunge tre pagine
   (`org_dashboard`, `members`, `org_settings`) a `PAGES`. Cerca nel resto del progetto (con
   grep o lettura mirata) dove viene impostato `page = 'members'` — probabilmente in una voce
   di navigazione che *non* è in `navItems.config.jsx` (dato che `getNavItems` non include
   `members` tra le sue sei voci base). Da dove arriva quella navigazione, se non da
   `AppNav.jsx`? (Indizio: `CLAUDE.md` descrive `ORG_ADMIN_NAV_ITEMS` come voce "Team"
   aggiuntiva — verifica dove viene effettivamente composta con le voci base.)

4. **Livello intermedio.** Immagina (solo sulla carta, senza modificare il codice) di dover
   aggiungere una settima pagina trainer, "Obiettivi" (`id: 'goals'`), visibile a tutti i
   ruoli trainer/org_admin/staff_readonly. Elenca esattamente le righe che aggiungeresti nei
   due file (`trainer.config.jsx`, `navItems.config.jsx`) seguendo lo stile esistente,
   incluso l'oggetto SVG dell'icona (puoi riusare una delle icone esistenti come placeholder).

5. **Livello avanzato.** Confronta `getModule(moduleType).isSoccer` (usato in 5 file diversi,
   verificato via grep) con un ipotetico `moduleType === 'soccer_academy'` ripetuto
   letteralmente negli stessi 5 punti. Scrivi, in poche righe, uno scenario concreto di
   refactoring futuro (es. rinominare `'soccer_academy'` in `'football_academy'`) e traccia
   quanti file dovrebbero cambiare in ciascuno dei due approcci — usa `grep -rn
   "soccer_academy"` sul progetto reale per contare le occorrenze letterali della stringa
   oggi presenti, come controprova empirica.

## Challenge

`TestGuidePage.jsx` (riga 18) è uno dei cinque punti che leggono `getModule(moduleType)`, ma
guardando il resto del file (righe 24-34, già viste nell'Analisi del codice) noterai che usa
solo il campo `isSoccer` — non `fixedTests`, pur avendo `modules.config.js` esposto proprio
quel campo per questo genere di caso d'uso (l'oggetto `SOCCER_FIXED_TESTS` completo).

**Modifica reale da fare nel tuo ambiente locale (non è nella lista "File da NON modificare"
di `CLAUDE.md`, ma è comunque un componente reale — testa sempre con `npm run dev` dopo):**

1. In `TestGuidePage.jsx`, individua la riga `const soccerTests = isSoccer ?
   ALL_TESTS.filter(t => t.categories.includes(soccerFascia)) : null`.
2. Riscrivila per usare `getModule(moduleType).fixedTests` invece di filtrare `ALL_TESTS` per
   `categories` — dovrai leggere l'array di `key` da `fixedTests[soccerFascia]` e poi mappare
   ogni `key` al test completo cercandolo in `ALL_TESTS` (es. con `.find(t => t.key === k)`).
3. Verifica in `npm run dev` che il comportamento visivo di `TestGuidePage` per un'org
   `soccer_academy` resti identico a prima (stessi 5 test per fascia, stesso ordine).
4. Rifletti per iscritto: la versione con `fixedTests` è più esplicita (l'elenco dei test è
   dichiarato una volta in `SOCCER_FIXED_TESTS`, non ricostruito filtrando) o più fragile
   (dipende dall'ordine delle chiavi in `SOCCER_FIXED_TESTS` invece che da un filtro robusto
   su `categories`)? Non c'è una risposta "giusta" univoca — è un trade-off reale tra due
   modi validi di leggere la stessa config, ed è esattamente il tipo di scelta che un
   maintainer di questo file si troverebbe davanti in una PR reale.
