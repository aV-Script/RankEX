# Lezione 4 — useState e form controllati
[← Indice](00-indice.md)

## Obiettivo della lezione

Alla fine di questa lezione saprai spiegare, riga per riga, come funziona il form di login di
RankEX: da dove viene il valore che vedi scritto nell'input, cosa succede quando digiti un
carattere, perché il bottone si disabilita durante il login e perché tutta questa logica non
vive dentro il componente `LoginForm` ma in un hook separato, `useLoginForm`. Userai questo
schema come modello per leggere (e modificare in sicurezza) qualunque altro form del progetto.

## Concetti teorici

### 📎 Approfondimento: useState

`useState` è il modo con cui un componente funzione "ricorda" un valore tra un render e
l'altro. Senza di esso, ogni variabile dichiarata dentro un componente verrebbe azzerata a ogni
nuova esecuzione della funzione componente — perché un componente React **è** semplicemente una
funzione che React richiama ogni volta che deve ridisegnare quella parte di UI.

```js
const [email, setEmail] = useState('')
```

Tre cose da fissare bene:

1. **`useState('')` ritorna una coppia `[valore, setter]`.** Il valore (`email`) è "congelato"
   per tutta la durata di QUEL render: se lo leggi tre righe più sotto nella stessa funzione,
   vedrai sempre lo stesso valore, anche se nel frattempo qualcun altro ha chiamato `setEmail`.
   Questo è un dettaglio che sembra ovvio finché non lo dimentichi — lo riprendiamo a fondo
   nella Lezione 6 parlando di *closure*.
2. **Chiamare il setter (`setEmail(nuovoValore)`) non modifica `email` "sul posto".** Programma
   un nuovo render, in cui la funzione componente verrà rieseguita da capo e, questa volta,
   `useState('')` restituirà il nuovo valore al posto di quello iniziale. React tiene lui la
   "memoria" del valore corrente, associata a quello specifico componente montato — la funzione
   componente stessa è "stateless" tra un'esecuzione e l'altra, tutto lo stato vive fuori, in
   React.
3. **Gli aggiornamenti sono asincroni e raggruppati (batched).** Se chiami due setter di
   seguito nello stesso gestore di evento, React non ri-renderizza due volte: raccoglie gli
   aggiornamenti e fa un solo passaggio. Per il nostro form significa che chiamare
   `setLoading(true)` e poi `setError('')` nella stessa funzione produce un solo re-render, non
   due.

**Analogia:** pensa a `useState` come a un Post-it attaccato fuori dalla porta di un ufficio (il
componente). L'impiegato (la funzione componente) ogni mattina (ogni render) legge il Post-it
per sapere "a che punto ero rimasto". Non tiene nulla in testa da un giorno all'altro — se vuole
che l'informazione sopravviva, deve scriverla sul Post-it (chiamare il setter) prima di andare
via. Il giorno dopo (il render successivo) troverà scritto il nuovo valore.

### Il pattern "controlled input"

In HTML puro, un `<input>` tiene il proprio valore internamente, nel DOM: tu lo leggi quando ti
serve (`input.value`). In React, il pattern standard è l'opposto: **lo stato React è la fonte di
verità, l'input è solo uno specchio.**

```jsx
<input value={email} onChange={e => setEmail(e.target.value)} />
```

- `value={email}` dice al DOM "il tuo contenuto DEVE essere sempre uguale a `email`" — se
  `email` non cambia, l'utente non può digitare nulla (l'input sembrerebbe "bloccato", perché
  ogni tentativo di digitare verrebbe subito sovrascritto dal valore React al render successivo).
- `onChange={e => setEmail(e.target.value)}` è quello che chiude il cerchio: intercetta ogni
  tasto premuto, prende il nuovo valore dal DOM (`e.target.value`) e lo scrive nello stato React.
  Solo a quel punto React ri-renderizza l'input con `value={email}` aggiornato, e l'utente vede
  il carattere appena digitato apparire.

Il motivo per cui questo doppio giro sembra "ridondante" ma è voluto: se React non possedesse il
valore, non avresti modo di leggerlo altrove (per validarlo, per disabilitare un bottone, per
inviarlo a Firebase) senza andare a interrogare il DOM manualmente — cosa che React è pensato
apposta per evitarti.

### Stato di errore e di caricamento in un form asincrono

Un form che chiama un servizio esterno (qui: Firebase Auth) ha bisogno di raccontare
all'utente tre cose diverse, in tre momenti diversi: *sto aspettando una risposta*
(`loading`), *qualcosa è andato storto* (`error`), *va tutto bene, procedi* (nessuno dei due).
Vedremo che in `useLoginForm` questi tre stati sono modellati con **due `useState` separati**
(`error`, `loading`) invece che con un unico oggetto `status`.

## Dove compare nel progetto

- [`src/features/auth/useLoginForm.js`](../../src/features/auth/useLoginForm.js) — l'hook che
  possiede tutto lo stato del form (view, email, password, error, loading) e i gestori di submit.
- [`src/features/auth/LoginPage.jsx`](../../src/features/auth/LoginPage.jsx) — il componente
  "orchestratore": chiama `useLoginForm()` una sola volta e decide quale sotto-vista mostrare in
  base a `form.view`.
- [`src/features/auth/components/LoginForm.jsx`](../../src/features/auth/components/LoginForm.jsx)
  — il form vero e proprio, con gli input controllati email/password.
- [`src/features/auth/components/ResetForm.jsx`](../../src/features/auth/components/ResetForm.jsx)
  — form di recupero password, stesso pattern, stesso hook condiviso.

## Analisi del codice

### 1. Gli useState dell'hook (`useLoginForm.js`, righe 7-12)

```js
export function useLoginForm() {
  const [view,     setView]     = useState('login') // 'login' | 'reset' | 'reset_sent'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
```

Cinque `useState` indipendenti, non un unico oggetto `{ view, email, password, error, loading }`.
È una scelta precisa, non pigrizia: con cinque stati separati, ogni setter aggiorna **solo** il
proprio pezzo di stato, senza bisogno di spread (`setState(prev => ({ ...prev, email: x }))`).
Il rischio che evita: dimenticare di "spargere" (`...prev`) gli altri campi e cancellarli per
errore — un bug classico dei form con stato a oggetto singolo. Il prezzo che si paga: se in
futuro il form crescesse a 15 campi, cinque `useState` diventerebbero quindici righe di
dichiarazioni — a quel punto avrebbe senso passare a `useReducer` (lo vedrai nella Lezione 7).
Per un form con cinque campi, cinque `useState` piatti sono la scelta più leggibile.

`view` è lo stato che decide quale "schermata" mostrare all'interno dello stesso box di login:
`'login'`, `'reset'` o `'reset_sent'`. Nota che è **anche lui** un `useState`, non un router o
una prop: è UI locale a questa singola pagina, non merita altro.

### 2. `handleLogin` — submit asincrono con gestione errore/loading (righe 16-33)

```js
const handleLogin = async (e) => {
  e.preventDefault()
  const emailCheck = validateEmail(email)
  if (!emailCheck.valid)      { setError(emailCheck.error); return }
  if (!password)              { setError('Password obbligatoria'); return }
  setLoading(true)
  clearError()
  try {
    await login(email.trim(), password)
    await auditLog(AUDIT_ACTIONS.LOGIN)
    // il redirect avviene nel router tramite onAuthChange
  } catch (err) {
    auditLog(AUDIT_ACTIONS.LOGIN_FAILED, { email: email.trim() })
    setError(getFirebaseErrorMessage(err, 'Errore di accesso'))
  } finally {
    setLoading(false)
  }
}
```

Blocco per blocco:

- `e.preventDefault()` (riga 17) — un `<form onSubmit={...}>` in HTML per default ricarica la
  pagina inviando i dati a un endpoint. `preventDefault()` è quello che rende possibile gestire
  il submit interamente via JavaScript/React invece di lasciar fare al browser. **Ometterlo è
  l'errore numero uno** che si commette copiando questo pattern: la pagina si ricaricherebbe da
  zero a ogni tentativo di login, perdendo tutto lo stato.
- Validazione sincrona (righe 18-20) — prima ancora di toccare `loading`, il codice valida
  email e password con `validateEmail` (da `utils/validation.js`) e ritorna presto (`return`)
  con `setError(...)` se qualcosa non va. Nota: qui `loading` non viene mai messo a `true` per
  questi casi — è corretto, perché non sta partendo nessuna chiamata di rete, quindi non c'è
  nulla da "aspettare".
- `setLoading(true)` + `clearError()` (righe 21-22) — **solo ora**, dopo aver superato la
  validazione locale, il form entra in stato "sto chiamando Firebase". `clearError()` è
  definita alla riga 14 (`const clearError = () => setError('')`) — pulisce un eventuale
  errore del tentativo precedente prima di ritentare.
- `try { await login(...) }` (riga 24) — `login` viene da
  [`firebase/services/auth.js`](../../src/firebase/services/auth.js)
  (`export const login = (email, pw) => signInWithEmailAndPassword(auth, email, pw)`), quindi è
  una Promise: `await` sospende l'esecuzione di `handleLogin` finché Firebase non risponde,
  senza bloccare il resto dell'app (il componente resta interattivo, semplicemente questa
  funzione è "in pausa").
- Il commento alla riga 26 (`// il redirect avviene nel router tramite onAuthChange`) è
  fondamentale per capire l'architettura: `handleLogin` **non** fa `navigate('/dashboard')` in
  caso di successo. Il redirect è un effetto collaterale di un `onAuthStateChanged` altrove
  (`useAuth`, vedi Lezione 9) che osserva il cambio di utente Firebase — `useLoginForm` non deve
  sapere nulla di routing, gli basta far riuscire il login.
- `catch (err)` (righe 27-29) — in caso di fallimento, registra un audit log
  (`AUDIT_ACTIONS.LOGIN_FAILED`, senza `await`: è "fire and forget", il form non aspetta che
  l'audit log sia scritto per mostrare l'errore) e traduce l'errore tecnico di Firebase in un
  messaggio leggibile con `getFirebaseErrorMessage`.
- `finally { setLoading(false) }` (righe 30-32) — **sempre** eseguito, sia che il login riesca
  sia che fallisca. Se questo `finally` mancasse, un login fallito lascerebbe il bottone
  bloccato su "ATTENDERE..." per sempre. È il dettaglio che distingue un form robusto da uno
  fragile.

### 3. `handleReset` — stesso scheletro, riuso deliberato (righe 35-49)

```js
const handleReset = async (e) => {
  e.preventDefault()
  const emailCheck = validateEmail(email)
  if (!emailCheck.valid) { setError(emailCheck.error); return }
  setLoading(true)
  clearError()
  try {
    await resetPassword(email.trim())
    setView('reset_sent')
  } catch (err) {
    setError(getFirebaseErrorMessage(err, 'Impossibile inviare il link'))
  } finally {
    setLoading(false)
  }
}
```

Stessa struttura di `handleLogin` (valida → `loading` on → try/catch/finally), ma il successo
non richiama nessun redirect esterno: chiama direttamente `setView('reset_sent')` (riga 43),
che è uno stato **locale a questo stesso hook**. Qui il "successo" non dipende da un sistema
esterno (Firebase Auth che notifica un cambio di utente) come nel login, quindi lo stato può
essere gestito interamente dentro `useLoginForm`.

### 4. `goTo` e il valore ritornato (righe 51-58)

```js
const goTo = (nextView) => { setView(nextView); clearError() }

return {
  view, email, password, error, loading,
  setEmail, setPassword,
  handleLogin, handleReset,
  goTo,
}
```

`goTo` cambia vista **e** pulisce l'errore in un colpo solo — utile per quando l'utente clicca
"Password dimenticata?" mentre c'è ancora un vecchio messaggio di errore a schermo: senza questo
dettaglio, l'errore del login resterebbe visibile anche nella schermata di reset, disorientando
l'utente.

L'hook ritorna un **oggetto piatto** con tutto quello che serve alla UI: valori, setter grezzi
(`setEmail`, `setPassword` — passati diretti, senza wrapper) e gestori già pronti
(`handleLogin`, `handleReset`, `goTo`). Questo oggetto è quello che in `LoginPage.jsx` (riga 8)
viene chiamato `form` e passato per intero ai componenti figli come prop unica.

### 5. `LoginPage.jsx` — chi decide cosa mostrare (righe 7-27)

```jsx
export default function LoginPage() {
  const form = useLoginForm()

  return (
    <div className="min-h-screen flex">
      <BrandingPanel />
      ...
      <div className="w-full max-w-[360px]">
        {form.view === 'login'      && <LoginForm     form={form} />}
        {form.view === 'reset'      && <ResetForm     form={form} />}
        {form.view === 'reset_sent' && <ResetSentView form={form} />}
      </div>
    </div>
  )
}
```

`LoginPage` chiama l'hook **una sola volta** (riga 8) e passa lo stesso oggetto `form` a
qualunque sotto-vista sia attiva. Non c'è duplicazione di stato: se ci fossero tre `useState`
separati dentro `LoginForm`, `ResetForm` e `ResetSentView`, cambiare vista significherebbe
perdere tutto — invece qui `email` sopravvive anche passando da `'login'` a `'reset'`, perché lo
stato vive un livello più in alto, nell'hook condiviso.

### 6. `LoginForm.jsx` — l'input controllato e uno stato *veramente* locale (righe 18-42, 55-66)

```jsx
export function LoginForm({ form }) {
  const { email, password, error, loading, setEmail, setPassword, handleLogin, goTo } = form
  const [showPassword, setShowPassword] = useState(false)
  ...
  <input
    id="login-email"
    type="email"
    className="input-base w-full"
    value={email}
    onChange={e => setEmail(e.target.value)}
    autoFocus
  />
```

Il componente riceve `form` come prop e ne destruttura solo i pezzi che gli servono (riga 19) —
non deve sapere che `email` è stato prodotto da un `useState` dentro un altro file, gli basta
sapere che è una stringa e che `setEmail` la aggiorna.

La riga 20 è interessante per contrasto: `const [showPassword, setShowPassword] = useState(false)`
è un **nuovo** `useState`, dichiarato qui, non nell'hook. Perché? Perché "l'input password è
visibile in chiaro o mascherato" è uno stato che **non serve a nessun altro componente**, non fa
parte della logica di business del login, e sparire quando l'utente cambia vista (da `login` a
`reset`) è comportamento corretto, non un bug. Questo è il criterio pratico da portarti via:

> Se lo stato serve a più di un componente, o deve sopravvivere quando il componente che lo usa
> ora smette di essere renderizzato → sale in un hook condiviso (o in un Context, Lezione 7).
> Se è puramente estetico/temporaneo a QUEL componente → resta un `useState` locale lì.

Il bottone occhio che alterna `showPassword` (righe 55-66) usa il pattern updater-funzione:
`onClick={() => setShowPassword(v => !v)}` — passa a `setShowPassword` una funzione che riceve
il valore corrente e ne calcola il successivo, invece di leggere `showPassword` "dal di fuori" e
scrivere `setShowPassword(!showPassword)`. Con un solo click consecutivo la differenza non si
vede, ma è la forma robusta: se React dovesse mai raggruppare due toggle nello stesso batch,
`v => !v` garantisce comunque il risultato corretto perché parte sempre dal valore vero più
recente, non da quello "congelato" nella closure del render in cui è stato creato l'handler.

### 7. Il bottone che si autodisabilita

```jsx
{error && <ErrorBox>{error}</ErrorBox>}
<Button type="submit" variant="primary" loading={loading}>ACCEDI</Button>
```

`loading` (che arriva dall'hook) viene passato diretto al componente `Button` (definito in
[`components/ui/index.jsx`](../../src/components/ui/index.jsx), righe 243-264), che internamente
fa `disabled={loading || disabled}` e mostra il testo `'ATTENDERE...'` al posto dei children
quando `loading` è vero. Notare la disciplina: **nessun componente ridecide da solo se disabilitare
il bottone** — la fonte di verità è un solo booleano, propagato in giù, letto in un solo punto.

## Diagramma mentale

```
useLoginForm()  (un solo hook, uno stato condiviso)
│
│  view, email, password, error, loading   ← 5 useState indipendenti
│  handleLogin, handleReset, goTo          ← funzioni che leggono/scrivono quello stato
│
▼
LoginPage.jsx
│  const form = useLoginForm()   ← chiamato UNA volta
│
├── form.view === 'login'      → <LoginForm form={form} />
├── form.view === 'reset'      → <ResetForm form={form} />
└── form.view === 'reset_sent' → <ResetSentView form={form} />

Dentro LoginForm.jsx:
  input value={email} onChange={... setEmail ...}
        │                              │
        │  ogni tasto premuto ─────────┘
        │
        ▼
  setEmail(nuovoValore) → React pianifica re-render
        │
        ▼
  LoginForm viene rieseguito → value={email} ora riflette il nuovo valore
        │
        ▼
  submit → handleLogin(e)
        │
        ├─ e.preventDefault()
        ├─ validazione locale (sincrona)
        ├─ setLoading(true) ────────────────► Button mostra "ATTENDERE..."
        ├─ await login(email, password)  (Firebase Auth)
        │      ├─ successo → nessun redirect qui (lo fa onAuthChange altrove)
        │      └─ errore   → setError(messaggio) ─► <ErrorBox> visibile
        └─ finally setLoading(false) ───────► Button torna cliccabile
```

## Errori comuni

1. **Dimenticare `e.preventDefault()`** in un nuovo `onSubmit`: il browser ricarica la pagina,
   `handleLogin` sembra "non fare nulla" perché il reload avviene prima che tu possa vedere
   l'effetto della chiamata asincrona.
2. **Usare `defaultValue` invece di `value`** su un input che vuoi controllato: React lo
   considera "non controllato" (uncontrolled) e ti avvisa in console con un warning se poi provi
   a mescolare i due pattern nello stesso ciclo di vita dell'input — sintomo tipico:
   `setEmail` viene chiamato ma l'input non si aggiorna mai.
3. **Rimuovere il `finally`** pensando che basti il `catch`: in caso di successo `loading`
   resterebbe bloccato a `true` per sempre, perché nel ramo `try` non c'è nessun `setLoading(false)`
   esplicito — è proprio quello il motivo per cui il codice usa `finally` invece di ripetere
   `setLoading(false)` sia nel ramo di successo che in quello di errore.
4. **Validare e mostrare `setError` ma dimenticare `return`**: se togli il `return` alla riga 19
   (`if (!emailCheck.valid) { setError(emailCheck.error); return }`), l'esecuzione prosegue
   comunque fino a `setLoading(true)` e alla chiamata a `login(...)` con un'email non valida —
   Firebase la rifiuterebbe comunque, ma avresti fatto una chiamata di rete inutile e mostrato
   per un attimo lo stato di loading senza motivo.
5. **Mettere `showPassword` nell'hook `useLoginForm`** pensando "tutto lo stato del form deve
   stare lì": funzionerebbe, ma sposteresti dettagli di UI puramente locali (un toggle
   estetico) in un hook che dovrebbe occuparsi solo di logica di business — la prossima persona
   che legge `useLoginForm.js` si troverebbe a chiedersi perché la visibilità della password
   "vive" insieme alla logica di autenticazione.

## Best Practice

**Codice attuale — 5 `useState` piatti in `useLoginForm`:**
```js
const [email,    setEmail]    = useState('')
const [password, setPassword] = useState('')
const [error,    setError]    = useState('')
```
Pro: ogni setter è indipendente, nessun rischio di spread dimenticato, leggibilissimo per un
form di questa dimensione (5 campi). Contro (solo se il form crescesse molto): tante righe di
boilerplate, nessuna "storia" esplicita di quali transizioni di stato sono legali (a differenza
di un reducer con azioni nominate — vedi Lezione 7). Per un login/reset a 2 campi, la scelta
attuale è quella giusta: introdurre `useReducer` qui sarebbe complessità non giustificata dal
problema reale.

**Bottone che deriva `disabled` da `loading` invece di duplicare la logica:**
```jsx
<Button type="submit" variant="primary" loading={loading}>ACCEDI</Button>
```
è preferibile a scrivere manualmente `disabled={loading}` E gestire separatamente il testo del
bottone in `LoginForm` — qui la responsabilità "cosa succede visivamente quando si carica" è
centralizzata in un solo componente (`Button`), e `LoginForm` si limita a comunicargli lo stato,
senza duplicare `if (loading) ... else ...` in ogni punto in cui appare un bottone di submit nel
progetto.

**Un solo `error` stringa, non un errore per campo:** `Field` (in `components/ui/index.jsx`)
supporta già una prop `error` per singolo campo (righe 283-306), ma `LoginForm` non la usa —
preferisce un unico `<ErrorBox>{error}</ErrorBox>` sotto entrambi gli input. È una scelta
coerente con la semplicità del form (login ha in pratica un solo tipo di errore possibile:
"le credenziali non vanno bene"), ma se in futuro servisse distinguere "email malformata" da
"password sbagliata" con due messaggi posizionati vicino al campo giusto, `error` andrebbe
diviso in `emailError`/`passwordError` — cosa che oggi non serve, quindi non è stata fatta.

## Quiz

1. Cosa succede se chiami `setEmail('nuovo@valore.it')` dentro `handleLogin`?
   A. Il valore di `email` cambia immediatamente, anche nella riga successiva dello stesso `handleLogin`
   B. React pianifica un re-render di `useLoginForm`/`LoginForm`; solo al render successivo `email` rifletterà il nuovo valore
   C. Il DOM dell'input viene aggiornato subito, ma lo stato React resta quello vecchio
   D. Non succede nulla finché non si chiama `handleLogin` una seconda volta

2. Perché `handleLogin` chiama `e.preventDefault()` come prima istruzione?
   A. Per impedire che l'utente digiti altri caratteri durante il login
   B. Per evitare che il browser ricarichi la pagina inviando il form in modo tradizionale
   C. È obbligatorio per qualunque funzione `async` in React
   D. Per bloccare l'evento `onChange` degli input

3. Cosa succederebbe se rimuovessi il blocco `finally { setLoading(false) }` da `handleLogin` e lo sostituissi con `setLoading(false)` solo dentro il `catch`?
   A. Nessuna differenza, sono equivalenti
   B. In caso di login riuscito, `loading` resterebbe `true` per sempre
   C. Il form smetterebbe di validare l'email
   D. `handleLogin` non verrebbe più chiamata dal submit

4. Nell'input email di `LoginForm.jsx`, a cosa serve la prop `onChange`?
   A. A validare l'email ad ogni tasto premuto
   B. A sincronizzare lo stato React (`email`) con quello che l'utente digita nel DOM
   C. A inviare il form quando l'utente preme Invio
   D. A impostare il valore iniziale dell'input

5. Perché `showPassword` è dichiarato con un `useState` locale in `LoginForm.jsx` e non dentro `useLoginForm.js`?
   A. Per un limite tecnico di React, gli hook custom non possono avere più di 5 `useState`
   B. Perché è uno stato puramente di UI, specifico di quel componente, che non serve altrove
   C. Perché `useLoginForm` non può contenere `useState` di tipo booleano
   D. È un errore del codice, dovrebbe stare nell'hook

6. Cosa fa `goTo('reset')` (riga 51 di `useLoginForm.js`)?
   A. Naviga a una nuova route con React Router
   B. Cambia `view` a `'reset'` e pulisce l'eventuale errore precedente
   C. Chiama `resetPassword` su Firebase
   D. Resetta tutti i campi del form a stringa vuota

7. Se in `handleLogin` dimenticassi il `return` dopo `setError(emailCheck.error)` in caso di email non valida, cosa accadrebbe?
   A. Il codice non compilerebbe
   B. L'esecuzione proseguirebbe comunque fino a chiamare `login(...)` con l'email non valida
   C. `setError` non verrebbe mai chiamato
   D. Il form si bloccherebbe permanentemente in stato di loading

8. Perché `LoginPage.jsx` chiama `useLoginForm()` una sola volta, invece di farlo dentro ciascuno dei tre sotto-componenti (`LoginForm`, `ResetForm`, `ResetSentView`)?
   A. Perché un hook può essere chiamato una sola volta per intera applicazione
   B. Per condividere lo stesso stato (es. `email`) tra le viste, invece di crearne copie indipendenti che andrebbero perse cambiando vista
   C. Perché altrimenti Firebase Auth lancerebbe un errore
   D. Non c'è un motivo tecnico, è solo una preferenza stilistica senza conseguenze

9. Cosa fa il componente `Button` quando riceve `loading={true}`?
   A. Niente, `loading` è ignorato
   B. Nasconde il bottone completamente
   C. Lo disabilita e mostra il testo "ATTENDERE..." al posto dei children
   D. Lo trasforma in un link

10. Qual è la differenza pratica tra `setShowPassword(!showPassword)` e `setShowPassword(v => !v)`?
    A. Nessuna, sono sempre equivalenti in ogni circostanza
    B. La seconda forma calcola il nuovo valore a partire dal valore più recente garantito da React, la prima si basa sul valore "congelato" nella closure del render corrente
    C. La prima è più veloce da eseguire
    D. La seconda funziona solo con i booleani

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** `useState` non aggiorna il valore in-place: pianifica un nuovo render. Nella stessa
   esecuzione di `handleLogin`, `email` letto due righe dopo `setEmail(...)` sarebbe ancora il
   vecchio valore — è la natura "congelata per il render corrente" descritta nell'Approfondimento.
2. **B.** È esattamente il comportamento di default di un `<form>` HTML che `preventDefault()`
   disattiva, lasciando la gestione del submit interamente a `handleLogin`.
3. **B.** `finally` viene eseguito sia in caso di successo che di errore; spostando
   `setLoading(false)` solo nel `catch`, un login riuscito (nessun errore lanciato) non
   eseguirebbe mai quella riga.
4. **B.** È il cuore del pattern controlled input: senza `onChange` l'input mostrerebbe sempre
   `value={email}` e ignorerebbe qualunque digitazione dell'utente.
5. **B.** Criterio del "dove vive lo stato": se serve solo a un componente e non deve
   sopravvivere al cambio di vista, resta locale a quel componente.
6. **B.** Guarda il codice: `const goTo = (nextView) => { setView(nextView); clearError() }` —
   nessuna chiamata di rete, nessun router coinvolto.
7. **B.** Senza `return`, l'esecuzione prosegue linearmente fino a `login(email.trim(), password)`
   anche con un'email invalida — Firebase la rifiuterebbe comunque a livello suo, ma il flusso
   locale ha comunque proseguito oltre il punto in cui l'errore era già stato rilevato.
8. **B.** Se ogni sotto-vista chiamasse `useLoginForm()` per conto proprio, ognuna avrebbe la
   propria istanza indipendente di `email`/`password`/ecc — passando da 'login' a 'reset'
   l'email digitata andrebbe persa, perché ogni chiamata a un hook crea un nuovo stato isolato.
9. **C.** Confermato dal codice di `Button` (righe 243-264):
   `disabled={loading || disabled}` e `{loading ? 'ATTENDERE...' : children}`.
10. **B.** La forma a funzione (`v => !v`) riceve sempre il valore più aggiornato che React ha
    in quel momento, indipendentemente da eventuali batching; la forma diretta legge invece
    `showPassword` così com'era al momento in cui quella specifica funzione handler è stata
    creata (cioè nel render corrente).

## Esercizi

1. **Facile.** In `LoginForm.jsx`, aggiungi un `console.log('render LoginForm')` in cima al
   corpo del componente e osserva in console quante volte viene stampato mentre digiti
   nell'email — collega ogni stampa a una chiamata di `setEmail`.
2. **Facile.** Aggiungi, sempre in `LoginForm.jsx`, un piccolo contatore di caratteri sotto il
   campo password (es. "8 caratteri") usando solo `password.length` — non serve un nuovo
   `useState`, è un valore derivato da uno stato già esistente.
3. **Medio.** Disabilita il bottone ACCEDI (oltre che con `loading`) anche quando `email` o
   `password` sono vuoti, senza toccare `useLoginForm.js` — fallo leggendo `form.email` e
   `form.password` direttamente in `LoginForm.jsx` e passando il risultato booleano come prop
   `disabled` a `Button`.
4. **Medio.** Prova a riscrivere (solo mentalmente o su un file di scratch, non nel progetto)
   `useLoginForm` sostituendo i 5 `useState` con un unico `useState({ view, email, password,
   error, loading })`. Riscrivi `handleLogin` con questo nuovo stato e conta quante volte devi
   usare lo spread `...prev`. Confronta la leggibilità con l'originale.
5. **Difficile.** Aggiungi un nuovo `view = 'register'` (solo la UI, senza collegarla a nessuna
   vera creazione account) e un link "Non hai un account?" in `LoginForm.jsx` che chiama
   `goTo('register')`. Aggiungi il ramo corrispondente in `LoginPage.jsx`. L'obiettivo
   dell'esercizio è capire quanto sia facile estendere il pattern a stati (`view`) esistente
   senza toccare la logica di login/reset già scritta.

## Challenge

Implementa un contatore di tentativi di login falliti **usando solo `useState`** (nessun timer,
nessun `useEffect` — li vedrai nella prossima lezione):

1. Aggiungi un nuovo `useState(0)` chiamato `failedAttempts` dentro `useLoginForm.js`.
2. Nel `catch` di `handleLogin`, incrementa `failedAttempts` (`setFailedAttempts(n => n + 1)`)
   ogni volta che il login fallisce.
3. Nel ramo di successo (dopo `await login(...)`), resetta `failedAttempts` a `0`.
4. Quando `failedAttempts >= 3`, mostra in `LoginForm.jsx` un messaggio aggiuntivo ("Troppi
   tentativi falliti, verifica le credenziali") e disabilita il bottone ACCEDI finché l'utente
   non modifica di nuovo `email` o `password` (suggerimento: puoi resettare `failedAttempts` a
   `0` anche dentro `setEmail`/`setPassword`, o esporre dall'hook un `resetAttempts` da chiamare
   negli `onChange` degli input).

Nella Lezione 5 vedrai come trasformare questo contatore in un vero blocco temporizzato (es. "
riprova tra 15 secondi") usando `useEffect` e `setTimeout` — qui l'obiettivo è restare
rigorosamente dentro i confini di `useState` per consolidare quanto visto in questa lezione.
