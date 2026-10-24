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

<!-- Nuove voci aggiunte qui dal Tech Lead o dalla Retrospective -->

---
## [TD-004] Numerazione ADR/TD divergente tra `dev` e `feature/mobile-app`
**Data:** 2026-10-24 (trovato durante il design di EPIC-010)
**Cosa si è scelto di rimandare:** il riallineamento dei due file. Questo design ha
solo scelto numeri liberi su entrambi i rami (ADR-006…014, TD-004/005).
**Dettaglio:** su `dev` `docs/DECISIONS.md` ha `ADR-004` = "Log dei login falliti";
su `feature/mobile-app` `ADR-004` = "Processo di cancellazione dati" e `ADR-005` =
"Back button". `docs/TECH-DEBT.md` su `dev` arriva a TD-002, qui a TD-003. Al merge ci
saranno due ADR-004 diversi.
**Rischio se non risolto:** medio-basso. Riferimenti "vedi ADR-004" ambigui nei
commenti di codice e nel backlog (es. STORY-029 cita "ADR-004 cancellazione").
**Status:** OPEN. Al merge rinumerare uno dei due ADR-004 (es. login falliti →
ADR-015) e aggiornare i riferimenti.

---

## [TD-005] Rules `clients/{id}` non conoscono il modulo: `badges` scrivibile direttamente anche in org lipedema
**Data:** 2026-10-24 (ADR-008, EPIC-010)
**Cosa si è scelto di rimandare:** impedire a livello di rules che un trainer/org_admin
scriva `badges`/`badgeShowcase` su un paziente di un'org con `hasGamification: false`.
**Perché:** il gating della gamification è garantito nelle callable (ADR-008), che sono
l'unico percorso per xp/coins/streak/rank. `badges` è l'unico campo di gamification
ancora nella whitelist di update diretto (assegnazione manuale da `TrophiesSection`,
che in lipedema non è montata). Bloccarlo nelle rules richiederebbe un `get()` dell'org
in ogni update cliente, cioè una lettura in più su ogni scrittura misure/trofei di tutti
i moduli, per un campo cosmetico mai mostrato nel modulo, scrivibile solo da un membro
fidato della stessa org.
**Rischio se non risolto:** basso. Un dato spurio invisibile, nessun confine di
sicurezza attraversato. Diventa medio solo se un giorno il login paziente arriva in
lipedema e i badge vengono mostrati.
**Status:** OPEN

---

## [TD-006] Attestazione informativa non blocca le scritture dirette (misure) nelle org lipedema
**Data:** 2026-10-24 (ADR-015 §1, EPIC-010)
**Cosa si è scelto di rimandare:** il blocco "informativa non registrata" vale solo
per le callable `aggiungiValutazione` e `salvaBia`. Misure (peso/altezza, `updateDoc`
diretto da `useMisure`) restano salvabili anche senza `client.privacyNotice`. Le note
passano da callable, ma volutamente non sono bloccate.
**Perché:** le misure si scrivono direttamente, e le rules non conoscono il modulo
dell'org. Bloccarle richiederebbe un `get()` dell'org più un controllo su
`privacyNotice` nella rule di update cliente, quindi una lettura in più su ogni
scrittura di tutti i moduli, per un dato già raccolto nella stessa visita in cui di
norma si consegna l'informativa. Stessa causa di TD-005.
**Rischio se non risolto:** basso. L'obbligo informativo resta dell'org titolare;
l'attestazione è un aiuto tecnico, non la base del trattamento (art. 9(2)(h)).
Diventa medio se un'org lavora sistematicamente senza registrare l'informativa
(verificabile con una query sui pazienti senza `privacyNotice`).
**Status:** OPEN

