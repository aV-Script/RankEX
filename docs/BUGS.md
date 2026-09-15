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

## [BUG-001] `eliminaCliente` lasciava orfane le subcollection `notes`/`goals`
**Severity:** P1 (rilevanza GDPR — non solo storage sprecato: un cliente "cancellato"
manteneva di fatto dati personali/note in Firestore, irraggiungibili dall'app ma non
eliminati)
**Modulo/Ruolo:** trainer/org_admin — cancellazione cliente (`functions/src/callable/
eliminaCliente.js`)
**Status:** FIXED (non ancora deployato — vedi `docs/DECISIONS.md` → ADR-004)
**Reproduction steps:** creare un cliente con almeno una nota e un obiettivo, poi
eliminarlo da `ClientDashboard` → menu overflow → Elimina.
**Expected:** nessun dato residuo del cliente in Firestore dopo la cancellazione.
**Actual:** `batch.delete(clientRef)` cancellava solo il documento padre
`organizations/{orgId}/clients/{clientId}` — Firestore non cancella le subcollection
di un documento eliminato automaticamente, quindi `clients/{clientId}/notes/{noteId}`
e `clients/{clientId}/goals/{goalId}` restavano scritte, solo non più raggiungibili
dall'app (il path passa dal documento padre, ormai inesistente, ma i documenti figli
esistono ancora ed è comunque possibile raggiungerli con una query diretta o con
l'Admin SDK).
**Trovato durante:** STORY-021 (EPIC-008, Privacy & Compliance) — verificando se il
processo di cancellazione manuale esistente fosse sufficiente per rispondere a una
richiesta di cancellazione GDPR, non durante un giro di QA dedicato.
**Fix:** sostituito `batch.delete(clientRef)` con `await db.recursiveDelete(clientRef)`
(Admin SDK, disponibile da `firebase-admin` v9.7+, già su `^12.0.0` in questo repo) —
chiamato dopo il commit del batch (che gestisce ancora `users/{uid}`, `clientCount`,
rimozione dai gruppi). Verificato solo con `node --check` (sintassi) — **non ancora
verificato contro l'emulatore o rankex-dev**, da fare prima del deploy in produzione.
