# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta. Qui stanno lo sprint corrente e l'ultimo chiuso con la sua retro;
gli sprint più vecchi sono in `docs/SPRINT-ARCHIVE.md` (non vanno cancellati: serve alla Retrospective).

---

## Sprint corrente

# SPRINT #23 — Go-live Lipedema in prod — aperto il 2026-11-27

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
| 6 | Sblocco `IS_LIPEDEMA_SELECTABLE = true` + test + CLAUDE.md + TP-087 aggiornato + TP-095 go-live (blocker) | S | sessione principale | /code-review medium | IN CORSO |
| 7 | Review medium voce 6 | code-reviewer | - | - | TODO |
| 8 | Push dev, `qa:dev` completo, passi TP-095 provati su `qa-lipedema` (rankex-dev) | - | sessione principale | - | TODO |
| 9 | Rilascio sblocco: merge `dev → main` + push (solo hosting) | - | sessione principale | - | TODO (via libera) |
| 10 | Smoke test prod su org temporanea `smoke-lipedema-20261127` + cancellazione + residui | - | sessione principale + utente | - | TODO (via libera) |
| 11 | Org Lipedema reale + org_admin (nome, email da fornire) | - | sessione principale | - | TODO (via libera, dati mancanti) |
| 12 | STORY-029 (b)/(c) in BACKLOG solo se confermati; CHANGELOG | - | sessione principale | - | TODO |

## Tabella ambiente/modulo — voce 6 (sblocco)
| Caso | dev | UAT | prod |
|------|-----|-----|------|
| Select modulo in NUOVA (`CreateOrgForm.jsx:97` → `getSelectableModuleOptions()`, `modules.config.js:37-40`) | oggi PT/Soccer/Lipedema (`IS_LIPEDEMA_SELECTABLE = isDev`, `:30`; `isDev` = `VITE_ENV === 'development'`, `utils/env.js:3`): invariato | oggi PT/Soccer → dopo PT/Soccer/Lipedema; nessun deploy UAT nel repo: non verificato | oggi PT/Soccer → dopo PT/Soccer/Lipedema |
| Select modulo nel dettaglio org (`OrgDetailView.jsx:63`, con `isModuleChangeAllowed` `:62,114`) | invariato | come prod, non verificato | Lipedema offerto; cambio da/verso lipedema solo con org senza clienti (UI `:62,114` + rules `isAllowedModuleChange` `firestore.rules:80,151`) |
| PT / Soccer / GYM / legacy null | nessun effetto (cambia solo l'opzione lipedema) | idem | idem |
| Lipedema | org esistenti (`qa-lipedema`) invariate | - | nessuna org lipedema in prod (da confermare in Console, sola lettura) |

---

## Sprint chiuso (storico)

# SPRINT #22 — Area cliente a 360 px (STORY-049), terminologia del modulo lato server/config (BUG-037/038), action item del #21 — aperto il 2026-11-27, chiuso il 2026-11-27 (goal raggiunto, in prod; smoke test prod e GYM non verificati, E2E rosso per BUG-042)

**Goal:** l'area cliente PT e soccer a 360 px non tronca le etichette dell'hub né esce dallo schermo con la vetrina trofei e le
barre di STATUS (misurato dalla spec di layout a 360 e 1366), i testi scritti dal server e dal config dei badge usano la
terminologia del modulo (BUG-037/038 con inventario), e gli action item del #21 sono chiusi. Se la QA e il pre-flight sono verdi,
rilascio `dev → main` (decisione 1).

**Branch:** `feature/lipedema-module`, HEAD = `origin/dev` = `8a8c797` all'apertura (`git rev-parse` 27/11). Non tracciati
`lipidemia/`, `mobile-app/` (non toccare).

**Stato ambienti (apertura, 27/11):** rankex-dev hosting + rules a `8a8c797` (run `deploy.yml` 43416819261, job `deploy-dev`
success: verificato con `gh run view`), functions dev a `5090d9a` (da CHANGELOG, non rilanciato `functions:list`). Prod
`fitquest-60a09`: hosting + rules = `origin/main` = `f086405`; functions a `f086405`, 40 callable `nodejs22` (da CHANGELOG: non verificato oggi).

**Vincoli:** nessun deploy su `fitquest-60a09` né merge su `main` senza via libera esplicito, uno per passo; commit locali, push su
`dev` solo alla voce 6b e a fine sprint; controprove solo su copia (worktree esterno, niente junction, porta 4173 libera); nessuna
voce tocca `firestore.rules` (se succede: review high e stop); copie speculari aggiornate su entrambi i lati con test di parità;
audit/side effect attesi prima del return; dati solo nelle org `qa-*` di rankex-dev, mai account `qa.*`.

## Voci dello sprint
| # | ID | Taglia | Chi | Review | Stato |
|---|----|--------|-----|--------|-------|
| 1 | AI 1: `npm run check:node-imports` in CI + pre-flight; controprova su copia di `56684a6` → exit 1, HEAD → 0 | S | developer A | AC + test verdi | DONE `2679a8c` (controprova `56684a6` exit 1 ERR_MODULE_NOT_FOUND, HEAD exit 0) |
| 2 | AI 5: passo "porta 4173 libera + build servita = quella della copia" in `developer.md` | S | developer A | AC | DONE `2679a8c` (usato nella controprova 049: porta liberata, PID figlio sopravvissuto a TaskStop e chiuso a mano) |
| 3 | AI 2: regola "spec lanciata una volta sull'hosting prima della review" (`developer.md`, `scrum-master.md`) + helper commentati in `layoutHelpers.js` | S | regola: sessione principale; helper: developer C | AC | DONE: regola `2050cbf` (scrum-master) + `06bd9a4` (developer); helper `7bf495c` |
| 4 | BUG-005: tab BIA con `capability: 'hasBia'` | S | sessione principale | AC + test verdi | DONE `0ac9913` |
| 5 | AI 4 + BUG-037 + BUG-038: inventario testi cablati → BUGS.md, fix con test che fallisce prima, deploy functions rankex-dev | M | tech-lead (approccio) → developer B | /code-review medium | DONE (review medium APPROVED, 0 important; QA VERIFIED 27/11 a `f2c34c3`): ADR-021 `9ab9f02`, fix `002e43a`, docs `02e5fab` (inventario 22 righe, BUG-039/040, TD-016); functions rankex-dev a `002e43a`, 40 callable nodejs22 |
| 6 | `aria-label` della PROSSIMA (`ClientHomeCards.jsx:89-108`, nome accessibile oggi titolo+data senza separatore) | S | developer C | AC | DONE `7bf495c` (review APPROVED; QA PASS PT e soccer) |
| 6b | Push intermedio su `dev` (UI 049 + spec pronte) → spec lanciata una volta sull'hosting dev prima della review | - | sessione principale | - | DONE: push `9ab9f02`, deploy-dev run 46003020504 ok; primo run spec 26 passed / 2 failed (errore di spec AC2: 11 img) / 2 skipped (AC3, manca campionamento) |
| 7 | STORY-049 (AC in BACKLOG.md) + spec layout 360/1366 + seed badge | M | developer C | /code-review medium, cita esito spec 360/1366 | DONE (review APPROVED; spec 6/6 a 360 e 1366 incl. AC3 dopo campionamento via UI; QA PASS) `7bf495c` + `98406c2` + `fb08a28` (vetrina items-start: 7 px a 1366, difetto reale); controprova su copia di `06bd9a4`: AC1 FAIL 360, AC2 FAIL 360 e 1366; AC3 da misurare dopo campionamento QA |
| 8 | AI 3: TP-094 passo errore provato → PASS o BLOCCATO con motivo in `runbook.config.js`; regola "come si simula" | S | sessione principale in QA | - | DONE `39706c5`: BLOCCATO con motivo (3 simulazioni provate, la cache Firestore risponde vuota) → BUG-041 P3; regola in `scrum-master.md` (`2050cbf`) |
| 9 | Push dev, `qa:dev` completo, QA dal vivo solo sul nuovo | - | qa-engineer | - | DONE: `qa:dev` su `f2c34c3` 67/68 (1 errore di spec: misura a meta' animazione, fix `fb08a28`), poi **68/68 su `fb08a28`**; BUG-005/037/038 VERIFIED (`1400999`); nuovo BUG-041 P3; GYM non verificato |
| 10 | Rilascio prod (decisione 1) | - | release-manager + sessione principale | - | DONE 27/11: functions prod a `478a157` (codice `fb08a28`), 40 callable nodejs22 da `functions:list`; merge ff `f086405..53b5579` su `main` 14:41 UTC, CI 46018184533 ok, `deploy.yml` 46018372099 `deploy-prod` ok 14:43 UTC; HTTP build nuova + CSP su entrambi i siti, 0 errori nei log. Smoke test in sola lettura: NON VERIFICATO (a carico dell'utente) |

## Tabella ambiente/modulo — voce 5 (BUG-037/038)
| Caso | dev | UAT | prod |
|------|-----|-----|------|
| PT | `chiudiSessione.js:149` "Sessione del ${slot.date} completata!": termine giusto, data ISO; badge `badges.config.js:19,35,43,51` "sessione/i di allenamento": accettabile | non verificato (nessun deploy UAT) | stesso codice a `f086405` finché functions non deployate (via libera) |
| GYM (variant) | termine atteso "Allenamento" (`modules.config.js` terminologia gym): oggi "Sessione" — non verificato dal vivo (nessuna org QA GYM) | non verificato | non verificato |
| Soccer | oggi "Sessione del 2026-11-10…" (visto dal vivo nel #21); atteso "Allenamento del 10 nov completato!…" | non verificato | invariato fino al deploy functions prod |
| Lipedema | nessuna area cliente (`modules.config.js:93` `hasClientLogin: false`) e nessuna XP: notifica non letta da pazienti | non verificato | idem |

## Tabella ambiente/modulo — voce 7 (STORY-049)
| Caso | dev | UAT | prod |
|------|-----|-----|------|
| PT | hub `ClientHub.jsx:258` `label.slice(0, 3)` su mobile; vetrina `TrophiesSection.jsx:167,172` 5×68+4×16 = 404 px; `StatsSection` `components/ui/index.jsx:430` `3fr 2fr` | non verificato | prod a `f086405`: stesso codice, cambia solo col rilascio |
| Soccer | stesso codice (componenti condivisi); vetrina visibile (`hasGamification` true, `modules.config.js:88`) | non verificato | idem |
| GYM | stesso codice; non verificato dal vivo | non verificato | non verificato |
| Lipedema | nessuna area cliente (`hasClientLogin: false`, `:93`): non applicabile | - | - |

## Tabella ambiente/modulo — voce 10 (rilascio)
| Layer | dev | prod |
|-------|-----|------|
| hosting + rules | `deploy.yml` job `deploy-dev` a ogni push su `dev` | `deploy-prod` al merge su `main` (oggi `f086405`); `IS_LIPEDEMA_SELECTABLE = isDev` (`modules.config.js:30`): Lipedema non selezionabile |
| functions | a mano `cd functions && npm run deploy:dev` (voce 5) | a mano `npm run deploy` con via libera, **prima** del merge (BUG-037) |
| UAT | nessun deploy UAT nel repo: non verificato | - |

## Goal
L'area cliente PT e soccer a 360 px non tronca le etichette dell'hub né esce dallo schermo (vetrina trofei, barre STATUS), i testi
scritti dal server e dal config dei badge usano la terminologia del modulo (BUG-037/038), gli action item del #21 sono chiusi e il
tutto è in prod. **Raggiunto**: spec di layout 6/6 a 360 e 1366, `qa:dev` 68/68 su `fb08a28`, rilascio in prod il 27/11/2026. Restano
non verificati lo smoke test post-deploy in sola lettura e GYM (vedi "Non verificato"), e E2E (`e2e.yml`) è rosso per BUG-042.

## Chiusura sprint

**Stato del repo a fine sprint (output di comandi, 27/11/2026):** prod `fitquest-60a09`: functions a `478a157` (codice di `fb08a28`),
40 callable `nodejs22` da `functions:list`; merge fast-forward `f086405..53b5579` su `main` alle 14:41 UTC; CI 46018184533 success;
`deploy.yml` 46018372099 `deploy-prod` success alle 14:43 UTC; hosting + rules prod = `53b5579` (HEAD locale `42423f8` ha in più solo
docs). Verifica HTTP: entrambi i siti servono la build nuova con CSP. Log functions: 0 errori. Pre-flight su `fb08a28`: build, lint,
`check:node-imports`, unit 758/758, functions 268/268, `test:rules` 129/129, `qa:dev` 68/68, 0 P0/P1; rules e indici invariati.

### Completato
- **Voci 1-9 DONE** (tabella sopra): AI 1 `check:node-imports` (controprova su `56684a6` exit 1, HEAD 0); AI 5 passo porta 4173; AI 2
  regola + helper `layoutHelpers.js`; BUG-005 tab BIA con `hasBia`; BUG-037/038 con inventario e ADR-021 (functions rankex-dev a
  `002e43a`); `aria-label` PROSSIMA; STORY-049 con spec layout 360/1366 (controprova su `06bd9a4`: AC1 FAIL a 360, AC2 FAIL a 360 e
  1366; difetto reale trovato dalla spec: vetrina trofei a 7 px a 1366, `98406c2`); AI 3 TP-094 passo errore BLOCCATO con motivo
  (BUG-041); `qa:dev` 67/68 poi 68/68 su `fb08a28`; BUG-005/037/038 VERIFIED dal vivo (`1400999`).
- **Voce 10 rilascio DONE il 27/11/2026**, ordine rispettato (functions prima, poi merge): dati nel "Stato del repo" sopra.
  `checkPrev f086405` deployabile (Node 22). Dal merge al `deploy-prod` ok: 2 minuti.

### Non completato (motivo)
- Nessuna voce pianificata è rimasta fuori. BUG-039, BUG-040 (nati dall'inventario), BUG-041 (nato da AI 3) e BUG-042 restano OPEN:
  scoperti nello sprint, mai pianificati in esso.

### Non verificato
| Cosa | Motivo / stato |
|------|----------------|
| Smoke test post-deploy in sola lettura col super_admin su `rankex-admin` (login, lista org, dettaglio org PT e Soccer) | **ancora da fare**, lo esegue l'utente: non verificato finché non riportato. Verificati solo HTTP (build nuova, CSP) e log functions (0 errori) |
| `qa:dev` sugli ultimi commit | non ripetuto dopo `fb08a28`: i commit successivi sono solo docs |
| E2E (`e2e.yml`) su `main` | rosso su `515eb12` (BUG-042); atteso uguale su `main`: non verificato il run di `main` |
| Terminologia GYM (BUG-037/038), "Assegnato dal coach" su badge manuale già assegnato in soccer | nessuna org QA GYM; il seed assegna badge solo a qa-pt |
| Costi Firebase a 24 ore dal deploy (CLAUDE.md "Verifica post-deploy") | non controllati |
| 3f, UAT, rollback functions prod (TD-015), STORY-029 (b)/(c) | invariati (già accettati) |

### Blockers
- Nessun blocco sul codice. STORY-029 (b)/(c) (DPA approvato dal manager) resta BLOCKED: per decisione dell'utente il #23 procede con
  lo sblocco di `IS_LIPEDEMA_SELECTABLE` comunque, la creazione dell'org lipedema reale resta subordinata al via libera.

### Tech debt emerso
- **TD-016** (TECH-DEBT.md): campo `date` di notifiche e log scritto dalle callable senza `timeZone`.
- **Testi di terminologia ancora cablati nelle callable:** BUG-039 ("dal trainer" in `aggiornaProfiloCliente.js:38`, `salvaXP.js:36`,
  `shared/gamification.js:103`) e BUG-040 ("sessione/sessioni" in errori al trainer: `chiudiSessione.js:63`, `aggiungiRicorrenza.js:31,34`,
  `estendirRicorrenza.js:45`), 22 righe di inventario in BUGS.md (6 corrette, 6 su bug nuovi, 10 accettate). L'inventario è un
  elenco manuale: nessun test fallisce se qualcuno aggiunge un nuovo letterale.
- **BUG-041** (P3): Home cliente con rete assente mostra un falso vuoto, lo stato errore di STORY-048 non è raggiungibile (`fromCache`).
- **BUG-042** (P3, test): `real-flows.spec.js:59` non idempotente (cliente di test al tetto `MAX_CAMPIONAMENTI = 50`).

### Verificato / non verificato (per ambiente)

| Voce | In dev (rankex-dev) | In prod (fitquest-60a09) | Non verificato |
|------|---------------------|--------------------------|----------------|
| STORY-049 + `aria-label` PROSSIMA | spec 6/6 a 360 e 1366, `qa:dev` 68/68, QA PASS PT e soccer | deploy-prod ok, build nuova servita (HTTP, CSP); nessuna prova dal vivo dell'area cliente | smoke test in sola lettura, GYM |
| BUG-037/038 | VERIFIED dal vivo (soccer e PT) | functions prod a `478a157`, 0 errori nei log; non provato dal vivo in prod | GYM; "Assegnato dal coach" su badge assegnato |
| BUG-005 | VERIFIED | invariato dal deploy, non provato in prod | - |
| BUG-041/TP-094 passo errore | BLOCCATO con motivo, BUG-041 aperto | non toccato | - |
| Rules / indici | invariati | invariati (`53b5579` = stesse rules) | - |
| E2E (`e2e.yml`) | rosso (BUG-042) | n/a | run su `main` |

### Passa al #23
- **Go-live Lipedema in prod** (decisione dell'utente 27/11): sblocco `IS_LIPEDEMA_SELECTABLE` (`modules.config.js:30`), smoke test su
  org temporanea (poi cancellata con `eliminaOrganizzazione`), org reale solo col via libera. DPA non ancora approvato (STORY-029 (b)/(c)
  BLOCKED): rischio accettato dall'utente, da scrivere in `docs/DECISIONS.md`.
- Da chiudere prima: smoke test post-deploy del #22 (utente).
- Candidati se c'è spazio: BUG-040 (tocca anche i professionisti lipedema), BUG-039, BUG-041, BUG-042.
- Fuori sprint: STORY-050/051 (rules/functions, review HIGH), 3f, org GYM, UAT, TD-015.

## Retrospettiva
Dati (da `git log 8a8c797..HEAD` e dai blocchi sopra): 19 commit = 7 di codice/test/CI (`0ac9913`, `2679a8c`, `7bf495c`, `002e43a`,
`98406c2`, `fb08a28`, `39706c5`) e 12 di docs/agenti (apertura, 2 regole agenti, ADR, inventario, stati, chiusura voci, 4 per il rilascio,
2 per BUG-042); voci 1-10 tutte DONE; bug: 3 VERIFIED (005, 037, 038), 4 nuovi OPEN P3 (039, 040, 041, 042); unit 758/758, functions
268/268, rules 129/129; `qa:dev` 67/68 poi 68/68; 1 rilascio in prod senza rollback, merge→deploy-prod 2 min. Rework: 2
(`98406c2` difetto reale, `fb08a28` errore di spec). Non verificato: tempi per voce (non registrati), smoke test prod.

**Verifica dei 5 action item del #21**
1. `check:node-imports` in CI: **raggiunto.** Controprova su `56684a6` exit 1 `ERR_MODULE_NOT_FOUND`, HEAD exit 0, pre-flight di CLAUDE.md.
2. 0 errori di spec al primo run: **NON raggiunto.** 2 errori di spec al primo run: voce 6b (AC2 contava 11 `img`, non solo le medaglie)
   e voce 9 (misura a metà animazione `rx-animate-in`, `fb08a28`). La regola "lancia una volta prima della review" ha funzionato
   (l'errore AC2 è emerso a 6b, prima della review), ma non ha ridotto gli errori: vedi sotto.
3. Fattibilità dei passi: **raggiunto.** TP-094 passo errore provato con 3 simulazioni: BLOCCATO con motivo (`39706c5`) e scoperto BUG-041.
   Regola in `scrum-master.md`. Passi di AC/TP- del #22 corretti a posteriori per infattibilità: nessuno emerso nei fatti ricevuti.
4. Inventario terminologia: **raggiunto.** 22 righe in BUGS.md, BUG-037/038 FIXED con test che falliva prima e VERIFIED dal vivo,
   deploy solo su rankex-dev prima del via libera.
5. Controprova affidabile: **raggiunto.** Passo porta 4173 in `developer.md`; nella controprova 049 la porta era occupata da un figlio di
   `vite preview` sopravvissuto a TaskStop, chiuso a mano: nessuna controprova ripetuta.

**WHAT WENT WELL**
- Rilascio senza intoppi: ordine functions→merge, `checkPrev`, merge→deploy-prod in 2 min, 0 errori nei log. Causa: runbook di CLAUDE.md "Rilascio in
  produzione" e guard di deploy (#19-#20), usati alla lettera.
- La spec di layout ha trovato un difetto reale non visto a vista (vetrina a 7 px a 1366) e la controprova su `06bd9a4` ha fallito AC1/AC2
  come previsto. Causa: misure con boundingBox + controprova su copia (AI 2/5 del #20-#21).
- Il fix di BUG-037/038 è partito da un inventario e da ADR-021 (terminologia in `shared/terminology.js` con parità), non caso per caso:
  ha reso visibili 22 testi e separato "corretto/bug/accettato".

**WHAT WENT WRONG / CAUSED BUGS**
- **E2E rosso su `515eb12` e su `main` (BUG-042).** ROOT CAUSE: `real-flows.spec.js:59` asserisce `after.camps === before.camps + 1` su un
  cliente persistente (`test-org-pt`, "Mario Rossi (Test)") a cui ogni run aggiunge un campionamento; lo storico è troncato a
  `MAX_CAMPIONAMENTI = 50` (`gamification.js:84,170`), quindi al 50° il test non può più passare. Il codice di prodotto è corretto: la
  spec dipende da dati cumulativi che nessuno azzera. IMPACT: `e2e.yml` rosso su `main` (non blocca `deploy.yml`), un segnale di
  regressione perso fino al fix; scoperto solo al push di un commit docs. ACTION: azione 1 (che cerca anche altre asserzioni dello stesso tipo).
- **Near-miss su prod: un comando di sola lettura (`functions:list`) conteneva per sbaglio un secondo `npm run deploy` su
  `fitquest-60a09`.** ROOT CAUSE: comandi concatenati in una sola chiamata, uno di lettura e uno di scrittura su prod; la regola "un via
  libera per passo" (CLAUDE.md) non dice "un comando per chiamata". IMPACT: nessuno, bloccato dal classificatore dei permessi e non
  eseguito; ma la protezione era l'ultima barriera, non la prima. ACTION: azione 2.
- **AI 2 del #21 non raggiunto (2 errori di spec al primo run).** ROOT CAUSE: le spec sono scritte leggendo il codice, non il DOM reale
  dell'hosting: 11 `img` contati (avatar e icone incluse) e la misura presa mentre `rx-animate-in` anima non si vedono dal sorgente.
  La regola del #21 anticipa il primo run ma non impone di ispezionare la pagina prima di scrivere il selettore. IMPACT: 1 commit di
  rework (`fb08a28`) + 1 secondo giro di `qa:dev` (67/68 → 68/68). ACTION: azione 5.
- **BUG-041: lo stato errore di STORY-048 non è raggiungibile** per assenza di rete (la cache di Firestore risponde con snapshot vuota).
  ROOT CAUSE: l'AC è stata scritta e accettata a #21 senza provare il caso; nel #22 la fattibilità è stata provata (AI 3) ma il fix non è
  nello sprint. IMPACT: P3, falso vuoto in Home con rete assente; segnalato, non risolto. ACTION: candidato del #23 (S), non azione.

**WHAT WAS SLOW / CAUSED REWORK**
- 3 giri di verifica dal vivo (6b: 26/2/2; `qa:dev` 67/68; poi 68/68) e un secondo push su `dev` per rimediare a 2 errori di spec. ROOT
  CAUSE: vedi AI 5. Il tempo per voce non è stato registrato: non verificato.
- I commit di docs sono 12 su 19, 3 solo per annotare il rilascio (CHANGELOG a ogni passo) più 2 con lo stesso oggetto per BUG-042
  (`155cac7`, `478a157`; motivo non verificato). ROOT CAUSE: lo stato del rilascio va in CHANGELOG a ogni passo, per scelta del runbook;
  costo basso, accettato.

**WHAT CREATED TECHNICAL DEBT**
- BUG-039/040 aperti e TD-016: la stessa famiglia di BUG-037/038 non è chiusa, perché il fix ha coperto 6 righe su 12 con difetto.
  ROOT CAUSE: i testi utente sono letterali sparsi in `functions/src/callable` e `shared`, senza una regola verificata da test che li
  vieti fuori da `shared/terminology.js`. ACTION: azione 4.
- BUG-042 (spec con dati cumulativi): azione 1.

**ACTION ITEM per lo Sprint #23** (max 5; vincoli: deploy su prod solo con via libera uno per passo; Sprint #23 = go-live Lipedema)
1. **Spec E2E idempotenti: BUG-042 (developer, ~1 h).** In `e2e/tests/real-flows.spec.js:59` verificare l'ultimo campionamento (data/id)
   invece del conteggio, oppure riportare il cliente sotto il tetto in `seed-test-accounts.mjs`; `grep` delle altre asserzioni
   `before + N` / `toBe(... + 1)` in `e2e/tests/` con l'elenco in BUGS.md. *Fatto quando:* 2 run consecutivi di `e2e.yml` verdi sullo stesso
   cliente di test e BUG-042 FIXED con le altre asserzioni cumulative elencate come bug o "ok".
2. **Comandi su prod mai concatenati (sessione principale, ~20 min).** Regola in CLAUDE.md "Rilascio in produzione" e
   `.claude/agents/release-manager.md`: ogni comando verso `fitquest-60a09` (deploy, `functions:list`, `firebase ... --project fitquest-*`)
   va in una chiamata sola, senza `&&`, `;` né pipe verso altri comandi di scrittura. *Fatto quando:* la regola è nei due file (`grep`
   la trova) e nel rilascio del #23 non c'è alcun comando prod concatenato.
3. **Go-live Lipedema con la decisione e il test prima dello sblocco (tech-lead + developer, ~2 h).** Scrivere in `docs/DECISIONS.md` (ADR) la
   decisione dell'utente di sbloccare con STORY-029 (b)/(c) BLOCKED, con la condizione "nessun dato reale di pazienti prima del via libera
   del manager e del DPA"; aggiungere un test unit su `getSelectableModuleOptions`/`IS_LIPEDEMA_SELECTABLE` per dev e prod e usare la
   tabella ambiente/modulo con `file:riga` della voce. *Fatto quando:* ADR committata prima del merge dello sblocco, test verde con
   Lipedema selezionabile solo dopo lo sblocco, e smoke test su org temporanea creata e cancellata con `eliminaOrganizzazione`
   (esito, `audit_logs` e `exports` citati).
4. **Terminologia chiusa per classe: BUG-039 + BUG-040 + test di scansione (developer, ~2 h, review medium).** Aggiungere `trainer` e i termini
   di errore a `shared/terminology.js` (con test di parità), correggere le 6 righe dell'inventario aperte, e un test in `functions/test/`
   che scansiona `src/callable/*.js` e `shared/*.js` e fallisce se compare "sessione/trainer/cliente" in un letterale fuori da una
   lista di eccezioni esplicita. *Fatto quando:* BUG-039/040 FIXED con test che falliva prima; il test di scansione rosso se si
   aggiunge `"sessione"` a un messaggio di `aggiungiRicorrenza.js`; functions solo su rankex-dev senza via libera.
5. **Spec nuova = DOM ispezionato prima del selettore (developer, ~30 min).** In `developer.md` aggiungere il passo "prima di scrivere una spec
   su un componente, stampare dall'hosting dev il conteggio e il testo reale dei selettori (script di sola lettura) e annotare i risultati
   nel commento dell'helper"; per le misure su elementi animati, attendere la fine dell'animazione tramite helper in `layoutHelpers.js`.
   *Fatto quando:* la regola è nel file e le spec nuove del #23 hanno 0 test rossi per errore di spec al primo `qa:dev` (conteggio citato
   in chiusura); se il #23 non scrive spec nuove, "non applicabile" dichiarato.

---

Sprint #21 e precedenti: `docs/SPRINT-ARCHIVE.md` (#21 spostato il 2026-11-27, contenuto invariato).
