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
**Status:** OPEN
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
**Status:** OPEN
**Reproduction steps:**
1. Login staff_readonly → apri un cliente/paziente → menu ⋮.
2. ELIMINA → conferma.
**Expected:** azione nascosta in readonly (ReadonlyGuard), come gli altri controlli di modifica.
**Actual:** la voce ELIMINA è visibile e il dialog si apre; la Cloud Function rifiuta (toast "Permessi insufficienti", 403), nessun dato toccato.
**Suggested fix:** in `ClientDashboard.jsx` non passare `onRequestDelete` (o nascondere il menu) quando `readonly`; per i moduli senza PDF/reset il menu ⋮ può sparire del tutto.

## [BUG-005] Soccer: tab BIA visibile nella dashboard allievo nonostante `hasBia: false`
**Severity:** P3
**Modulo/Ruolo:** soccer_academy — trainer (preesistente; ora c'è una capability esplicita che non viene usata)
**Status:** OPEN
**Reproduction steps:** org soccer → apri un allievo → tab bar.
**Expected:** nessuna tab BIA (CLAUDE.md: "Soccer academy: solo `tests_only`. BIA non supportata"; `MODULE_CAPABILITIES.soccer_academy.hasBia = false`).
**Actual:** tab BIA presente (ATLETA, TEST, BIA, ALLENAMENTO, …). Era così anche prima del commit.
**Suggested fix:** in `dashboardTabs.js` dare a `bia` `capability: 'hasBia'` e aggiornare `clientDashboardTabs.test.js`.
