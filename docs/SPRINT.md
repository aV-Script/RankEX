# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

## SPRINT #2 — Obiettivi trainer

**Goal:** implementare EPIC-004 (target percentile su un test, con scadenza,
achievement rilevato server-side) — deviazione dal piano originale, che puntava su
EPIC-003 (Streak presenze), risultata già implementata prima di aprire lo sprint.

**Story selezionate:** STORY-008, STORY-009, STORY-010 (EPIC-004, tutte P2)

**Status board:**

| Task | Status | Note |
|------|--------|------|
| STORY-008 — modello dati + rules | DONE | 7 nuovi test rules verdi su emulatore |
| STORY-009 — UI trainer | DONE | solo vista trainer — client-side è fast-follow, non in questo sprint |
| STORY-010 — notifica achievement | DONE | rilevamento server-side in salvaCampionamento |

**Deploy:** Cloud Functions + firestore.rules già su **rankex-dev**. **Non ancora su
prod** — in attesa di verifica funzionale dell'utente prima del deploy su
fitquest-60a09 (disciplina Release Manager).

**Blockers:** nessuno per il codice — sprint tecnicamente completo, resta la verifica
utente + deploy prod come passo esplicito prima di chiudere.

**Nota:** durante questo sprint trovato TD-001 (2 test rules preesistenti falliti, non
collegati a Obiettivi) — loggato in `docs/TECH-DEBT.md`, non risolto qui per non
mischiare fix non richiesti nel commit della feature.

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

### SPRINT #1 — Correttezza dati e sicurezza residua — chiuso il 2026-09-14

**Goal:** chiudere i due problemi con impatto diretto su dati reali/sicurezza già
documentati in CLAUDE.md, prima di aprire qualunque nuova feature.

**Completato:**
- STORY-001 — rollback percentili soccer (4 test): **già risolto** prima dell'apertura
  dello sprint (branch mergiato in dev il 09/05, ulteriore fix 01/07). Nessun codice
  toccato, nessun deploy — solo verifica + correzione di CLAUDE.md, che non era mai
  stato aggiornato dopo il merge.
- STORY-002 — chiusura RX-63 (accessToken wearable): 0 client coinvolti su dev+prod.
  Nessuna azione di codice necessaria (il campo resta nello schema per un'eventuale
  riattivazione futura, remediation già documentata per quel momento).

**Non completato:** nessuno — entrambe le story P1 chiuse, EPIC-002 (P3, filler) non
toccata, resta in backlog libero.

**Blockers:** nessuno.

**Tech debt emerso — non di codice, di processo:** entrambe le story P1 di questo
sprint erano *già risolte* quando lo sprint è stato pianificato — il Product Owner le
aveva costruite leggendo sezioni di CLAUDE.md rimaste non aggiornate dopo il lavoro
reale (percentili: merge del 09/05 mai riportato in doc; wearable: già noto, RX-63 era
comunque da verificare non da presumere risolto). **Causa radice:** CLAUDE.md non ha
un trigger che lo marchi "da rivedere" quando lo stato che descrive cambia — dipende
dalla disciplina di chi fa il merge nell'aggiornarlo nello stesso commit. Non è un
problema nuovo: CLAUDE.md stesso documenta più round di audit passati con lo stesso
pattern (file/feature rimossi ma mai tolti dalla documentazione). Da tenere a mente per
la prossima Retrospective: vale la pena una story dedicata a un controllo periodico di
coerenza CLAUDE.md↔codice, invece di scoprirlo story per story.

**Prossimo sprint (candidati):** SPRINT #2 — Streak presenze (EPIC-003), come da piano
originale — nessuna revisione necessaria, EPIC-003/004/005 non toccate da quanto emerso
qui.

---

<!-- Ogni sprint chiuso viene appeso qui dallo Scrum Master -->
