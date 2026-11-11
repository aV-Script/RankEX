# Sprint — RankEX

Gestito dallo Scrum Master. Un solo sprint attivo alla volta — quelli chiusi restano in
fondo al file come storico, non vanno cancellati (serve alla Retrospective).

---

## Sprint corrente

# SPRINT #15 — EPIC-010 Lipedema Edition, sesta ondata (bottone principale, verifiche rimaste, debito) — aperto il 2026-11-11, chiuso il 2026-11-11 (goal raggiunto, con residui QA elencati)

**Branch:** `feature/lipedema-module`. Deploy solo su `rankex-dev`, **nessun deploy in prod
del modulo** (DPA non firmato, STORY-029). Commit solo in locale.

**Goal:** il bottone principale è pieno e unico per schermata in tutta l'app, le verifiche
rimaste dal #14 passano a VERIFIED e i plurali passano da un helper unico.

**Riferimento UI:** canvas RankEX, tavole `DesignSystem` e `TemiConfronto` (sola lettura).

**Story e task selezionati, nell'ordine:**
1. **Allineamento canvas** (action item 4): lo fa l'utente in parallelo (decisione 11/11). Il
   developer non tocca il canvas.
2. **Giro QA iniziale** (action item 2) sull'hosting dev attuale (`50f6779`): TP-077, tastiera
   sulle schede dei test, BUG-018, BUG-010, BUG-017, PDF di più pagine.
3. **Helper di plurale generico** (action item 1): `utils/plural.js`, nei 5 file dell'action item.
4. **STORY-043** — bottone principale pieno, variante `secondary` tinta, Mint `#6F86FF`.
5. **Migrazione date org** (action item 5): script idempotente solo rankex-dev + seed corretto.

**Fuori dal #15:** STORY-044 (da ridisegnare sul canvas prima), STORY-029 (BLOCKED, utente/
legale), plurali fuori dai 5 file, etichetta tagliata dell'asse X del trend (cosmetico).

**Decisioni aperte e casi limite (action item 3) — tutte decise dall'utente l'11/11:**

*STORY-043*
- Default di `Button`: diventa `secondary` (la tinta attuale, nessun cambio visivo); il pieno si
  sceglie esplicitamente con `variant="primary"`, uno per schermata. La lista dei primari va
  mostrata all'utente prima del commit.
- Dialog e modal contano come schermata a sé: conferma piena, annulla `neutral`; le conferme
  distruttive restano `danger`/`dangerGhost`.
- Area super_admin: pieno sull'accent rosso `#f87171`, testo `#04140a` (~6,8:1).
- Casi limite: primario disabilitato o in caricamento (resta pieno, opacità 50%); wizard con
  INDIETRO/AVANTI (AVANTI pieno, INDIETRO `neutral`); pagina con dialog aperto (uno per livello);
  classe CSS `.rx-btn-primary` (6 usi) allineata alla stessa regola; contrasto di `#04140a`
  sull'accent dei 7 temi ≥ 4,5:1 (minimo Carbon ~5,3:1, calcolato).

*Giro QA*
- BUG-010: `qa-pt` portata temporaneamente a piano `free` con script Admin SDK solo rankex-dev,
  poi riportata a `pro`. BUG-017 resta non verificabile senza un super_admin.
- PDF multipagina: paziente `E2E-PDF Sprint15` in `demo-lipedema` (fuori dalle org `qa-*`, non
  toccato dal teardown di `qa:dev`), con dati lunghi; resta finché decide l'utente.

*Plurale*
- Solo i 5 file; `countLabel` resta nel CORE lipedema (il file server non importa nulla), nessuna
  modifica alle functions. Casi: 0 → plurale, 1 → singolare, 2 → plurale; delta negativi sul
  valore assoluto.

*Migrazione date*
- Solo `rankex-dev` (guardia sul projectId); la normalizzazione di lettura (`utils/orgDates.js`)
  resta, perché in prod potrebbero esserci dati vecchi.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| Allineamento canvas | DONE (utente, 11/11) | SALTA e "Non salvati in questa visita" sulle tavole `Valutazione*`; trend e PDF su `PazienteTrend`/`MobilePazienteTrend`/`ReportLipedema`. |
| Giro QA iniziale | DONE | 11/11, hosting `50f6779` e poi `2707b21`. VERIFIED: BUG-010 (`qa-lipedema` a free e poi di nuovo pro; "1 presente" in `demo-lipedema`), BUG-017 (super_admin di seed su rankex-admin-dev, prima e dopo la migrazione), BUG-018, TP-077 ("Aggiornamento in corso…" con rete e CPU rallentate: + NUOVA VALUTAZIONE, CORREGGI e ANNULLA disabilitati, schede e grafico attivi; tutto riabilitato a rilettura finita), tastiera sulle schede dei test (frecce, Home/End, giro dall'ultima alla prima). PDF di 2 pagine sul paziente `E2E-PDF Sprint15`: trovato e corretto BUG-020. |
| Helper di plurale | DONE | Commit `eb15aec`, `utils/plural.js` nei 5 file, test 0/1/2/−1/−2. 0 ternari `=== 1 ?` nei 5 file. Fuori perimetro: BUG-021 e TD-012. |
| STORY-043 — bottone principale | DONE | Commit `8ee2510` + `2707b21` (disabilitato al 50%, dalla review). Lista dei primari approvata dall'utente; Gruppi: CREA pieno a form aperto; glow di Mint allineato. Test di contrasto: minimo Carbon 5,29:1. QA dal vivo desktop e 360 px (lista pazienti, form di valutazione, chiusura appuntamento). Residuo: TD-011 (calendario senza primario pieno, bottoni scritti a mano). Runbook TP-080. |
| Migrazione date org | DONE | Commit `de645ee`; `--apply` su rankex-dev: 31 documenti, 15 convertiti, 0 Timestamp rimasti; secondo dry-run 0 da convertire. |
| BUG-020 — PDF multipagina | FIXED + VERIFIED | Commit `3923844`. A4 di 2 pagine corretto; un report con meno dati resta di 1 pagina. Runbook TP-081. |
| Review medium | APPROVED | 0 bloccanti; LOW sul `.rx-btn-primary` disabilitato corretto (`2707b21`), gli altri in TD-011. |
| Deploy rankex-dev | DONE | `npm run deploy:all:dev` dopo `2707b21`; functions non toccate, non ridistribuite. |
| Regressione `npm run qa:dev` | 19/19 | Dopo il deploy. |
| STORY-029 — requisiti non-codice | BLOCKED (fuori capacità developer) | Blocca il go-live, non lo sprint. |

## Goal
Il bottone principale è pieno e unico per schermata in tutta l'app, le verifiche rimaste dal
#14 passano a VERIFIED e i plurali passano da un helper unico. **Raggiunto** (plurali: solo nei
5 file decisi; gli altri sono in TD-012).

## Completato
- **Helper di plurale** `utils/plural.js` nei 5 file (`eb15aec`), test 0/1/2/−1/−2.
- **Migrazione date org** (`de645ee`): solo rankex-dev, 0 Timestamp rimasti.
- **BUG-020** — interruzioni di pagina del PDF (`3923844`), VERIFIED. Runbook TP-081.
- **STORY-043** — bottone principale pieno, `secondary`, Mint `#6F86FF` (`8ee2510` + `2707b21`).
  Runbook TP-080.
- **Giro QA** VERIFIED dal vivo l'11/11: BUG-010, BUG-017, BUG-018, BUG-020, TP-077, tastiera
  sulle schede dei test, STORY-043 a desktop e 360 px (lista pazienti, form valutazione,
  chiusura appuntamento).
- **Canvas** allineato dall'utente (SALTA, "Non salvati", trend, PDF).
- **Docs** (`b7d9791`, `7a0a5a7`). rankex-dev: hosting a `7a0a5a7`, functions non toccate né
  ridistribuite; `npm run qa:dev` 19/19.

## Non completato (motivo)
- **Verifiche dal vivo non fatte (residui QA):** stampa su carta; stampa da Firefox; primario sui
  temi diversi dal predefinito (coperto solo dal test di contrasto); area admin dopo STORY-043;
  vista staff_readonly dopo STORY-043.
- **BUG-021, TD-011, TD-012:** passano allo Sprint #16 (decisione utente 11/11), non entrano nel #15.
- **STORY-044:** resta BACKLOG, da ridisegnare sul canvas.
- **STORY-029:** BLOCKED (DPA/informativa, a carico utente/legale).

## Blockers
- Nessuno tecnico. STORY-029 (DPA, testo informativa) blocca il go-live di EPIC-010, non lo sprint.
- **Dato di test residuo su rankex-dev:** paziente "E2E-PDF Sprint15" in `demo-lipedema`, in
  attesa di decisione dell'utente (tenerlo o cancellarlo).

## Tech debt emerso
- **TD-011** — bottoni principali scritti a mano fuori da `Button` (calendario senza primario
  pieno, ANNULLA di `WorkoutPlanForm`/`RunbookPage`/`GoalsSection`, "+ AGGIUNGI" di `MembersPage`);
  testo `#04140a` ripetuto in 3 punti, manca un token.
- **TD-012** — plurali inline in 9 file fuori dai 5 dell'helper.
- **BUG-021** (P3) — "CREA APPUNTAMENTO (1 pazienti)" in `AddSlotModal`, stessa famiglia di TD-012.
- Cosmetico non tracciato: etichetta tagliata dell'asse X del trend (dal #14).

## Prossimo sprint (candidati)
Proposta, non pianificazione (decide l'utente):
1. **BUG-021 + TD-012** (P3 / debito) — plurali restanti con `utils/plural.js`.
2. **TD-011** — bottoni fuori da `Button`, primario del calendario, token per il testo del primario.
3. **Residui QA non verificati dal vivo** — primario sui temi non predefiniti, area admin e
   staff_readonly dopo STORY-043, stampa su carta e da Firefox.
4. **Dal backlog EPIC-010:** STORY-044 "Da sistemare" (P3, BACKLOG, prima da ridisegnare sul
   canvas) e STORY-029 (P0, BLOCKED, utente/legale). Nessun'altra story EPIC-010 è READY o aperta.
5. **Dato di test** "E2E-PDF Sprint15": decisione dell'utente.

## Retrospettiva
_(da scrivere dalla Retrospective)_

---

## Piano sprint successivi (proposta Scrum Master, da confermare)

**Aggiornamento 2026-10-30:** la coda corrente è EPIC-010 (Lipedema Edition) — vedi i
candidati in fondo a Sprint #12. Il piano sotto (EPIC-007/EPIC-005) è precedente e va
rivisto dal Product Owner prima di riaprirlo.

Sequenza indicativa, non calendarizzata — un solo sviluppatore, quindi ogni sprint parte
solo a chiusura del precedente. Priorità e ordine sono una proposta di ingegneria, non
una decisione di business: rivedere prima di aprire ciascuno sprint.

EPIC-003 (Streak presenze) ed EPIC-004 (Obiettivi trainer) erano **già implementate**
prima di aprire i rispettivi sprint. EPIC-005 (Avatar + Negozio) è stata scoperta
(Sprint #3, raccomandazione di non procedere) ma l'utente ha scelto comunque uno spike
tecnico ridotto (Sprint #4, STORY-014, override esplicito — vedi ADR-003), deployato
su prod. TD-001/TD-002 risolti. EPIC-002 chiusa (Sprint #5).

**EPIC-007 (Privacy & Data Protection) ha ora priorità massima — richiesta esplicita
dell'utente sui risultati del Privacy & Data Protection Audit — e precede EPIC-005
completa nella coda.** Sprint #6 (sopra) copre le sole P0 tecniche. Candidati per gli
sprint successivi, in ordine:

**Candidati aperti (in ordine di priorità):**
1. **Resto di EPIC-007, P0 rimaste bloccate** — STORY-019 (Privacy Policy/Cookie Policy)
   e STORY-020 (consenso genitoriale minori), non appena il contenuto legale/la
   decisione dell'utente arrivano dal track parallelo aperto in Sprint #6. Priorità
   massima non appena sbloccate, a prescindere da cos'altro è in coda in quel momento.
2. **EPIC-007, P1** — STORY-021 (verifica regione Firestore, bloccata sull'utente ma
   verifica leggera), STORY-022 (self-hosting font, READY, nessun blocco), STORY-023
   (script di backup interim, READY per la parte tecnica). Candidati naturali per
   **Sprint #7**, dimensionati per stare insieme in un solo sprint senza ripetere il
   pattern "troppe story a metà".
3. **EPIC-007, P2** — STORY-024 (minimizzazione dati sensibili per `staff_readonly`),
   STORY-025 (rimuovere/correggere `deleteOrganization`, READY), STORY-026 (policy di
   retention, BLOCKED su decisione utente — stesso track parallelo di STORY-019/020).
4. **EPIC-007, P3** — STORY-027 (rimuovere `VITE_FIREBASE_MEASUREMENT_ID`, READY),
   STORY-028 (export dati strutturato per il cliente, READY ma richiede una scelta di
   flusso UX minima prima di stimare).
5. **EPIC-005 completa — Avatar + Negozio**, dopo EPIC-007, se/quando le domande aperte
   in `docs/BACKLOG.md` hanno risposta (asset grafici, priorità rispetto alla
   gamification esistente, bilanciamento economia). Non riconsiderare prima che
   EPIC-007 sia sostanzialmente chiusa, salvo diversa istruzione esplicita dell'utente.

---

## Storico sprint chiusi

# SPRINT #14 — EPIC-010 Lipedema Edition, quinta ondata (storico e trend + PDF) — aperto il 2026-11-09, chiuso il 2026-11-09 (goal raggiunto)

**Branch:** `feature/lipedema-module`. Deploy solo su `rankex-dev`, **nessun deploy in prod
del modulo** (DPA non firmato, STORY-029).

**Goal:** il professionista legge per ogni test l'andamento della paziente, con delta e
avvisi di comparabilità corretti, e (se approvata) ne esporta il report PDF.

**Riferimento UI:** canvas RankEX, tavole `PazienteTrend`, `MobilePazienteTrend`, `Paziente`,
`ReportLipedema` (sola lettura). Approccio tecnico: ADR-019.

**Decisioni dell'utente (09/11), vincolanti per STORY-039:** grafico a tratti spezzato a ogni
cambio di protocollo, interrotte/invalidate come cerchio ambra fuori linea, ceiling OLS marcato,
una serie per lato; delta sempre sull'ultima valida confrontabile con la data; badge
"DIVERSA DALLA PRECEDENTE · motivi" quando la precedente immediata differisce; OLS calzature e
superficie restano warning; livello `info` per il seriale del dinamometro; nessun colore
buono/cattivo, nessuna media.

**Story selezionate, nell'ordine:**
1. **STORY-039** — storico, trend e avviso di comparabilità (ADR-019).
2. **STORY-040** — PDF paziente, solo dopo review e QA di STORY-039 e dopo le risposte
   dell'utente alle 3 domande di ADR-019 (report di gruppo, grafici nel PDF, quali valutazioni).

**Action item della retrospettiva #13 inclusi:** helper unico `countLabel` client/server con
parità (adottato nei messaggi nuovi); stato di caricamento sulle riletture dello storico;
verifica a 360 px; almeno un caso `qa:dev` per trend e badge; caso runbook per l'avviso di
comparabilità. **Esclusi:** BUG-010, BUG-015, BUG-017 restano aperti (decide l'utente).

**Fuori dal #14:** STORY-043 (bottone principale, `themes.config.js` non committato), STORY-044.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| STORY-039 — storico e trend | DONE | Commit `fd14a3b`, review medium (1 MEDIUM + 3 LOW, corretti quelli sullo spec e sulla nota), functions (`countLabel`) e hosting su rankex-dev. QA dal vivo 09/11 desktop e 360 px: badge "DIVERSA DALLA PRECEDENTE", nota con le date, tratti OLS, schede a capo senza scroll orizzontale, staff_readonly in sola lettura. Runbook TP-073…077, caso qa:dev nuovo. |
| STORY-040 — PDF | DONE | Commit `fa8ffef`, review medium (motivo di interruzione e data BIA corretti). QA dal vivo 09/11: contenuto del PDF da trainer e da staff_readonly. Non verificati: stampa A4 reale e interruzioni di pagina. Runbook TP-078. |
| BUG-019 — "+1 ripetizioni" | FIXED + VERIFIED | Emerso nella QA del PDF, corretto con unità singolare/plurale nel delta. |
| BUG-018 su hosting dev | DONE | Deployato con lo sprint, non riverificato dal vivo. |
| Regressione `npm run qa:dev` | 19/19 | Dopo l'ultimo deploy del 09/11. |
| STORY-029 — requisiti non-codice | BLOCKED (fuori capacità developer) | Blocca il go-live, non lo sprint. |

**Aggiornamento di chiusura (09/11, dopo la board sopra):**

| Task | Status | Note |
|------|--------|------|
| Decisione 1 — bilaterali interrotti con un lato completo | CONFERMATA | L'utente tiene la scelta del tech-lead: il lato completo resta sulla linea (ADR-019 §3, nota del 09/11). Nessuna modifica al codice. |
| Decisione 2 — più valutazioni nello stesso giorno | DONE | Commit `798a399`, review medium (APPROVED, solo LOW). Ora accanto alla data breve solo se un'altra valutazione valida dello stesso test ha la stessa data: asse X, note, delta nello storico, dettaglio e PDF. Runbook TP-079. QA dal vivo desktop e 360 px. |
| BUG-010 / BUG-015 / BUG-017 (P3) | FIXED (015 VERIFIED) | Commit `50f6779`, su decisione dell'utente. BUG-015 verificato dal vivo; BUG-010 e BUG-017 coperti da unit test, non verificati dal vivo (servono un org_admin su piano free e un super_admin). |
| Hosting rankex-dev | DONE | `npm run deploy:all:dev` dopo `50f6779`; functions non toccate, non ridistribuite. |
| Regressione `npm run qa:dev` | 19/19 | Dopo il deploy di chiusura. |
| Stampa A4 del PDF | VERIFICATA (parziale) | Motore di stampa di Chromium (`page.pdf`, A4, media print) sul paziente QA Visita Sprint13: una pagina, impaginazione corretta. Interruzioni di pagina non esercitate (report di una sola pagina); stampante fisica non provata. |

## Goal
Il professionista legge per ogni test l'andamento della paziente, con delta e avvisi di
comparabilità corretti, e ne esporta il report PDF. **Raggiunto.**

## Completato
- **STORY-039 — storico e trend** (`fd14a3b`): grafico a tratti, badge "DIVERSA DALLA
  PRECEDENTE", livello `info` del seriale, `countLabel` client/server con parità. TP-073…077.
- **STORY-040 — PDF paziente** (`fa8ffef`): senza report di gruppo, solo tabelle, ultima valida
  per test, anche da staff_readonly. TP-078.
- **Ora nelle date dello stesso giorno** (`798a399`, decisione 2). TP-079.
- **Bug:** BUG-019 FIXED + VERIFIED (`3301529`); BUG-015 VERIFIED; BUG-010 e BUG-017 FIXED (`50f6779`).
- **Decisioni dell'utente prese tutte nello sprint:** le 3 domande di ADR-019 e le decisioni
  1-3 di chiusura. Nessuna resta "da confermare".

## Non completato (motivo)
- **Verifiche dal vivo mancanti:** "Aggiornamento in corso…" (TP-077), navigazione da tastiera
  tra le schede dei test, BUG-018 su hosting dev, BUG-010 (banner Team/impostazioni con limite 1,
  "1 presente" nel calendario) e BUG-017 (rankex-admin-dev). Interruzioni di pagina del PDF con
  un report di più pagine e stampa su carta.
- **STORY-029, requisiti non-codice** (DPA, testo informativa): BLOCKED, utente/legale. Blocca
  il go-live, non lo sprint.
- **Canvas da aggiornare** (non toccato dal codice): SALTA e l'avviso "Non salvati in questa
  visita" sulle tavole `Valutazione*` (dal #13); trend e PDF realizzati da allineare alle tavole
  `PazienteTrend`/`MobilePazienteTrend` e `ReportLipedema`.

## Blockers
- Nessuno tecnico. DPA / informativa: unico blocco al go-live di EPIC-010.

## Tech debt emerso
- **Plurali ancora inline:** BUG-010 è corretto con ternari locali in `MembersPage`,
  `OrgSettingsPage`, `NewClientView`, `CloseSessionModal`, perché `countLabel` vive in
  `utils/lipedema.js` (modulo-specifico). L'action item 2 del #13 ("fix di BUG-010 con lo
  stesso helper") è rispettato solo nel modulo lipedema.
- **`createdAt` delle org a tipi misti su rankex-dev:** le org create dai seed prima di `50f6779`
  hanno un Timestamp, le altre una stringa ISO. La lettura è normalizzata (`utils/orgDates.js`),
  ma `orderBy('createdAt')` in `getOrganizations` ordina per tipo; `joinedAt` dei membri nei seed
  è ancora un `serverTimestamp`.
- **Asse X del trend:** l'ultima etichetta a destra è tagliata su desktop ("09/1"); con l'ora
  le etichette a 360 px si toccano quasi. Cosmetico, non tracciato come bug.
- **Due valutazioni nello stesso minuto** (es. 07/11 10:29 ×2 nei dati QA) restano
  indistinguibili anche con l'ora. Caso limite dei dati di test, nessuna azione.

## Prossimo sprint (candidati)
Proposta, non pianificazione (decide l'utente):
1. **STORY-043 — bottone principale** (`themes.config.js` già modificato, non committato).
2. **STORY-044 — "Da sistemare".**
3. **Allineamento canvas** (SALTA, "Non salvati", PazienteTrend, ReportLipedema): fuori codice,
   ma è la spec UI e accumula ritardo da due sprint.
4. **Verifiche dal vivo rimaste** (TP-077, tastiera sulle schede, BUG-010/017/018) in un giro QA
   breve, con un org_admin su piano free e un super_admin di rankex-dev.
5. **Debito minore:** helper di plurale generico fuori dal modulo lipedema; migrazione
   `createdAt`/`joinedAt` a ISO sulle org di rankex-dev.
6. **STORY-029** resta BLOCKED (utente/legale).

## Retrospettiva
Dati: 7 commit (`fd14a3b`…`6809306`: 3 feature, 2 fix, 2 docs), 2/2 story DONE più la
decisione "ora stesso giorno" (`798a399`), 0 rework di story; bug BUG-019 (nuovo, VERIFIED),
BUG-015 VERIFIED, BUG-010 e BUG-017 FIXED non verificati dal vivo, BUG-018 deployato non
riverificato; nessun nuovo TD numerato; QA `qa:dev` 19/19.

**Verifica degli action item del #13**
1. Decisioni di STORY-039 prima del codice: **parziale**. Le decisioni su delta e badge sono
   state fissate in apertura (ADR-019), caso `qa:dev` aggiunto. Ma 2 decisioni (bilaterali
   interrotti, ora nello stesso giorno) sono state poste solo a fine sprint. Misura "0 da
   confermare" raggiunta, ma alla chiusura, non al design.
2. Helper unico di plurale: **no**. `countLabel` è usato nei messaggi nuovi, ma BUG-010 è
   corretto con ternari inline in 4 file e BUG-019 è emerso per un'unità del delta fuori da
   `countLabel`. Terzo plurale in tre sprint.
3. Stato di caricamento sulle riletture: **sì nel codice, parziale nella prova**. Implementato,
   ma TP-077 ("Aggiornamento in corso…") non verificato dal vivo.
4. QA a 360 px: **sì**. Desktop e 360 px per trend, badge, ora; 0 bug di layout mobile trovati.
5. BUG-015 e BUG-017 a inizio sprint: **no**. Esclusi in apertura, corretti a fine sprint
   (`50f6779`) su decisione dell'utente.

**WHAT WENT WELL**
- Storico/trend e PDF riusano un solo modello (`assessmentBadgeRules.js`, `assessmentFormat.js`,
  `lipedemaReportModel.js`): STORY-040 è un commit su STORY-039. Causa: ADR-019 scritto prima
  del codice, con le 3 domande risolte prima di partire.
- La parità client/server su `countLabel` e il caso `qa:dev` sono entrati nei commit di feature
  (19/19 dopo ogni deploy); le review medium hanno corretto motivo di interruzione e data BIA
  del PDF prima della QA.
- QA dal vivo sul nuovo ha preso BUG-019 e le scelte sull'ora; scope rispettato (043/044 fuori).

**WHAT WENT WRONG / CAUSED BUGS**
- BUG-019 (+1 ripetizioni), dopo BUG-010 e BUG-018. ROOT CAUSE: il plurale è ancora
  "n + sostantivo" costruito localmente; `countLabel` sta in `utils/lipedema.js`
  (modulo-specifico) e non copre unità dei delta né gli altri moduli. IMPACT: stesso difetto
  tre volte in tre sprint, trovato in QA dal vivo e non dai test. ACTION: azione 1.
- Verifiche dal vivo rimaste indietro (TP-077, tastiera sulle schede, BUG-010/017/018, PDF
  multipagina). ROOT CAUSE: la QA copre "solo il nuovo" e il deploy di chiusura arriva dopo
  i fix; mancano account di test pronti (org_admin su free, super_admin). IMPACT: 3 fix
  dichiarati FIXED senza prova. ACTION: azione 2.

**WHAT CAUSED REWORK**
- `798a399` (ora nelle date brevi) tocca 9 file, 5 già toccati da STORY-039/040 (`assessmentFormat`,
  `Registry`, `Trend`, `ReportModel`, `DetailModal`). ROOT CAUSE: il caso "due valutazioni lo
  stesso giorno" non era tra i casi limite di ADR-019. IMPACT: 1 commit di ~140 righe, dopo
  PDF e QA già fatti. ACTION: azione 3.
- Decisione "bilaterali interrotti" chiesta a fine sprint e confermata senza modifiche:
  stato ambiguo di STORY-039 fino all'ultimo (stesso schema del #13). ACTION: azione 3.

**WHAT WAS SLOW**
- Giri di QA e deploy ripetuti nello stesso giorno (deploy dopo STORY-039/040, dopo `798a399`,
  dopo `50f6779`) perché i fix P3 sono arrivati dopo la prima QA. Non un blocco, ma 3 giri.
- Canvas in ritardo da 2 sprint, ora 4 tavole (SALTA, "Non salvati", PazienteTrend/Mobile,
  ReportLipedema): è la spec UI ma si aggiorna solo a mano. ACTION: azione 4.

**WHAT CREATED TECHNICAL DEBT**
- Plurali inline in 4 file (vedi "Tech debt emerso"): debito creato da BUG-010 per non
  spostare `countLabel` fuori dal modulo.
- `createdAt` org a tipi misti su rankex-dev (Timestamp/ISO) e `joinedAt` dei seed:
  `orderBy('createdAt')` ordina per tipo. Lettura normalizzata, dati no. ACTION: azione 5.
- Cosmetici non tracciati: ultima etichetta dell'asse X tagliata, etichette vicine a 360 px.

**ACTION ITEM per lo Sprint #15** (max 5)
1. Helper di plurale generico fuori dal modulo lipedema (`utils/`, con copia e parità solo se
   serve al server), usato da `MembersPage`, `OrgSettingsPage`, `NewClientView`,
   `CloseSessionModal` e `formatMonoDelta`. Misura: 0 ternari `=== 1 ?` per plurali inline
   nei file elencati (grep) e un test con quantità 0/1/2 per ogni unità; 0 nuovi bug di plurale.
2. Giro QA breve a inizio sprint sulle verifiche rimaste: TP-077, tastiera sulle schede,
   BUG-010 (org_admin su free), BUG-017 (super_admin), BUG-018, PDF di più pagine. Misura:
   BUG-010/017/018 a VERIFIED e 0 voci "non verificato" nel "Non completato" del #15.
3. Sezione "Decisioni aperte e casi limite" in SPRINT.md all'apertura di ogni story UI, con
   elenco dei casi limite (stesso giorno, dati interrotti, un solo elemento). Misura: 0
   decisioni poste a fine sprint e 0 commit di feature dopo la QA della story.
4. Allineare il canvas come primo task, con time-box di mezza giornata: 4 tavole (SALTA,
   "Non salvati", PazienteTrend/Mobile, ReportLipedema). Misura: 0 tavole in ritardo a fine
   sprint; se non fatto, scalare lo sprint, non rimandare di nuovo.
5. Script una tantum per portare `createdAt`/`joinedAt` a ISO sulle org di rankex-dev
   (idempotente, solo rankex-dev) e togliere la normalizzazione di lettura se superflua.
   Misura: 0 doc con `createdAt` Timestamp (conteggio nello script) e ordine corretto in
   `getOrganizations`.

# SPRINT #13 — EPIC-010 Lipedema Edition, quarta ondata (HHD + OLS + sequenza di visita) — aperto il 2026-11-06, chiuso il 2026-11-09 (goal raggiunto)

**Branch:** `feature/lipedema-module`. Rules e functions si deployano solo da qui (ADR-014
rischio #4). **Nessun deploy in prod del modulo** (DPA non firmato, STORY-029).

**Goal:** il professionista registra tutti e 5 i test di una visita, uno dopo l'altro, e la
regressione dei flussi critici si lancia con un comando.

**Riferimento UI:** canvas RankEX (https://claude.ai/artifact/XxYxNXzRYT7gRLko4HEeuL), tavole
`ValutazioneHHD`, `ValutazioneOLS`, `Valutazione2MWT`, `ValutazioneSTS`, `Valutazione`, versioni
`Mobile*`, `Guida` e `StatiValutazione`.

**Story selezionate, nell'ordine:**
1. **STORY-037** — HHD quadricipite, sulla logica bilaterale di STORY-036.
2. **STORY-038** — One-Leg Standing.
3. **STORY-042** — sequenza di visita con i 5 test.
4. **Guida dei 5 test** in `TestGuidePage`, ultimo criterio aperto di STORY-033.
5. **STORY-041** — QA automatica contro `rankex-dev`.

**Fuori dal #13:** STORY-039 (trend), STORY-040 (PDF), STORY-043 (bottone principale nel codice),
STORY-044 ("Da sistemare").

**Status board:**

| Task | Status | Note |
|------|--------|------|
| STORY-037 — HHD | DONE | Commit `e651a9e`, su rankex-dev. QA TP-064…066 PASS il 07/11; il 09/11 PASS anche HHD interrotta con una gamba completa e deviazione che resta attiva dopo la descrizione (TP-066). |
| STORY-038 — OLS | DONE | Commit `c0b706f`, su rankex-dev. QA TP-067…069 PASS il 07/11; il 09/11 PASS i passi rimasti: errori al salvataggio con 60,5 e 30,25 (TP-067, testo da correggere: BUG-018), Correggi su un OLS salvato col motivo (TP-068), vista staff_readonly (TP-069). Confermato dall'utente il 09/11: il motivo di fine sulle prove non valide resta facoltativo. |
| STORY-042 — sequenza di visita | DONE | Commit `8aa0656`, `3174e31`, `6be2314` (BUG-014) e `e841900` (avviso "Non salvati in questa visita"), su rankex-dev. QA TP-070…071 PASS il 07/11 e il 09/11. Scelte confermate dall'utente: SALTA resta (non sull'ultimo test), i test salvati non si riaprono dalla barra (si usa Correggi), nessun documento "visita completa", su mobile "SALVA E PASSA A…" e "SALVA E CHIUDI". Da riportare sul canvas: SALTA e il nuovo avviso nelle tavole Valutazione*. |
| Guida dei 5 test | DONE | Commit `6a47362`, su rankex-dev. Verificata su mobile e desktop il 07/11; istruzioni verbali e checklist confrontate col testo dei docx. Chiude STORY-033. |
| STORY-041 — QA automatica | DONE | Commit `3237093` + fix della review high del 09/11 (guardie su identità del service account e Firestore effettivo, pulizia che ricontrolla prefisso e login del cliente, seed che non tocca account fuori da `qadev.*` né di altre org). `npm run qa:dev`: 18/18 verdi dopo i fix, nessun residuo. |
| BUG-018 — "al massimo 1 decimali" | DONE | Commit `68fa4f8`, testo identico client/server (parità), functions su rankex-dev; hosting dev con lo Sprint #14. |
| STORY-029 — requisiti non-codice | BLOCKED (fuori capacità developer) | Blocca il go-live, non la chiusura dello sprint. |

**Punti di attenzione:**
- **Implementazione in una sessione nuova:** regola "una sessione per sprint".
- **Copia speculare** `utils/lipedema.js` ↔ `shared/lipedema.js`: il test di parità è condizione di DONE.
- **Se il tempo non basta**, STORY-041 passa al #14: non si tagliano i test.

## Goal
Il professionista registra tutti e 5 i test di una visita, uno dopo l'altro, e la
regressione dei flussi critici si lancia con un comando. **Raggiunto.**

## Completato
- **STORY-037 — HHD quadricipite** (`e651a9e`) sulla logica bilaterale comune. QA TP-064…066 PASS.
- **STORY-038 — One-Leg Standing** (`c0b706f`): tetto 60 s, motivo di fine per prova. QA TP-067…069 PASS.
- **STORY-042 — sequenza di visita** (`8aa0656`, `3174e31`, `6be2314`, `e841900`). QA TP-070…071 PASS.
- **Guida dei 5 test** in `TestGuidePage` (`6a47362`): chiude STORY-033.
- **STORY-041 — QA automatica** (`3237093` + `36ff9e4` dalla review high): 18 test su
  rankex-app-dev, seed idempotente, pulizia `E2E-`. 18/18 verdi dopo i fix.
- **Bug:** BUG-014 e BUG-016 VERIFIED; BUG-018 FIXED (`68fa4f8`).
- **Decisioni confermate dall'utente il 09/11:** "SALVA E CHIUDI" a metà visita non mostra
  l'avviso "Non salvati in questa visita" (resta solo su "SALVA E CHIUDI LA VISITA"); il
  motivo di fine sulle prove OLS non valide resta facoltativo. Nessuna modifica al codice.

## Non completato (motivo)
- **BUG-015** (riepilogo screen reader dei bilaterali) e **BUG-017** ("Invalid Date" nel
  dettaglio org del super admin): aperti, P3, non correggerli senza conferma dell'utente.
- **STORY-029, requisiti non-codice** (DPA, testo informativa): BLOCKED, utente/legale. Blocca
  il go-live, non lo sprint.
- **Canvas da aggiornare** (non toccato dal codice): SALTA e l'avviso "Non salvati in questa
  visita" sulle tavole `Valutazione*`.

## Blockers
- Nessuno tecnico. DPA / informativa: unico blocco al go-live di EPIC-010.

## Tech debt emerso
- **Review high di STORY-041:** le guardie controllavano solo il campo `project_id` del JSON
  del service account; la pulizia si fidava del chiamante e cancellava l'account Auth del
  cliente senza verificarne org e `clientId`; il seed cancellava un account "rimasto" con
  l'email del cliente di base senza guardarne l'org; il limite del range di prefisso era un
  carattere invisibile (U+F8FF). Tutto corretto in `36ff9e4`. Lezione: ogni funzione che
  cancella con l'Admin SDK verifica da sé il progetto, non solo il punto d'ingresso.
- **Nota di STORY-039 (09/11):** delta e badge NON CONFRONTABILE sulla stessa riga. Passa
  allo Sprint #14 con le decisioni dell'utente.

## Prossimo sprint (candidati)
STORY-039 (storico, trend, non comparabilità) e, se ci sta, STORY-040 (PDF) → Sprint #14.

## Retrospettiva
Dati: 13 commit (`e651a9e`…`4a9a310`), 5/5 voci pianificate DONE, 0 rework di story; bug
BUG-014/016/018 trovati in QA (014 e 016 VERIFIED, 018 FIXED), BUG-015 e BUG-017 aperti P3;
nessun nuovo TD numerato.

**WHAT WENT WELL**
- La logica bilaterale di STORY-036 è stata riusata da HHD e OLS senza riscriverla: 037 e 038
  sono un commit ciascuno. Causa: nel #12 si è scelto di chiudere 035+036 prima di costruirci
  sopra (vedi "Fuori dal #12").
- Scope rispettato: le 5 voci previste, STORY-039/040/043/044 fuori, nessuna deriva. Causa:
  elenco "Fuori dal #N" scritto in apertura.
- La review `high` su STORY-041 ha preso 4 guardie deboli prima che la suite girasse su dati
  reali; QA sull'hosting reale (lezione BUG-009) ormai prassi.

**WHAT WENT WRONG / CAUSED BUGS**
- BUG-018 è lo stesso difetto di BUG-010 (plurale con quantità 1): i messaggi con un numero
  sono costruiti con template inline, non con un helper di pluralizzazione. ROOT CAUSE: nessun
  punto unico per "n + sostantivo", ogni messaggio nuovo lo reimplementa. IMPACT: stesso bug
  due volte in due sprint, fix da fare su due copie (client + server, parità). ACTION: azione 2.
- BUG-016 introdotto dalla review stessa di STORY-042 (rilettura in background senza stato di
  caricamento). ROOT CAUSE: operazione asincrona aggiunta senza chiedersi "cosa può fare
  l'utente mentre è in corso". IMPACT: valutazione iniziata su storico stale (precompilato e
  confronti sbagliati). ACTION: azione 3.
- BUG-014 (barra a 3 righe a 360 px) trovato solo in QA manuale. ROOT CAUSE: il layout della
  barra è stato verificato a 390 px, non alla larghezza minima supportata; BUG-012 del #11
  era della stessa famiglia (barra mobile). IMPACT: P2 corretto con 1 commit, ma costo di un
  giro QA. ACTION: azione 4.
- BUG-015 e BUG-013 (#11): stesso schema, un dato derivato (conteggio prove, ultimo valore)
  calcolato su una fonte diversa da quella mostrata (`trials.length` vs righe compilate; card
  vs storico). Aperti/corretti singolarmente, senza regola comune.

**WHAT CAUSED REWORK**
- Il fix `36ff9e4` dopo la review high: STORY-041 era stata scritta con guardie solo
  sull'ingresso (project_id nel JSON). ROOT CAUSE: codice distruttivo con Admin SDK scritto
  prima di una checklist di guardie. IMPACT: 1 commit di rework, nessun danno (18/18 verdi,
  nessun residuo) ma il rischio era cancellare account di un'altra org. ACTION: azione 1.
- Due decisioni (avviso "Non salvati", motivo OLS facoltativo) rimaste "da confermare" fino
  alla chiusura. ROOT CAUSE: domande all'utente poste a fine sprint, non al momento del
  design. IMPACT: nessuna modifica di codice, ma lo stato delle story è rimasto ambiguo
  per 3 giorni e il canvas non è riallineato.

**WHAT WAS SLOW**
- Riallineamento a mano del canvas (SALTA, avviso "Non salvati"): il canvas è la spec UI ma
  non si aggiorna dal codice, quindi diverge a ogni scelta presa in QA. Non è costo di
  codice ma si accumula: oggi 2 tavole in ritardo.
- STORY-041 ha richiesto seed, setup, teardown e 2 giri di guardie: investimento una tantum,
  ora ammortizzato dal comando `npm run qa:dev`.

**WHAT CREATED TECHNICAL DEBT**
- Nessun TD numerato, ma 2 bug P3 (BUG-015, BUG-017) e il canvas restano aperti; BUG-017 è
  di scripts/seed, non del modulo.
- Lo "Tech debt emerso" in coda alla sezione (guardie di cancellazione, nota STORY-039) è già
  tracciato; non duplicato in `docs/TECH-DEBT.md`.

**ACTION ITEM per lo Sprint #14** (max 5, da portare nella status board)
1. STORY-039: prima di scrivere il codice di storico/trend, fissare con l'utente le decisioni
   su delta e badge NON CONFRONTABILE (nota del 09/11) e loggarle in `docs/DECISIONS.md`;
   chiudere la story con almeno 1 caso `qa:dev` per il trend. Misura: 0 decisioni "da
   confermare" a fine sprint.
2. Helper unico di pluralizzazione per i messaggi con un numero (`utils/lipedema.js`, copia in
   `shared/lipedema.js`, test di parità) e adozione nei messaggi di STORY-039/040; fix di
   BUG-010 con lo stesso helper. Misura: grep di `${...} decimali`-style a zero nel modulo.
3. Regola di DONE per ogni nuova operazione asincrona in UI (rilettura, salvataggio): stato di
   caricamento che disabilita le azioni dipendenti, con un caso nel runbook o in `qa:dev`.
   Applicare a STORY-039 (carico dello storico per il trend).
4. QA mobile a 360 px (non solo 390) per le viste nuove di STORY-039/040; aggiungere un caso
   Playwright a 360×640 sul form bilaterale che verifica l'assenza di scroll orizzontale e che
   la barra resti sotto il 30 % dell'altezza. Misura: BUG di layout mobile trovati in QA = 0.
5. Correggere BUG-015 (contare le sole prove compilate) e BUG-017 (`createdAt` Timestamp in
   `OrgDetailView`) all'inizio dello sprint, dopo conferma dell'utente: due fix piccoli che
   evitano che P3 aperti si accumulino, ciascuno con un test.

---

# SPRINT #12 — EPIC-010 Lipedema Edition, terza ondata (30s-STS + Handgrip bilaterale) — aperto il 2026-10-31, chiuso il 2026-10-31 (goal raggiunto: review con 4 MEDIUM corretti, QA TP-054…063 PASS sull'hosting rankex-dev, nessun bug; non verificati per budget: layout mobile dei nuovi form, painMaxBySide, badge cambio dinamometro)

**Branch:** `feature/lipedema-module` (allineato a `origin/dev` in `27bfc55` all'apertura).
Rules e functions si deployano solo da qui (ADR-014 rischio #4). **Nessun deploy in prod
del modulo** (DPA non firmato, STORY-029).

**Goal:** il professionista registra 30s-STS e Handgrip con prove multiple per mano,
validità per prova e best calcolato dal server, con storico grezzo — e la logica
bilaterale è pronta per essere riusata da HHD e OLS.

**Story selezionate:**
1. **STORY-035** — 30s-STS (`lipedema_30s_sts`): prova singola come il 2MWT, ma con
   0 da invalidazione "uso braccia" distinto dallo 0 reale, errore tecnico separato da
   deviazione, setup sedia, familiarizzazione non conteggiata.
2. **STORY-036** — Handgrip: introduce l'infrastruttura **bilaterale multi-prova**
   (ordine alternato D-S, validità per prova, best per lato = max delle valide,
   Strongest/Weakest, simmetria, N/kgf con valore nativo conservato), scritta come
   logica condivisa in `utils/lipedema.js` ↔ `shared/lipedema.js` (test di parità).
3. **Criteri di STORY-033 rimandati dal #11, solo la parte bilaterale** — validità per
   prova + best sulle sole valide, dolore per prova e per lato, lato dominante: si
   verificano end-to-end su STORY-036, quindi chiudono insieme a lei.
4. **Workflow GitHub a Node 22** — `ci.yml`, `deploy.yml` (2 job), `e2e.yml` hanno
   ancora `node-version: '20'`, mentre `functions/` gira su Node 22 da `13052d6`.
   Task piccolo, prima del resto: allinea la CI al runtime reale.

**Fuori dal #12, candidati del #13 (motivo):**
- **STORY-037 (HHD) e STORY-038 (OLS)** dipendono da STORY-036. Metterle nello stesso
  sprint significa costruire due test sopra un'infrastruttura bilaterale non ancora
  passata da review e QA: se la review di 036 cambia la forma della logica condivisa,
  si rifanno tre test invece di uno. Il #11 aveva 3 story e ha prodotto 1 HIGH + 3
  MEDIUM in review e 3 bug in QA: quattro test più i criteri 033 più la guida sono
  oltre la capacità reale di un solo sviluppatore. Meglio chiudere 035+036 bene.
- **Guida dei 5 test in `TestGuidePage`** (criterio 033): va scritta quando esistono
  tutti e 5 i test, insieme a 037/038, per non pubblicare istruzioni di test non
  ancora registrabili.
- STORY-039 (storico/trend/non comparabilità) e STORY-040 (PDF) restano dopo.

**Sequenziamento:** workflow Node 22 → 035 (stesso schema del 2MWT, nessuna nuova
infrastruttura) e, in parallelo, design di 036 (Tech Lead: forma della logica bilaterale
condivisa, decimali dopo la conversione kgf→N, lato dominante del paziente o della
valutazione; ux-ui-designer: inserimento guidato delle 6 prove alternate su mobile) →
implementazione 036 + criteri 033 bilaterali → code review (verifica esplicita: logica
bilaterale riusabile da 037/038) → deploy dev (functions → rules → hosting) → **QA
sull'hosting reale** `rankex-app-dev.web.app`, desktop e mobile.

**Status board:**

| Task | Status | Note |
|------|--------|------|
| Workflow GitHub `node-version` 20 → 22 (`ci.yml`, `deploy.yml` ×2, `e2e.yml`) | DONE | Nessuna dipendenza. Verifica: CI verde su un push del branch. |
| STORY-035 — 30s-STS | DONE | Riusa schema/callable di STORY-033 come il 2MWT. `stopReasonCode`: stesso catalogo provvisorio del 2MWT. |
| STORY-036 — Handgrip + infrastruttura bilaterale multi-prova | DONE | Decisioni aperte: decimali dopo la conversione (rischio in backlog), lato dominante come dato del paziente o della valutazione (criterio 033). Da loggare in `docs/DECISIONS.md` prima di iniziare. |
| STORY-033 — criteri bilaterali rimandati (validità per prova, best sulle valide, dolore per lato, lato dominante) | DONE | Chiudono con 036, non separatamente. |
| STORY-029 — requisiti non-codice (DPA, testo informativa, privacy draft) | BLOCKED (fuori capacità developer) | Proprietario utente/legale. Bloccano il go-live, non la chiusura sprint. |

**Dipendenze bloccanti / punti di attenzione:**
- **Cloud Functions:** `aggiungiValutazione` estesa a due nuovi `testId`; deploy solo
  `deploy:dev`, runtime Node 22. **Il prossimo deploy delle functions in prod (anche
  per altri motivi) deve usare Node 22**: Node 20 è dismesso da Google dal 30/10.
- **`firestore.rules`:** nessuna modifica prevista (le valutazioni restano
  `write: false`). Se emerge, va segnalata qui prima di farla.
- **Copia speculare** `utils/lipedema.js` ↔ `shared/lipedema.js`: la logica bilaterale
  entra nel test di parità — condizione di DONE (ADR-014 rischio #3). Precedente del
  #11: il test di parità non deve importare file che dipendono da `firebase-functions`
  (la CI non installa `functions/node_modules`, `281bbe4`).
- **Osservazione UX accettata nel #11:** su mobile la barra del form copre la bottom
  tab bar durante la compilazione. Con le 6 prove dell'Handgrip il form è più lungo:
  l'ux-ui-designer lo tiene presente nel design di 036, senza riaprire il tema come
  lavoro di questo sprint.

**Scope creep — regola per questo sprint:** STORY-037…040, la guida test, i bug P3
aperti (BUG-003/005/007/008/010) e i TD aperti (TD-004…010) **non** entrano qui. Lavoro
emerso non pianificato → `docs/BACKLOG.md`.

**Prossimo sprint (candidati), in ordine:**
1. STORY-037 (HHD) e STORY-038 (OLS) sulla logica bilaterale di 036 + guida dei 5 test
   in `TestGuidePage` (ultimo criterio aperto di STORY-033)
2. STORY-039 (storico, trend, non comparabilità)
3. STORY-040 (export PDF paziente)
4. Bug P3 lipedema (BUG-003, BUG-010) se il Product Owner li vuole prima del go-live

---

# SPRINT #11 — chiuso il 2026-10-31

EPIC-010 Lipedema Edition, seconda ondata (informativa + Valutazione + 2MWT) — aperto
il 2026-10-30, branch `feature/lipedema-module`.

## Goal
Un professionista registra l'informativa e salva/annulla una valutazione 2MWT, con
storico grezzo verificabile. **Raggiunto.**

## Completato
- **STORY-029 (parte tecnica)** — `client.privacyNotice` solo via callable, audit
  `PRIVACY_NOTICE_RECORDED` con soli id, gate `failed-precondition` in
  `aggiungiValutazione` e `salvaBia`, banner sul paziente. Commit `cc42e34`.
- **STORY-033** — infrastruttura Valutazione (subcollection `assessments`, rules
  `write: false`, `aggiungiValutazione`/`annullaValutazione`, annulla + reinserisci,
  snapshot di comparabilità, coppia `utils/lipedema.js` ↔ `shared/lipedema.js` nel test
  di parità), per la parte verificabile col solo 2MWT. Commit `cc42e34`.
- **STORY-034** — 2MWT: distanza calcolata dal server, validazioni, percorso variante,
  stop anticipato, dati clinici opzionali pre/post. Commit `cc42e34`.
- **Code review:** 1 HIGH + 3 MEDIUM, tutti corretti prima della QA.
- **QA dal vivo sull'hosting reale** `rankex-app-dev.web.app` (non vite locale, lezione
  di BUG-009): tutta PASS.
- **BUG-011** (form compilato perso senza conferma), **BUG-012** (barra SALVA non fissa
  su mobile), **BUG-013** ("Ultime valutazioni" senza segnalare variante/interruzione) —
  trovati dalla QA, fixati in `769565d`, **VERIFIED** il 31/10 su rankex-app-dev
  (`27bfc55`).

## Non completato (motivo)
- **Criteri di STORY-033 non verificabili col solo 2MWT** — validità per prova e best
  sulle valide, dolore per lato, lato dominante, guida dei 5 test in `TestGuidePage`.
  Rimandati per scelta, già previsto all'apertura: i bilaterali al #12 con STORY-036,
  la guida con 037/038.
- **STORY-029, requisiti non-codice** (DPA art. 28 firmato, testo dell'informativa,
  privacy draft): BLOCKED, proprietario utente/legale. Bloccano il go-live, non lo
  sprint.
- Deploy in produzione del modulo: non previsto (DPA).

## Blockers
- Nessuno tecnico aperto.
- DPA / testo informativa (vedi sopra) — unico blocco al go-live di EPIC-010.

## Tech debt emerso
- **Runtime Cloud Functions portato a Node 22** (`13052d6`): Google ha dismesso Node 20
  il 30/10. Lavoro non pianificato ma obbligato (senza, niente deploy). Conseguenze
  aperte: (1) il prossimo deploy delle functions in **prod** dovrà usare Node 22;
  (2) i workflow GitHub (`ci.yml`, `deploy.yml`, `e2e.yml`) sono ancora su
  `node-version: '20'` → task nel Sprint #12.
- **CI rotta** da un import del test di parità verso un file che dipende da
  `firebase-functions` (la CI non installa `functions/node_modules`); corretta in
  `281bbe4` separando `shared/timezone.js`. Per la Retrospective: i file `shared/`
  importati dai test di parità devono restare puri, senza dipendenze di `functions/`.
- **Osservazione UX accettata, non un bug:** su mobile la barra del form (z-40) copre la
  bottom tab bar (z-30) durante la compilazione; si esce con INDIETRO, back dell'header
  o swipe, tutti con conferma (BUG-011/012). Da tenere presente nel design dei test
  multi-prova, più lunghi.
- Nessun nuovo TD numerato. Bug P3 e TD-004…010 invariati.

## Prossimo sprint (candidati)
STORY-035 + STORY-036 + criteri bilaterali di STORY-033 + workflow Node 22 → aperto come
Sprint #12, vedi sopra. Poi STORY-037/038 + guida test, 039, 040.

---
# SPRINT #10 — chiuso il 2026-10-30

EPIC-010 Lipedema Edition, prima ondata (fondamenta modulo) — aperto il 2026-10-24,
branch `feature/lipedema-module` da `dev`. Numerazione #10 e non #7: i numeri #7…#9
sono già stati usati su `feature/mobile-app` (TD-004).

## Goal
Un'org lipedema si crea, non mostra né calcola rank/XP, e gestisce pazienti senza
account.

## Completato
- **STORY-030** — modulo `lipedema`, capability esplicite in `getModule` (default
  restrittivo per moduli sconosciuti), terminologia Professionista/Paziente/
  Appuntamento, `shared/modules.js` + check di modulo nelle callable (ADR-008), cambio
  modulo bloccato con pazienti (rules + `OrgDetailView`). Commit `f71f73c`.
- **STORY-031** — niente rank/percentili/gamification nel modulo, lato UI e lato
  callable (XP/campionamento/obiettivi/avatar rifiutati; `chiudiSessione` e `salvaBia`
  senza XP). Commit `f71f73c`.
- **STORY-032** — wizard paziente senza account Auth, email facoltativa, audit
  `CLIENT_CREATED` senza nome; `eliminaCliente` con `listCollections` +
  `recursiveDelete`. Commit `f71f73c`.
- Tutte e tre **verificate dal vivo su rankex-dev** (QA 25/10, due giri: il primo su
  `f71f73c`, il secondo su `b119bfb` dopo i fix).
- **BUG-002** (terminologia hardcoded, P2), **BUG-004** (Elimina visibile a
  staff_readonly, P3), **BUG-006** (upgrade profilo da staff_readonly, P3) — fixati in
  `b119bfb`, **VERIFIED** dal vivo il 25/10.
- **BUG-009** (P0, fuori piano) — la CSP di `firebase.json` non ammetteva
  `*.cloudfunctions.net` in `connect-src`: **ogni** scrittura via callable era
  bloccata sull'hosting reale, produzione inclusa, dalla migrazione BE di luglio. Trovato
  dalla QA sull'hosting dev, fixato (`56905ee` su dev, verificato con smoke test su
  rankex-app-dev/rankex-admin-dev), pubblicato in produzione con hotfix `4f5d08e` su
  `main` il 26/10 (deploy-prod verde, header live verificato), poi riportato su dev
  (`2fb17a1`). Entrato nello sprint senza discussione: un P0 in prod ha precedenza su
  tutto.

## Non completato (motivo)
- Nessuna story pianificata lasciata a metà.
- Deploy in produzione del modulo lipedema: **non previsto** per scelta (nessuna org
  lipedema in prod prima del DPA, STORY-029).

## Blockers
- Nessuno tecnico aperto.
- BUG-009 in prod: header verificato, la prova di scrittura dal vivo in produzione è a
  cura dell'utente (da confermare in `docs/BUGS.md` quando fatta).

## Tech debt emerso
- **Bug P3 aperti** (non bloccanti, fuori sprint): BUG-003 (badge scrivibili
  direttamente su un paziente, stessa causa di TD-005), BUG-005 (tab BIA visibile nel
  soccer), BUG-007 (azioni di scrittura del calendario visibili in readonly), BUG-008
  (area atleta con terminologia PT fissa), BUG-010 (plurale con quantità 1 in lipedema).
- **TD aggiunti in sprint:** TD-007 (soccer dichiara `hasBia`/`hasProfileTypes` false
  ma la UI offre la BIA), TD-008 (`OrgDetailView` senza scelta di
  `terminologyVariant`), TD-009 (audit `CLIENT_DELETED` solo client-side,
  `CLIENT_CREATED` doppio), TD-010 (codice morto degli step 'test' in `useWizard`).
  TD-004/005/006 restano aperti dal design (24/10).
- **Tech debt di processo (per la Retrospective):** la CSP non era coperta da alcun
  test. Gli e2e e la QA locale girano su vite, che non applica gli header di
  `firebase.json`: il blocco di tutte le callable è rimasto invisibile per circa tre
  mesi ed è emerso solo perché la QA di questo sprint ha usato l'hosting dev reale.
  Da discutere: un test che verifichi la CSP rispetto ai domini usati dall'app, o un
  e2e minimo contro l'hosting deployato (suggerimento già in BUG-009); e la QA
  sull'hosting reale come passo fisso prima di chiudere una story che tocca callable.
- Pattern osservato: i fix di BUG-002 hanno toccato 48 file — la terminologia per
  modulo era una superficie più grande di quanto l'inventario ADR-007 prevedesse.

## Prossimo sprint (candidati)
STORY-029 (parte tecnica) + STORY-033 + STORY-034 → aperto come Sprint #11, vedi sopra.
Poi STORY-035/036, 037/038, 039, 040.

---

### SPRINT #6 — EPIC-007: Privacy & Data Protection, remediation P0 — aperto il 2026-09-14, archiviato il 2026-10-24

**Perché ora, fuori sequenza:** l'utente ha richiesto esplicitamente priorità massima sui
risultati del Privacy & Data Protection Audit appena consegnato dal Product Owner
(EPIC-007). Questo sprint scavalca il piano precedente (che vedeva solo EPIC-005 completa
come candidato) e si dedica **esclusivamente** a EPIC-007.

**Goal:** chiudere le story P0 di EPIC-007 risolvibili con solo lavoro tecnico in questo
sprint — STORY-015 (hardening regole `audit_logs`), STORY-016 (cascade delete completo in
`eliminaCliente`), STORY-017 (log reale dei login falliti, previa decisione Tech Lead) e
STORY-018 (messaggio di errore login generico) — mentre si avvia in parallelo, **fuori
capacità developer**, la raccolta di contenuti/decisioni per le altre due P0 dell'epic,
STORY-019 e STORY-020, oggi bloccate su input legale/di prodotto non producibile da chi
scrive codice.

**Story selezionate (P0 di EPIC-007 — STORY-015..020):**
- STORY-015 — hardening regola `create` su `/audit_logs/{logId}` (anti-spoofing uid/email/campi extra)
- STORY-016 — cascade delete completo in `eliminaCliente` (note, goal, slot, ricorrenze, notifiche, schede)
- STORY-017 — log reale dei login falliti (oggi silenzioso, nessuna entry scritta) — richiede prima una scelta di design Tech Lead tra 3 opzioni
- STORY-018 — messaggio di errore login generico (anti account-enumeration)
- STORY-019 — Privacy Policy + Cookie Policy in-app — **tracciata nello sprint per visibilità, non nella capacità developer** (vedi nota "Scorporo" sotto)
- STORY-020 — consenso genitoriale per minori soccer_academy — **tracciata nello sprint per visibilità, non nella capacità developer** (vedi nota "Scorporo" sotto)

**Sequenziamento (aggiornato dopo ADR-004 del Tech Lead — vedi `docs/DECISIONS.md`):**
1. STORY-018 parte subito — fix isolato di una riga, nessuna dipendenza.
2. STORY-015 e STORY-016 in parallelo — indipendenti tra loro (015 tocca solo
   `firestore.rules`, 016 tocca solo `eliminaCliente`).
3. STORY-017 è stata sbloccata dal Tech Lead (ADR-004): opzione (b), nuova Cloud
   Function callable `registraLoginFallito` (Admin SDK, invocabile senza auth, con
   throttle anti-spam) — **non tocca `firestore.rules`**, quindi non ha più alcun
   coordinamento di deploy con STORY-015. Procede indipendente in parallelo alle altre tre.
4. In parallelo, **fuori dallo sprint di sviluppo**: track "raccolta input" per
   STORY-019 e STORY-020 (vedi sotto).

**Status board:**

| Task | Status | Note |
|------|--------|------|
| STORY-018 — messaggio di errore login generico | **DEPLOYED (rankex-dev)** | Codice mergiato in `dev` (`ddef4a0`) e deployato: rules+functions live su rankex-dev. **Hosting rankex-dev non ancora ridistribuito** (dipende dal push su origin, bloccato — vedi Blockers) — il fix è verificabile solo in locale (`npm run dev`) finché l'hosting non si aggiorna. |
| STORY-015 — hardening regola `create` su `audit_logs` | **DONE (rankex-dev)** | `firestore.rules` deployata su rankex-dev (2026-09-15, worktree isolato `epic-007-privacy-remediation` → merge in `dev`). 47/47 test rules verdi pre-deploy. Non ancora su `fitquest-60a09` (prod). |
| STORY-016 — cascade delete completo in `eliminaCliente` | **DONE (rankex-dev)** | Verifica fixture live eseguita con successo su `test-org-pt`: creato un cliente reale con nota+obiettivo+slot+ricorrenza+notifica+scheda, chiamato `eliminaCliente`, confermato — cliente e subcollection `notes`/`goals` cancellati, notifica e scheda cancellate, slot/ricorrenza (condivisi) ripuliti del riferimento ma non cancellati per intero. `clientCount` ripristinato dopo il test (il fixture non passava da `creaCliente`). Nessun residuo lasciato sull'org di test. Non ancora su prod. |
| STORY-017 — log reale dei login falliti | **DONE (rankex-dev)** | `registraLoginFallito` deployata ("Successful create operation") + indice composito deployato. **Smoke test live eseguito con successo**: chiamata diretta all'endpoint HTTPS (`curl` verso `europe-west1-rankex-dev.cloudfunctions.net/registraLoginFallito`) → `{"result":{"ok":true}}`, HTTP 200 — la funzione scrive senza errori (un fallimento della write via Admin SDK avrebbe fatto fallire la callable con 500). Non ancora su prod. |
| STORY-019 — Privacy Policy + Cookie Policy in-app | BLOCKED (fuori capacità developer) | Track parallelo aperto: "raccogliere contenuto legale" — proprietario utente/consulente esterno. Non impegna il developer, non condiziona la chiusura di questo sprint. |
| STORY-020 — consenso genitoriale minori | BLOCKED (fuori capacità developer) | Track parallelo aperto: "raccogliere decisione Titolare del trattamento + modalità di raccolta consenso" — proprietario utente. Non impegna il developer, non condiziona la chiusura di questo sprint. |

**Blockers:**
- Deploy su rankex-dev completato il 2026-09-15: `firestore.rules`, indice
  composito `audit_logs`, e tutte le 34 Cloud Functions (incl. `eliminaCliente`
  aggiornata e `registraLoginFallito` nuova). Eseguito da un worktree isolato
  (`epic-007-privacy-remediation`, poi fast-forward in `dev` in locale) per non
  interferire con una sessione concorrente attiva su `feature/mobile-app` nella
  cartella di lavoro condivisa.
- Il branch `dev` locale è avanzato oltre `ddef4a0` (fix + aggiornamenti di
  processo) ma non è stato ancora inviato a origin — resta da fare
  manualmente. Finché non arriva su origin: nessun aggiornamento automatico
  dell'hosting rankex-dev, e chi lavora su altre copie del repository non vede
  questi commit.
- **Verifica fixture live STORY-016 completata** (2026-09-15): cliente di test
  reale su `test-org-pt` con nota+obiettivo+slot+ricorrenza+notifica+scheda →
  `eliminaCliente` → tutte le verifiche passate, zero residui, `clientCount`
  ripristinato. Script one-off eliminato dopo l'uso (non era pensato per
  riutilizzo — path relativi specifici a questo ambiente).
- **Tutte e 4 le story in capacità developer (STORY-015/016/017/018) sono ora
  DONE su rankex-dev.** Resta: ripetere l'intera sequenza di deploy su
  `fitquest-60a09` (prod) dopo un merge `dev`→`main`, e il push di `dev` su
  origin (vedi sopra) come prerequisito.
- STORY-019 e STORY-020 restano bloccate su input non tecnico (contenuto legale
  approvato + decisione dell'utente su Titolare del trattamento/raccolta consenso
  minori) — nessuna stima di sviluppo possibile finché non arrivano. Vedi nota
  "Scorporo" sotto per come vengono gestite senza tenere in ostaggio lo sprint.

**Tech debt di processo emerso in questo sprint (per la Retrospective):** il primo
giro di implementazione delle 4 story ha introdotto, oltre allo scope approvato,
un'intera feature non richiesta e non passata da product-owner/tech-lead (scaffold
app mobile nativa Capacitor/Android, hook `useNativeBackButton`/`useNativePush`,
wiring FCM in `firestore.rules`/`clients.js`, trigger push notification) — inclusi
build artifact Android/Gradle binari nel working tree. Rilevato e rimosso
interamente prima della code review (nessuna traccia arrivata a quello stadio).
Causa non accertata (non è possibile determinare dal solo working tree se sia stato
un errore di scope del Developer o un'interferenza esterna). Azione da valutare in
Retrospective: verificare lo scope effettivo di ogni implementazione (`git status`
completo, non solo i file attesi) subito dopo ogni sessione di sviluppo, prima di
passare a code review — non solo per gli sprint sensibili come questo.

**Nota Scrum Master — scorporo delle story bloccate dallo sprint tecnico:**
STORY-019 e STORY-020 restano nell'epic e sono elencate sopra per tracciabilità (priorità
P0, richiesta esplicita dell'utente), ma **non fanno parte della capacità di sviluppo di
questo sprint** e non ne condizionano la chiusura. Motivo: un lead time legale/di
decisione (contenuto Privacy Policy approvato, scelta Titolare del trattamento) non è
stimabile né accelerabile da lavoro tecnico, e tenerle "IN PROGRESS" nello sprint
tecnico per un tempo indefinito violerebbe il principio FINIRE > INIZIARE — lo sprint
rischierebbe di non chiudere mai in attesa di un input che non dipende dal developer.
Al posto di bloccare l'intero sprint, apro subito un **task parallelo non-developer**
("raccogliere contenuto/decisione") con proprietario l'utente, che può procedere in
qualunque momento senza aspettare la chiusura di questo sprint. Quando input e decisione
arrivano, STORY-019/020 (insieme a STORY-021 e STORY-026, bloccate per lo stesso motivo
ma priorità P1/P2) diventano un candidato naturale per un prossimo sprint — non serve
uno sprint "parallelo" formale con la sua status board: basta non far dipendere la
chiusura di *questo* sprint dal loro esito.

**Archiviato il 2026-10-24 dallo Scrum Master, senza una chiusura formale in questo file.**
Le 4 story tecniche (STORY-015…018) erano DONE su rankex-dev; il lavoro EPIC-007
successivo (DPA, export, cancellazione org, font locali, backup — commit `91d9de7`,
`5fe04fc`, `12e8709`) è stato fatto fuori da questa status board. Una chiusura formale
di Sprint #6 esiste solo su `feature/mobile-app` (commit `bba54ab`), mai arrivata su
`dev` (TD-004). Spostato qui per avere un solo sprint attivo; stato attuale delle
story EPIC-007 in `docs/BACKLOG.md`.

---

### SPRINT #5 — EPIC-002: pulizia debito minore — chiuso il 2026-09-14

**Goal:** chiudere le due ultime story P3 in backlog, nessuna dipendenza esterna.

**Completato:**
- STORY-003 — rimosso il wrapper `calcPercentile` (0 consumer applicativi già
  confermato da lug 2026). Test dedicato rimosso (era tautologico senza il wrapper),
  commento residuo in `tables.js` corretto, CLAUDE.md aggiornato. 211/211 test verdi.
- STORY-004 — `VITE_GOOGLE_FIT_CLIENT_ID` rimossa da `.env.example`, previa conferma
  esplicita dell'utente (nessun flusso OAuth diretto pianificato che la usi).

**Non completato:** nessuno.

**Blockers:** nessuno.

**Tech debt emerso:** nessuno.

**Prossimo sprint (candidati):** nessun item P1/P2 aperto — solo EPIC-005 completa,
bloccata sulle stesse dipendenze esterne di sempre (vedi Sprint #3/#4).

---

### SPRINT #4 — Avatar + Negozio: spike tecnico (override ADR-002) — chiuso il 2026-09-14

**Goal:** dopo la raccomandazione di non procedere (Sprint #3), l'utente ha scelto
esplicitamente — tra 3 opzioni presentate, rischio incluso nella descrizione — uno
spike tecnico senza arte reale. Non un nuovo sprint pianificato, una continuazione
diretta della stessa conversazione/decisione.

**Completato:**
- STORY-014 — meccanica Monete + negozio riusando le 9 immagini avatar esistenti
  (nessuna arte nuova, nessun sistema a 6 slot, nessun flusso B2B — scope ridotto
  rispetto alla visione completa, per scelta esplicita, vedi ADR-003).
- Guadagno Monete solo da sessione presente (`chiudiSessione`), acquisto via nuova
  Cloud Function `acquistaAvatar` con transazione Firestore (non batch).
- **Verificato dal vivo contro rankex-dev**, non solo per lettura di codice: script
  one-off con auth REST + invocazione diretta della callable — rifiuti corretti
  (avatar non acquistabile, Monete insufficienti, doppio acquisto), acquisto riuscito
  con decremento Monete e inventario aggiornato. Dati di test ripuliti dopo la verifica.
- 5 nuovi test unitari (`isAvatarUnlocked`), build+lint+vitest puliti.

**Non completato:** deploy su prod — resta su rankex-dev in attesa di conferma.

**Blockers:** nessuno tecnico.

**Tech debt emerso:** nessuno nuovo. Rischio già dichiarato in ADR-003: se questo
spike non porta a validazione reale, è candidato esplicito a rimozione come codice
morto in un futuro audit (stesso destino di Wearable/ContextNav documentato altrove).

**Prossimo sprint (candidati):** EPIC-002 (pulizia minore) resta l'unico item senza
dipendenze esterne. Deploy prod dello spike, se l'utente lo conferma.

---

### SPRINT #3 — Avatar + Negozio: discovery — chiuso il 2026-09-14

**Goal:** valutare EPIC-005 (Product Analyst + Tech Lead), zero codice, come richiesto
esplicitamente dalla Roadmap futura ("allinearsi con il team prima di iniziare").

**Completato:**
- STORY-011 — valutazione valore: **raccomandazione di non procedere ora**. Non un
  giudizio tecnico, tre dipendenze esterne reali (asset grafici, bilanciamento
  economia via playtesting, flusso B2B che richiede org clienti interessate) che il
  codice da solo non risolve.
- STORY-012 — modello economico: fonti di Monete confermate dalla roadmap, importi
  non definibili senza playtesting. Superficie di integrazione tecnica identificata:
  tocca più Cloud Function esistenti coordinate (chiudiSessione, salvaCampionamento,
  salvaBia, sistema badge), non una sola nuova.
- STORY-013 — scoping tecnico: modello dati raffinato, pronto da riprendere. Stimato
  più grande di Obiettivi+Runbook insieme se/quando si procede.

**Non completato:** l'implementazione — per scelta, non per blocco tecnico (vedi ADR-002).

**Blockers:** risposte dell'utente su priorità/budget arte/validazione economia — non
risposte che il processo può dare da solo.

**Tech debt emerso:** nessuno — discovery pura, zero codice toccato.

**Prossimo sprint (candidati):** EPIC-002 (pulizia minore, eseguibile subito) se
EPIC-005 resta bloccata; EPIC-005 stessa se le domande aperte si sbloccano.

---

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
