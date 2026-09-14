# Architecture Decision Log — RankEX

Log append-only delle decisioni tecniche non ovvie, gestito dal Tech Lead. Non è un
duplicato di CLAUDE.md — CLAUDE.md descrive lo stato attuale del sistema, questo file
registra *perché* si è arrivati a una decisione, per non doverla ridiscutere da zero
la prossima volta che sembra "strana".

Formato:

```
## [ADR-XXX] Titolo
**Data:**
**Contesto:**
**Decisione:**
**Alternative scartate:**
**Conseguenze:**
```

---

## [ADR-001] Obiettivi trainer — architettura
**Data:** 2026-09-14
**Contesto:** EPIC-004, prima feature nuova costruita da zero in questo processo (le
precedenti erano tutte verifiche). Nessun modello dati preesistente da cui partire.
**Decisione:**
- Subcollection `clients/{clientId}/goals/{goalId}`, non collection top-level — stesso
  pattern di `notes`, coerente con "dati specifici di un cliente vivono sotto il
  cliente".
- Scrittura via Cloud Function (`aggiungiObiettivo`/`annullaObiettivo`), non
  `updateDoc` diretto — anche se il dato in sé (target+scadenza) non è "sensibile"
  come XP/percentili, è lo stesso pattern già usato per le note (basso rischio ma
  comunque via callable) — seguito per coerenza, non per necessità stretta.
- **Achievement rilevato dentro `salvaCampionamento`**, non con un nuovo trigger o
  Cloud Function schedulata — il percentile è già calcolato lì server-side, verificare
  gli obiettivi attivi nello stesso batch evita di introdurre un secondo punto di
  scrittura sullo stesso dato e non richiede nuova infrastruttura (nessun cron/trigger
  esiste ancora nel progetto per questo genere di cosa).
- **`status: 'missed'` non è salvato**, calcolato al volo confrontando `deadline` con
  oggi (`utils/goals.js`) — evita un cron dedicato solo a marcare la scadenza. Trade-
  off accettato: un obiettivo scaduto resta `status: 'active'` in Firestore finché
  qualcosa non lo tocca di nuovo (achievement tardivo o annullamento manuale) — la UI
  lo mostra comunque come "Scaduto", quindi non è un problema per l'utente finale.
- **Notifica solo al client, non al trainer** — non è stata una scelta, è un vincolo:
  lo schema `notifications` (`{ clientId, message, ... }`) non ha mai supportato un
  destinatario trainer, è un concetto che semplicemente non esiste nell'infrastruttura
  attuale. Se in futuro serve, è un cambio di schema più ampio, fuori scope qui.
**Alternative scartate:** Cloud Function schedulata (pub/sub cron) per marcare i
`missed` — scartata per lo stesso motivo di "non introdurre infrastruttura nuova per
un problema risolvibile a lettura".
**Conseguenze:** se in futuro serve sapere "quanti obiettivi sono scaduti" con una
query Firestore diretta (es. per una dashboard aggregata), lo stato lazy non lo
permette — richiederebbe comunque un giro per scriverlo. Non è un problema per l'uso
attuale (lista per singolo cliente, calcolata client-side).

---

## [ADR-002] Avatar + Negozio — discovery senza implementazione
**Data:** 2026-09-14
**Contesto:** EPIC-005 (Sprint #3), il pezzo più grande della Roadmap futura. La
roadmap stessa impone "allinearsi con il team prima di iniziare" — vincolo esplicito
contro il partire diretti con codice, a differenza di EPIC-004/EPIC-006 dove la
specifica era già abbastanza chiara da poter procedere.
**Decisione:** fare solo discovery (valutazione Product Analyst + scoping tecnico
Tech Lead), zero codice scritto, indipendentemente dallo slancio delle sessioni
precedenti in questo stesso processo (Obiettivi, Runbook, TD-001/TD-002 erano tutti
scope chiaro e action-able da subito — questo non lo è).
**Perché non si procede comunque con un MVP ridotto:** a differenza di feature
precedenti dove "MVP più piccolo" era una scelta tecnica (es. Runbook: meccanismo
prima, contenuto dopo — poi il team ha scelto di fare entrambi insieme), qui il
blocco non è di complessità tecnica ma di **dipendenze esterne reali**: asset
grafici (nessun artista/budget noto), bilanciamento economia (richiede playtesting,
non stimabile), flusso B2B (richiede clienti org interessati, fuori dal controllo
dell'ingegneria). Costruire comunque uno scheletro tecnico senza queste risposte
produrrebbe codice che non si sa se verrà mai usato con contenuti reali — lo stesso
rischio di "costruita e mai raggiunta" che CLAUDE.md documenta già per Wearable/
ContextNav/ClientHUD (roadmap → Product Analyst, criterio esplicito).
**Conseguenze:** EPIC-005 resta in backlog, scoping pronto (`docs/BACKLOG.md` →
STORY-011/012/013) per essere ripreso non appena le domande aperte hanno risposta.
Non blocca gli sprint successivi — sono indipendenti.

---

## [ADR-003] Avatar + Negozio — spike tecnico, override esplicito di ADR-002
**Data:** 2026-09-14
**Contesto:** dopo ADR-002 (raccomandazione di non procedere), presentate 3 opzioni
all'utente via domanda esplicita — parcheggiare, rispondere alle domande aperte, o
spike tecnico senza arte reale. L'utente ha scelto lo spike, **con il rischio
esplicitamente segnalato** ("rischia di restare codice mai davvero raggiunto come già
successo a Wearable/ContextNav") visibile nell'opzione scelta.
**Decisione:** costruito uno spike che valida la meccanica economica (la parte
davvero incerta tecnicamente, per la mia stessa analisi in STORY-012) **senza**
inventare il sistema a 6 slot della visione completa, per cui non esiste arte — si
riusano le 9 immagini avatar già esistenti (`config/avatars.config.js`), con regole
di sblocco demo (livello/acquisto) applicate per suffisso id.
**Scope deliberatamente ridotto rispetto alla visione completa:**
- Monete guadagnate **solo** da sessione presente (`chiudiSessione`) — non da
  rank-up/achievement/streak come nella visione completa, per limitare la superficie
  di modifica a una sola Cloud Function invece di quattro nello spike.
- Nessuna collection `avatar_modules` — regole di sblocco in config (client +
  copia server minimale `avatarUnlocks.js`), non un catalogo gestibile da super_admin.
- Nessun flusso B2B org-custom — resta genuinamente bloccato su una org cliente
  reale, lo spike non lo risolve né tenta di farlo.
**Verificato dal vivo, non solo per lettura di codice:** script one-off contro
rankex-dev (auth REST + invocazione diretta della callable) — rifiuto corretto per
avatar non acquistabile, rifiuto corretto per Monete insufficienti, acquisto riuscito
con decremento Monete e inventario aggiornato, doppio acquisto bloccato
(`already-exists`). Dati di test ripuliti dopo la verifica.
**Conseguenze:** se questo spike non porta a validazione reale (playtest, feedback,
decisione su arte/B2B), è candidato esplicito a rimozione come codice morto in un
futuro audit — esattamente il rischio segnalato in fase di scelta, non nascosto.

---

<!-- Nuove decisioni aggiunte qui dal Tech Lead -->
