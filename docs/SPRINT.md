# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta. Qui stanno lo sprint corrente e l'ultimo chiuso con la sua retro;
gli sprint più vecchi sono in `docs/SPRINT-ARCHIVE.md` (non vanno cancellati: serve alla Retrospective).

---

## Sprint corrente

# SPRINT #24 — Interfaccia, prima ondata (design e stati, Lipedema) — aperto il 2026-11-27

**Goal:** i componenti comuni seguono le tavole della review 1 (contrasto di neutral e danger, toast, modal dal basso su mobile,
eliminazione con conferma del nome, sessione con conto alla rovescia), il modulo Lipedema non mostra più "Allenamento",
"Trainer" o "Clienti", `index.html` non resta in cache dopo un deploy, e il segnale dei test torna pulito (BUG-042 e
`lipedema.spec.js:103`). Se QA e pre-flight sono verdi, rilascio `dev → main` (solo hosting, con via libera).

**Fonti:** review 1 `https://claude.ai/artifact/4GMo38ECoouHK71CPLPcpd`, review 2
`https://claude.ai/artifact/WTgVYpedaBdKX8RtPaTn78`; story in `docs/BACKLOG.md` → EPIC-012. Decisione: lo sprint tocca solo
le aree già passate in review (design/stati e Lipedema). Le proposte della review 2 (STORY-061…063) e le BASSA della review 1
(STORY-058) non entrano: sono da decidere.

**Branch:** `feature/lipedema-module`, HEAD = `origin/dev` = `93669ec` all'apertura (`git rev-parse` 27/11), più i docs di
questa sessione (non ancora committati). Prod: hosting + rules `924734d`, functions `478a157` (codice `fb08a28`), 40 callable
`nodejs22`. Non tracciati `lipidemia/`, `mobile-app/`.

**Vincoli:** nessuna modifica a `firestore.rules` né a `functions/`; ogni passo su prod con via libera, un comando per chiamata;
dati Lipedema: nessun nome di paziente o dato dell'org reale in docs, commit o spec.

## Voci dello sprint
| # | ID | Taglia | Chi | Review | Stato |
|---|----|--------|-----|--------|-------|
| 1 | Retro #23 AI 4: ADR in `docs/DECISIONS.md` sullo sblocco Lipedema senza DPA (rischio accettato 27/11) + orgId dell'org reale in CHANGELOG `[2026.11.27.2]` | S | sessione principale | - | TODO (orgId: lo fornisce l'utente) |
| 2 | Retro #23 AI 5: regola in `.claude/agents/scrum-master.md` (voci con Chi = utente: chiedere "fatto fuori sessione?" prima della chiusura) | S | sessione principale | - | TODO |
| 3 | STORY-060 no-cache `index.html` (`firebase.json`), provato su rankex-dev con `curl -I` | S | sessione principale | controllo AC | TODO |
| 4 | STORY-052 contrasto neutral/danger + STORY-054 modal dal basso (stesso file `ui/index.jsx`) | S+S | developer | /code-review medium | TODO |
| 5 | STORY-053 toast + STORY-056 sessione in scadenza | S+S | developer | /code-review medium | TODO |
| 6 | STORY-055 eliminazione con conferma del nome | S | developer | /code-review high (cancellazione dati) | TODO |
| 7 | STORY-059 terminologia Lipedema residua | S | developer | /code-review medium | BLOCKED: parola per "allenamento" da decidere (proposta "Esercizi") |
| 8 | Retro #23 AI 2: BUG-042, `e2e/qa-dev/tests/lipedema.spec.js:103` instabile, login lento nel global setup di `qa:dev` | S | developer | controllo AC + test verdi | TODO |
| 9 | QA dal vivo sul nuovo (1366 e 360×640) su rankex-dev, `qa:dev` completo dopo l'ultimo deploy dev | - | sessione principale | - | TODO |
| 10 | Rilascio `dev → main` (solo hosting), CHANGELOG, smoke sola lettura | - | sessione principale | - | TODO (via libera) |

Ordine: 1-3 subito (docs e config), poi 4 → 5 → 6 → 7 con un agente `developer` per voce, 8 in parallelo; 9 solo dopo l'ultimo
deploy dev, mai in parallelo a un deploy; 10 con via libera.

## Tabella ambiente/modulo — voce 3 (STORY-060)
| Caso | dev | UAT | prod |
|------|-----|-----|------|
| `index.html` e route riscritte (`firebase.json:24` e `:46`, rewrite `**` → `/index.html`; regola `**` `:31-39` e `:53-60` senza `Cache-Control`) | oggi default hosting `max-age=3600` (visto il 27/11) → dopo `no-cache`, da provare con `curl -I` su rankex-app-dev e rankex-admin-dev | nessun deploy UAT nel repo: non verificato | come dev, dopo il merge su `main` (`deploy.yml` → `deploy-prod`) |
| Asset con hash (`firebase.json:27-28`, `:49-50`) | `public,max-age=31536000,immutable`: invariato | non verificato | invariato |
| Moduli | nessuna differenza: header di hosting, uguali per PT/GYM/Soccer/Lipedema | - | - |

## Tabella ambiente/modulo — voce 6 (STORY-055)
| Modulo | Cosa elenca il dialog (capability da `config/modules.config.js:82-92`) | dev / prod |
|--------|-------------------------------------------------------------------|------------|
| PT / GYM (`personal_training`) | account (`hasClientLogin`), campionamenti (`hasPercentileTests`), BIA, note, obiettivi | uguale: nessun flag d'ambiente in `DeleteDialog.jsx:31-47` |
| Soccer | account, campionamenti, note, obiettivi (niente BIA) | uguale |
| Lipedema | valutazioni (`hasAssessments`), BIA, note; niente account né obiettivi; "paziente" da `terminology.client` (`ClientDashboard.jsx:528`) | uguale |
| Legacy `moduleType` null | mappato a PT nei punti di ingresso (`TrainerView`), come PT | uguale |
Flag riletti in `modules.config.js:80-93` all'apertura (27/11); il developer li riconferma prima di implementare.

## Tabella ambiente/modulo — voce 7 (STORY-059)
| Caso | PT / GYM / Soccer | Lipedema | dev / prod |
|------|-------------------|----------|------------|
| Tab scheda (`client-dashboard/ClientDashboardHeader.jsx:15` label fissa "Allenamento", `dashboardTabs.js:14`) | "Allenamento" invariato | parola decisa dall'utente | uguale, nessun flag d'ambiente |
| Barre utilizzo dettaglio org (`admin/admin-pages/OrgDetailView.jsx:254,261`) | PT "Trainer/Clienti", GYM e Soccer dalla loro terminologia | "Professionisti/Pazienti" | uguale |
| "Creato il" (`OrgDetailView.jsx:229`) | stesso fix per tutti i moduli | idem | uguale |

---

## Sprint chiuso (storico)

# SPRINT #23 — Go-live Lipedema in prod — aperto il 2026-11-27, chiuso il 2026-11-27 (goal raggiunto, in prod; qa:dev 65/66, E2E rosso per BUG-042, 3 difetti UI del modulo non registrati)

**Goal:** Lipedema selezionabile in prod dal super_admin, provato con uno smoke test su un'org temporanea poi cancellata
(residui = 0), e prima org Lipedema reale creata con il suo org_admin quando l'utente dà il via libera.

**Decisione utente (27/11):** sblocco anche senza DPA approvato (il manager lo sta ancora visionando): STORY-029 (b)/(c)
restano BLOCKED, rischio accettato dall'utente. La creazione dell'org reale (voce 11) ha un via libera a sé; nessun dato
reale inserito da noi. Piano dell'org reale: pro. Backup da dichiarare: 7 giorni.

**Branch:** `feature/lipedema-module`. Prod all'apertura: hosting + rules `53b5579`, functions `478a157` (codice
`fb08a28`), 40 callable `nodejs22` (CHANGELOG `[2026.11.27]`). Non tracciati `lipidemia/`, `mobile-app/`.

**Vincoli:** ogni passo su fitquest-60a09 (merge su `main`, creazione/cancellazione org) con via libera, uno per passo;
comandi su prod mai concatenati con altri (retro #22); nessuna modifica a `firestore.rules`; niente functions in questo
rilascio (solo hosting).

## Voci dello sprint
| # | ID | Taglia | Chi | Review | Stato |
|---|----|--------|-----|--------|-------|
| 6 | Sblocco `IS_LIPEDEMA_SELECTABLE = true` + test + CLAUDE.md + TP-087 aggiornato + TP-095 go-live (blocker) | S | sessione principale | /code-review medium | DONE `f87220b` + nit `5c7f6c6` (lint, unit 758/758, build ok) |
| 7 | Review medium voce 6 | code-reviewer | - | - | DONE: APPROVED, 0 important; nit TP-095 passo 3 corretto (`5c7f6c6`); ogni passo di TP-095 ha un file:riga nella UI |
| 8 | Push dev, `qa:dev` completo, passi TP-095 provati su `qa-lipedema` (rankex-dev) | - | sessione principale | - | PARZIALE: push `5c7f6c6`, CI 46019800750 ok, deploy-dev 46019977554 ok (14:54 UTC); `qa:dev` 1° tentativo fermo nel global setup (login timeout, nessun test eseguito), 2° tentativo **65/66**: rosso `lipedema.spec.js:103` "chiude un appuntamento" (evento non apribile dal giorno, screenshot con l'appuntamento a 06:00), poi `lipedema.spec.js` da solo **6/6** → instabile, non legato allo sblocco. E2E 46019800726 rosso solo per BUG-042. TP-095 su dev (27/11, script Playwright + Admin SDK con l'account super_admin di test `E2E_SUPERADMIN_*` di `.env.test`, su `rankex-admin-dev`): passo 1 **PASS** (select NUOVA PT/Soccer/Lipedema, terminologia lipedema, doc `moduleType: lipedema`, `plan: free`; dettaglio "Lipedema Edition", utilizzo 0/1 e 0/10); passo 2 **PASS** (`smoke.20261127@test.rankex` trainer, `mustChangePassword: true`, `memberCount` 1, al primo login su rankex-app-dev chiede il cambio password); passo 7 **PASS** (ELIMINA disabilitato senza nome, org sparita dalla lista); passo 8 **PASS** (orgId `smoke-lipedema-20261127-v23e1`: 0 utenti Auth, nessun doc org né subcollection, 0 `users` con quell'orgId; audit `org.deleted`). Passi 3-6 (paziente e valutazioni) già coperti da `qa:dev` lipedema |
| 9 | Rilascio sblocco: merge `dev → main` + push (solo hosting) | - | sessione principale | - | DONE: fast-forward `53b5579..924734d` (18:34 UTC), CI 46050536550 ok, `deploy-prod` 46050713909 ok (18:36:51); `version.json` `1795804596665` su entrambi i siti, CSP/XFO ok; banner RICARICA comparso sulla build vecchia; select con Lipedema su rankex-admin. Smoke sola lettura #22 PASS (CHANGELOG `[2026.11.27]`) |
| 10 | Smoke test prod su org temporanea `smoke-lipedema-20261127` + cancellazione + residui | - | sessione principale + utente | - | DONE passi 1-8 PASS su `smoke-lipedema-20261127-uo9gk` (dettaglio in CHANGELOG `[2026.11.27.2]`); passo 8 (residui in Console) verificato dall'utente: residui 0 |
| 11 | Org Lipedema reale + org_admin (nome, email da fornire) | - | utente | - | DONE (27/11): creata dall'utente in prod con i suoi dati, DPA ancora in revisione (rischio accettato). orgId **da annotare** (dall'utente, da Console) |
| 12 | STORY-029 (b)/(c) in BACKLOG solo se confermati; CHANGELOG | - | sessione principale | - | DONE: STORY-029 aggiornata, (b)/(c) BLOCKED; CHANGELOG `[2026.11.27.2]` RILASCIATO |

## Tabella ambiente/modulo — voce 6 (sblocco)
| Caso | dev | UAT | prod |
|------|-----|-----|------|
| Select modulo in NUOVA (`CreateOrgForm.jsx:97` → `getSelectableModuleOptions()`, `modules.config.js:37-40`) | oggi PT/Soccer/Lipedema (`IS_LIPEDEMA_SELECTABLE = isDev`, `:30`; `isDev` = `VITE_ENV === 'development'`, `utils/env.js:3`): invariato | oggi PT/Soccer → dopo PT/Soccer/Lipedema; nessun deploy UAT nel repo: non verificato | oggi PT/Soccer → dopo PT/Soccer/Lipedema |
| Select modulo nel dettaglio org (`OrgDetailView.jsx:63`, con `isModuleChangeAllowed` `:62,114`) | invariato | come prod, non verificato | Lipedema offerto; cambio da/verso lipedema solo con org senza clienti (UI `:62,114` + rules `isAllowedModuleChange` `firestore.rules:80,151`) |
| PT / Soccer / GYM / legacy null | nessun effetto (cambia solo l'opzione lipedema) | idem | idem |
| Lipedema | org esistenti (`qa-lipedema`) invariate | - | nessuna org lipedema in prod (da confermare in Console, sola lettura) |


## Goal
Lipedema selezionabile in prod dal super_admin, provato con smoke test su org temporanea cancellata (residui 0), prima org reale
creata. **Raggiunto**: sblocco in prod il 27/11/2026 (`924734d`), TP-095 passi 1-8 PASS in prod, residui 0 verificati dall'utente in
Console, org reale creata dall'utente (orgId ancora da annotare).

## Chiusura sprint

**Stato del repo a fine sprint (da CHANGELOG `[2026.11.27.2]` e voci sopra):** hosting + rules prod = `924734d` (fast-forward
`53b5579..924734d`, CI 46050536550, `deploy-prod` 46050713909); functions prod invariate a `478a157`, 40 callable `nodejs22`; rules,
indici e `functions/` non toccati. HEAD locale `93669ec` ha in più solo docs.

### Completato
- **Voci 6, 7, 9, 10, 12 DONE; 8 PARZIALE; 11 DONE fuori sessione** (l'utente ha creato l'org reale da solo dopo che la voce era stata
  scritta come rinviata). Sblocco `IS_LIPEDEMA_SELECTABLE = true` con test e TP-095; smoke test prod passi 1-8 PASS; org temporanea
  cancellata, residui 0.

### Non completato (motivo)
- Voce 8: `qa:dev` non verde a pieno (65/66, `lipedema.spec.js:103` instabile, 6/6 da solo) e 1° tentativo fermo nel global setup (login
  timeout). Passi 3-6 di TP-095 su dev non rifatti a mano: coperti da `qa:dev`.
- Dal #22: AI 1 (BUG-042, E2E ancora rosso) e AI 4 (BUG-039/040 + test di scansione terminologia) **non eseguiti**: lo sprint è stato
  interamente dedicato al go-live. BUG-039/040/041/042 restano OPEN.

### Non verificato
| Cosa | Motivo / stato |
|------|----------------|
| orgId dell'org Lipedema reale | da annotare dall'utente (Console); in docs solo l'orgId |
| Costi Firebase a 24 ore dal deploy | non controllati |
| `qa:dev` verde completo sull'ultimo hosting dev | ultimo esito 65/66 + rerun 6/6, non un run pieno verde |
| Causa del 1° `qa:dev` fermo nel login del global setup | non indagata (rete/hosting o utente QA?) |
| Terminologia GYM, UAT, rollback functions prod (TD-015), STORY-029 (b)/(c) | invariati (già accettati / BLOCKED) |

### Blockers
- Nessuno sul codice. STORY-029 (b)/(c) BLOCKED: l'org reale esiste in prod senza DPA approvato (rischio accettato dall'utente).

### Tech debt / difetti emersi (non a backlog al 27/11)
- **Tab "ALLENAMENTO" nella scheda paziente Lipedema** (contro STORY-030), "Trainer"/"Clienti" nel dettaglio org lipedema del
  super_admin, "Creato il —" prima del reload: visti solo nello smoke test prod, nessun BUG-xxx aperto (azione 3).
- **`index.html` servito con `max-age=3600`**: dopo il deploy una scheda ha tenuto la build vecchia fino al reload, e Lipedema non
  compariva nella select; il banner RICARICA copre solo in parte (azione 1).
- `lipedema.spec.js:103` instabile (appuntamento a 06:00 non apribile dal giorno); BUG-042 ancora OPEN.

### Passa al #24
- Azioni 1-5 sotto; candidati BUG-039/040/041; fuori sprint: STORY-050/051 (rules/functions, review HIGH), org GYM, UAT, TD-015.

## Retrospettiva
Dati (`git log 8a8c797..HEAD` e blocchi sopra, 27/11/2026): i commit dello sprint #23 sono 1 di codice (`f87220b`), 1 di test/runbook
(`5c7f6c6`) e il resto docs (apertura, stati sprint, CHANGELOG); 6 voci DONE su 7 pianificate + voce 8 parziale; 1 rilascio hosting in
prod senza rollback; unit 758/758; `qa:dev` 65/66 poi 6/6; 0 bug nuovi in BUGS.md, 3 difetti UI visti a mano e non registrati. Non
verificato: tempi per voce.

**Verifica dei 5 action item del #22**
1. BUG-042 spec idempotenti: **NON raggiunto.** Non entrato nello sprint; E2E CI ancora rosso, BUG-042 OPEN.
2. Comandi prod mai concatenati: **raggiunto.** Regola in CLAUDE.md e `release-manager.md` (`d128ee9`); nessun comando concatenato nei
   fatti del rilascio.
3. Go-live con decisione e test prima dello sblocco: **parziale.** Test su `getSelectableModuleOptions` e tabella con `file:riga` ok
   (`f87220b`), smoke test su org temporanea creata e cancellata, residui 0. **Nessuna ADR** in `DECISIONS.md` (ultima ADR-021): la
   decisione di sbloccare senza DPA sta solo in SPRINT.md e CLAUDE.md.
4. Terminologia BUG-039/040 + test di scansione: **NON raggiunto** (non pianificato).
5. DOM prima del selettore: **non applicabile**, nessuna spec nuova nel #23.

**WHAT WENT WELL**
- Go-live senza rollback: solo hosting, functions invariate, merge→`deploy-prod` in 2 min, banner RICARICA dopo ~1 min, 0 errori nei
  log functions prod. Causa: runbook di rilascio maturo (#19-#22) e sprint limitato a un solo layer.
- Smoke test provato prima su dev (passi 1, 2, 7, 8 con script) poi in prod: nessuna sorpresa, residui 0. Causa: AI 3 del #22.
- Sblocco = un flag (`IS_LIPEDEMA_SELECTABLE`) con test: 4 file toccati, rollback = fix forward di una riga.

**WHAT WENT WRONG / CAUSED BUGS**
- **Difetti UI visibili solo dallo smoke test prod** (tab ALLENAMENTO, "Trainer/Clienti", "Creato il —"). ROOT CAUSE: `qa:dev` verifica
  i flussi elencati dalla spec, non la superficie della scheda; STORY-030 dice cosa nascondere ma nessun test elenca le tab visibili per
  modulo. IMPACT: l'org Lipedema reale vede voci fuori contesto clinico; senza BUG-xxx nessuno li pianifica. ACTION: azione 3.
- **Cache di `index.html` (`max-age=3600`).** ROOT CAUSE: `firebase.json` non imposta `no-cache` su `index.html`; il banner RICARICA ha
  `POLL_MS` 5 min e non aiuta chi apre una scheda da cache HTTP. IMPACT: build vecchia fino a 1 ora dopo ogni rilascio; qui ha fatto
  credere che lo sblocco non fosse riuscito. ACTION: azione 1.
- **SPRINT.md non rifletteva un'azione dell'utente fuori sessione** (voce 11 RINVIATA, org già creata). ROOT CAUSE: nessuna domanda
  "è già fatto?" sulle voci dell'utente prima della chiusura. IMPACT: orgId non annotato, rischio di retro su stato falso. ACTION: azione 5.
- **Nessuna ADR per lo sblocco senza DPA.** ROOT CAUSE: decisione presa a voce, scritta solo in testata; nulla impedisce il merge senza
  ADR. IMPACT: decisione con implicazioni GDPR rintracciabile solo da SPRINT.md/CLAUDE.md. ACTION: azione 4.

**WHAT WAS SLOW / CAUSED REWORK**
- `qa:dev` in 3 giri (login timeout nel global setup, 65/66, rerun 6/6) prima di poter dire "non legato allo sblocco". ROOT CAUSE:
  `lipedema.spec.js:103` dipende dall'orario e il global setup non diagnostica il timeout del login. IMPACT: 3 giri sullo stesso commit e un
  test instabile che indebolisce il segnale. ACTION: azione 2.
- Molti commit di docs (stato di sprint e CHANGELOG a ogni passo): scelta del runbook, costo basso, accettato.

**WHAT CREATED TECHNICAL DEBT**
- BUG-039/040/041/042 trascinati un altro sprint: il go-live ha avuto la precedenza. BUG-042 rientra nell'azione 2.
- 3 difetti UI e `lipedema.spec.js:103` non registrati in BUGS.md: azioni 2 e 3.

**ACTION ITEM per lo Sprint #24** (max 5; vincoli: deploy su prod solo con via libera uno per passo, comandi prod non concatenati)
1. **`no-cache` su `index.html` (sessione principale, ~30 min).** Header `Cache-Control: no-cache` per `/index.html` in `firebase.json`
   (entrambi i target), provato prima su rankex-dev. *Fatto quando:* `curl -I` su `rankex-app-dev` e `rankex-admin-dev` mostra `no-cache` su
   `/` e `/index.html`, con `version.json` e asset hashati invariati; stesso header in prod al primo rilascio hosting, con via libera.
2. **Segnale test pulito: BUG-042 + `lipedema.spec.js:103` + diagnosi login nel global setup (developer, ~2 h).** BUG-042: verificare
   data/ultimo campionamento invece del conteggio (`real-flows.spec.js:59`); spec 103: slot apribile a qualsiasi ora; global setup: loggare
   URL e messaggio al timeout del login. *Fatto quando:* 2 run consecutivi di `e2e.yml` verdi e `qa:dev` 66/66 al primo tentativo.
3. **Superficie della scheda Lipedema: registrare e correggere i 3 difetti (developer, ~2 h, review medium).** Aprire i BUG per tab
   ALLENAMENTO (STORY-030), "Trainer"/"Clienti" nel dettaglio org, "Creato il —"; ramificare sulle capability, mai su `!isSoccer`; caso in
   `e2e/qa-dev/tests/lipedema.spec.js` che elenca le tab visibili. *Fatto quando:* 3 BUG FIXED con test che fallisce senza il fix e spec
   verde su `qa-lipedema`.
4. **ADR dello sblocco senza DPA + orgId annotato (sessione principale, ~30 min).** ADR in `docs/DECISIONS.md` con data, rischio accettato,
   condizione "nessun dato reale da parte nostra" e stato di STORY-029 (b)/(c); orgId reale in CHANGELOG `[2026.11.27.2]` (solo orgId,
   dall'utente). *Fatto quando:* ADR committata e orgId trovato con `grep` in CHANGELOG, oppure "non fornito" dichiarato.
5. **Stato delle voci dell'utente chiesto prima della chiusura (scrum-master, ~10 min).** In `.claude/agents/scrum-master.md`, al passo di
   chiusura: per ogni voce con Chi = utente chiedere "fatto fuori sessione?" e riportare la risposta nella tabella prima di scrivere "Non
   completato". *Fatto quando:* la regola è nel file e nel #24 nessuna voce utente cambia stato dopo la retro.

---

Sprint #22 e precedenti: `docs/SPRINT-ARCHIVE.md` (#22 spostato il 2026-11-27, contenuto invariato).
