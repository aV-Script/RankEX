/**
 * Guide dettagliate per i test divisi per categoria.
 * Health: 5 test base clinici
 * Active: 5 test funzionali/performance
 * Athlete: 5 test prestazione avanzata
 */
export const TEST_GUIDES = {

  // ── HEALTH ──────────────────────────────────────────────────────────────────

  mobilita: {
    name: 'Sit and Reach', stat: 'Mobilità', unit: 'cm', duration: '10 minuti',
    equipment: ['Cassetta sit-and-reach o metro a nastro con nastro adesivo sul pavimento'],
    warmup: [
      'Camminata lenta 3 minuti',
      'Rotazioni del busto 10 rip. per lato',
      'Leg swing avanti-indietro 10 per lato',
      'Flessione in piedi con ginocchia morbide: 5 respiri profondi',
    ],
    protocol: [
      'Seduto sul pavimento a gambe estese e unite, piedi a 90° contro la cassetta (zero = punta dei piedi).',
      'Mani sovrapposte, palmo contro il dorso della mano opposta, dita allineate.',
      'Inspirare. Nell\'espirazione flettere lentamente il busto in avanti mantenendo le ginocchia a terra.',
      'Raggiungere la posizione massima e mantenerla per 2 secondi prima di leggere il valore.',
      'Eseguire 3 tentativi con 30 secondi di recupero. Registrare il VALORE MIGLIORE.',
    ],
    notes: [
      'Valori positivi = oltre la punta dei piedi. Valori negativi = non si raggiunge la punta.',
      'Nessun rimbalzo o movimento a molla: solo flessione controllata.',
    ],
  },

  equilibrio: {
    name: 'Flamingo Test', stat: 'Equilibrio', unit: 'n° cadute in 60s', duration: '15 minuti',
    equipment: ['Cronometro', 'Tappetino', 'Area libera 2×2m'],
    warmup: [
      'Camminata su linea retta 2 minuti',
      'Stazione su un piede per lato 3×20 secondi',
      'Rotazioni caviglia 10 per lato',
    ],
    protocol: [
      'In piedi su un piede (piede nudo), altra gamba flessa a 90° e tenuta con la mano ipsilaterale.',
      'Mani sui fianchi durante il test ufficiale (non tenere la gamba).',
      'Al via del cronometro mantenere l\'equilibrio per 60 secondi.',
      'Ogni perdita di equilibrio = 1 CADUTA. Il cronometro NON si ferma.',
      '4 tentativi totali: 2 per piede destro e 2 per piede sinistro.',
      'Registrare il VALORE MIGLIORE (n° cadute più basso) tra i 4 tentativi.',
    ],
    notes: [
      'Meno cadute = punteggio migliore.',
      '0 cadute = punteggio perfetto.',
      'Piedi nudi per uniformità tra sessioni.',
    ],
  },

  resistenza: {
    name: 'YMCA Step Test', stat: 'Resistenza', unit: 'bpm', duration: '8 minuti',
    equipment: ['Step H=30.5cm', 'Metronomo 96 bpm', 'Cronometro', 'Cardiofrequenzimetro'],
    warmup: [
      'NON eseguire riscaldamento cardiovascolare: altera i risultati.',
      'Misurare FC a riposo dopo 5 minuti di seduta tranquilla.',
    ],
    protocol: [
      'Metronomo a 96 bpm. Ogni 4 battiti = 1 ciclo completo (su-su-giù-giù) = 24 cicli/min.',
      'Salire e scendere dallo step al ritmo del metronomo per 3 minuti esatti.',
      'Schema: piede sx su → dx su → sx giù → dx giù (o speculare).',
      'Al termine dei 3 minuti il soggetto si siede immediatamente.',
      'Misurare la FC nei 60 secondi successivi. Registrare il valore in BPM.',
    ],
    notes: [
      'Meno bpm = recupero migliore = punteggio migliore.',
      'Il test misura la FC di RECUPERO, non quella durante lo sforzo.',
    ],
  },

  forza: {
    name: 'Dinamometro Hand Grip', stat: 'Forza', unit: 'kg', duration: '10 minuti',
    equipment: ['Dinamometro a mano', 'Sedia con schienale'],
    warmup: [
      'Apertura e chiusura del pugno 20 volte per mano',
      'Stretching flessori del polso 30 secondi per lato',
      '1 prova submassimale per ciascuna mano (~60% sforzo)',
    ],
    protocol: [
      'Seduto con schiena allo schienale, piedi a terra, gomito a 90°, polso neutro.',
      'Regolare il dinamometro alla mano del soggetto (2° dito a 90° nella maniglia).',
      'Al segnale stringere con forza massima per 3-5 secondi senza muovere il braccio.',
      '3 tentativi per mano alternando (Dx→Sx→Dx→Sx→Dx→Sx) con 60 secondi di recupero.',
      'Registrare il VALORE PIÙ ALTO tra tutti i 6 tentativi.',
    ],
    notes: [
      'Non oscillare il braccio né usare il peso corporeo.',
      'Espirazione durante lo sforzo.',
    ],
  },

  esplosivita: {
    name: '5 Sit to Stand', stat: 'Esplosività', unit: 'secondi', duration: '10 minuti',
    equipment: ['Sedia H=46cm senza braccioli', 'Cronometro'],
    warmup: [
      'Camminata 2 minuti',
      '5 alzate lente dalla sedia senza cronometro',
      'Stretching quadricipiti 20 secondi per lato',
    ],
    protocol: [
      'Seduto al centro della sedia, schiena non appoggiata, braccia incrociate sul petto.',
      'Ginocchia a 90°, piedi a larghezza spalle appoggiati a terra.',
      'Al segnale alzarsi completamente e risedersi per 5 volte il più velocemente possibile.',
      'Il cronometro si ferma quando il soggetto si siede per la quinta volta.',
      '3 tentativi con 2 minuti di riposo. Registrare il TEMPO MIGLIORE.',
    ],
    notes: [
      'Meno secondi = punteggio migliore.',
      'Ginocchia completamente estese ad ogni alzata.',
      'Vietato usare le mani per spingersi dalla sedia.',
    ],
  },

  // ── ACTIVE ──────────────────────────────────────────────────────────────────

  y_balance: {
    name: 'Y Balance Test', stat: 'Y Balance', unit: '% lunghezza arto', duration: '20 minuti',
    equipment: ['Kit Y Balance Test o nastro adesivo sul pavimento a Y', 'Metro a nastro'],
    warmup: [
      'Riscaldamento dinamico arti inferiori 5 minuti',
      'Squat monopodalici 10 per lato',
      '4 prove di pratica per direzione prima del test ufficiale',
    ],
    protocol: [
      'Il soggetto si posiziona su un piede al centro della piattaforma Y (o incrocio dei nastri).',
      'Con il piede libero raggiunge il più lontano possibile lungo ciascuna delle 3 direzioni: ANTERIORE (ANT), POSTERO-MEDIALE (PM), POSTERO-LATERALE (PL).',
      'Il piede di reach tocca leggermente la linea senza scaricarvi il peso.',
      '3 prove per direzione per ciascun piede. Si registra il VALORE MIGLIORE per ciascuna direzione.',
      'Score = (ANT + PM + PL) / (3 × lunghezza arto) × 100.',
      'Misurare la lunghezza dell\'arto da SIAS (spina iliaca antero-superiore) al malleolo mediale.',
    ],
    notes: [
      'Il soggetto non deve perdere l\'equilibrio né appoggiare il piede di reach a terra.',
      'Tentativo invalido se il piede di supporto si sposta o se si usa il reach come appoggio.',
      'Registrare il composite score medio tra i due lati.',
    ],
  },

  standing_long_jump: {
    name: 'Standing Long Jump', stat: 'Salto Lungo', unit: 'cm', duration: '10 minuti',
    equipment: ['Tappeto o pavimento non scivoloso', 'Metro a nastro', 'Linea di partenza'],
    warmup: [
      'Squat dinamici 2×10',
      'Affondi con rotazione 10 per lato',
      '2 salti submassimali di prova',
    ],
    protocol: [
      'Il soggetto si posiziona con le punte dei piedi alla linea di partenza, piedi alla larghezza delle spalle.',
      'Flettere le ginocchia, portare le braccia indietro e saltare in avanti il più lontano possibile.',
      'Atterrare con entrambi i piedi contemporaneamente, mantenere la posizione di atterraggio.',
      'Misurare dal tallone più vicino alla linea di partenza.',
      '3 tentativi con 2 minuti di recupero. Registrare il VALORE MIGLIORE.',
    ],
    notes: [
      'Il tentativo è nullo se il soggetto cade all\'indietro dopo l\'atterraggio.',
      'Consentito uso delle braccia per il contromovimento.',
    ],
  },

  sprint_10m: {
    name: '10m Sprint', stat: 'Sprint 10m', unit: 'secondi', duration: '15 minuti',
    equipment: ['Fotocellule o cronometro manuale', 'Superficie piana non scivolosa', 'Coni'],
    warmup: [
      'Corsa leggera 5 minuti',
      'Andature atletiche (ginocchia alte, calciata, skip) 2×20m',
      '2 sprint al 70-80% di intensità',
    ],
    protocol: [
      'Posizione di partenza: piede anteriore a 50cm dalla linea, posizione di tre-quarti.',
      'Partenza autonoma al momento scelto dal soggetto. Il cronometro parte al primo movimento.',
      'Correre i 10 metri alla massima velocità. Il tempo si ferma al taglio della linea.',
      '3 tentativi con almeno 3 minuti di recupero completo tra un tentativo e l\'altro.',
      'Registrare il TEMPO MIGLIORE.',
    ],
    notes: [
      'Meno secondi = punteggio migliore.',
      'Recupero completo fondamentale per risultati affidabili.',
      'Superfici diverse (erba vs tartan) possono alterare i valori.',
    ],
  },

  // ── ATHLETE ─────────────────────────────────────────────────────────────────

  drop_jump_rsi: {
    name: 'Drop Jump RSI', stat: 'Reattività', unit: 'RSI (cm/s)', duration: '20 minuti',
    equipment: ['Box 30-40cm', 'Pedana di forza o app per RSI (es. My Jump 2)', 'Superficie rigida'],
    warmup: [
      'Riscaldamento completo 10 minuti',
      'Drop jump submassimali 3×3 dal box di test',
      'Recupero 3 minuti',
    ],
    protocol: [
      'Il soggetto sale sul box (30-40cm, costante tra sessioni) e si posiziona sul bordo.',
      'Scendere lasciandosi cadere (NON saltare dal box): piedi paralleli, mani sui fianchi.',
      'All\'atterraggio eseguire il rimbalzo il più rapido e alto possibile minimizzando il tempo di contatto.',
      'RSI = Altezza salto (cm) / Tempo di contatto (s). Misurare con pedana o app.',
      '5 prove valide con 60 secondi di recupero. Registrare la MEDIA delle 3 prove centrali.',
    ],
    notes: [
      'RSI più alto = migliore capacità reattiva.',
      'Il soggetto non deve flettere eccessivamente le ginocchia all\'atterraggio.',
      'Mantenere la stessa altezza del box in tutte le sessioni per confrontare i valori nel tempo.',
    ],
  },

  t_test_agility: {
    name: 'T-Test Agility', stat: 'Agilità', unit: 'secondi', duration: '20 minuti',
    equipment: ['4 coni', 'Cronometro o fotocellule', 'Superficie piana'],
    warmup: [
      'Corsa leggera 5 minuti',
      'Cambi di direzione progressivi 3×',
      '2 prove al 70% per familiarizzare con il tracciato',
    ],
    protocol: [
      'Disposizione coni: A (partenza), B (5m davanti ad A), C (2.5m a sinistra di B), D (2.5m a destra di B).',
      'Partenza da A in corsa verso B: toccare la base del cono B con la mano destra.',
      'Corsa laterale verso C (sinistra): toccare la base con la mano sinistra.',
      'Corsa laterale verso D (destra, 5m): toccare la base con la mano destra.',
      'Corsa laterale di ritorno verso B: toccare con la mano sinistra.',
      'Sprint di ritorno verso A correndo a ritroso. Il tempo si ferma al taglio della linea.',
      '3 tentativi con 3 minuti di recupero. Registrare il TEMPO MIGLIORE.',
    ],
    notes: [
      'Meno secondi = punteggio migliore.',
      'Il tentativo è nullo se il soggetto non tocca la base dei coni.',
      'Vietato incrociare i piedi durante gli spostamenti laterali.',
    ],
  },

  yo_yo_ir1: {
    name: 'Yo-Yo IR1', stat: 'Yo-Yo', unit: 'metri', duration: '20-40 minuti',
    equipment: ['Audio CD/app Yo-Yo Test ufficiale', 'Due linee distanti 20m + linea intermedia a 5m', 'Coni'],
    warmup: [
      'NON eseguire riscaldamento intenso: i primi livelli del test fungono da riscaldamento.',
      'Spiegare al soggetto la procedura e i segnali audio.',
    ],
    protocol: [
      'Il soggetto parte dalla linea A al segnale audio e raggiunge la linea B (20m).',
      'Tra un\'andatura e l\'altra ha 10 secondi di recupero attivo fino alla linea intermedia (5m) e ritorno.',
      'La velocità di corsa aumenta progressivamente secondo i livelli del CD/app.',
      'Il test termina quando il soggetto non riesce a raggiungere la linea B per 2 volte consecutive.',
      'Registrare la DISTANZA TOTALE in metri (indicata dall\'app o calcolata dal livello raggiunto).',
    ],
    notes: [
      'Più metri = maggiore resistenza intermittente = punteggio migliore.',
      'Usare sempre lo stesso audio ufficiale per confrontabilità.',
      'Test adatto ad atleti di sport di squadra (calcio, basket, rugby).',
    ],
  },

  sprint_20m: {
    name: 'Sprint 20m', stat: 'Sprint 20m', unit: 'secondi', duration: '15 minuti',
    equipment: ['Fotocellule o cronometro', 'Superficie piana', 'Coni ogni 5m'],
    warmup: [
      'Corsa leggera 5 minuti',
      'Andature atletiche 2×20m',
      '2 sprint progressivi al 70% e 85%',
    ],
    protocol: [
      'Posizione di partenza: tre-quarti, piede anteriore a 50cm dalla linea di partenza.',
      'Partenza autonoma. Il cronometro parte al primo movimento del piede posteriore.',
      'Correre i 20 metri alla massima velocità. Tempo registrato al taglio della linea finale.',
      '3 tentativi con almeno 4 minuti di recupero completo.',
      'Registrare il TEMPO MIGLIORE.',
    ],
    notes: [
      'Meno secondi = punteggio migliore.',
      'Con fotocellule registrare anche i tempi parziali a 5m e 10m se disponibili.',
    ],
  },

  cmj: {
    name: 'CMJ Avanzato', stat: 'CMJ', unit: 'cm', duration: '15 minuti',
    equipment: ['Pedana di forza o app My Jump 2', 'Superficie rigida'],
    warmup: [
      'Riscaldamento completo 10 minuti incluso lavoro pliometrico leggero',
      '3 CMJ submassimali di pratica',
      '2 minuti di recupero',
    ],
    protocol: [
      'Il soggetto si posiziona sulla pedana con mani sui fianchi (NO arm swing).',
      'Eseguire un contromovimento verso il basso (flessione ginocchia ~90°) e saltare verticalmente il più in alto possibile.',
      'Atterrare con entrambi i piedi nella stessa posizione di partenza.',
      'Misurare l\'altezza di salto in cm tramite pedana o app.',
      '5 prove con 60 secondi di recupero. Registrare la MEDIA delle 3 prove centrali (scarta la migliore e la peggiore).',
    ],
    notes: [
      'Più cm = punteggio migliore.',
      'Mani sempre sui fianchi per standardizzare il test (niente arm swing).',
      'Confrontare solo con sessioni in cui si usa lo stesso strumento di misura.',
    ],
  },
}

// Helper: ritorna tutte le guide di una categoria
export function getGuidesForCategoria(categoriaId) {
  const { CATEGORY_TESTS } = require('./index')
  const tests = CATEGORY_TESTS[categoriaId] ?? CATEGORY_TESTS.health
  return tests.map(t => ({ key: t.key, ...TEST_GUIDES[t.key] })).filter(g => g.name)
}

// ─── TEST CATEGORIA ACTIVE ─────────────────────────────────────────────────────

export const ACTIVE_TEST_GUIDES = {

  y_balance: {
    name:      'Y Balance Test',
    stat:      'Equilibrio Dinamico',
    unit:      '% lunghezza arto',
    duration:  '15 minuti',
    equipment: ['Kit Y Balance Test (o 3 strisce di nastro adesivo a Y sul pavimento)', 'Metro a nastro per misurare la lunghezza dell\'arto (ASIS → malleolo mediale)', 'Cronometro'],
    warmup: [
      'Camminata 3 minuti',
      'Stazione monopodalica statica 3 × 20s per lato',
      'Affondo frontale e laterale 10 per lato',
      '3 prove di pratica per direzione (non registrare)',
    ],
    protocol: [
      'Misurare la lunghezza dell\'arto inferiore: da ASIS (cresta iliaca anteriore) al malleolo mediale in cm.',
      'Il soggetto si posiziona sul piede dominante al centro del kit, con le 3 direzioni: anteriore (AT), postero-mediale (PM), postero-laterale (PL).',
      'Con il piede libero, raggiungere la massima distanza in ciascuna delle 3 direzioni senza perdere l\'equilibrio e senza appoggiare il piede.',
      'Il piede di supporto deve restare con il tallone a terra. Sono ammesse 4 prove per direzione; registrare il valore migliore.',
      'Calcolare il Composite Score: (AT + PM + PL) / (3 × lunghezza arto) × 100.',
      'Ripetere per l\'arto controlaterale. Registrare il Composite Score medio dei due arti.',
    ],
    notes: [
      'Il valore registrato è il Composite Score in % della lunghezza dell\'arto.',
      'Differenza >4cm nella direzione anteriore tra i due arti indica asimmetria clinicamente rilevante.',
      'Soglia injury risk per atleti maschi: <89%.',
      'Piedi nudi per uniformità tra sessioni.',
    ],
  },

  standing_long_jump: {
    name:      'Standing Long Jump',
    stat:      'Potenza Esplosiva',
    unit:      'cm',
    duration:  '10 minuti',
    equipment: ['Superficie antiscivolo (palestra o tappetino)', 'Metro a nastro', 'Nastro adesivo per segnare la linea di partenza'],
    warmup: [
      'Jogging 3 minuti',
      'Squat jump leggero 5 ripetizioni',
      'Stretching dinamico quadricipiti e polpacci 30 secondi',
      '2 prove submassimali per familiarizzare',
    ],
    protocol: [
      'Il soggetto si posiziona dietro la linea di partenza con i piedi alla larghezza delle spalle.',
      'Flettere le ginocchia portando le braccia indietro, poi saltare in avanti con massimo impegno spingendo con entrambi i piedi simultaneamente.',
      'Le braccia possono essere usate per lo slancio.',
      'Misurare la distanza dalla linea di partenza al punto di contatto più arretrato (talloni).',
      'Eseguire 3 tentativi con 60 secondi di recupero. Registrare il VALORE MIGLIORE.',
    ],
    notes: [
      'Il tentativo è nullo se il soggetto cade all\'indietro dopo l\'atterraggio.',
      'La misura va dal bordo anteriore della linea di partenza al punto più vicino all\'atterraggio (tallone).',
      'Consigliare una sessione di familiarizzazione prima del test ufficiale per massimizzare l\'affidabilità.',
    ],
  },

  sprint_10m: {
    name:      '10m Sprint',
    stat:      'Velocità',
    unit:      'secondi',
    duration:  '15 minuti',
    equipment: ['Fotocelule o cronometro manuale (fotocelule raccomandato)', 'Superficie piatta e antiscivolo', 'Nastro per segnare partenza e arrivo'],
    warmup: [
      'Jogging leggero 5 minuti',
      'Skip, calciata indietro 30m per esercizio',
      'Accelerazioni progressive 3 × 20m al 70-80%',
      '2 prove di prova non registrate',
    ],
    protocol: [
      'Il soggetto si posiziona in posizione di partenza in piedi (standing start), piede dominante avanzato, dietro la linea.',
      'Al segnale, sprint massimale per 10 metri.',
      'Il cronometro parte al primo movimento del soggetto (fotocelula sulla linea di partenza) e si ferma al passaggio sulla linea dei 10 metri.',
      'Eseguire 3 tentativi con 3 minuti di recupero completo. Registrare il TEMPO MIGLIORE.',
    ],
    notes: [
      'Meno secondi = punteggio migliore (statistica inversa).',
      'Le fotocelule garantiscono maggiore precisione rispetto al cronometro manuale.',
      'Standardizzare sempre il tipo di superficie (sintetico, parquet, erba) tra le sessioni.',
      'Non eseguire subito dopo test di forza massimale.',
    ],
  },
}

// ─── TEST CATEGORIA ATHLETE ────────────────────────────────────────────────────

export const ATHLETE_TEST_GUIDES = {

  drop_jump_rsi: {
    name:      'Drop Jump — RSI',
    stat:      'Potenza Reattiva (RSI)',
    unit:      'RSI (h/tc)',
    duration:  '20 minuti',
    equipment: ['Box di caduta H=30cm (o regolabile)', 'Tappetino di contatto o fotocelule con sistema di calcolo RSI', 'Cronometro se tappetino non disponibile'],
    warmup: [
      'Jogging 5 minuti',
      'Squat jump 3 × 5 progressivi',
      'Drop jump tecnico da H=20cm (3 prove leggere per familiarizzazione)',
      'Riposo 2 minuti',
    ],
    protocol: [
      'Il soggetto si posiziona in piedi sul box (H=30cm). Mani sui fianchi per isolare la potenza degli arti inferiori.',
      'Cadere in avanti lasciandosi scendere dal box (NON saltare). Al contatto con il suolo, rimbalzare immediatamente verso l\'alto con il massimo impegno.',
      'L\'obiettivo è minimizzare il tempo di contatto e massimizzare l\'altezza del salto.',
      'RSI = Altezza salto (m) / Tempo di contatto (s). Il sistema di misura calcola automaticamente il RSI.',
      'Eseguire 5 tentativi con 90 secondi di recupero. Scartare il migliore e il peggiore, registrare la MEDIA degli altri 3.',
    ],
    notes: [
      'Il RSI è il parametro chiave: non l\'altezza del salto isolata.',
      'Valori RSI indicativi: <1.0 scarso, 1.0-1.5 medio, 1.5-2.0 buono, >2.0 elite.',
      'Test avanzato: richiede supervisione attenta per prevenire infortuni.',
      'Non eseguire in stato di fatica muscolare degli arti inferiori.',
    ],
  },

  t_test: {
    name:      'T-Test Agility',
    stat:      'Agilità',
    unit:      'secondi',
    duration:  '20 minuti',
    equipment: ['4 coni', 'Fotocelule o cronometro', 'Superficie piatta antiscivolo'],
    warmup: [
      'Jogging 5 minuti',
      'Esercizi laterali shuffle 3 × 10m per lato',
      'Backpedal 3 × 10m',
      '2 prove complete a velocità submassimale',
    ],
    protocol: [
      'Setup: cono A (partenza), cono B a 9.14m davanti, coni C e D a 4.57m a sinistra e destra di B.',
      'Il soggetto parte da A, sprint fino a B (tocca la base), shuffle a sinistra verso C (tocca), shuffle a destra verso D (tocca), shuffle torna a B (tocca), backpedal fino ad A.',
      'Il soggetto deve sempre fronteggiare la stessa direzione: NON incrociare i piedi nel laterale.',
      'Il tempo parte al segnale e si ferma al passaggio su A al ritorno.',
      'Eseguire 3 tentativi (girando prima a sinistra e poi a destra alternativamente) con 3 minuti di recupero. Registrare il TEMPO MIGLIORE.',
    ],
    notes: [
      'Il tentativo è nullo se si incrociano i piedi nel laterale o non si tocca la base dei coni.',
      'Eccellente M: <9.5s | Buono M: 9.5-10.5s | Eccellente F: <10.5s | Buono F: 10.5-11.5s.',
      'Meno secondi = punteggio migliore (statistica inversa).',
    ],
  },

  yoyo_ir1: {
    name:      'Yo-Yo Intermittent Recovery Test L1',
    stat:      'Resistenza Intermittente',
    unit:      'metri totali',
    duration:  '10-30 minuti',
    equipment: ['Traccia audio Yo-Yo IR1 (bip progressivo)', 'Coni o linee a 20m + 5m recovery', 'Altoparlante', 'Ampio spazio piano'],
    warmup: [
      'NON eseguire riscaldamento intenso prima del test.',
      'Camminata 5 minuti e stretching dinamico leggero.',
      'I primi livelli del test fungono da riscaldamento progressivo.',
    ],
    protocol: [
      'Segnare due linee parallele distanti 20m. Una terza linea a 5m da una delle due (zona recovery).',
      'Il soggetto parte da una linea, corre 20m fino all\'altra al ritmo del bip, poi torna ai 5m di recovery (camminata attiva di 10 secondi).',
      'La velocità aumenta progressivamente secondo la traccia audio.',
      'Il test termina quando il soggetto non riesce a raggiungere la linea in tempo per 2 volte consecutive.',
      'Registrare la DISTANZA TOTALE in metri (livello × shuttle × 40m).',
    ],
    notes: [
      'Distanza maggiore = punteggio migliore (statistica diretta).',
      'Riferimento maschi sport di squadra: media ~1000-1400m, élite >2000m.',
      'Riferimento femmine sport di squadra: media ~600-900m.',
      'Il test è specifico per sport intermittenti (calcio, basket, rugby).',
    ],
  },

  sprint_20m: {
    name:      'Sprint 20m',
    stat:      'Velocità Massimale',
    unit:      'secondi',
    duration:  '20 minuti',
    equipment: ['Fotocelule (raccomandato) o cronometro', 'Superficie piatta antiscivolo', 'Nastro per linee partenza e arrivo'],
    warmup: [
      'Jogging 5 minuti',
      'Skip, calciata, skip laterale 30m ciascuno',
      'Accelerazioni progressive 3 × 30m al 70, 85, 95%',
      '1 prova completa non registrata',
    ],
    protocol: [
      'Il soggetto si posiziona in standing start dietro la linea (piede dominante avanzato).',
      'Al segnale, sprint massimale per 20 metri.',
      'Il cronometro parte al primo movimento (fotocelula) e si ferma al passaggio sulla linea dei 20m.',
      'Eseguire 3 tentativi con 4 minuti di recupero completo. Registrare il TEMPO MIGLIORE.',
    ],
    notes: [
      'Meno secondi = punteggio migliore (statistica inversa).',
      'Le fotocelule garantiscono precisione al centesimo di secondo.',
      'Standardizzare la superficie tra le sessioni (sintetico indoor raccomandato).',
      'Riferimento adulti maschi non atleti: ~3.4-3.6s. Atleti élite: <2.8s.',
    ],
  },

  cmj: {
    name:      'CMJ — Countermovement Jump Avanzato',
    stat:      'Potenza Esplosiva',
    unit:      'cm',
    duration:  '15 minuti',
    equipment: ['Tappetino di contatto o sistema fotocelule per CMJ', 'Altimetro jump (es. My Jump 2) se non disponibile tappetino', 'Gesso o marker per traccia altezza (alternativa)'],
    warmup: [
      'Jogging 5 minuti',
      'Squat 2 × 10 leggeri',
      'Squat jump progressivi 3 × 5 al 60, 80, 95%',
      'Riposo 2 minuti',
    ],
    protocol: [
      'Il soggetto si posiziona in piedi, mani sui fianchi (per isolare la forza degli arti inferiori).',
      'Eseguire un rapido abbassamento (countermovement) fino a circa 90° di flessione delle ginocchia, poi saltare verticalmente con massimo impegno.',
      'Il sistema registra l\'altezza del salto in cm (tappetino di contatto → calcolo dal tempo di volo: h = g × t² / 8).',
      'Eseguire 5 tentativi con 60 secondi di recupero. Registrare il VALORE MIGLIORE.',
    ],
    notes: [
      'Le mani devono restare sui fianchi per tutta la durata del salto.',
      'Non è consentito un secondo countermovement: il movimento è continuo.',
      'L\'app My Jump 2 (iOS/Android) è un\'alternativa validata scientificamente al tappetino di contatto.',
      'Valori medi M 18-35: ~35-42cm. Elite M: >55cm. Medie F: ~25-32cm.',
    ],
  },
}
