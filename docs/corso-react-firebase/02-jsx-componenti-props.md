# Lezione 2 — JSX, componenti funzionali e props
[← Indice](00-indice.md)

## Obiettivo della lezione

Imparare a leggere qualunque componente React del progetto guardando cosa "entra" (props) e cosa
"esce" (JSX), usando come laboratorio `components/ui/index.jsx` — la libreria di componenti UI
condivisi di RankEX (Card, Badge, RankBadge, DayTabs, SegmentedToggle, Modal...) — e capire perché
il progetto preferisce sistematicamente ternari inline in `style` invece di classi CSS multiple
per gestire le varianti visive.

## Concetti teorici

### JSX: zucchero sintattico su `createElement`

Nella Lezione 1 abbiamo accennato che JSX non è HTML: è sintassi che Vite (tramite il plugin
`@vitejs/plugin-react`) trasforma, in fase di build, in chiamate a funzione. Concretamente:

```jsx
<Badge color="#0fd65a">Attivo</Badge>
```

diventa, concettualmente, qualcosa come:

```js
React.createElement(Badge, { color: '#0fd65a' }, 'Attivo')
```

`createElement` non "disegna" nulla sullo schermo: ritorna un semplice **oggetto JavaScript** che
descrive *cosa* si vuole vedere ("un elemento di tipo `Badge`, con questa prop `color`, e questo
contenuto"). È esattamente il "Virtual DOM" di cui parlavamo nella Lezione 1: un albero di questi
oggetti descrittivi, che React confronta con l'albero precedente per capire cosa è cambiato.

### Componente funzionale

Un componente React in questo progetto (e nella stragrande maggioranza del codice React moderno)
è semplicemente **una funzione JavaScript che riceve un oggetto (le props) e ritorna JSX**:

```jsx
function Badge({ color, children }) {
  return <span style={{ color }}>{children}</span>
}
```

Non c'è magia: `Badge` è una funzione come un'altra. La differenza rispetto a una funzione
"normale" è convenzionale (nome che inizia con maiuscola, così JSX sa distinguere `<Badge />`
— "chiama questa funzione componente" — da `<span />` — "crea questo tag HTML nativo") e
comportamentale: React la richiama ogni volta che ritiene necessario aggiornare l'interfaccia
(dopo un cambio di stato, di props, ecc.), da cui il nome "render" — ogni chiamata alla funzione
è un nuovo tentativo di descrivere come dovrebbe apparire l'interfaccia in quel momento.

### Props: l'unico canale di ingresso

Le **props** (abbreviazione di "properties") sono l'unico modo in cui un componente riceve dati
dall'esterno — dal componente che lo usa (il "genitore"). Sono sempre un singolo oggetto
JavaScript, che per convenzione si destruttura subito nei parametri della funzione:

```jsx
export function SectionLabel({ children, color = 'var(--rx-accent)', className = '' }) {
```

Qui `{ children, color = ..., className = '' }` non è un secondo/terzo/quarto parametro: è **un
solo parametro**, un oggetto, di cui si estraggono tre proprietà con destructuring. `color = 'var(--rx-accent)'`
è un **valore di default**: se chi usa `<SectionLabel>` non passa esplicitamente `color`, la
variabile locale `color` varrà `'var(--rx-accent)'`. Se invece la prop è passata (anche con valore
`undefined` esplicito), il default JavaScript si applica comunque solo quando il valore è
`undefined` — non quando è `null`, `0` o `''`.

### `children`: la prop speciale

`children` è una prop come le altre nel senso tecnico (è solo una chiave dell'oggetto props), ma
ha un trattamento sintattico speciale: tutto quello che scrivi *tra* il tag di apertura e quello di
chiusura di un componente diventa automaticamente il suo `children`:

```jsx
<Card>
  <p>Testo qualsiasi</p>
</Card>
```

è equivalente a `<Card children={<p>Testo qualsiasi</p>} />`. È il meccanismo che rende possibile
la **composizione**: un componente come `Card` non ha bisogno di sapere *cosa* conterrà — riceve
un blocco di JSX già pronto e lo posiziona dove vuole nel proprio output.

> ### 📎 Approfondimento: composizione vs. varianti via prop
> Ci sono due modi fondamentalmente diversi in cui un componente può "cambiare forma":
> 1. **Composizione**: il genitore decide *il contenuto* passando `children` diverso. `Card` non
>    sa se dentro ci sarà una tabella, un grafico o un form — è agnostico.
> 2. **Variante via prop**: il genitore passa un valore (es. `variant="cyan"`, `size="sm"`) che il
>    componente stesso interpreta per scegliere *come* renderizzare il proprio output (colori,
>    dimensioni, layout interno). Il componente conosce già l'insieme finito di possibilità.
> Nello stesso file vedrai entrambi i pattern convivere: `Card` usa la composizione per il
> contenuto (`children`) e una variante via prop per lo stile del bordo (`variant`).

## Dove compare nel progetto

- [`src/components/ui/index.jsx`](../../src/components/ui/index.jsx) — Card, PageTitle, SectionLabel, Badge, RankBadge, DayTabs, SegmentedToggle, Modal, Input, Textarea, Button, Divider, Field, EmptyState, StatCard, ActivityLog, StatsSection
- [`src/components/ui/icons.jsx`](../../src/components/ui/icons.jsx) — icone SVG condivise come componenti puri
- Praticamente ogni file in `src/features/**` importa da `components/ui` — è la libreria di componenti più riusata del progetto

## Analisi del codice

### `Card` — composizione + variante via `style`

```jsx
// src/components/ui/index.jsx, righe 10-22
export function Card({ className = '', children, variant = 'green' }) {
  return (
    <div
      className={`p-5 rx-card ${className}`}
      style={variant === 'cyan'
        ? { borderColor: 'color-mix(in srgb, var(--rx-accent-2) 12%, transparent)' }
        : {}
      }
    >
      {children}
    </div>
  )
}
```

Tre props, tutte con un ruolo diverso:
- `className = ''` — permette al chiamante di **aggiungere** classi Tailwind extra (es. margini,
  larghezza) senza che `Card` debba conoscerle in anticipo. Nota il pattern `` `p-5 rx-card
  ${className}` ``: le classi base (`p-5 rx-card`) vengono sempre applicate, quelle del chiamante
  si concatenano dopo. È una convenzione che vedrai ripetuta ovunque nel progetto.
- `children` — il contenuto, via composizione (vedi approfondimento sopra).
- `variant = 'green'` — sceglie tra due bordi possibili tramite un **ternario dentro `style`**:
  se `variant === 'cyan'` applica un `borderColor` custom, altrimenti (variante di default
  `'green'`) lascia `{}` (nessuno style aggiuntivo, il bordo standard arriva dalla classe CSS
  `.rx-card` in `index.css`, che vedremo nella Lezione 3).

Cosa succederebbe se rimuovessi il default `= 'green'`? Se un componente chiamasse `<Card>` senza
passare `variant`, la variabile `variant` sarebbe `undefined`; il ternario `variant === 'cyan'`
resterebbe comunque `false` (perché `undefined !== 'cyan'`), quindi il comportamento visivo
resterebbe identico *in questo caso specifico* — ma solo per fortuna, perché il ramo "else"
combacia con quello che si vorrebbe come default. È comunque buona norma dichiarare sempre
esplicitamente il default, per documentare l'intento (leggendo la firma capisci subito "il
default è verde" senza dover leggere il corpo della funzione).

### `PageTitle` — un commento che documenta una decisione reale

```jsx
// src/components/ui/index.jsx, righe 24-36
// h1 di pagina — 3 dimensioni diverse (24/22/20px) per lo stesso ruolo
// semantico su pagine diverse, senza motivo. Uniformato a 20px (già la
// dimensione più diffusa). Margini/spaziatura restano a carico del chiamante
// via className, perché variano legittimamente in base al layout della pagina
// (riga flex con bottone accanto, sottotitolo sotto, pagina standalone...).
export function PageTitle({ children, className = '' }) {
  return (
    <h1 className={`font-display font-black text-[20px] text-white m-0 ${className}`}>
      {children}
    </h1>
  )
}
```

Questo componente è utile non tanto per la sua complessità (ce n'è pochissima) quanto per il
commento sopra: è un esempio reale di **debito tecnico documentato e risolto**. Prima
dell'uniformazione, tre pagine diverse usavano tre dimensioni di font diverse (24/22/20px) per lo
stesso ruolo semantico ("titolo di pagina") — un'incoerenza visiva senza una ragione di design,
probabilmente nata da copia-incolla indipendenti nel tempo. La scelta di fissare `text-[20px]`
*dentro* il componente (non lasciarlo come prop) è deliberata: se la dimensione del titolo fosse
una prop, si riaprirebbe la porta a nuove incoerenze ("qui uso 22px perché mi pare più bello").
Fissandola nel componente, l'unico modo per avere un titolo di pagina è usare `<PageTitle>`, e
tutti i titoli di pagina sono automaticamente coerenti. Margini e spaziatura restano invece
delegati a `className` perché — a differenza della dimensione del font — cambiano legittimamente
caso per caso in base al layout della pagina che lo ospita.

### `SectionLabel` e `Badge` — il default `color = 'var(--rx-accent)'`

```jsx
// src/components/ui/index.jsx, righe 39-64
export function SectionLabel({ children, color = 'var(--rx-accent)', className = '' }) {
  return (
    <div
      className={`font-display text-[11px] font-semibold tracking-[3px] uppercase mb-3.5 ${className}`}
      style={{ color }}
    >
      {children}
    </div>
  )
}

export function Badge({ color = 'var(--rx-accent)', className = '', children }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold tracking-wide ${className}`}
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        color,
        border:     `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
      }}
    >
      {children}
    </span>
  )
}
```

Entrambi hanno `color = 'var(--rx-accent)'` come default: se nessun colore viene passato, usano
la CSS custom property del tema attivo (Lezione 3 la tratta a fondo). Nota che `color` qui è
sempre una **stringa** — o un valore CSS letterale (`'#f87171'`), o un riferimento a variabile
CSS (`'var(--rx-accent)'`). Non è mai un oggetto di stile: la responsabilità di *come* usare quel
colore (solo testo? anche sfondo con trasparenza via `color-mix`? anche bordo?) resta interamente
al componente, non al chiamante. Questo è un buon esempio di **incapsulamento**: il chiamante dice
*quale* colore vuole, il componente decide *come* applicarlo coerentemente col proprio design.

### `RankBadge` — perché la variante `size` sta nella `className`, non nello `style`

```jsx
// src/components/ui/index.jsx, righe 69-82
export function RankBadge({ label, color, size = 'md' }) {
  return (
    <span
      className={`inline-flex items-center shrink-0 rounded-[3px] font-display font-black ${size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-[12px] px-3 py-1'}`}
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border:     `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
      }}
    >
      {label}
    </span>
  )
}
```

Qui vediamo **due meccanismi di variante diversi nello stesso componente**, ed è il punto più
istruttivo di questa lezione:
- `size` (`'sm'` vs `'md'`) sceglie tra due **stringhe di classi Tailwind** già pronte
  (`text-[11px] px-2 py-0.5` vs `text-[12px] px-3 py-1`) — valori **conosciuti in anticipo**,
  fissi, che esistono già come classi utility valide a compile-time.
- `color` invece è sempre risolto in `style`, mai in `className` — perché `color` è un valore
  **arbitrario passato a runtime** dal chiamante (un rank ha un colore diverso da un altro, un
  tema ha colori diversi da un altro tema). Tailwind genera le sue classi utility in fase di
  build analizzando staticamente il codice sorgente: non può generare una classe
  `text-[qualunque-stringa-arrivi-a-runtime]`, perché quella stringa non esiste ancora quando
  Tailwind analizza i file.

Questo risponde direttamente alla domanda "perché il progetto usa ternari inline invece di classi
CSS multiple per le varianti di colore": **non è una preferenza stilistica, è un vincolo tecnico**.
Un valore che deve essere dinamico e risolto a runtime (un colore che dipende da un rank, da un
tema, da uno stato applicativo) può arrivare al DOM solo tramite `style` inline con `var(...)` o
`color-mix(...)`, mai tramite una classe Tailwind generata staticamente. Le varianti che invece
sono un **insieme chiuso e noto in anticipo** (due sole taglie, tre soli variant fissi) possono
tranquillamente vivere in `className`, con un ternario che sceglie tra stringhe pre-scritte.

### `DayTabs` — un componente che a volte non renderizza nulla

```jsx
// src/components/ui/index.jsx, righe 89-108
export function DayTabs({ days, activeDay, onChange, color }) {
  if (!days || days.length <= 1) return null
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {days.map((d, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className="font-display text-[11px] font-bold px-3 py-1 rounded-[3px] cursor-pointer border transition-all"
          style={activeDay === i
            ? { background: `color-mix(in srgb, ${color} 18%, transparent)`, borderColor: `color-mix(in srgb, ${color} 55%, transparent)`, color }
            : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
          }
        >
          {d.label || `Giorno ${i + 1}`}
        </button>
      ))}
    </div>
  )
}
```

`if (!days || days.length <= 1) return null` è un pattern importante da riconoscere: in React,
`return null` da un componente significa "non renderizzare nulla" — è perfettamente legale, e non
lascia nemmeno un nodo DOM vuoto. La logica di dominio qui è: se una scheda allenamento ha un solo
giorno, non ha senso mostrare un selettore di giorni (non ci sarebbe nulla tra cui scegliere) — il
componente si "auto-nasconde".

`days.map((d, i) => ...)` è il modo standard di React per trasformare un array di dati in un array
di elementi JSX. `key={i}` è un dettaglio a cui React tiene molto: quando l'array cambia (giorni
aggiunti/rimossi/riordinati), React usa la `key` per capire *quale* elemento del DOM corrisponde a
*quale* elemento dell'array, invece di dover ridisegnare tutto da zero. Usare l'indice come `key`
(come fa qui) è accettabile quando l'array è statico o cambia raramente in ordine (il caso di
`days`, che tipicamente non viene riordinato dinamicamente), ma diventa un problema se l'array
viene riordinato spesso — approfondiremo il perché nella Lezione 4/5 quando parleremo di
riconciliazione delle liste.

Il ternario in `style` qui sceglie tra "tab attivo" e "tab inattivo" — un caso di variante binaria
dipendente sia da un dato interno al `.map` (`i === activeDay`) sia da una prop esterna (`color`,
che cambia per modulo/contesto: colore diverso per PT vs soccer, per esempio).

### `SegmentedToggle` — prop spreading con `...props`

```jsx
// src/components/ui/index.jsx, righe 116-134
export function SegmentedToggle({ active, onClick, color = 'var(--rx-accent)', solid = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`font-display cursor-pointer border transition-all ${className}`}
      style={active
        ? solid
          ? { background: `color-mix(in srgb, ${color} 15%, transparent)`, borderColor: color, color: '#fff' }
          : { background: `color-mix(in srgb, ${color} 20%, transparent)`, borderColor: `color-mix(in srgb, ${color} 55%, transparent)`, color }
        : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }
      }
      {...props}
    >
      {children}
    </button>
  )
}
```

`...props` nella destructuring raccoglie **tutte le altre props non esplicitamente nominate**
(tutto ciò che non è `active`, `onClick`, `color`, `solid`, `className`, `children`) in un oggetto,
che poi viene "spalmato" (*spread*) sul tag `<button>` con `{...props}`. Perché è utile: permette
al chiamante di passare attributi HTML standard (es. `type`, `disabled`, `title`, `data-testid`)
senza che `SegmentedToggle` debba dichiararli esplicitamente uno per uno. Nota però che `type="button"`
è già fissato esplicitamente **prima** di `{...props}` nel JSX — in JSX, se lo stesso attributo
compare due volte, vince l'**ultimo**. Se `props` contenesse un `type` diverso, sovrascriverebbe
quello fissato; dato che `{...props}` viene dopo `type="button"` nell'ordine degli attributi, un
chiamante che passasse `type="submit"` lo sovrascriverebbe. È un dettaglio sottile ma importante
quando debuggi un componente che "non si comporta come dovrebbe" nonostante il codice sembri
corretto.

Da notare anche il **ternario annidato** in `style`: prima si sceglie in base ad `active`
(attivo/inattivo), e se attivo si sceglie ulteriormente in base a `solid` (bordo pieno bianco vs.
chip tinta trasparente). È lo stesso principio di `Card`/`RankBadge`, applicato a due assi di
variazione contemporaneamente invece di uno solo.

### `Modal` — quando le varianti diventano una mappa invece di un ternario

```jsx
// src/components/ui/index.jsx, righe 137-141
const MODAL_WIDTHS = {
  default: 'w-[420px]',
  lg:      'w-[420px] lg:w-[720px]',
  xl:      'w-[420px] lg:w-[960px]',
}

export function Modal({ title, onClose, disableOverlayClose, size = 'default', accentColor = 'var(--rx-accent)', children }) {
  const dialogRef = useRef(null)
  useFocusTrap(dialogRef, true)

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  // ...
  className={`rx-card p-6 lg:p-8 ${MODAL_WIDTHS[size]} max-w-[96vw] my-auto`}
```

Qui la variante `size` non usa un ternario ma un **oggetto lookup** (`MODAL_WIDTHS[size]`).
Quando le opzioni possibili sono solo due (`Card.variant`: green/cyan), un ternario è la scelta
più leggibile; quando salgono a tre o più (`default`/`lg`/`xl`), un oggetto-mappa è più leggibile
di una catena di ternari annidati (`size === 'lg' ? '...' : size === 'xl' ? '...' : '...'`) e più
facile da estendere (aggiungere una quarta taglia significa aggiungere una riga all'oggetto, non
riscrivere una catena di condizioni). È un altro esempio concreto — insieme al ternario di `Card`
— di come questo progetto scelga lo strumento in base al numero di varianti, non per abitudine
cieca a un solo pattern.

Da notare anche il secondo `useEffect` in questo file (rinforzo di quanto visto in Lezione 1):
ascolta il tasto Escape sul `window` per chiudere il modal, e fa cleanup rimuovendo il listener
(`removeEventListener`) quando il componente si smonta o quando `onClose` cambia identità —
esattamente lo stesso pattern "aggiungi risorsa / pulisci risorsa" visto nel timer di `App.jsx`.

## Diagramma mentale

```
                    ┌─────────────────────────────┐
Chiamante  ────────►│  <Card variant="cyan">        │
(passa props)        │    <p>contenuto</p>          │   ← children via composizione
                    │  </Card>                     │
                    └───────────────┬───────────────┘
                                    │ JSX → createElement(Card, {variant:'cyan'}, <p>...</p>)
                                    ▼
                    ┌─────────────────────────────┐
Card (funzione)      │ function Card({className='',  │
                    │   children, variant='green'})│
                    │                               │
   props IN  ──────►│  destructuring + default      │──────► JSX OUT
                    │  ternario variant → style      │        (nuovo albero
                    │  {children} → dove va il       │         Virtual DOM)
                    │  contenuto                     │
                    └─────────────────────────────┘

Variante via prop (insieme chiuso, noto a build-time)
  → className con ternario/oggetto lookup (Tailwind)   es. RankBadge.size, Modal.size

Variante via prop (valore dinamico, noto solo a runtime)
  → style inline con var()/color-mix()                  es. Card.variant(colore), RankBadge.color
```

## Errori comuni

1. **Passare un colore letterale hardcoded invece di una CSS var come default.** Se in
   `SectionLabel` cambiassi il default da `color = 'var(--rx-accent)'` a `color = '#0fd65a'`, il
   componente smetterebbe di rispondere al cambio di tema: `var(--rx-accent)` viene risolto dal
   browser *ogni volta* che la CSS custom property cambia (es. quando `ThemeContext` chiama
   `root.style.setProperty('--rx-accent', ...)`), mentre `'#0fd65a'` è un valore fisso, congelato
   per sempre in quel colore.

2. **Dimenticare `key` in una `.map()`, o usare `Math.random()` come key.** Senza `key`, React
   emette un warning in console e usa l'indice implicitamente (con gli stessi limiti descritti
   sopra); usare `Math.random()` è anche peggio, perché genera una `key` **diversa a ogni
   render**, il che costringe React a distruggere e ricreare ogni elemento della lista a ogni
   render, perdendo qualunque stato interno (es. il focus su un input dentro quell'elemento) e
   penalizzando le performance.

3. **Confondere `children` con una prop qualsiasi da passare esplicitamente.** Uno sbaglio comune
   per chi viene da altri framework è scrivere `<Card children="testo" />` invece di
   `<Card>testo</Card>`. Funzionano allo stesso modo (sono letteralmente la stessa prop), ma la
   seconda forma è la convenzione universale in JSX — la prima è valida ma spiazza chiunque legga
   il codice dopo di te.

4. **Dimenticare il valore di default su una prop che viene poi usata in un template string.** Se
   `className` non avesse `= ''` come default e un chiamante non lo passasse, `className` sarebbe
   `undefined`, e `` `p-5 rx-card ${className}` `` produrrebbe la stringa letterale `"p-5 rx-card
   undefined"` — una classe CSS invalida (ma non un errore JavaScript: React non si lamenta,
   semplicemente quella classe non farà match con nessuna regola CSS, e il bug passa
   silenziosamente inosservato finché qualcuno non ispeziona il DOM).

5. **Mettere una classe Tailwind dinamica costruita a runtime, tipo `` className={`text-[${color}px]`} ``,
   pensando che funzioni come lo `style` inline.** Non funziona: Tailwind v4 (come le versioni
   precedenti) analizza staticamente il codice sorgente per decidere quali classi generare nel CSS
   finale. Se la classe non compare **letteralmente** come stringa nel codice sorgente (perché è
   costruita concatenando variabili a runtime), Tailwind non la genera mai, e la classe non avrà
   nessun effetto visivo — è esattamente il motivo tecnico spiegato sopra a proposito di
   `RankBadge.color`.

## Best Practice

**Ternario vs. oggetto lookup, scelti in base alla cardinalità delle varianti — non per
abitudine.** Il confronto più istruttivo di questa lezione è `Card`/`RankBadge` (ternario, 2
opzioni) contro `Modal.MODAL_WIDTHS` (oggetto lookup, 3 opzioni). Un errore comune di stile è
scegliere sempre lo stesso pattern per pigrizia (es. concatenare ternari annidati anche con 4-5
varianti, producendo codice illeggibile: `a ? x : b ? y : c ? z : w`). Il codice di RankEX mostra
la regola pratica corretta: **2 varianti → ternario inline è perfettamente leggibile; 3+ varianti
→ oggetto lookup**, perché resta leggibile anche quando cresce e non richiede di "contare le
parentesi" per capire quale ramo si applica a quale caso.

**`style` per valori dinamici, `className` per valori statici — mai il contrario.** Come visto,
questa non è un'opinione stilistica ma un vincolo tecnico di come funziona Tailwind (generazione
statica delle utility a build-time). Vale la pena interiorizzarlo come regola generale: ogni volta
che ti chiedi "questo va in `style` o in `className`?", la domanda giusta da farti è "questo valore
è già conosciuto quando Tailwind analizza il codice sorgente, o dipende da qualcosa che sappiamo
solo a runtime (props, stato, tema)?".

## Quiz

1. Cosa produce, concettualmente, la trasformazione di `<Badge color="#fff">Ciao</Badge>`?
   A) Una stringa HTML
   B) Una chiamata `createElement(Badge, {color:'#fff'}, 'Ciao')`
   C) Un file CSS
   D) Un nodo DOM reale immediato

2. Cos'è, tecnicamente, un componente funzionale come `Card`?
   A) Una classe che estende `React.Component`
   B) Un oggetto di configurazione
   C) Una funzione JavaScript che ritorna JSX
   D) Un file `.css` con dentro JSX

3. In `export function SectionLabel({ children, color = 'var(--rx-accent)', className = '' })`,
   cosa rappresentano le graffe `{ }` attorno ai parametri?
   A) Un blocco di codice
   B) Destructuring di un singolo oggetto (le props) nei suoi campi
   C) Un oggetto letterale vuoto da riempire
   D) Sintassi obbligatoria per ogni funzione React

4. Cosa diventa `<Card><p>Testo</p></Card>` in termini di props?
   A) `<Card content={<p>Testo</p>} />`
   B) `<Card>` senza props, il testo va perso
   C) `<Card children={<p>Testo</p>} />`
   D) Errore di sintassi, serve sempre self-closing

5. Perché in `RankBadge` la prop `size` sceglie tra classi Tailwind (`className`) mentre `color`
   sceglie tramite `style`?
   A) È indifferente, potevano scambiarli
   B) `size` ha un insieme chiuso di valori noti a build-time, `color` è un valore dinamico noto solo a runtime
   C) `style` è deprecato in React 18, quindi si preferisce `className` quando possibile
   D) `color` richiede sempre `useState`, `size` no

6. Cosa fa `if (!days || days.length <= 1) return null` in `DayTabs`?
   A) Lancia un errore se `days` è vuoto
   B) Non renderizza nulla se non c'è più di un giorno tra cui scegliere
   C) Nasconde il componente con CSS `display: none`
   D) Aspetta che `days` sia definito con un secondo `useEffect`

7. A cosa serve `...props` nella firma di `SegmentedToggle`?
   A) A clonare tutte le props in un nuovo componente
   B) A raccogliere tutte le props non nominate esplicitamente e "spalmarle" sul tag `<button>`
   C) A impedire che vengano passate altre props
   D) È equivalente a `children`

8. In `Modal`, perché `MODAL_WIDTHS` è un oggetto invece di un ternario?
   A) Perché gli oggetti sono sempre più veloci in JavaScript
   B) Perché ci sono 3 varianti (`default`/`lg`/`xl`) e un oggetto lookup resta leggibile ed estendibile meglio di ternari annidati
   C) Perché `size` è un numero, non una stringa
   D) È un requisito di Tailwind v4 per le classi dinamiche

9. Cosa succede se scrivi `className={`text-[${color}px]`}` sperando che Tailwind generi quella
   classe dinamicamente a runtime?
   A) Funziona sempre, Tailwind v4 supporta classi runtime
   B) Non funziona: Tailwind analizza staticamente il codice sorgente, quindi una classe costruita a runtime non viene mai generata nel CSS finale
   C) Funziona solo in sviluppo, non in produzione
   D) Lancia un errore di build

10. In `PageTitle`, perché la dimensione del font (`text-[20px]`) è fissata dentro il componente
    e non esposta come prop?
    A) Perché Tailwind non permette prop dinamiche sui font
    B) Per garantire coerenza: se fosse una prop, si riaprirebbe la porta alle incoerenze che il componente è stato creato per risolvere
    C) Perché `h1` non supporta `style` inline
    D) È un limite tecnico di React, non una scelta di design

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B** — è la traduzione concettuale di JSX in chiamate a funzione, spiegata nei Concetti
   teorici. (A), (C), (D) confondono JSX con l'output finale nel DOM, che avviene solo dopo che
   React ha processato l'albero di elementi.

2. **C** — è la definizione data esplicitamente nei Concetti teorici, confermata dal codice reale
   di `Card`, `Badge`, ecc. (A) descrive i componenti a classe (obsoleti, non usati in questo
   progetto salvo `ErrorBoundary` che *deve* essere una classe per via delle API di error
   handling); (B) e (D) non hanno riscontro.

3. **B** — è esattamente il pattern usato in tutto `components/ui/index.jsx`: un solo parametro
   (l'oggetto props) destrutturato nei suoi campi con eventuali default. (A) confonde con un blocco
   `{ }` di controllo di flusso; (C) e (D) non sono corretti.

4. **C** — `children` è la prop speciale popolata automaticamente dal contenuto tra tag di
   apertura e chiusura, come spiegato nell'approfondimento dedicato. (A) userebbe un nome di prop
   non standard; (B) e (D) sono comportamenti che non corrispondono a JSX.

5. **B** — è il punto centrale dell'analisi di `RankBadge`: Tailwind genera le classi
   analizzando staticamente il sorgente, quindi solo valori noti in anticipo (`size`) possono
   diventare classi; valori dinamici (`color`) devono passare da `style`. (A) è falso, lo scambio
   romperebbe il rendering del colore (vedi Errore comune 5); (C) è inventato, `style` non è
   deprecato; (D) non ha alcun fondamento nel codice.

6. **B** — è il comportamento esatto della riga 90 di `index.jsx`: se `days` non esiste o ha 0/1
   elementi, il componente ritorna `null` e non produce nessun output visivo, perché non ci
   sarebbe nulla tra cui scegliere. (A) è falso, non c'è nessun `throw`; (C) descrive un
   meccanismo diverso (nascondere via CSS, che lascerebbe comunque il nodo nel DOM); (D) non
   corrisponde al codice, non c'è un secondo `useEffect` in `DayTabs`.

7. **B** — `...props` (rest/spread) raccoglie ogni prop non esplicitamente destrutturata
   nell'oggetto `props`, poi `{...props}` sul tag JSX la "spalma" come attributi HTML individuali.
   (A) descrive qualcosa che non accade (non c'è nessuna clonazione di componente); (C) è il
   contrario del vero comportamento; (D) confonde con `children`, un concetto distinto.

8. **B** — è il ragionamento esplicito fatto nell'analisi e ribadito in Best Practice: con 3+
   varianti un oggetto lookup resta più leggibile ed estendibile di una catena di ternari
   annidati. (A) è un mito sulle performance non pertinente qui (la differenza è trascurabile e
   non è il motivo della scelta); (C) è falso, `size` è una stringa (`'default'|'lg'|'xl'`); (D)
   non è un vincolo reale di Tailwind.

9. **B** — è lo stesso vincolo tecnico spiegato per `RankBadge`: Tailwind v4 non genera classi
   costruite dinamicamente a runtime, perché il suo motore di generazione analizza il codice
   sorgente in modo statico durante il build. (A) e (C) sono false asserzioni sulle capacità di
   Tailwind; (D) non è il comportamento reale — semplicemente la classe non produce nessun
   effetto visivo, senza errori espliciti, il che la rende un bug particolarmente subdolo da
   scovare.

10. **B** — è il ragionamento esplicito nel commento del codice sorgente (righe 25-29 di
    `index.jsx`): la dimensione fissa nel componente è la garanzia strutturale contro le
    incoerenze che il refactoring ha risolto. (A) e (C) sono affermazioni tecnicamente false; (D)
    non è un limite di React, è puramente una scelta di design intenzionale.

## Esercizi

1. **Lettura guidata.** Apri `components/ui/index.jsx` e per ciascuno dei componenti `Button` e
   `EmptyState` (non analizzati in dettaglio in questa lezione) identifica: quali props hanno un
   valore di default, quale prop è `children`, e se la variante di stile usa un ternario o un
   oggetto lookup.

2. **Traccia un utilizzo reale.** Scegli uno dei componenti analizzati (es. `Badge`) e, con una
   ricerca testuale nel progetto, trova almeno 3 punti diversi in cui viene usato con `color`
   diversi. Osserva come lo stesso componente produce risultati visivamente diversi solo cambiando
   una prop.

3. **Modifica controllata — rompi e ripara.** In una copia locale (non committare), cambia il
   default di `Card` da `variant = 'green'` a `variant = 'blue'` (un valore che il ternario non
   gestisce). Osserva cosa succede visivamente quando `Card` è usata senza passare `variant`
   esplicitamente in nessun punto del progetto. Poi ripristina.

4. **Scrivi un componente da zero.** Crea (solo come esercizio, in un file di scratch, non
   integrato nel progetto) un componente `Pill` che accetta `label`, `color` (default
   `'var(--rx-accent)'`) e `size` (`'sm'`|`'md'`, default `'md'`), seguendo esattamente i pattern
   visti in `RankBadge`: colore via `style`, size via `className` con ternario.

5. **Domanda di codice.** Rileggi `SegmentedToggle` (righe 116-134). Se un chiamante passasse
   `<SegmentedToggle active={true} type="submit" />` dentro un `<form>`, cosa succederebbe al
   click, e perché? Verifica la tua ipotesi rileggendo l'ordine degli attributi nel JSX del
   componente.

## Challenge

`StatCard` (righe 352-364 di `components/ui/index.jsx`) accetta `label`, `value`, `color` ma non
ha nessuna variante di dimensione — è sempre lo stesso padding (`p-5`) e la stessa dimensione del
numero (`text-[32px]`). Cercando nel progetto dove viene usato (`AdminDashboard.jsx`,
`OrgDashboard.jsx`, secondo il commento alle righe 348-351), probabilmente lo vedrai sempre in
griglie di 3-4 card fianco a fianco. Implementa una variante `size` (`'sm'`|`'md'`, default `'md'`)
seguendo esattamente il pattern di `RankBadge`: una taglia `sm` con `text-[24px]` per il valore e
`p-4` per il padding, scelta tramite ternario in `className` (non in `style`, perché sono valori
statici noti in anticipo — coerentemente con quanto imparato in questa lezione). Non serve
integrarla in nessuna pagina reale: l'obiettivo è scrivere la variante seguendo la convenzione
corretta, non cambiare il comportamento visivo attuale di nessuna pagina esistente.
