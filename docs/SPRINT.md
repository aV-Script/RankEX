# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

## SPRINT #1 — Correttezza dati e sicurezza residua

**Goal:** chiudere i due problemi con impatto diretto su dati reali/sicurezza già
documentati in CLAUDE.md, prima di aprire qualunque nuova feature.

**Story selezionate:** STORY-001, STORY-002 (EPIC-001, entrambe P1)
**Filler se avanza tempo (non impegnate):** STORY-003, STORY-004 (EPIC-002, P3)

**Status board:**

| Task | Status | Note |
|------|--------|------|
| STORY-001 — rollback percentili soccer (4 test) | READY | branch `calibrazione-percentili-soccer` già pronto, serve merge + verifica + redeploy Cloud Functions |
| STORY-002 — chiudere RX-63 (accessToken wearable) | READY | eseguire `scripts/check-wearable-tokens.mjs` per primo, decide il resto della story |

**Blockers:** nessuno — entrambe le story sono sbloccate e partono da lavoro già fatto (branch pronto / script pronto).

---

## Piano sprint successivi (proposta Scrum Master, da confermare)

Sequenza indicativa, non calendarizzata — un solo sviluppatore, quindi ogni sprint parte
solo a chiusura del precedente. Priorità e ordine sono una proposta di ingegneria, non
una decisione di business: rivedere prima di aprire ciascuno sprint.

- **SPRINT #2 — Streak presenze** (EPIC-003): prima feature nuova della roadmap
  "Gamification avanzata". Parte da STORY-005 (definizione regola) perché sblocca le
  altre due.
- **SPRINT #3 — Obiettivi trainer** (EPIC-004): coach fissa target su test specifico,
  notifica al raggiungimento.
- **SPRINT #4 — Avatar + Negozio: discovery** (EPIC-005): solo scoping (Product
  Analyst + Tech Lead), niente codice — è l'epic più grande della roadmap e richiede
  validazione di valore/modello economico prima di iniziare l'implementazione.

EPIC-002 (pulizia debito minore, P3) resta in backlog libero, da assorbire come filler
in uno qualsiasi degli sprint sopra se avanza tempo — non merita uno sprint dedicato.

---

## Storico sprint chiusi

<!-- Ogni sprint chiuso viene appeso qui dallo Scrum Master -->
