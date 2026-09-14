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

<!-- Nuove decisioni aggiunte qui dal Tech Lead -->
