# RankEX — Scrum Board

**Aggiornato:** 24 aprile 2026

---

## Definition of Done

- Codice scritto, revisionato e privo di dead code
- Nessun warning di lint bloccante
- Feature testata manualmente sul flusso principale e sui casi limite
- Documentazione (`CLAUDE.md`, `DR.md`, `SCRUM.md`) aggiornata se la feature cambia l'architettura o i flussi
- Branch `dev` aggiornato, CI green, merge su `main` solo dopo verifica

---

## Blockers — Dipendenze Esterne

| Item | Blocco |
|------|--------|
| Domini custom `app.rankex.app` / `admin.rankex.app` | Acquisto dominio |
| MFA super_admin (SMS) | Piano Firebase Blaze |
| Backup automatico Firestore | Piano Firebase Blaze |
| Test differenziati per `soccer_youth` | Cliente deve comunicare i test specifici |

---

## Sprint History

### Sprint 1 · Enterprise Security & CI/CD
- Firestore Security Rules deploy (da test mode a produzione)
- `.env.development` / `.env.production` separati e gitignored
- `useSessionTimeout` per ruolo (30 min → 7 gg)
- Audit log append-only (`/audit_logs`)
- Firebase Hosting multisito (rankex-app + rankex-admin)
- `DomainGuard` bidirezionale (solo production)
- CI/CD GitHub Actions (CI su dev+main, deploy su merge main)
- Progetto Firebase DEV separato (`rankex-dev`)
- API key restrizione dominio su Google Cloud Console

### Sprint 2 · Core Features & Brand
- Fix Y Balance bilaterale (formula DX+SX, variabili distinte per arto)
- Soccer Academy — fasce Piccoli/Senior (`StepFascia`, badge giallo, filtro)
- Note/Commenti trainer↔atleta (thread root + subcollection commenti)
- Scheda Allenamento multi-giorno (CRUD, archivio automatico, client read-only)
- PDF Export atleta (`window.print()`, zero dipendenze)
- Brand background CSS-only (multi-layer, frosted glass sidebar)

### Sprint 3 · Gamification & Dashboard Redesign
- Dashboard cliente — layout 2 colonne 40/60 + tab AVATAR mobile-only
- `AvatarPlaceholder` small/full, rank nei badge (non nell'avatar)
- `XPBar` prop `fullWidth`
- Leaderboard gruppo (oro/argento/bronzo, ordinamento per media o stat)
- Redesign curva XP/livellaggio (moltiplicatore 1.08×, tier campionamento/BIA)

### Sprint 4 · Group Analytics Hub
- `GroupDetailView` — 4 tab: GESTIONE / CLASSIFICA / ANALISI / CONFRONTO
- `GroupChampions` — campioni per disciplina
- `GroupAnalysis` — più migliorati + heatmap
- `GroupComparison` — selettore atleti + pentagon radar overlay

### Sprint 5 · Refactoring & Documentazione (corrente — apr 2026)
- ✅ Estrazione `ClientBadges.jsx` — badge row condivisa tra trainer e client dashboard
- ✅ Rimozione feature XP bonus scheda (era "rimandato", ora definitivamente rimossa)
- ✅ Pulizia dead code (`ring`, `rMt`, `rMl`, `StatPill`) in `AvatarPlaceholder`
- ✅ Design Review `docs/DR.md` — documento tecnico completo (sezioni 1-8, diagrammi Mermaid)
- ✅ `SCRUM.md` — board Scrum come documento vivente nel repo

---

## Sprint Corrente

**Sprint 5** — chiuso il 24 aprile 2026.

---

## Product Backlog

Ordinato per priorità e dimensione dello sforzo stimato.

### Epic: Gamification Avanzata *(medio termine — sprint brevi)*

| # | Item | Dimensione | Note |
|---|------|-----------|------|
| 1 | **Badge / Achievement** — prima sessione, primo rank-up, 10 presenze consecutive, personal best su test | M | Nessuna dipendenza esterna; dati già disponibili |
| 2 | **Streak presenze** — moltiplicatore XP per settimane consecutive senza assenze | S | Estende la logica streak già presente in `closeSessionUseCase` |
| 3 | **Obiettivi trainer** — target su test specifico per un cliente, notifica al raggiungimento | M | Richiede nuova subcollection `goals/` e logica di monitoring |

### Epic: Sistema Avatar + Negozio *(lungo termine — richiede design separato)*

| # | Item | Dimensione | Note |
|---|------|-----------|------|
| 4 | Struttura dati avatar (`avatar_modules`, `coins`, `avatarEquipped`, `avatarInventory`) | S | Solo schema Firestore + regole, nessuna UI |
| 5 | Set base default (testa/corpo/capelli/occhi/bocca/accessorio) gratuito per tutti | M | Richiede asset grafici |
| 6 | Sblocco per livello e per rank | S | Logica su `client.level` e `client.rank` già disponibili |
| 7 | Negozio con Monete — acquisto moduli | L | Nuova valuta `coins`, UI negozio client |
| 8 | Builder avatar — UI client | L | Composizione slot equipaggiati |
| 9 | Moduli org custom — flusso B2B | XL | Richiesta org → produzione RankEX → attivazione super admin |

### Epic: Calendario + Allenamento

| # | Item | Dimensione | Note |
|---|------|-----------|------|
| 10 | Integrazione scheda allenamento nel calendario | M | Link visivo tra slot e scheda attiva del cliente |

---

## Legenda dimensioni

| Sigla | Effort stimato |
|-------|---------------|
| S | 1–2 ore |
| M | mezzo giorno |
| L | 1 giorno |
| XL | 2+ giorni |
