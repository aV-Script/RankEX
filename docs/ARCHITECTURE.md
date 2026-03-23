# FitQuest — Architettura

## Stack

| Layer | Tecnologia |
|-------|-----------|
| UI | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Backend | Firebase (Auth + Firestore) |
| Testing | Vitest |

## Struttura cartelle

```
src/
├── app/                    — App.jsx, AppRouter, routes.config
├── components/
│   ├── common/             — ErrorBoundary, ConfirmDialog, Skeleton, Toast, Pagination, ProtectedRoute
│   ├── layout/             — TrainerShell + trainer-shell/
│   ├── modals/             — new-client-wizard/, campionamento-modal/
│   └── ui/                 — primitivi riutilizzabili (Card, Modal, Field, Button, ...)
├── config/
│   └── app.config.js       — costanti globali (timeout, limiti, durate)
├── constants/
│   ├── index.js            — RANKS, CATEGORIE, NEW_CLIENT_DEFAULTS, getRankFromMedia
│   ├── tests.js            — configurazione completa test fisici
│   └── formulas.js         — formule di calcolo (es. VO2max)
├── context/
│   ├── TrainerContext.jsx  — selectedClient (stato UI trainer)
│   └── ToastContext.jsx    — sistema notifiche in-app
├── features/
│   ├── auth/               — LoginPage, useLoginForm, primitives
│   ├── calendar/           — useCalendar, calendarGroupUtils
│   ├── client/             — ClientView, ClientDashboard, CampionamentoView
│   ├── notification/       — NotificationsPanel
│   └── trainer/            — TrainerView, ClientsPage, GroupsPage, TrainerCalendar
├── firebase/
│   ├── config.js           — inizializzazione Firebase
│   └── services/           — auth, calendar, clients, db, groups, notifications, users
├── hooks/                  — useClients, useGroups, useClientRank, useNotifications, usePagination, useAsync
└── utils/
    ├── gamification.js     — calcSessionConfig, buildXPUpdate, buildCampionamentoUpdate
    ├── percentile.js       — calcPercentile, calcStatMedia
    ├── tables.js           — tabelle percentili grezze (NON modificare)
    ├── validation.js       — funzioni di validazione pure
    └── firebaseErrors.js   — messaggi errore Firebase in italiano
```

## Principi architetturali

### Separation of concerns
- **Hook** — logica, stato, fetch Firestore
- **Componenti** — render, composizione UI
- **Services** — I/O Firebase, nessuna logica
- **Utils** — funzioni pure, nessun side effect
- **Config** — dati statici, costanti

### Data-driven UI
Le strutture dati guidano il render invece di condizionali hardcoded:
- `constants/tests.js` → lista test con `categories[]`, `direction`, `ageGroup`
- `trainer.config.jsx` → mappa `PAGES` (id → componente)
- `routes.config.jsx` → `PROTECTED_ROUTES`, `ROLE_REDIRECT`

### Optimistic updates
Pattern uniforme in tutti gli hook con mutation:
```js
const snapshot = state
setState(optimisticValue)        // 1. aggiorna UI subito
try {
  await firestoreCall()          // 2. chiama Firestore
} catch {
  setState(snapshot)             // 3. rollback se errore
  toast.error(getFirebaseErrorMessage(err))
}
```

### Code splitting
`TrainerView` e `ClientView` sono caricati con `React.lazy` + `Suspense`. Bundle suddiviso con Vite `manualChunks` in: `firebase`, `recharts`, `vendor`.

## Flusso autenticazione

```
Firebase Auth onAuthStateChanged
  ↓
useAuth — user + profile (users/{uid})
  ↓
App.jsx — loading / timeout / render
  ↓
ProtectedRoute — verifica role + redirect
  ↓
TrainerView | ClientView
```

`profile === undefined` = loading
`profile === null` = utente non trovato → redirect login

## Pattern navigazione trainer

```
TrainerContext    — selectedClient (stato UI)
useTrainerNav    — page + selectedClient + navigateTo/selectClient
TrainerView      — TrainerProvider > TrainerLayout
TrainerLayout    — PAGES[page] ?? PAGES.clients
                   selectedClient → ClientDashboard
```

Cambiare pagina azzera automaticamente `selectedClient`.
