/**
 * Configurazione completa dei test.
 * Aggiungere un test = aggiungere un oggetto a questo array.
 *
 * Campi obbligatori:
 *   key          — identificatore unico del test fisico
 *   stat         — chiave della statistica nel profilo cliente
 *   label        — nome breve (barre statistiche)
 *   unit         — unità di misura
 *   direction    — 'direct' | 'inverse'
 *   test         — nome completo del test
 *   categories   — array di categorie in cui il test viene somministrato
 *
 * Campi opzionali:
 *   desc         — descrizione breve nel wizard
 *   variables    — array di variabili per test multi-input
 *   formulaType  — tipo di formula (vedi formulas.js)
 *   guide        — guida dettagliata per TestGuidePage
 */
export const TESTS = [

  // ── HEALTH + ACTIVE ─────────────────────────────────────────────────────────

  {
    key:        'dinamometro_hand_grip',
    stat:       'forza',
    label:      'Forza',
    unit:       'kg',
    direction:  'direct',
    ageGroup:   (age) => age <= 35 ? '18-35' : age <= 45 ? '36-45' : age <= 55 ? '46-55' : age <= 65 ? '56-65' : '66+',
    test:       'Dinamometro Hand Grip',
    categories: ['health', 'active'],
    desc:       'Forza massima di presa della mano dominante.',
    guide: {
      duration:  '10 minuti',
      equipment: [
        'Dinamometro a mano',
        'Sedia con schienale',
      ],
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
  },

  {
    key:        'ymca_step_test',
    stat:       'resistenza',
    label:      'Resistenza',
    unit:       'bpm',
    direction:  'inverse',
    ageGroup:   (age) => age <= 35 ? '18-35' : age <= 45 ? '36-45' : '46+',
    test:       'YMCA Step Test',
    categories: ['health', 'active'],
    desc:       'FC di recupero a 1 minuto dal termine del test.',
    guide: {
      duration:  '8 minuti',
      equipment: [
        'Step H=30.5cm',
        'Metronomo 96 bpm',
        'Cronometro',
        'Cardiofrequenzimetro',
      ],
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
  },

  // ── HEALTH ──────────────────────────────────────────────────────────────────

  {
    key:        'sit_and_reach',
    stat:       'mobilita',
    label:      'Mobilità',
    unit:       'cm',
    direction:  'direct',
    test:       'Sit and Reach',
    ageGroup:   (age) => age <= 35 ? '18-35' : age <= 45 ? '36-45' : age <= 55 ? '46-55' : age <= 65 ? '56-65' : '66+',
    categories: ['health'],
    desc:       'Flessibilità della catena posteriore.',
    guide: {
      duration:  '10 minuti',
      equipment: [
        'Cassetta sit-and-reach o metro a nastro con nastro adesivo sul pavimento',
      ],
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
  },

  {
    key:        'flamingo_test',
    stat:       'equilibrio',
    label:      'Equilibrio',
    unit:       'cadute',
    direction:  'inverse',
    ageGroup:   (age) => age <= 35 ? '18-35' : age <= 45 ? '36-45' : age <= 55 ? '46-55' : age <= 65 ? '56-65' : '66+',
    test:       'Flamingo Test',
    categories: ['health'],
    desc:       'Numero di cadute in 60 secondi su un piede.',
    guide: {
      duration:  '15 minuti',
      equipment: [
        'Cronometro',
        'Tappetino',
        'Area libera 2×2m',
      ],
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
  },

  {
    key:        'sit_to_stand',
    stat:       'esplosivita',
    label:      'Esplosività',
    unit:       'secondi',
    direction:  'inverse',
    ageGroup:   (age) => age <= 35 ? '18-35' : age <= 45 ? '36-45' : age <= 55 ? '46-55' : age <= 65 ? '56-65' : '66+',
    test:       '5 Sit to Stand',
    categories: ['health'],
    desc:       'Tempo per alzarsi e sedersi 5 volte dalla sedia.',
    guide: {
      duration:  '10 minuti',
      equipment: [
        'Sedia H=46cm senza braccioli',
        'Cronometro',
      ],
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
  },

  // ── ACTIVE ──────────────────────────────────────────────────────────────────

  {
    key:         'y_balance',
    stat:        'stabilita',
    label:       'Stabilità',
    unit:        '%',
    direction:   'direct',
    ageGroup:   (age) => age <= 40 ? '18-40' : '41-60',
    test:        'Y Balance Test',
    categories:  ['active'],
    desc:        'Score composito normalizzato sulla lunghezza arto.',
    variables: [
      { key: 'ANT',           label: 'Anterior',         unit: 'cm' },
      { key: 'PM',            label: 'Postero-mediale',  unit: 'cm' },
      { key: 'PL',            label: 'Postero-laterale', unit: 'cm' },
      { key: 'lunghezzaArto', label: 'Lunghezza arto',   unit: 'cm' },
    ],
    formulaType: 'y_balance_composite',
    guide: {
      duration:  '20 minuti',
      equipment: [
        'Kit Y Balance Test o nastro adesivo sul pavimento a Y',
        'Metro a nastro per misurare la lunghezza dell\'arto (ASIS → malleolo mediale)',
        'Cronometro',
      ],
      warmup: [
        'Camminata 3 minuti',
        'Stazione monopodalica statica 3×20s per lato',
        'Affondo frontale e laterale 10 per lato',
        '3 prove di pratica per direzione (non registrare)',
      ],
      protocol: [
        'Misurare la lunghezza dell\'arto inferiore: da ASIS al malleolo mediale in cm.',
        'Il soggetto si posiziona su un piede al centro del kit con le 3 direzioni: ANT, PM, PL.',
        'Con il piede libero raggiungere la massima distanza in ciascuna direzione senza perdere l\'equilibrio.',
        'Il piede di supporto deve restare con il tallone a terra. 4 prove per direzione — registrare il valore migliore.',
        'Calcolare il Composite Score: (ANT + PM + PL) / (3 × lunghezza arto) × 100.',
        'Ripetere per l\'arto controlaterale. Registrare il Composite Score medio dei due arti.',
      ],
      notes: [
        'Differenza >4cm nella direzione anteriore tra i due arti indica asimmetria rilevante.',
        'Soglia injury risk per atleti maschi: <89%.',
        'Piedi nudi per uniformità tra sessioni.',
      ],
    },
  },

  {
    key:        'standing_long_jump',
    stat:       'esplosivita',
    label:      'Esplosività',
    unit:       'cm',
    direction:  'direct',
    ageGroup:   (age) => age <= 35 ? '18-35' : '36-50',
    test:       'Standing Long Jump',
    categories: ['active'],
    desc:       'Distanza salto in lungo da fermo.',
    guide: {
      duration:  '10 minuti',
      equipment: [
        'Superficie antiscivolo (palestra o tappetino)',
        'Metro a nastro',
        'Nastro adesivo per segnare la linea di partenza',
      ],
      warmup: [
        'Jogging 3 minuti',
        'Squat jump leggero 5 ripetizioni',
        'Stretching dinamico quadricipiti e polpacci 30 secondi',
        '2 prove submassimali per familiarizzare',
      ],
      protocol: [
        'Il soggetto si posiziona dietro la linea con i piedi alla larghezza delle spalle.',
        'Flettere le ginocchia portando le braccia indietro, poi saltare in avanti con massimo impegno.',
        'Le braccia possono essere usate per lo slancio.',
        'Misurare la distanza dalla linea di partenza al punto di contatto più arretrato (talloni).',
        '3 tentativi con 60 secondi di recupero. Registrare il VALORE MIGLIORE.',
      ],
      notes: [
        'Il tentativo è nullo se il soggetto cade all\'indietro dopo l\'atterraggio.',
        'Consigliare una sessione di familiarizzazione prima del test ufficiale.',
      ],
    },
  },

  {
    key:        'sprint_10m',
    stat:       'velocita',
    label:      'Velocità',
    unit:       'secondi',
    direction:  'inverse',
    ageGroup:   (age) => age <= 35 ? '18-35' : '36-50',
    test:       '10m Sprint',
    categories: ['active'],
    desc:       'Tempo sui 10 metri lanciati.',
    guide: {
      duration:  '15 minuti',
      equipment: [
        'Fotocellule o cronometro manuale',
        'Superficie piana non scivolosa',
        'Nastro per segnare partenza e arrivo',
      ],
      warmup: [
        'Jogging leggero 5 minuti',
        'Skip, calciata indietro 30m per esercizio',
        'Accelerazioni progressive 3×20m al 70-80%',
        '2 prove di prova non registrate',
      ],
      protocol: [
        'Il soggetto si posiziona in standing start dietro la linea, piede dominante avanzato.',
        'Al segnale, sprint massimale per 10 metri.',
        'Il cronometro parte al primo movimento e si ferma al passaggio sulla linea dei 10m.',
        '3 tentativi con 3 minuti di recupero completo. Registrare il TEMPO MIGLIORE.',
      ],
      notes: [
        'Meno secondi = punteggio migliore.',
        'Le fotocellule garantiscono maggiore precisione rispetto al cronometro manuale.',
        'Standardizzare sempre il tipo di superficie tra le sessioni.',
      ],
    },
  },

  // ── ATHLETE ─────────────────────────────────────────────────────────────────

  {
    key:        'drop_jump_rsi',
    stat:       'reattivita',
    label:      'Reattività',
    unit:       'RSI',
    direction:  'direct',
    ageGroup:   (age) => age <= 35 ? '18-35' : '36-50',
    test:       'Drop Jump RSI',
    categories: ['athlete'],
    desc:       'Indice di forza reattiva (altezza/tempo contatto).',
    guide: {
      duration:  '20 minuti',
      equipment: [
        'Box di caduta H=30cm',
        'Pedana di forza o app per RSI (es. My Jump 2)',
        'Superficie rigida',
      ],
      warmup: [
        'Jogging 5 minuti',
        'Squat jump 3×5 progressivi',
        'Drop jump tecnico da H=20cm (3 prove leggere per familiarizzazione)',
        'Riposo 2 minuti',
      ],
      protocol: [
        'Il soggetto si posiziona in piedi sul box (H=30cm). Mani sui fianchi.',
        'Cadere in avanti lasciandosi scendere dal box (NON saltare).',
        'Al contatto con il suolo, rimbalzare immediatamente verso l\'alto con il massimo impegno.',
        'RSI = Altezza salto (m) / Tempo di contatto (s).',
        '5 prove con 90 secondi di recupero. Scartare la migliore e la peggiore — registrare la MEDIA delle altre 3.',
      ],
      notes: [
        'Il RSI è il parametro chiave: non l\'altezza del salto isolata.',
        'Valori RSI: <1.0 scarso · 1.0-1.5 medio · 1.5-2.0 buono · >2.0 elite.',
        'Non eseguire in stato di fatica muscolare degli arti inferiori.',
      ],
    },
  },

  {
    key:        't_test_agility',
    stat:       'agilita',
    label:      'Agilità',
    unit:       'secondi',
    direction:  'inverse',
    ageGroup:   (_) => '18-40',
    test:       'T-Test Agility',
    categories: ['athlete'],
    desc:       'Tempo sul percorso a T con coni.',
    guide: {
      duration:  '20 minuti',
      equipment: [
        '4 coni',
        'Fotocellule o cronometro',
        'Superficie piana antiscivolo',
      ],
      warmup: [
        'Jogging 5 minuti',
        'Esercizi laterali shuffle 3×10m per lato',
        'Backpedal 3×10m',
        '2 prove complete a velocità submassimale',
      ],
      protocol: [
        'Setup: cono A (partenza), cono B a 9.14m davanti, coni C e D a 4.57m a sinistra e destra di B.',
        'Sprint da A verso B (tocca la base), shuffle a sinistra verso C (tocca), shuffle a destra verso D (tocca), shuffle torna a B (tocca), backpedal fino ad A.',
        'Il soggetto deve sempre fronteggiare la stessa direzione: NON incrociare i piedi nel laterale.',
        '3 tentativi con 3 minuti di recupero. Registrare il TEMPO MIGLIORE.',
      ],
      notes: [
        'Il tentativo è nullo se si incrociano i piedi o non si tocca la base dei coni.',
        'Eccellente M: <9.5s · Buono M: 9.5-10.5s · Eccellente F: <10.5s · Buono F: 10.5-11.5s.',
        'Meno secondi = punteggio migliore.',
      ],
    },
  },

  {
    key:        'yo_yo_ir1',
    stat:       'resistenza',
    label:      'Resistenza',
    unit:       'metri',
    direction:  'direct',
    ageGroup:   (age) => age <= 35 ? '18-35' : '36-50',
    test:       'Yo-Yo IR1',
    categories: ['athlete'],
    desc:       'Distanza totale nel test intermittente Yo-Yo.',
    guide: {
      duration:  '10-30 minuti',
      equipment: [
        'Traccia audio Yo-Yo IR1 (bip progressivo)',
        'Coni o linee a 20m + 5m recovery',
        'Altoparlante',
        'Ampio spazio piano',
      ],
      warmup: [
        'NON eseguire riscaldamento intenso prima del test.',
        'Camminata 5 minuti e stretching dinamico leggero.',
        'I primi livelli del test fungono da riscaldamento progressivo.',
      ],
      protocol: [
        'Segnare due linee parallele distanti 20m. Una terza linea a 5m (zona recovery).',
        'Il soggetto corre 20m fino all\'altra linea al ritmo del bip, poi torna ai 5m di recovery (10 secondi).',
        'La velocità aumenta progressivamente secondo la traccia audio.',
        'Il test termina quando il soggetto non riesce a raggiungere la linea in tempo per 2 volte consecutive.',
        'Registrare la DISTANZA TOTALE in metri.',
      ],
      notes: [
        'Più metri = punteggio migliore.',
        'Riferimento maschi sport di squadra: media ~1000-1400m, élite >2000m.',
        'Test specifico per sport intermittenti (calcio, basket, rugby).',
      ],
    },
  },

  {
    key:        'sprint_20m',
    stat:       'velocita',
    label:      'Velocità',
    unit:       'secondi',
    direction:  'inverse',
    test:       'Sprint 20m',
    ageGroup:   (age) => age <= 35 ? '18-35' : '36-50',
    categories: ['athlete'],
    desc:       'Tempo sui 20 metri lanciati.',
    guide: {
      duration:  '20 minuti',
      equipment: [
        'Fotocellule o cronometro',
        'Superficie piana antiscivolo',
        'Nastro per linee partenza e arrivo',
      ],
      warmup: [
        'Jogging 5 minuti',
        'Skip, calciata, skip laterale 30m ciascuno',
        'Accelerazioni progressive 3×30m al 70, 85, 95%',
        '1 prova completa non registrata',
      ],
      protocol: [
        'Il soggetto si posiziona in standing start dietro la linea, piede dominante avanzato.',
        'Al segnale, sprint massimale per 20 metri.',
        'Il cronometro parte al primo movimento e si ferma al passaggio sulla linea dei 20m.',
        '3 tentativi con 4 minuti di recupero completo. Registrare il TEMPO MIGLIORE.',
      ],
      notes: [
        'Meno secondi = punteggio migliore.',
        'Le fotocellule garantiscono precisione al centesimo di secondo.',
        'Riferimento adulti maschi non atleti: ~3.4-3.6s. Atleti élite: <2.8s.',
      ],
    },
  },

  {
    key:        'cmj',
    stat:       'esplosivita',
    label:      'Esplosività',
    unit:       'cm',
    direction:  'direct',
    ageGroup:   (age) => age <= 35 ? '18-35' : '36-50',
    test:       'CMJ Avanzato',
    categories: ['athlete'],
    desc:       'Altezza salto verticale senza arm swing.',
    guide: {
      duration:  '15 minuti',
      equipment: [
        'Pedana di forza o app My Jump 2',
        'Superficie rigida',
      ],
      warmup: [
        'Jogging 5 minuti',
        'Squat 2×10 leggeri',
        'Squat jump progressivi 3×5 al 60, 80, 95%',
        'Riposo 2 minuti',
      ],
      protocol: [
        'Il soggetto si posiziona in piedi con mani sui fianchi (NO arm swing).',
        'Eseguire un rapido abbassamento fino a ~90° di flessione delle ginocchia, poi saltare verticalmente.',
        'Il sistema registra l\'altezza del salto in cm.',
        '5 prove con 60 secondi di recupero. Registrare il VALORE MIGLIORE.',
      ],
      notes: [
        'Le mani devono restare sui fianchi per tutta la durata del salto.',
        'Non è consentito un secondo countermovement: il movimento è continuo.',
        'Valori medi M 18-35: ~35-42cm. Elite M: >55cm. Medie F: ~25-32cm.',
      ],
    },
  },
]