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
**Status:** OPEN

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
**Status:** OPEN

---

<!-- Nuove voci aggiunte qui dal Tech Lead o dalla Retrospective -->
