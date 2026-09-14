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

<!-- Nuove voci aggiunte qui dal Tech Lead o dalla Retrospective -->
