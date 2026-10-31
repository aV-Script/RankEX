# RankEX — Note di architettura e riferimento

Sezioni spostate da `CLAUDE.md` (testo originale invariato, titoli originali) per ridurre il contesto caricato a ogni sessione. Quando una sezione è compattata in `CLAUDE.md`, qui c'è la versione completa originale.

---
## Piani SaaS

Fonte di verità: `src/config/plans.config.js`

```
free:       1 trainer  ·  10 clienti
pro:        5 trainer  · 100 clienti
enterprise: illimitati
```

I counter `memberCount` e `clientCount` sono mantenuti
**atomicamente** dalle Cloud Functions (Admin SDK), nello stesso batch dell'operazione:
- `creaMembroTeam` / `rimuoviMembroTeam` → `increment(±1)` su `org.memberCount`
- `creaCliente` / `eliminaCliente` → `increment(±1)` su `org.clientCount`

**UI — blocchi al limite:**
- `MembersPage`: banner giallo + bottone "AGGIUNGI" disabilitato
- `NewClientView`: schermata di blocco invece del wizard
- `OrgSettingsPage`: piano corrente in sola lettura con i limiti (lo cambia solo super_admin)
- `OrgDetailView` (super_admin): barre progresso utilizzo trainer/clienti

```js
// Import corretto
// Non esiste un alias per src/: import relativi, es. da src/features/trainer/
import { getPlanLimits, isAtTrainerLimit, isAtClientLimit } from '../../config/plans.config'
```

---

### Nota (`clients/{clientId}/notes/{noteId}`)
```js
{
  text,
  authorId,    // Firebase Auth UID
  authorName,  // nome visibile
  authorRole,  // 'trainer'|'org_admin'|'staff_readonly'|'client'
  parentId,    // null = thread root | noteId = commento del thread
  createdAt,
}
```
Pattern thread: `parentId === null` = nota principale; `parentId = noteId` = commento.
**Regola:** il client è sempre in sola lettura sulle note — non può creare né commenti né
note proprie (`firestore.rules` limita `create`/`delete` a `canWrite(orgId)`, la Cloud
Function `aggiungiNota` rifiuta esplicitamente `role === 'client'`, e `NotesSection` è
montata `readonly` in `ClientDashboardPage.jsx`). Solo trainer/org_admin scrivono note e
commenti; il client li vede e basta.
La cancellazione a cascata (nota root + suoi commenti) la fa la Cloud Function `eliminaNota`.

### Scheda Allenamento (`workoutPlans/{planId}`)
```js
{
  title, description,
  clientId,    // cliente assegnato
  days: [
    {
      label: 'Giorno 1',
      exercises: [{ name, sets, reps, restSeconds, notes }],
    }
  ],
  status:    'active'|'archived',
  targetSessions,     // sessioni previste (1-200) o null — scelte dal trainer
  completedSessions,  // presenze registrate da chiudiSessione — mai dal client
  completedAt,        // scritto da chiudiSessione al raggiungimento di targetSessions
  createdAt, updatedAt,
}
```
**Collegamento al calendario (ott 2026):** ogni sessione chiusa con presenza fa avanzare di
uno la scheda `active` dell'atleta, nella stessa transazione di `chiudiSessione`. Raggiunte
le `targetSessions`, la scheda è completata e l'atleta riceve `PLAN_COMPLETION_XP` (100,
speculare in `constants/index.js` e `functions/src/shared/constants.js`) una volta sola,
con voce di log e notifica. Il giorno consigliato ruota sui giorni della scheda
(`getPlanProgress` in `utils/workoutPlans.js`, UI `PlanProgress.jsx` per trainer e atleta).
`aggiornaSchedaAllenamento` accetta `targetSessions` ma non `completedSessions`/`completedAt`.
L'anteprima XP di `CloseSessionModal` non include il bonus scheda.
`days` è un array di giorni (max 7), ogni giorno ha un array di esercizi.
Backward compat: vecchi documenti con `exercises[]` flat vengono normalizzati
a `[{ label: 'Giorno 1', exercises }]` lato client.
Il client vede la scheda `active` assegnata a sé in read-only nella propria dashboard.

### Obiettivo (`clients/{clientId}/goals/{goalId}`)
```js
{
  testKey,             // riferimento a un test in ALL_TESTS/TESTS_META
  testLabel,           // denormalizzato dal client al momento della creazione —
                        // il BE non ha label/unit dei test (vedi testsMeta.js),
                        // stesso motivo del log text in saveCampionamentoUseCase
  targetPercentile,    // 1-100
  deadline,            // 'YYYY-MM-DD'
  note,                // opzionale, libero
  status,              // 'active' | 'achieved' | 'cancelled'
  createdAt, createdBy,
  achievedAt,          // null finché non raggiunto
  achievedPercentile,  // percentile che ha fatto scattare l'achievement
}
```
`status: 'missed'` **non esiste in Firestore** — un obiettivo attivo con `deadline`
superata è calcolato al volo lato client (`utils/goals.js` → `isGoalMissed`/
`getGoalDisplayStatus`), per non richiedere un cron/trigger dedicato solo a marcare
la scadenza. L'achievement è invece scritto server-side dentro
`functions/src/callable/salvaCampionamento.js`: dopo aver calcolato i percentili del
campionamento, controlla gli obiettivi `active` del cliente e — se il test
dell'obiettivo è tra quelli appena valutati (`testMeta.categories.includes(categoria)`,
non solo la stat in comune, per l'ambiguità stat condivise già nota) e il percentile
raggiunto è `>= targetPercentile` — marca `achieved` e invia una notifica. Mai
calcolato o scritto dal client. Il client legge i propri obiettivi in sola lettura
(motivante vederli), non può crearli né annullarli — stesso pattern delle note.

### BIA — singola misurazione
```js
{
  date,
  fatMassPercent, muscleMassKg,
  waterPercent, boneMassKg,
  bmi,          // calcolato automaticamente
  bmrKcal, metabolicAge, visceralFat,
}
```

---

## Struttura cartelle

**Nota:** albero riverificato contro il codice reale (lug 2026) dopo aver trovato diversi
disallineamenti — file rimossi mai tolti dall'albero, feature intere mai documentate, e
alcuni file di codice morto (mai importati da nessuno) rimossi dal repo in questa stessa
sessione: `Sidebar.jsx`/`MobileNav.jsx`/`SidebarIcon.jsx`/`TabItem.jsx` (sostituiti da
`AppNav.jsx`), `client-dashboard/DashboardHeader.jsx` (sostituito da `ClientDashboardHeader.jsx`),
`config/theme.js` (sostituito da `themes.config.js`), `components/ui/RankRing.jsx` (mai
importato — audit round 4, RX-77), `hooks/useClientWearable` + `linkGoogleFit`/
`resolveGoogleFitRedirect`/`unlinkWearable` in `firebase/services/wearable.js` (feature
Wearable lato client mai raggiungibile — audit round 4, RX-62, vedi sezione dedicata).
Rimossi anche (audit di Art Direction, lug 2026, fix P1.7): `ContextNav.jsx` +
`trainer-shell/CircularNav.jsx` + `context/NavMenuContext.jsx` (~640 righe di sistema di
navigazione radiale mai montato a runtime — zero consumer JSX, confermato via grep),
`client-view/ClientHUD.jsx` (secondo "HUD" cliente, design language mai adottato),
`clients-page/FiltersSidebar.jsx` + `clients-page/MobileControls.jsx` (split filtri
responsive mai collegato, `ClientsPage.jsx` usa un pattern inline proprio). La rimozione
ha scoperto due bug funzionali reali nascosti dietro il sistema morto — vedi
`RecurrenceDetailHeader.jsx` (nessun modo di cancellare una ricorrenza attiva) e
`NewClientView.jsx` (nessun bottone indietro) — entrambi fixati con un'affordance reale
nell'header, non più un menu contestuale invisibile.

```
src/
├── app/
│   ├── App.jsx
│   ├── AppRouter.jsx        ← routing per ruolo
│   └── routes.config.jsx
│
├── components/
│   ├── common/
│   │   ├── ConfirmDialog.jsx
│   │   ├── ChartErrorFallback.jsx ← fallback compatto per ErrorBoundary attorno ai grafici
│   │   ├── DomainGuard.jsx      ← blocco bidirezionale per dominio+ruolo
│   │   ├── ErrorBoundary.jsx    ← accetta prop fallback (render-prop), default ErrorFallback
│   │   ├── ErrorFallback.jsx    ← fallback full-page di default
│   │   ├── LoadingScreen.jsx    ← data-testid="loading" (usato da e2e/helpers/page.js)
│   │   ├── Pagination.jsx
│   │   ├── PrintPickerModal.jsx ← scelta modalità stampa (dark/light) prima di ClientReportPrint/GroupReportPrint
│   │   ├── ProtectedRoute.jsx
│   │   ├── ReadonlyBanner.jsx
│   │   ├── ReadonlyGuard.jsx
│   │   ├── SessionWarningDialog.jsx ← avviso 60s prima del logout per inattività
│   │   └── Toast.jsx
│   ├── layout/
│   │   ├── TrainerShell.jsx     ← usa SOLO AppNav
│   │   └── trainer-shell/
│   │       ├── AppNav.jsx           ← nav attuale: top bar desktop + bottom tab bar mobile con swipe
│   │       └── navItems.config.jsx  ← NAV_ITEMS + ORG_ADMIN_NAV_ITEMS
│   └── ui/
│       ├── index.jsx        ← Card, SectionLabel, Badge, RankBadge, DayTabs,
│       │                       Modal, Input, Textarea, Button, Field,
│       │                       EmptyState, ActivityLog, StatsSection, StatCard,
│       │                       XPBar (re-export da ./XPBar.jsx)
│       ├── icons.jsx             ← icon registry condiviso: IconClose, IconChevronLeft,
│       │                           IconDocument, IconPdf, IconDelete (tutte aria-hidden)
│       ├── BadgeMedal.jsx        ← medaglia badge (cerchio + icona tier) per TrophiesSection
│       ├── ThemePicker.jsx       ← selettore tema client (Pentagon Nav + Theme System)
│       ├── XPBar.jsx            ← prop fullWidth=false rimuove max-w-sm interno
│       └── Pentagon.jsx
│
├── config/
│   ├── modules.config.js    ← MODULES, TERMINOLOGIES, PLAYER_ROLES,
│   │                           SOCCER_FIXED_TESTS, SOCCER_AGE_GROUPS
│   ├── plans.config.js      ← PLAN_LIMITS, getPlanLimits,
│   │                           isAtTrainerLimit, isAtClientLimit
│   ├── badges.config.js     ← BADGES, BADGE_TIERS, MANUAL_BADGES — fonte di verità trofei
│   ├── avatars.config.js    ← catalogo avatar fissi per org (sostituisce builder DiceBear)
│   ├── themes.config.js     ← 7 temi client (RankEX, Midnight, Carbon, Violet, Steel, Phantom, Mint)
│   ├── app.config.js        ← PAGINATION_PAGE_SIZE e altre costanti app-wide
│   └── runbook.config.js    ← RUNBOOK_SUITES, SEVERITY, TOTAL_CASES — fonte di
│                               verità dei casi di test manuali (sostituisce
│                               docs/test-plan.md, superseded — vedi sezione dedicata)
│
├── constants/
│   ├── index.js             ← RANKS, CATEGORIE, NEW_CLIENT_DEFAULTS,
│   │                           getRankFromMedia, getCategoriaById,
│   │                           getStatsConfig, getTestsForCategoria
│   ├── tests.js             ← ALL_TESTS con key, stat, label, unit,
│   │                           direction, ageGroup, categories, guide
│   ├── formulas.js          ← applyFormula
│   └── bia.js               ← BIA_PARAMS, PROFILE_CATEGORIES,
│                               FAT_MASS_RANGES, WATER_RANGES,
│                               VISCERAL_RANGES, BMI_RANGES, XP_BIA
│
├── context/
│   ├── TrainerContext.jsx   ← selectedClient, orgId, moduleType,
│   │                           terminology, userRole, orgPlan
│   ├── ReadonlyContext.jsx  ← readonly boolean
│   ├── ThemeContext.jsx     ← 7 temi dinamici client (Pentagon Nav + Theme System, giu 2026)
│   └── ToastContext.jsx
│
├── features/
│   ├── admin/               ← area super_admin
│   │   ├── AdminShell.jsx   ← sidebar con accent rosso (ADMIN_COLOR da config/app.config.js)
│   │   ├── SuperAdminView.jsx
│   │   └── admin-pages/
│   │       ├── AdminDashboard.jsx  ← stat + piano breakdown + orgs recenti
│   │       ├── AdminProfilePage.jsx ← modifica email e password
│   │       ├── OrgsPage.jsx
│   │       ├── OrgDetailView.jsx   ← utilizzo piano (barre progresso)
│   │       ├── CreateOrgForm.jsx   ← ownerId popolato con uid super_admin
│   │       └── RunbookPage.jsx     ← runbook manuale: nuovo giro + storico esecuzioni (vedi sezione dedicata)
│   │
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── useAuth.js       ← carica user + profile + org + terminology
│   │   ├── useLoginForm.js
│   │   └── components/
│   │       ├── BrandingPanel.jsx   ← semi-trasparente, credit "by Dr. Lamberti Valerio"
│   │       ├── LoginForm.jsx
│   │       └── ResetForm.jsx
│   │
│   ├── bia/
│   │   ├── useBia.js        ← no args — gets orgId from useTrainerState()
│   │   ├── BiaView.jsx
│   │   ├── UpgradeCategoryBanner.jsx
│   │   └── bia-view/
│   │       ├── BiaGaugeBar.jsx
│   │       ├── BiaSummary.jsx
│   │       └── BiaHistoryChart.jsx
│   │
│   ├── calendar/
│   │   ├── useCalendar.js
│   │   ├── useRecurrences.js
│   │   └── calendarGroupUtils.js
│   │
│   ├── client/              ← area cliente (role: client)
│   │   ├── ClientView.jsx
│   │   ├── useClient.js     ← useClient(orgId, clientId)
│   │   ├── CampionamentoView.jsx
│   │   ├── ClientCalendar.jsx
│   │   ├── StatsChart.jsx
│   │   ├── ChangePasswordScreen.jsx
│   │   ├── ClientDashboard.jsx          ← vista trainer: layout 2 col + mobile ATLETA tab
│   │   ├── client-view/
│   │   │   ├── ClientShell.jsx
│   │   │   ├── ClientHub.jsx            ← hub pentagono client (Pentagon Nav, giu 2026)
│   │   │   ├── ClientBottomNav.jsx
│   │   │   ├── ClientDashboardPage.jsx  ← vista client: stesso layout, ATLETA tab mobile
│   │   │   ├── avatar/
│   │   │   │   ├── AvatarDisplay.jsx    ← renderizza avatar dal catalogo fisso, onError fallback
│   │   │   │   └── AvatarPicker.jsx     ← selezione tra avatar predefiniti (sostituisce builder DiceBear)
│   │   │   └── client.config.jsx
│   │   ├── useMisure.js                 ← hook CRUD peso+altezza su cliente
│   │   └── client-dashboard/
│   │       ├── ClientDashboardHeader.jsx ← header estratto da ClientDashboard.jsx (RX-07)
│   │       ├── AtletaTab.jsx             ← tab "Atleta": card riepilogo avatar+rank+XP (RX-07)
│   │       ├── clientDashboardIcons.jsx  ← icone tab/azioni estratte (RX-07)
│   │       ├── DeleteDialog.jsx
│   │       ├── NotesSection.jsx          ← thread note + commenti (trainer+client)
│   │       ├── GoalsSection.jsx          ← obiettivi (target percentile+scadenza): CRUD trainer, readonly atleta
│   │       ├── PlanProgress.jsx          ← avanzamento scheda (sessioni, giorno consigliato) — trainer + atleta
│   │       ├── WorkoutPlanSection.jsx    ← schede allenamento (trainer): CRUD + storico
│   │       ├── ClientWorkoutSection.jsx  ← scheda allenamento read-only (client)
│   │       ├── MisureSection.jsx         ← tab Misure: storico peso+altezza con trend inline
│   │       ├── WearableSection.jsx       ← tab Wearable: collega/sync Google Fit (vedi sezione dedicata)
│   │       ├── XPTrendChart.jsx          ← grafico XP accumulato Giorno/Settimana/Mese
│   │       ├── TrophiesSection.jsx       ← tab Trofei: badge auto+manuali, showcase (trainer+client)
│   │       └── ClientReportPrint.jsx     ← export PDF via window.print() (trainer)
│   │
│   ├── notification/
│   │   └── NotificationsPanel.jsx
│   │
│   ├── org/                 ← area org_admin
│   │   ├── OrgAdminView.jsx
│   │   └── org-pages/
│   │       ├── OrgDashboard.jsx
│   │       ├── MembersPage.jsx     ← limite piano: banner + blocco aggiungi
│   │       ├── OrgSettingsPage.jsx ← mostra il piano corrente (sola lettura, non un <select>)
│   │       │                         con i limiti; raggiunta solo dal bottone "IMPOSTAZIONI"
│   │       │                         del banner limite in MembersPage, nessuna voce di nav persistente
│   │       └── CreateMemberForm.jsx
│   │
│   └── trainer/             ← area trainer / staff_readonly
│       ├── TrainerView.jsx
│       ├── trainer.config.jsx
│       ├── ClientsPage.jsx
│       ├── GroupsPage.jsx
│       ├── TrainerCalendar.jsx
│       ├── RecurrencesPage.jsx    ← active default + archivio collassabile + paginazione
│       ├── NewClientView.jsx      ← blocco se al limite clienti del piano
│       ├── TestGuidePage.jsx
│       ├── ProfilePage.jsx        ← modifica email e password
│       ├── clients-page/
│       │   └── ClientCard.jsx        ← badge categoria (PT) / ruolo+fascia (Soccer)
│       ├── workout-plans/
│       │   └── WorkoutPlanForm.jsx   ← form multi-giorno creazione/modifica scheda
│       ├── groups-page/
│       │   ├── GroupCard.jsx
│       │   ├── GroupDetailView.jsx        ← orchestratore: stato + handler, JSX nei file sotto
│       │   ├── GroupDetailHeader.jsx      ← header hub gruppo estratto da GroupDetailView (RX-07)
│       │   ├── GroupManageTab.jsx         ← tab Gestione estratto da GroupDetailView (RX-07)
│       │   ├── groupDetailIcons.jsx       ← icone tab + config TABS estratte (RX-07)
│       │   ├── GroupLeaderboard.jsx       ← classifica ordinabile per media o stat, paginata
│       │   ├── GroupChampions.jsx         ← campioni per disciplina (griglia)
│       │   ├── GroupAnalysis.jsx          ← riepilogo + trend LineChart + heatmap + più migliorati
│       │   ├── GroupComparison.jsx        ← confronto 3 atleti: selettore paginato + radar SVG + tabella
│       │   ├── GroupNotes.jsx             ← note di gruppo: publish/delete, paginazione
│       │   ├── GroupSessionsPanel.jsx     ← tab Sessioni: slot del gruppo
│       │   ├── GroupReportPrint.jsx       ← export PDF gruppo via window.print()
│       │   ├── GroupsSidebar.jsx
│       │   └── GroupToggleDialog.jsx
│       ├── trainer-calendar/
│       │   ├── CalendarHeader.jsx    ← bottoni uniformati (entrambi filled)
│       │   ├── CalendarSidebar.jsx
│       │   ├── WeekView.jsx          ← bottone + dedicato per cella (RX-34, niente role="button" sulla cella)
│       │   ├── MonthView.jsx         ← idem
│       │   ├── DayView.jsx           ← idem
│       │   ├── SlotCard.jsx
│       │   ├── EventBlock.jsx
│       │   ├── SlotPopup.jsx
│       │   ├── CloseSessionModal.jsx
│       │   ├── AddSlotModal.jsx
│       │   └── RecurrenceModal.jsx
│       └── recurrences-page/
│           ├── RecurrenceCard.jsx
│           ├── RecurrenceDetailView.jsx      ← orchestratore: stato + handler
│           ├── RecurrenceDetailHeader.jsx    ← header giorni+orario (RX-42)
│           ├── RecurrenceSummaryBar.jsx      ← riga STATUS/PERIODO/CLIENTI (RX-42)
│           ├── RecurrenceScheduleSection.jsx ← sezioni Orario + Giorni (RX-42)
│           ├── RecurrencePeriodSection.jsx   ← sezione Periodo + estendi (RX-42)
│           ├── RecurrenceClientsSection.jsx  ← sezione Clienti + ricerca aggiungi (RX-42)
│           └── recurrenceDetailShared.jsx    ← costanti/helper condivisi (WEEK_DAYS, dateFmt, ActionRow, ecc.)
│
│   (wizard)
│   components/modals/new-client-wizard/
│       └── steps/StepRuolo.jsx  ← step ruolo per soccer_academy
│
├── firebase/
│   ├── config.js            ← initializeApp (App Check rimosso — vedi sezione Sicurezza)
│   ├── paths.js             ← path helpers subcollection
│   └── services/
│       ├── auth.js          ← changeTrainerPassword, changeUserEmail
│       │                       (verifyBeforeUpdateEmail — link verifica)
│       ├── calendar.js      ← tutte le fn accettano orgId come primo arg
│       ├── clients.js       ← solo letture (getClients, getClientById) + updateClient
│       │                       diretto per campi a basso rischio (peso/altezza, avatarId)
│       ├── db.js
│       ├── groups.js        ← tutte le fn accettano orgId come primo arg
│       ├── groupNotes.js    ← getGroupNotes, addGroupNote, deleteGroupNote (orgId, groupId)
│       ├── notifications.js ← tutte le fn accettano orgId come primo arg
│       ├── notes.js         ← getNotes (orgId, clientId) — scritture via usecases → aggiungiNota/eliminaNota
│       ├── goals.js         ← getGoals (orgId, clientId) — solo lettura, scrittura via usecases
│       ├── runbook.js       ← getRuns, saveRun — collection top-level qa_runs, scrittura
│       │                       diretta (unico ruolo ammesso è già super_admin, niente da cui difendersi)
│       ├── org.js           ← organizations (CRUD) + membri in sola lettura (getMembers,
│       │                       getMember) + updateMember diretto (solo cambio ruolo, nessun
│       │                       counter coinvolto). Creazione e rimozione membro passano
│       │                       SEMPRE da Cloud Function (creaMembroTeam / rimuoviMembroTeam
│       │                       via usecases/), anche quando l'attore è super_admin — la
│       │                       Cloud Function lo autorizza esplicitamente. Necessario per
│       │                       cancellare anche /users/{uid} + account Auth + memberCount,
│       │                       non solo il doc in members/ (bug reale fixato lug 2026:
│       │                       OrgDetailView.jsx faceva un deleteDoc diretto sul solo
│       │                       membro, lasciando l'account attivo e capace di accedere).
│       ├── workoutPlans.js  ← getWorkoutPlans, getWorkoutPlanForClient, addWorkoutPlan, update, delete (orgId)
│       ├── badges.js        ← awardBadge, revokeBadge, updateBadgeShowcase (orgId, clientId)
│       ├── wearable.js      ← enableWearable, disableWearable, fetchAndSaveWearableData (link client rimosso, vedi sezione dedicata)
│       └── users.js
│
├── usecases/                ← wrapper httpsCallable — SCRITTURE sensibili verso le Cloud
│   │                           Functions in functions/ (vedi sezione dedicata più sotto).
│   │                           34 file (ott 2026), stesso pattern minimale:
│   ├── createClientUseCase.js       ← creaCliente
│   ├── deleteClientUseCase.js       ← eliminaCliente
│   ├── createMemberUseCase.js       ← creaMembroTeam
│   ├── removeMemberUseCase.js       ← rimuoviMembroTeam
│   ├── updateMemberRoleUseCase.js   ← aggiornaRuoloMembro
│   ├── saveXPUseCase.js             ← salvaXP
│   ├── saveCampionamentoUseCase.js  ← salvaCampionamento (BE ricalcola i percentili
│   │                                   server-side dai valori grezzi; il testo del log
│   │                                   passa dal client perché richiede label/unit test)
│   ├── saveBiaUseCase.js            ← salvaBia
│   ├── upgradeProfileUseCase.js     ← aggiornaProfiloCliente
│   ├── addWorkoutPlanUseCase.js / updateWorkoutPlanUseCase.js / deleteWorkoutPlanUseCase.js
│   ├── addSlotUseCase.js / updateSlotUseCase.js / deleteSlotUseCase.js / skipSlotUseCase.js / closeSessionUseCase.js
│   ├── addRecurrenceUseCase.js / cancelRecurrenceUseCase.js / extendRecurrenceUseCase.js /
│   │   updateRecurrenceDaysUseCase.js / updateRecurrenceTimeUseCase.js /
│   │   addClientToRecurrenceUseCase.js / removeClientFromRecurrenceUseCase.js
│   ├── addGroupUseCase.js / updateGroupUseCase.js / deleteGroupUseCase.js
│   ├── addNoteUseCase.js / deleteNoteUseCase.js
│   ├── addGoalUseCase.js / cancelGoalUseCase.js   ← aggiungiObiettivo / annullaObiettivo
│   ├── purchaseAvatarUseCase.js      ← acquistaAvatar (spike EPIC-005, vedi Roadmap futura)
│   └── markNotificationReadUseCase.js / markAllNotificationsReadUseCase.js
│
├── hooks/
│   ├── useClientRank.js
│   ├── useClients.js           ← useClients(orgId, userId?)
│   ├── useGroups.js            ← useGroups(orgId)
│   ├── useNotifications.js     ← useNotifications(orgId, clientId)
│   ├── useNotes.js             ← useNotes(orgId, clientId, author) → threads
│   ├── useGoals.js             ← useGoals(orgId, clientId) → { goals, handleAddGoal, handleCancelGoal }
│   ├── useRunbook.js           ← useRunbook() → { runs, handleSaveRun } (super_admin)
│   ├── useBadges.js            ← useBadges(orgId, clientId, client) — lettura + manuale (auto: server)
│   ├── useClientExport.js      ← "Scarica i miei dati" dell'atleta (STORY-028) → utils/clientExport.js
│   ├── useWearable.js          ← useWearable (trainer, solo enable/disable/sync) — link client rimosso, vedi sezione dedicata
│   ├── useVersionCheck.js      ← rileva nuova build disponibile, mostra banner ricarica
│   ├── useFocusTrap.js         ← focus trap da tastiera per dialog/modal (Tab/Shift+Tab)
│   ├── usePagination.js
│   ├── useSessionTimeout.js    ← logout automatico per inattività
│   └── useToast.js
│
└── utils/
    ├── auditLog.js          ← auditLog(action, details?) + AUDIT_ACTIONS
    ├── bia.js               ← getBiaParamStatus, calcBmi,
    │                           calcBiaXP, calcBiaScore
    ├── calendarUtils.js     ← utility date/slot helpers
    ├── env.js               ← ENV, isDev, isProduction, isAdminDomain()
    ├── firebaseErrors.js
    ├── gamification.js      ← calcSessionXP, buildXPUpdate, buildSessionUpdate,
    │                           buildCampionamentoUpdate, buildNewClient,
    │                           buildBiaUpdate, buildProfileUpgrade — speculare a
    │                           functions/src/shared/gamification.js (vedi sezione Backend)
    ├── percentile.js        ← calcPercentileEx(stat, val, sex, age, testKey?) → { value, outOfRange }
    │                           calcStatMedia
    ├── tables.js            ← TABLES (dati grezzi percentili)
    │                           getAgeGroup(testKey, age) → string|null
    │                           getAgeGroupClamped(testKey, age, sex) → { group, outOfRange }
    ├── goals.js             ← isGoalMissed, getGoalDisplayStatus — 'missed' calcolato
    │                           al volo, non salvato (vedi sezione "Obiettivo")
    └── validation.js
```

---

## Backend — Cloud Functions callable (`functions/`)

Pacchetto Node **separato** alla radice del repo (proprio `package.json`, proprio
`node_modules`, nessun import da `src/`, deploy indipendente da hosting/rules). Gestisce
la maggior parte delle scritture sensibili dell'app tramite il layer `usecases/` visto
sopra — 36 callable (ott 2026), una per operazione.

```
functions/
├── src/
│   ├── index.js         ← esporta tutte le callable (region europe-west1)
│   ├── callable/        ← 36 funzioni onCall — una per operazione:
│   │                       creaCliente, eliminaCliente, creaMembroTeam,
│   │                       rimuoviMembroTeam, aggiornaRuoloMembro, salvaXP,
│   │                       salvaCampionamento, salvaBia, aggiornaProfiloCliente,
│   │                       chiudiSessione, saltaSlot, aggiungi/aggiorna/elimina
│   │                       Slot/Gruppo/Nota/SchedaAllenamento/Ricorrenza,
│   │                       aggiungiObiettivo/annullaObiettivo, ecc.
│   ├── shared/           ← copie server-side minimali di logica src/, SENZA
│   │                        dipendenze browser:
│   │   ├── auth.js          ← requireAuth / requireRole / requireOrgAccess /
│   │   │                       requireOrgAdmin / requireOrgMemberOrClient
│   │   ├── plans.js         ← speculare a src/config/plans.config.js —
│   │   │                       isAtTrainerLimit/isAtClientLimit. Necessario perché
│   │   │                       firestore.rules NON protegge le callable: l'Admin
│   │   │                       SDK le bypassa sempre
│   │   ├── gamification.js  ← speculare a src/utils/gamification.js (XP, rank,
│   │   │                       livello — vedi nota divergenze sotto)
│   │   ├── constants.js     ← speculare a src/constants/index.js (RANKS,
│   │   │                       LOG_MAX_ENTRIES, XP_PER_LEVEL_MULTIPLIER...)
│   │   ├── testsMeta.js     ← speculare a src/constants/tests.js MA volutamente
│   │   │                       minimale: solo key/stat/direction/ageGroup/
│   │   │                       categories/variables — NIENTE label/unit/guide
│   │   │                       (non servono al calcolo percentili server-side)
│   │   ├── percentile.js / tables.js / bia.js / formulas.js / calendarUtils.js
│   │   └── avatarUnlocks.js  ← speculare a src/config/avatars.config.js (solo le
│   │                            regole di sblocco — spike EPIC-005)
│   └── triggers/         ← Cloud Functions non-callable (trigger su eventi)
```

## Calcolo percentili — nota tecnica

### API principale

`calcPercentileEx(stat, value, sex, age, testKey?)` in `utils/percentile.js`
è la funzione principale. Restituisce `{ value: number|null, outOfRange: boolean }`:
- `value` è il percentile (0–100) o `null` se test/tabella inesistente.
- `outOfRange: true` indica che l'età era fuori dalla fascia normativa e si è
  usata la fascia più vicina (via `getAgeGroupClamped`).

`calcPercentile(...)` — wrapper backward-compat che restituiva solo `.value` —
**rimosso (set 2026, EPIC-002/STORY-003)**: era candidato alla rimozione da lug 2026
(verificato senza consumer applicativi, solo `percentile.test.js` lo usava), ora
eliminato insieme al describe block di test dedicato. Chiamare sempre
`calcPercentileEx(...).value` se serve solo il numero.

`getAgeGroupClamped(testKey, age, sex)` in `utils/tables.js`:
- Se l'età rientra in una fascia → `{ group, outOfRange: false }`
- Se l'età è fuori range → trova la fascia con il `lo` più vicino →
  `{ group: 'fascia-più-vicina', outOfRange: true }`
- Restituisce `{ group: null, outOfRange: false }` solo se non esiste
  nessuna tabella per quel test/sesso.

**Comportamento per età fuori fascia:**
Invece di restituire `null` (e quindi ignorare il test), il sistema stima il
percentile dalla fascia normativa più vicina e segnala l'anomalia.
La segnalazione visiva (`ageWarning`) compare in `TestInput` come banner ambra.

### Regola d'uso in useCampionamento.js
Usare `calcPercentileEx` (non `calcPercentile`) per ottenere `outOfRange`.
Passare sempre `test.key` come quinto argomento.
Il hook espone `ageWarnings: { [stat]: boolean }` derivato da `liveResults`.

### testKey — risoluzione ambiguità stat
Il quinto parametro `testKey` risolve l'ambiguità quando due test
diversi condividono lo stesso `stat`. Il caso più ampio è `stat:'resistenza'`,
condiviso da **cinque** test: `ymca_step_test`, `yo_yo_ir1`, `shuttle_run_30m`,
`six_minute_run`, `beep_test` — ciascuno con tabelle percentili proprie.
Passare sempre `test.key` come quinto argomento in `useCampionamento.js`.

---

## Design system

### Background brand (CSS-only)
Il background globale è definito su `html` in `src/index.css` — nessuna immagine esterna.
Layer in ordine (dal basso all'alto):
```
1. Base color           #07090e
2. Vignette perimetrale radial-gradient scuro ai bordi
3. Green glow           bordo sinistro — rgba(15,214,90,0.20) — luce ambientale logo
4. Cyan trace           angolo top-right — rgba(0,200,255,0.10) — fulmine elettrico
5. Pentagon pattern     SVG tile 120×116px — stroke ciano 0.07 opacity
6. Rectangular grid     linear-gradient orizzontale + verticale — 40×40px, 0.028 opacity
```
`body` e `#root` hanno `background: transparent` per lasciar vedere il layer html.
La sidebar usa `bg-black/50 backdrop-blur-md` per effetto frosted glass sulla texture.

### Font
```
font-display → Montserrat (titoli, label, bottoni, numeri grandi)
font-body    → Inter (testo corrente, descrizioni)
```
Serviti dall'app, **non** da Google Fonts (ott 2026, STORY-022 — Google riceveva l'IP di
chi apriva l'app, in contrasto con informativa privacy e DPA): `src/fonts.css`, importato in
`main.jsx`, dichiara le famiglie `Montserrat`/`Inter` sui file variabili dei pacchetti
`@fontsource-variable/*` (Vite li copia in `dist/assets`). Stessi nomi di famiglia di prima,
quindi gli stili inline esistenti non cambiano. Non reintrodurre `@import` da
`fonts.googleapis.com`: la CSP in `firebase.json` non lo permette più.

### Elevation — 5 livelli
```
L0 bg-base     #07090e  → background puro
L1 bg-surface  #0c1219  → surface principale + border
L2 bg-raised   #0f1820  → card elevata + shadow
L3 bg-overlay  #131e2a  → modal/overlay + shadow forte
L4 bg-float    #1a2638  → tooltip/dropdown
```

### Colori brand (dal logo)
```
Verde neon:   #1dff6b   → bordi luminosi della R
Verde corpo:  #0ec452   → colore primario UI
Verde scuro:  #085c28   → ombre
Ciano:        #2ecfff   → fulmine elettrico
Ciano bright: #5dd4ff   → alone
Blu:          #1a7fd4   → freccia X
Rosso admin:  #f87171   → accent area super_admin
```

### Select / dropdown — regola CSS
Gli elementi `<select>` devono usare `.input-base` **e** avere
esplicitamente `color` e `background` impostati per garantire
la leggibilità su tutti i browser (i browser applicano stili
nativi bianchi/grigi di default):
```css
/* Pattern corretto */
.input-base {
  color: var(--text-primary);
  background: var(--bg-surface);
}
/* Anche le option devono ereditare il colore */
select.input-base option {
  background: var(--bg-overlay);
  color: var(--text-primary);
}
```

### Classi CSS globali
**Verificate contro `src/index.css` (lug 2026)** — la lista precedente elencava classi
(`.card`, `.card-interactive`, `.card-green`, `.btn`/`.btn-primary`/`.btn-ghost`,
`.badge`/`.badge-green`, `.type-display/label/caption`, `.animate-fade-up`, `.stagger`,
`.skeleton`, `.text-gradient`) che **non sono mai esistite** nel CSS reale — un caso
(`.skeleton`, usata in `GroupSessionsPanel.jsx`/`GroupNotes.jsx`) ha causato un bug reale
di placeholder di caricamento invisibili, fixato lug 2026. Le varianti di `Card`/`Button`/
`Badge` in `components/ui/index.jsx` sono gestite via prop JS + style inline, non via classi.
```
.rx-card                        → card base con elevation + hover glow
.rx-btn-primary                 → bottone gradiente/outline verde
.rx-badge                       → badge rank (font-display, 10px, tracking largo)
.input-base (+ .input-compact)  → input standard con focus verde
.rx-hex-bg / .bg-hex            → pattern esagonale decorativo (usato in BrandingPanel)
.rx-grid-bg                     → griglia dati decorativa
.rx-glow-text                   → testo con gradiente logo
.rx-animate-in                  → animazione entrata (fade + translateY)
.no-scrollbar                   → nasconde la scrollbar orizzontale
.toast-in                       → animazione slide-in del Toast
.skip-to-content                → link accessibilità "vai al contenuto"
```

### Token principali (CSS variables)
Definiti in `src/index.css` (`:root`), sovrascritti per tema da `config/themes.config.js`:
```
--rx-bg, --rx-surface, --rx-surface-alt, --rx-card-bg, --rx-nav-bg
--rx-accent, --rx-accent-bright, --rx-accent-dark, --rx-accent-glow
--rx-accent-2, --rx-accent-2-glow
--rx-text, --rx-text-muted, --rx-border
--rx-gradient, --rx-gradient-accent, --rx-gradient-accent-2
```
Le var `--bg-base/surface/raised/overlay`, `--border-subtle/default/strong/focus`,
`--text-primary/secondary/tertiary`, `--green-400`/`--cyan-400`/`--gradient-primary`,
`--shadow-md/lg/green/cyan`, `--duration-*`, `--ease-*`, `--radius-sm/lg/xl/2xl` **non
esistono** nel CSS — sono la nomenclatura di `design/tokens.js`, il design system dichiarato
ma mai importato da alcun componente (vedi "File critici" più sotto).

**Naming `--rx-accent`/`--rx-accent-2` (rinominate da `--rx-green`/`--rx-cyan`, lug 2026):**
i nomi sono deliberatamente neutri, non legati a un colore letterale — ogni tema in
`themes.config.js` riassegna questi slot a hue completamente diverse (es. tema Carbon:
`--rx-accent` = arancio, `--rx-accent-2` = rosso; tema Midnight: blu/indigo). Prima del
rename si chiamavano `--rx-green`/`--rx-cyan`, e nel tema di default "rankex" i valori
erano di fatto invertiti rispetto al nome (`--rx-green` conteneva il ciano del logo)
perché il nome letterale non aveva mai davvero corrisposto al ruolo di "slot tema
riassegnabile" che la variabile ricopre in tutti gli altri 6 temi.

**`--rx-blue`/`--rx-metal`/`--rx-metal-dark` — rimosse (audit lug 2026, P3.16/P3.17):**
a differenza di `--rx-green`/`--rx-cyan` pre-rename, queste tre erano definite in
`index.css` e remappate nei 7 temi ma **zero componenti le consumavano** (confermato via
grep, nessun `var(--rx-blue)` nel codice) — non uno slot-accent generico come `--rx-green`
era, semplicemente codice morto. Rimosse da `:root`, `@theme` e tutti e 7 i temi in
`themes.config.js`. Stessa sorte per le classi `.rx-text-green/cyan`, `.rx-glow-green/cyan`,
`.rx-pulse-green/cyan` in `index.css` (e i relativi `@keyframes`) — anche queste mai
referenziate da alcun `className` nel JSX, rimosse.

---

### Tabelle percentili soccer — stato e fonti (verificato set 2026)

#### Test Senior (14+) e condivisi — da fonte normativa
Tabelle in `utils/tables.js`. **Rollback già applicato** (era segnalato "in attesa di
approvazione" fino a mag 2026 — sezione non aggiornata dopo il merge, corretta ora):
tre passate di calibrazione contro `rankex-tabelle-percentili-v2.xlsx` —
`5273967` (25/04, sprint_20m + standing_long_jump + 505_cod_agility), `2fa9f4b` (10/05,
sprint_20m + y_balance + 505_cod_agility), `0de30a6` (01/07, standing_long_jump +
sprint_20m + t_test_mini) — tutte già in `dev`. Copia server
`functions/src/shared/tables.js` **verificata identica** ai 4 test (creata il 04/07,
dopo l'ultima calibrazione, quindi mai stata disallineata — a differenza del rischio
generico descritto in "Copie speculari").

| Test               | Min età | Fasce                           | Fonte dati                                         | Stato in tables.js     |
|--------------------|---------|----------------------------------|----------------------------------------------------|------------------------|
| `y_balance`        | 10      | 10-11, 12-13, 14-15, 16-17, adulti | Excel di riferimento (calibrato 10/05)          | ✓ allineato, client=server |
| `standing_long_jump`| 9      | 7-17 annuali + 18-35/36-50 adulti | Excel di riferimento (calibrato 25/04 + 01/07)    | ✓ allineato, client=server |
| `sprint_20m`       | 8       | per-year youth + 18-35/36-50    | Excel di riferimento (calibrato 3 volte, ultima 01/07) | ✓ allineato, client=server |
| `505_cod_agility`  | 10      | 10-11 → 36-50                   | Excel di riferimento (calibrato 10/05)             | ✓ allineato, client=server |
| `beep_test`        | 8       | 8-9 → 36-50                     | LeBlanc & Tomkinson 2016 (mai serviva calibrazione) | ✓ identico all'Excel   |

#### Test Pulcini (7-9) e Esordienti (10-13) — stime interne
Nessuna norma pubblicata disponibile per queste fasce/test.
I valori sono stime interne calibrate sui dati VDP5 — NON sono norme validate.
Il banner ambra di avviso (`outOfRange: true`) appare automaticamente in campionamento.

| Test                  | Fascia   | Note                                          |
|-----------------------|----------|-----------------------------------------------|
| `single_leg_stance`   | 7-9      | nessuna fonte normativa per questa età        |
| `sprint_10m`          | 7-9      | stima interna                                 |
| `shuttle_run_30m`     | 7-9      | calibrata su dati VDP5                        |
| `t_test_mini`         | 7-9      | nessuna fonte normativa per questa età        |
| `y_balance_anterior`  | 10-13    | adattamento Gribble 2012 non validato         |
| `t_test_soccer_junior`| 10-13    | calibrata su dati VDP5                        |
| `six_minute_run`      | 10-13    | Cooper generico non specifico per soccer      |

**Regola ageGroup per test soccer:**
```js
y_balance:          age < 10 → null | 10-11 | 12-13 | 14-15 | 16-17 | 18-40 | 41-60
standing_long_jump: age < 7  → null | 7-9 (stima) | 10-11 | 12-13 | 14-15 | 16-17 | 18-35 | 36-50
sprint_20m:         age < 8  → null | 8-9 | 10-11 | 12-13 | 14-15 | 16-17 | 18-35 | 36-50
505_cod_agility:    age < 10 → null | 10-11 | 12-13 | 14-15 | 16-17 | 18-35 | 36-50
beep_test:          age < 8  → null | 8-9 | 10-11 | 12-13 | 14-15 | 16-17 | 18-35 | 36-50
single_leg_stance:  age < 7  → null | 7-9
sprint_10m:         age < 7  → null | 7-9 (stima) | 18-35 | 36-50 (adulti)
shuttle_run_30m:    age < 7  → null | 7-9
t_test_mini:        age < 7  → null | 7-9
y_balance_anterior: age < 10 → null | 10-13
t_test_soccer_junior:age < 10→ null | 10-13
six_minute_run:     age < 10 → null | 10-13
```

**Documento di riferimento:** `rankex-tabelle-percentili-v2.xlsx` (non tracciato in git, desktop locale)
Codice colore: 🟢 verde = verificato · 🔴 rosso = da rollback · 🟡 ambra = stima interna

## Gamification

```js
XP_PER_LEVEL_MULTIPLIER = 1.08      // era 1.3 — ridotto per curva raggiungibile
// xpNext partenza = 500 (era 700) — NEW_CLIENT_DEFAULTS in functions/src/callable/creaCliente.js

// Streak sessioni — cap aumentato a streak 10 = ×2.0 (era streak 5 = ×1.5)
calcSessionXP(baseXP, streak)
  → round(baseXP × (1 + min(streak × 0.1, 1.0)))

// LOG_MAX_ENTRIES = 200 — client (constants/index.js) e server
// (functions/src/shared/constants.js) allineati lug 2026 (erano 20/200 — il client
// troncava lo storico locale prima che il refetch lo correggesse). Governa quante
// entry di client.log[] sopravvivono, usate da ActivityLog e XPTrendChart.

// XP Campionamento — tier per numero di stat percentili migliorate
// (stesso schema BIA per coerenza)
XP_CAMPIONAMENTO = {
  FIRST:   50,   // primo campionamento (nessun storico)
  NONE:    10,   // 0 stat migliorate
  PARTIAL: 30,   // 1 stat migliorata
  MOST:    60,   // 2–3 stat migliorate
  ALL:    100,   // 4+ stat migliorate
}

// XP BIA — tier per numero di parametri chiave migliorati
// Parametri chiave: fatMassPercent↓, muscleMassKg↑, waterPercent↑, visceralFat↓
XP_BIA = {
  FIRST_MEASUREMENT: 50,    // era 100
  ALL:              100,    // tutti e 4 i parametri chiave migliorati
  MOST:              60,    // 2–3 parametri chiave migliorati
  PARTIAL:           30,    // 1 parametro chiave migliorato
  NONE:              10,    // 0 parametri chiave migliorati (era REGRESSION: 0)
}
```

**Curva livelli con i nuovi parametri:**
- Lv.1→10: ~5 mesi (3 sess/sett, streak ~3)
- Lv.10→20: ~14 mesi
- Lv.20→30: ~25 mesi
- **Totale Lv.30: ~3.5–4 anni** (vs ~335 anni con il vecchio 1.3×)

Il rank dipende SOLO dai test atletici — mai dalla BIA.

---

## BIA — Bioimpedenziometria

### Profili cliente (solo personal_training)
```
tests_only → solo test, ha rank
bia_only   → solo BIA, no rank
complete   → test + BIA, rank solo da test
```
Soccer academy: solo `tests_only`. BIA non supportata.

### Upgrade categoria
```
tests_only → complete:
  mantiene stats/campionamenti, azzera biaHistory

bia_only → complete:
  mantiene biaHistory, azzera stats/campionamenti
```

### Parametri BIA
```
fatMassPercent  direction: inverse  (meno è meglio)
muscleMassKg    direction: direct
waterPercent    direction: direct
boneMassKg      direction: direct
bmi             direction: neutral  computed: true
bmrKcal         direction: neutral
metabolicAge    direction: inverse
visceralFat     direction: inverse  (scala 1-12)
```

---

## Wearable — Google Fit

Feature parzialmente disattivata (audit lug 2026, RX-62): il collegamento lato cliente
non è mai stato raggiungibile in produzione dal redesign Pentagon Nav di giugno 2026
(nessun entry point client montava `useClientWearable`). Rimossi come codice morto:
`useClientWearable` (hook), `linkGoogleFit` / `resolveGoogleFitRedirect` / `unlinkWearable`
(service) — nessuna sostituzione, solo eliminazione.

Stato attuale: `WearableSection.jsx` (solo vista trainer, `ClientDashboard.jsx`) mostra
"Collegamento Wearable non disponibile al momento" — il bottone ABILITA è nascosto,
resta solo DISABILITA per eventuali client già abilitati in precedenza. Nessun modo,
oggi, di collegare un account Google Fit reale.

```
Trainer  → può solo disabilitare il tracking per un cliente già abilitato in passato
Cliente  → nessuna azione disponibile (entry point rimosso)
```

**Se si reintroduce la feature**: serve un nuovo entry point client (es. Profilo) che
richiami un flusso di link equivalente a quello rimosso, **e** va risolto RX-63 (il
campo `client.wearable.accessToken` è leggibile da qualunque membro dell'org, incluso
`staff_readonly`, per mancanza di filtro di ruolo in `firestore.rules` — richiede
spostare il token in una subcollection con regole più strette prima di tornare a
scriverlo).

**Verifica dati legacy (set 2026, `scripts/check-wearable-tokens.mjs`):** 0 client con
`accessToken` residuo su **entrambi** gli ambienti (32 client/4 org su `rankex-dev`, 16
client/2 org su `fitquest-60a09`) — coerente col fatto che `linkGoogleFit` (l'unica
funzione che scriveva il token) è già stata rimossa: nessun codice attuale può popolare
`accessToken`, quindi nessuna esposizione live oggi. RX-63 resta comunque da risolvere
**prima** di tornare a scrivere il campo, non prima di adesso — nessuna azione urgente
richiesta finché la feature resta disattivata.

**Dati sincronizzati** (`client.wearable`, solo per client abilitati prima della rimozione):
```js
{
  provider:    'google_fit',
  linkedAt, lastSync,
  accessToken,
  lastData: {
    steps30d, stepsAvg30d, stepsAvg7d,
    activeMins30d, activeMinsAvg30d, activeMinsAvg7d,
    calories30d, caloriesAvg30d, caloriesAvg7d,   // best-effort, .catch(() => null)
    syncedAt,
  },
}
```
Sync via Google Fitness REST API (`fitness.googleapis.com/.../dataset:aggregate`,
`firebase/services/wearable.js`), 30 giorni di storico, aggregati anche a 7 giorni —
la funzione resta per eventuale riattivazione ma non è più raggiungibile da nessun
flusso UI dato che nessun nuovo `accessToken` può più essere generato.

---

## Runbook manuale (QA)

Sostituisce `docs/test-plan.md` (superseded, set 2026 — vedi nota in cima al file).
I casi manuali che nessun unit test copre (flussi UI, Auth/Firestore, ruoli, PDF)
vivono ora in `config/runbook.config.js` — `RUNBOOK_SUITES`: array di suite, ognuna
con `cases[]` (id TP-XXX, severità `blocker`/`important`/`nice`, precondizioni, passi,
risultato atteso). È **config**, non un database — nessuna scrittura, coerente col
principio "Config → dati statici, nessuna logica".

**Esecuzione tracciata in Firestore**, non più una tabella markdown mai compilata:
`qa_runs/{runId}` (top-level, come `audit_logs` — non è dato di un'org). Un "giro"
copre una o più suite scelte al momento, con un risultato (`pass`/`fail`/`skip` +
nota opzionale) per ogni caso coperto. Solo `super_admin` legge/scrive — a differenza
di note/obiettivi non passa da una Cloud Function: è l'unico ruolo già più fidato
dell'app, non c'è nessuno da cui difendersi con l'ulteriore livello.

UI: `admin-pages/RunbookPage.jsx` (nav "Runbook" in `AdminShell`) — scegli le suite,
compila la checklist caso per caso, salva il giro; sotto, lo storico dei giri passati
con contatori pass/fail/skip ed espansione per vedere note sui fallimenti.

**Quando aggiungere un test case:** ogni nuova feature che tocca UI/Auth/Firestore in
un modo non coperto da unit test dovrebbe aggiungere un caso in `runbook.config.js`
nella suite pertinente (o crearne una nuova) — stessa disciplina di aggiungere un test
Vitest per la logica pura. Non lasciare che il runbook derivi di nuovo dal codice reale
com'è successo a `test-plan.md`.

---

## Calendario

```
Vista default: settimana
Viste: month | week | day

handleCloseSlot(slotId, attendeeIds, clientsData)
  → XP solo agli attendees
  → notifica agli absentees

handleSkipSlot(slotId)
  → status: 'skipped', nessun XP

Ricorrenza come entità di primo livello:
  status: 'active' | 'ended' | 'cancelled'
  modifica orario → aggiorna slot futuri
  cancella → elimina slot futuri
  clientIds sync con slot futuri via addClientToRecurrence
```

### Sync gruppo/calendario
```
Toggle cliente in gruppo →
  GroupToggleDialog mostra preview (slot futuri + ricorrenze)
  Conferma →
    1. aggiorna group.clientIds
    2. aggiorna slot futuri non ricorrenti
    3. aggiorna ricorrenze attive + loro slot futuri
  Slot passati → invariati
```

---

### Note/commenti per un cliente
Struttura: `clients/{clientId}/notes/{noteId}` (subcollection del cliente).
- Service: `firebase/services/notes.js`
- Hook: `useNotes(orgId, clientId, { role, name })` in `hooks/useNotes.js`
- UI trainer: `NotesSection` già integrata in `ClientDashboard`
- UI client: `NotesSection` già integrata in `ClientDashboardPage`
- Rules: `firestore.rules` — il client è in sola lettura; scrivono solo trainer/org_admin via `aggiungiNota`

### Obiettivo
Struttura: `clients/{clientId}/goals/{goalId}` (subcollection del cliente).
- Service: `firebase/services/goals.js` (`getGoals`, sola lettura)
- Usecases: `addGoalUseCase.js` (→ `aggiungiObiettivo`), `cancelGoalUseCase.js` (→ `annullaObiettivo`)
- Hook: `useGoals(orgId, clientId)` in `hooks/useGoals.js`
- UI trainer: `GoalsSection` integrata in `ClientDashboard` (tab OBIETTIVI)
- UI client: hub → Test → sotto-tab "Obiettivi" (`ClientDashboardPage.jsx`), stessa
  `GoalsSection` in `readonly` (ott 2026)
- Achievement: mai lato client — rilevato server-side in `salvaCampionamento.js`
  confrontando il percentile appena calcolato con `targetPercentile`
- Rules: `firestore.rules` — create/update solo `canWrite(orgId)` (trainer/org_admin),
  read anche `isOwnClient`, delete sempre `false` (si annulla via update di stato,
  mai si cancella — mantiene lo storico)

### Scheda allenamento
Struttura: `organizations/{orgId}/workoutPlans/{planId}`.
- Service: `firebase/services/workoutPlans.js`
  - `getClientPlans(orgId, clientId)` — tutte le schede di un cliente (attive + archiviate)
  - `getWorkoutPlanForClient(orgId, clientId)` — scheda attiva per il client (filtra per clientId)
  - `addWorkoutPlan / updateWorkoutPlan / deleteWorkoutPlan` — CRUD
- UI trainer: `WorkoutPlanSection` in `client-dashboard/` — embed in `ClientDashboard`
  - Crea/modifica/archivia/elimina schede direttamente dalla dashboard cliente
  - Usa `WorkoutPlanForm` con `clientId` pre-impostato
  - Storico collassabile delle schede archiviate
  - Crea nuova → archivia automaticamente la scheda attiva corrente
- UI client: `ClientWorkoutSection` in `client-dashboard/` (read-only, scheda attiva con tab giorni)
- Schema dati: `days: [{ label, exercises[] }]` — max 7 giorni, backward compat con `exercises[]` flat
- Rules: `allow read: if canRead(orgId) || (isClientOfOrg(orgId) && resource.data.clientId == userProfile().clientId)`.
  Funziona anche sulle query perché il client filtra già per `clientId` (`getClientPlans`):
  una query senza quel filtro viene rifiutata. Fino a ott 2026 la regola era
  `canRead || isClientOfOrg` con la motivazione (errata) che il vincolo non fosse
  valutabile sulle query: ogni cliente leggeva le schede di tutta l'org.

### Dashboard cliente — layout (riverificato lug 2026 — la doc apr 2026 era obsoleta)

**`ClientDashboard.jsx` (vista trainer) e `ClientDashboardPage.jsx` (vista client) NON condividono
più lo stesso pattern** — sono divergute dopo due redesign successivi (RX-07 decomposizione apr 2026,
poi Pentagon Nav giu 2026). Non esiste più `AvatarPlaceholder`, non esiste più il layout 2 colonne
con `aside` sticky, non esiste più `mobileOnly`/`window.innerWidth < 1024`.

**Vista trainer** (`ClientDashboard.jsx` + `ClientDashboardHeader.jsx`, colonna unica):
- Header unico: back button + tab bar orizzontale scrollabile (`overflow-x-auto`) + menu
  overflow "⋮" (Esporta PDF / Reset password / Elimina)
- Tab: `atleta` (AtletaTab.jsx — card riepilogo avatar+rank+XP, non più un aside persistente),
  `test` (solo se `hasTests`), `bia`, `allenamento`, `calendario`, `note`, `attivita`, `misure`,
  `wearable`, `trofei` — tutte sempre visibili/scrollabili, nessuna nascosta per breakpoint

**Vista client** (`ClientDashboardPage.jsx` — Pentagon Navigation Hub, giu 2026):
- `ClientHub.jsx` sostituisce la vecchia `ClientCircularNav` — 5 sezioni sui vertici di un
  pentagono (Test in cima, poi in senso orario: Trofei, Calendario, Scheda, Profilo), avatar
  al centro non cliccabile. Formula vertici: `(90 - i*72) * PI/180`
- `ClientBottomNav.jsx`: mobile = barra fissa bottom 62px; desktop = barra sticky top 52px
  (solo quando non si è nella home/hub)
- `activeTab` default `'home'` (hub); `testTab` per Fisici/BIA; `profiloTab` per
  Avatar/Note/Attività/Misure/Tema/Account (BIA è sub-tab di Test, non più di Profilo;
  Wearable rimossa da qui — resta nella vista trainer)
- Sistema temi: `ThemeContext.jsx` + `config/themes.config.js`, 7 temi (RankEX, Midnight,
  Carbon, Violet, Steel, Phantom, Mint), persistenza `localStorage['rankex-theme']`,
  applicati via CSS custom properties `--rx-*`. `ThemePicker.jsx` in Profilo > Tema
  (client), ProfilePage.jsx (trainer), AdminProfilePage.jsx (super_admin).
  `ThemeDevPanel.jsx` — overlay solo dev, toggle `Ctrl+Shift+T`, nessun bottone flottante
- Dettagli completi: vedi memoria `project_client_pentagon_theme`

**XPBar** — usare `fullWidth` nelle dashboard + `self-stretch` sul wrapper per larghezza piena:
```jsx
<div className="mt-5 self-stretch">
  <XPBar xp={xp} xpNext={xpNext} color={color} fullWidth />
</div>
```

### Tab Misure e XP Trend (client dashboard — apr 2026)
- **Tab Misure**: `MisureSection.jsx` + `useMisure.js` — storico peso e altezza del cliente con trend inline
  - `useMisure(orgId, clientId)` → `{ misure, handleUpdateMisure }` — salva su `clients/{clientId}.misure[]`
- **XPTrendChart**: `XPTrendChart.jsx` — grafico XP accumulato per Giorno/Settimana/Mese
  - Legge `client.log[]` (ogni entry ha `ts: Date.now()` da `gamification.js`)
  - Il backfill `ts` sui log pre-apr 2026 è già stato eseguito in produzione

### Export PDF atleta
- Componente: `ClientReportPrint.jsx` in `client-dashboard/`
- Trigger: pulsante "ESPORTA PDF" in `DashboardHeader` (prop `onExport`)
- Tecnica: `window.print()` con `@media print` CSS iniettato in `document.head`
  che nasconde tutto tranne `#rankex-print-root` durante la stampa
- Zero dipendenze aggiuntive — il browser genera il PDF nativamente
- Contenuto: anagrafica, status test con delta, BIA (se presente), storico campionamenti (ultimi 5)
- Gestisce sia modulo PT che soccer (categoria/ruolo differenziati)

## Sicurezza

### Hardening implementato (apr 2026)

**Firestore Rules:**
- `memberRole()` null-safe — ritorna `null` se il documento membro non esiste
- `isOrgAdminForMember()` valida il valore del nuovo `role` (solo `org_admin`, `trainer`, `staff_readonly` — impedisce escalation a `super_admin`)
- `mustChangePassword` scrivibile dal client solo con valore `false` (non può reimpostarlo a `true`)
- `memberCount` / `clientCount` non scrivibili dal client (ott 2026 — prima ±1 ripetibile, aggirava i limiti piano)
- Creazione `users` / `clients` / `members` e create/delete `organizations` solo super_admin (ott 2026)
- `rimuoviMembroTeam` verifica che l'uid sia membro dell'org del chiamante (ott 2026 — prima cancellava qualsiasi account)

**Auth & Session:**
- `ChangePasswordScreen` richiede re-auth con password temporanea prima di `updatePassword`
- Session timeout client: 24 ore (era 7 giorni)
- Audit log su: login, logout, creazione/eliminazione cliente, cambio password, cambio email, cambio ruolo membro, rimozione membro

**Password policy** (`utils/validation.js`):
```
validatePassword → minimo 8 caratteri + almeno 1 numero + almeno 1 lettera maiuscola
```

**HTTP Security Headers** (entrambi i target Firebase Hosting):
```
Content-Security-Policy   → script 'self', style 'unsafe-inline', connect Firebase/Google
X-Frame-Options           → DENY
X-Content-Type-Options    → nosniff
Referrer-Policy           → strict-origin-when-cross-origin
Permissions-Policy        → camera=(), microphone=(), geolocation=()
```

**App Check — RIMOSSO (mag 2026):**
- Il codice (`ReCaptchaV3Provider`, `initializeAppCheck`) è stato eliminato da `firebase/config.js`
- Enforcement disattivato anche lato Firebase Console (era in Monitoring mode, mai Enforced)
- Motivo: RankEX è una SaaS chiusa con Auth + Firestore Rules solide — App Check aggiungeva
  complessità senza beneficio reale, e la CSP bloccava gli script reCAPTCHA causando loop di login
- Nessuna variabile `VITE_RECAPTCHA_SITE_KEY` richiesta — non esiste più in `.env.example`
- Domini autorizzati Firebase Auth restano configurati manualmente in Console
  (`rankex-app.web.app`, `rankex-admin.web.app`)
- `isAdminDomain()` in `utils/env.js` riconosce **3** hostname admin, non solo quello di
  hosting Firebase: `ADMIN_HOSTNAMES = ['admin.rankex.app', 'admin-uat.rankex.app',
  'rankex-admin.web.app']` — i primi due sono un dominio custom (prod) e uno UAT, oltre
  al dominio Firebase diretto. In development (`isDev`) `isAdminDomain()` ritorna sempre
  `false`, nessuna separazione locale.

**Limitazioni note (strutturali — richiedono backend):**
- Session timeout solo client-side (Firebase puro frontend)
- `signOut()` non revoca il refresh token server-side (~1h residua)

---

### File .env
```
.env.development  → VITE_ENV=development, credenziali rankex-dev
.env.production   → VITE_ENV=production,  credenziali fitquest-60a09
```
Entrambi gitignored. Template: `.env.example`.

`VITE_GOOGLE_FIT_CLIENT_ID` — **rimossa da `.env.example` (set 2026, EPIC-002/STORY-004)**:
non era letta da nessun file sorgente, confermato senza flusso OAuth diretto pianificato
che la usi. La feature Wearable/Google Fit (vedi sotto) autentica comunque tramite
`GoogleAuthProvider` di Firebase Auth, non un client ID separato.

`VITE_FIREBASE_MEASUREMENT_ID` — **rimossa (ott 2026, STORY-027)** da `.env.example`,
`firebase/config.js` e dai tre workflow: Analytics non è mai stato usato. Se si
reintroduce, serve prima un banner di consenso cookie. I secret GitHub
`VITE_FIREBASE_MEASUREMENT_ID(_DEV)` non sono più letti e si possono cancellare.

### Hosting Firebase — multisito
```
rankex-app.web.app    → trainer, org_admin, client, staff_readonly
rankex-admin.web.app  → solo super_admin
```
Configurato in `firebase.json` (targets) + `.firebaserc` (site IDs).

### DomainGuard — separazione domini
`src/components/common/DomainGuard.jsx` — attivo solo in production (`!isDev`):
```
app domain   + super_admin     → schermata bloccata + link admin
admin domain + non super_admin → schermata bloccata + link app
```
In development (localhost) il guard è completamente disattivato.

### Session timeout — `useSessionTimeout(role)`
```
super_admin:    30 min
org_admin:       2 ore
trainer:         8 ore
staff_readonly:  8 ore
client:          24 ore
```
Timer si azzera su mousemove / keypress / touchstart / scroll.
Chiamato in `App.jsx` con `profile?.role`.

### Audit log — `auditLog(action, details?)`
Scrive in `/audit_logs/{logId}` — append-only, mai modificabile.
Solo super_admin può leggere (Firestore rules).
```js
import { auditLog, AUDIT_ACTIONS } from 'utils/auditLog'

// Azioni già integrate:
AUDIT_ACTIONS.LOGIN / LOGIN_FAILED  → useLoginForm.js
AUDIT_ACTIONS.LOGOUT                → firebase/services/auth.js
AUDIT_ACTIONS.CLIENT_CREATED        → usecases/createClientUseCase.js
AUDIT_ACTIONS.CLIENT_DELETED        → hooks/useClients.js
AUDIT_ACTIONS.PASSWORD_CHANGED      → firebase/services/auth.js (changeTrainerPassword)
                                       + features/client/ChangePasswordScreen.jsx
AUDIT_ACTIONS.EMAIL_CHANGED         → firebase/services/auth.js (changeUserEmail)
AUDIT_ACTIONS.ROLE_CHANGED          → features/org/org-pages/MembersPage.jsx
AUDIT_ACTIONS.MEMBER_REMOVED        → features/org/org-pages/MembersPage.jsx
```
**IMPORTANTE:** `getAuth(app)` in `auditLog.js` è chiamato dentro la
funzione (lazy), non a livello di modulo. Non spostarlo — causerebbe
conflitto con `setPersistence` in `auth.js`.

## Monitoraggio costi Firebase

### Piano attuale: Blaze (pay-as-you-go), uso dentro la fascia gratuita
Le Cloud Functions richiedono Blaze. L'obiettivo è restare a 0 €: su `rankex-dev` c'è un
budget con limite di spesa **rigido a 1 €** sul servizio Cloud Run Functions (ott 2026 — a
0 € il servizio veniva sospeso e i deploy fallivano con "Container Healthcheck failed").
Le immagini delle funzioni in Artifact Registry si cancellano dopo 1 giorno su entrambi i
progetti (`firebase functions:artifacts:setpolicy`), per non superare lo spazio gratuito.

**Limiti Firestore gratuiti (per giorno):**
```
50.000 letture
20.000 scritture
20.000 eliminazioni
1 GB storage
```

### Dove controllare
- **Usage & billing** → `console.firebase.google.com/project/fitquest-60a09/usage`
- **Firestore → Utilization tab** → documenti più letti, query inefficienti

### Ottimizzazioni già presenti
- `memberCount` / `clientCount` come counter atomici → nessuna query count a ogni render
- Letture Firestore solo su mount, no polling
- `onSnapshot` usato in **un solo punto** di tutta l'app: `features/client/useClient.js`
  (consumato da `ClientView.jsx`, root dell'area cliente) — è l'unico caso dove i dati
  cambiano sotto un attore diverso da chi guarda (il trainer aggiorna, il cliente osserva
  in tempo reale). Calendario e notifiche usano `getDocs` one-shot, **non** realtime —
  costano meno letture e l'utente che li modifica è la stessa persona che li guarda

### Quando si passa a Blaze (pay-as-you-go)
Impostare subito un budget alert su Google Cloud Console:
- Billing → Budgets & Alerts → progetto `fitquest-60a09`
- Soglia: €5/mese, alert al 50% e 90%

Il piano Blaze mantiene lo stesso free tier — si paga solo oltre la soglia.
MFA via SMS e backup automatico Firestore richiedono Blaze.

### Backup Firestore (prod)
Attivo dal 24/10/2026 su `fitquest-60a09` (solo prod, non su rankex-dev): backup
**giornaliero**, conservato **7 giorni** (`firebase firestore:backups:schedules:list
--project fitquest-60a09`). Costo: frazioni di centesimo al mese con il volume attuale.
Ripristino: un backup si ripristina sempre in un **nuovo** database, mai sopra quello
esistente — `firebase firestore:backups:list --project fitquest-60a09`, poi
`firebase firestore:databases:restore --backup <nome-backup> --database <nuovo-db>
--project fitquest-60a09`, poi si copiano i documenti necessari nel `(default)` con uno
script Admin SDK.

---

## Roadmap futura

Evoluzioni pianificate, non ancora implementate.
Queste feature non esistono nel codebase attuale — allinearsi con il team prima di iniziare.

### Sistema Avatar + Negozio

**Stato reale (set 2026): SPIKE TECNICO parziale implementato, non la visione completa
di questa sezione.** Discovery (docs/DECISIONS.md → ADR-002) aveva raccomandato di non
costruire per 3 dipendenze esterne non risolvibili scrivendo codice (asset grafici,
bilanciamento economia, flusso B2B) — l'utente ha scelto comunque uno spike tecnico
per validare la meccanica riusando le immagini già esistenti (`config/avatars.config.js`)
invece del sistema a 6 slot descritto sotto, che resta non implementato.

**Cosa esiste davvero:**
- `client.coins` — guadagnato **solo** chiudendo una sessione presente
  (`COINS_PER_SESSION = 10`, costante provvisoria in `chiudiSessione.js`) — rank-up/
  achievement/streak **non** accreditano Monete nello spike, solo le sessioni.
- Regole di sblocco per gli avatar esistenti (non nuovi moduli a slot): applicate per
  suffisso numerico dell'id in `config/avatars.config.js` → `isAvatarUnlocked()`, copia
  server in `functions/src/shared/avatarUnlocks.js` (stesso rischio di divergenza delle
  altre copie speculari — se cambi le soglie, aggiorna entrambe). Dati puramente
  dimostrativi (`01-03` default, `04-06` a livello, `07-09` acquistabili 30/60/100
  Monete) — non un'economia bilanciata.
- Acquisto: `acquistaAvatar` (Cloud Function, transazione Firestore — non batch, per
  evitare doppia spesa su doppio tap). Solo il client acquista per sé stesso.
- UI: `AvatarPicker.jsx` (client-view) — overlay lucchetto sugli avatar bloccati,
  bottone ACQUISTA per quelli a pagamento, saldo Monete visibile.
- **Non implementato**: sistema a 6 slot (testa/corpo/...), collection
  `avatar_modules`, moduli org-custom, form richiesta B2B, gestione super_admin,
  Monete da rank-up/achievement/streak. Tutto il resto di questa sezione descrive
  ancora la visione futura, non lo stato attuale.

#### Valuta: Monete
```
Valuta separata dagli XP — XP misura progressione atletica (rank),
le Monete sono valuta di spesa nel negozio avatar.
Guadagnate con: sessioni, rank-up, achievement, streak.
Nessun acquisto con denaro reale — solo attività in-app.
```

#### Struttura moduli avatar
```
Slot: testa · corpo · capelli · occhi · bocca · accessorio
Ogni slot ha: pezzo equipaggiato + inventario pezzi sbloccati
```

#### Tipi di sblocco moduli
```
Default    → set base gratuito per tutti i clienti
Livello    → si sblocca raggiungendo un livello XP specifico
Rank       → si sblocca raggiungendo un rank specifico
Acquisto   → spesa di Monete nel negozio
Org custom → moduli esclusivi per i clienti di una specifica org
             (gratuiti o a pagamento in Monete, prezzo definito da RankEX)
```

#### Moduli org custom — flusso B2B
```
1. Org admin fa richiesta in-app (form dedicato)
2. Fuori dall'app: flusso commerciale tra org e RankEX
   (contratto, design, produzione moduli)
3. Super admin carica i moduli e li attiva per l'org specifica
4. I clienti dell'org trovano i moduli nel proprio negozio
```

#### Impatto su Firestore (futuro)
```
avatar_modules/{moduleId}
  slot, name, rarity, unlockType, unlockValue,
  orgId (null = globale), price, imageUrl, createdAt

clients/{clientId}
  coins            → saldo monete
  avatarEquipped   → { testa, corpo, capelli, ... }
  avatarInventory  → [moduleId, ...]
```

#### Nuove aree UI (futuro)
```
Client area    → Negozio avatar, Builder avatar, saldo Monete
Org admin      → Form richiesta moduli custom
Super admin    → Gestione e upload moduli (globali + per org)
```

---

### Gamification avanzata
```
Badge / Achievement    → IMPLEMENTATO — lug 2026
                         Trofei automatici (prima sessione, striscia x5/x10/x25,
                         primo rank-up, top performer, rank massimo) + badge manuali
                         assegnabili dal trainer (es. "Campione") con nota libera.
                         Tier: Bronzo/Argento/Oro/Platino — config in config/badges.config.js
                         Showcase: il cliente fissa fino a 5 badge in evidenza sul profilo.
                         Assegnazione automatica SERVER-SIDE (ott 2026): chiudiSessione
                         e salvaCampionamento aggiungono i badge maturati nella stessa
                         transazione (functions/src/shared/badges.js → autoBadgeFields,
                         copia di utils/badges.js coperta dal test di parità). Prima la
                         faceva hooks/useBadges.js nel browser del trainer, solo aprendo
                         la scheda: in prod 10+ atleti VDP5 non avevano trofei maturati
                         (sistemati con scripts/backfill-badges.mjs).
                         Service: firebase/services/badges.js — awardBadge/revokeBadge/
                         updateBadgeShowcase. Dati su clients/{clientId}.badges{} +
                         .badgeShowcase[].
                         UI: client-dashboard/TrophiesSection.jsx (tab TROFEI,
                         trainer + client). Rules: manuale solo trainer/org_admin.
Streak presenze        → IMPLEMENTATO (verificato set 2026 — sezione corretta, era
                         rimasta come "da fare" dopo che il lavoro era già stato fatto)
                         Non a settimane come originariamente descritto qui, ma per
                         sessione: sessionStreak sale di 1 a ogni sessione chiusa con
                         presenza, si azzera a qualunque assenza (calcolo server-side
                         in chiudiSessione, batch atomico — vedi utils/gamification.js
                         → calcSessionXP, speculare a
                         functions/src/shared/gamification.js; calcStreakPreview
                         esiste solo lato client). Moltiplicatore XP
                         +10%/streak, cap +100% a streak 10 (vedi sezione
                         Gamification più sotto). Superficie UI: preview
                         "+XP · streak N" in CloseSessionModal.jsx e ClientCalendar.jsx
                         prima di chiudere la sessione, badge "Streak N" su
                         SlotCard.jsx, notifica dedicata su chiusura/assenza. Test:
                         __tests__/utils/gamification.test.js.
Groups Analytics Hub   → IMPLEMENTATO — apr 2026
                         GroupDetailView con 6 tab: Gestione (3 col + ricerca + paginazione),
                         Classifica (GroupLeaderboard — sort per media/stat, top 3 podio),
                         Analisi (GroupAnalysis — riepilogo + trend LineChart + heatmap + più migliorati),
                         Confronto (GroupComparison — selettore paginato, radar SVG multi-overlay, tabella),
                         Sessioni (slot del gruppo), Note (GroupNotes — publish/delete, paginazione).
                         Export PDF: GroupReportPrint.jsx via window.print().
Obiettivi trainer      → IMPLEMENTATO — set 2026 (Sprint #2)
                         Coach fissa target percentile su un test specifico per un
                         cliente entro una scadenza (es. "70° percentile sprint entro
                         fine mese"). Achievement rilevato server-side al prossimo
                         campionamento (salvaCampionamento), mai dal client. Notifica
                         al cliente al raggiungimento. 'missed' calcolato al volo
                         (nessun cron). UI: client-dashboard/GoalsSection.jsx (tab
                         OBIETTIVI) + vista atleta in sola lettura (hub → Test →
                         Obiettivi, ott 2026).
                         Modello dati: vedi sezione "Obiettivo" più sopra.
                         Callable: aggiungiObiettivo / annullaObiettivo.
```

### Gestione allenamento
```
Scheda Allenamento     → IMPLEMENTATO — apr 2026
                         Trainer crea schede multi-giorno (max 7) direttamente
                         dalla dashboard cliente. Supporto CRUD + archivio storico.
                         Crea nuova scheda → archivia automaticamente la precedente.
                         Il cliente vede la scheda attiva in read-only con tab giorni.
                         Struttura: organizations/{orgId}/workoutPlans/{planId}
                         Schema: days: [{ label, exercises[] }]
                         Status: 'active' | 'archived'
                         Calendario + bonus XP: IMPLEMENTATO ott 2026 — vedi
                         "Scheda Allenamento" nei Modelli dati
```

