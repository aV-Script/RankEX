# Technical Debt — RankEX

Debito tracciato esplicitamente dal Tech Lead (quando approva una scorciatoia) o dalla
Retrospective (quando emerge a posteriori). Non è una lista di "cose belle da avere" —
solo compromessi presi consapevolmente che andranno ripagati.

Formato:

```
## [TD-XXX] Titolo
**Data:**
**Cosa si è scelto di rimandare:**
**Perché:**
**Rischio se non risolto:**
**Status:** OPEN | RESOLVED
```

---

## [TD-001] 2 test firestore.rules falliscono, non collegati a nessun lavoro in corso
**Data:** 2026-09-14 (trovato durante il lavoro su EPIC-004, `npm run test:rules`)
**Cosa si è scelto di rimandare:** non sono stati toccati per non mischiare fix non
richiesti nel commit di una feature diversa (Obiettivi).
**Dettaglio:**
1. `Note del cliente > il client può creare un commento` — fallisce con
   PERMISSION_DENIED. Le rules attuali (`allow create: if canWrite(orgId)`) bloccano
   **qualunque** scrittura client sulle note, commenti inclusi — coerente con quanto
   CLAUDE.md dice nella sezione "Nota" ("il client è sempre in sola lettura... non può
   creare né commenti né note proprie"), ma il test è rimasto scritto per un
   comportamento precedente (client poteva commentare). O il test è da aggiornare, o —
   se il comportamento voluto è davvero "client può commentare" — le rules sono più
   restrittive del previsto.
2. `Client self-update > il client può aggiornare il proprio campo avatar` — fallisce
   con PERMISSION_DENIED. La rule attuale accetta `hasOnly(['wearable', 'avatarId',
   'badgeShowcase'])` ma il test scrive un campo chiamato `avatar` (non `avatarId`) —
   probabile rename mai propagato al test.
**Rischio se non risolto:** basso (i test falliscono in modo rumoroso, non silenzioso
— non è un buco di sicurezza nascosto, è "solo" un test rosso che chiunque lanci
`npm run test:rules` vede). Ma è lo stesso pattern di drift doc/codice trovato 3 volte
in Sprint #1/#2 (percentili, wearable, streak) — qui è drift test/codice invece che
doc/codice.
**Fix (2026-09-14):** entrambi erano il test sbagliato, non la rule — confermato che
il comportamento attuale (client mai può scrivere note, campo si chiama `avatarId`) è
quello voluto, documentato altrove, e coerente col resto del codice. Test aggiornati
di conseguenza in `tests/rules/firestore.rules.test.js`. **44/44 verdi** su emulatore.
**Status:** RESOLVED

---

## [TD-002] 2 test e2e falliscono su main da almeno il 3 agosto 2026
**Data trovato:** 2026-09-14 (verifica post-deploy prod di Obiettivi/Runbook)
**Non è una regressione di oggi** — confrontato l'errore del run E2E su questo push
(commit 708bf77) con l'ultimo E2E fallito su `main` prima di questa sessione (3 agosto,
commit c273002): stessi due test, stessa riga, stesso identico messaggio d'errore.
Girano rotti da 6+ settimane su ogni push a `main`, mai notato perché E2E non blocca
il deploy (gira indipendente da CI, vedi CLAUDE.md → deploy.yml).

**Dettaglio:**
1. `e2e/tests/clients.spec.js:20` — "ricerca testuale filtra i risultati": fallisce con
   `strict mode violation: getByPlaceholder(/cerca per nome/i) resolved to 2 elements`.
   Probabile causa: due input con lo stesso placeholder "Cerca per nome..." renderizzati
   contemporaneamente nel viewport di test (versione desktop + mobile del filtro?).
2. `e2e/tests/staff-readonly.spec.js:19` — "nessun bottone di modifica nella lista
   clienti": fallisce con `expect(addBtn).not.toBeVisible()` — il bottone
   "+ NUOVO CLIENTE" **è visibile** per `staff_readonly` su ClientsPage. Questo è un
   bug comportamentale reale, non solo un test fragile — `staff_readonly` non dovrebbe
   vedere controlli di modifica (principio ReadonlyGuard, CLAUDE.md → "Readonly mode").
**Rischio se non risolto:** basso/medio — il bottone probabilmente non porta a nulla di
scrivibile (le Cloud Function validano il ruolo comunque), ma è un'affordance UI
sbagliata visibile a un ruolo che non dovrebbe vederla da 6+ settimane in produzione.
**Fix (2026-09-14):**
1. `ClientsPage.jsx` — i due bottoni "+ NUOVO" (desktop sidebar + header mobile) e
   l'azione "Aggiungi cliente" nell'EmptyState (stesso leak, non coperto dal test ma
   stesso principio) ora avvolti in `ReadonlyGuard`/condizionati su `useReadonly()`.
2. `e2e/tests/clients.spec.js` — la duplicazione dell'input "Cerca per nome..." è
   **intenzionale** (sidebar desktop `hidden lg:flex` + header mobile `lg:hidden`,
   entrambi nel DOM sempre, Playwright non filtra per visibilità CSS di default) — non
   un bug di componente. Test corretto per scegliere esplicitamente `aside` (la sidebar
   desktop, visibile nel progetto Playwright "app" che gira su Desktop Chrome) invece
   di affidarsi all'ordine nel DOM.

Verificato in locale (non solo assunto): 44/44 rules verdi, i 2 e2e specifici passano
isolati e nel giro completo, `npm run build` + `npm run lint` + `vitest run` puliti.
Nel giro e2e completo (59 test contro rankex-dev reale, non emulatore) emerge ~1
fallimento isolato diverso a ogni run (`staff-readonly.spec.js:47` la prima volta,
`plans.spec.js:46` la seconda) — flakiness ambientale sotto carico sequenziale contro
Firebase reale, non collegata a questo fix (verificato: nessuno dei due tocca codice
di questo diff, entrambi passano da soli). Non tracciata come nuovo TD — comportamento
atteso di un giro e2e locale lungo contro un servizio reale, CI non lo mostra.
**Status:** RESOLVED

---

## [TD-003] Possibile componente `SlotCard` duplicato nel calendario trainer
**Data:** 2026-09-15 (trovato durante STORY-023, sweep `color+'NN'`, Sprint #8)
**Cosa si è scelto di rimandare:** non investigato a fondo — segnalato dall'agente
mentre fixava un'occorrenza del pattern in entrambi i file, fuori dallo scope di quel
task (sweep colori, non refactor struttura).
**Dettaglio:** `src/features/trainer/trainer-calendar/CalendarSidebar.jsx` e
`src/features/trainer/trainer-calendar/SlotCard.jsx` sembrano contenere una
definizione di componente `SlotCard` praticamente identica (stessa JSX, stesse prop,
stessa logica) in due file diversi — non verificato se sia dead code (uno dei due mai
importato) o drift copy-paste reale con entrambi in uso.
**Rischio se non risolto:** basso/medio — se è drift reale, un fix futuro al comportamento
delle slot card rischia di essere applicato a una sola delle due copie, riproducendo lo
stesso pattern di inconsistenza già documentato altrove nel progetto (vedi CLAUDE.md →
audit passati, file/feature duplicati).
**Verifica (2026-09-15, stessa sessione):** non era drift tra due copie live — era
codice morto su entrambi i lati. `TrainerCalendar.jsx` (l'unico consumer possibile di
un componente di rendering slot) importa solo `CalendarHeader`/`MonthView`/`WeekView`/
`DayView`/`SlotPopup`/i modal — mai `SlotCard` né `CalendarSidebar`. Grep su tutto
`src/` per entrambi gli identificatori: zero import in nessun file. `CalendarSidebar.jsx`
conteneva, nonostante il nome, una copia esatta del componente `SlotCard` (stessa
funzione `SlotCard({ slot, clients, onClick })`, stessa logica) — probabile corruzione
da un refactor passato, non un duplicato intenzionale. **Conseguenza scoperta insieme**:
la sezione Roadmap di CLAUDE.md descriveva un badge "Streak N" su `SlotCard.jsx` come
superficie UI reale — non lo era mai stata, quel file non è mai stato raggiungibile.
**Fix:** entrambi i file rimossi, insieme a `groups-page/GroupsSidebar.jsx` (stesso
controllo, stesso esito: zero import — trovato durante STORY-024). CLAUDE.md aggiornato
(albero cartelle + correzione sezione Streak). Verificato `npm run lint`/`build`/
`test:run` dopo la rimozione — nessuna regressione.
**Status:** RESOLVED

---
<!-- Nuove voci aggiunte qui dal Tech Lead o dalla Retrospective -->
