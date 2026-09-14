# Lezione 14 — Optimistic UI con rollback
[← Indice](00-indice.md)

## Obiettivo della lezione

Imparare a leggere e riprodurre il pattern "optimistic update" così come è implementato
davvero in [`useClients.js`](../../src/hooks/useClients.js): aggiornare subito lo stato React
locale prima che il server confermi, e sapere tornare indietro (rollback) se qualcosa va
storto. La parte più interessante della lezione non è il pattern in sé (è meccanico), ma un
fatto architetturale che il codice rivela quando lo si legge con attenzione: lo stesso calcolo
di XP/livello/rank viene scritto **due volte** nel progetto — una in `src/utils/gamification.js`
per l'aggiornamento ottimistico, una in `functions/src/shared/gamification.js` come fonte di
verità lato server. Quando questa lezione è stata scritta la prima volta, verificando le due
copie riga per riga **non erano più identiche** — le discutiamo qui con le prove concrete
trovate allora, e con il fix reale che è stato applicato subito dopo (ago 2026, commit
`f154ff1`), perché il "prima" è didatticamente utile quanto il "dopo".

## Concetti teorici

**Optimistic update** significa applicare allo stato dell'interfaccia il risultato *atteso* di
un'operazione asincrona **prima** che quell'operazione sia effettivamente confermata dal
server. È l'opposto dell'approccio "pessimistico" (mostra uno spinner, aspetta la risposta,
solo allora aggiorna la UI): lì l'utente aspetta sempre il roundtrip di rete, qui lo vede
aspettare solo se qualcosa va storto — che nella grande maggioranza dei casi non succede.

Il pattern, così com'è scritto in `useClients.js`, ha sempre la stessa forma a quattro fasi:

```
1. snapshot = stato attuale                     (per poterlo ripristinare)
2. setState(valoreOttimistico)                  (la UI si aggiorna ISTANTANEAMENTE)
3. await chiamataAsincrona()                     (nel frattempo, in background)
4a. successo → nessuna azione (lo stato è già quello giusto)
4b. errore   → setState(snapshot) + toast di errore (rollback)
```

Il punto chiave è che i passi 2 e 3 sono **disaccoppiati**: il passo 2 non aspetta il passo 3.
React fa il suo re-render immediatamente con `setState`, mentre la Promise della chiamata
Firebase è ancora in volo. Solo se la Promise fallisce (`catch`), il codice torna indietro.

> 📎 **Approfondimento: Optimistic Update**
>
> Immagina di ordinare un caffè al banco di un bar molto efficiente: il barista digita
> l'ordine sulla cassa e ti dà lo scontrino **subito**, ancora prima di aver acceso la
> macchina espresso. Per te, a tutti gli effetti, "hai già il caffè": lo scontrino è la prova,
> e il barista è quasi certamente in grado di prepararlo. Se però la macchina si guasta proprio
> in quel momento (evento raro ma possibile), il barista strappa lo scontrino, ti rimborsa e ti
> avvisa. L'optimistic update funziona identico: lo "scontrino" è il nuovo stato React mostrato
> subito, la "macchina che prepara il caffè" è la scrittura reale su Firestore (qui: tramite
> una Cloud Function), e il rollback è "strappare lo scontrino" se la scrittura fallisce.
> Il costo di questa scommessa è la possibilità — rara ma reale — che tu veda per un istante
> un dato che poi viene corretto. È un compromesso deliberato tra **reattività percepita** e
> **coerenza garantita al 100% in ogni istante**.

Un secondo concetto, meno discusso ma centrale in questo file, è la **duplicazione
deliberata del calcolo**: per mostrare subito il risultato (nuovo XP, nuovo rank, nuovo
livello) senza aspettare il server, qualcuno deve calcolarlo *nel browser*, con gli stessi dati
grezzi che il server userà più tardi per calcolare la versione ufficiale. Le due funzioni non
condividono codice (sono in due repository/runtime diversi — browser vs Node.js in Cloud
Functions) e vanno quindi mantenute manualmente allineate. Vedremo, in una sezione dedicata più
sotto, cosa è successo davvero quando questo allineamento manuale è stato verificato per la
prima volta — e come si presenta oggi, dopo il fix.

## Dove compare nel progetto

- [`src/hooks/useClients.js`](../../src/hooks/useClients.js) — `handleCampionamento` (righe
  60-75), `handleAddXP` (righe 78-91), `handleDeleteClient` (righe 94-108), `handleAddClient`
  (righe 47-57, **non** ottimistico — vedi più sotto perché)
- [`src/utils/gamification.js`](../../src/utils/gamification.js) — `buildCampionamentoUpdate`
  (righe 138-199), `buildXPUpdate` (righe 105-111): calcolo puro lato client
- [`src/usecases/saveCampionamentoUseCase.js`](../../src/usecases/saveCampionamentoUseCase.js),
  [`src/usecases/saveXPUseCase.js`](../../src/usecases/saveXPUseCase.js),
  [`src/usecases/deleteClientUseCase.js`](../../src/usecases/deleteClientUseCase.js) — layer
  Cloud Functions callable (approfondito in Lezione 13)
- [`functions/src/callable/salvaCampionamento.js`](../../functions/src/callable/salvaCampionamento.js),
  [`functions/src/callable/salvaXP.js`](../../functions/src/callable/salvaXP.js) — la Cloud
  Function che ricalcola tutto lato server
- [`functions/src/shared/gamification.js`](../../functions/src/shared/gamification.js) — la
  copia server-side di `utils/gamification.js` (il file dichiara esplicitamente nel commento
  di riga 1: *"speculare a src/utils/gamification.js"*)
- [`src/context/TrainerContext.jsx`](../../src/context/TrainerContext.jsx) — `dispatch`
  tenuto in sync con lo stato ottimistico tramite `ACTIONS.SELECT_CLIENT`

## Analisi del codice

### 1. Il calcolo puro — `buildCampionamentoUpdate` (`gamification.js:138-199`)

```js
export function buildCampionamentoUpdate(client, newStats, testValues) {
  const media   = calcStatMedia(newStats)
  const rankObj = getRankFromMedia(media)
  const today   = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

  const prevStats = client.campionamenti?.[0]?.stats

  let xpGain
  if (!prevStats) {
    // Prima misurazione in assoluto
    xpGain = 50
  } else {
    const nImproved = Object.keys(newStats).filter(
      key => (newStats[key] ?? 0) > (prevStats[key] ?? 0)
    ).length

    if      (nImproved >= 4) xpGain = 100
    else if (nImproved >= 2) xpGain = 60
    else if (nImproved === 1) xpGain = 30
    else                      xpGain = 10
  }
  // ... (righe 160-198: log, campionamenti, calcLevelProgression)
}
```

Questa è una **funzione pura**: stesso input, stesso output, nessun effetto collaterale
(niente `fetch`, niente `Date.now()` usato per logica — solo per timestamp del log). Riceve il
`client` attuale e i `newStats` (i percentili **già calcolati lato client**, da
`useCampionamento.js`, righe 118-131, tramite `calcPercentileEx` — un altro punto in cui lo
stesso calcolo viene rifatto anche server-side, ma non è oggetto di questa lezione) e restituisce
un oggetto `{ update, campionamento }` pronto per essere:
1. applicato **subito** allo stato React locale (`update`)
2. eventualmente confrontato con quello che il server calcolerà

Perché è importante che sia pura: perché la si può testare senza mock di Firestore (vedi
`src/__tests__/utils/gamification.test.js`), e perché la si può chiamare **sincronamente**
dentro un `useCallback` — nessun `await` necessario per ottenere il risultato.

### 2. `handleCampionamento` — le quattro fasi in azione (`useClients.js:60-75`)

```js
const handleCampionamento = useCallback(async (client, newStats, testValues) => {
  const { update } = buildCampionamentoUpdate(client, newStats, testValues)
  const snapshot   = client

  updateLocal(client.id, update)
  dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

  try {
    await saveCampionamentoUseCase(orgId, client, update, testValues)
    toast.success('Campionamento salvato')
  } catch {
    updateLocal(client.id, snapshot)
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
    toast.error('Impossibile salvare il campionamento')
  }
}, [orgId, dispatch, updateLocal, toast])
```

Riga per riga:
- **Riga 61**: il calcolo puro descritto sopra. Non tocca ancora nessuno stato React.
- **Riga 62**: `snapshot = client` — nota che è l'oggetto client **prima** delle modifiche, per
  intero (non solo i campi cambiati). È la fotografia a cui tornare in caso di rollback.
- **Righe 64-65**: qui avviene l'"optimistic update" vero e proprio — due `setState` distinti
  perché lo stato del cliente vive in **due posti diversi** contemporaneamente:
  `updateLocal` modifica l'array `clients` (stato locale dell'hook `useClients`), mentre
  `dispatch(...SELECT_CLIENT)` modifica `TrainerContext` (`selectedClient`, usato altrove — es.
  dagli header delle pagine cliente). Sono due copie della stessa informazione: bisogna
  aggiornarle entrambe a mano, altrimenti l'una mostra il vecchio rank e l'altra il nuovo.
- **Riga 68**: la persistenza reale. Nota bene cosa viene passato: `client, update, testValues`
  — ma come vedremo tra un attimo, `saveCampionamentoUseCase` **ignora `update`**.
- **Righe 70-73**: il `catch` senza parametro (`catch {`) — non serve l'oggetto errore, basta
  sapere che è fallito. Rollback simmetrico alle righe 64-65: stesso doppio `setState`, stesso
  payload (`snapshot`), più un toast di errore per informare l'utente.

`handleAddXP` (righe 78-91) è lo stesso identico schema con `buildXPUpdate` al posto di
`buildCampionamentoUpdate` — utile confrontarli per notare quanto sia diventato un vero e
proprio *pattern* riconoscibile, non codice scritto due volte per caso.

`handleDeleteClient` (righe 94-108) applica lo stesso schema a un'operazione diversa (rimozione
da un array anziché merge di campi):

```js
const handleDeleteClient = useCallback(async (clientId) => {
  const snapshot = clients.find(c => c.id === clientId)

  removeLocal(clientId)
  dispatch({ type: ACTIONS.DESELECT_CLIENT })

  try {
    await deleteClientUseCase(orgId, clientId)
    auditLog(AUDIT_ACTIONS.CLIENT_DELETED, { clientId, clientName: snapshot?.name, orgId })
    toast.success('Cliente eliminato')
  } catch {
    if (snapshot) setClients(prev => [...prev, snapshot])
    toast.error('Impossibile eliminare il cliente')
  }
}, [orgId, clients, dispatch, removeLocal, toast])
```

Notare la riga 105: il rollback qui non richiama `removeLocal` al contrario, ma re-inserisce lo
`snapshot` in coda all'array con uno spread — il cliente "torna" nella lista, anche se non
necessariamente nella stessa posizione originale (dettaglio innocuo, la lista non è ordinata
per posizione stabile in UI).

### 3. Il "non-optimistic" `handleAddClient` — il contro-esempio (`useClients.js:47-57`)

```js
const handleAddClient = useCallback(async (formData) => {
  try {
    const newClient = await createClientUseCase(orgId, userId ?? orgId, formData)
    setClients(prev => [...prev, newClient])
    toast.success('Cliente creato')
    return newClient
  } catch (err) {
    toast.error(getFirebaseErrorMessage(err, 'Impossibile creare il cliente'))
    throw err
  }
}, [orgId, userId, toast])
```

Questo handler **non** è ottimistico, ed è una scelta corretta, non una dimenticanza: per
aggiornare *subito* la UI con un cliente "quasi vero" servirebbe generare lato client un id
temporaneo, un rank iniziale, un XP iniziale — dati che la Cloud Function `creaCliente`
calcola con `buildNewClient` (vedi `functions/src/shared/gamification.js:157-188`) e che
includono normalizzazioni che non conviene duplicare per un'operazione che, a differenza di un
+XP, l'utente si aspetta impieghi "un momento" (compila un wizard, poi conferma). Nota anche il
`throw err` in fondo al catch: qui l'errore viene *rilanciato* al chiamante (il wizard di
creazione cliente), che lo può intercettare per mostrare un errore inline nel form — un
comportamento diverso apposta dagli altri handler, che invece "ingoiano" l'errore mostrando
solo un toast generico.

### 4. Dove va a finire `update` — il calcolo lato server (`saveCampionamentoUseCase.js`)

```js
export async function saveCampionamentoUseCase(orgId, client, update, testValues) {
  // Il BE calcola i percentili server-side dai valori grezzi (testValues). Il testo
  // descrittivo del log ("Campionamento — Sprint 20m 3.2s · ...") invece arriva da qui,
  // perché richiede label/unit dei test (constants/tests.js) che il BE non ha.
  const logAction = update?.log?.[0]?.action
  await _salvaCampionamento({ orgId, clientId: client.id, testValues: testValues ?? {}, logAction })
}
```

**Questo non è sempre stato così.** Fino ad ago 2026, il terzo parametro si chiamava `_update`
(underscore = "ricevuto ma intenzionalmente non usato") e **non veniva inviato al server in
nessuna forma** — alla Cloud Function arrivavano solo `orgId`, `clientId` e i `testValues`
grezzi. `saveXPUseCase.js` è rimasto fedele a quello schema originale: riceve ancora `_update`
e lo ignora del tutto, manda solo `xpToAdd` e `note`. Confrontare i due file oggi, uno accanto
all'altro, è un esercizio istruttivo — sono lo stesso pattern con due destini diversi, ed è il
tema dell'Esercizio 1 di questa lezione.

Il motivo del cambiamento: la versione server-side del testo di log era generica
("Campionamento effettuato", senza dettagli) perché `functions/src/shared/testsMeta.js`
omette **deliberatamente** label e unità di misura dei test (servono solo al calcolo dei
percentili, non alla UI — vedi Lezione 13). Invece di duplicare quei dati anche lato server
solo per generare una stringa, si è scelto di far viaggiare la stringa **già calcolata dal
client** — che quei dati li ha già, per costruire l'anteprima ottimistica — fino alla Cloud
Function, che la usa così com'è per il log persistito. Il resto di `update` (stats, rank, xp,
level, campionamenti) **continua a essere ignorato**: solo `update.log[0].action`, una singola
stringa di testo non sensibile, attraversa il confine client→server. Il valore numerico che
verrà davvero scritto su Firestore resta calcolato da zero, sui dati grezzi, dentro
`functions/src/callable/salvaCampionamento.js`:

```js
// functions/src/callable/salvaCampionamento.js, righe 43-53
const newStats = {}
for (const test of TESTS_META.filter(t => t.categories.includes(categoria))) {
  const finalValue = resolveTestInput(test, testValues)
  if (finalValue !== null) {
    const { value } = calcPercentileEx(test.stat, finalValue, sex, clientAge, test.key)
    if (value !== null) newStats[test.stat] = value
  }
}

const { update } = buildCampionamentoUpdate(client, newStats, testValues)
```

`buildCampionamentoUpdate` qui è la funzione **omonima** importata da
`functions/src/shared/gamification.js` — stesso nome, oggi una firma con un parametro in più
(`logAction`, il quarto argomento facoltativo appena visto), ma un file fisicamente diverso,
eseguito su un altro runtime (Node.js in Cloud Functions, non il browser). Il server non si
fida di nessun valore *numerico* calcolato dal client: ricalcola persino i percentili partendo
dai soli numeri grezzi digitati nel form. Il client, sui campi che contano davvero (XP, rank,
percentili), non ha alcun potere decisionale — solo il potere di "indovinare in anticipo" cosa
dirà il server, per motivi di UX, più — da ago 2026 — quello di suggerire un testo descrittivo
che il server non potrebbe altrimenti costruire da solo.

### 5. Le due copie sono ancora identiche? Verifica riga per riga (e cosa è cambiato)

Confrontando `src/utils/gamification.js` con `functions/src/shared/gamification.js` (il
commento in cima a quest'ultimo dice letteralmente *"Logica gamification lato server — speculare
a src/utils/gamification.js"*), la logica numerica (soglie XP, `XP_PER_LEVEL_MULTIPLIER`,
tabella `RANKS`) è sempre risultata identica nelle due copie. Ma quando questa lezione è stata
scritta la prima volta, **non tutto** lo era — tre differenze verificabili, trovate leggendo
entrambi i file per intero:

| Costante/campo | Prima (quando la lezione è stata scritta) | Oggi, verificato di nuovo |
|---|---|---|
| `LOG_MAX_ENTRIES` | `20` lato client, `200` lato server | **`200` su entrambi** — allineato a valore server (più generoso, necessario per i bucket "mese" di `XPTrendChart`) |
| testo log campionamento | Client: `` `Campionamento — ${valStr}` `` con dettaglio test. Server: `` `Campionamento effettuato` `` generico | **Identico** — il server ora usa `logAction` ricevuto dal client (vedi punto 4 sopra), con fallback al testo generico se `logAction` non arriva |
| testo log XP manuale | Client: `` `+${xpToAdd} XP aggiunto dal trainer` ``. Server: `` `+${xpToAdd} XP` `` (mancava la coda) | **Identico** — il fallback server-side è stato riscritto per matchare esattamente quello client, senza bisogno di passare nulla sulla rete (è un letterale statico, non serviva un parametro) |

Il fix (commit `f154ff1`) ha usato **due tecniche diverse** per le tre righe della tabella, ed
è un buon esercizio distinguerle: `LOG_MAX_ENTRIES` è stata semplicemente cambiata a mano nei
due file separati (nessun dato viaggia tra client e server per quello — è solo una costante
duplicata, ora uguale "per manutenzione", non per costruzione). Il testo XP è stato allineato
allo stesso modo (stringa statica riscritta identica in entrambi i file). Il testo campionamento
invece **non poteva** essere semplicemente riscritto uguale nei due file, perché il server non
ha i dati (label/unit dei test) per costruirlo da solo — per quello è servito il meccanismo di
`logAction` visto al punto 4: un dato che *deve* attraversare la rete perché non è duplicabile a
costo zero. Riconoscere quale delle due tecniche serve, caso per caso, è il punto pedagogico più
importante di questa sezione.

Verificalo tu stesso: apri i due file oggi (non fidarti di questa tabella) e conferma che le
tre righe combaciano davvero.

## Diagramma mentale

```
                     handleCampionamento(client, newStats, testValues)
                                    │
                    ┌───────────────┴───────────────┐
                    │                                │
          buildCampionamentoUpdate            (nessuna chiamata di rete
          (utils/gamification.js)              ancora — puro calcolo)
                    │
                    ▼
        update = { stats, rank, xp, level, log, ... }
                    │
     ┌──────────────┼───────────────────┐
     ▼               ▼                  │
updateLocal()   dispatch(SELECT_CLIENT) │  ← UI aggiornata SUBITO
     │               │                  │     (fase ottimistica)
     └──────────────►│◄─────────────────┘
                      │
                      ▼
        await saveCampionamentoUseCase(orgId, client, update, testValues)
                      │        (solo update.log[0].action ne esce, come logAction —
                      │         il resto di update, stats/rank/xp/level, è IGNORATO)
                      ▼
        httpsCallable('salvaCampionamento') → Cloud Function
                      │
                      ▼
     functions/src/shared/gamification.js → buildCampionamentoUpdate
     (STESSA funzione per nome, calcolo indipendente sui dati grezzi)
                      │
              ┌───────┴────────┐
              ▼                ▼
          successo           errore
       (nessuna azione    rollback: updateLocal(snapshot)
        UI — è già         + dispatch(snapshot)
        corretta)           + toast.error()
```

## Errori comuni

- **Fare rollback solo in uno dei due stati.** `updateLocal` e `dispatch(SELECT_CLIENT)`
  rappresentano la stessa informazione in due posti — se in un futuro handler si dimenticasse
  di aggiornare (o ripristinare) uno dei due, si creerebbe un disallineamento silenzioso tra
  "il cliente nella lista" e "il cliente selezionato mostrato nel dettaglio".
- **Passare `toast` intero nelle dipendenze di `useCallback`.** `useToast()` (vedi
  `src/hooks/useToast.js:4-11`) ritorna `{ success, error, warning, info }` — un **oggetto
  nuovo a ogni render**, anche se i singoli metodi al suo interno sono individualmente
  memoizzati con `useCallback`. `handleCampionamento` (riga 75), `handleAddClient` (riga 57) e
  `handleDeleteClient` (riga 108) includono `toast` intero nell'array delle dipendenze: il
  risultato è che quegli handler vengono ricreati a ogni render del componente che chiama
  `useClients()`, vanificando parzialmente la memoizzazione. Non è un bug funzionale (gli
  handler restano corretti), ma un piccolo spreco di rendering che si poteva evitare
  destrutturando solo il metodo effettivamente usato (`const { success, error } = useToast()`,
  poi `[success]`/`[error]` nelle deps). `handleAddXP` (riga 91), che non chiama `toast`,
  infatti non ha questo problema.
- **Assumere che `update` (calcolato lato client) sia quello che finisce su Firestore.** Come
  visto, `saveCampionamentoUseCase` ne estrae solo `update.log[0].action` (una stringa di
  testo) e ignora tutto il resto — stats, rank, xp, level ricalcolati non arrivano mai al
  server. Se si dovesse debuggare "perché il dato salvato è diverso da quello mostrato subito
  dopo il salvataggio", il primo posto dove guardare resta la Cloud Function, non
  `gamification.js` lato client — con la sola eccezione del testo del log, che è l'unico
  campo per cui client e server concordano *per costruzione* (uno lo manda, l'altro lo usa),
  non per coincidenza di due calcoli paralleli.
- **Dimenticare che `snapshot` è un riferimento all'oggetto, non una copia profonda.** In
  JavaScript `const snapshot = client` non clona nulla: se qualcosa mutasse `client` "in place"
  tra il salvataggio dello snapshot e il rollback (qui non succede — gli update sono sempre
  creati con spread `{ ...client, ...update }`, mai mutazioni dirette — ma è un'insidia
  frequente in codice simile scritto da zero), il rollback ripristinerebbe uno stato già
  corrotto.

## Best Practice

**Perché ha senso duplicare il calcolo invece di aspettare sempre il server.** L'alternativa
all'optimistic update sarebbe uno spinner ad ogni campionamento/XP salvato, per centinaia di
millisecondi (roundtrip client → Cloud Function `europe-west1` → Firestore → risposta). Per
un'azione che un trainer ripete decine di volte in una sessione in palestra, quella latenza
percepita si accumula in una sensazione di lentezza generale dell'app. Calcolare
approssimativamente in anticipo il risultato — che nella stragrande maggioranza dei casi è
*esattamente* corretto, dato che la logica è la stessa — è un compromesso ragionevole.

**Il rischio implicito, discusso onestamente — con una prova reale, non ipotetica.** Se le due
copie del calcolo divergono in modo più sostanziale di un testo di log (es. una soglia XP
cambiata in un file e non nell'altro, o un bug corretto in uno solo dei due), l'utente vede per
un istante — fino al prossimo refetch o al prossimo `onSnapshot` (Lezione 15) — un valore
ottimistico *sbagliato*, che poi "salta" al valore corretto. È un'esperienza peggiore di uno
spinner onesto, perché sembra un bug dell'app piuttosto che un semplice ritardo. Questo non è
un rischio teorico: le tre divergenze descritte in questa lezione (`LOG_MAX_ENTRIES`, testo del
log campionamento, testo del log XP) sono realmente successe, sono state trovate leggendo il
codice per scrivere questa lezione, e sono state corrette — ma **senza un meccanismo che tenga
sincronizzate le due copie**, niente impedisce che succeda di nuovo domani con una modifica
qualsiasi a uno dei due file. Non c'è ancora, oggi, un test automatico di parità: è esattamente
il gap che la Challenge di questa lezione ti chiede di colmare. La soluzione più robusta — un
unico modulo di calcolo condiviso tra frontend e Cloud Functions (possibile in un monorepo con
un package interno) — non è stata scelta qui, probabilmente per mantenere i due runtime
(browser/Vite vs Node.js/Cloud Functions) completamente indipendenti nel build; è un trade-off
legittimo, ma va gestito con disciplina — un controllo automatico, anche minimo — non lasciato
alla sola memoria di chi scrive codice.

## Quiz

1. Nel pattern optimistic update di `handleCampionamento`, in che ordine avvengono le operazioni?
   - A) Prima la chiamata a Firestore, poi l'aggiornamento dello stato React
   - B) Prima l'aggiornamento dello stato React, poi la chiamata asincrona
   - C) In parallelo, senza un ordine garantito
   - D) Solo la chiamata asincrona; lo stato React si aggiorna al successivo render automatico

2. Cosa rappresenta `snapshot` in `handleCampionamento` (`useClients.js:62`)?
   - A) Una copia profonda (deep clone) del cliente
   - B) Un riferimento all'oggetto `client` così com'era prima dell'update ottimistico
   - C) Il risultato calcolato da `buildCampionamentoUpdate`
   - D) Lo stato restituito dalla Cloud Function dopo il salvataggio

3. Perché `handleCampionamento` chiama sia `updateLocal` sia `dispatch({ type: ACTIONS.SELECT_CLIENT, ... })`?
   - A) È ridondante, uno dei due basterebbe
   - B) Perché i dati del cliente esistono in due posti diversi (array `clients` dell'hook + `selectedClient` in `TrainerContext`) che vanno tenuti sincronizzati
   - C) Perché `dispatch` serve solo per il rollback, non per l'update ottimistico
   - D) Perché `updateLocal` non modifica realmente lo stato, serve solo a `dispatch` a farlo

4. Cosa succede al parametro `update` passato a `saveCampionamentoUseCase(orgId, client, update, testValues)`?
   - A) Viene inviato alla Cloud Function e scritto direttamente su Firestore
   - B) Viene ignorato: la Cloud Function ricalcola tutto da `testValues`
   - C) Viene usato solo come cache per evitare un ricalcolo lato server
   - D) Viene confrontato con il risultato del server e, se diverso, genera un errore

5. Perché `handleAddClient` NON segue il pattern optimistic update come gli altri handler?
   - A) Perché creare un cliente è un'operazione troppo rara per giustificarlo
   - B) Perché il rank/XP/id iniziali sono calcolati e normalizzati dalla Cloud Function, e mostrare un valore "inventato" prima della risposta introdurrebbe più rischi che benefici
   - C) Perché `useCallback` non supporta l'optimistic update per funzioni async con più di un parametro
   - D) È un refuso: dovrebbe essere ottimistico ma manca il codice

6. In caso di errore, cosa fa il blocco `catch` di `handleCampionamento`?
   - A) Richiama `buildCampionamentoUpdate` con dati diversi
   - B) Ripristina lo stato con `snapshot` in entrambi i posti (updateLocal + dispatch) e mostra un toast di errore
   - C) Ritenta automaticamente la chiamata a `saveCampionamentoUseCase`
   - D) Elimina il cliente dalla lista locale

7. Cosa fa concretamente `buildXPUpdate` (o `buildCampionamentoUpdate`) come funzione?
   - A) Effettua una scrittura su Firestore e ritorna la Promise
   - B) È una funzione pura: stesso input → stesso output, nessun side effect, nessuna chiamata di rete
   - C) Effettua una chiamata alla Cloud Function e ne ritorna il risultato
   - D) Legge lo stato attuale di React tramite un hook interno

8. Oggi, qual è lo stato di `LOG_MAX_ENTRIES` lato client rispetto a lato server?
   - A) Sono identici: entrambi 200
   - B) Lato client è 200, lato server è 20
   - C) Lato client è 20, lato server è 200
   - D) Non esiste una costante `LOG_MAX_ENTRIES` lato server

9. Perché passare l'intero oggetto `toast` (da `useToast()`) nell'array di dipendenze di un `useCallback` è un problema, seppur minore?
   - A) Causa un errore a runtime
   - B) `useToast()` ritorna un nuovo oggetto letterale a ogni render, quindi l'handler memoizzato viene comunque ricreato ogni volta
   - C) `toast` non può essere usato dentro un `useCallback` per limitazioni di React
   - D) Impedisce al rollback di funzionare correttamente

10. `LOG_MAX_ENTRIES` e i testi di log sono stati trovati divergenti, poi allineati. Cosa dimostra questo episodio sul rischio della duplicazione del calcolo XP/rank tra client e server, anche ora che quelle tre righe specifiche sono state fixate?
    - A) Che il rischio era solo teorico e non si è mai concretizzato davvero
    - B) Che senza un controllo automatico di parità, un drift reale può insorgere e restare silenzioso finché qualcuno non rilegge entrambi i file a mano — è già successo una volta
    - C) Che il problema riguarda solo i testi di log, mai i valori numerici, per costruzione
    - D) Che la Cloud Function non ha accesso ai dati del cliente

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** Le righe 64-65 (`updateLocal` + `dispatch`) precedono l'`await` di riga 68: lo stato
   React si aggiorna *prima* che la chiamata asincrona parta davvero. È il cuore del pattern:
   A è l'opposto (pessimistico), C è sbagliato perché l'ordine nel codice è sequenziale e
   deterministico, D non descrive nulla che accada nel codice.
2. **B.** `const snapshot = client` (riga 62) è un semplice riferimento allo stesso oggetto,
   non una copia — ma dato che l'update successivo crea sempre nuovi oggetti con spread
   (`{...client, ...update}`), `client` originale non viene mutato, quindi funge comunque da
   fotografia valida. A è falso (nessun `structuredClone`/deep copy), C confonde `snapshot`
   con `update`, D non esiste nel codice: la Cloud Function non ritorna il nuovo stato del
   cliente a `saveCampionamentoUseCase`.
3. **B.** `clients` (stato dell'hook) e `selectedClient` (TrainerContext) sono due copie
   indipendenti della stessa entità, usate da parti diverse dell'albero dei componenti. A è
   falso proprio perché eliminando uno dei due si romperebbe la sincronizzazione; C è falso,
   entrambi partecipano sia all'update ottimistico che al rollback (righe 64-65 e 71-72); D è
   falso, `updateLocal` (definito righe 38-40) modifica realmente `clients` via `setClients`.
4. **B.** Il parametro si chiama `_update` in `saveCampionamentoUseCase.js` (underscore =
   intenzionalmente non usato) e il commento di riga 7 lo conferma esplicitamente: "Il BE
   calcola i percentili server-side dai valori grezzi". A è l'errore concettuale più pericoloso
   da fare qui — non è vero, e crederlo porterebbe a cercare bug nel posto sbagliato. C e D
   descrivono meccanismi che semplicemente non esistono nel codice.
5. **B.** Vedi il ragionamento sul contro-esempio: creare un cliente richiede id, rank e XP
   iniziali generati/normalizzati server-side (`buildNewClient`); inventarli lato client prima
   della risposta sarebbe più rischioso che utile, e infatti il codice aspetta la risposta
   (righe 47-57) prima di aggiungere il cliente alla lista. A è una motivazione plausibile ma
   non è quella che il codice suggerisce (la frequenza non è il criterio usato altrove — anche
   XP e campionamento sono operazioni comuni e sono comunque ottimistiche). C è inventato,
   `useCallback` non ha questa limitazione. D è falso, il comportamento è intenzionale (vedi
   anche il `throw err` finale, pensato per il flusso del wizard).
6. **B.** Righe 71-73: `updateLocal(client.id, snapshot)`, `dispatch(... payload: snapshot)`,
   `toast.error(...)`. A, C, D descrivono comportamenti assenti dal codice — non c'è retry
   automatico né eliminazione del cliente in caso di errore di campionamento.
7. **B.** Nessuna delle due funzioni fa `await`, `fetch`, o tocca `db`/Firestore: prendono dati
   in input e restituiscono un oggetto calcolato. Sono testabili in isolamento (vedi
   `__tests__/utils/gamification.test.js`). A, C, D attribuiscono a queste funzioni compiti che
   appartengono invece a `saveCampionamentoUseCase`/`saveXPUseCase`.
8. **A.** Verificato oggi: `src/constants/index.js:97` e `functions/src/shared/constants.js:4`
   valgono entrambi `200`. **Non era così** quando questa lezione è stata scritta la prima
   volta — allora la risposta corretta era C (20 client / 200 server). Se avevi in mente C da
   una lettura precedente, avevi ragione per lo stato di allora: è lo stesso principio delle
   domande equivalenti nelle Lezioni 11 e 13.
9. **B.** `useToast()` (righe 4-11 di `useToast.js`) ritorna `{ success, error, warning, info }`
   — un nuovo oggetto letterale ad ogni chiamata dell'hook, quindi ad ogni render — anche se
   internamente ogni singolo metodo è avvolto in `useCallback` con dipendenza stabile
   (`addToast`). Includere l'intero oggetto `toast` nelle dipendenze di un altro `useCallback`
   ne annulla la memoizzazione. Non è un errore di runtime (A è falso), React non vieta questo
   pattern (C è falso), e il rollback funziona comunque correttamente (D è falso) — è
   puramente un tema di performance/re-render evitabili.
10. **B.** Il rischio non era teorico: è successo davvero (tre divergenze reali, sezione "Le
    due copie sono ancora identiche?"), è stato scoperto solo perché qualcuno ha riletto
    entrambi i file riga per riga, ed è stato corretto — ma nulla impedisce che ricapiti con
    la prossima modifica a uno dei due file, perché non esiste ancora un controllo automatico
    di parità (è il tema della Challenge). A è smentita dai fatti: il rischio si è concretizzato
    una volta, quindi non era "solo teorico". C è falsa in linea di principio: nulla, nel modo
    in cui le due copie sono mantenute, impedisce strutturalmente che anche un valore numerico
    diverga in futuro — semplicemente non è ancora successo. D non è supportata da nessuna
    prova nel codice letto.

## Esercizi

1. **Facile.** Apri `src/utils/gamification.js` e `functions/src/shared/gamification.js`
   affiancati. Elenca tutte le funzioni esportate da entrambi i file e verifica quali esistono
   solo in uno dei due (suggerimento: `buildSessionUpdate` esiste in entrambi ma non risulta
   chiamata da nessun usecase attivo nel frontend — verificalo con una ricerca testuale).
2. **Facile-medio.** In `handleAddXP` (`useClients.js:78-91`), aggiungi (solo come esercizio
   locale, non serve committarlo) un `console.log('optimistic:', update)` subito dopo riga 79 e
   un secondo log dentro il `.then()` di una eventuale chiamata diretta a `getClientById` fatta
   subito dopo il successo di `saveXPUseCase`, per osservare con i tuoi occhi la differenza (se
   c'è) tra il valore ottimistico e quello effettivamente persistito.
3. **Medio.** Il testo del log per il campionamento *divergeva* tra client e server
   (dettagliato vs generico) — oggi non più. Senza guardare il codice sorgente della soluzione
   reale (punto 4 dell'Analisi del codice), prova prima a rispondere da solo: dato che la
   funzione server non ha accesso a `labelForTestValueKey` (serve `constants/tests.js`, mai
   importato lato `functions/`), quali sono le tue due opzioni architetturali per far
   coincidere i due testi? Elenca pro/contro di ciascuna, poi apri
   `src/usecases/saveCampionamentoUseCase.js` e `functions/src/shared/gamification.js` e
   verifica quale delle due è stata scelta davvero nel progetto.
4. **Medio-difficile.** `handleDeleteClient` fa rollback re-inserendo lo snapshot con
   `setClients(prev => [...prev, snapshot])` (riga 105), perdendo la posizione originale
   nell'array. Scrivi (su carta o in un file scratch, non nel progetto) una versione
   alternativa che reinserisca il cliente nella sua posizione originale usando l'indice
   salvato nello snapshot.
5. **Difficile.** Disegna (anche solo a parole, un elenco ordinato di eventi) uno scenario
   concreto in cui, aprendo la dashboard di un cliente sia dal lato trainer (che ha appena
   fatto un campionamento, stato ottimistico ancora "in volo") sia dal lato client (che ha la
   sua dashboard aperta con `useClient` in realtime — vedi Lezione 15) nello stesso istante, i
   due schermi mostrerebbero temporaneamente testi di log diversi per lo stesso evento. Quale
   dei due mostra il dato "vero" alla fine?

## Challenge

Nel file `src/utils/gamification.js`, la costante `MAX_CAMPIONAMENTI = 50` (riga 79) è
duplicata concettualmente da `functions/src/shared/constants.js:6` (`MAX_CAMPIONAMENTI = 50`,
già identica oggi). Come `LOG_MAX_ENTRIES`, è un numero magico duplicato in due file diversi con
zero garanzia di restare sincronizzato nel tempo.

Come esercizio di refactoring reale (da fare in un branch locale, senza aprire una PR — è
un esercizio, non un task del progetto): scrivi un piccolo script Node
(`scripts/check-shared-constants.mjs`, seguendo la convenzione `scripts/*.mjs` già in uso nel
progetto) che importi `src/constants/index.js` e `functions/src/shared/constants.js` ed emetta
un errore (`process.exit(1)`) se `LOG_MAX_ENTRIES`, `MAX_CAMPIONAMENTI` o
`XP_PER_LEVEL_MULTIPLIER` non coincidono tra i due file. Se lo scrivi oggi e lo lanci, non
troverà nulla — le tre costanti coincidono già (`LOG_MAX_ENTRIES` incluso, dopo il fix
descritto in questa lezione). Non serve integrarlo nella CI per questo esercizio: l'obiettivo
è capire, scrivendolo, quanto sarebbe stato facile prevenire *in anticipo* il drift reale
raccontato in questa lezione con un controllo automatico di poche righe, invece di scoprirlo
mesi dopo leggendo il codice a mano — e quanto, non essendo mai stato scritto, lo stesso tipo
di drift possa ripresentarsi silenziosamente in futuro su una qualsiasi delle tre costanti,
o su una nuova che verrà aggiunta.
