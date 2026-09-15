# Privacy Policy — BOZZA TECNICA (non pubblicata, non legalmente vincolante)

**Stato: DRAFT — richiede revisione legale prima di qualunque pubblicazione.**
Prodotta per STORY-020 (`docs/BACKLOG.md` → EPIC-008) come punto di partenza
tecnicamente accurato: ogni voce sui dati raccolti è verificata sul codice reale
(non inventata), ma le sezioni marcate `[DA DEFINIRE]` richiedono una decisione
legale/aziendale che non può essere presa da questo processo. Non contiene
consulenza legale.

---

## 0. Come leggere questo documento

RankEX è una piattaforma SaaS **B2B**: il cliente contrattuale di RankEX è
l'organizzazione (personal trainer, palestra, accademia calcistica — `organizations/
{orgId}`), non il singolo atleta/cliente finale. Questo ha una conseguenza legale
precisa, da confermare con un legale ma tecnicamente coerente col modello dati:

- **L'organizzazione è il Titolare del trattamento** (data controller) dei dati dei
  propri clienti/atleti — decide perché e come i dati vengono raccolti (es. quali test
  atletici, quali categorie di clienti).
- **RankEX è il Responsabile del trattamento** (data processor) — fornisce
  l'infrastruttura tecnica e tratta i dati solo per conto e su istruzione
  dell'organizzazione.
- **Implicazione pratica:** serve un **Data Processing Agreement (DPA)** tra RankEX e
  ogni organizzazione cliente — oggi non risulta esistere (nessun riferimento nel
  codice o nella documentazione). `[DA DEFINIRE]` — verificare se esiste già fuori dal
  repo o se va prodotto.

---

## 1. Titolare del trattamento (per i dati raccolti da RankEX come piattaforma)

`[DA DEFINIRE]` — ragione sociale, indirizzo, contatti, eventuale DPO/referente
privacy. Non deducibile dal codice.

## 2. Dati raccolti

Verificato sul codice (non ipotetico), coerente con `mobile-app/docs/MOBILE-APP.md` →
"Privacy — checklist":

| Categoria | Dati | Dove |
|---|---|---|
| Autenticazione | Email, password (hash gestito da Firebase Auth) | Firebase Auth |
| Anagrafica cliente/atleta | Nome, età, sesso, peso, altezza, email | `clients/{clientId}` |
| Dati sportivi | Test atletici, categoria, storico campionamenti, XP, rank, streak, badge | `clients/{clientId}` |
| **Dati sanitari** (categoria particolare, art. 9 GDPR) | Composizione corporea (BIA): massa grassa, massa muscolare, acqua corporea, massa ossea, BMI, età metabolica, grasso viscerale | `clients/{clientId}.biaHistory` — solo modulo `personal_training` |
| Note e commenti | Testo libero inserito da trainer/org_admin sul cliente | `clients/{clientId}/notes` |
| Obiettivi | Target percentile su un test, scadenza | `clients/{clientId}/goals` |
| Log attività | Cronologia azioni (sessioni, XP guadagnati) | `clients/{clientId}.log[]` |
| Dispositivo (solo app mobile) | Token push (FCM), per notifiche | `clients/{clientId}.fcmTokens[]` |
| Audit di sistema | Login/logout, cambio password/email, azioni amministrative — **non** consultabile dall'interessato, solo da super_admin per finalità di sicurezza | `audit_logs/{logId}` |

**Non raccolto** (verificato via grep, non solo dichiarato):
- Nessun tracciamento/analytics — `getAnalytics()` di Firebase non è mai chiamato
- Nessun dato da provider wearable/Google Fit — feature disattivata, il flusso di
  collegamento è stato rimosso dal codice
- Nessun login social/OAuth — solo email+password
- Nessun cookie di profilazione o marketing

### Dati di minori
I moduli `soccer_academy` includono fasce d'età `soccer_youth` (7-9 anni) e
`soccer_junior` (10-13 anni) — RankEX quindi tratta, per conto delle organizzazioni
clienti, dati di minori. RankEX non raccoglie questi dati direttamente da un minore
(nessuna interfaccia "il bambino si registra da solo") — è l'organizzazione (titolare)
a inserirli, nell'ambito del proprio rapporto con la famiglia. **Implicazione per il
DPA:** il contratto con l'organizzazione dovrebbe imporre esplicitamente che
l'organizzazione abbia ottenuto il consenso del genitore/tutore prima di inserire dati
di un minore in RankEX — non è qualcosa che la piattaforma può verificare
tecnicamente. `[DA DEFINIRE — clausola contrattuale, non tecnica]`

## 3. Finalità del trattamento

- Erogazione del servizio (tracking performance atletiche, gamification, calendario,
  comunicazioni operative trainer↔cliente)
- Sicurezza (audit log, prevenzione abusi)
- Nessuna finalità di marketing, profilazione pubblicitaria o vendita a terzi

## 4. Base giuridica `[DA CONFERMARE CON LEGALE]`

Presumibilmente: esecuzione del contratto tra l'organizzazione e il proprio
cliente/atleta (RankEX, come processor, si appoggia alla base giuridica del titolare).
Per i dati sanitari (BIA, art. 9 GDPR) serve una base giuridica specifica — tipicamente
consenso esplicito dell'interessato, raccolto dall'organizzazione.

## 5. Sub-responsabili del trattamento (sub-processor)

**Google Firebase** (Google LLC / Google Ireland) — unico sub-processor:
- Firebase Authentication (credenziali di accesso)
- Cloud Firestore (tutti i dati applicativi)
- Cloud Functions (region `europe-west1`)
- Firebase Hosting
- Firebase Cloud Messaging (solo app mobile, token push)

Nessun altro fornitore terzo tratta dati RankEX (verificato: nessuna integrazione
esterna nel codice oltre Firebase).

`[DA DEFINIRE]` — regione di residenza dati Firestore (verificare configurazione
progetto Firebase), rilevante per eventuali trasferimenti extra-UE.

## 6. Conservazione dei dati `[DA DEFINIRE]`

Nessuna retention policy tecnica implementata oggi (nessun TTL/cron di cancellazione
automatica). I dati restano finché l'organizzazione o RankEX non li cancella
esplicitamente (vedi §7).

## 7. Diritti dell'interessato e cancellazione

Diritti GDPR applicabili (artt. 15-22): accesso, rettifica, cancellazione,
portabilità, limitazione, opposizione.

**Processo di esercizio dei diritti (vedi ADR-004, `docs/DECISIONS.md`):**
richiesta via il canale di supporto dell'organizzazione o di RankEX → verifica identità
→ esecuzione da parte di super_admin/org_admin con gli strumenti amministrativi
esistenti (cancellazione cliente, rimozione membro — cancellano account Auth + dati
Firestore associati). Processo manuale, non self-service, per il volume attuale di
richieste attese.

## 8. Sicurezza

Misure tecniche già in produzione (dettaglio in `CLAUDE.md` → "Sicurezza"): Firestore
Rules per-ruolo, audit log append-only, timeout di sessione differenziato per ruolo,
password policy (8+ caratteri, maiuscola, numero), header di sicurezza HTTP
(CSP/X-Frame-Options/ecc.), cifratura in transito (HTTPS/TLS).

## 9. Modifiche alla presente policy
`[DA DEFINIRE]` — modalità di notifica agli utenti in caso di modifiche sostanziali.

## 10. Contatti
`[DA DEFINIRE]`

---

## Checklist per la revisione legale (prima della pubblicazione)
- [ ] Compilare tutte le sezioni `[DA DEFINIRE]`
- [ ] Confermare/correggere il modello Titolare(org)/Responsabile(RankEX) di §0 — è
  un'inferenza dal modello dati multi-tenant, non una consulenza legale
- [ ] Verificare necessità di un DPA standard da far firmare a ogni nuova
  organizzazione in fase di onboarding
- [ ] Confermare retention policy e comunicarla tecnicamente (oggi non implementata)
- [ ] Tradurre/pubblicare in inglese se si prevedono utenti fuori Italia
- [ ] Pubblicare a un URL stabile e linkarlo da login/registrazione + store listing
  (Play Console / App Store Connect)
