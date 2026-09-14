# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

**Goal:** _(non ancora aperto)_

**Story selezionate:** _—_

**Status board:**

| Task | Status | Note |
|------|--------|------|
| _—_  | _—_    | _—_  |

**Blockers:** _—_

---

## Piano sprint successivi (proposta Scrum Master, da confermare)

Sequenza indicativa, non calendarizzata — un solo sviluppatore, quindi ogni sprint parte
solo a chiusura del precedente. Priorità e ordine sono una proposta di ingegneria, non
una decisione di business: rivedere prima di aprire ciascuno sprint.

EPIC-003 (Streak presenze) ed EPIC-004 (Obiettivi trainer) sono **entrambe già
implementate** (vedi Storico sotto) — il piano originale che le indicava come prossimi
sprint è superato.

- **SPRINT #3 — Avatar + Negozio: discovery** (EPIC-005): solo scoping (Product
  Analyst + Tech Lead), niente codice — è l'epic più grande della roadmap e richiede
  validazione di valore/modello economico prima di iniziare l'implementazione.
- **Candidati minori** (filler, non meritano uno sprint dedicato da soli): EPIC-002
  (pulizia debito minore, P3), TD-001 (2 test rules preesistenti falliti), TD-002 (2
  test e2e preesistenti falliti, incluso un bug comportamentale reale — bottone
  "+ NUOVO CLIENTE" visibile a staff_readonly).

---

## Storico sprint chiusi

### SPRINT #2 — Obiettivi trainer (+ Runbook manuale fuori piano) — chiuso il 2026-09-14

**Goal:** implementare EPIC-004 (target percentile su un test, con scadenza,
achievement rilevato server-side) — deviazione dal piano originale, che puntava su
EPIC-003 (Streak presenze), risultata già implementata prima di aprire lo sprint.

**Completato:**
- STORY-008 — modello dati + rules (7 nuovi test rules verdi su emulatore)
- STORY-009 — UI trainer (solo vista trainer — client-side è fast-follow)
- STORY-010 — notifica achievement (rilevamento server-side in salvaCampionamento)
- EPIC-006 (Runbook manuale) — aggiunta fuori piano, richiesta dall'utente durante la
  verifica di STORY-009/010. Completata nella stessa finestra invece di rimandarla a
  un nuovo sprint: indipendente da Obiettivi, piccola abbastanza da non giustificare
  l'overhead di un sprint a parte.

**Deploy prod — 2026-09-14:**
Cloud Functions + rules lanciate a mano da terminale (bloccate dal classificatore auto
sul comando diretto `npm run deploy` — girate poi dall'utente), poi `dev` → `main` (mai
pushato su origin prima d'ora in questa sessione, 15 commit) → push accettato → CI +
deploy.yml automatico → hosting + rules su fitquest-60a09. Verificato via
`firebase functions:list` (funzioni presenti) e `gh run view` (CI success, Deploy to
Firebase success).

**E2E fallito sullo stesso push, ma confermato preesistente:** stessi 2 test falliti
già su `main` dal 3 agosto 2026 (stesso file, stessa riga, stesso errore — confrontato
run per run) — non una regressione di questo sprint. Loggato come TD-002, uno dei due
è un bug comportamentale reale (non solo test fragile): `staff_readonly` vede il
bottone "+ NUOVO CLIENTE" che dovrebbe essere nascosto.

**Non completato:** nessuno.

**Blockers:** nessuno.

**Tech debt emerso:** TD-002 (vedi sopra). TD-001 (2 test rules preesistenti, trovati
durante STORY-008) resta OPEN, non collegato a questo sprint.

**Prossimo sprint (candidati):** vedi "Piano sprint successivi" in cima al file.

---

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

_(Nota a posteriori: anche EPIC-003 si è rivelata già implementata all'apertura dello
Sprint #2 — vedi sopra. Stesso pattern, seconda volta di fila.)_

---

<!-- Ogni sprint chiuso viene appeso qui dallo Scrum Master -->
