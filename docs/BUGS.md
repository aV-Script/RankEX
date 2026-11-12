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
**Status:** VERIFIED (Sprint #17, `04a676c`, ADR-020; rules su rankex-dev 11/11/2026, prod al #18). Verifica dal vivo con scrittura diretta dal client SDK (stesse rules della console) come `qadev.<modulo>.trainer`: lipedema `badges.*` e `badgeShowcase` → permission-denied, `peso` con informativa accettato, `peso` senza informativa → permission-denied; PT e Soccer `badges.*`, `badgeShowcase`, `peso` accettati. Dati ripristinati con Admin SDK. Test rules: describe "Update cliente consapevole del modulo (ADR-020)", 9 test falliscono con le rules precedenti.
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
**Status:** VERIFIED (Sprint #17, `1ad3f02`, hosting rankex-app-dev 12/11). QA dal vivo con slot, gruppo e ricorrenza E2E- (Admin SDK, poi cancellati) in qa-pt/qa-soccer/qa-lipedema, staff_readonly e trainer a 1280 e 360 px: staff → calendario 0 azioni di scrittura (niente "Aggiungi …" in testata e celle), popup slot solo dettaglio + X di chiusura, Ricorrenze lista e dettaglio 0 azioni; trainer → 3 azioni in calendario, CHIUDI/ELIMINA nel popup, 4 nel dettaglio ricorrenza (controllo positivo). Nessuno scroll orizzontale a 360 px. qa:dev 30/30 con il nuovo caso `roles.spec.js` (staff 0 / trainer e org_admin > 0); prova negativa: con la sessione trainer il caso staff fallisce (atteso 0, trovati 9). Popup e dettagli restano al runbook TP-085
**Reproduction steps:** login staff_readonly → Calendario.
**Expected:** nessuna azione di creazione/modifica in readonly.
**Actual:** sono visibili e cliccabili "+ Sessione" / "+ Ricorrenza" in `CalendarHeader`, il "+" delle celle (`WeekView`/`DayView`/`MonthView`, anche il click sull'area vuota) e le azioni di `SlotPopup` (Chiudi sessione, Segna come saltata, Elimina). Il server rifiuta (le callable controllano il ruolo), nessun dato toccato, ma l'utente vede un errore.
**Note (da BUG-022, QA dal vivo Sprint #16, 11/11, qadev.lipedema.staff):** "+ APPUNTAMENTO" e "+ RICORRENZA" visibili e cliccabili a desktop e 360 px; preesistente (già così a 7a0a5a7). Perimetro #17 (censimento approvato 12/11): calendario, gruppi (BUG-024) e pagina Ricorrenze; click su slot esistente in readonly = dettaglio in sola lettura.
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
**Status:** FIXED in produzione (26/10/2026): hotfix 4f5d08e su `main` (solo `firebase.json`), deploy-prod verde, header `connect-src` live su rankex-app e rankex-admin contiene `https://*.cloudfunctions.net`. Prova di scrittura dal vivo in prod a cura dell'utente. — VERIFIED su rankex-dev (25/10/2026, commit 56905ee, smoke test sull'hosting reale rankex-admin-dev + rankex-app-dev): creazione org, creaMembroTeam, creaCliente (account Auth + users/{uid}), chiudiSessione (+55 XP, toast "Sessione chiusa · +XP assegnata") e salvaBia (+50 XP) riusciti; nessuna violazione CSP in console (listener securitypolicyviolation), nessuna richiesta fallita, font Montserrat/Inter caricati. **Prod (fitquest-60a09) ancora da deployare** — fino ad allora il bug resta aperto in produzione.
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
**Status:** VERIFIED (11/11/2026, rankex-app-dev, commit `2707b21` con l'helper `utils/plural.js` di `eb15aec`): org_admin di `qa-lipedema` portata a piano free per la prova (poi riportata a pro) → Team "massimo 1 professionista", IMPOSTAZIONI "Max 1 professionista · Max 10 pazienti"; calendario `demo-lipedema` → chiusura con un presente "1 presente". Stesso esito anche sull'hosting `50f6779`.
**Reproduction steps:** org lipedema su piano free con ≥1 membro → org_admin → Team (banner limite) → IMPOSTAZIONI; calendario → chiudi un appuntamento con 1 presente.
**Expected:** "massimo 1 professionista", "Max 1 professionista", "1 presente".
**Actual:** `MembersPage` "Il piano FREE consente massimo 1 professionisti."; `OrgSettingsPage` "Max 1 professionisti · Max 10 pazienti"; `CloseSessionModal` "1 presenti". PT/soccer non visibili ("trainer"/"coach" invariabili).
**Suggested fix:** scegliere singolare/plurale in base al numero (`limit === 1 ? terminology.trainer : terminology.trainers`, idem per i presenti).
**Fix:** singolare/plurale in base al numero in `MembersPage` (`terminology.trainer` con limite 1), `OrgSettingsPage` (professionisti e pazienti), `NewClientView` (pazienti) e `CloseSessionModal` ("1 presente", "1 assente").

## [BUG-011] Lipedema: form 2MWT/BIA compilato perso senza conferma (nav principale; INDIETRO della BIA)
**Severity:** P2
**Modulo/Ruolo:** lipedema — trainer/org_admin (la nav principale vale per qualunque form a schermo intero della dashboard)
**Status:** VERIFIED (31/10/2026, hosting rankex-app-dev, commit 769565d): 2MWT e BIA sporchi → voce della nav principale desktop e swipe della bottom bar mobile → "Uscire senza salvare?"; INDIETRO mantiene il valore, ESCI naviga. INDIETRO interno della BIA → conferma "…in questa misurazione andranno persi". Ricarica con form sporco → avviso nativo beforeunload (restando, il valore c'è); dopo il salvataggio della BIA e con navigazione normale nessun avviso. PT/soccer: nessun dialog navigando tutte le voci. Nota: su mobile il tap sulla bottom tab bar non è verificabile perché la barra azioni fissa (z-40) la copre mentre il form è aperto (vedi BUG-012).
**Fix:** Fix implementato 31/10 (da verificare in QA): nuovo `context/UnsavedChangesContext.jsx` (flag + conferma "Uscire senza salvare?" + `beforeunload`) montato in `TrainerView`/`OrgAdminView`; la nav principale passa da `guardLeave`, come tab e back della dashboard; `BiaView` → INDIETRO con conferma se ci sono valori.
**Reproduction steps (QA dal vivo 31/10/2026, rankex-app-dev, commit 281bbe4):**
1. Paziente con informativa → Valutazioni → + NUOVA VALUTAZIONE → frazione finale 12 (form modificato).
2. Cliccare una voce della nav principale (es. GRUPPI).
3. Ripetere con BIA → + RILEVAMENTO → un valore compilato → nav principale; poi di nuovo con il bottone INDIETRO della BIA.
**Expected:** conferma "Uscire senza salvare?" come già succede cambiando tab della dashboard o col back dell'header (verificato: lì la conferma c'è e il valore resta).
**Actual:** nav principale → si passa a Gruppi senza conferma, dati persi (2MWT e BIA). INDIETRO di `BiaView` → torna alla tab BIA senza conferma (l'INDIETRO del 2MWT invece chiede conferma).
**Suggested fix:** intercettare il cambio pagina di `AppNav`/`TrainerView` quando la dashboard ha un form sporco (stato condiviso o callback `onBeforeLeave`), e dare a `BiaView` lo stesso `showDiscard` del 2MWT su INDIETRO.

## [BUG-012] Mobile: barra riepilogo + SALVA VALUTAZIONE non fissa in basso
**Severity:** P3
**Modulo/Ruolo:** lipedema — trainer, mobile (390×844)
**Status:** VERIFIED (31/10/2026, commit 769565d): mobile 390×844, barra riepilogo + SALVA fissa in fondo al viewport durante la compilazione (2MWT: barra 682–844 px a scroll 153; BIA: 781–844 px). `.rx-animate-in` ora `rx-fadeIn 0.25s backwards`, transform a riposo `none`. Osservazione (non bloccante, decisione UX): la barra copre la bottom tab bar (z-40 su z-30), quindi col form aperto la nav mobile non è cliccabile; si esce con INDIETRO, back dell'header o swipe (protetti dalla conferma).
**Fix:** Fix implementato 31/10 (da verificare in QA): `.rx-animate-in` usa `animation-fill-mode: backwards` (era `forwards`): a fine animazione non resta il transform, le barre fisse di form valutazione e BiaView restano sul viewport. Su mobile la barra copre la bottom tab bar mentre si compila, come già faceva BiaView.
**Reproduction steps:** mobile → paziente → Valutazioni → + NUOVA VALUTAZIONE → compilare tratti/frazione senza scorrere.
**Expected:** (spec Sprint #11 §2) riepilogo live e azioni fissi in basso su mobile mentre si compila.
**Actual:** la barra è `position: fixed` ma un antenato `.rx-animate-in` ha `transform` calcolato (`matrix(1,0,0,1,0,0)`, animazione con fill), che crea un nuovo containing block: la barra resta in fondo al form (y≈1517 px su viewport 844) ed è visibile solo dopo aver scrollato fino alla fine. Il riepilogo "142 m" non si vede mentre si inseriscono i dati.
**Suggested fix:** rendere la barra fuori dal contenitore animato (portal su `document.body`) oppure togliere il `transform` residuo (`animation-fill-mode: none` / animare solo l'opacità) per la vista valutazione; tenere conto dell'altezza della bottom tab bar (58 px).

## [BUG-013] "Ultime valutazioni" mostra un risultato su percorso variante senza segnalarlo
**Severity:** P3
**Modulo/Ruolo:** lipedema — tutti i ruoli che vedono la tab Paziente
**Status:** VERIFIED (31/10/2026, commit 769565d): card "Ultime valutazioni" mostra "INTERROTTA · 85 s" quando l'ultima valida è interrotta e "VARIANTE 20 m" quando è su percorso variante.
**Fix:** Fix implementato 31/10 (da verificare in QA): `LatestAssessmentsCard` mostra `AssessmentBadges` (VARIANTE / INTERROTTA) sotto l'ultimo valore.
**Reproduction steps:** salvare un 2MWT standard (30 m, 145 m) e poi uno su percorso 20 m (variante, 113 m) → tab Paziente.
**Expected:** l'ultimo valore mostrato porta lo stesso stato dello storico (badge VARIANTE 20 m), o la card mostra l'ultimo valore confrontabile.
**Actual:** card "Ultime valutazioni": "2MWT · 31/10/2026 · 113 m", nessun indicatore di variante; nello storico la stessa riga ha "VARIANTE 20 m · NON CONFRONTABILE".
**Suggested fix:** riusare `AssessmentBadges` in `LatestAssessmentsCard` (almeno VARIANTE/INTERROTTA).

## [BUG-014] Sequenza di visita: su telefoni stretti i bottoni della barra vanno su 3 righe
**Severity:** P2
**Modulo/Ruolo:** lipedema — trainer/org_admin, mobile (STORY-042)
**Status:** VERIFIED (09/11/2026, commit 6be2314, rankex-app-dev): testi invariati, padding laterale dei secondari 10 px. A 360×640, Handgrip in kgf con 6 prove: INDIETRO, SALTA e SALVA E CHIUDI su una riga, barra 188 px (29 %) contro 233. A 320×568 SALVA E CHIUDI va ancora a capo (barra 233 px, 41 %), accettato. Nessuno scroll orizzontale.
**Reproduction steps:** viewport 360×640 → Valutazioni → + NUOVA VALUTAZIONE → Handgrip, unità kgf, 6 prove compilate.
**Expected:** barra su 2 righe di bottoni, come a 390 px; il form resta la parte principale dello schermo.
**Actual:** INDIETRO, SALTA e SALVA E CHIUDI non stanno su una riga e l'ultimo va a capo. Altezza misurata: 233 px su 640 (36 %) col riepilogo pieno, 193 px a form vuoto. A 390×844 è 148–188 px (18–22 %) su 2 righe. I campi restano raggiungibili: `pb-72` basta e nessun campo finisce sotto la barra.
**Suggested fix:** etichette più corte su mobile (es. "SALVA E AVANTI" e "CHIUDI") o padding ridotto dei secondari. Da decidere insieme alla scelta "SALVA E PASSA A…" su mobile.

## [BUG-015] Riepilogo per screen reader dei test bilaterali: "prove inserite" conta anche le righe vuote
**Severity:** P3
**Modulo/Ruolo:** lipedema — Handgrip, HHD, OLS (`BilateralSummary`, testo `sr-only` in area `aria-live`)
**Status:** VERIFIED (09/11/2026, commit `50f6779`, hosting rankex-dev: form Handgrip vuoto "0 prove inserite", dopo un valore "1 prova inserita")
**Reproduction steps:** aprire un form bilaterale senza compilare nulla e leggere il riepilogo con uno screen reader.
**Expected:** il numero di prove compilate (0).
**Actual:** "6 prove inserite" (OLS: 4), perché usa `form.trials.length`.
**Suggested fix:** contare le sole righe con un valore.
**Fix:** `countFilledTrialRows` in `bilateralFormModel.js` (righe con almeno un dato, stessa definizione di `isEmptyTrialRow`) e `countLabel`: "1 prova inserita". Test in `lipedema.test.js`.

## [BUG-016] Dopo SALVA E CHIUDI la lista non ha ancora l'ultima valutazione e + NUOVA è attivo
**Severity:** P3
**Modulo/Ruolo:** lipedema — trainer/org_admin. Introdotto dalla review di STORY-042 (rilettura in background)
**Status:** VERIFIED (07/11/2026, commit 3174e31, rankex-app-dev): dopo SALVA E CHIUDI il bottone resta disabilitato e si riattiva quando compare la nuova riga
**Reproduction steps:** salvare con SALVA E CHIUDI e aprire subito + NUOVA VALUTAZIONE, prima che la rilettura finisca.
**Expected:** nessuna nuova valutazione da uno storico senza l'ultima salvata (precompilato e confronti sbagliati).
**Actual:** per la durata della rilettura la lista è quella vecchia (ancora senza la nuova riga 500 ms dopo la chiusura) e il bottone è attivo.
**Fix:** `refreshAfterSave` imposta `isLoading` finché la rilettura non termina: + NUOVA VALUTAZIONE resta disabilitato. La lista resta visibile senza scheletro.

## [BUG-017] Super admin: "Creato il: Invalid Date" nel dettaglio di Demo Lipedema
**Severity:** P3
**Modulo/Ruolo:** super_admin, `OrgDetailView`. Trovato di passaggio nella QA Sprint #13, fuori dal perimetro della QA
**Status:** VERIFIED (11/11/2026, rankex-admin-dev, super_admin di seed): "Creato il 31 ott 2026" nel dettaglio di Demo Lipedema, nessun "Invalid Date" in lista; verificato prima della migrazione (createdAt ancora Timestamp) e dopo (`scripts/migrate-org-dates-dev.mjs --apply`, 15 date convertite, 0 Timestamp rimasti).
**Reproduction steps:** rankex-admin-dev → Organizzazioni → Demo Lipedema.
**Expected:** la data di creazione dell'org.
**Actual:** "Invalid Date". L'org è creata da `scripts/seed-demo-lipedema.mjs` con `createdAt` come timestamp Firestore; causa da confermare (formato atteso dalla vista).
**Suggested fix:** gestire il timestamp Firestore nella formattazione della data.
**Fix:** `getOrganizations`/`getOrganization` normalizzano `createdAt` (Timestamp → ISO) con `utils/orgDates.js`, così anche i dati già su rankex-dev si leggono; i due seed scrivono `new Date().toISOString()` solo alla creazione dell'org. Test in `orgDates.test.js`.

## [BUG-018] Errore sui decimali dei test bilaterali: "al massimo 1 decimali"
**Severity:** P3
**Modulo/Ruolo:** lipedema — Handgrip, HHD, OLS (`utils/lipedema.js`, messaggio con `spec.inputDecimals`). Trovato nella QA del 09/11/2026 (TP-067)
**Status:** VERIFIED (11/11/2026, rankex-app-dev, OLS con prova 1 a 30,25 → "Inserisci il valore con al massimo un decimale", salvataggio bloccato). Fix del 09/11/2026 — `maxDecimalsMessage` nel blocco CORE di `utils/lipedema.js` e `shared/lipedema.js` ("un decimale" / "n decimali" / "valore intero"), test in `lipedema.test.js`, parità verde, functions su rankex-dev. Hosting dev deployato il 09/11 con lo Sprint #14 (non riverificato dal vivo: la QA dello sprint copre solo il nuovo)
**Reproduction steps:** OLS, prova 1 a 30,25 → SALVA.
**Expected:** "Inserisci il valore con al massimo un decimale", come negli altri campi del modulo.
**Actual:** "Inserisci il valore con al massimo 1 decimali". Il blocco funziona: l'errore compare e il salvataggio non parte.
**Suggested fix:** singolare/plurale in base a `inputDecimals`. Va allineata anche la copia server se il messaggio esiste lì (test di parità).

## [BUG-019] Delta del 30s-STS: "+1 ripetizioni"
**Severity:** P3
**Modulo/Ruolo:** lipedema — storico valutazioni e PDF (STORY-040), tutti i ruoli. Preesistente da `fe08df0`, emerso nella QA dal vivo dello Sprint #14 (PDF di "QA Visita Sprint13")
**Status:** FIXED + VERIFIED (09/11/2026, rankex-app-dev, staff_readonly): "+1 ripetizione rispetto al 07/11"
**Reproduction steps:** paziente con due 30s-STS confrontabili che differiscono di 1 ripetizione → tab VALUTAZIONI → 30s-STS, oppure Esporta PDF.
**Expected:** "+1 ripetizione rispetto al gg/mm" (e "0 ripetizioni", "+2 ripetizioni").
**Actual:** "+1 ripetizioni rispetto al gg/mm".
**Fix:** `formatMonoDelta` accetta un'unità numerabile `{ singular, plural }`; il registro del 30s-STS la usa. Test in `lipedema.test.js`. Stessa famiglia di BUG-010 (che resta aperto, decide l'utente).

## [BUG-020] PDF paziente Lipedema: pagine successive alla prima senza margine e BIA spezzata
**Severity:** P3
**Modulo/Ruolo:** lipedema — export PDF (STORY-040), tutti i ruoli. Trovato nella QA dal vivo dello Sprint #15 (report di 2 pagine)
**Status:** FIXED + VERIFIED (11/11/2026, commit `3923844`, rankex-app-dev): A4 di 2 pagine con margine verticale su entrambe, intestazione della tabella ripetuta, test e sezione BIA non spezzati; il report di un paziente con meno dati resta di 1 pagina. Motore di stampa di Chromium (`page.pdf`), non su stampante fisica
**Reproduction steps:** paziente con note lunghe su più test e una BIA → Azioni → Esporta PDF → stampa A4.
**Expected:** margini su ogni pagina, ogni test e la BIA interi su una pagina.
**Actual:** la seconda pagina partiva dal bordo del foglio (`@page { margin: 0 }`), la BIA lasciava titolo e prima riga in fondo alla prima pagina.
**Fix:** `usePrintDocument` accetta `pageMargin` (default `0`, invariato per i report cliente e gruppo); il report lipedema usa `12mm 0`, un `tbody` per test e `break-inside: avoid` sulla BIA.

## [BUG-021] Nuovo appuntamento: "CREA APPUNTAMENTO (1 pazienti)"
**Severity:** P3
**Modulo/Ruolo:** tutti i moduli — trainer/org_admin, `AddSlotModal.jsx:173`. Trovato nella QA dal vivo dello Sprint #15
**Status:** VERIFIED (Sprint #16, 11/11, rankex-app-dev, trainer PT/Soccer/Lipedema a 1280 e 360 px): "CREA SESSIONE (1 cliente)" / "(2 clienti)", "CREA ALLENAMENTO (1 allievo)" / "(2 allievi)", "CREA APPUNTAMENTO (1 paziente)" / "(2 pazienti)"; massimale "1 paziente ha raggiunto…" / "2 pazienti hanno raggiunto…" (e cliente/allievo); MonthView 1 nome, 2 "2 pazienti/clienti/allievi", 0 nessuna etichetta; GroupCard "1 paziente/2 pazienti" (e cliente, allievo); NotesSection "1 commento"/"2 commenti"; PlanProgress "1 sessione svolta"/"2 sessioni svolte" (PT) e "1 allenamento svolto"/"2 allenamenti svolti" (Soccer); NotificationsPanel (client PT a 360 px) "1 non letta"/"2 non lette"; 30s-STS "1 ripetizione / 30 s", "2 ripetizioni / 30 s"; parametri clinici "1 compilato"/"2 compilati". Non verificato: PDF gruppo e PDF paziente "Professionista/Professionisti"
**Reproduction steps:** Calendario → + Appuntamento → selezionare un solo paziente.
**Expected:** "CREA APPUNTAMENTO (1 paziente)".
**Actual:** "CREA APPUNTAMENTO (1 pazienti)" (in PT "1 clienti").
**Suggested fix:** `pluralize(selectedClients.length, terminology.client, terminology.clients)` da `utils/plural.js`, insieme agli altri ternari fuori dai 5 file (TD-012).


## [BUG-022] staff_readonly vede i bottoni "+" del calendario
**Severity:** P3
**Modulo/Ruolo:** tutti i moduli — staff_readonly, `TrainerCalendar.jsx:116-117` (`onAddSession`/`onAddRecurrence` passati sempre a `CalendarHeader`), anche i "+" dei giorni. Trovato nella QA dal vivo dello Sprint #16 (11/11, qadev.lipedema.staff); preesistente (già così a 7a0a5a7), non introdotto da TD-011
**Status:** DUPLICATE di BUG-007 (Sprint #17, 12/11): stesso difetto (azioni di scrittura del calendario visibili a staff_readonly). Passi e osservazioni di questa voce sono confluiti in BUG-007
**Reproduction steps:** login staff_readonly → Calendario, a desktop o 360 px.
**Expected:** nessun bottone di creazione (ReadonlyGuard / `useReadonly`), come nelle altre pagine.
**Actual:** "+ APPUNTAMENTO" e "+ RICORRENZA" visibili e cliccabili; il salvataggio dovrebbe essere rifiutato da rules/callable (da verificare).
**Suggested fix:** in `TrainerCalendar` passare `onAddSession`/`onAddRecurrence` solo se non readonly (stesso per i "+" dei giorni e il click sugli slot vuoti).

## [BUG-023] Trend valutazioni: ultima etichetta dell'asse X tagliata
**Severity:** P4 (cosmetico)
**Modulo/Ruolo:** lipedema — trainer/org_admin/staff_readonly, `AssessmentTrendChart.jsx:12,56-59`. Segnalato come cosmetico non tracciato dal #14 (retro #14 e #15), tracciato nello Sprint #16
**Status:** VERIFIED (Sprint #16, 11/11) — `X_AXIS_PADDING` 28 px su `XAxis`; dal vivo su rankex-app-dev, 2MWT e Handgrip con 3 punti, a 360 px e 1280 px: nessuna etichetta oltre i bordi (ultima a 26 px dal bordo, prima 0)
**Reproduction steps:** paziente con almeno 2 valutazioni confrontabili dello stesso test → scheda → storico del test → grafico, a 360 px e a desktop.
**Expected:** tutte le etichette dell'asse X (data breve, con ora se due valutazioni nello stesso giorno) leggibili per intero.
**Actual:** l'ultima etichetta, centrata sull'ultimo punto, esce dal bordo destro (`CHART_MARGIN.right` 8 px) e viene tagliata; a 360 px anche etichette vicine si sovrappongono.
**Suggested fix:** `padding` orizzontale sull'`XAxis` (i punti estremi si staccano dai bordi) e/o margine destro maggiore; verificare con l'etichetta più lunga (data + ora).

## [BUG-024] staff_readonly: nella pagina Gruppi restano i controlli di modifica
**Severity:** P3 (UI; il server rifiuta la scrittura)
**Modulo/Ruolo:** tutti i moduli — staff_readonly, `GroupsPage.jsx` (bottone "+ NUOVO/NUOVA") e dettaglio gruppo (`RIMUOVI`, `AGGIUNGI`, "Azioni gruppo"). Trovato nella QA dal vivo dello Sprint #16 (11/11, qadev.pt.staff, qadev.soccer.staff, qadev.lipedema.staff). La pagina non usa `useReadonly`/`ReadonlyGuard`; già così prima di STORY-043
**Status:** VERIFIED (Sprint #17, `1ad3f02`, hosting rankex-app-dev 12/11). QA dal vivo con gruppo E2E- in qa-pt/qa-soccer/qa-lipedema, staff_readonly a 1280 e 360 px: lista senza "+ NUOVO/A", dettaglio senza RIMUOVI/AGGIUNGI, menu azioni senza RINOMINA/ELIMINA (resta ESPORTA PDF dove presente), tab NOTE e GESTIONE senza azioni; trainer: + NUOVO, RIMUOVI, RINOMINA, ELIMINA presenti. qa:dev `roles.spec.js` copre la lista gruppi
**Reproduction steps:** login staff_readonly → Gruppi → "+ NUOVO" → nome → Invio; oppure apri un gruppo → GESTIONE.
**Expected:** nessun controllo di creazione/modifica (come nelle schede paziente, dove staff vede solo "Azioni → ESPORTA PDF").
**Actual:** il form di creazione si apre e accetta il nome; nel dettaglio compaiono RIMUOVI/AGGIUNGI. Il documento NON viene scritto su Firestore (rules `canWrite` o callable lo rifiutano: gruppi di qa-pt invariati), quindi è solo UI/UX. Anche il calendario ha lo stesso problema (BUG-022). Schede paziente, tab VALUTAZIONI/ALLENAMENTO/OBIETTIVI/NOTE/MISURE/BIA/TROFEI: nessun bottone di modifica (OK).
**Suggested fix:** `useReadonly()` in `GroupsPage` e nel dettaglio gruppo per nascondere "+ NUOVO", RIMUOVI, AGGIUNGI, rinomina/elimina.

## [BUG-025] Button disabilitato: il cursore resta "pointer" invece di "not-allowed"
**Severity:** P4 (cosmetico)
**Modulo/Ruolo:** tutti — `components/ui/index.jsx` `Button` (classi `cursor-pointer` e `cursor-not-allowed` insieme, vince `cursor-pointer`). Trovato nella QA dal vivo dello Sprint #16 (11/11): AddSlotModal, RecurrenceModal, MembersPage a piano free, tutti `cursor: pointer` computato con `disabled=true` e opacità 0,5
**Status:** VERIFIED (Sprint #16, 11/11) — `cursor-pointer` solo nel ramo abilitato di `Button`; dal vivo su rankex-app-dev: CREA APPUNTAMENTO disabilitato `cursor: not-allowed`, opacità 0,5; bottoni abilitati `pointer`
**Reproduction steps:** Calendario → + Appuntamento senza clienti; oppure Team a piano free; ispezionare il bottone disabilitato.
**Expected:** `cursor: not-allowed` (TP-083 passo 3: "cursore non consentito").
**Actual:** `cursor: pointer`; il click però non fa nulla (disabled) e l'opacità è 0,5.
**Suggested fix:** nel `Button` usare `${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}` invece di entrambe le classi.

## [BUG-026] Banner RICARICA copre "Password dimenticata?" sul login a 360 px
**Severity:** P3 (UI; workaround immediato)
**Modulo/Ruolo:** tutti — pagina di login, `src/app/App.jsx:54-67` (banner `fixed bottom-5`). Trovato nella voce 3e dello Sprint #19 (12/11, rankex-app-dev, dopo il deploy hosting)
**Status:** FIXED nel codice (Sprint #20, da verificare dal vivo su rankex-dev con TP-088): sotto `lg` il banner sta in alto (`top-16`), da `lg` resta in basso
**Reproduction steps:** login aperto a 360×640 con build vecchia; deployare una nuova build; attendere fino a 5 min (`POLL_MS`, `useVersionCheck.js:3`) finché compare il banner RICARICA.
**Expected:** il banner non nasconde i controlli del form.
**Actual:** il banner copre il link "Password dimenticata?" finché non si ricarica. A 1366 px non copre nulla.
**Workaround:** premere RICARICA.
**Suggested fix:** sul login spostare il banner in alto o dare al contenuto un padding-bottom pari all'altezza del banner quando è visibile.

## [BUG-027] Acquisto avatar senza conferma: un tap scala le Monete
**Severity:** P2
**Modulo/Ruolo:** area cliente (PT/GYM e soccer; lipedema non ha area cliente), ruolo client — `src/features/client/client-view/avatar/AvatarPicker.jsx:117` (`onClick={() => handlePurchase(a)}`). Trovato nel censimento ux-ui-designer del 12/11/2026 su `ab65b45`. Assorbito da STORY-045.
**Status:** FIXED nel codice (Sprint #20, STORY-045; da verificare dal vivo con TP-089)
**Reproduction steps:** login client con Monete sufficienti → Avatar → tap su ACQUISTA di un avatar acquistabile.
**Expected:** una conferma con prezzo, saldo attuale e saldo dopo l'acquisto (canvas `ClienteAcquistaAvatar`, `MobileClienteAcquista`).
**Actual:** la callable `acquistaAvatar` parte subito e le Monete scendono senza possibilità di annullare.
**Suggested fix:** `ConfirmDialog` (`src/components/common/ConfirmDialog.jsx`) con prezzo/saldo prima/dopo; callable invariata.

## [BUG-028] Calendario cliente: sessione passata con cliente assente o saltata resta "Pianificata"
**Severity:** P2
**Modulo/Ruolo:** area cliente (PT/GYM e soccer; lipedema non ha area cliente), ruolo client e vista trainer del cliente — `src/features/client/ClientCalendar.jsx:98-99` (`isCompleted`, `isPlanned = hasSlots && !isCompleted`) e `:102` (`dayXP`); `calcMonthlyCompletion` in `src/utils/calendarUtils.js:67-72`. Trovato nel censimento del 12/11/2026 su `ab65b45`. Assorbito da STORY-047.
**Status:** FIXED nel codice (Sprint #20, STORY-047; da verificare dal vivo con TP-092)
**Reproduction steps:** il trainer chiude una sessione passata con il cliente assente, oppure la salta (`status: 'skipped'`); aprire il calendario del cliente nel mese.
**Expected:** stati distinti completata / assente / saltata / pianificata e stima XP solo per le sessioni future; "completamento mese" non conta saltate e future.
**Actual:** il giorno resta "Pianificata" (pallino blu) con stima "+N XP"; la barra COMPLETAMENTO MESE conta tutti gli slot del mese, anche futuri e saltati.
**Suggested fix:** funzione pura di stato slot (completed/absent/skipped/planned) con test Vitest, più legenda a 4 voci.

## [BUG-029] ClientHub: variabili CSS inesistenti nel pentagono
**Severity:** P3
**Modulo/Ruolo:** area cliente (PT/GYM e soccer; lipedema non ha area cliente), ruolo client — `src/features/client/client-view/ClientHub.jsx:199` (`var(--bg-base)`) e `:277` (`var(--text-primary)` / `var(--text-secondary)`). Trovato nel censimento del 12/11/2026 su `ab65b45`. Fuori voce di sprint (pipeline saltata: fix di una riga).
**Status:** FIXED nel codice (Sprint #20, fuori voce): `--rx-bg`, `--rx-text`, `--rx-text-muted`; da osservare in QA dal vivo sull'hub
**Reproduction steps:** login client → hub pentagono; ispezionare il cerchio sotto i badge e le etichette dei vertici.
**Expected:** colori dal tema (`--rx-*`).
**Actual:** le variabili non esistono in `src/index.css` (0 occorrenze, vedi CLAUDE.md → Design system): il cerchio-maschera è trasparente e le etichette prendono il colore ereditato.
**Suggested fix:** sostituire con `--rx-bg`, `--rx-text`, `--rx-text-muted`. Residuo non-bug: `src/features/admin/AdminShell.jsx:64` usa `var(--bg-base, #07090e)` con fallback.

## [BUG-030] Pannello notifiche non accessibile e lettura implicita
**Severity:** P2
**Modulo/Ruolo:** area cliente (PT/GYM e soccer; lipedema non ha area cliente), ruolo client — `src/features/notification/NotificationsPanel.jsx` (nessun `role="dialog"`, `useFocusTrap`, `useEscapeKey`) e `src/features/client/ClientView.jsx:31-34` (`handleOpenNotifs` chiama `markAllRead()`). Trovato nel censimento del 12/11/2026 su `ab65b45`. Assorbito da STORY-046.
**Status:** FIXED nel codice (Sprint #20, STORY-046; da verificare dal vivo con TP-090)
**Reproduction steps:** login client con notifiche non lette → apri la campana → premi Esc / Tab.
**Expected:** dialog con focus trap, Esc chiude, focus alla campana alla chiusura; le notifiche si segnano lette solo con azione esplicita.
**Actual:** nessun ruolo dialog, Esc non chiude, il focus esce dal pannello; aprire il pannello segna tutto come letto.
**Suggested fix:** `role="dialog"` + `useFocusTrap` + `useEscapeKey`; bottone "Segna tutte come lette"; togliere `markAllRead()` da `handleOpenNotifs`.

## [BUG-031] Quattro difetti minori dell'area cliente e del login
**Severity:** P3
**Modulo/Ruolo:** area cliente e login (PT/GYM e soccer; lipedema non ha area cliente), ruolo client. Trovato nel censimento del 12/11/2026 su `ab65b45`.
**Status:** OPEN — punti 1 e 4 FIXED nel codice (Sprint #20, STORY-046, TP-091); punti 2 e 3 da fare (fix fuori voce)
**Reproduction steps / Actual:**
1. `src/features/client/ChangePasswordScreen.jsx`: nessun `<form>`/`onSubmit`, Invio non invia (bottone con `onClick={handleSubmit}` a riga 107) → STORY-046.
2. `src/features/client/client-dashboard/NotesSection.jsx:90`: l'empty state "Aggiungi la prima nota per tenere traccia…" compare anche al cliente `readonly` (montata `readonly` in `ClientDashboardPage.jsx:337`), che non può scrivere note. Fix diretto fuori voce.
3. `src/features/client/client-dashboard/GoalsSection.jsx:161`: "Quando il tuo coach fissa un obiettivo…" con "coach" fisso, anche in PT/GYM. Fix diretto fuori voce.
4. `src/features/auth/components/LoginForm.jsx`: 0 `autoComplete` su email e password → STORY-046.
**Expected:** (1) Invio invia; (2) in readonly testo tipo "Il tuo <trainer> non ha ancora scritto note" con terminologia del modulo; (3) termine da `getTerminology` (PT trainer, GYM personal trainer, Soccer coach); (4) `autoComplete="username"` / `"current-password"`.
**Suggested fix:** come indicato per ciascun punto; (1) e (4) in STORY-046, (2) e (3) fix di una riga fuori sprint.
