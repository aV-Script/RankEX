# RankEX — Test Plan Manuale

> Versione maggio 2026  
> Copre le US non verificabili con unit test: flussi UI, Firebase Auth/Firestore, OAuth, ruoli, PDF.  
> I test unitari (Vitest) coprono separatamente la logica di business pura.

---

## Legenda

| Simbolo | Significato |
|---------|-------------|
| 🔴 Bloccante | Il fallimento blocca il rilascio |
| 🟡 Importante | Da correggere prima del rilascio se possibile |
| 🟢 Nice-to-have | Può passare a ticket separato |
| ✅ Passed | Test superato |
| ❌ Failed | Test fallito — annotare comportamento effettivo |
| ⏭ Skipped | Saltato — annotare motivo |

**Ambiente di test:** `rankex-dev` (Firebase development)  
**URL:** `http://localhost:5173` (dev server) oppure `rankex-app-dev.web.app`

---

## Accounts di test consigliati

| Ruolo | Email | Note |
|-------|-------|------|
| super_admin | admin@test.rankex | accesso a rankex-admin.web.app |
| org_admin | orgadmin@test.rankex | org `test-org-pt` (personal_training) |
| trainer (PT) | trainer@test.rankex | org `test-org-pt` |
| trainer (Soccer) | coach@test.rankex | org `test-org-soccer` |
| staff_readonly | staff@test.rankex | org `test-org-pt` |
| client | client@test.rankex | cliente `Mario Rossi` in `test-org-pt` |

---

## 1. Autenticazione

---

#### TP-001 · US-001 🔴 — Login e redirect per ruolo
**Precondizioni:** Account esistenti per ogni ruolo.

**Passi:**
1. Aprire `http://localhost:5173`
2. Inserire credenziali valide di un trainer → cliccare Login
3. Verificare il redirect alla TrainerShell
4. Fare logout, ripetere con org_admin → verificare TrainerShell + tab org
5. Fare logout, ripetere con client → verificare ClientView
6. Fare logout, aprire `rankex-admin` → accedere con super_admin → AdminShell
7. Tentare login con password errata → verificare messaggio d'errore leggibile

**Risultato atteso:**
- Ogni ruolo vede solo la propria area
- Errori Firebase tradotti in italiano (es. "Credenziali non valide")
- Nessun redirect a pagine non autorizzate

---

#### TP-002 · US-002 🟡 — Reset password via email
**Precondizioni:** Account esistente con email valida.

**Passi:**
1. Nella pagina login, cliccare "Password dimenticata?"
2. Inserire l'email dell'account → cliccare Invia
3. Verificare la schermata di conferma ("Email inviata")
4. Aprire la casella email → aprire il link di reset
5. Impostare una nuova password valida
6. Accedere con la nuova password

**Risultato atteso:**
- Email ricevuta entro 2 minuti
- Link funzionante (non scaduto)
- Login con nuova password riuscito

---

#### TP-003 · US-003 🔴 — Cambio password obbligatorio al primo accesso
**Precondizioni:** Creare un cliente con `mustChangePassword: true` tramite wizard.

**Passi:**
1. Accedere con le credenziali del nuovo cliente
2. Verificare che la dashboard NON sia accessibile — compare `ChangePasswordScreen`
3. Tentare di navigare via URL diretto alla dashboard → deve restare su ChangePasswordScreen
4. Inserire la password temporanea errata → verificare errore
5. Inserire la password temporanea corretta + nuova password che non rispetta la policy → errore specifico
6. Inserire password valida (min 8 car., 1 numero, 1 maiuscola) → confermare
7. Verificare accesso alla dashboard client

**Risultato atteso:**
- La dashboard è inaccessibile finché il cambio non è completato
- I messaggi di errore sono specifici (es. "Deve contenere almeno un numero")
- Dopo il cambio, `mustChangePassword` = false in Firestore

---

#### TP-004 · US-004 🟡 — Session timeout automatico
**Precondizioni:** Modificare temporaneamente la soglia di timeout a 1 minuto nel codice (o testare con il timeout reale del proprio ruolo).

**Passi:**
1. Accedere come trainer
2. Rimanere inattivi (nessun movimento mouse, tastiera, touch) per la durata del timeout
3. Verificare il logout automatico e il redirect alla pagina di login
4. Verificare che dopo l'attività (mousemove) il timer si azzeri

**Risultato atteso:**
- Logout automatico allo scadere del timer senza azione dell'utente
- L'attività (mousemove) azzera il timer

---

#### TP-005 · US-005 🟡 — Logout esplicito e audit log
**Precondizioni:** Accesso come trainer o org_admin.

**Passi:**
1. Accedere e fare logout tramite il bottone nell'interfaccia
2. Verificare il redirect alla pagina di login
3. Verificare (come super_admin) che esista un documento in `/audit_logs` con `action: 'LOGOUT'` e `uid` corretto

**Risultato atteso:**
- Sessione terminata, redirect al login
- Record di audit creato con timestamp, uid, userAgent

---

## 2. Gestione Clienti

---

#### TP-006 · US-006 🔴 — Lista clienti
**Precondizioni:** Organizzazione con almeno 5 clienti di categorie diverse.

**Passi:**
1. Accedere come trainer → aprire ClientsPage
2. Verificare che tutti i clienti dell'org siano visibili
3. Verificare che ogni card mostri nome, categoria/ruolo, rank, XP
4. Usare la ricerca testuale → verificare il filtraggio
5. Cambiare l'ordinamento (nome / rank / data) → verificare il riordino

**Risultato atteso:**
- Lista completa e corretta
- Ricerca e ordinamento funzionanti senza refresh

---

#### TP-007 · US-007 🟡 — Filtro clienti per categoria / ruolo / fascia
**Precondizioni:** Org con clienti di almeno 2 categorie diverse (PT) o 2 fasce (Soccer).

**Passi (PT):**
1. Aprire FiltersSidebar → selezionare "Health"
2. Verificare che solo i clienti Health siano visibili
3. Selezionare "Active" → lista aggiornata
4. Rimuovere il filtro → tutti i clienti tornano visibili

**Passi aggiuntivi (Soccer):**
5. In org Soccer, verificare presenza del filtro FASCIA solo se ci sono ≥2 fasce
6. Filtrare per "Pulcini" → solo clienti `soccer_youth`
7. Filtrare per ruolo "Portiere" → solo portieri

**Risultato atteso:**
- I filtri sono esclusivi e combinabili
- Il filtro FASCIA non appare se tutti i clienti hanno la stessa fascia

---

#### TP-008 · US-008 🔴 — Wizard nuovo cliente PT
**Precondizioni:** Org PT non al limite clienti.

**Passi:**
1. Aprire NewClientView → cliccare "NUOVO CLIENTE"
2. Step Anagrafica: compilare nome, data nascita (1990-05-15), sesso M, peso 75, altezza 180, email unica
3. Step Categoria: selezionare "Active" → verificare lista dei 5 test mostrati
4. Step Tipo profilo: selezionare "Test + BIA (Complete)"
5. Step Credenziali: inserire password valida → creare
6. Verificare il cliente nella lista clienti
7. Accedere con le credenziali del nuovo cliente → verificare `mustChangePassword` attivo

**Risultato atteso:**
- Cliente creato in Firestore con categoria, profileType, credenziali
- `clientCount` incrementato di 1 sull'org
- Audit log `CLIENT_CREATED` presente

---

#### TP-009 · US-008 🔴 — Wizard nuovo cliente Soccer
**Precondizioni:** Org Soccer non al limite.

**Passi:**
1. Aprire wizard → Step Anagrafica: data nascita per un 8enne (Pulcini)
2. Step Ruolo: selezionare "Portiere"
3. Step Credenziali: creare
4. Verificare che il cliente abbia `categoria: 'soccer_youth'` e `profileType: 'tests_only'`
5. Ripetere con data nascita per un 12enne → verificare `soccer_junior`
6. Ripetere con data nascita per un 16enne → verificare `soccer`

**Risultato atteso:**
- La categoria è derivata automaticamente dall'età, non inserita manualmente
- Il ruolo (portiere) è salvato ma non altera la categoria

---

#### TP-010 · US-009 🔴 — Elimina cliente
**Precondizioni:** Cliente esistente.

**Passi:**
1. Aprire la scheda del cliente → trovare l'azione "Elimina"
2. Verificare il ConfirmDialog (primo step generico)
3. Annullare → verificare che il cliente esista ancora
4. Riaprire → confermare → inserire il nome del cliente
5. Verificare la rimozione dalla lista
6. Verificare `clientCount` decrementato di 1

**Risultato atteso:**
- Il cliente viene eliminato solo dopo doppia conferma con digitazione del nome
- `clientCount` decrementato atomicamente

---

## 3. Dashboard Cliente — Vista Trainer

---

#### TP-011 · US-010/011/012 🔴 — Scheda atleta e navigazione tab
**Precondizioni:** Cliente con almeno un campionamento.

**Passi:**
1. Aprire la dashboard del cliente
2. Desktop: verificare pannello sinistro sticky con avatar, badge, XPBar, livello
3. Mobile (< 1024px): verificare tab AVATAR come prima tab, nascosta su desktop
4. Navigare tra le tab (Panoramica, Test, BIA, Note, Misure, Scheda, XP Trend, Sessioni)
5. Verificare che ogni tab mostri il contenuto corretto
6. Verificare rank e media percentile nella scheda atleta

**Risultato atteso:**
- Layout 2 colonne su desktop, colonna unica su mobile
- Tab AVATAR visibile solo su mobile
- Rank e colore coerenti con la media dei test

---

#### TP-012 · US-013/014/015 🔴 — Campionamento con percentili live e salvataggio
**Precondizioni:** Cliente PT (active) con e senza campionamenti precedenti.

**Passi:**
1. Aprire tab Test → avviare campionamento
2. Inserire un valore nel primo campo → verificare aggiornamento percentile in tempo reale
3. Inserire un'età che genera `outOfRange` → verificare banner ambra
4. Completare tutti i test con valori realistici
5. Verificare anteprima rank con i nuovi valori
6. Cliccare SALVA → verificare: stats aggiornate, media calcolata, XP assegnato
7. Verificare che il campionamento appaia in testa allo storico

**Risultato atteso:**
- Percentili aggiornati a ogni keystroke senza chiamate Firestore
- Banner ambra per età fuori norma
- Dopo SALVA: XP corretti (50 per primo camp.), rank aggiornato, log aggiornato

---

#### TP-013 · US-017/018 🟡 — Note thread trainer → cliente
**Precondizioni:** Cliente esistente.

**Passi:**
1. Aprire tab Note → creare una nuova nota root
2. Verificare la nota nella lista
3. Aprire un'altra sessione come client → verificare la nota visibile
4. Come client: aggiungere un commento alla nota → verificare nella vista trainer
5. Come client: tentare di creare una nota root → verificare blocco (Firestore rules)
6. Come trainer: eliminare la nota root → verificare che anche i commenti siano eliminati

**Risultato atteso:**
- Thread a 2 livelli funzionante
- Client non può creare note root (errore da Firestore rules)
- Eliminazione a cascata corretta

---

#### TP-014 · US-019/020 🟡 — Scheda allenamento multi-giorno
**Precondizioni:** Cliente esistente.

**Passi:**
1. Tab Scheda → creare nuova scheda con titolo e 3 giorni
2. Giorno 1: aggiungere 2 esercizi (nome, serie, reps, recupero)
3. Salvare → verificare scheda visibile con `status: 'active'`
4. Come client: verificare la scheda in sola lettura con tab giorni
5. Come trainer: creare una seconda scheda → verificare che la prima diventi `archived`
6. Verificare lo storico collassabile con la scheda archiviata

**Risultato atteso:**
- Una sola scheda `active` per cliente alla volta
- Client vede la scheda con tab giorni navigabili
- Archivio storico collassabile presente

---

#### TP-015 · US-022 🟡 — Export PDF cliente con scelta tema
**Precondizioni:** Cliente con campionamento e BIA.

**Passi:**
1. Aprire dashboard cliente → cliccare "ESPORTA PDF"
2. Verificare comparsa `PrintPickerModal` con opzioni dark / B&W
3. Selezionare "Dark" → verificare apertura finestra di stampa con tema scuro
4. Annullare → riaprire → selezionare "B&W" → verificare tema bianco/nero
5. Verificare il contenuto: anagrafica, test con delta, BIA, ultimi 5 campionamenti

**Risultato atteso:**
- Modal visibile prima della stampa
- Due temi distinti (sfondo scuro vs bianco)
- Contenuto completo e corretto nel PDF generato

---

## 4. Test Atletici

---

#### TP-016 · US-023/025 🟡 — Guida test filtrata per modulo
**Precondizioni:** Accesso come trainer PT e come coach Soccer.

**Passi (PT):**
1. Aprire TestGuidePage → verificare 13 test PT visibili (tutti)
2. Verificare che ogni test abbia protocollo, attrezzatura, unità di misura

**Passi (Soccer):**
3. In org Soccer → aprire TestGuidePage
4. Verificare che siano visibili SOLO i test soccer (non i PT-only)
5. Verificare presenza di test delle 3 fasce (Pulcini, Esordienti, Senior)

**Risultato atteso:**
- PT: 13 test (o filtrati per categoria)
- Soccer: solo test con `categories` contenente valori soccer

---

## 5. BIA

---

#### TP-017 · US-026/027/028/084 🔴 — Inserimento BIA e visualizzazione
**Precondizioni:** Cliente `complete` o `bia_only`.

**Passi:**
1. Aprire tab BIA → inserire valori per tutti i parametri (incluso peso e altezza per BMI)
2. Verificare calcolo automatico del BMI (peso/altezza²)
3. Verificare colori gauge bar (verde/giallo/rosso) in base ai range clinici
4. Salvare → verificare aggiornamento di `lastBia` e `biaHistory`
5. Inserire una seconda misurazione con valori migliorati → verificare XP assegnati
6. Aprire tab Panoramica → verificare `BiaSummary` con gauge bar e rank BIA
7. Aprire BiaHistoryChart → verificare grafico con i 2 punti temporali

**Risultato atteso:**
- BMI calcolato automaticamente e non editabile
- Colori gauge coerenti con `constants/bia.js`
- XP: 100 se tutti e 4 i parametri migliorano, scale corrette altrimenti
- BiaSummary visibile in Panoramica

---

#### TP-018 · US-029 🟡 — BIA bloccata per Soccer
**Precondizioni:** Accesso a un'org Soccer Academy.

**Passi:**
1. Aprire la dashboard di un allievo Soccer
2. Aprire tab BIA
3. Verificare la comparsa di `BiaLockedPanel` con messaggio esplicativo

**Risultato atteso:**
- Il form BIA NON è accessibile
- Messaggio che spiega il motivo del blocco

---

## 6. Sessioni e Calendario

---

#### TP-019 · US-030/031/034 🔴 — Calendario e creazione slot
**Precondizioni:** Almeno 2 clienti nell'org.

**Passi:**
1. Aprire TrainerCalendar in vista settimana → navigare settimane
2. Cliccare "Nuovo slot" → impostare data, ora, selezionare 2 clienti
3. Salvare → verificare lo slot nel calendario con styling "pianificato"
4. Cliccare lo slot → SlotPopup → verificare azioni disponibili
5. Cliccare "Salta" → verificare `status: 'skipped'` e styling grigio

**Risultato atteso:**
- Slot visibile nel giorno corretto
- Salta: nessun XP, nessuna notifica, styling differente

---

#### TP-020 · US-033 🔴 — Chiudi sessione con XP e notifiche
**Precondizioni:** Slot pianificato con 2+ clienti.

**Passi:**
1. Aprire SlotPopup → cliccare "Chiudi sessione"
2. Nel CloseSessionModal: marcare 1 cliente come presente, 1 come assente
3. Confermare
4. Verificare: slot `status: 'completed'`, `attendees` e `absentees` salvati
5. Verificare XP assegnati al presente (incluso eventuale bonus streak)
6. Accedere come cliente assente → verificare notifica ricevuta

**Risultato atteso:**
- Solo i presenti ricevono XP
- Gli assenti ricevono notifica automatica
- Streak aggiornato correttamente

---

#### TP-021 · US-032/035/092 🟡 — Ricorrenze
**Precondizioni:** Almeno 2 clienti.

**Passi:**
1. Creare una ricorrenza: Lunedì + Mercoledì, periodo 1 mese, 2 clienti
2. Verificare gli slot generati nel calendario
3. Aprire RecurrencesPage → verificare la ricorrenza nella lista attive
4. Aprire il dettaglio (RecurrenceDetailView) → verificare giorni, orario, clienti, settimane calcolate
5. Modificare l'orario → verificare aggiornamento sugli slot futuri (non quelli passati)
6. Annullare la ricorrenza → verificare eliminazione slot futuri

**Risultato atteso:**
- Slot generati automaticamente per tutto il periodo
- Modifica orario impatta solo slot futuri
- Annulla elimina slot futuri, preserva quelli passati

---

## 7. Gruppi

---

#### TP-022 · US-036/037 🔴 — Crea gruppo e toggle clienti con preview calendario
**Precondizioni:** Almeno 3 clienti e 1 slot futuro con 1 dei clienti.

**Passi:**
1. Creare un nuovo gruppo "Test Group"
2. Aggiungere un cliente che ha slot futuri → verificare GroupToggleDialog
3. Verificare anteprima: numero slot futuri e ricorrenze che verranno aggiornati
4. Annullare → verificare che il gruppo non sia cambiato
5. Confermare → verificare `clientIds` aggiornato nel gruppo e negli slot futuri
6. Rimuovere lo stesso cliente → verificare rollback dagli slot futuri

**Risultato atteso:**
- Preview accurata prima della conferma
- Dopo conferma: gruppo, slot futuri e ricorrenze aggiornati
- Slot passati invariati

---

#### TP-023 · US-038/039/040/041/085/086/087 🟡 — Group Analytics Hub (6 tab)
**Precondizioni:** Gruppo con 5+ clienti con campionamenti e sessioni chiuse.

**Passi:**
1. Aprire GroupDetailView → verificare 6 tab disponibili
2. **Classifica**: ordinare per media → verificare podio top 3; cambiare sort per singola stat
3. **Analisi**: verificare riepilogo medie, LineChart trend (cambiare stat), heatmap presenze, più migliorati
4. **Confronto**: selezionare 3 atleti → verificare radar SVG + tabella comparativa
5. **Sessioni**: verificare metriche aggregate (30gg, pianificate, tasso presenze) + liste paginate
6. **Note**: pubblicare un annuncio → verificare comparsa; eliminare → verificare rimozione
7. **Export PDF**: cliccare esporta → PrintPickerModal → scegliere tema → verificare contenuto PDF

**Risultato atteso:**
- Tutti i tab funzionanti con dati reali
- GroupNotes flat (no thread), solo autore/org_admin può eliminare
- PDF con classifica, campioni e statistiche

---

## 8. Wearable / Attività Fisica

---

#### TP-024 · US-088/089 🟢 — Collegamento Google Fit
**Precondizioni:** Account Google con dati Google Fit.

**Passi:**
1. Trainer: aprire dashboard cliente → tab Wearable → abilitare wearable per il cliente
2. Accedere come client → sezione Wearable → cliccare "Collega Google Fit"
3. Completare il flusso OAuth Google
4. Verificare redirect di ritorno all'app
5. Verificare dati (passi, calorie, minuti attivi) visibili nella WearableSection del trainer
6. Trainer: disabilitare wearable → verificare che i dati scompaiano

**Risultato atteso:**
- Flusso OAuth completato senza errori
- Dati sincronizzati e visibili nella dashboard trainer
- Abilitazione/disabilitazione funzionante

---

## 9. Gamification

---

#### TP-025 · US-042/043/044 🟡 — Livello, rank e XP Trend
**Precondizioni:** Cliente con almeno 5 log entries con `ts`.

**Passi:**
1. Verificare XPBar aggiornata dopo un campionamento
2. Aggiungere XP sufficienti per un level-up → verificare incremento livello
3. Aprire XPTrendChart → verificare dati per i 3 periodi (giorno/settimana/mese)
4. Verificare che il rank cambi al superamento di una soglia di media percentile

**Risultato atteso:**
- XP e livello aggiornati in tempo reale dopo ogni azione
- XPTrendChart mostra dati aggregati coerenti con il log
- Rank corretto per la media percentile corrente

---

## 10. Notifiche

---

#### TP-026 · US-047/048/049 🟡 — Invio e gestione notifiche
**Precondizioni:** Cliente con almeno 1 slot chiuso con assenza.

**Passi:**
1. Chiudere una sessione marcando un cliente come assente
2. Accedere come quel cliente → verificare badge notifiche non lette
3. Aprire NotificationsPanel → verificare notifica di assenza
4. Cliccare "Segna tutte come lette" → verificare sparizione badge
5. Verificare `read: true` in Firestore per le notifiche del cliente

**Risultato atteso:**
- Notifica automatica all'assente
- Badge contatore corretto
- "Segna tutte lette" aggiorna Firestore con optimistic update

---

## 11. Area Self-Service Cliente

---

#### TP-027 · US-050/051/052/053/056 🔴 — Dashboard e flussi cliente
**Precondizioni:** Cliente `complete` con campionamenti, scheda allenamento attiva, sessioni.

**Passi:**
1. Accedere come client → verificare dashboard con rank, XP, statistiche in sola lettura
2. Tab Scheda → verificare scheda allenamento con tab giorni (read-only)
3. Tab Sessioni → verificare il proprio calendario
4. Tab Note → aggiungere un commento a una nota del trainer → verificare nel thread
5. Tentare di creare una nota root → verificare blocco da Firestore rules
6. Tab XP Trend → verificare grafico con granularità giorno/settimana/mese

**Risultato atteso:**
- Nessun controllo di modifica visibile (ReadonlyGuard attivo per la vista client)
- Commenti client salvati correttamente
- Nota root: errore da Firestore (non solo UI)

---

#### TP-028 · US-055 🟡 — Cambio password cliente (volontario)
**Precondizioni:** Client autenticato con accesso all'area profilo.

**Passi:**
1. Aprire ClientProfilePage → sezione cambio password
2. Inserire password corrente errata → verificare errore re-auth
3. Inserire password corrente corretta + nuova password non valida → errore policy
4. Inserire nuova password valida → confermare
5. Fare logout → accedere con la nuova password

**Risultato atteso:**
- Re-auth obbligatoria prima del cambio
- Policy applicata (min 8, 1 numero, 1 maiuscola)
- Login riuscito con nuova password

---

## 12. Profilo Trainer e Org Admin

---

#### TP-029 · US-057 🟡 — Modifica email e password trainer
**Precondizioni:** Accesso come trainer.

**Passi:**
1. Aprire ProfilePage → cambio password con re-auth → verificare audit log
2. Cambio email → inserire nuova email → verificare che Firebase invii email di verifica
3. Verificare che l'email non cambi finché il link non è confermato

**Risultato atteso:**
- Password aggiornata con re-auth
- Email: link di verifica inviato, cambio effettivo solo dopo click sul link

---

#### TP-030 · US-059/060/061/062 🔴 — Gestione membri del team
**Precondizioni:** Accesso come org_admin.

**Passi:**
1. MembersPage → verificare lista membri con ruoli
2. Cliccare AGGIUNGI → CreateMemberForm → creare un trainer con email unica
3. Verificare `memberCount` incrementato di 1 sull'org
4. Cambiare il ruolo del nuovo membro da trainer a staff_readonly
5. Accedere come il nuovo membro → verificare ReadonlyBanner e nessun controllo di modifica
6. Come org_admin: rimuovere il membro → verificare decremento `memberCount`
7. Tentare di impostare ruolo `super_admin` via DevTools → verificare blocco Firestore rules

**Risultato atteso:**
- Counter atomici corretti dopo ogni operazione
- Cambio ruolo immediato sulla UI
- Escalation a super_admin bloccata da Firestore rules

---

#### TP-031 · US-079/080 🔴 — Limiti piano e blocchi
**Precondizioni:** Org con piano `free`.

**Passi:**
1. Portare `clientCount` al limite (10 clienti per free)
2. Aprire NewClientView → verificare schermata di blocco invece del wizard
3. Portare `memberCount` al limite (1 trainer per free)
4. Aprire MembersPage → verificare banner giallo e bottone AGGIUNGI disabilitato
5. Tentare di creare un cliente via Firestore diretto → verificare blocco da rules

**Risultato atteso:**
- Blocco sia lato UI che lato Firestore rules
- Messaggi chiari con il piano attuale e i limiti

---

## 13. Area Super Admin

---

#### TP-032 · US-063/064/065/066/067/090 🔴 — Area super_admin completa
**Precondizioni:** Accesso come super_admin su `rankex-admin`.

**Passi:**
1. Verificare AdminDashboard con contatori globali e breakdown per piano
2. OrgsPage → ricercare un'org → aprire il dettaglio
3. OrgDetailView → verificare barre utilizzo trainer/clienti con colori corretti
4. Rimuovere un membro di emergenza dall'org → verificare effetto
5. Creare una nuova org con piano free
6. AdminProfilePage → modificare password con re-auth → verificare audit log

**Risultato atteso:**
- Dati aggregati corretti su tutte le org
- Rimozione membro cross-org funzionante
- Creazione org con `orgId` univoco

---

## 14. Staff Read-Only

---

#### TP-033 · US-068 🔴 — Accesso in sola lettura
**Precondizioni:** Account con ruolo `staff_readonly`.

**Passi:**
1. Accedere come staff_readonly
2. Verificare ReadonlyBanner in cima a ogni pagina
3. Aprire un cliente → verificare assenza di tutti i bottoni di modifica (aggiungi, salva, elimina)
4. Tentare di scrivere su Firestore direttamente → verificare blocco da rules
5. Verificare accesso in lettura a clienti, gruppi, calendario

**Risultato atteso:**
- Zero controlli di modifica visibili
- Firestore rules bloccano qualsiasi `write` per staff_readonly

---

## 15. Modulo Soccer Academy

---

#### TP-034 · US-070/071/072/073 🔴 — Flusso completo Soccer
**Precondizioni:** Org Soccer Academy.

**Passi:**
1. Creare allievo: data nascita 2017 (8 anni) + ruolo Portiere → verificare `soccer_youth`
2. Aprire campionamento dell'allievo → verificare 5 test Pulcini (single_leg_stance, sprint_10m, ecc.)
3. Creare allievo: data nascita 2013 (12 anni) → verificare `soccer_junior` e 5 test Esordienti
4. Creare allievo: data nascita 2007 (17 anni) → verificare `soccer` e 5 test Senior
5. FiltersSidebar → verificare filtro FASCIA con 3 opzioni → filtrare per Pulcini
6. Verificare assenza della tab BIA per tutti gli allievi soccer

**Risultato atteso:**
- Categoria derivata automaticamente dall'età senza input manuale
- 5 test corretti per fascia
- BIA non accessibile per nessun allievo soccer

---

## 16. Upgrade Profilo

---

#### TP-035 · US-074/075/091 🟡 — Upgrade profilo e banner
**Precondizioni:** Cliente `tests_only` con campionamenti. Cliente `bia_only` con biaHistory.

**Passi (tests_only → complete):**
1. Aprire dashboard → verificare `UpgradeCategoryBanner` con suggerimento BIA
2. Cliccare il banner → leggere il ConfirmDialog (spiega che biaHistory parte da zero)
3. Confermare → verificare `profileType: 'complete'`, `biaHistory: []`, stats conservate

**Passi (bia_only → complete):**
4. Cliente bia_only: banner suggerisce di aggiungere test atletici
5. Confermare upgrade → verificare `profileType: 'complete'`, biaHistory conservata, `campionamenti: []`

**Risultato atteso:**
- Banner visibile solo per profili parziali
- ConfirmDialog esplicita cosa si perde e cosa si conserva
- Dati corretti dopo upgrade

---

## 17. DomainGuard (separazione domini)

---

#### TP-036 · US-001 (guard) 🔴 — Blocco cross-domain in production
**Precondizioni:** Ambiente production.

**Passi:**
1. Accedere a `rankex-app.web.app` come super_admin → verificare schermata di blocco con link a rankex-admin
2. Accedere a `rankex-admin.web.app` come trainer → verificare schermata di blocco con link all'app
3. In development (localhost) → verificare che il guard sia disabilitato

**Risultato atteso:**
- Blocco bidirezionale in production
- Guard inattivo in development

---

## Registro esecuzione

| ID | Data | Esecutore | Risultato | Note |
|----|------|-----------|-----------|------|
| TP-001 | | | | |
| TP-002 | | | | |
| TP-003 | | | | |
| TP-004 | | | | |
| TP-005 | | | | |
| TP-006 | | | | |
| TP-007 | | | | |
| TP-008 | | | | |
| TP-009 | | | | |
| TP-010 | | | | |
| TP-011 | | | | |
| TP-012 | | | | |
| TP-013 | | | | |
| TP-014 | | | | |
| TP-015 | | | | |
| TP-016 | | | | |
| TP-017 | | | | |
| TP-018 | | | | |
| TP-019 | | | | |
| TP-020 | | | | |
| TP-021 | | | | |
| TP-022 | | | | |
| TP-023 | | | | |
| TP-024 | | | | |
| TP-025 | | | | |
| TP-026 | | | | |
| TP-027 | | | | |
| TP-028 | | | | |
| TP-029 | | | | |
| TP-030 | | | | |
| TP-031 | | | | |
| TP-032 | | | | |
| TP-033 | | | | |
| TP-034 | | | | |
| TP-035 | | | | |
| TP-036 | | | | |

---

*Test plan manuale — RankEX maggio 2026*
