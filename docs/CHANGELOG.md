# Changelog — RankEX

Gestito dal Release Manager, una voce per release verso `main`/produzione.

Formato:

```
## [vX.Y] — <data>
### Features
### Bug Fixes
### Known Issues
### Breaking Changes
### Rollback plan
```

---

## [Backend] — 2026-09-14

### Features
- Obiettivi trainer (EPIC-004): `aggiungiObiettivo`/`annullaObiettivo` (Cloud
  Functions) + achievement rilevato server-side in `salvaCampionamento` + rules
  `clients/{clientId}/goals`.
- Runbook manuale (EPIC-006): rules `qa_runs` (top-level, solo super_admin).

### Deploy
- Cloud Functions → **fitquest-60a09** (prod), verificato via `firebase
  functions:list` — `aggiungiObiettivo`/`annullaObiettivo` presenti, `salvaCampionamento` ridistribuita.
- `firestore.rules` → **fitquest-60a09** (prod).
- `dev` pushato su origin (14 commit) → CI + deploy automatico su rankex-dev.

### Known Issues
- **Il frontend NON è ancora live su prod.** Il deploy di oggi ha coperto solo
  Cloud Functions + rules (lanciati manualmente da terminale, fuori dalla CI). La
  UI (tab Obiettivi, pagina Runbook) è build-ata e verificata su dev, ma non è mai
  stata pushata a `main` — l'hosting prod (`rankex-app.web.app`/`rankex-admin.web.app`)
  serve ancora la build precedente. Il backend è quindi pronto e raggiungibile, ma
  irraggiungibile da UI finché il frontend non arriva su prod.
- Nessun commit di questa sessione era mai stato pushato su origin prima di oggi —
  14 commit locali esistevano solo su questa macchina.

### Rollback plan
Cloud Functions: `git checkout <commit precedente> -- functions/` poi
`cd functions && npm run deploy`. Rules: `npm run deploy:rules` dopo checkout dello
stato precedente di `firestore.rules`. Nessun dato scritto da queste funzioni in
produzione finché il frontend non le raggiunge — rollback a basso rischio.

---

<!-- Nuove release aggiunte qui dal Release Manager -->
