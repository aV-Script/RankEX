# RankEX — Corso React + Firebase sul codice reale

Corso costruito interamente sul codice di questo repository: ogni lezione cita file, funzioni
e righe reali di RankEX, non esempi generici. Obiettivo: autonomia completa nel mantenere e
sviluppare il progetto senza dipendere dall'AI.

Il materiale è pensato per essere letto in ordine (dal più semplice al più avanzato), ma ogni
lezione è un file a sé stante — puoi saltare a quella che ti serve.

---

## 1. Panoramica del progetto

### Stack
```
React 18.3 (function components + hooks, no class components)
React Router 7.15 (routing SPA client-side)
Firebase 10.12 → Auth · Firestore · Cloud Functions (callable) · Hosting multisito
Tailwind CSS v4 (via @tailwindcss/vite — CSS-first, niente tailwind.config.js classico)
Recharts 2.12 (grafici)
Vite 5 (bundler/dev server)
Vitest + Playwright (unit test + e2e) — 10 file __tests__, test:rules con Firestore emulator
```

### Architettura a strati
```
┌─────────────────────────────────────────────────────────────────┐
│  UI (features/*, components/*)                                  │
│  → JSX, composizione, render. Nessuna logica di business qui.   │
├─────────────────────────────────────────────────────────────────┤
│  Hook (hooks/*, features/**/use*.js)                             │
│  → stato locale, effect, orchestrazione. Es. useClients.js       │
├────────────────────┬────────────────────────────────────────────┤
│  usecases/ (31 file)│  firebase/services/ (15 file)              │
│  → SCRITTURE via    │  → LETTURE dirette Firestore                │
│    httpsCallable    │    (getDocs/getDoc) + alcuni update diretti │
│    (Cloud Functions)│    (es. updateClient per BIA/misure)        │
├────────────────────┴────────────────────────────────────────────┤
│  utils/ (15 file) — funzioni pure, testate                       │
│  → gamification.js, percentile.js, bia.js, validation.js         │
├───────────────────────────────────────────────────────────────  ┤
│  config/ + constants/ — dati statici, nessuna logica              │
│  → modules.config.js, plans.config.js, tests.js, tables.js        │
└─────────────────────────────────────────────────────────────────┘
```

Punto architetturale non scontato leggendo solo `CLAUDE.md`: le **scritture principali**
(creare/eliminare cliente, salvare campionamento/XP) non toccano Firestore direttamente dal
client — passano da **Cloud Functions callable** tramite il layer `src/usecases/` (31 file,
es. [createClientUseCase.js](../../src/usecases/createClientUseCase.js)). Le **letture**
restano dirette a Firestore via `firebase/services/*.js`. È un'architettura ibrida reale — la
lezione 13 la tratta come caso di studio a sé.

### Bootstrap dell'app (traccia di avvio)
```
main.jsx
  └─ ReactDOM.createRoot(...).render(
       <BrowserRouter>            ← react-router: abilita routing SPA
         <ToastProvider>          ← Context per notifiche toast globali
           <App />
         </ToastProvider>
       </BrowserRouter>
     )

App.jsx
  ├─ useAuth()                    ← ascolta Firebase Auth, carica profilo+org
  ├─ useSessionTimeout(role)      ← logout automatico per inattività
  ├─ useVersionCheck()            ← rileva nuova build → banner ricarica
  ├─ isLoading? → <LoadingScreen/>
  └─ <ThemeProvider>
       <ErrorBoundary>
         <DomainGuard role=...>   ← blocco app/admin domain in produzione
           <AppRouter user profile org terminology .../>
         </DomainGuard>
       </ErrorBoundary>

AppRouter.jsx
  └─ per ogni voce di PROTECTED_ROUTES (routes.config.jsx):
       <ProtectedRoute allowedRoles=...>
         {element(user, profile, {org, terminology, refreshProfile})}
       </ProtectedRoute>
     → 4 rami lazy-loaded: TrainerView / ClientView / SuperAdminView / OrgAdminView
```

### Multi-tenancy e ruoli
Ogni utente appartiene a una `organizations/{orgId}`. 5 ruoli (`super_admin`, `org_admin`,
`trainer`, `staff_readonly`, `client`) determinano sia il routing (`ROLE_REDIRECT`) sia le
Firestore rules. `orgId` è **sempre il primo argomento** di hook e service — è la convenzione
architetturale più importante del progetto.

### Gestione dello stato — 3 livelli distinti nel codice
```
1. useState locale       → dentro un singolo componente/hook (es. useLoginForm)
2. Context + useReducer  → stato condiviso in un sottoalbero (TrainerContext: cliente selezionato)
3. Server state          → Firestore stesso è la "fonte di verità", i hook (useClients)
                            fanno fetch + optimistic update + rollback
```
Niente Redux, niente React Query — tutto costruito a mano con `useState`/`useEffect`/
`useCallback`. Punto di discussione ricorrente nelle lezioni (best practice vs. cosa manca).

### Sicurezza
Firestore rules (234 righe), audit log append-only, session timeout per ruolo, password
policy, CSP headers, DomainGuard. Niente Firebase App Check (rimosso deliberatamente).
Lezione 21 dedicata.

---

## 2. Mappa delle dipendenze

```
main.jsx
  └── App.jsx
        ├── features/auth/useAuth.js
        │     ├── firebase/services/auth.js   (onAuthChange)
        │     ├── firebase/services/users.js  (getUserProfile)
        │     └── firebase/services/org.js    (getOrganization)
        ├── hooks/useSessionTimeout.js
        ├── hooks/useVersionCheck.js
        ├── components/common/DomainGuard.jsx  → utils/env.js
        ├── context/ThemeContext.jsx           → config/themes.config.js
        └── app/AppRouter.jsx
              └── app/routes.config.jsx
                    ├── features/trainer/TrainerView.jsx     (role: trainer/staff_readonly)
                    ├── features/client/ClientView.jsx       (role: client)
                    ├── features/org/OrgAdminView.jsx        (role: org_admin)
                    └── features/admin/SuperAdminView.jsx    (role: super_admin)

Catena dati completa (esempio ClientsPage):
  ClientsPage.jsx
    └── hooks/useClients.js(orgId, userId)
          ├── firebase/services/clients.js   → getClients()          [READ diretto Firestore]
          ├── usecases/createClientUseCase.js → httpsCallable('creaCliente')   [WRITE via Cloud Function]
          ├── usecases/deleteClientUseCase.js → httpsCallable(...)             [WRITE via Cloud Function]
          ├── usecases/saveCampionamentoUseCase.js → httpsCallable(...)
          ├── usecases/saveXPUseCase.js            → httpsCallable(...)
          ├── utils/gamification.js  → buildCampionamentoUpdate/buildXPUpdate  [calcolo puro, locale]
          ├── context/TrainerContext.jsx → dispatch(SELECT_CLIENT)             [sync stato globale]
          └── hooks/useToast.js → feedback UI (success/error)
```

Nota il pattern: **il calcolo (XP, rank, livello) avviene lato client in
`utils/gamification.js` per l'optimistic update**, poi la Cloud Function rifà lo stesso calcolo
lato server come fonte di verità. Lezione 14 lo analizza in dettaglio.

---

## 3. Indice del corso

Legenda: 🟢 Base · 🟡 Intermedio · 🔴 Avanzato

### Modulo 0 — Fondamenta React nel progetto
| # | Lezione | Livello |
|---|---------|---------|
| 1 | [Bootstrap dell'app: da index.html a main.jsx a App.jsx](01-bootstrap-app.md) | 🟢 |
| 2 | [JSX, componenti funzionali e props](02-jsx-componenti-props.md) | 🟢 |
| 3 | [Styling: Tailwind v4 + CSS custom properties + design tokens](03-styling-tailwind-tokens.md) | 🟢 |

### Modulo 1 — Stato e hook
| # | Lezione | Livello |
|---|---------|---------|
| 4 | [useState e form controllati](04-usestate-form.md) | 🟢 |
| 5 | [useEffect e ciclo di vita](05-useeffect-lifecycle.md) | 🟡 |
| 6 | [Custom hook, useCallback e closures](06-custom-hook-usecallback.md) | 🟡 |
| 7 | [Context API + useReducer](07-context-usereducer.md) | 🟡 |

### Modulo 2 — Routing e autenticazione
| # | Lezione | Livello |
|---|---------|---------|
| 8 | [React Router, lazy loading, ProtectedRoute](08-react-router-protected-route.md) | 🟡 |
| 9 | [Firebase Auth e ciclo utente→profilo→org](09-firebase-auth.md) | 🟡 |
| 10 | [Multi-tenancy: orgId, ruoli, DomainGuard](10-multitenancy-domainguard.md) | 🟡 |

### Modulo 3 — Firebase / dati
| # | Lezione | Livello |
|---|---------|---------|
| 11 | [Modello dati Firestore e path helpers](11-firestore-data-model-paths.md) | 🟡 |
| 12 | [Letture dirette Firestore](12-firestore-letture-dirette.md) | 🟡 |
| 13 | [Cloud Functions callable e il layer usecases/](13-cloud-functions-usecases.md) | 🔴 |
| 14 | [Optimistic UI con rollback](14-optimistic-ui-rollback.md) | 🟡 |
| 15 | [Realtime con onSnapshot](15-realtime-onsnapshot.md) | 🔴 |
| 16 | [Firestore Security Rules](16-firestore-security-rules.md) | 🔴 |

### Modulo 4 — Logica di dominio
| # | Lezione | Livello |
|---|---------|---------|
| 17 | [Funzioni pure e unit test](17-funzioni-pure-unit-test.md) | 🟡 |
| 18 | [Algoritmi statistici di dominio (percentili)](18-algoritmi-percentili.md) | 🔴 |
| 19 | [Config-driven UI](19-config-driven-ui.md) | 🟡 |

### Modulo 5 — Qualità e produzione
| # | Lezione | Livello |
|---|---------|---------|
| 20 | [Error boundaries e gestione errori](20-error-boundaries.md) | 🟡 |
| 21 | [Sicurezza applicativa](21-sicurezza-applicativa.md) | 🔴 |
| 22 | [Testing e CI/CD](22-testing-cicd.md) | 🔴 |

### Chiusura
| # | Lezione |
|---|---------|
| 23 | [Roadmap finale: competenze, punti deboli, piano di studio](23-roadmap-finale.md) |

---

## Come usare questo materiale

Ogni lezione segue sempre la stessa struttura: Obiettivo → Concetti teorici → Dove compare nel
progetto → Analisi del codice (blocco per blocco, codice reale) → Diagramma mentale → Errori
comuni → Best Practice → Quiz (10 domande) → Risposte e spiegazioni → Esercizi (dal più
semplice) → Challenge (una modifica reale al progetto).

Le lezioni sono state generate tutte insieme su richiesta esplicita — se preferisci il ritmo
originale (una alla volta, con correzione dei tuoi quiz), leggile comunque una per volta e
prova a rispondere ai quiz **prima** di leggere la sezione "Risposte e spiegazioni".

**Nota di manutenzione (ago 2026):** scrivendo il corso sono stati trovati alcuni gap reali nel
codice (un limite piano non applicato lato server, una divergenza tra le copie client/server di
`gamification.js`, un path helper mancante, una riga di `CLAUDE.md` disallineata dal codice) —
poi sistemati per davvero, deployati, e le lezioni 11, 12, 13, 14 e 16 sono state riscritte di
conseguenza per riflettere lo stato attuale. Dove leggi frasi come *"quando questa lezione è
stata scritta la prima volta"*, è quel prima/dopo: il corso racconta sia il bug reale sia il fix
reale, non solo uno snapshot statico.
