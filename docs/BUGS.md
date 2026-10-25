# Bug Tracker — RankEX

Gestito da QA Engineer (apertura) e Developer (fix). Un bug P0/P1 aperto blocca la
release (vedi Release Manager) e ha priorità sulle nuove feature nello sprint (vedi
Scrum Master).

Severity: P0 blocca produzione · P1 alta · P2 media · P3 minore

Formato:

```
## [BUG-XXX] Titolo
**Severity:**
**Modulo/Ruolo:**
**Status:** OPEN | FIXED | WONTFIX
**Reproduction steps:**
**Expected:**
**Actual:**
**Suggested fix:**
```

---

<!-- Nuovi bug aggiunti qui da QA Engineer -->

<!-- Numerazione da BUG-002: BUG-001 esiste già su feature/mobile-app (vedi BACKLOG STORY-032) -->

## [BUG-002] Lipedema: termini "Sessione/Clienti/Trainer/Allenamenti" hardcoded in calendario, gruppi, note, team
**Severity:** P2
**Modulo/Ruolo:** lipedema — trainer, org_admin, staff_readonly (gli stessi testi fissi valgono anche per soccer/GYM, ma l'AC di STORY-030 li vieta esplicitamente nel modulo Lipedema)
**Status:** VERIFIED (QA dal vivo 25/10/2026, commit b119bfb, vite locale su rankex-dev): area professionista lipedema (trainer, org_admin, staff_readonly) senza Cliente/Clienti/Trainer/Sessione/Sessioni/Atleta/"Calendario allenamenti" in nav, calendario (header, modali, popup, banner singolare/plurale, toast "Appuntamento chiuso"), ricorrenze, gruppi ("Nessun gruppo", note di gruppo, toggle dialog), schede, note (badge "Professionista"), Team, impostazioni org, Profilo col nome reale, dashboard (tab "Paziente", "Calendario appuntamenti"). PT: confronto testuale con f71f73c su ~32 schermate, uniche differenze quelle attese (nome in Profilo, "Calendario sessioni", "Cliente" nel toggle dialog, aria "Torna ai gruppi", banner "chiudila"). Soccer: "Nuovo allenamento", "Nessuna squadra", "Crea la prima squadra per organizzare gli allievi.", "Coach" nel Team. Residuo grammaticale nuovo: BUG-010.
**Reproduction steps:**
1. Org `lipedema` su rankex-dev, login come trainer → Calendario.
2. Guardare l'header, aprire "+ Sessione", creare uno slot con un paziente, aprirlo e chiuderlo.
3. Aprire un paziente → tab Calendario e tab Note (con una nota); aprire un Gruppo → tab Gestione/Sessioni; Ricorrenze → "+ Ricorrenza"; Allenamento → Crea scheda; org_admin → Team; Profilo.
**Expected:** solo Professionista / Paziente / Appuntamento (singolare e plurale) in nav, titoli, empty state, toast e dialog (STORY-030, AC 3).
**Actual (QA dal vivo, 25/10/2026, commit f71f73c):**
- `CalendarHeader.jsx` "+ Sessione" (e aria-label "Aggiungi sessione", anche per cella)
- `AddSlotModal.jsx` titolo "Nuova sessione", label "CLIENTI", bottone "CREA SESSIONE (1 clienti)", "SELEZIONA ALMENO UN CLIENTE"
- `SlotPopup.jsx` / `CloseSessionModal.jsx` "Chiudi sessione" / "CHIUDI SESSIONE"; `TrainerCalendar.jsx` toast "Sessione chiusa"; `useCalendar.js` toast di errore "Impossibile … la sessione"
- `EventBlock.jsx` "N clienti"; `RecurrenceModal.jsx` "CLIENTI", "Verranno create N sessioni"
- `ClientDashboard.jsx` titolo tab Calendario "◈ Calendario allenamenti" (uso calendariale di "Allenamenti", vietato dall'AC)
- `GroupDetailHeader.jsx` tab "Sessioni" + `GroupSessionsPanel` "Nessuna sessione…"; `GroupManageTab.jsx` "Tutti gli atleti sono già in questo gruppo." e aria-label "Cerca atleta da aggiungere"
- `WorkoutPlanForm.jsx` "SESSIONI PREVISTE", "Ogni presenza … conta una sessione"
- `NotesSection.jsx` RoleBadge "Trainer" sotto l'autore della nota
- `MembersPage.jsx` "3 / 5 trainer · piano PRO" e opzione ruolo "Trainer"
- `ProfilePage.jsx` mostra "Trainer" come nome: il fallback `memberName ?? 'Trainer'` scatta anche se il membro ha un nome ("QA Lip Trainer"). Da verificare se succede anche in PT (getMember che fallisce o non viene risolto)
- Tab "Atleta" della dashboard paziente (`ClientDashboardHeader.jsx`): non nella lista vietata dell'AC, ma resta un termine sportivo per una paziente
**Suggested fix:** aggiungere a `TERMINOLOGIES` le chiavi mancanti dove servono (es. `trainer` già c'è, usarla in MembersPage/NotesSection/ProfilePage) e sostituire i testi fissi con `terminology.session(s)`/`client(s)`; per "Calendario allenamenti" usare `Calendario ${terminology.sessions.toLowerCase()}`. Sono tutti già raggiungibili via `useTrainerState().terminology`. Aggiungere al runbook un controllo testi per il modulo.
**Fix:** `TERMINOLOGIES` estese con genere (`clientGender`/`sessionGender`/`groupGender` + `byClientGender`/`bySessionGender`/`byGroupGender`), forme con articolo e preposizione (`theClient(s)`, `toTheClients`, `theSession(s)`, `theAthletes`, `theGroup`, `thisGroup`, `inTheGroup`, `ofTheGroup`, `toTheGroup`, `fromTheGroup`, `toTheGroups`), `athlete(s)` e `trainers`; helper ruoli `getMemberRoleOptions`/`getNoteRoleLabels`. Testi di calendario, ricorrenze, gruppi, schede, note, Team, impostazioni org, dashboard paziente e toast di `useCalendar`/`useRecurrences`/`useGroups` presi dalla terminologia, risolta una sola volta in `TrainerProvider` (fallback PT). ProfilePage: solo org_admin legge `members/` (le rules lo vietano agli altri); gli altri ruoli usano `users/{uid}.name` / `displayName` Auth — prima un trainer vedeva sempre "Trainer", in tutti i moduli. Test in `modules.config.test.js`. Da verificare: anche soccer/GYM ora vedono i propri termini (es. "Nuovo allenamento", "Allievi", "Nessuna squadra") dove prima c'erano "Sessione"/"Clienti"/"Nessun squadra".

## [BUG-003] Lipedema: un trainer può assegnare badge al paziente con scrittura Firestore diretta
**Severity:** P3
**Modulo/Ruolo:** lipedema — trainer / org_admin
**Status:** OPEN
**Reproduction steps:**
1. Login trainer di un'org `lipedema`, console del browser sulla dashboard.
2. `(await import('/src/firebase/services/badges.js')).awardBadge(orgId, patientId, 'champion', 'qa', 'QA')`
**Expected:** rifiuto (STORY-031: nessun badge al paziente, gamification non aggirabile dal client).
**Actual:** scrittura accettata, il doc paziente ha `badges.champion` (verificato in Firestore). `xp`/`coins` invece sono correttamente rifiutati (permission-denied). La UI non espone l'azione e i badge non sono mostrati nel modulo, quindi l'effetto è solo sui dati.
**Suggested fix:** nella rule di update del cliente, ammettere `badges`/`badgeShowcase` solo se il modulo dell'org ha gamification (es. `get(/organizations/$(orgId)).data.moduleType != 'lipedema'`), con test in `tests/rules/firestore.rules.test.js`.

## [BUG-004] staff_readonly vede "Elimina" nel menu ⋮ della dashboard cliente/paziente
**Severity:** P3
**Modulo/Ruolo:** tutti i moduli — staff_readonly (preesistente, non introdotto da f71f73c)
**Status:** VERIFIED (QA dal vivo 25/10/2026, commit b119bfb): staff_readonly PT → menu ⋮ con solo "ESPORTA PDF" (prima ESPORTA PDF | RESET PASSWORD | ELIMINA); staff_readonly lipedema → nessun menu ⋮ (prima ELIMINA). Trainer invariato.
**Reproduction steps:**
1. Login staff_readonly → apri un cliente/paziente → menu ⋮.
2. ELIMINA → conferma.
**Expected:** azione nascosta in readonly (ReadonlyGuard), come gli altri controlli di modifica.
**Actual:** la voce ELIMINA è visibile e il dialog si apre; la Cloud Function rifiuta (toast "Permessi insufficienti", 403), nessun dato toccato.
**Suggested fix:** in `ClientDashboard.jsx` non passare `onRequestDelete` (o nascondere il menu) quando `readonly`; per i moduli senza PDF/reset il menu ⋮ può sparire del tutto.
**Fix:** `ClientDashboard` passa `canDelete={!readonly}` e `canResetPassword` solo se non readonly; `ClientDashboardHeader` nasconde Elimina e, senza nessuna azione (es. staff_readonly in lipedema, che non ha PDF), l'intero menu ⋮. In readonly resta solo "Esporta PDF" dove il modulo ha il rank.

## [BUG-005] Soccer: tab BIA visibile nella dashboard allievo nonostante `hasBia: false`
**Severity:** P3
**Modulo/Ruolo:** soccer_academy — trainer (preesistente; ora c'è una capability esplicita che non viene usata)
**Status:** OPEN
**Reproduction steps:** org soccer → apri un allievo → tab bar.
**Expected:** nessuna tab BIA (CLAUDE.md: "Soccer academy: solo `tests_only`. BIA non supportata"; `MODULE_CAPABILITIES.soccer_academy.hasBia = false`).
**Actual:** tab BIA presente (ATLETA, TEST, BIA, ALLENAMENTO, …). Era così anche prima del commit.
**Suggested fix:** in `dashboardTabs.js` dare a `bia` `capability: 'hasBia'` e aggiornare `clientDashboardTabs.test.js`.

## [BUG-006] staff_readonly può aggiornare il profilo cliente dal banner "upgrade" (PT)
**Severity:** P3
**Modulo/Ruolo:** personal_training — staff_readonly (preesistente, trovato in code review di BUG-002/004)
**Status:** VERIFIED (QA dal vivo 25/10/2026, commit b119bfb): staff_readonly PT, cliente tests_only (tab BIA) e bia_only (banner sopra le tab) → nessun "AGGIUNGI AL PROFILO"; su f71f73c entrambi visibili.
**Reproduction steps:** login staff_readonly in un'org PT → cliente `bia_only` (banner sopra le tab) oppure cliente `tests_only` → tab BIA → bottone di upgrade al profilo Completo.
**Expected:** banner nascosto in readonly, come gli altri controlli di modifica.
**Actual:** `UpgradeCategoryBanner` non controlla readonly: il bottone è visibile e chiama `aggiornaProfiloCliente`.
**Suggested fix:** in `ClientDashboard.jsx` aggiungere `!readonly &&` alle due condizioni che montano il banner.
**Fix:** fatto come suggerito; in readonly la tab BIA di un cliente senza BIA resta vuota.

## [BUG-007] Calendario in readonly espone le azioni di scrittura
**Severity:** P3
**Modulo/Ruolo:** tutti i moduli — staff_readonly (preesistente, trovato in code review di BUG-002/004)
**Status:** OPEN
**Reproduction steps:** login staff_readonly → Calendario.
**Expected:** nessuna azione di creazione/modifica in readonly.
**Actual:** sono visibili e cliccabili "+ Sessione" / "+ Ricorrenza" in `CalendarHeader`, il "+" delle celle (`WeekView`/`DayView`/`MonthView`, anche il click sull'area vuota) e le azioni di `SlotPopup` (Chiudi sessione, Segna come saltata, Elimina). Il server rifiuta (le callable controllano il ruolo), nessun dato toccato, ma l'utente vede un errore.
**Suggested fix:** in `TrainerCalendar.jsx` leggere `useReadonly()` e, se readonly, non passare `onAddSession`/`onAddRecurrence` a `CalendarHeader` (già condizionali), non rendere il "+" delle celle né agganciare `onEmptyClick`, e in `SlotPopup` nascondere le azioni lasciando solo i dettagli e "Gestisci" ricorrenza; aggiungere un caso al runbook.

## [BUG-008] Area cliente (atleta) con terminologia PT fissa
**Severity:** P3
**Modulo/Ruolo:** soccer_academy / GYM — client (preesistente, trovato in code review di BUG-002/004)
**Status:** OPEN
**Reproduction steps:** login come allievo di un'org soccer → hub → Scheda / Calendario / Profilo › Note.
**Expected:** termini del modulo (Coach, Allenamento…).
**Actual:** `ClientView` non riceve `terminology`, quindi `ClientDashboardPage`, `ClientWorkoutSection` ("Il tuo trainer non ha ancora assegnato…"), `NotesSection` (badge "Trainer"), `PlanProgress` ("Sessione N di M") e `ClientCalendar` usano il default PT: l'allievo soccer vede "Trainer"/"Sessione".
**Suggested fix:** passare la terminologia risolta da `useAuth` (già disponibile in `AppRouter`) a `ClientView` e da lì ai componenti dell'area cliente, che accettano già la prop `terminology`.

## [BUG-009] CSP dell'hosting blocca tutte le Cloud Functions callable (`cloudfunctions.net` assente da `connect-src`)
**Severity:** P0
**Modulo/Ruolo:** tutti i moduli, tutti i ruoli — ogni scrittura via `usecases/` (creaCliente, creaMembroTeam, chiudiSessione, salvaBia, aggiungiNota…)
**Status:** OPEN
**Reproduction steps:**
1. Aprire https://rankex-app-dev.web.app (deploy-dev di b119bfb), login super_admin.
2. Organizzazioni → un'org → Membri → AGGIUNGI → compilare → CREA.
**Expected:** membro creato.
**Actual:** "Impossibile creare il membro"; in console: `Connecting to 'https://europe-west1-rankex-dev.cloudfunctions.net/creaMembroTeam' violates the following Content Security Policy directive: "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://fitness.googleapis.com"`. Nessuna invocazione nei log della funzione. In locale (`vite`, nessun header CSP) tutto funziona, per questo e2e e QA locali non lo vedono.
`firebase.json` ha la stessa CSP su entrambi i target, e `connect-src` non è mai cambiata da 057b621 (apr 2026, prima della migrazione BE). Una sola richiesta HEAD in sola lettura a https://rankex-app.web.app/login restituisce lo **stesso header**: in produzione è probabile lo stesso blocco. **Non verificato su prod** (vietato dal perimetro QA): da confermare subito dall'utente.
**Suggested fix:** aggiungere a `connect-src` `https://europe-west1-rankex-dev.cloudfunctions.net https://europe-west1-fitquest-60a09.cloudfunctions.net` (o `https://*.cloudfunctions.net`) in entrambi i blocchi header di `firebase.json`, ridistribuire l'hosting e aggiungere un e2e contro l'hosting reale (o un test che verifichi che la CSP includa il dominio delle functions).

## [BUG-010] Lipedema: plurale con quantità 1 nei limiti piano ("massimo 1 professionisti")
**Severity:** P3
**Modulo/Ruolo:** lipedema — org_admin (introdotto da b119bfb); simile, preesistente, in tutti i moduli: "1 presenti" nel modal di chiusura
**Status:** OPEN
**Reproduction steps:** org lipedema su piano free con ≥1 membro → org_admin → Team (banner limite) → IMPOSTAZIONI; calendario → chiudi un appuntamento con 1 presente.
**Expected:** "massimo 1 professionista", "Max 1 professionista", "1 presente".
**Actual:** `MembersPage` "Il piano FREE consente massimo 1 professionisti."; `OrgSettingsPage` "Max 1 professionisti · Max 10 pazienti"; `CloseSessionModal` "1 presenti". PT/soccer non visibili ("trainer"/"coach" invariabili).
**Suggested fix:** scegliere singolare/plurale in base al numero (`limit === 1 ? terminology.trainer : terminology.trainers`, idem per i presenti).
