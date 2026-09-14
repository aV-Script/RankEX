# Lezione 18 — Algoritmi statistici di dominio: il calcolo dei percentili
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire come RankEX trasforma un valore grezzo di un test fisico (es. "38 kg" di forza) in un
percentile (es. "72° percentile") — non con una formula statistica chiusa, ma con una ricerca
per interpolazione su tabelle normative. Al termine saprai leggere `utils/percentile.js` e
`utils/tables.js` riga per riga, spiegare perché esiste il parametro `testKey`, e valutare
criticamente una scelta di prodotto (il "clamping" dell'età) confrontandola col codice reale.

## Concetti teorici

Un **percentile** in questo dominio risponde alla domanda: *"rispetto a una popolazione di
riferimento con lo stesso sesso e la stessa fascia d'età, quanto è buono questo valore?"*. Un
percentile 72 in forza significa "hai fatto meglio del 72% delle persone di riferimento nella
tua fascia". Non è una media, non è uno z-score gaussiano calcolato al volo — è il risultato
di un **lookup su tabella**: qualcuno (fisiologi, studi scientifici, o stime interne calibrate
su dati reali) ha già misurato una popolazione e pubblicato, per ogni fascia d'età e sesso,
quali valori grezzi corrispondono a quali percentili. Il codice non "inventa" statistica: cerca
nella tabella giusta e, se il valore cade tra due punti noti, interpola linearmente.

> ### 📎 Approfondimento: algoritmo di lookup su tabella
> Immagina una tabella di conversione taglie scarpe EU→US appesa in un negozio: 40→7, 41→8,
> 42→9. Se ti serve la taglia US per un piede europeo 41.5 (che non è in tabella), non
> reinventi la conversione da zero: **interpoli** tra 41→8 e 42→9, stimando ~8.5. Un
> algoritmo di lookup su tabella fa esattamente questo in codice: (1) trova la "riga" giusta
> della tabella (qui: la fascia d'età/sesso corretta), (2) trova i due punti noti più vicini al
> valore che hai in mano, (3) interpola linearmente tra i due. È un approccio molto usato in
   dominii dove i dati "veri" vengono da misurazioni empiriche pubblicate (fisiologia dello
> sport, in questo caso) piuttosto che da una legge matematica chiusa — non esiste una
> "formula del percentile della forza a 34 anni", esiste solo un campione misurato e
> tabulato.

Perché non usare invece una formula chiusa (es. basata su media e deviazione standard di una
distribuzione normale)? Perché le tabelle di riferimento usate nel progetto (vedi i commenti
in `utils/tables.js`, es. "Zwicker et al. 2020", "Thomas et al. 2020", "Nikolaidis et al.
2016") sono spesso pubblicate *già* come percentili discreti (P5, P10, P25...) da studi
scientifici — replicarle con una formula chiusa richiederebbe assumere una forma di
distribuzione (normale? asimmetrica?) che i dati potrebbero non rispettare esattamente. Il
lookup su tabella evita questa assunzione: usa i dati esattamente come pubblicati.

## Dove compare nel progetto

- [`src/utils/percentile.js`](../../src/utils/percentile.js) — `calcPercentileEx`,
  `calcPercentile` (wrapper), `calcStatMedia`, `percentileColor`.
- [`src/utils/tables.js`](../../src/utils/tables.js) — `TABLES` (i dati grezzi, 467 righe),
  `getAgeGroup`, `getAgeGroupClamped`.
- [`src/constants/tests.js`](../../src/constants/tests.js) — ogni test definisce la propria
  funzione `ageGroup(age)` e il proprio `direction` (`'direct'`/`'inverse'`), consumati da
  `tables.js`/`percentile.js`.
- [`src/__tests__/utils/percentile.test.js`](../../src/__tests__/utils/percentile.test.js) —
  suite di test.
- Chi chiama `calcPercentileEx` nella UI reale:
  [`src/components/modals/new-client-wizard/useWizard.js`](../../src/components/modals/new-client-wizard/useWizard.js)
  (righe 56 e 64) e
  [`src/components/modals/campionamento-modal/useCampionamento.js`](../../src/components/modals/campionamento-modal/useCampionamento.js)
  (riga 29).

## Analisi del codice

### `calcPercentileEx` — la funzione principale

```js
// src/utils/percentile.js righe 11-24
export function calcPercentileEx(stat, value, sex, age, testKey) {
  const testEntry = testKey
    ? ALL_TESTS.find(t => t.key === testKey)
    : ALL_TESTS.find(t => t.stat === stat)
  if (!testEntry) return { value: null, outOfRange: false }

  const table = TABLES[testEntry.key]
  if (!table || !table[sex]) return { value: null, outOfRange: false }

  const { group: ageGroup, outOfRange } = getAgeGroupClamped(testEntry.key, age, sex)
  if (!ageGroup) return { value: null, outOfRange: false }

  const percentiles = table[sex][ageGroup]
  if (!percentiles) return { value: null, outOfRange: false }
  // ...
```

Quattro passaggi in sequenza, ognuno con un "early return" difensivo se manca qualcosa —
pattern tipico di codice che deve essere robusto verso dati incompleti (un test nuovo aggiunto
in `constants/tests.js` ma non ancora in `tables.js`, per esempio, non deve far esplodere
l'app, deve restituire "non disponibile"):

1. **Risolvi quale test stiamo misurando** (`testEntry`). Se c'è `testKey`, cerca per chiave
   esatta; altrimenti (fallback) cerca per `stat`. Torneremo su questo tra poco — è il cuore
   del problema di disambiguazione.
2. **Trova la tabella per quel test** (`TABLES[testEntry.key]`) e verifica che esista una
   sotto-tabella per il sesso richiesto (`table[sex]`).
3. **Risolvi la fascia d'età** tramite `getAgeGroupClamped` (funzione di `tables.js`, la
   vediamo tra poco) — qui arrivano sia la fascia (`ageGroup`) sia il flag `outOfRange`.
4. **Estrai i percentili per quella fascia** (`table[sex][ageGroup]`), un oggetto tipo
   `{ 0: 31, 5: 34, 10: 37, ..., 100: 68 }` (percentile → valore grezzo).

```js
// src/utils/percentile.js righe 26-46
const direction = testEntry.direction ?? 'direct'

const sorted = Object.entries(percentiles)
  .map(([p, v]) => [parseFloat(p), parseFloat(v)])
  .sort((a, b) => direction === 'direct' ? a[1] - b[1] : b[1] - a[1])

let result

if (direction === 'direct') {
  if (value <= sorted[0][1])                 result = sorted[0][0]
  else if (value >= sorted[sorted.length - 1][1]) result = sorted[sorted.length - 1][0]
  else {
    for (let i = 0; i < sorted.length - 1; i++) {
      const [p1, v1] = sorted[i]
      const [p2, v2] = sorted[i + 1]
      if (value >= v1 && value <= v2) {
        result = Math.round(p1 + (value - v1) / (v2 - v1) * (p2 - p1))
        break
      }
    }
  }
} else {
  // ... branch speculare per 'inverse'
}
```

`direction` distingue due famiglie di test: **diretti** (valore più alto = meglio, es. `cm`
di un salto, `kg` di forza) e **inversi** (valore più basso = meglio, es. secondi in uno
sprint, battiti al minuto di recupero). `sorted` trasforma l'oggetto `percentiles` in un array
di coppie `[percentile, valore]` ordinato **per valore grezzo crescente se `direct`,
decrescente se `inverse`** — la riga chiave è `.sort((a, b) => direction === 'direct' ? a[1] -
b[1] : b[1] - a[1])`. Il motivo di questa doppia direzione di ordinamento: in entrambi i casi,
dopo l'ordinamento, **scorrere l'array in avanti significa sempre "andare verso il percentile
più alto"** — che per un test diretto vuol dire valori grezzi crescenti (più cm = meglio), per
un test inverso vuol dire valori grezzi decrescenti (meno secondi = meglio). Questo permette
al resto della funzione di trattare i due casi con la stessa struttura logica, solo con le
condizioni dei confronti invertite (`<=`/`>=` diventano `>=`/`<=`).

I tre casi gestiti nel branch `direct` (lo stesso schema si ripete speculare in `inverse`):

- **Sotto il minimo tabulato** (`value <= sorted[0][1]`): il valore è pari o peggiore del
  peggior dato in tabella → percentile più basso disponibile (`sorted[0][0]`, tipicamente 0).
- **Sopra il massimo tabulato** (`value >= sorted[ultimo][1]`): valore pari o migliore del
  migliore in tabella → percentile più alto (tipicamente 100).
- **Nel mezzo**: cerca la coppia di punti consecutivi `[p1,v1]`/`[p2,v2]` che "racchiude" il
  valore, e **interpola linearmente**: `p1 + (value - v1) / (v2 - v1) * (p2 - p1)`. È la
  stessa matematica della conversione taglie scarpe dell'approfondimento sopra — la
  proporzione tra "quanto sei dentro l'intervallo di valore" si applica identica
  all'intervallo di percentile, poi `Math.round` arrotonda a un intero leggibile.

**Cosa succederebbe se togliessi l'ordinamento (`sort`)?** Il ciclo `for` che cerca la coppia
`v1 <= value <= v2` presuppone che l'array sia ordinato in una direzione coerente — su un
oggetto JS le chiavi numeriche vengono già iterate in ordine numerico crescente da
`Object.entries`, quindi per i test `direct` l'array sarebbe *quasi* già ordinato correttamente
anche senza il `.sort()` esplicito; ma per i test `inverse` l'ordine andrebbe invertito, e
senza il `.sort()` esplicito la ricerca del bracket fallirebbe silenziosamente (nessuna
condizione `value <= v1 && value >= v2` risulterebbe mai vera), lasciando `result` a
`undefined`. È un buon esempio di codice dove l'ordinamento non è un dettaglio stilistico ma
una precondizione logica del passo successivo.

```js
// src/utils/percentile.js riga 62
return { value: result ?? 0, outOfRange }
```

Un dettaglio silenzioso ma importante: se per qualche motivo `result` restasse `undefined`
(bug futuro, tabella malformata), la funzione non lo propaga — lo trasforma in `0` col `??`.
È una scelta difensiva (mai restituire `undefined` da qui, sempre un numero), ma ha un
costo: un bug nel calcolo diventerebbe silenziosamente "percentile 0" invece di un errore
visibile. Vale la pena tenerlo a mente se un giorno un test mostrasse percentili sempre a 0 in
modo sospetto — è uno dei posti dove guardare.

### `getAgeGroupClamped` — la scelta di prodotto più interessante del file

```js
// src/utils/tables.js righe 431-437
export function getAgeGroup(testKey, age) {
  const test = ALL_TESTS.find(t => t.key === testKey)
  if (!test?.ageGroup) {
    return age <= 35 ? '18-35' : age <= 45 ? '36-45' : age <= 55 ? '46-55' : age <= 65 ? '56-65' : '66+'
  }
  return test.ageGroup(age)
}
```

`getAgeGroup` delega la logica "quale fascia d'età corrisponde a questa età" alla funzione
`ageGroup` definita **dentro ciascun test** in `constants/tests.js` (non in `tables.js`) — è
lì che vive la vera fonte di verità per-test. Ne vedi la varietà leggendo `tests.js`: per
`dinamometro_hand_grip` (riga 30) è `age => age <= 35 ? '18-35' : ... : '66+'` (5 fasce
adulte); per `y_balance` (riga 214) è più articolata e **può restituire `null`**
esplicitamente per età sotto i 10 anni (`age < 10 ? null : ...`); per `single_leg_stance`
(riga 551) è addirittura costante, `() => '7-9'` (un solo test per un'unica fascia, i
Pulcini). Il fallback (righe 434 — usato solo se un test non definisce `ageGroup` affatto)
non risulta usato da nessun test reale del file: tutti i test in `tests.js` definiscono
esplicitamente il proprio `ageGroup`.

```js
// src/utils/tables.js righe 446-468 (la funzione; il commento JSDoc che la precede è alle righe 439-445)
export function getAgeGroupClamped(testKey, age, sex = 'M') {
  const exact = getAgeGroup(testKey, age)
  if (exact !== null) return { group: exact, outOfRange: false }

  const tableForSex = TABLES[testKey]?.[sex] ?? TABLES[testKey]?.M
  if (!tableForSex) return { group: null, outOfRange: false }

  const groups = Object.keys(tableForSex)
  if (groups.length === 0) return { group: null, outOfRange: false }

  const parsed = groups
    .map(g => ({ g, lo: parseFloat(g) }))
    .filter(x => !isNaN(x.lo))
    .sort((a, b) => a.lo - b.lo)

  if (parsed.length === 0) return { group: null, outOfRange: false }

  return age < parsed[0].lo
    ? { group: parsed[0].g,                    outOfRange: true }
    : { group: parsed[parsed.length - 1].g,    outOfRange: true }
}
```

Questa è la funzione che il commento sopra a `calcPercentileEx` (nel file sorgente) descrive
come "usata per garantire sempre un risultato stimato" (riga 442 di `tables.js`). Il
comportamento:

- **Caso normale**: `getAgeGroup` trova una fascia esatta (`exact !== null`) → ritorna quella
  fascia con `outOfRange: false`. Fine, nessuna sorpresa.
- **Caso limite (età fuori da ogni fascia definita)**: `getAgeGroup` ha restituito `null` (es.
  un bambino di 5 anni per `y_balance`, che parte da 10). Qui la funzione **non si arrende**:
  guarda le chiavi effettivamente presenti nella tabella (`Object.keys(tableForSex)`, es.
  `['10-11', '12-13', '14-15', '16-17', '18-40', '41-60']`), le converte in un numero
  "limite inferiore" con `parseFloat(g)` — un trucco che funziona perché `parseFloat('10-11')`
  restituisce `10` (si ferma al primo carattere non numerico) e `parseFloat('66+')`
  restituisce `66` — e sceglie la fascia con il `lo` più vicino: la prima se l'età è sotto
  tutte le fasce, l'ultima se l'età è sopra tutte le fasce. In entrambi i casi, `outOfRange:
  true`.

**Perché questa è una scelta di prodotto deliberata, non solo un dettaglio tecnico.**
L'alternativa ovvia sarebbe restituire semplicemente `null` per un'età fuori norma, e far sì
che `calcPercentileEx` propaghi `{ value: null }` — "non abbiamo dati, non mostriamo nulla".
Il progetto sceglie invece di **stimare comunque un percentile plausibile usando la fascia
più vicina disponibile**, accompagnandolo con un segnale esplicito (`outOfRange: true`) che la
UI trasforma in un banner ambra di avviso (in `TestInput`, secondo `CLAUDE.md`). Il
ragionamento di prodotto: per un trainer che sta testando un atleta di 9 anni con un test
pensato per 10-13enni, "nessun dato" è meno utile di "ecco una stima approssimata, sappi che
è approssimata" — soprattutto in un dominio, quello delle fasce giovanili di RankEX
(`soccer_youth`/`soccer_junior`), dove le norme scientifiche pubblicate a volte semplicemente
non esistono per quell'età specifica (vedi i commenti in `tables.js`, es. riga 105: "Nessun
dato validato < 10 anni"). Il compromesso esplicito è: **mai bloccare il flusso di
campionamento per mancanza di dati normativi, ma segnalare sempre quando la stima è
approssimata**.

I test verificano esattamente questo contratto:

```js
// src/__tests__/utils/percentile.test.js righe 59-72
it('outOfRange = true quando età è fuori fascia normativa', () => {
  // beep_test ha range 8-50; un atleta di 5 anni è fuori fascia
  const r = calcPercentileEx('resistenza', 8, 'M', 5, 'beep_test')
  if (r.value !== null) {
    expect(r.outOfRange).toBe(true)
  }
})

it('outOfRange = false quando età è nella fascia normativa', () => {
  const r = calcPercentileEx('resistenza', 10, 'M', 20, 'beep_test')
  if (r.value !== null) {
    expect(r.outOfRange).toBe(false)
  }
})
```

### Il parametro `testKey` — perché serve a disambiguare

Il quinto parametro di `calcPercentileEx`, `testKey`, esiste per un motivo molto concreto:
**più test diversi possono condividere lo stesso `stat`**. Cercando `stat: 'resistenza'` in
`constants/tests.js` se ne trovano **cinque**, non due: `ymca_step_test` (riga 61),
`yo_yo_ir1` (riga 418), `shuttle_run_30m` (riga 581), `six_minute_run` (riga 731), `beep_test`
(riga 768). `CLAUDE.md` cita l'esempio di `ymca_step_test` e `yo_yo_ir1` come illustrazione —
corretto nella sostanza, ma la realtà nel codice è ancora più ampia (5 test, non 2), il che
rende il problema di disambiguazione ancora più concreto di quanto un solo esempio suggerisca.

Perché è un problema reale: guarda di nuovo la riga 12-14 di `percentile.js`:

```js
const testEntry = testKey
  ? ALL_TESTS.find(t => t.key === testKey)
  : ALL_TESTS.find(t => t.stat === stat)
```

Se chiami `calcPercentileEx('resistenza', 8, 'M', 12, undefined)` **senza `testKey`**,
`ALL_TESTS.find(t => t.stat === 'resistenza')` restituisce il **primo** test dell'array con
quello `stat` — che, nell'ordine in cui sono scritti in `tests.js`, è `ymca_step_test` (righe
59-93, il primo blocco del file), non `yo_yo_ir1` né tantomeno `beep_test` (quello
probabilmente inteso, dato il contesto). `ymca_step_test` ha `direction: 'inverse'` (bpm, meno
è meglio) e una tabella con fasce adulte (`18-35`, `36-45`, `46+`); passargli un valore di
`beep_test` (livello del Multi-Stage Fitness Test, `direction: 'direct'`, fasce giovanili tipo
`'12-13'`) produrrebbe un percentile calcolato sulla tabella sbagliata, con direzione
sbagliata — un numero che sembra plausibile (è pur sempre tra 0 e 100) ma è **semanticamente
privo di senso**. Ecco perché in tutto il codice reale la chiamata passa sempre `test.key`
come quinto argomento, sia in `useWizard.js` (righe 56 e 64) sia in `useCampionamento.js`
(riga 29): l'ambiguità viene risolta a monte, non lasciata al caso dell'ordine di dichiarazione
in un array.

### `calcPercentile` — il wrapper, e una discrepanza degna di nota

```js
// src/utils/percentile.js righe 71-73
export function calcPercentile(stat, value, sex, age, testKey) {
  return calcPercentileEx(stat, value, sex, age, testKey).value
}
```

`CLAUDE.md` descrive `calcPercentile` come il wrapper "da usare dove il flag `outOfRange` non
serve", citando `useWizard.js` come esempio d'uso. Verificando col codice reale (grep su tutto
`src/` per `calcPercentile\b`), questo non risulta più vero allo stato attuale: **nessun file
di produzione chiama `calcPercentile`** — solo `percentile.test.js` lo importa e lo esercita
(righe 85-97). Sia `useWizard.js` (righe 56, 64) sia `useCampionamento.js` (riga 29) chiamano
`calcPercentileEx` direttamente, non `calcPercentile`. In `useWizard.js`, dove serve solo il
numero e non il flag `outOfRange`, il codice non usa il wrapper dedicato ma accede a
`.value` sul risultato di `calcPercentileEx`:

```js
// src/components/modals/new-client-wizard/useWizard.js riga 56
return calcPercentileEx(currentTest.stat, finalValue, anagrafica.sesso, calcAge(anagrafica.dataNascita), currentTest.key).value
```

In altre parole: la funzione `calcPercentile` esiste, è testata, è corretta — ma nel codice
attuale è effettivamente **codice morto in produzione**, mantenuto vivo solo dalla propria
suite di test. È un altro esempio, in linea con quanto visto nella Lezione 17 a proposito di
`calcSessionConfig`, di quanto sia importante verificare col `grep` invece di fidarsi
ciecamente della documentazione quando si valuta se un pezzo di codice è ancora "in uso".

### `calcStatMedia` — la media che alimenta il rank

```js
// src/utils/percentile.js righe 75-79
export function calcStatMedia(stats = {}) {
  const vals = Object.values(stats).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length === 0) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}
```

Funzione pura semplice (stesso tipo di quelle analizzate nella Lezione 17): media aritmetica
dei percentili di uno stesso cliente, arrotondata. Il filtro `typeof v === 'number' &&
!isNaN(v)` è una difesa contro valori mancanti/malformati in `stats` (es. un test non ancora
misurato). Questa media è il valore che, passato a `getRankFromMedia` (vista nella Lezione
17, in `constants/index.js`), determina il rank del cliente — un altro filo che collega
`percentile.js` a `gamification.js` senza che i due file si conoscano direttamente: la
composizione avviene nel chiamante (`buildCampionamentoUpdate`, `buildNewClient`), non dentro
`percentile.js` stesso. È un esempio pulito di funzioni pure piccole, componibili da chi le
chiama, senza dipendenze incrociate tra i due file.

## Diagramma mentale

```
valore grezzo (es. 42 kg)
sesso, età, testKey
        │
        ▼
┌─────────────────────────────┐
│ 1. Risolvi il test          │  testKey ? find(key===testKey)
│    (ALL_TESTS)               │            : find(stat===stat)  ← rischio ambiguità!
└──────────────┬───────────────┘
        ▼
┌─────────────────────────────┐
│ 2. Trova la tabella          │  TABLES[test.key][sesso]
│    (tables.js)                │
└──────────────┬───────────────┘
        ▼
┌─────────────────────────────┐
│ 3. Risolvi la fascia d'età   │  getAgeGroupClamped
│    esatta o "più vicina"     │  → { group, outOfRange }
└──────────────┬───────────────┘
        ▼
┌─────────────────────────────┐
│ 4. Interpola tra i due punti │  direction 'direct'/'inverse'
│    noti più vicini            │  → { value: 0-100, outOfRange }
└─────────────────────────────┘
```

## Errori comuni

1. **Omettere `testKey` quando due test condividono `stat`.** Come visto sopra con
   `resistenza` (5 test diversi), il fallback su `stat` prende il primo match nell'ordine
   dell'array `TESTS` — un ordine che dipende solo da come il file è scritto, non da alcuna
   logica di dominio. `CLAUDE.md` lo segnala esplicitamente come regola d'uso vincolante.

2. **Fidarsi ciecamente che un valore percentile "0" sia un dato reale.** Come notato
   nell'analisi di `calcPercentileEx`, `result ?? 0` nasconde silenziosamente un eventuale
   bug di calcolo dietro un percentile 0 plausibile ma falso.

3. **Dimenticare che `outOfRange: true` non è un errore, è un'informazione.** Un cliente di 8
   anni testato con `beep_test` (min 8 anni secondo l'`ageGroup`) restituirà comunque un
   percentile stimato con `outOfRange: false` se rientra nella fascia più bassa definita — ma
   un bambino di 6 anni sullo stesso test darebbe `outOfRange: true`. Va sempre mostrato
   all'utente, mai silenziato, altrimenti si perde il segnale di attendibilità dei dati.

4. **Assumere che `calcPercentile` sia ancora la via "raccomandata".** Come visto, la
   documentazione del progetto lo presenta come il wrapper da preferire in certi contesti, ma
   il codice reale è migrato a usare `calcPercentileEx(...).value` direttamente ovunque.
   Prima di scegliere quale funzione chiamare in un nuovo componente, conviene verificare con
   `grep` cosa fanno *davvero* gli altri chiamanti recenti, non solo cosa dice la doc.

## Best Practice

**Perché centralizzare l'algoritmo in `calcPercentileEx` invece di calcolarlo dove serve?**
Il calcolo compare in due punti UI molto diversi tra loro — il wizard di creazione cliente
(`useWizard.js`) e il modale di campionamento (`useCampionamento.js`) — entrambi devono
mostrare un percentile "live" mentre il trainer digita valori nei campi. Se la logica di
interpolazione fosse duplicata in entrambi gli hook, un bug o un affinamento dell'algoritmo
richiederebbe modifiche sincronizzate in due file diversi, con rischio di disallineamento
esattamente come discusso per `gamification.js` nella Lezione 17. `utils/percentile.js` è
segnalato in `CLAUDE.md` come file critico proprio per questo: "usare `calcPercentileEx` per
ottenere `ageWarnings`; passare sempre `testKey` come 5° argomento" — una regola d'uso che ha
senso solo se la funzione è davvero l'unico punto di ingresso al calcolo.

**Il compromesso di `getAgeGroupClamped` è onesto, ma non gratuito.** Stimare sempre un
percentile, anche fuori dalla fascia normativa validata, migliora l'esperienza del trainer
(mai un "dato mancante" bloccante) ma introduce un rischio reale: se il segnale
`outOfRange`/banner ambra venisse ignorato o rimosso in un refactoring UI futuro, il sistema
mostrerebbe silenziosamente stime clinicamente poco affidabili come se fossero normative
validate. La combinazione "stima sempre disponibile + segnale visivo sempre presente" è
un equilibrio deliberato, non un default innocuo — vale la pena ricordarlo se mai si
toccasse `TestInput` o il codice che consuma `ageWarnings`.

## Quiz

1. Cosa restituisce `calcPercentileEx` quando il test esiste ma manca la tabella per il sesso
   richiesto?
   - A) Lancia un'eccezione
   - B) `{ value: null, outOfRange: false }`
   - C) `{ value: 0, outOfRange: true }`
   - D) Restituisce la tabella dell'altro sesso come fallback automatico

2. Perché `sorted` viene ordinato in modo diverso per `direction: 'direct'` rispetto a
   `direction: 'inverse'`?
   - A) È un bug, dovrebbe essere sempre lo stesso ordinamento
   - B) Per garantire che scorrere l'array in avanti significhi sempre "percentile crescente", indipendentemente dal fatto che il valore grezzo migliore sia il più alto o il più basso
   - C) Per motivi di performance nel ciclo `for`
   - D) Perché `Object.entries` restituisce ordini diversi a seconda del `direction`

3. Un test misura l'età di un atleta di 6 anni su `beep_test`, il cui `ageGroup` parte da 8
   anni (`age < 8 ? null : ...`). Cosa restituisce `getAgeGroupClamped`?
   - A) `{ group: null, outOfRange: false }` — nessun dato disponibile
   - B) La fascia più bassa disponibile (`'8-9'`) con `outOfRange: true`
   - C) Lancia un errore perché l'età è troppo bassa
   - D) La fascia più alta disponibile con `outOfRange: true`

4. Quanti test in `constants/tests.js` condividono `stat: 'resistenza'`?
   - A) 2 (`ymca_step_test` e `yo_yo_ir1`, come in CLAUDE.md)
   - B) 3
   - C) 5 (`ymca_step_test`, `yo_yo_ir1`, `shuttle_run_30m`, `six_minute_run`, `beep_test`)
   - D) Nessuno, ogni test ha uno `stat` univoco

5. Cosa succede se chiami `calcPercentileEx('resistenza', 8, 'M', 12, undefined)` senza
   passare `testKey`?
   - A) Viene lanciata un'eccezione perché `stat` da solo non basta
   - B) Il sistema calcola la media dei risultati di tutti i test con quello `stat`
   - C) Trova il primo test nell'array `TESTS` con `stat === 'resistenza'` (`ymca_step_test`), possibilmente sbagliato rispetto all'intento
   - D) Restituisce sempre `null`

6. In `useWizard.js`, come viene ottenuto il valore percentile "live" mostrato nel wizard?
   - A) Chiamando `calcPercentile(...)`, il wrapper dedicato
   - B) Chiamando `calcPercentileEx(...).value` direttamente
   - C) Con una chiamata a Firestore in tempo reale
   - D) Con un calcolo statistico separato, non tramite `percentile.js`

7. Perché `getAgeGroupClamped` usa `parseFloat(g)` sulle chiavi delle fasce (es. `'10-11'`,
   `'66+'`) per trovare la fascia più vicina?
   - A) `parseFloat` converte automaticamente stringhe in intervalli numerici completi
   - B) `parseFloat` si ferma al primo carattere non numerico, quindi estrae il limite inferiore della fascia in modo semplice sia per range (`'10-11'` → 10) sia per fasce aperte (`'66+'` → 66)
   - C) È necessario per calcolare la media della fascia
   - D) Serve solo per l'ordinamento alfabetico delle chiavi

8. Cosa fa concretamente `result ?? 0` all'ultima riga di `calcPercentileEx`?
   - A) Arrotonda sempre il risultato a un multiplo di 5
   - B) Se per qualche motivo `result` non è stato assegnato (`undefined`), lo sostituisce con `0` invece di propagare `undefined`
   - C) Applica un bonus di 0 punti quando l'età è fuori fascia
   - D) Non ha alcun effetto pratico, è codice ridondante

9. Cosa rappresenta il flag `outOfRange: true` per il trainer che vede il risultato in UI?
   - A) Un errore critico che blocca il salvataggio del campionamento
   - B) Un avviso: il percentile mostrato è una stima basata sulla fascia normativa più vicina, non sulla fascia esatta dell'atleta
   - C) Che il valore inserito è fuori dal range fisicamente plausibile
   - D) Che il test non è supportato per quella categoria

10. Qual è, secondo la verifica diretta nel codice sorgente (non nella documentazione), lo
    stato reale della funzione `calcPercentile` (il wrapper)?
    - A) È la funzione più usata di tutto `percentile.js`
    - B) È usata solo in `useCampionamento.js`
    - C) Non è chiamata da nessun file di produzione — solo dalla propria suite di test
    - D) È stata rimossa dal codice

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** Righe 17-18 di `percentile.js`: `if (!table || !table[sex]) return { value: null,
   outOfRange: false }`. Nessun fallback automatico sull'altro sesso (D è inventata), nessuna
   eccezione (A è falsa).

2. **B.** È il punto discusso nell'Analisi del codice: l'ordinamento garantisce che l'intera
   logica successiva (ricerca del bracket, interpolazione) possa essere scritta con la stessa
   struttura per entrambe le direzioni, solo con confronti invertiti.

3. **B.** `getAgeGroup` restituisce `null` per età < 8 su `beep_test` (verificato in
   `tests.js` riga 772: `age < 8 ? null : ...`); `getAgeGroupClamped` allora cerca la fascia
   più vicina — essendo l'età sotto tutte le fasce disponibili, sceglie la più bassa (`'8-9'`)
   con `outOfRange: true`, esattamente come testato al rigo 59-65 di `percentile.test.js` (con
   `beep_test` e un'età di 5 anni, risultato analogo).

4. **C.** Verificato via `grep` diretto sul file: righe 61, 418, 581, 731, 768 di
   `tests.js`. L'esempio di CLAUDE.md (A) è corretto ma incompleto — cita solo 2 dei 5 casi
   reali.

5. **C.** Righe 12-14 di `percentile.js`: senza `testKey`, il fallback usa
   `ALL_TESTS.find(t => t.stat === stat)`, che restituisce il primo match nell'ordine
   dell'array — `ymca_step_test`, non necessariamente il test che si intendeva misurare.

6. **B.** Riga 56 di `useWizard.js`: `calcPercentileEx(...).value` — non passa attraverso il
   wrapper `calcPercentile`, contrariamente a quanto suggerito da `CLAUDE.md`.

7. **B.** `parseFloat('10-11')` interrompe il parsing al primo carattere non numerico (`-`)
   restituendo `10`; `parseFloat('66+')` si ferma al `+` restituendo `66`. Funziona sia per
   range che per fasce aperte senza bisogno di parsing dedicato per ciascun formato.

8. **B.** È una rete di sicurezza contro un eventuale `result` non assegnato (bug futuro nel
   ciclo di ricerca del bracket), non ha nulla a che fare con arrotondamenti a multipli di 5
   (A) né con bonus di punteggio (C).

9. **B.** Come discusso in "Concetti teorici" e "Best Practice": è un segnale di attendibilità
   del dato, non un blocco né un errore di validazione dell'input (C è un concetto diverso,
   gestito altrove dalla validazione dei campi).

10. **C.** Confermato con `grep -rn "calcPercentile\b" src/`: gli unici risultati fuori dalla
    propria definizione sono nel file di test. Sia A che B descrivono un uso che non esiste
    nel codice attuale; D è falsa, la funzione esiste ancora, semplicemente non è chiamata.

## Esercizi

1. **Livello base.** Usando i dati reali della tabella `dinamometro_hand_grip` (righe 64-79 di
   `tables.js`, fascia `'18-35'`, uomo), calcola a mano il percentile per un valore di 44 kg
   (sai che P40=46 e P30=43 in quella fascia). Poi verifica scrivendo un test temporaneo con
   `calcPercentileEx('forza', 44, 'M', 25, 'dinamometro_hand_grip')`.

2. **Livello base.** Leggi la definizione di `shuttle_run_30m` in `tests.js` (riga 585):
   `ageGroup: (age) => age < 7 ? null : age <= 7 ? '7' : age <= 8 ? '8' : age <= 9 ? '9' :
   null`. Per quali età questa funzione restituisce `null`? Cosa succede, secondo
   `getAgeGroupClamped`, se chiami il test con un'età di 15 anni?

3. **Livello intermedio.** Scrivi un test nuovo in `percentile.test.js` che verifichi
   esplicitamente il "bug potenziale" descritto nell'Analisi del codice: chiama
   `calcPercentileEx('resistenza', ..., 'M', ..., undefined)` (senza `testKey`) e verifica con
   un `console.log` (o un'asserzione mirata) che il test risolto sia effettivamente
   `ymca_step_test` e non un altro dei 5 candidati.

4. **Livello intermedio.** Confronta `useWizard.js` (righe 52-68) e `useCampionamento.js`
   (righe 26-30): entrambi calcolano un "risultato live" mentre l'utente digita, ma uno
   estrae solo `.value` mentre l'altro conserva l'intero oggetto `{ value, outOfRange }`.
   Spiega, guardando come ciascun hook usa il risultato più a valle nel proprio file, perché
   questa differenza ha senso (indizio: cerca `ageWarnings` in `useCampionamento.js`).

5. **Livello avanzato.** `getAgeGroupClamped` accetta un parametro `sex = 'M'` con default, e
   alla riga 451 fa `TABLES[testKey]?.[sex] ?? TABLES[testKey]?.M` (fallback su `M` se manca
   la sotto-tabella per il sesso richiesto). Individua un test reale in `tables.js` dove le
   fasce disponibili per `M` e `F` sono **diverse** (numero di fasce o range diversi — non
   uguali come `single_leg_stance`), e discuti se questo fallback su `M` potrebbe restituire
   una fascia che poi non esiste realmente nella sotto-tabella `F` di quel test, causando un
   `percentiles` `undefined` più a valle in `calcPercentileEx`.

## Challenge

Scegli un test reale del modulo `soccer_academy` con dati marcati come "stima interna" nei
commenti di `tables.js` (es. `t_test_mini`, righe 356-367 — "M: per anno... F: fascia unica").
Nota che, a differenza di `t_test_mini` (dati diversi per M e F), `single_leg_stance` (righe
332-335) ha **la stessa identica tabella per M e F** con un commento esplicito "F = M (nessun
dato normativo differenziato per questa fascia)".

**Modifica reale da fare nel tuo ambiente locale:**

1. In `utils/tables.js`, individua il blocco `single_leg_stance` (righe 332-335).
2. Senza toccare i valori M (il file è nella lista "Non modificare" di `CLAUDE.md` per
   *tabelle esistenti* — qui l'esercizio è puramente di lettura/comprensione, quindi lavora su
   una **copia locale** del blocco in uno scratch file, non modificare il file reale del
   progetto), prova a costruire un ipotetico set di valori F leggermente diversi (es. -10%
   sui secondi totali rispetto a M, un'ipotesi di lavoro plausibile per una differenza di
   forza dell'equilibrio in età pediatrica).
3. Scrivi due chiamate a `calcPercentileEx` — una con i valori M reali, una con i tuoi valori
   F ipotetici — per lo stesso valore grezzo di input, e confronta i percentili risultanti.
4. Rifletti per iscritto (poche righe, per te stesso): quali sono i rischi di avere `F = M`
   "per mancanza di dati" invece di N/A esplicito, dato che il sistema non lo segnala mai con
   un `outOfRange` (l'età è dentro fascia, il dato semplicemente non è differenziato per
   sesso)? È un limite che il flag `outOfRange` attuale, per costruzione, non riesce a
   catturare.
