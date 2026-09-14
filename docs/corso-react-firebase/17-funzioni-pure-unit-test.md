# Lezione 17 — Funzioni pure e unit test
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire cos'è una funzione pura leggendo `utils/gamification.js` riga per riga, e capire perché
questa proprietà rende il file testabile senza mock, senza Firebase, senza un browser — con
`npm run test:run` che gira in meno di un secondo. Al termine saprai leggere e scrivere test
Vitest per funzioni di dominio, e riconoscere quando una funzione "sembra pura" ma non lo è
del tutto.

## Concetti teorici

Una **funzione pura** rispetta due regole, entrambe verificabili leggendo il codice senza
eseguirlo:

1. **Stesso input → stesso output, sempre.** Non dipende da variabili globali, da `Date.now()`,
   da una chiamata di rete, da `Math.random()`. Se la chiami mille volte con gli stessi
   argomenti, ottieni mille volte lo stesso risultato.
2. **Nessun side effect.** Non scrive su `console`, non tocca il DOM, non fa una `fetch`, e
   soprattutto **non muta gli argomenti che riceve**. Riceve dati, restituisce dati nuovi.

Il contrario di una funzione pura è una funzione che dipende dal "mondo esterno" (l'ora di
sistema, lo stato di un database, un contatore globale) o che lo modifica. Queste funzioni
sono impure non perché "sbagliate", ma perché il loro comportamento non è prevedibile solo
guardando gli argomenti — devi anche sapere *quando* le chiami e *cosa c'è intorno*.

> ### 📎 Approfondimento: funzione pura
> Pensa a una **calcolatrice tascabile** contro una **cassa di un negozio**. La calcolatrice
> è pura: digiti `7 × 6`, ottieni `42`, sempre, indipendentemente da che ora è, da chi l'ha
> usata prima, da quanti calcoli hai fatto oggi. La cassa invece è impura: "aggiungi questo
> prodotto allo scontrino" dipende dallo scontrino già aperto (stato esterno mutabile), stampa
> qualcosa su carta (side effect), e registra la vendita nel database del negozio (altro side
> effect). Non è che la cassa sia "peggiore" — serve proprio a modificare il mondo. Ma se devi
> *testare* la logica "che sconto applico dato il totale e il tipo di cliente", vuoi isolarla
> in una funzione-calcolatrice pura, testabile in isolamento, e tenere la cassa (il side
> effect) il più sottile possibile intorno a essa. `utils/gamification.js` è la
> "calcolatrice" di RankEX: calcola XP, livello, rank. Il side effect (scrivere su Firestore)
> vive altrove, nel layer `usecases/`.

Perché questo conta in pratica, non solo in teoria:

- **Test senza mock.** Una funzione pura non ha bisogno di un finto Firestore, un finto
  `Date`, un finto Auth. Le passi un oggetto JavaScript, controlli l'oggetto che torna
  indietro. Vedremo tra poco che questo non è vero al 100% per `gamification.js` — e capire
  *perché* è altrettanto istruttivo.
- **Riuso sicuro lato client e lato server.** Nella mappa delle dipendenze del corso (vedi
  [00-indice.md](00-indice.md)) il calcolo XP avviene prima lato client per l'optimistic
  update, poi viene rifatto lato server (Cloud Function) come fonte di verità. Se la funzione
  fosse impura — se dipendesse per esempio da uno stato globale del componente React — non
  potresti eseguirla identica nei due ambienti.
- **Comprensione locale.** Per capire `calcSessionXP` non devi conoscere nient'altro del
  progetto: leggi la firma, leggi il corpo, hai finito. Prova a fare lo stesso con un hook che
  usa `useEffect` + Context + Firestore: devi tenere in testa molto più contesto.

> ### 📎 Approfondimento: unit test e Vitest
> Uno **unit test** verifica un'unità di codice isolata (qui: una funzione) confrontando
> l'output ottenuto con l'output atteso. **Vitest** è il test runner del progetto (si integra
> nativamente con Vite, stesso motore di build usato in dev). La sintassi base:
> ```js
> import { describe, it, expect } from 'vitest'
>
> describe('nome del gruppo di test', () => {   // raggruppa test correlati
>   it('descrizione di un caso specifico', () => {   // un singolo test
>     expect(sommaDue(2, 3)).toBe(5)                  // asserzione
>   })
> })
> ```
> `describe` è puramente organizzativo (appare nell'output come intestazione). `it` (alias di
> `test`) contiene un caso concreto — il nome deve descrivere il comportamento, non
> l'implementazione ("streak 5 → +50%", non "testa calcSessionXP"). `expect(x).toBe(y)`
> verifica uguaglianza stretta; altri matcher usati nel progetto: `.toHaveLength()`,
> `.toBeGreaterThan()`, `.toBeTypeOf()`, `.toBeNull()`, `.toEqual()` (per confronto profondo di
> oggetti/array, a differenza di `.toBe()` che confronta riferimenti). Analogia: `describe` è
> il titolo del capitolo, `it` è ogni singola domanda dell'interrogazione, `expect` è la
> risposta che l'insegnante confronta con quella corretta.

## Dove compare nel progetto

- [`src/utils/gamification.js`](../../src/utils/gamification.js) — il file oggetto di questa
  lezione: 308 righe, zero import da Firebase, zero `useState`/`useEffect`.
- [`src/__tests__/utils/gamification.test.js`](../../src/__tests__/utils/gamification.test.js) —
  la suite di test corrispondente, 298 righe.
- [`vitest.config.js`](../../vitest.config.js) — configurazione: `environment: 'node'` (non
  serve un browser/jsdom per testare funzioni pure), `include: ['src/__tests__/**/*.test.js']`.
- `package.json` — script `test` (`vitest`, watch mode) e `test:run` (`vitest run
  --passWithNoTests`, esecuzione singola, quella usata in CI).
- Chi *chiama* queste funzioni pure (per capire dove finisce il calcolo e comincia l'I/O):
  `hooks/useClients.js` e i file in `src/usecases/` — fuori dal perimetro di questa lezione,
  li vedi in dettaglio nella Lezione 13 e 14.

## Analisi del codice

### `calcSessionXP` — la funzione pura più semplice del file

```js
// src/utils/gamification.js righe 27-30
export function calcSessionXP(baseXP, streak = 0) {
  const multiplier = 1 + Math.min(streak * 0.1, 1.0) // max +100% a streak 10
  return Math.round(baseXP * multiplier)
}
```

Due argomenti primitivi, un numero in uscita, nessuna dipendenza esterna: è il caso da manuale
di funzione pura. `Math.min(streak * 0.1, 1.0)` è il "cap": a streak 10 il moltiplicatore
aggiuntivo è `10 × 0.1 = 1.0` (cioè +100%, XP raddoppiato), e per streak superiori a 10 il
`Math.min` blocca il moltiplicatore a 1.0 — coerente con quanto documentato in `CLAUDE.md`
("streak 10 = ×2.0"). Il test lo verifica esplicitamente:

```js
// src/__tests__/utils/gamification.test.js righe 39-45
it('streak 10 → cap ×2.0', () => {
  expect(calcSessionXP(100, 10)).toBe(200)
})

it('streak 20 → ancora cap ×2.0 (non supera il massimo)', () => {
  expect(calcSessionXP(100, 20)).toBe(200)
})
```

Nota come il secondo test non testa "il caso normale" ma il **caso limite** (streak molto
oltre il cap). È una buona pratica: i bug si nascondono ai bordi, non al centro del range.
`Math.round` all'ultima riga esiste perché `baseXP * multiplier` può produrre decimali (es.
`33 × 1.1 = 36.3`) e l'XP nel documento cliente deve essere un intero — verificato al rigo 47-50
del test file con `Number.isInteger(xp)`.

**Cosa succederebbe se rimuovessi `Math.round`?** Il campo `xp` su Firestore diventerebbe un
float (`36.3`), il che di per sé non romperebbe nulla tecnicamente (Firestore accetta float),
ma romperebbe l'assunzione implicita in tutta la UI che XP sia un intero visualizzabile — e
soprattutto il test al rigo 47-50 fallirebbe subito, dicendoti esattamente cosa hai rotto.

### `calcLevelProgression` — il dettaglio che dimostra la purezza

```js
// src/utils/gamification.js righe 88-96
function calcLevelProgression(xp, xpNext, level) {
  let cur = xp, next = xpNext, lvl = level
  while (cur >= next) {
    cur  -= next
    next  = Math.round(next * XP_PER_LEVEL_MULTIPLIER)
    lvl  += 1
  }
  return { xp: cur, xpNext: next, level: lvl }
}
```

Questo è il cuore della progressione di livello, e vale la pena leggerlo con attenzione perché
contiene una scelta di stile che **non è casuale**. La funzione riceve tre parametri
(`xp, xpNext, level`) e alla prima riga li **copia** in tre variabili locali (`cur, next,
lvl`) invece di riassegnare direttamente `xp = xp - next` dentro il loop. Perché non scrivere
semplicemente:

```js
// Versione alternativa — funzionerebbe comunque, ma è meno esplicita
function calcLevelProgression(xp, xpNext, level) {
  while (xp >= xpNext) {
    xp -= xpNext
    xpNext = Math.round(xpNext * XP_PER_LEVEL_MULTIPLIER)
    level += 1
  }
  return { xp, xpNext, level }
}
```

In JavaScript, riassegnare un parametro (`xp = xp - next`) **non muta l'oggetto/valore
originale che il chiamante possiede** — per i tipi primitivi come i numeri, il parametro è
già una copia locale. Quindi funzionalmente le due versioni sono equivalenti: nessuna delle
due "rompe" la purezza. La versione con `cur/next/lvl` che trovi nel file reale è però più
leggibile per un motivo preciso: separa visivamente "i parametri come sono arrivati" da "i
valori mentre li elaboro", il che aiuta soprattutto quando (come qui) i nomi dei parametri
(`xp`, `xpNext`, `level`) sono anche i nomi dei campi che poi finiscono nell'oggetto restituito
alla riga 95 — riusare `xp` come variabile di lavoro renderebbe più facile confondersi tra "il
valore iniziale" e "il valore finale" rileggendo il codice a distanza di mesi. È una
convenzione difensiva, non un requisito del linguaggio.

Il ciclo `while` fa "avanzare di livello finché l'XP è sufficiente": sottrae la soglia
corrente, ricalcola la prossima soglia moltiplicandola per `XP_PER_LEVEL_MULTIPLIER` (1.08,
da `constants/index.js` riga 98), incrementa il livello. Con XP molto alto (es. 10000 XP
aggiunti in un colpo, testato al rigo 85-88 del test file) il `while` gira più iterazioni di
fila — è così che `buildXPUpdate` può far salire un cliente di più livelli in un solo update.

**Alternative scartate.** Si potrebbe calcolare il livello con una formula chiusa (es.
logaritmo, dato che la progressione è geometrica), evitando il ciclo. Il progetto non lo fa
— probabilmente perché la soglia di ogni livello non è una progressione geometrica "pura" a
causa dell'arrotondamento (`Math.round`) a ogni passo, il che rende la formula chiusa
un'approssimazione soggetta a scostamenti cumulativi rispetto al ciclo iterativo, che invece
è per costruzione identico a "cosa succede davvero, passo dopo passo".

### `buildXPUpdate` — dal calcolo puro al "patch" per Firestore

```js
// src/utils/gamification.js righe 105-111
export function buildXPUpdate(client, xpToAdd, note) {
  const { xp, xpNext, level } = calcLevelProgression((client.xp ?? 0) + xpToAdd, client.xpNext ?? 500, client.level ?? 1)
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  const entry = { date: today, action: note || `+${xpToAdd} XP aggiunto dal trainer`, xp: xpToAdd, ts: Date.now() }
  const log   = [entry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)
  return { update: { xp, xpNext, level, log } }
}
```

Qui vediamo il pattern che si ripete identico in `buildCampionamentoUpdate` e
`buildBiaUpdate`: la funzione non scrive su Firestore, **costruisce l'oggetto che qualcun
altro scriverà**. Il valore di ritorno è `{ update: {...} }` — un oggetto "patch" pronto per
un `updateDoc`/callable. `client.xp ?? 0` e `client.xpNext ?? 500` sono difese contro un
cliente appena creato o con dati incompleti (l'operatore `??`, nullish coalescing, si attiva
solo su `null`/`undefined`, non su `0` — importante qui perché `xp: 0` è un valore legittimo
che non deve essere sostituito dal default).

`log = [entry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)`: nuova entry in testa
all'array (`[entry, ...vecchio]`, non `[...vecchio, entry]` — il log più recente per primo),
troncato a `LOG_MAX_ENTRIES` (20, da `constants/index.js` riga 97). Nota che `slice` **non
muta** l'array originale `client.log`: restituisce un array nuovo. Se qui ci fosse stato
`client.log.unshift(entry)` (che muta l'array in place) la funzione avrebbe smesso di essere
pura — avrebbe modificato l'oggetto `client` ricevuto in argomento, un side effect silenzioso
che il chiamante potrebbe non aspettarsi.

**Un dettaglio onesto da non ignorare.** `new Date()` e `Date.now()` leggono l'orologio di
sistema: a rigore, questo rende `buildXPUpdate` (e le altre funzioni `build*`) **non
perfettamente pure** — chiamarla due volte con lo stesso `client` in due istanti diversi
produce un `entry.date`/`entry.ts` diverso. È un input "nascosto", non dichiarato tra i
parametri. In pratica il progetto tratta queste funzioni come pure perché (a) l'orologio non
influenza mai la logica di business testata — XP, livello, rank sono deterministici rispetto
agli argomenti — e (b) i test infatti non asseriscono mai il valore esatto di `date`/`ts`, solo
che `ts` sia `typeof 'number'` e `> 0` (rigo 97-101 del test file). È una purezza "pratica",
non "da manuale" — un buon esercizio critico è chiedersi, leggendo qualsiasi funzione che
sembra pura, "da dove viene ogni valore che uso qui dentro?" prima di darla per scontata.

### `buildCampionamentoUpdate` — la logica di XP a tier

```js
// src/utils/gamification.js righe 138-158 (estratto)
export function buildCampionamentoUpdate(client, newStats, testValues) {
  const media   = calcStatMedia(newStats)
  const rankObj = getRankFromMedia(media)
  const today   = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

  const prevStats = client.campionamenti?.[0]?.stats

  let xpGain
  if (!prevStats) {
    xpGain = 50   // Prima misurazione in assoluto
  } else {
    const nImproved = Object.keys(newStats).filter(
      key => (newStats[key] ?? 0) > (prevStats[key] ?? 0)
    ).length

    if      (nImproved >= 4) xpGain = 100
    else if (nImproved >= 2) xpGain = 60
    else if (nImproved === 1) xpGain = 30
    else                      xpGain = 10
  }
  // ...
```

`client.campionamenti?.[0]?.stats` usa l'optional chaining per leggere "le stat del
campionamento più recente" (il più recente è in testa all'array, coerente col pattern
`[nuovo, ...vecchi]` visto sopra) senza esplodere se `campionamenti` è `undefined` o vuoto.
Se non c'è uno storico (`!prevStats`), è la prima misurazione: XP fisso a 50. Altrimenti conta
quante statistiche sono migliorate (`newStats[key] > prevStats[key]`) e applica una scala a
soglie — identica nella forma a quella usata da `calcBiaXP` in `utils/bia.js` (righe 95-114,
richiamata da `buildBiaUpdate` più sotto), il che è deliberato: `CLAUDE.md` la chiama "stesso
schema BIA per coerenza". Due sistemi di dominio diversi (test atletici vs. bioimpedenza)
condividono la stessa *forma* di curva di ricompensa (50 / 10 / 30 / 60 / 100), pur essendo
implementati come due funzioni pure separate e testate separatamente.

I test coprono ogni soglia esplicitamente:

```js
// src/__tests__/utils/gamification.test.js righe 140-148
it('60 XP se 2-3 stat migliorano', () => {
  const clienteConStorico = {
    ...clienteBase,
    campionamenti: [{ stats: { v: 40, f: 40, r: 40 } }],
  }
  const nuoviStats = { v: 60, f: 60, r: 30 } // 2 miglioramenti
  const { update } = buildCampionamentoUpdate(clienteConStorico, nuoviStats, {})
  expect(update.xp).toBe(60)
})
```

Questo è un buon esempio di "un test per ogni branch": ce ne sono quattro (righe 130-168),
uno per ciascuna soglia (`>=4`, `2-3`, `===1`, `0`). Se qualcuno in futuro cambiasse `>= 4` in
`>= 5` per errore, uno di questi quattro test fallirebbe immediatamente — è la rete di
sicurezza che permette di modificare `gamification.js` (segnalato come "file critico" in
`CLAUDE.md`, "importato da molti hook") senza terrore.

`labelForTestValueKey` (righe 119-128) merita una menzione: risolve la label leggibile di una
chiave in `testValues` cercandola prima tra gli `stat` dei test semplici, poi tra le `variables`
dei test compositi (es. Y Balance ha `ANT_dx`, non uno `stat` proprio). Il test verifica
entrambi i casi (righe 180-190) — inclusa l'asserzione negativa `.not.toContain('ANT_dx')`, che
conferma che il log mostra la label umana ("Anteriore DX") e non la chiave tecnica.

### `buildBiaUpdate`, `buildProfileUpgrade`, `buildNewClient` — stesso pattern, tre domini diversi

Le restanti funzioni (righe 204-308) seguono lo stesso stampo: leggono lo stato attuale del
cliente, calcolano un delta puro, restituiscono un `update` pronto per Firestore.
`buildBiaUpdate` (204-238) delega il calcolo XP a `calcBiaXP` importato da `utils/bia.js`
(riga 8) — altra funzione pura, altra suite di test dedicata, altro esempio di composizione
tra funzioni pure piccole. `buildProfileUpgrade` (244-271) è interessante perché **non ha
un valore di ritorno `{ update }`** come le altre — restituisce l'oggetto `update` direttamente
(confronta la firma con `buildXPUpdate`/`buildCampionamentoUpdate`/`buildBiaUpdate`, che
invece incapsulano in `{ update, ... }`): un'incoerenza minore tra funzioni "sorelle" dello
stesso file, il tipo di dettaglio che vale la pena notare leggendo codice reale invece che
esempi di manuale puliti ad arte.

`buildNewClient` (280-308) è la più complessa: branch su `profileType` (`hasTests =
profileType !== 'bia_only'`) per decidere se calcolare media/rank/XP iniziale o azzerarli. È
la funzione che dà forma al documento cliente completo alla creazione — la trovi richiamata
(fuori da questo file, quindi fuori perimetro di questa lezione) nel layer `usecases/` prima
della `httpsCallable` verso Cloud Functions.

## Diagramma mentale

```
INPUT (dati primitivi/oggetti plain)
        │
        ▼
┌───────────────────────────────┐
│   utils/gamification.js       │   ← funzioni PURE
│   (nessun import Firebase,    │      stesso input → stesso output
│    nessun useState/useEffect) │      non muta gli argomenti
└───────────────┬───────────────┘
        │ restituisce { update: {...} }
        ▼
OUTPUT (oggetto "patch" plain)
        │
        ▼           (fuori da questa lezione)
┌───────────────────────────────┐
│  hooks / usecases/*.js        │   ← qui avviene l'I/O:
│  → httpsCallable(...) verso   │      scrittura reale su Firestore,
│    Cloud Functions            │      gestione errori, optimistic UI
└───────────────────────────────┘

              │
              ▼ (parallelo, non sequenziale)
┌───────────────────────────────┐
│  __tests__/utils/              │   ← chiama le funzioni pure
│  gamification.test.js          │      DIRETTAMENTE, zero mock,
│  npm run test:run               │      zero Firebase, zero DOM
└───────────────────────────────┘
```

Il punto del diagramma: la freccia di test **bypassa completamente** il layer di I/O. Questo è
possibile solo perché `gamification.js` non lo tocca.

## Errori comuni

1. **Mutare `client.log` invece di crearne uno nuovo.** Se qualcuno "ottimizzasse" il codice
   scrivendo `client.log.unshift(entry)` invece di `[entry, ...client.log]`, la funzione
   smetterebbe di essere pura: l'oggetto `client` passato dal chiamante verrebbe modificato
   silenziosamente. In un pattern optimistic update (vedi Lezione 14) questo è particolarmente
   pericoloso: lo `snapshot` salvato per il rollback in caso di errore Firestore sarebbe
   *lo stesso oggetto* già mutato, rendendo il rollback inutile.

2. **Dimenticare `Math.round`.** Come visto per `calcSessionXP`, senza arrotondamento l'XP
   diventa float. Il test al rigo 47-50 di `gamification.test.js` esiste proprio per bloccare
   questa regressione — è un esempio di test che protegge un'assunzione implicita dell'intero
   sistema, non solo della funzione in sé.

3. **Confondere `??` con `||`.** `client.xp ?? 0` è corretto perché `0` è un valore XP
   legittimo. Se qualcuno riscrivesse `client.xp || 0`, un cliente con `xp: 0` (es. appena
   creato) verrebbe trattato come se `xp` non esistesse — nessun test attuale lo cattura
   esplicitamente, quindi è un errore che potrebbe scivolare in produzione se introdotto per
   disattenzione durante una modifica futura.

4. **Aspettarsi purezza assoluta e sorprendersi di `Date.now()`.** Come discusso sopra, queste
   funzioni leggono l'orologio di sistema. Se scrivessi un test che asserisce su un valore
   esatto di `entry.date` (invece che sul suo *tipo*, come fa la suite reale), il test
   diventerebbe fragile — passerebbe solo se eseguito lo stesso giorno in cui è stato scritto.

## Best Practice

**Perché centralizzare il calcolo qui invece che nei componenti/hook che lo usano?** Il file
`utils/gamification.js` è segnalato in `CLAUDE.md` come "file critico — importato da molti
hook". La logica di XP/livello/rank potrebbe in teoria vivere direttamente dentro l'hook che
gestisce la chiusura di una sessione o dentro il componente del wizard di creazione cliente.
Non lo fa, per un motivo concreto e verificabile nel codice: la stessa logica serve in punti
diversi e non collegati tra loro nell'albero dei componenti — creazione cliente
(`buildNewClient`), chiusura sessione (`buildSessionUpdate`), aggiunta XP manuale
(`buildXPUpdate`), campionamento (`buildCampionamentoUpdate`), BIA (`buildBiaUpdate`). Se la
logica di progressione livello (`calcLevelProgression`) fosse duplicata in ciascuno di questi
contesti, un cambio della curva (es. il passaggio storico da moltiplicatore 1.3 a 1.08
documentato in `CLAUDE.md`) richiederebbe modifiche sincronizzate in più file — con alto
rischio che uno resti disallineato. Centralizzarla in una funzione pura, importata ovunque
serva, elimina strutturalmente questo rischio: un solo posto da cambiare, un solo test da
aggiornare.

**Nota su una discrepanza con `CLAUDE.md`.** Il documento tecnico del progetto, nella sezione
"Import — fonte corretta", elenca `calcSessionConfig` come funzione esportata da
`utils/gamification.js`. Una ricerca nel codice sorgente reale (grep su tutto `src/`) non
trova nessuna definizione né nessun uso di `calcSessionConfig` in nessun file del progetto —
la funzione non esiste (più) nel codice attuale. È un promemoria pratico, in linea con lo
spirito di questo corso: la documentazione può disallinearsi dal codice nel tempo, e l'unica
fonte di verità definitiva resta il sorgente che leggi con i tuoi occhi (o con `grep`).

## Quiz

1. Quale delle seguenti NON è una condizione necessaria per una funzione pura?
   - A) Stesso input produce sempre stesso output
   - B) Non modifica gli argomenti ricevuti
   - C) Deve avere al massimo due parametri
   - D) Non ha side effect osservabili dall'esterno

2. In `calcLevelProgression`, perché il codice usa `let cur = xp, next = xpNext, lvl = level`
   invece di riassegnare direttamente `xp`, `xpNext`, `level`?
   - A) In JavaScript è obbligatorio, altrimenti va in errore
   - B) Per chiarezza — evita di confondere "valore iniziale" e "valore in elaborazione"; riassegnare i parametri sarebbe comunque sicuro perché sono primitivi
   - C) Perché altrimenti la funzione muterebbe l'oggetto `client` del chiamante
   - D) Per motivi di performance: le variabili `let` sono più veloci dei parametri

3. Cosa restituisce `calcSessionXP(100, 15)`?
   - A) 250
   - B) 150
   - C) 200
   - D) Errore, streak troppo alto

4. Perché `client.xp ?? 0` è preferibile a `client.xp || 0` in questo contesto?
   - A) `??` è più veloce da eseguire
   - B) `||` non esiste in JavaScript
   - C) `||` tratterebbe `xp: 0` (valore legittimo) come "assente", sostituendolo con il default
   - D) Non c'è differenza pratica tra i due

5. Nel test seguente, cosa verifica in ultima analisi l'asserzione `expect(update.log[0].ts).toBeGreaterThan(0)`?
   ```js
   const { update } = buildXPUpdate(clienteBase, 50)
   expect(update.log[0].ts).toBeTypeOf('number')
   expect(update.log[0].ts).toBeGreaterThan(0)
   ```
   - A) Che il timestamp sia un numero Unix valido (senza fissarne il valore esatto)
   - B) Che siano passati più di 0 millisecondi dall'inizio del test
   - C) Che il livello del cliente sia aumentato
   - D) Niente di rilevante, è un test ridondante

6. Perché `utils/gamification.js` è testabile con `environment: 'node'` in `vitest.config.js`,
   senza bisogno di `jsdom` (un DOM simulato)?
   - A) Perché Vitest non supporta jsdom
   - B) Perché il file non manipola mai il DOM: è logica pura, non UI
   - C) Perché i test sono troppo semplici per richiedere un DOM
   - D) È un errore di configurazione, dovrebbe usare jsdom

7. `buildCampionamentoUpdate` assegna 60 XP quando:
   - A) È il primo campionamento in assoluto
   - B) 0 statistiche sono migliorate rispetto al campionamento precedente
   - C) 2 o 3 statistiche sono migliorate rispetto al campionamento precedente
   - D) Tutte le statistiche sono migliorate

8. Cosa succederebbe se, in `buildXPUpdate`, si scrivesse `client.log.unshift(entry)` invece di
   `[entry, ...(client.log ?? [])]`?
   - A) Nessuna differenza osservabile
   - B) La funzione diventerebbe più veloce senza controindicazioni
   - C) L'oggetto `client.log` originale verrebbe mutato — un side effect che rompe la purezza della funzione
   - D) Il test esistente lo impedirebbe automaticamente a runtime

9. In quale file si trova la costante `XP_PER_LEVEL_MULTIPLIER` importata da
   `gamification.js`?
   - A) `utils/gamification.js` stesso
   - B) `config/plans.config.js`
   - C) `constants/index.js`
   - D) `utils/bia.js`

10. Perché i test di `gamification.test.js` non verificano mai il valore esatto del campo
    `date` (es. `"31 lug"`) generato dalle funzioni `build*`?
    - A) Perché `date` non viene mai popolato realmente
    - B) Perché dipende dall'orologio di sistema (`new Date()`) — un test che ne fissasse il valore esatto sarebbe fragile e legato al giorno di esecuzione
    - C) Perché è un bug noto e non testato di proposito
    - D) Perché Vitest non supporta asserzioni su stringhe di data

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **C.** Il numero di parametri non ha nulla a che vedere con la purezza — `calcSessionXP`
   ne ha due, `calcLevelProgression` ne ha tre, entrambe pure. A, B, D sono le tre proprietà
   reali discusse nei "Concetti teorici".

2. **B.** È una scelta di leggibilità/manutenibilità, non un requisito tecnico del linguaggio
   (i parametri primitivi sono già copie locali, quindi riassegnarli sarebbe comunque
   sicuro — opzione C è falsa proprio per questo). D è inventata: non c'è differenza di
   performance misurabile in questo contesto.

3. **C.** `Math.min(15 * 0.1, 1.0) = Math.min(1.5, 1.0) = 1.0` → moltiplicatore 2.0 →
   `100 × 2.0 = 200`. È esattamente il caso testato al rigo 43-45 del test file (con streak
   20, stesso risultato per lo stesso motivo).

4. **C.** `0 ?? 0` restituisce `0` (perché `??` scatta solo su `null`/`undefined`), mentre
   `0 || 0` restituirebbe comunque `0` per coincidenza in questo caso specifico — ma se il
   valore legittimo fosse, es., una stringa vuota o `false`, `||` lo tratterebbe erroneamente
   come assente. Il punto concettuale (che generalizza oltre questo singolo esempio numerico)
   è che `??` rispetta "zero è un valore", `||` no.

5. **A.** L'asserzione è intenzionalmente debole: verifica il *tipo* e che sia un timestamp
   plausibile, senza fissare il valore esatto — che dipenderebbe dal momento in cui il test
   viene eseguito. È una scelta di design del test coerente con la natura "quasi pura" (ma non
   perfettamente pura) della funzione, discussa nell'Analisi del codice.

6. **B.** `environment: 'node'` dice a Vitest di non caricare jsdom. Se `gamification.js`
   avesse letto/scritto sul DOM, i test sarebbero falliti (o avrebbero richiesto configurare
   jsdom) — il fatto che funzioni con `'node'` è una controprova indiretta della sua purezza
   rispetto al DOM.

7. **C.** Vedi la scala a soglie in `buildCampionamentoUpdate` (righe 154-157): `>=4 → 100`,
   `>=2 → 60`, `===1 → 30`, altrimenti `10`. A dà 50 XP (caso separato, "prima misurazione"),
   non 60.

8. **C.** `unshift` muta l'array esistente in place; lo spread `[entry, ...vecchio]` crea un
   array nuovo lasciando l'originale intatto. D è falsa: JavaScript non impedisce la mutazione
   a runtime, e i test attuali di questo file non la rileverebbero necessariamente (nessun
   test verifica esplicitamente che `client` in ingresso resti immutato).

9. **C.** `import { ..., XP_PER_LEVEL_MULTIPLIER, ... } from '../constants'` al rigo 3 di
   `gamification.js` — definita in `constants/index.js` rigo 98.

10. **B.** Come discusso nella sezione "Errori comuni" e nell'Analisi del codice: `new Date()`
    è un input nascosto legato al momento di esecuzione. Testare il valore esatto legherebbe
    il test al giorno in cui gira, rompendolo il giorno dopo (o in CI, dove l'ambiente potrebbe
    avere un fuso orario diverso).

## Esercizi

1. **Livello base.** Scrivi a mano (su carta o in un file scratch, senza eseguire nulla) cosa
   restituisce `calcSessionXP(80, 3)`. Poi verifica eseguendo `npm run test` in watch mode e
   aggiungendo temporaneamente un `it` con quel caso in `gamification.test.js`.

2. **Livello base.** Nel file `gamification.test.js`, individua il test "sale di livello se
   supera xpNext" (righe 77-83). Senza guardare il codice di `calcLevelProgression`, prova a
   calcolare a mano perché `update.xpNext` risulta `> 500` invece di rimanere `500`. Poi
   verifica leggendo il rigo 92 di `gamification.js`.

3. **Livello intermedio.** Aggiungi un nuovo test a `gamification.test.js` che verifichi il
   comportamento di `buildProfileUpgrade` quando il cliente è già `'complete'` e lo si "aggiorna"
   di nuovo a `'complete'` (caso non coperto dai tre test esistenti alle righe 223-248). Cosa
   ti aspetti che succeda, leggendo il codice alle righe 244-260? Il comportamento attuale ti
   sembra corretto per un cliente già in stato `'complete'`?

4. **Livello intermedio.** `buildSessionUpdate` (righe 39-77) non ha nessun test dedicato in
   `gamification.test.js` (la suite testa `calcSessionXP` e `calcStreakPreview` separatamente,
   ma non la funzione che li compone). Scrivi tu una `describe('buildSessionUpdate', ...)` con
   almeno 2 casi: un cliente senza streak precedente, e un cliente con `sessionStreak: 4`.

5. **Livello avanzato.** Individua, leggendo `buildCampionamentoUpdate` e `buildBiaUpdate`
   fianco a fianco, tutte le righe di codice che si ripetono quasi identiche tra le due
   funzioni (calcolo del log entry, chiamata a `calcLevelProgression`, troncamento a
   `LOG_MAX_ENTRIES`). Proponi (solo su carta, senza modificare il file — è nella lista "File
   critici" di `CLAUDE.md`) come estrarresti questa parte comune in un helper condiviso, e
   discuti un possibile svantaggio di farlo (indizio: guarda quanti punti diversi del file
   dovrebbero cambiare firma).

## Challenge

`buildProfileUpgrade` (righe 244-271) non aggiunge mai XP quando un cliente passa da
`tests_only`/`bia_only` a `complete` — il log entry alla riga 262-267 ha sempre `xp: 0`,
verificato esplicitamente dal test al rigo 243-247 (`expect(update.log[0].xp).toBe(0)`).

**Modifica reale (da fare davvero nel tuo ambiente locale, non solo su carta):**

1. Aggiungi una costante `PROFILE_UPGRADE_XP = 25` in cima a `gamification.js`.
2. Modifica `buildProfileUpgrade` perché assegni quell'XP bonus quando l'upgrade avviene
   (usa `calcLevelProgression` come fanno le altre funzioni `build*`, per gestire correttamente
   un eventuale level-up causato dal bonus).
3. Aggiorna il test esistente al rigo 243-247 (che oggi si aspetta `xp: 0`) e aggiungi un
   nuovo test che verifichi il nuovo comportamento con `xpNext` vicino alla soglia, per
   controllare anche il caso di level-up.
4. Esegui `npm run test:run` e verifica che l'intera suite passi, non solo i test che hai
   toccato — è il modo in cui una funzione pura ben testata ti protegge da regressioni
   silenziose in codice adiacente che non pensavi di aver toccato.

Non serve propagare la modifica a `usecases/`/Firestore per completare l'esercizio: l'obiettivo
è allenarti sulla funzione pura e sulla sua suite di test, il confine esatto di questa lezione.
