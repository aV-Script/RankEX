# FitQuest — Production Readiness Tasks

Leggi CLAUDE.md prima di procedere.
Esegui i task in ordine. Per ogni task: leggi i file coinvolti, 
fai le modifiche, verifica che non ci siano errori.

---

## TASK 1 — Error Boundaries

Aggiungi error boundary globale e per feature.

File da creare:
- `src/components/common/ErrorBoundary.jsx`
- `src/components/common/ErrorFallback.jsx`

Requisiti:
- Cattura errori React non gestiti
- Mostra UI di fallback invece di schermo bianco
- Log dell'errore in console (in futuro → Sentry)
- Bottone "Ricarica" per recovery
- ErrorBoundary wrappa TrainerView, ClientView e AppRouter

---

## TASK 2 — Loading States uniformi

Oggi ogni componente gestisce loading in modo diverso.
Standardizza con un componente `Skeleton` riusabile.

File da creare:
- `src/components/common/Skeleton.jsx`

Requisiti:
- `Skeleton` con varianti: `card`, `list`, `text`, `circle`
- Animazione pulse
- Sostituisci tutti i "Caricamento..." con skeleton appropriati in:
  - ClientsPage
  - GroupsPage
  - TrainerCalendar
  - ClientView

---

## TASK 3 — Form Validation robusta

Oggi la validazione è sparsa nei componenti.
Centralizza con uno schema di validazione.

File da creare:
- `src/utils/validation.js`

Requisiti:
- `validateEmail(email)` → { valid, error }
- `validatePassword(password)` → { valid, error }
- `validateAge(age)` → { valid, error }
- `validateRequired(value, label)` → { valid, error }
- `validateNumber(value, { min, max, label })` → { valid, error }
- Aggiorna useLoginForm, useWizard, ChangePasswordScreen
  per usare le funzioni centralizzate

---

## TASK 4 — Toast notifications

Oggi non c'è feedback visivo per operazioni completate/fallite.

File da creare:
- `src/components/common/Toast.jsx`
- `src/hooks/useToast.js`
- `src/context/ToastContext.jsx`

Requisiti:
- Varianti: success, error, warning, info
- Auto-dismiss dopo 3 secondi
- Posizione: bottom-right desktop, bottom mobile
- Animazione slide-in
- Max 3 toast contemporanei
- Integra in:
  - handleAddClient → success "Cliente creato"
  - handleDeleteClient → success "Cliente eliminato"  
  - handleCampionamento → success "Campionamento salvato"
  - handleCloseSlot → success "Sessione chiusa · +XP assegnata"
  - Qualsiasi catch → error con messaggio

---

## TASK 5 — Protezione route e ruoli

Oggi ProtectedRoute controlla solo il ruolo base.

File da modificare:
- `src/components/common/ProtectedRoute.jsx`
- `src/app/routes.config.js`

Requisiti:
- Gestione stato `profile === undefined` (loading) distinta da `null` (non trovato)
- Redirect corretto dopo login basato su ruolo
- Gestione `mustChangePassword` prima di accedere all'area cliente
- Timeout dopo 10 secondi di loading → mostra errore

---

## TASK 6 — Gestione errori Firebase

Oggi gli errori Firebase sono gestiti inconsistentemente.

File da creare:
- `src/utils/firebaseErrors.js`

Requisiti:
- Mappa codici errore Firebase → messaggi italiani
- Casi: auth/wrong-password, auth/user-not-found, 
  auth/email-already-in-use, auth/requires-recent-login,
  permission-denied, unavailable, deadline-exceeded
- Usato in useLoginForm, handleAddClient, ChangePasswordScreen

---

## TASK 7 — Ottimizzazione performance

File da modificare:
- `src/features/trainer/clients-page/ClientCard.jsx` → memo
- `src/features/trainer/trainer-calendar/EventBlock.jsx` → memo
- `src/features/trainer/trainer-calendar/MonthView.jsx` → memo celle
- `src/hooks/useClients.js` → verifica dipendenze useCallback
- `src/hooks/useGroups.js` → verifica dipendenze useCallback

Requisiti:
- Wrappa con React.memo i componenti che ricevono props stabili
- Verifica che tutte le dipendenze useCallback/useMemo siano corrette
- Aggiungi `useCallback` ai handler passati come prop

---

## TASK 8 — Accessibilità base

File da modificare (tutti i componenti interattivi):

Requisiti:
- Tutti i `<button>` hanno `aria-label` se non hanno testo visibile
- Tutti i form hanno `<label>` associati agli input
- Focus visibile su tutti gli elementi interattivi
- `role="alert"` su messaggi di errore
- `aria-live="polite"` su aggiornamenti dinamici
- Navigazione keyboard funzionante in modal e dropdown

---

## TASK 9 — Environment variables e config

File da creare:
- `.env.example` — template variabili d'ambiente
- `src/config/app.config.js` — costanti di configurazione app

Requisiti:
- `.env.example` con tutte le VITE_FIREBASE_* documentate
- `app.config.js` centralizza:
  - `APP_NAME`, `APP_VERSION`
  - `MAX_CLIENTS_PER_TRAINER`
  - `MAX_FILE_SIZE`
  - `PAGINATION_PAGE_SIZE`
  - `TOAST_DURATION_MS`

---

## TASK 10 — Testing setup

File da creare:
- `vitest.config.js`
- `src/utils/gamification.test.js`
- `src/utils/percentile.test.js`
- `src/utils/validation.test.js`

Requisiti:
- Configura Vitest + Testing Library
- Test per `calcSessionConfig` — verifica XP per diverse frequenze
- Test per `calcPercentile` — verifica calcolo per ogni test
- Test per `buildXPUpdate` — verifica level up
- Test per `validateEmail`, `validatePassword`
- Almeno 20 test totali
- Script `npm run test` nel package.json

---

## TASK 11 — Sicurezza Firestore Rules

File da creare:
- `firestore.rules`

Requisiti:
- `clients` — lettura/scrittura solo al trainer proprietario
  o al cliente stesso (tramite clientAuthUid)
- `slots` — lettura/scrittura solo al trainer proprietario
- `groups` — lettura/scrittura solo al trainer proprietario  
- `notifications` — lettura/scrittura solo al cliente destinatario
- `users` — lettura solo al proprio documento
- Nessun accesso pubblico a nessuna collection
- Testa le rules con Firebase Emulator

---

## TASK 12 — SEO e metadata

File da modificare:
- `index.html`

File da creare:
- `public/manifest.json` — PWA manifest

Requisiti:
- Title e description corretti in `index.html`
- Open Graph tags base
- `manifest.json` per installazione PWA
- `theme-color` coerente con il design
- Favicon appropriata

---

## TASK 13 — Bundle optimization

File da modificare:
- `vite.config.js`

Requisiti:
- Code splitting per route — TrainerView e ClientView caricati lazy
- Chunk separato per Firebase
- Chunk separato per Recharts
- Analisi bundle con rollup-plugin-visualizer
- Target: bundle principale < 200KB gzipped
```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase:  ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          recharts:  ['recharts'],
          vendor:    ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
})
```

---

## TASK 14 — CI/CD base

File da creare:
- `.github/workflows/ci.yml`

Requisiti:
- Trigger su push e PR verso main
- Steps: install → lint → test → build
- Fallisce se i test non passano
- Fallisce se il build non compila

---

## TASK 15 — Documentazione API interna

File da creare:
- `docs/ARCHITECTURE.md` — decisioni architetturali
- `docs/FIREBASE.md` — struttura Firestore e regole
- `docs/GAMIFICATION.md` — sistema XP, rank, livelli

Requisiti:
- `ARCHITECTURE.md` spiega il pattern feature folders e
  separation of concerns con esempi dal codice
- `FIREBASE.md` documenta ogni collection con schema completo
- `GAMIFICATION.md` documenta formule XP, soglie rank,
  calcolo percentili

---

## Priorità di esecuzione

### Critico — prima del primo utente reale
```
TASK 11 — Firestore Rules     (sicurezza)
TASK 5  — Protezione route    (sicurezza)
TASK 6  — Errori Firebase     (UX)
TASK 4  — Toast notifications (UX)
TASK 2  — Loading states      (UX)
TASK 1  — Error Boundaries    (stabilità)
```

### Importante — prima del lancio
```
TASK 3  — Form validation     (robustezza)
TASK 9  — Environment config  (manutenibilità)
TASK 13 — Bundle optimization (performance)
TASK 7  — Performance         (scalabilità)
```

### Buono da avere
```
TASK 8  — Accessibilità
TASK 10 — Testing
TASK 12 — SEO/PWA
TASK 14 — CI/CD
TASK 15 — Documentazione
```
