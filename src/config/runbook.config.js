/**
 * Runbook manuale — sorgente di verità dei casi di test manuali per RankEX.
 * Sostituisce docs/test-plan.md (versione mag 2026, mai aggiornato dopo — descriveva
 * un layout dashboard trainer 2 colonne rimosso, un flusso "Collega Google Fit"
 * client rimosso, e non copriva Trofei/Badge, Streak, Pentagon Nav, Obiettivi).
 * Config-driven: i casi vivono qui (data statica, nessuna logica), le ESECUZIONI
 * (chi ha passato cosa, quando) vivono in Firestore — vedi firebase/services/runbook.js
 * e la pagina admin-pages/RunbookPage.jsx.
 *
 * Severità: 'blocker' (blocca il rilascio) · 'important' (da correggere se possibile)
 * · 'nice' (può passare a ticket separato) — corrispondono a 🔴/🟡/🟢 nel test-plan
 * originale.
 */

export const SEVERITY = {
  blocker:   { label: 'Bloccante',    emoji: '🔴', color: '#f87171' },
  important: { label: 'Importante',   emoji: '🟡', color: '#facc15' },
  nice:      { label: 'Nice-to-have', emoji: '🟢', color: '#4ade80' },
}

export const TEST_ACCOUNTS = [
  { role: 'super_admin',      email: 'admin@test.rankex',    note: 'accesso a rankex-admin.web.app' },
  { role: 'org_admin',        email: 'orgadmin@test.rankex', note: 'org test-org-pt (personal_training)' },
  { role: 'trainer (PT)',     email: 'trainer@test.rankex',  note: 'org test-org-pt' },
  { role: 'trainer (Soccer)', email: 'coach@test.rankex',    note: 'org test-org-soccer' },
  { role: 'staff_readonly',   email: 'staff@test.rankex',    note: 'org test-org-pt' },
  { role: 'client',           email: 'client@test.rankex',   note: 'cliente Mario Rossi in test-org-pt' },
]

export const RUNBOOK_SUITES = [
  {
    id: 'auth', label: 'Autenticazione', cases: [
      {
        id: 'TP-001', usId: 'US-001', severity: 'blocker', title: 'Login e redirect per ruolo',
        preconditions: 'Account esistenti per ogni ruolo.',
        steps: [
          'Aprire http://localhost:5173',
          'Inserire credenziali valide di un trainer → Login',
          'Verificare il redirect alla TrainerShell',
          'Logout, ripetere con org_admin → verificare TrainerShell + tab org',
          'Logout, ripetere con client → verificare ClientView',
          'Logout, aprire rankex-admin → super_admin → AdminShell',
          'Tentare login con password errata → verificare messaggio d\'errore leggibile',
        ],
        expected: [
          'Ogni ruolo vede solo la propria area',
          'Errori Firebase tradotti in italiano',
          'Nessun redirect a pagine non autorizzate',
        ],
      },
      {
        id: 'TP-002', usId: 'US-002', severity: 'important', title: 'Reset password via email',
        preconditions: 'Account esistente con email valida.',
        steps: [
          'Login → "Password dimenticata?"',
          'Inserire email → Invia',
          'Verificare schermata di conferma',
          'Aprire il link di reset dall\'email',
          'Impostare nuova password valida',
          'Accedere con la nuova password',
        ],
        expected: ['Email ricevuta entro 2 minuti', 'Link funzionante', 'Login con nuova password riuscito'],
      },
      {
        id: 'TP-003', usId: 'US-003', severity: 'blocker', title: 'Cambio password obbligatorio al primo accesso',
        preconditions: 'Cliente con mustChangePassword: true (creato via wizard).',
        steps: [
          'Accedere con le credenziali del nuovo cliente',
          'Verificare che compaia ChangePasswordScreen invece della dashboard',
          'Navigare via URL diretto alla dashboard → deve restare su ChangePasswordScreen',
          'Password temporanea errata → errore',
          'Password temporanea corretta + nuova password fuori policy → errore specifico',
          'Password valida (min 8, 1 numero, 1 maiuscola) → confermare',
          'Verificare accesso alla dashboard client',
        ],
        expected: ['Dashboard inaccessibile finché il cambio non è completato', 'Messaggi di errore specifici', 'mustChangePassword=false dopo il cambio'],
      },
      {
        id: 'TP-004', usId: 'US-004', severity: 'important', title: 'Session timeout automatico',
        preconditions: 'Soglia di timeout nota per il ruolo testato (vedi CLAUDE.md → Session timeout).',
        steps: [
          'Accedere come trainer',
          'Restare inattivi per la durata del timeout',
          'Verificare logout automatico + redirect al login',
          'Verificare che mousemove azzeri il timer',
        ],
        expected: ['Logout automatico senza azione utente', 'L\'attività azzera il timer'],
      },
      {
        id: 'TP-005', usId: 'US-005', severity: 'important', title: 'Logout esplicito e audit log',
        preconditions: 'Accesso come trainer o org_admin.',
        steps: [
          'Logout dal bottone nell\'interfaccia',
          'Verificare redirect al login',
          'Come super_admin: verificare un doc in /audit_logs con action: LOGOUT e uid corretto',
        ],
        expected: ['Sessione terminata', 'Record di audit con timestamp/uid/userAgent'],
      },
      {
        id: 'TP-044', usId: null, severity: 'important', title: 'Log dei tentativi di login falliti (STORY-017/EPIC-007)',
        preconditions: 'Account esistente. Accesso super_admin per verificare /audit_logs.',
        steps: [
          'Dal form di login, tentare l\'accesso con un\'email esistente e password errata',
          'Verificare che il messaggio di errore sia generico ("Credenziali non valide"), non specifico',
          'Come super_admin: verificare entro pochi secondi un nuovo doc in /audit_logs con action: "auth.login_failed", uid: null, email corrispondente',
          'Ripetere lo stesso tentativo più di 5 volte in meno di 5 minuti',
          'Verificare che oltre la soglia di throttle non vengano scritte nuove entry, ma il messaggio d\'errore mostrato al client resti identico (nessuna differenza osservabile)',
        ],
        expected: [
          'Messaggio di errore identico a quello di STORY-018 (anti account-enumeration)',
          'Entry auth.login_failed scritta via Cloud Function registraLoginFallito (Admin SDK), non dal client',
          'Throttle per email applicato silenziosamente, nessun errore visibile all\'utente',
        ],
      },
    ],
  },
  {
    id: 'clients', label: 'Gestione Clienti', cases: [
      {
        id: 'TP-006', usId: 'US-006', severity: 'blocker', title: 'Lista clienti',
        preconditions: 'Org con almeno 5 clienti di categorie diverse.',
        steps: [
          'Trainer → ClientsPage',
          'Verificare tutti i clienti dell\'org visibili',
          'Ogni card mostra nome, categoria/ruolo, rank, XP',
          'Ricerca testuale → verificare filtraggio',
          'Cambiare ordinamento (nome/rank/data) → verificare riordino',
        ],
        expected: ['Lista completa e corretta', 'Ricerca e ordinamento senza refresh'],
      },
      {
        id: 'TP-007', usId: 'US-007', severity: 'important', title: 'Filtro clienti per categoria / ruolo / fascia',
        preconditions: 'Org con clienti di almeno 2 categorie (PT) o 2 fasce (Soccer).',
        steps: [
          'PT: pannello filtri → "Health" → solo clienti Health',
          '"Active" → lista aggiornata; rimuovere filtro → tutti visibili',
          'Soccer: verificare filtro FASCIA presente solo se ci sono ≥2 fasce',
          'Filtrare "Pulcini" → solo soccer_youth',
          'Filtrare ruolo "Portiere" → solo portieri',
        ],
        expected: ['Filtri esclusivi e combinabili', 'Filtro FASCIA nascosto se tutti i clienti hanno la stessa fascia'],
      },
      {
        id: 'TP-008', usId: 'US-008', severity: 'blocker', title: 'Wizard nuovo cliente PT',
        preconditions: 'Org PT non al limite clienti.',
        steps: [
          'NewClientView → "NUOVO CLIENTE"',
          'Anagrafica: nome, data nascita, sesso, peso, altezza, email unica',
          'Categoria: "Active" → verificare 5 test mostrati',
          'Tipo profilo: "Test + BIA (Complete)"',
          'Credenziali: password valida → creare',
          'Verificare il cliente nella lista',
          'Accedere col nuovo cliente → mustChangePassword attivo',
        ],
        expected: ['Cliente creato con categoria/profileType/credenziali', 'clientCount +1', 'Audit log CLIENT_CREATED'],
      },
      {
        id: 'TP-009', usId: 'US-008', severity: 'blocker', title: 'Wizard nuovo cliente Soccer',
        preconditions: 'Org Soccer non al limite.',
        steps: [
          'Wizard → Anagrafica con data nascita per un 8enne (Pulcini)',
          'Ruolo: "Portiere"',
          'Credenziali → creare',
          'Verificare categoria: soccer_youth, profileType: tests_only',
          'Ripetere con un 12enne → soccer_junior',
          'Ripetere con un 16enne → soccer',
        ],
        expected: ['Categoria derivata dall\'età, mai inserita manualmente', 'Ruolo salvato ma non altera la categoria'],
      },
      {
        id: 'TP-010', usId: 'US-009', severity: 'blocker', title: 'Elimina cliente',
        preconditions: 'Cliente esistente.',
        steps: [
          'Scheda cliente → azione "Elimina"',
          'Verificare ConfirmDialog (primo step generico)',
          'Annullare → cliente ancora presente',
          'Riaprire → confermare → digitare il nome del cliente',
          'Verificare rimozione dalla lista',
          'Verificare clientCount -1',
        ],
        expected: ['Eliminazione solo dopo doppia conferma con nome digitato', 'clientCount decrementato atomicamente'],
      },
    ],
  },
  {
    id: 'trainer-dashboard', label: 'Dashboard Cliente — Vista Trainer', cases: [
      {
        id: 'TP-011', usId: 'US-010/011/012', severity: 'blocker', title: 'Header, tab bar e navigazione',
        preconditions: 'Cliente con almeno un campionamento.',
        steps: [
          'Aprire la dashboard del cliente',
          'Verificare header unico: back button + tab bar orizzontale scrollabile + menu overflow "⋮"',
          'Navigare tra le tab: Atleta, Test (solo se hasTests), BIA, Allenamento, Obiettivi, Calendario, Note, Attività, Misure, Wearable, Trofei',
          'Verificare che ogni tab mostri il contenuto corretto',
          'Aprire il menu "⋮" → verificare Esporta PDF / Reset password / Elimina',
          'Verificare rank e media percentile nella tab Atleta',
        ],
        expected: [
          'Colonna unica, nessun pannello sticky a 2 colonne (layout precedente rimosso col redesign)',
          'Tutte le tab sempre visibili/scrollabili, nessuna nascosta per breakpoint',
          'Rank e colore coerenti con la media dei test',
        ],
      },
      {
        id: 'TP-012', usId: 'US-013/014/015', severity: 'blocker', title: 'Campionamento con percentili live e salvataggio',
        preconditions: 'Cliente PT (active) con e senza campionamenti precedenti.',
        steps: [
          'Tab Test → avviare campionamento',
          'Inserire un valore → verificare percentile aggiornato in tempo reale',
          'Inserire un\'età che genera outOfRange → verificare banner ambra',
          'Completare tutti i test con valori realistici',
          'Verificare anteprima rank',
          'SALVA → verificare stats aggiornate, media, XP assegnato',
          'Verificare il campionamento in testa allo storico',
        ],
        expected: ['Percentili live senza chiamate Firestore', 'Banner ambra per età fuori norma', 'XP/rank/log corretti dopo SALVA'],
      },
      {
        id: 'TP-013', usId: 'US-017/018', severity: 'important', title: 'Note thread trainer → cliente',
        preconditions: 'Cliente esistente.',
        steps: [
          'Tab Note → creare nota root',
          'Verificare nella lista',
          'Come client (altra sessione): verificare la nota visibile',
          'Come client: aggiungere un commento → verificare nella vista trainer',
          'Come client: tentare di creare una nota root → verificare blocco (Firestore rules)',
          'Come trainer: eliminare la nota root → verificare cascade sui commenti',
        ],
        expected: ['Thread a 2 livelli funzionante', 'Client non crea note root (errore da rules, non solo UI)', 'Eliminazione a cascata corretta'],
      },
      {
        id: 'TP-014', usId: 'US-019/020', severity: 'important', title: 'Scheda allenamento multi-giorno',
        preconditions: 'Cliente esistente.',
        steps: [
          'Tab Allenamento → creare scheda con titolo + 3 giorni',
          'Giorno 1: 2 esercizi (nome, serie, reps, recupero)',
          'Salvare → verificare status: active',
          'Come client: verificare scheda read-only con tab giorni',
          'Come trainer: creare una seconda scheda → la prima diventa archived',
          'Verificare storico collassabile con la scheda archiviata',
        ],
        expected: ['Una sola scheda active alla volta', 'Client vede tab giorni navigabili', 'Archivio storico presente'],
      },
      {
        id: 'TP-037', usId: null, severity: 'nice', title: 'Tab Misure — storico peso/altezza',
        preconditions: 'Cliente esistente.',
        steps: [
          'Tab Misure → aggiungere una misurazione (peso e/o altezza)',
          'Verificare trend inline (freccia su/giù rispetto alla precedente)',
          'Aggiungere una seconda misurazione → verificare storico ordinato',
        ],
        expected: ['Storico salvato su client.misureHistory', 'Trend calcolato correttamente tra due misurazioni consecutive'],
      },
      {
        id: 'TP-015', usId: 'US-022', severity: 'important', title: 'Export PDF cliente con scelta tema',
        preconditions: 'Cliente con campionamento e BIA.',
        steps: [
          'Dashboard cliente → "ESPORTA PDF"',
          'Verificare PrintPickerModal (dark / B&W)',
          '"Dark" → verificare finestra di stampa con tema scuro',
          'Annullare → "B&W" → verificare tema bianco/nero',
          'Verificare contenuto: anagrafica, test con delta, BIA, ultimi 5 campionamenti',
        ],
        expected: ['Modal prima della stampa', 'Due temi distinti', 'Contenuto completo e corretto'],
      },
    ],
  },
  {
    id: 'tests', label: 'Test Atletici', cases: [
      {
        id: 'TP-016', usId: 'US-023/025', severity: 'important', title: 'Guida test filtrata per modulo',
        preconditions: 'Accesso come trainer PT e come coach Soccer.',
        steps: [
          'PT: TestGuidePage → verificare i 13 test PT',
          'Ogni test ha protocollo, attrezzatura, unità di misura',
          'Soccer: TestGuidePage → solo i test soccer (non i PT-only)',
          'Verificare test delle 3 fasce (Pulcini, Esordienti, Senior)',
        ],
        expected: ['PT: 13 test (o filtrati per categoria)', 'Soccer: solo test con categories soccer'],
      },
    ],
  },
  {
    id: 'bia', label: 'BIA', cases: [
      {
        id: 'TP-017', usId: 'US-026/027/028/084', severity: 'blocker', title: 'Inserimento BIA e visualizzazione',
        preconditions: 'Cliente complete o bia_only.',
        steps: [
          'Tab BIA → inserire tutti i parametri (incluso peso/altezza per BMI)',
          'Verificare BMI calcolato automaticamente',
          'Verificare colori gauge bar coerenti coi range clinici',
          'Salvare → lastBia e biaHistory aggiornati',
          'Seconda misurazione con valori migliorati → verificare XP',
          'Tab Atleta → BiaSummary con gauge bar e rank BIA',
          'BiaHistoryChart → grafico con i 2 punti temporali',
        ],
        expected: ['BMI non editabile', 'Colori gauge coerenti con constants/bia.js', 'XP 100 se 4/4 parametri migliorano, scale corrette altrimenti'],
      },
      {
        id: 'TP-018', usId: 'US-029', severity: 'important', title: 'BIA bloccata per Soccer',
        preconditions: 'Org Soccer Academy.',
        steps: ['Dashboard allievo Soccer → tab BIA', 'Verificare che la BIA non sia disponibile, con messaggio esplicativo'],
        expected: ['Form BIA non accessibile', 'Messaggio che spiega il blocco'],
      },
    ],
  },
  {
    id: 'calendar', label: 'Sessioni e Calendario', cases: [
      {
        id: 'TP-019', usId: 'US-030/031/034', severity: 'blocker', title: 'Calendario e creazione slot',
        preconditions: 'Almeno 2 clienti nell\'org.',
        steps: [
          'TrainerCalendar vista settimana → navigare',
          '"Nuovo slot" → data, ora, 2 clienti → salvare',
          'Verificare styling "pianificato"',
          'SlotPopup → verificare azioni disponibili',
          '"Salta" → status: skipped, styling grigio',
        ],
        expected: ['Slot nel giorno corretto', 'Salta: nessun XP, nessuna notifica, styling diverso'],
      },
      {
        id: 'TP-020', usId: 'US-033', severity: 'blocker', title: 'Chiudi sessione con XP, streak e notifiche',
        preconditions: 'Slot pianificato con 2+ clienti.',
        steps: [
          'SlotPopup → "Chiudi sessione"',
          'CloseSessionModal: 1 presente, 1 assente → verificare anteprima "+XP · streak N" per riga',
          'Confermare',
          'Verificare status: completed, attendees/absentees salvati',
          'Verificare XP + streak assegnati al presente (sessionStreak +1)',
          'Come assente: verificare sessionStreak azzerato + notifica ricevuta',
        ],
        expected: ['Solo i presenti ricevono XP', 'Assenti: notifica automatica + streak azzerata', 'Calcolo interamente server-side (chiudiSessione)'],
      },
      {
        id: 'TP-021', usId: 'US-032/035/092', severity: 'important', title: 'Ricorrenze',
        preconditions: 'Almeno 2 clienti.',
        steps: [
          'Creare ricorrenza: Lun+Mer, 1 mese, 2 clienti',
          'Verificare slot generati',
          'RecurrencesPage → ricorrenza nella lista attive',
          'Dettaglio → giorni, orario, clienti, settimane calcolate',
          'Modificare orario → verificare impatto solo su slot futuri',
          'Annullare → verificare eliminazione slot futuri',
        ],
        expected: ['Slot generati per tutto il periodo', 'Modifica orario non tocca slot passati', 'Annulla elimina solo slot futuri'],
      },
    ],
  },
  {
    id: 'groups', label: 'Gruppi', cases: [
      {
        id: 'TP-022', usId: 'US-036/037', severity: 'blocker', title: 'Crea gruppo e toggle clienti con preview calendario',
        preconditions: 'Almeno 3 clienti, 1 slot futuro con 1 di loro.',
        steps: [
          'Creare gruppo "Test Group"',
          'Aggiungere un cliente con slot futuri → verificare GroupToggleDialog',
          'Verificare anteprima slot/ricorrenze impattate',
          'Annullare → gruppo invariato',
          'Confermare → clientIds aggiornato su gruppo + slot futuri',
          'Rimuovere lo stesso cliente → verificare rollback',
        ],
        expected: ['Preview accurata prima della conferma', 'Slot passati invariati'],
      },
      {
        id: 'TP-023', usId: 'US-038/039/040/041/085/086/087', severity: 'important', title: 'Group Analytics Hub (6 tab)',
        preconditions: 'Gruppo con 5+ clienti con campionamenti e sessioni chiuse.',
        steps: [
          'GroupDetailView → verificare 6 tab',
          'Classifica: sort per media → podio top 3; sort per singola stat',
          'Analisi: medie, LineChart trend, heatmap presenze, più migliorati',
          'Confronto: 3 atleti → radar SVG + tabella',
          'Sessioni: metriche aggregate + liste paginate',
          'Note: pubblicare + eliminare un annuncio',
          'Export PDF: PrintPickerModal → tema → verificare contenuto',
        ],
        expected: ['Tutti i tab funzionanti con dati reali', 'GroupNotes flat (no thread)', 'PDF con classifica/campioni/statistiche'],
      },
    ],
  },
  {
    id: 'wearable', label: 'Wearable / Attività Fisica', cases: [
      {
        id: 'TP-024', usId: 'US-088/089', severity: 'nice', title: 'Wearable — stato disattivato (post RX-62)',
        preconditions: 'Nessuna — feature parzialmente disattivata, nessun collegamento reale possibile oggi.',
        steps: [
          'Trainer: aprire dashboard cliente → tab Wearable',
          'Verificare messaggio "Collegamento Wearable non disponibile al momento"',
          'Verificare che il bottone ABILITA sia assente/nascosto',
          'Per un cliente con wearable già abilitato in passato: verificare che resti solo DISABILITA',
          'Cliente: verificare che non esista alcun punto di ingresso per collegare Google Fit',
        ],
        expected: [
          'Nessun flusso di collegamento reale disponibile (linkGoogleFit rimosso)',
          'Solo DISABILITA per client legacy già abilitati',
          'Nessun accessToken residuo su client nuovi (verificato via scripts/check-wearable-tokens.mjs, set 2026)',
        ],
      },
    ],
  },
  {
    id: 'gamification', label: 'Gamification', cases: [
      {
        id: 'TP-025', usId: 'US-042/043/044', severity: 'important', title: 'Livello, rank e XP Trend',
        preconditions: 'Cliente con almeno 5 log entries con ts.',
        steps: [
          'Verificare XPBar aggiornata dopo un campionamento',
          'XP sufficienti per un level-up → verificare incremento livello',
          'XPTrendChart → verificare i 3 periodi (giorno/settimana/mese)',
          'Verificare cambio rank al superamento soglia media percentile',
        ],
        expected: ['XP/livello aggiornati in tempo reale', 'XPTrendChart coerente col log', 'Rank corretto per la media corrente'],
      },
      {
        id: 'TP-038', usId: null, severity: 'important', title: 'Streak presenze e moltiplicatore XP',
        preconditions: 'Cliente con almeno 2 sessioni pianificate consecutive.',
        steps: [
          'Chiudere una sessione col cliente presente → verificare sessionStreak: 1, XP con moltiplicatore +10%',
          'Chiudere una seconda sessione presente → sessionStreak: 2, moltiplicatore +20%',
          'Verificare anteprima "streak N" in CloseSessionModal e ClientCalendar prima di confermare',
          'Chiudere una sessione col cliente assente → verificare sessionStreak azzerato a 0',
          'Ripetere fino a streak 10+ → verificare che il moltiplicatore resti fermo a +100% (cap)',
        ],
        expected: [
          'calcSessionXP: +10% per streak, cap +100% a streak 10',
          'Reset a qualunque assenza, calcolato server-side in chiudiSessione (non falsificabile)',
        ],
      },
    ],
  },
  {
    id: 'trophies', label: 'Trofei / Badge', cases: [
      {
        id: 'TP-039', usId: null, severity: 'important', title: 'Badge automatici, manuali e showcase',
        preconditions: 'Cliente con almeno una sessione chiusa e un campionamento.',
        steps: [
          'Tab Trofei → verificare badge automatici già assegnati (es. prima sessione)',
          'Chiudere una sessione che porta il cliente a 5 presenze → verificare il badge striscia_5 subito, senza aprire la scheda del cliente',
          'Come trainer: assegnare un badge manuale (es. "Campione") con una nota libera',
          'Verificare che readonly (staff_readonly) non possa assegnare/revocare badge',
          'Fissare fino a 5 badge in "showcase" → verificare visibili sul profilo',
          'Revocare un badge manuale → verificare rimozione',
        ],
        expected: [
          'I badge automatici li assegnano chiudiSessione/salvaCampionamento (server), una volta sola',
          'Assegnazione manuale solo trainer/org_admin',
          'Showcase max 5 badge',
        ],
      },
    ],
  },
  {
    id: 'athlete-oct26', label: 'Atleta: obiettivi, dati, scheda ↔ calendario', cases: [
      {
        id: 'TP-045', usId: 'STORY-028', severity: 'important', title: 'Obiettivi e download dei propri dati (vista atleta)',
        preconditions: 'Cliente con profilo test e almeno un obiettivo fissato dal trainer.',
        steps: [
          'Login come cliente → hub → Test → sotto-tab Obiettivi',
          'Verificare che compaiano gli obiettivi (attivi, raggiunti, scaduti) senza bottoni di modifica',
          'Profilo → Account → "Scarica i miei dati" → aprire il file JSON scaricato',
        ],
        expected: [
          'Obiettivi in sola lettura, gli stessi visti dal trainer',
          'Il file contiene profilo, obiettivi, note, schede e notifiche del solo cliente loggato',
          'Nel file non ci sono fcmTokens né token wearable',
        ],
      },
      {
        id: 'TP-046', usId: null, severity: 'important', title: 'Scheda collegata al calendario e bonus a fine scheda',
        preconditions: 'Cliente con scheda attiva di 2 giorni e "Sessioni previste" = 2.',
        steps: [
          'Calendario → chiudere una sessione con il cliente presente',
          'Dashboard cliente (trainer) → Allenamento: verificare "Sessione 1 di 2" e "Prossimo: Giorno 2"',
          'Chiudere una seconda sessione con il cliente presente',
          'Verificare scheda completata, log "Scheda completata" (+100 XP) e notifica al cliente',
          'Chiudere una terza sessione: il bonus non deve ripetersi',
        ],
        expected: [
          'Ogni presenza fa avanzare la scheda attiva, le assenze no',
          'Bonus +100 XP una sola volta, al raggiungimento delle sessioni previste',
          "L'atleta vede lo stesso avanzamento e apre direttamente il giorno consigliato",
        ],
      },
    ],
  },
  {
    id: 'goals', label: 'Obiettivi Trainer', cases: [
      {
        id: 'TP-040', usId: null, severity: 'important', title: 'Crea obiettivo, raggiungimento, notifica',
        preconditions: 'Cliente PT con test disponibili per la sua categoria.',
        steps: [
          'Tab Obiettivi → "+ Nuovo" → scegliere un test, percentile target basso (es. 10), scadenza futura',
          'FISSA OBIETTIVO → verificare card con badge "In corso"',
          'Tab Test → campionamento con un valore che superi il target percentile per quel test → salvare',
          'Tornare su Obiettivi → verificare badge "Raggiunto" + percentile effettivo mostrato',
          'Come client: verificare notifica "Obiettivo raggiunto: ... — N° percentile!"',
          'Creare un secondo obiettivo → annullarlo prima della scadenza → verificare badge "Annullato"',
          'Creare un obiettivo con scadenza passata (o attendere) → verificare badge "Scaduto" (calcolato in UI, non salvato)',
        ],
        expected: [
          'Achievement rilevato server-side in salvaCampionamento, mai dal client',
          'Client legge in sola lettura, non crea/annulla (verificare anche da Firestore rules — tests/rules/firestore.rules.test.js → "Obiettivi del cliente")',
          '"Scaduto" non è uno status Firestore — solo un calcolo UI su deadline < oggi',
        ],
      },
    ],
  },
  {
    id: 'notifications', label: 'Notifiche', cases: [
      {
        id: 'TP-026', usId: 'US-047/048/049', severity: 'important', title: 'Invio e gestione notifiche',
        preconditions: 'Cliente con almeno 1 slot chiuso con assenza.',
        steps: [
          'Chiudere una sessione marcando un cliente assente',
          'Come quel cliente: verificare badge notifiche non lette',
          'NotificationsPanel → verificare notifica di assenza',
          '"Segna tutte come lette" → verificare sparizione badge',
          'Verificare read: true in Firestore',
        ],
        expected: ['Notifica automatica all\'assente', 'Badge contatore corretto', '"Segna tutte lette" con optimistic update'],
      },
    ],
  },
  {
    id: 'client-selfservice', label: 'Area Self-Service Cliente — Pentagon Nav', cases: [
      {
        id: 'TP-027', usId: 'US-050/051/052/053/056', severity: 'blocker', title: 'Hub Pentagono e navigazione client',
        preconditions: 'Cliente complete con campionamenti, scheda allenamento attiva, sessioni.',
        steps: [
          'Accedere come client → verificare ClientHub: avatar al centro (non cliccabile) + 5 sezioni sui vertici (Test in cima, poi in senso orario)',
          'Aprire ogni sezione (Test, Trofei, Calendario, Scheda, Profilo) → verificare contenuto in sola lettura',
          'Verificare ClientBottomNav: mobile = barra fissa bottom, desktop = barra sticky top (solo fuori dalla home/hub)',
          'Sotto Test → verificare sub-tab Fisici/BIA',
          'Sotto Profilo → verificare sub-tab Avatar/Note/Attività/Misure/Tema/Account',
          'Tab Note → aggiungere un commento a una nota del trainer',
          'Tentare di creare una nota root → verificare blocco da Firestore rules',
        ],
        expected: [
          'Nessun layout a 2 colonne o tab bar stile trainer — è l\'hub Pentagon Nav (redesign giu 2026)',
          'Nessun controllo di modifica visibile (ReadonlyGuard attivo)',
          'Nota root: errore da Firestore, non solo UI',
        ],
      },
      {
        id: 'TP-041', usId: null, severity: 'nice', title: 'Formula vertici hub e responsive',
        preconditions: 'Nessuna.',
        steps: [
          'Verificare che i 5 vertici del pentagono siano posizionati secondo (90 - i*72) * PI/180',
          'Ridimensionare la finestra → verificare che l\'hub resti leggibile su mobile',
        ],
        expected: ['5 vertici equidistanti', 'Nessun overlap/troncamento su viewport piccoli'],
      },
      {
        id: 'TP-042', usId: null, severity: 'nice', title: 'Selezione tema cliente',
        preconditions: 'Cliente autenticato, accesso a Profilo → Tema.',
        steps: [
          'Profilo → Tema → ThemePicker: verificare i 7 temi (RankEX, Midnight, Carbon, Violet, Steel, Phantom, Mint)',
          'Selezionare un tema diverso da quello attivo → verificare cambio immediato dei colori --rx-* in tutta l\'app',
          'Ricaricare la pagina → verificare persistenza (localStorage rankex-theme)',
          'Ripetere per ProfilePage (trainer) e AdminProfilePage (super_admin)',
        ],
        expected: ['Cambio tema istantaneo', 'Persistenza tra ricariche', 'ThemePicker disponibile per tutti e 3 i ruoli con profilo'],
      },
      {
        id: 'TP-043', usId: null, severity: 'nice', title: 'Selezione avatar dal catalogo fisso',
        preconditions: 'Cliente autenticato.',
        steps: [
          'Profilo → Avatar → AvatarPicker: verificare selezione tra avatar predefiniti del catalogo org',
          'Selezionare un avatar diverso → verificare aggiornamento immediato su AvatarDisplay',
          'Verificare comportamento onError (fallback) se l\'immagine non carica',
        ],
        expected: ['Nessun builder DiceBear (rimosso)', 'Catalogo fisso per org', 'Fallback visibile su errore immagine'],
      },
      {
        id: 'TP-028', usId: 'US-055', severity: 'important', title: 'Cambio password cliente (volontario)',
        preconditions: 'Client autenticato con accesso al profilo.',
        steps: [
          'Profilo → Account → cambio password',
          'Password corrente errata → verificare errore re-auth',
          'Password corrente corretta + nuova non valida → errore policy',
          'Nuova password valida → confermare',
          'Logout → accedere con la nuova password',
        ],
        expected: ['Re-auth obbligatoria', 'Policy applicata (min 8, 1 numero, 1 maiuscola)', 'Login riuscito con nuova password'],
      },
    ],
  },
  {
    id: 'profile-org', label: 'Profilo Trainer e Org Admin', cases: [
      {
        id: 'TP-029', usId: 'US-057', severity: 'important', title: 'Modifica email e password trainer',
        preconditions: 'Accesso come trainer.',
        steps: [
          'ProfilePage → cambio password con re-auth → verificare audit log',
          'Cambio email → nuova email → verificare invio email di verifica',
          'Verificare che l\'email non cambi finché il link non è confermato',
        ],
        expected: ['Password aggiornata con re-auth', 'Email cambiata solo dopo click sul link'],
      },
      {
        id: 'TP-030', usId: 'US-059/060/061/062', severity: 'blocker', title: 'Gestione membri del team',
        preconditions: 'Accesso come org_admin.',
        steps: [
          'MembersPage → verificare lista membri con ruoli',
          'AGGIUNGI → CreateMemberForm → creare un trainer con email unica',
          'Verificare memberCount +1',
          'Cambiare ruolo del nuovo membro a staff_readonly',
          'Come il nuovo membro: verificare ReadonlyBanner e nessun controllo di modifica',
          'Come org_admin: rimuovere il membro → verificare memberCount -1',
          'Tentare di impostare ruolo super_admin via DevTools → verificare blocco Firestore rules',
        ],
        expected: ['Counter atomici corretti', 'Cambio ruolo immediato in UI', 'Escalation a super_admin bloccata da rules'],
      },
      {
        id: 'TP-031', usId: 'US-079/080', severity: 'blocker', title: 'Limiti piano e blocchi',
        preconditions: 'Org con piano free.',
        steps: [
          'Portare clientCount al limite (10 per free)',
          'NewClientView → verificare schermata di blocco invece del wizard',
          'Portare memberCount al limite (1 trainer per free)',
          'MembersPage → verificare banner giallo + bottone AGGIUNGI disabilitato',
          'Tentare creazione cliente via Firestore diretto → verificare blocco da rules',
        ],
        expected: ['Blocco sia UI che Firestore rules', 'Messaggi chiari con piano/limiti'],
      },
    ],
  },
  {
    id: 'super-admin', label: 'Area Super Admin', cases: [
      {
        id: 'TP-032', usId: 'US-063/064/065/066/067/090', severity: 'blocker', title: 'Area super_admin completa',
        preconditions: 'Accesso come super_admin su rankex-admin.',
        steps: [
          'AdminDashboard → contatori globali + breakdown per piano',
          'OrgsPage → ricercare un\'org → aprire il dettaglio',
          'OrgDetailView → barre utilizzo trainer/clienti con colori corretti',
          'Rimuovere un membro di emergenza dall\'org → verificare effetto',
          'Creare una nuova org con piano free',
          'AdminProfilePage → cambio password con re-auth → verificare audit log',
        ],
        expected: ['Dati aggregati corretti', 'Rimozione membro cross-org funzionante', 'orgId univoco alla creazione'],
      },
    ],
  },
  {
    id: 'staff-readonly', label: 'Staff Read-Only', cases: [
      {
        id: 'TP-033', usId: 'US-068', severity: 'blocker', title: 'Accesso in sola lettura',
        preconditions: 'Account staff_readonly.',
        steps: [
          'Accedere come staff_readonly',
          'Verificare ReadonlyBanner in cima a ogni pagina',
          'Aprire un cliente → verificare assenza di bottoni di modifica',
          'Tentare scrittura Firestore diretta → verificare blocco da rules',
          'Verificare accesso in lettura a clienti, gruppi, calendario',
        ],
        expected: ['Zero controlli di modifica visibili', 'Firestore rules bloccano ogni write per staff_readonly'],
      },
    ],
  },
  {
    id: 'soccer', label: 'Modulo Soccer Academy', cases: [
      {
        id: 'TP-034', usId: 'US-070/071/072/073', severity: 'blocker', title: 'Flusso completo Soccer',
        preconditions: 'Org Soccer Academy.',
        steps: [
          'Allievo 8 anni + ruolo Portiere → verificare soccer_youth',
          'Campionamento → verificare 5 test Pulcini',
          'Allievo 12 anni → soccer_junior + 5 test Esordienti',
          'Allievo 17 anni → soccer + 5 test Senior',
          'Filtro FASCIA con 3 opzioni → filtrare Pulcini',
          'Verificare assenza tab BIA per tutti gli allievi soccer',
        ],
        expected: ['Categoria derivata dall\'età senza input manuale', '5 test corretti per fascia', 'BIA non accessibile'],
      },
    ],
  },
  {
    id: 'upgrade-profile', label: 'Upgrade Profilo', cases: [
      {
        id: 'TP-035', usId: 'US-074/075/091', severity: 'important', title: 'Upgrade profilo e banner',
        preconditions: 'Cliente tests_only con campionamenti; cliente bia_only con biaHistory.',
        steps: [
          'tests_only: dashboard → verificare UpgradeCategoryBanner',
          'Cliccare banner → leggere ConfirmDialog (spiega azzeramento biaHistory)',
          'Confermare → verificare profileType: complete, biaHistory: [], stats conservate',
          'bia_only: banner suggerisce test atletici → confermare upgrade',
          'Verificare profileType: complete, biaHistory conservata, campionamenti: []',
        ],
        expected: ['Banner solo per profili parziali', 'ConfirmDialog esplicita cosa si perde/conserva', 'Dati corretti dopo upgrade'],
      },
    ],
  },
  {
    id: 'domain-guard', label: 'DomainGuard (separazione domini)', cases: [
      {
        id: 'TP-036', usId: 'US-001 (guard)', severity: 'blocker', title: 'Blocco cross-domain in production',
        preconditions: 'Ambiente production.',
        steps: [
          'rankex-app.web.app come super_admin → verificare blocco con link a rankex-admin',
          'rankex-admin.web.app come trainer → verificare blocco con link all\'app',
          'In development (localhost) → verificare guard disabilitato',
        ],
        expected: ['Blocco bidirezionale in production', 'Guard inattivo in development'],
      },
    ],
  },
  {
    id: 'lipedema', label: 'Modulo Lipedema', cases: [
      {
        id: 'TP-047', usId: 'STORY-032', severity: 'blocker', title: 'Nuovo paziente senza account di accesso',
        preconditions: 'Org con modulo Lipedema su rankex-dev, account trainer o org_admin dell\'org, sotto il limite pazienti del piano.',
        steps: [
          'Pazienti → "+ NUOVO" → verificare 2 step: Dati anagrafici → Contatto',
          'Verificare assenza di tipologia profilo, categoria, ruolo, fascia e anteprima rank',
          'Step Contatto: lasciare l\'email vuota → CREA PAZIENTE → confermare',
          'Ripetere con un\'email in formato non valido → errore sul campo, nessun paziente creato',
          'Ripetere con un\'email valida → paziente creato',
          'Firestore: doc paziente con clientAuthUid null, profileType complete, categoria null, nessun campo xp/level/rank/stats/log/coins/badges',
          'Firebase Auth e users/: nessun nuovo account per i pazienti creati',
          'Dashboard paziente → menu "⋮": nessuna voce "Reset password"',
          'clientCount dell\'org +1 per ogni paziente; al limite del piano → schermata di blocco invece del wizard',
          'audit_logs: CLIENT_CREATED con solo clientId e orgId, senza nome',
        ],
        expected: [
          'Paziente creato senza account Auth né users/{uid}, email facoltativa',
          'Nessun campo di gamification sul doc paziente',
          'Limite piano e clientCount come negli altri moduli',
          'Nessun nome paziente negli audit log',
        ],
      },
      {
        id: 'TP-048', usId: 'STORY-032', severity: 'blocker', title: 'Eliminazione completa del paziente',
        preconditions: 'Paziente Lipedema con note e commenti, presente in un gruppo, in uno slot passato e in uno futuro, in una ricorrenza attiva, con una scheda e una notifica (se disponibili, anche valutazioni).',
        steps: [
          'Annotare clientId e i path in cui compare',
          'Dashboard paziente → "Elimina" → doppia conferma con nome digitato',
          'Firestore: organizations/{orgId}/clients/{clientId} e tutte le sue subcollection (notes, assessments, ...) non esistono più',
          'Gruppi, slot (clientIds/attendees/absentees) e ricorrenze: clientId assente',
          'workoutPlans e notifications del paziente: cancellati',
          'clientCount dell\'org -1',
          'audit_logs: CLIENT_DELETED con solo clientId e orgId, senza nome',
          'Ripetere su un cliente PT con account: cancellati anche users/{uid} e l\'account Auth',
          'Retry dopo interruzione: con un secondo paziente, simulare un errore dopo il batch core (emulatore o functions di dev con una eccezione temporanea — DevTools → Offline NON interrompe la Cloud Function, verifica solo il rollback della UI); se il doc paziente risulta già cancellato ma restano note/riferimenti, rilanciare "Elimina" (o chiamare eliminaCliente con lo stesso clientId) → risposta ok con alreadyDeleted, nessun residuo, clientCount decrementato una sola volta',
        ],
        expected: [
          'Nessun dato residuo del paziente nei dati live dell\'org',
          'Nessun riferimento al paziente in gruppi, slot, ricorrenze, schede, notifiche',
          'Nessun nome paziente negli audit log',
          'Una cancellazione interrotta si completa rilanciandola, senza doppio decremento di clientCount',
        ],
      },
      {
        id: 'TP-049', usId: 'STORY-029', severity: 'blocker', title: 'Informativa paziente: wizard, scheda, blocco server',
        preconditions: 'Org Lipedema su rankex-dev (hosting rankex-app-dev.web.app, non vite locale), account trainer e un account staff_readonly dell\'org.',
        steps: [
          'Nuovo paziente → step Contatto → AVANTI → step Informativa: lasciare la casella vuota → avviso ambra "Potrai registrarla dalla scheda…" → CREA PAZIENTE',
          'Scheda paziente → tab Paziente: card Informativa "Non registrata"; tab Valutazioni e BIA: banner ambra, "+ NUOVA VALUTAZIONE" e "+ RILEVAMENTO" disabilitati',
          'Chiamata diretta (console, httpsCallable) ad aggiungiValutazione e a salvaBia per questo paziente → errore failed-precondition "Informativa non registrata per questo paziente", nessun documento scritto',
          'Firestore SDK dalla console: updateDoc sul paziente con privacyNotice → PERMISSION_DENIED (anche per org_admin)',
          'REGISTRA INFORMATIVA → modal: versione vuota → errore; data futura → errore; versione "v1" e data di oggi → REGISTRA',
          'Card: "Consegnata il … · versione v1 · registrata da …"; banner spariti; tornare alla lista e riaprire il paziente → informativa ancora presente',
          'AGGIORNA VERSIONE → "v2" → la card mostra v2; testo "La versione precedente resta tracciata nel registro di sistema."',
          'Nuovo paziente spuntando la casella nel wizard (versione + data) → nessun banner nella scheda',
          'audit_logs: PRIVACY_NOTICE_RECORDED per ogni registrazione, details solo { orgId, clientId, informativaVersion }, nessun nome',
          'Come staff_readonly: card e banner visibili, nessun bottone REGISTRA/AGGIORNA; banner con "Deve registrarla un Professionista"; chiamata diretta a registraInformativaPaziente → permission-denied',
          'Org PT: nessuno step Informativa nel wizard, BIA salvabile come prima',
        ],
        expected: [
          'Senza informativa valutazioni e BIA rifiutate in UI e lato server',
          'privacyNotice scritto solo dalle callable, mai dal client',
          'Storico versioni in audit_logs con soli identificativi',
          'PT e Soccer invariati',
        ],
      },
      {
        id: 'TP-050', usId: 'STORY-033/034', severity: 'blocker', title: 'Nuova valutazione 2MWT, percorso standard',
        preconditions: 'Paziente Lipedema con informativa registrata, account trainer.',
        steps: [
          'Tab Valutazioni → stato vuoto "Nessuna valutazione" con azione → "+ NUOVA VALUTAZIONE"',
          'Verificare Setup: data/ora di adesso, "2MWT · protocollo 1.0", professionista corrente, percorso 30, ausilio Nessuno',
          'Tratti con − / +: 4; frazione 22 → riepilogo "142 m", "4 × 30 m + 22,0 m, arrotondato al metro", "Velocità media 1,18 m/s"',
          'Frazione 30 → errore "La frazione deve essere inferiore a 30 m…" al primo SALVA, focus sul campo; riportare a 22',
          'Data nel futuro → "La data non può essere futura"',
          'Parametri clinici: aprire la sezione, compilare dolore pre 3 e PA pre 120/80 → contatore "3 compilati"; PA 80/90 → errore; nessun colore sui valori',
          'Deviazione Sì senza descrizione → errore; tornare a No',
          'SALVA VALUTAZIONE → dialog con riepilogo e testo "Dopo il salvataggio non è modificabile…" → SALVA',
          'Storico: riga 2MWT con data e 142 m; tap → dettaglio con formula, setup, pause, tabella clinica pre/post, tracciabilità (eseguita da / il)',
          'Firestore: doc in clients/{id}/assessments con result.distanceM 142 calcolato dal server, examinerId = uid, status valid, clinical presente; nessun xp/log/notifica sul paziente',
          'Tab Paziente: card "Ultime valutazioni" con 2MWT 142 m; VEDI TUTTE porta alla tab Valutazioni',
          'Firestore SDK dalla console: setDoc/updateDoc/deleteDoc su assessments → PERMISSION_DENIED',
          'INDIETRO con form modificato → conferma "Uscire senza salvare?"',
        ],
        expected: [
          'Distanza mostrata prima del salvataggio = distanza salvata dal server',
          'Valutazione immutabile, scritta solo dalla callable',
          'Nessuna gamification, nessun giudizio sui valori',
        ],
      },
      {
        id: 'TP-051', usId: 'STORY-034', severity: 'important', title: '2MWT: variante di percorso, stop anticipato, pause',
        preconditions: 'Paziente Lipedema con informativa e almeno un 2MWT valido su 30 m.',
        steps: [
          'Nuova valutazione con percorso 20 → avviso ambra variante; SALVA senza spuntare "Confermo la variante" → errore; spuntare e salvare',
          'Storico: badge "VARIANTE 20 m" e "NON CONFRONTABILE · percorso diverso" sulla nuova, nessun delta numerico',
          'Nuova valutazione su 30 m con ausilio Bastone → badge "NON CONFRONTABILE · ausilio diverso"',
          'Nuova valutazione su 30 m, ausilio Nessuno → delta neutro "+N m rispetto al gg/mm" calcolato sulla precedente valida e confrontabile (non sulla variante), senza colori né frecce',
          'Stop anticipato Sì: tempo 120 → errore; 85 s, motivo non scelto → errore; motivo "Altro" senza nota → errore; motivo "Dispnea intollerabile" → etichette "…fino all\'interruzione", riepilogo "INTERROTTA a 85 s · … m"',
          'Pause 2 senza durata → errore; durata 200 → errore; 12 s → ok; testo "Il cronometro ufficiale non si ferma durante le pause." visibile',
          'Salvare: storico con badge "INTERROTTA · 85 s"; delta "—" con il motivo (valutazione interrotta); la successiva valutazione completa mostra "—" verso questa',
          'Firestore: outcome stopped_early, result.durationS 85, clinical.stopReasonCode dyspnea; deviation.present resta false',
        ],
        expected: [
          'Una variante è salvata come tale e non confrontata con il 30 m',
          'Un test interrotto non è mai trattato come completo né usato per un delta',
        ],
      },
      {
        id: 'TP-052', usId: 'STORY-033', severity: 'blocker', title: 'Annulla e correggi una valutazione',
        preconditions: 'Paziente Lipedema con almeno due 2MWT validi, account trainer.',
        steps: [
          'Dettaglio della più recente → ANNULLA VALUTAZIONE → dialog "Annullare la valutazione del …?", conferma disabilitata finché il motivo è vuoto, contatore /500, INDIETRO chiude senza effetti',
          'Inserire un motivo → ANNULLA VALUTAZIONE → riga barrata al 50% con badge ANNULLATA e motivo; il delta della valutazione successiva salta l\'annullata',
          'Toggle "Nascondi annullate (1)" → la riga sparisce; disattivare → torna',
          'Dettaglio dell\'annullata: tracciabilità "Annullata da … il …" e motivo, nessun bottone CORREGGI/ANNULLA',
          'Dettaglio di una valida → CORREGGI → form precompilato (stessa data/ora) con avviso "Correzione"; cambiare i tratti → SALVA → nel dialog il motivo della correzione è obbligatorio → SALVA',
          'Storico: la vecchia ANNULLATA, la nuova valida; dettaglio della nuova "Sostituisce la valutazione del …", della vecchia "Sostituita da …"',
          'Firestore: vecchio doc status voided, voidReason, supersededBy = id nuovo; nuovo doc supersedes = id vecchio (stessa transazione: nessuno stato intermedio)',
          'audit_logs: ASSESSMENT_VOIDED per annullamento e correzione, details solo { orgId, clientId, assessmentId, testId }, nessun motivo né valore',
          'Chiamata diretta ad annullaValutazione sulla stessa valutazione già annullata → failed-precondition',
        ],
        expected: [
          'Nessuna modifica in place né cancellazione: annulla + reinserisci, con traccia completa',
          'Le annullate restano visibili ma escluse da delta e confronti',
        ],
      },
      {
        id: 'TP-053', usId: 'STORY-033', severity: 'blocker', title: 'Valutazioni in sola lettura (staff_readonly)',
        preconditions: 'Utente staff_readonly di un\'org Lipedema, paziente con valutazioni valide e annullate.',
        steps: [
          'Tab Valutazioni: storico completo visibile, nessun "+ NUOVA VALUTAZIONE"',
          'Dettaglio: tutte le sezioni (dati clinici inclusi) senza CORREGGI/ANNULLA',
          'Chiamate dirette ad aggiungiValutazione e annullaValutazione → permission-denied',
          'Firestore SDK: getDocs sulla subcollection assessments → ok; addDoc/updateDoc → PERMISSION_DENIED',
          'Disattivare la rete e ricaricare la tab: card "Impossibile caricare le valutazioni" con RIPROVA; riattivare → RIPROVA carica lo storico',
        ],
        expected: [
          'staff_readonly vede valutazioni e dati clinici per intero ma non scrive (UI + server)',
          'Errore di lettura gestito con possibilità di riprovare',
        ],
      },
      {
        id: 'TP-054', usId: 'STORY-035', severity: 'blocker', title: '30s-STS completo con ripetizione parziale finale',
        preconditions: 'Paziente Lipedema con informativa registrata, account trainer, hosting rankex-app-dev.web.app (desktop e mobile).',
        steps: [
          'Tab Valutazioni → "+ NUOVA VALUTAZIONE" → modal "Quale test?" con 2MWT, 30s-STS, Handgrip e "Ultima: gg/mm" / "Mai eseguito" → 30s-STS',
          'Setup: altezza sedia 43,2, braccioli NO, braccia incrociate SÌ; familiarizzazione lasciata vuota → SALVA → errore sul campo',
          'Familiarizzazione SÌ; ripetizioni complete 14 con − / +; parziale finale SÌ → riepilogo "15 ripetizioni / 30 s" e "14 complete + 1 parziale finale"',
          'Errore tecnico SÌ senza descrizione → errore; scriverla; parametri clinici: solo Dolore, Dispnea, Fatica (niente FC/SpO₂/PA)',
          'SALVA → dialog con "15 ripetizioni" → SALVA; storico: riga 30s-STS "15 rip." con badge ERRORE TECNICO; dettaglio: totale "14 + 1 = 15"',
          'Firestore: result.repetitions 15 calcolato dal server, trials[0].completeRepetitions 14 e partialRepCounted true, outcome complete',
          'Nuova 30s-STS con stop anticipato a 22 s, 9 complete: la domanda "Ripetizione parziale finale" sparisce; badge "INTERROTTA · 22 s", delta "—" con motivo',
          'Tab Paziente: card "Ultime valutazioni" con una riga per test (Handgrip "Non ancora eseguito" se mai fatto)',
        ],
        expected: [
          'La parziale finale si conta una volta sola, dal server',
          'Errore tecnico registrato a parte, senza cambiare l\'esito',
          'Valore mostrato prima del salvataggio = valore salvato',
        ],
      },
      {
        id: 'TP-055', usId: 'STORY-035', severity: 'blocker', title: '30s-STS con uso delle braccia: 0 invalidato',
        preconditions: 'Paziente con almeno una 30s-STS valida e completa su sedia standard.',
        steps: [
          'Nuova 30s-STS → "Uso delle braccia per alzarsi" SÌ → avviso "Protocollo non valido" con la regola CDC/STEADI; lo stop anticipato sparisce; le alzate diventano facoltative',
          'Riepilogo "0 ripetizioni" + "INVALIDATO · uso delle braccia" → SALVA',
          'Storico: "0 rip." in tono smorzato (non barrato), badge "INVALIDATO · USO BRACCIA", delta "— rispetto al gg/mm: questa valutazione è invalidata (protocollo non valido)"',
          'Una successiva 30s-STS completa mostra "—" verso l\'invalidata, non un delta numerico',
          'Firestore: outcome invalidated, result.repetitions 0, result.durationS null, trials[0].valid false con invalidReason used_arms',
          'Chiamata diretta ad aggiungiValutazione con usedArms true e stoppedEarly true → invalid-argument',
        ],
        expected: [
          'Lo 0 da invalidazione si distingue da uno 0 reale tramite outcome, mai dal numero',
          'Nessun delta da o verso una valutazione invalidata',
        ],
      },
      {
        id: 'TP-056', usId: 'STORY-035', severity: 'important', title: '30s-STS: sedia fuori tolleranza e braccioli',
        preconditions: 'Paziente con una 30s-STS valida a 43,2 cm.',
        steps: [
          'Altezza 43,6 → nessun avviso di variante (entro ±0,5 cm); 45 → avviso variante + "Diversa dall\'ultima valutazione (43,2 cm il gg/mm)"; SALVA senza conferma → errore',
          'Confermare l\'altezza → salvare: badge "VARIANTE · SEDIA 45 cm" e "NON CONFRONTABILE · altezza sedia diversa"',
          'Nuova: sedia con braccioli SÌ → avviso fuori protocollo, deviazione attivata da sola e non disattivabile; SALVA senza descrizione → errore sulla deviazione',
          'Descrivere la deviazione → salvare: badge "CON BRACCIOLI" e "NON CONFRONTABILE · braccioli diversi"',
          'Braccia incrociate NO → stessa deviazione obbligatoria; badge "BRACCIA NON INCROCIATE"',
          'Chiamata diretta con chairHasArmrests true e deviation.present false → invalid-argument',
        ],
        expected: [
          'Variante e fuori protocollo salvati come tali e mai confrontati con lo standard',
          'Deviazione sempre descritta da chi ha eseguito il test',
        ],
      },
      {
        id: 'TP-057', usId: 'STORY-036', severity: 'blocker', title: 'Handgrip in kgf: N senza decimali e kgf nativo visibile',
        preconditions: 'Paziente Lipedema con informativa, nessuna Handgrip precedente. Prova su mobile (barra fissa) e desktop.',
        steps: [
          'Nuova valutazione → Handgrip: 6 righe "1 · DESTRA", "2 · SINISTRA"… alternate; marca, modello e impugnatura obbligatori; mano dominante DESTRA | SINISTRA | ENTRAMBE',
          'Unità kgf → testo "Salvato in N (1 kgf = 9,80665 N)…"; inserire 30, 28, 31,5, 27, 29, 28,25 usando Invio per passare alla prova successiva',
          'Ogni riga mostra "… kgf = … N"; badge MIGLIORE sulla prova 3 (destra) e sulla 2 (sinistra)',
          'Riepilogo "D 309 N · S 277 N", "Più forte: destra · Simmetria 89,7 %", "Letti: D 31,5 kgf · S 28,3 kgf"',
          'Cambiare unità in N con valori presenti → avviso "Verifica i valori: sono interpretati in N"; tornare a kgf',
          'Salvare: storico "D 309 · S 277 N"; dettaglio con tabella Prova | Lato | Letto | N | Esito, best per lato, più forte, simmetria, setup (dinamometro, impugnatura, mano dominante, unità)',
          'Firestore: trials[].nativeValue/nativeUnit come inseriti, value in N non arrotondato (es. 308.909475), result.bestBySide e symmetryPct non arrotondati, comparability.deviceModelKey normalizzata',
        ],
        expected: [
          'Valore nativo conservato, N calcolato dal server e mai arrotondato in DB',
          'A schermo N intero, kgf con 1 decimale, simmetria con 1 decimale',
        ],
      },
      {
        id: 'TP-058', usId: 'STORY-036/033', severity: 'blocker', title: 'Handgrip: prova non valida ripetuta ed esclusa dal best',
        preconditions: 'Come TP-057.',
        steps: [
          'Riga 2 (sinistra) → NON VALIDA: riga attenuata, valore conservato, Motivo obbligatorio dal catalogo; in coda compare "7 · SINISTRA · ripetizione della prova 2"',
          'Motivo "Altro" senza nota → errore sulla nota della prova (si apre "dolore e nota")',
          'Dare alla prova non valida il valore più alto della sinistra → il badge MIGLIORE resta su una valida',
          'Riportare la riga 2 a VALIDA → la ripetizione vuota sparisce; rimetterla NON VALIDA e compilare la 7',
          'Dolore 4 sulla prova 2, 2 sulla 7 → salvare; dettaglio: prova non valida in tabella con motivo, "Dolore massimo (NRS) D — · S 4"',
          'Firestore: la prova non valida è salvata con valid false e invalidReason; clinical.painMaxBySide calcolato dal server',
          'Firestore: seq segue l\'ordine delle righe a schermo (cronologico): la ripetizione accodata ha il seq più alto, non quello della prova che ripete',
        ],
        expected: [
          'Le prove non valide restano nello storico grezzo ma non entrano mai nel best',
          'Dolore inserito per prova, massimo per lato derivato dal server',
        ],
      },
      {
        id: 'TP-059', usId: 'STORY-036', severity: 'important', title: 'Handgrip: tetto delle prove non valide',
        preconditions: 'Come TP-057.',
        steps: [
          'Segnare NON VALIDA tre prove della destra (comprese le ripetizioni) → ogni volta si accoda una sola ripetizione (togliere e rimettere NON VALIDA non ne accoda una seconda)',
          'Con 3 non valide: NON VALIDA disabilitato sulle altre righe destre, testo "Già 3 prove non valide per la mano destra: … usa Stop anticipato"; le righe destre vuote mostrano RIMUOVI',
          'Chiamata diretta con 4 non valide sullo stesso lato → errore "Oltre 3 prove non valide sul lato destro: rimuovi la prova e segna l\'interruzione"',
          'Chiamata diretta con 4 valide su un lato, con più di 12 prove o con motivo "support_or_assistance" → invalid-argument',
          'CORREGGI una Handgrip: "+ AGGIUNGI PROVA" (lato proposto) e RIMUOVI su ogni riga',
        ],
        expected: ['Mai più di 3 valide e 3 non valide per mano: oltre si registra l\'interruzione'],
      },
      {
        id: 'TP-060', usId: 'STORY-036/033', severity: 'blocker', title: 'Handgrip interrotto con una mano incompleta',
        preconditions: 'Paziente con una Handgrip completa precedente (stesso dinamometro e impugnatura).',
        steps: [
          'Nuova Handgrip: compilare 3 destre e 1 sinistra, senza stop → SALVA → "Servono 3 prove valide per la mano sinistra (1 di 3)" e errore "Completa le prove o segna l\'interruzione"',
          'Stop anticipato SÌ → catalogo motivi dei test bilaterali (dolore acuto, sintomi neurologici…, non "Dolore toracico"); motivo "Dolore acuto o crescente"',
          'Riepilogo "D … N · S 1/3 valide"; salvare (le righe vuote non si salvano)',
          'Storico: "D … · S — N", badge "INTERROTTA" e "LATO S INCOMPLETO"; delta "D ±N N rispetto al gg/mm" solo per la destra',
          'Dettaglio: best sinistra "— · incompleta (1/3 valide)", prove grezze della sinistra visibili',
          'Una Handgrip completa successiva: delta destro rispetto a questa, delta sinistro rispetto alla precedente completa',
        ],
        expected: [
          'Best vuoto solo sul lato incompleto, l\'altro conservato e con delta',
          'Un best di meno di 3 prove non è mai confrontato',
        ],
      },
      {
        id: 'TP-061', usId: 'STORY-036', severity: 'important', title: 'Handgrip: cambio modello di dinamometro',
        preconditions: 'Paziente con una Handgrip valida (es. Jamar Plus+, impugnatura "Posizione 2").',
        steps: [
          'Nuova Handgrip: marca/modello/impugnatura precompilati; scrivere "jamar " e "plus+" (maiuscole e spazi diversi) → nessun avviso',
          'Cambiare il modello → avviso "Dinamometro o impugnatura diversi dall\'ultima valutazione: non sarà confrontabile"',
          'Salvare: badge "NON CONFRONTABILE · dinamometro diverso", nessun delta numerico',
          'Cambiare solo l\'impugnatura in una nuova → "NON CONFRONTABILE · impugnatura diversa"',
          'Cambiare solo il seriale → nessun avviso (il seriale è salvato ma non è criterio di comparabilità)',
        ],
        expected: ['Modello e impugnatura sono criteri di comparabilità, con chiavi normalizzate; il seriale no'],
      },
      {
        id: 'TP-062', usId: 'STORY-033', severity: 'important', title: 'Lato dominante precompilato dalla valutazione precedente',
        preconditions: 'Paziente con una Handgrip valida salvata con mano dominante SINISTRA e unità kgf.',
        steps: [
          'Nuova Handgrip: mano dominante SINISTRA e unità kgf già selezionate, testo "…precompilati dalla valutazione del gg/mm"',
          'Paziente senza Handgrip precedenti: mano dominante vuota → SALVA → errore sul campo',
          'Annullare la Handgrip precedente → la nuova non la usa più per la precompilazione',
          'CORREGGI una Handgrip: form con i dati originali, senza testo di precompilazione; senza modifiche → "Nessuna differenza dalla valutazione originale"',
          'Firestore: setup.dominantSide sul documento della valutazione, nessun campo nuovo sul paziente',
        ],
        expected: ['Lato dominante salvato per valutazione, precompilato dall\'ultima valida senza letture né scritture in più'],
      },
      {
        id: 'TP-063', usId: 'STORY-035/036', severity: 'blocker', title: '30s-STS e Handgrip in sola lettura (staff_readonly)',
        preconditions: 'Utente staff_readonly di un\'org Lipedema, paziente con 30s-STS (anche invalidata) e Handgrip (anche interrotta).',
        steps: [
          'Tab Valutazioni: storico di 2MWT, 30s-STS e Handgrip visibile, nessun "+ NUOVA VALUTAZIONE"',
          'Dettaglio Handgrip: tabella completa delle prove (anche non valide), setup e dolore per lato; nessun CORREGGI/ANNULLA',
          'Dettaglio 30s-STS invalidata: uso braccia, alzate grezze, motivo; nessuna azione',
          'Chiamata diretta ad aggiungiValutazione con una Handgrip → permission-denied',
        ],
        expected: ['staff_readonly vede tutte le prove grezze ma non scrive (UI + server)'],
      },
    ],
  },
]

export const TOTAL_CASES = RUNBOOK_SUITES.reduce((sum, s) => sum + s.cases.length, 0)
