# FitQuest — Contesto Progetto

## Stack
- React 18 + Vite
- Firebase (Auth + Firestore)
- Tailwind CSS v4
- React Router v6

## Struttura cartelle
```
src/
├── app/                    — App.jsx, router.jsx, routes.config.js
├── components/
│   ├── common/             — ConfirmDialog, Pagination, ProtectedRoute, LoadingScreen
│   ├── layout/             — TrainerShell + trainer-shell/
│   ├── modals/             — new-client-wizard/, campionamento-modal/
│   └── ui/                 — index.jsx, XPBar, Pentagon, RankRing
├── constants/              — index.js, tests.js, formulas.js
├── context/                — TrainerContext.jsx (solo selectedClient)
├── features/
│   ├── auth/               — LoginPage, useLoginForm, components/
│   ├── calendar/           — useCalendar.js, calendarGroupUtils.js
│   ├── client/             — ClientView, ClientDashboard, CampionamentoView
│   │   └── client-view/    — ClientShell, ClientDashboardPage, ClientProfilePage
│   │   └── client-dashboard/ — DashboardHeader, DeleteDialog, ClientSessionsSummary
│   ├── notification/       — NotificationsPanel
│   └── trainer/            — TrainerView, ClientsPage, GroupsPage, TrainerCalendar
│       ├── clients-page/   — ClientCard, FiltersSidebar, MobileControls
│       ├── groups-page/    — GroupCard, GroupDetailView, GroupsSidebar
│       └── trainer-calendar/ — WeekView, MonthView, DayView, CalendarHeader,
│                               EventBlock, SlotPopup, CloseSessionModal,
│                               AddSlotModal, RecurrenceModal
├── firebase/
│   ├── config.js
│   └── services/           — auth, calendar, clients, db, groups, notifications, users
├── hooks/                  — useClients, useGroups, useClientRank, useNotifications,
│                             usePagination, useAsync
└── utils/                  — gamification.js, percentile.js, tables.js
```

## Principi architetturali

### Separation of concerns
- **Hook** — logica, stato, fetch Firestore
- **Componenti** — render, composizione UI
- **Services** — I/O Firebase, nessuna logica
- **Utils** — funzioni pure, nessun side effect
- **Config files** — dati statici, nessuna logica

### Data-driven UI
Strutture dati che guidano il render invece di condizionali hardcoded:
- `constants/tests.js` — tutti i test con `categories[]`, `direction`, `ageGroup`, `guide`
- `constants/index.js` — `CATEGORIE`, `RANKS`, `NEW_CLIENT_DEFAULTS`
- `trainer.config.js` — `PAGES` map (id → componente)
- `routes.config.js` — `PROTECTED_ROUTES`, `ROLE_REDIRECT`
- `trainer-shell/constants.jsx` — `NAV_ITEMS`
- `client-view/client.config.jsx` — `NAV_ITEMS` cliente

### Ottimistic updates
Pattern uniforme in tutti gli hook con mutation:
```js
const snapshot = state
setState(optimisticValue)        // 1. aggiorna UI subito
try {
  await firestoreCall()          // 2. chiama Firestore
} catch {
  setState(snapshot)             // 3. rollback se errore
}
```

### Single source of truth
- `constants/tests.js` — direzione test, fasce età, guide, configurazione
- `utils/gamification.js` — `calcSessionConfig`, `buildXPUpdate`, `buildCampionamentoUpdate`
- `utils/tables.js` — solo dati grezzi percentili, nessuna logica

## Modelli dati Firestore

### Cliente (`clients/{id}`)
```js
{
  name, eta, sesso, peso, altezza,
  trainerId, email, clientAuthUid,
  categoria,           // 'health' | 'active' | 'athlete'
  level, xp, xpNext,
  rank, rankColor, media,
  stats: {},           // { stat_key: percentile 0-100 }
  campionamenti: [],   // [{ date, stats, tests, media }]
  log: [],             // [{ date, action, xp }]
  sessionsPerWeek,
}
```

### Slot (`slots/{id}`)
```js
{
  trainerId, date, startTime, endTime,
  clientIds: [],
  groupIds: [],
  status: 'planned' | 'completed' | 'skipped',
  attendees: [],       // clientIds presenti — ricevono XP
  absentees: [],       // clientIds assenti — nessun XP
  recurrenceId: null,
  createdAt,
}
```
⚠️ `completedClientIds` NON esiste più — usa `attendees`.

### Gruppo (`groups/{id}`)
```js
{ name, trainerId, clientIds: [] }
```

### Notifica (`notifications/{id}`)
```js
{ clientId, message, date, type, read, readAt, createdAt }
```

### Profilo utente (`users/{uid}`)
```js
{ role: 'trainer' | 'client', clientId, trainerId, mustChangePassword }
```

## Categorie test

Tre categorie con 5 test ciascuna:
- `health` — sit_and_reach, flamingo_test, ymca_step_test, dinamometro_hand_grip, sit_to_stand
- `active` — y_balance, dinamometro_hand_grip, ymca_step_test, standing_long_jump, sprint_10m
- `athlete` — drop_jump_rsi, t_test_agility, yo_yo_ir1, sprint_20m, cmj

`dinamometro_hand_grip` e `ymca_step_test` sono condivisi tra `health` e `active`
— per questo ogni test ha `categories: []` invece di `category: string`.

## Gamification
```js
MONTHLY_XP_TARGET   = 500
BONUS_XP_FULL_MONTH = 200
WEEKS_PER_MONTH     = 4.33
XP_PER_LEVEL_MULTIPLIER = 1.3
XP_PER_CAMPIONAMENTO    = 50
```

`calcSessionConfig(sessionsPerWeek)` → `{ monthlySessions, xpPerSession }`

## Pattern navigazione trainer
```
TrainerContext    — solo selectedClient (stato UI)
useTrainerNav    — page + selectedClient + navigateTo/selectClient/deselectClient
TrainerView      — TrainerProvider > TrainerLayout
TrainerLayout    — PAGES[page] ?? PAGES.clients, selectedClient → ClientDashboard
```

Cambiare pagina azzera automaticamente `selectedClient`.

## Pattern viste inline

Invece dei modal per operazioni complesse, si usano view inline:
```
ClientsPage      — view: 'list' | 'new'     → NewClientView
ClientDashboard  — view: 'dashboard' | 'campionamento' → CampionamentoView
GroupsPage       — view: 'list' | 'detail'  → GroupDetailView
```

## Calendario

Vista default: **settimana**.
Viste disponibili: mese | settimana | giorno.

`useCalendar` gestisce:
- Fetch slot per range date corrente
- `handleAddSlot` — merge se stesso orario
- `handleAddRecurrence` — genera slot da ricorrenza
- `handleCloseSlot(slotId, attendeeIds, clientsData)` — chiude sessione + XP
- `handleSkipSlot` — segna come saltata
- `handleDeleteSlot` — elimina

Quando un cliente viene aggiunto/rimosso da un gruppo →
`calendarGroupUtils.js` aggiorna automaticamente gli slot futuri.

## Convenzioni codice

### Naming
- Hook: `useNomeHook`
- Componenti: `NomeComponente`
- Services: funzioni esportate singole (`getClients`, `addClient`)
- Config: `NOME_COSTANTE` per costanti, `nomeConfig.js` per file

### Import
- Importa sempre dal modulo diretto, non dal barrel quando possibile
- `calcSessionConfig` → da `utils/gamification`
- `calcMonthlyCompletion` → da `features/calendar/useCalendar`
- `applyFormula` → da `constants/formulas`

### Stile
- Tailwind per layout e tipografia
- `style={{}}` inline solo per valori dinamici (colori rank, percentuali)
- `data-active={bool}` per stili condizionali invece di `onMouseEnter/Leave`
- Font: `font-display` (Rajdhani) per label/titoli, `font-body` per testo

## File da NON toccare
- `utils/tables.js` — solo dati grezzi, aggiungere solo nuove tabelle
- `firebase/config.js` — configurazione Firebase
- `firestore.indexes.json` — indici Firestore

## Aggiungere un nuovo test
1. Aggiungi oggetto in `constants/tests.js` con tutti i campi
2. Aggiungi tabella percentili in `utils/tables.js`
3. Nessun altro file da modificare

## Aggiungere una nuova pagina trainer
1. Crea il componente in `features/trainer/`
2. Aggiungi voce in `features/trainer/trainer.config.js`
3. Aggiungi voce `NAV_ITEMS` in `components/layout/trainer-shell/constants.jsx`
4. Nessun altro file da modificare