# Lezione 5 — useEffect e ciclo di vita
[← Indice](00-indice.md)

## Obiettivo della lezione

Imparerai a leggere e scrivere `useEffect` con sicurezza, capendo cosa fa davvero la dependency
array e perché la funzione di cleanup (`return () => ...`) non è un dettaglio opzionale.
Useremo due esempi reali e molto diversi tra loro: un timeout "di sicurezza" in `App.jsx` che
protegge l'utente da un caricamento infinito, e un polling periodico in `useVersionCheck.js` che
avvisa quando c'è un nuovo deploy da scaricare. Alla fine capirai anche **come** viene generato
il dato che quel secondo hook consuma, per chiudere l'intera catena.

## Concetti teorici

### 📎 Approfondimento: useEffect

`useEffect` esiste per una ragione precisa: **sincronizzare un componente React con qualcosa che
vive fuori da React** — un timer del browser, una richiesta di rete, una subscription, il DOM
diretto, il titolo della scheda del browser, `localStorage`. React da solo sa gestire soltanto
"cosa disegnare sullo schermo dato lo stato attuale"; tutto ciò che è un *effetto collaterale*
verso il mondo esterno va dichiarato esplicitamente con `useEffect`.

```js
useEffect(() => {
  // codice da eseguire DOPO che React ha aggiornato il DOM
  return () => {
    // codice di pulizia, eseguito prima della prossima esecuzione o allo smontaggio
  }
}, [dipendenze])
```

Il punto concettuale più importante, che vale la pena fissare subito perché è la fonte del 90%
della confusione su questo hook:

> `useEffect` **non** è "il `componentDidMount` di una volta". È un meccanismo dichiarativo che
> dice a React: "ogni volta che questi valori (`[dipendenze]`) cambiano, rilancia questa
> sincronizzazione". Che questo capiti "al primo render" è solo un caso particolare (quando le
> dipendenze sono `[]`, "cambiano" — rispetto a niente — una volta sola, all'inizio).

**Analogia:** pensa a un termostato. Non gli dici "accenditi quando la stanza viene costruita e
basta" — gli dici "tieni la temperatura sincronizzata con quella impostata, e ogni volta che
cambio l'impostazione, riadatta il riscaldamento di conseguenza". `useEffect` è quel termostato:
il "riadatta" è la funzione che passi come primo argomento, la "temperatura impostata" è la
dependency array. E quando esci dalla stanza (il componente si smonta) il termostato si spegne —
quello è il cleanup.

### La dependency array — i tre casi

```js
useEffect(() => { ... })            // nessun array   → gira dopo OGNI render
useEffect(() => { ... }, [])        // array vuoto    → gira una volta sola (dopo il primo render)
useEffect(() => { ... }, [a, b])    // array con dep  → gira dopo il primo render, e di nuovo ogni volta che a o b cambiano rispetto all'ultima esecuzione
```

Il caso "nessun array" è quasi sempre un errore quando compare in codice di produzione: significa
che l'effetto viene rieseguito a ogni singolo render, comprese le volte in cui non è cambiato
nulla di rilevante — se dentro c'è un `fetch` o un `setInterval`, è una ricetta per un loop o per
richieste duplicate a raffica. Nel codice di RankEX, infatti, non troverai mai questo caso: ogni
`useEffect` ha sempre un secondo argomento esplicito, `[]` o con dipendenze elencate.

### 📎 Approfondimento: useRef (breve)

Per capire fino in fondo `useVersionCheck.js` serve anche `useRef`, che compare lì insieme a
`useEffect`. `useRef(valoreIniziale)` crea un contenitore mutabile (`{ current: valoreIniziale }`)
che **sopravvive tra i render, esattamente come `useState`, ma con una differenza cruciale:
cambiare `.current` NON causa un re-render.**

**Analogia:** se `useState` è il Post-it visibile fuori dalla porta (vedi Lezione 4) che ogni
volta che cambi fa "suonare il campanello" (re-render), `useRef` è un taccuino personale che
tieni in tasca: puoi scriverci e leggerci quando vuoi, nessuno se ne accorge, nessun campanello
suona. È perfetto per valori che la funzione deve "ricordare" tra un'esecuzione e l'altra ma che
non fanno parte di ciò che l'utente deve vedere a schermo.

### Cleanup: quando viene chiamato, davvero

La funzione ritornata da un `useEffect` (`return () => {...}`) viene invocata da React in due
momenti, non uno solo:

1. **Prima di rieseguire lo stesso effetto**, ogni volta che una delle dipendenze cambia (per
   "spegnere" la vecchia sincronizzazione prima di avviarne una nuova).
2. **Quando il componente viene smontato** (rimosso dall'albero), come pulizia finale.

Se ometti il cleanup in un effetto che avvia un `setInterval` o un `setTimeout`, quel timer
continua a girare anche dopo che il componente che lo ha creato non esiste più — un classico
memory leak, e nei casi peggiori una chiamata a `setState` su un componente smontato.

## Dove compare nel progetto

- [`src/app/App.jsx`](../../src/app/App.jsx) — `useEffect` con `setTimeout`/`clearTimeout` per
  mostrare "CARICAMENTO FALLITO" se l'autenticazione impiega troppo (`LOADING_TIMEOUT_MS`).
- [`src/hooks/useVersionCheck.js`](../../src/hooks/useVersionCheck.js) — `useEffect` con
  `setInterval` che fa polling ogni 5 minuti su `/version.json` per rilevare un nuovo deploy.
- [`vite.config.js`](../../vite.config.js) — il plugin che genera `dist/version.json` a ogni
  build: è la fonte del dato che `useVersionCheck` consuma, utile per chiudere il cerchio "chi
  produce → chi legge".

## Analisi del codice

### 1. `App.jsx` — timeout di sicurezza sul caricamento (righe 13, 15-29)

```js
const LOADING_TIMEOUT_MS = 10_000

export default function App() {
  const { user, profile, org, terminology, refreshProfile } = useAuth()
  const [timedOut, setTimedOut]                             = useState(false)

  const { showWarning: showSessionWarning, extendSession } = useSessionTimeout(profile?.role)
  const hasUpdate = useVersionCheck()

  // true finché l'SDK auth non risponde, o finché l'utente loggato aspetta il profilo+org
  const isLoading = user === undefined || (user !== null && (profile === undefined || org === undefined))

  useEffect(() => {
    if (!isLoading) { setTimedOut(false); return }
    const t = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [isLoading])
```

Osservazioni riga per riga:

- `isLoading` (riga 23) **non è uno stato** (`useState`): è un valore *derivato*, ricalcolato a
  ogni render a partire da `user`, `profile`, `org`. Non c'è bisogno di "ricordarlo" tra un
  render e l'altro — dipende interamente da valori che già esistono, quindi calcolarlo ogni
  volta è più semplice e meno soggetto a bug di sincronizzazione rispetto a tenerlo in uno
  `useState` parallelo che rischierebbe di disallinearsi.
- L'effetto (righe 25-29) ha **due comportamenti diversi a seconda del ramo**, ed è un buon
  esempio di quanto la dependency array `[isLoading]` sia esattamente ciò che serve: l'effetto
  deve rilanciarsi ogni volta che `isLoading` passa da `true` a `false` o viceversa, non ad ogni
  render qualsiasi.
- **Ramo "non sto più caricando"** (riga 26): `if (!isLoading) { setTimedOut(false); return }` —
  se l'autenticazione si è già risolta, l'effetto resetta `timedOut` a `false` (nel caso fosse
  rimasto `true` da un caricamento precedente, ad esempio dopo un logout/login successivo) e fa
  `return` **senza ritornare una funzione di cleanup**: in questo ramo non c'è nessun timer da
  ripulire, perché non ne è stato avviato nessuno.
- **Ramo "sto ancora caricando"** (righe 27-28): avvia un `setTimeout` che, dopo 10 secondi
  (`LOADING_TIMEOUT_MS`), imposta `timedOut` a `true` — questo fa apparire la schermata
  "CARICAMENTO FALLITO" con il bottone "Ricarica" (righe 31-42). La riga 28
  (`return () => clearTimeout(t)`) è il cleanup: se `isLoading` diventa `false` **prima** che
  scadano i 10 secondi (cioè l'autenticazione ce l'ha fatta in tempo), React chiama questa
  funzione di cleanup, cancellando il timeout pendente — altrimenti, 10 secondi dopo un login
  ormai completato con successo, l'utente vedrebbe comunque apparire "CARICAMENTO FALLITO" per
  un bug di un timer dimenticato.
- Nota che il `return` del ramo "non sto più caricando" e il `return` del ramo "sto ancora
  caricando" sono **diversi**: il primo non ritorna nulla (cleanup assente, va bene così), il
  secondo ritorna una funzione. È perfettamente legale che un `useEffect` ritorni cose diverse a
  seconda del percorso preso al suo interno — l'importante è che, se un percorso ha bisogno di
  pulizia, la fornisca.

### 2. `useVersionCheck.js` — polling con `useRef` e cleanup dell'interval (tutto il file)

```js
import { useState, useEffect, useRef } from 'react'

const POLL_MS = 5 * 60 * 1000  // ogni 5 minuti

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const current = useRef(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const { v } = await res.json()
        if (current.current === null) {
          current.current = v
        } else if (v !== current.current) {
          setHasUpdate(true)
        }
      } catch {
        // ignora errori di rete
      }
    }

    check()
    const id = setInterval(check, POLL_MS)
    return () => clearInterval(id)
  }, [])

  return hasUpdate
}
```

Analisi passo passo:

- **`hasUpdate`** è `useState` (riga 6) perché **deve** causare un re-render quando cambia: è
  l'informazione che `App.jsx` userà (riga 20: `const hasUpdate = useVersionCheck()`) per
  decidere se mostrare il banner "Nuova versione disponibile".
- **`current`** è `useRef(null)` (riga 7): tiene la versione conosciuta come baseline, ma **non**
  deve causare re-render quando viene aggiornata — è un dato interno di bookkeeping, non
  qualcosa che l'utente deve "vedere" cambiare. Se al suo posto ci fosse stato un `useState`, ogni
  singolo controllo (ogni 5 minuti, o anche il primo alla riga "check()" iniziale) avrebbe
  causato un render aggiuntivo del componente che usa l'hook, per un valore che nessuno mostra a
  schermo — spreco puro.
- **`useEffect(() => {...}, [])`** (righe 9-28): array vuoto, quindi l'intera configurazione
  (funzione `check`, avvio, interval) avviene una sola volta, al montaggio.
- **`check` è una funzione `async` dichiarata *dentro* l'effetto** (righe 10-23): fa il `fetch` a
  `/version.json`, aggiunge `?t=${Date.now()}` come query string cache-busting (ogni chiamata ha
  un URL leggermente diverso, quindi anche una cache HTTP aggressiva non potrebbe restituire una
  risposta salvata in precedenza) e passa esplicitamente `{ cache: 'no-store' }` come ulteriore
  garanzia esplicita, indipendente dal trucco del query string.
- **Logica di confronto** (righe 15-19): la prima volta che `check()` gira (chiamata diretta alla
  riga 25, subito dopo la definizione), `current.current` è ancora `null` — quindi il codice si
  limita a *memorizzare* la versione scaricata come baseline (`current.current = v`), senza
  segnalare nessun aggiornamento (sarebbe assurdo dire "c'è una versione nuova" al primissimo
  controllo, quando non hai ancora nulla con cui confrontarla). Dalla seconda chiamata in poi
  (quelle scatenate dall'interval), se la versione scaricata (`v`) è diversa dalla baseline
  salvata, scatta `setHasUpdate(true)`.
- **`check()` viene chiamata subito** (riga 25) e poi **ogni `POLL_MS` (5 minuti)** tramite
  `setInterval(check, POLL_MS)` (riga 26) — quindi il primo controllo (che stabilisce la
  baseline) avviene immediatamente al mount, non bisogna aspettare 5 minuti per il primo giro.
- **Cleanup** (riga 27): `return () => clearInterval(id)` — indispensabile. Senza questa riga,
  l'intervallo continuerebbe a girare (e a fare `fetch`) anche dopo che il componente che ha
  chiamato `useVersionCheck()` fosse stato smontato — cosa che, per un hook chiamato una sola
  volta al livello più alto dell'app (`App.jsx`, riga 20), capiterebbe raramente in produzione,
  ma è comunque il comportamento corretto e necessario in sviluppo, dove React StrictMode monta,
  smonta e rimonta i componenti una volta in più apposta per stanare effetti che non puliscono
  bene dietro di sé.
- **`catch { // ignora errori di rete }`** (righe 20-22): un fallimento del controllo versione
  (utente offline, richiesta bloccata, server momentaneamente giù) non deve mai propagarsi come
  errore visibile — è un controllo "best effort", non una funzionalità critica dell'app.

### 3. Chi produce `version.json` — `vite.config.js` (righe 14-20)

```js
// Genera dist/version.json al momento del build per il version-check client-side
const versionPlugin = {
  name: 'version-json',
  writeBundle() {
    writeFileSync('dist/version.json', JSON.stringify({ v: Date.now() }))
  },
}
```

Questo è un plugin Vite minimale (registrato poi in `plugins: [react(), tailwindcss(),
versionPlugin, ...visualizerPlugin]`): l'hook `writeBundle()` viene eseguito da Vite **al termine
di ogni build** (`npm run build`), e scrive un file `dist/version.json` con un singolo campo `v`
uguale al timestamp `Date.now()` di quel preciso momento di build. Ogni deploy produce quindi un
timestamp diverso e univoco. Questo chiude il cerchio: `useVersionCheck` scarica periodicamente
questo file dal server in produzione; se il timestamp che trova è diverso da quello scaricato al
caricamento della pagina, significa che nel frattempo è stato pubblicato un nuovo build — quindi
la pagina che l'utente ha aperta ore fa sta girando codice ormai vecchio, ed è il momento di
proporre il ricaricamento.

## Diagramma mentale

```
App.jsx — timeout di sicurezza
──────────────────────────────
render #1: isLoading = true
   useEffect si attiva ([isLoading] cambiato rispetto a "niente")
      → setTimeout(10s) avviato, t salvato
...(10s passano, auth ancora non risolta)...
   setTimedOut(true) → re-render → "CARICAMENTO FALLITO"

  OPPURE, se l'auth risolve prima:
render #2: isLoading = false
   useEffect si riattiva ([isLoading] cambiato true→false)
      → CLEANUP del render precedente: clearTimeout(t)  [niente "CARICAMENTO FALLITO"]
      → nuovo giro dell'effetto: setTimedOut(false), nessun nuovo timer


useVersionCheck — polling
──────────────────────────
mount
  useEffect([]) → gira una volta
     check() immediata:  current.current = null → salva baseline v0
     setInterval ogni 5 minuti:
        check() → confronta v_nuovo con current.current (v0)
                → se diverso: setHasUpdate(true) → App.jsx mostra il banner
unmount (raro in pratica, ma sempre gestito)
  cleanup → clearInterval(id)  [il polling si ferma davvero]


vite.config.js (build time, non runtime)
──────────────────────────
npm run build → writeBundle() → dist/version.json = { v: Date.now() }
       ↑ è il dato che /version.json restituirà finché non si fa un nuovo deploy
```

## Errori comuni

1. **Omettere la dependency array in `App.jsx`** (scrivere solo `useEffect(() => {...})` senza
   `, [isLoading]`): l'effetto girerebbe a ogni render dell'intero componente `App`, ricreando
   continuamente nuovi `setTimeout` — un comportamento che sembra "funzionare" nei test rapidi ma
   che moltiplica silenziosamente i timer attivi.
2. **Aggiungere `theme` o un'altra variabile letta dentro l'effetto senza metterla nell'array**
   delle dipendenze: è lo scenario da manuale di *stale closure* — l'effetto "vedrebbe" per
   sempre il valore che quella variabile aveva al momento in cui l'effetto fu creato l'ultima
   volta, ignorando aggiornamenti successivi, finché una dipendenza elencata non forza una
   ri-esecuzione.
3. **Usare `useState` al posto di `useRef` per `current` in `useVersionCheck`**: ogni fetch
   riuscito diventerebbe un `setState`, quindi un re-render extra ogni 5 minuti anche quando non
   c'è nessun aggiornamento reale da segnalare — spreco di render per un dato che non deve mai
   comparire a schermo.
4. **Dimenticare `return () => clearInterval(id)`**: in sviluppo, con React StrictMode che monta
   e smonta apposta i componenti per verificare la pulizia degli effetti, questo produrrebbe
   *due* interval attivi in parallelo dopo il primo remount — sintomo tipico: il banner "Nuova
   versione disponibile" appare in metà tempo del previsto, o richieste doppie visibili nel tab
   Network.
5. **Rimuovere il ramo `if (!isLoading) { setTimedOut(false); return }`** in `App.jsx` pensando
   sia superfluo: senza questo reset esplicito, un utente che ha già visto "CARICAMENTO FALLITO"
   una volta (magari per una connessione lenta), fa logout e rientra, potrebbe restare con
   `timedOut` bloccato a `true` da un ciclo di caricamento precedente — comportamento sbagliato
   che questo ramo previene attivamente.

## Best Practice

**`setTimeout`/`setInterval` sempre dentro `useEffect`, mai "liberi" nel corpo del componente:**
se in `App.jsx` qualcuno scrivesse `setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS)`
direttamente nel corpo della funzione componente (fuori da `useEffect`), quel timeout verrebbe
**ricreato a ogni singolo render** (React richiama la funzione componente ad ogni render), senza
alcuna cancellazione di quelli precedenti — un accumulo di timer fantasma. Il codice reale evita
questo errore per costruzione, incapsulando sempre timer e interval dentro `useEffect` con
cleanup esplicito.

**`useRef` per dati di bookkeeping, `useState` solo per dati che devono guidare il render:** il
confronto diretto in `useVersionCheck.js` tra `current` (ref) e `hasUpdate` (state) è
l'illustrazione pratica di questa regola — usare l'uno o l'altro non è intercambiabile, sono
strumenti per due scopi diversi (memoria silenziosa vs. dato che deve arrivare sullo schermo).

**Fallire in silenzio su funzionalità non critiche:** il `catch { }` vuoto (con solo un
commento) in `useVersionCheck.js` è deliberato e corretto per questo caso specifico — un
controllo di versione fallito non deve mai bloccare o disturbare l'utente. Sarebbe un errore
applicare lo stesso pattern a un `catch` che gestisce, ad esempio, il salvataggio di un
campionamento in Firestore (vedi `useClients.js`, Lezione 6): lì un fallimento **deve** essere
comunicato (tramite toast e rollback), perché riguarda dati reali dell'utente, non un semplice
controllo di freschezza.

## Quiz

1. Qual è la differenza concettuale principale tra `useEffect` e "componentDidMount" delle classi React?
   A. Non c'è nessuna differenza, sono sinonimi
   B. `useEffect` sincronizza con dipendenze esplicite e può rieseguirsi più volte, non solo al montaggio
   C. `useEffect` funziona solo nei componenti di classe
   D. `componentDidMount` gestisce anche il cleanup automaticamente, `useEffect` no

2. Nell'effetto di `App.jsx`, cosa succede se `isLoading` passa da `true` a `false` prima che scadano i 10 secondi di `LOADING_TIMEOUT_MS`?
   A. Il timeout scatta comunque dopo 10 secondi, mostrando "CARICAMENTO FALLITO"
   B. Il cleanup (`clearTimeout(t)`) annulla il timeout pendente prima che scada
   C. L'app va in crash
   D. `timedOut` viene impostato a `true` immediatamente

3. Perché `current` in `useVersionCheck.js` è un `useRef` e non un `useState`?
   A. Perché `useRef` è più veloce da scrivere sintatticamente
   B. Perché aggiornare `current.current` non deve causare un re-render, essendo solo un dato interno di confronto
   C. Perché `useState` non può contenere stringhe
   D. Non c'è un vero motivo, sono intercambiabili in questo caso

4. Cosa fa `return () => clearInterval(id)` alla fine dell'effetto di `useVersionCheck.js`?
   A. Ferma il polling quando il componente si smonta o l'effetto si rilancia
   B. Avvia un nuovo controllo immediato della versione
   C. Cancella `hasUpdate`
   D. Non ha alcun effetto pratico in questo hook, dato che l'array di dipendenze è vuoto

5. Perché il primo `check()` (chiamato subito, riga 25) non fa mai scattare `setHasUpdate(true)`?
   A. È un bug del codice
   B. Perché al primo giro `current.current` è `null`, quindi il codice si limita a salvare la baseline, senza avere ancora nulla con cui confrontarla
   C. Perché `setHasUpdate` richiede almeno due chiamate consecutive per attivarsi
   D. Perché il primo `fetch` fallisce sempre di proposito

6. A cosa serve il parametro `cache: 'no-store'` nel `fetch` di `useVersionCheck.js`?
   A. A velocizzare la richiesta memorizzandola in cache
   B. A garantire esplicitamente che la risposta non venga servita da cache, in aggiunta al cache-busting del query string `?t=Date.now()`
   C. A impedire richieste multiple simultanee
   D. È un parametro obbligatorio per qualunque `fetch` in React

7. Se rimuovessi la dependency array `[]` da `useEffect` in `useVersionCheck.js` (lasciando `useEffect(() => {...})` senza secondo argomento), cosa cambierebbe?
   A. Nulla, il comportamento sarebbe identico
   B. L'effetto (con relativo `setInterval`) verrebbe ri-registrato a ogni render, creando nuovi interval senza mai fermare quelli precedenti
   C. Il polling si fermerebbe del tutto
   D. `hasUpdate` non potrebbe più essere letto da `App.jsx`

8. Da dove viene il valore `v` che `/version.json` restituisce?
   A. È generato in runtime da `useVersionCheck.js` stesso
   B. Viene scritto una volta sola durante l'installazione di Vite
   C. Viene generato dal plugin `versionPlugin` in `vite.config.js`, tramite `writeBundle()`, come `Date.now()` al momento della build
   D. È un valore hardcoded nel codice sorgente, aggiornato manualmente a ogni release

9. Cosa rappresenta `isLoading` in `App.jsx` in termini di gestione dello stato?
   A. Un `useState` autonomo, indipendente da `user`/`profile`/`org`
   B. Un valore derivato, ricalcolato a ogni render a partire da altri valori già esistenti (`user`, `profile`, `org`), senza un proprio `useState`
   C. Un valore che viene impostato solo dentro `useEffect`
   D. Una prop passata da un componente genitore

10. In quali momenti React chiama la funzione di cleanup di un `useEffect`?
    A. Solo quando il componente viene smontato
    B. Solo quando le dipendenze cambiano, mai allo smontaggio
    C. Sia prima di ogni ri-esecuzione dell'effetto (quando le dipendenze cambiano) sia allo smontaggio del componente
    D. Il cleanup non viene mai chiamato automaticamente, va invocato a mano

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** `useEffect` è un meccanismo di sincronizzazione guidato dalla dependency array — può
   girare zero, una o molte volte durante la vita di un componente, a differenza del singolo
   momento fisso rappresentato da "componentDidMount".
2. **B.** È esattamente il meccanismo del cleanup descritto nell'analisi: quando `isLoading`
   diventa `false`, l'effetto si rilancia, e prima di farlo React chiama il cleanup del giro
   precedente (`clearTimeout(t)`), disinnescando il timeout che altrimenti sarebbe scattato.
3. **B.** `useRef` è pensato apposta per dati che devono sopravvivere tra render senza
   provocarne di nuovi — qui `current` è puro bookkeeping interno, mai mostrato a schermo.
4. **A.** Il cleanup ferma l'interval sia quando il componente si smonta sia (teoricamente) se
   l'effetto dovesse rilanciarsi — con `[]` l'effetto gira una sola volta, quindi in pratica
   qui il cleanup interviene solo allo smontaggio (o al remount di StrictMode in sviluppo).
5. **B.** Confermato dal codice: `if (current.current === null) { current.current = v }` — il
   primo giro stabilisce solo la baseline, non c'è ancora nulla con cui confrontare.
6. **B.** È una garanzia esplicita e ridondante rispetto al cache-busting del query string,
   utile per rendere l'intento del codice leggibile senza dover ragionare sull'effetto
   collaterale indiretto del timestamp nell'URL.
7. **B.** Senza array (o con un array che cambia ad ogni render), l'effetto si rilancerebbe a
   ogni render, e ogni rilancio chiamerebbe `setInterval` creando un nuovo intervallo — quelli
   vecchi non spariscono da soli, si accumulano finché il cleanup (che pure ci sarebbe, ma
   verrebbe eseguito solo al render successivo, non subito) non li ferma uno per uno.
8. **C.** Confermato da `vite.config.js`, righe 14-20: il plugin `versionPlugin` scrive
   `dist/version.json` con `{ v: Date.now() }` dentro l'hook `writeBundle()`, eseguito a ogni
   build.
9. **B.** Riga 23: `const isLoading = user === undefined || (user !== null && (profile ===
   undefined || org === undefined))` — è calcolato, non memorizzato con `useState`.
10. **C.** È la doppia natura del cleanup spiegata nei Concetti teorici: interviene sia prima di
    ogni ri-esecuzione (quando le dipendenze cambiano) sia definitivamente allo smontaggio.

## Esercizi

1. **Facile.** Aggiungi un `console.log('effetto isLoading:', isLoading)` dentro l'effetto di
   `App.jsx` e osserva in console quante volte compare durante un login reale, correlandolo ai
   cambi di `user`/`profile`/`org`.
2. **Facile.** Cambia `POLL_MS` in `useVersionCheck.js` da 5 minuti a 10 secondi (solo in locale,
   per test) e osserva nella tab Network del browser le richieste ripetute a `/version.json`.
3. **Medio.** Rimuovi temporaneamente (in locale, solo per l'esperimento) la riga
   `return () => clearInterval(id)` da `useVersionCheck.js`, attiva React StrictMode (già attivo
   in dev, verifica in `main.jsx`) e osserva nella tab Network se compaiono il doppio delle
   richieste dopo il remount di sviluppo. Ripristina la riga alla fine.
4. **Medio.** Aggiungi un secondo `useEffect` in `App.jsx`, con dipendenza `[hasUpdate]`, che
   imposta `document.title` a `'(1) RankEX'` quando `hasUpdate` è vero e a `'RankEX'` altrimenti.
   È un buon esempio di effetto che sincronizza React con qualcosa di totalmente esterno al DOM
   gestito da React (il titolo della scheda del browser).
5. **Difficile.** Rendi configurabile `LOADING_TIMEOUT_MS` tramite una variabile d'ambiente
   Vite (es. `import.meta.env.VITE_LOADING_TIMEOUT_MS`, con fallback a `10_000` se non definita),
   mantenendo identico il comportamento dell'effetto. Verifica che il valore di fallback resti
   quello attuale se la variabile non è settata in `.env.development`.

## Challenge

Implementa un piccolo custom hook `useOnlineStatus()` (puoi metterlo in `src/hooks/`, seguendo
la stessa convenzione di `useVersionCheck.js`) che usa `useEffect` per ascoltare gli eventi
nativi del browser `online` e `offline` su `window`:

```js
window.addEventListener('online',  handler)
window.addEventListener('offline', handler)
```

Requisiti:
1. Uno `useState(navigator.onLine)` come valore iniziale (il browser espone già
   `navigator.onLine` in modo sincrono al primo render).
2. Un solo `useEffect` con array `[]`, che registra i due listener e li **rimuove** nel cleanup
   con `removeEventListener` — è l'esempio canonico di sottoscrizione a un evento esterno che
   richiede pulizia esplicita, diverso sia dal timer di `App.jsx` sia dal polling di
   `useVersionCheck.js`, ma che segue esattamente lo stesso principio.
3. Collega l'hook in `App.jsx` (subito dopo `useVersionCheck()`) e mostra un banner "Sei
   offline" con lo stesso stile visivo del banner "Nuova versione disponibile" (righe 53-70)
   quando il valore ritornato è `false`.

Verifica il comportamento disattivando/riattivando la connessione dai DevTools (tab Network →
"Offline") e osservando che il banner appaia e sparisca senza bisogno di ricaricare la pagina.
