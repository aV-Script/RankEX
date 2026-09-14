# Lezione 3 — Styling: Tailwind v4 + CSS custom properties + design tokens
[← Indice](00-indice.md)

## Obiettivo della lezione

Capire come RankEX applica lo stile: Tailwind v4 in modalità "CSS-first" (senza
`tailwind.config.js`), le CSS custom properties `--rx-*` che permettono il cambio di tema a
runtime, e la funzione `color-mix()` che ricorre ovunque nel codice. Chiudiamo verificando con i
nostri occhi — non fidandoci di quanto scritto altrove — se `src/design/tokens.js` sia davvero
codice morto e se i design token dichiarati nel blocco `@theme` di `index.css` siano realmente
usati.

## Concetti teorici

### Tailwind v4: da file di configurazione a CSS-first

Le versioni precedenti di Tailwind (v2, v3) richiedevano un file `tailwind.config.js` in cui si
dichiaravano colori, spaziature, font custom in JavaScript — un file di configurazione separato
dal CSS vero e proprio. Tailwind v4 cambia approccio: la configurazione **vive dentro il CSS
stesso**, tramite il blocco `@theme`. Ho verificato con una ricerca nella root del repository: **non
esiste nessun `tailwind.config.js`** in questo progetto (né `.ts`, `.cjs`, `.mjs`) — conferma diretta
che RankEX usa davvero l'approccio CSS-first, non un residuo di configurazione mai ripulito.

> ### 📎 Approfondimento: CSS custom properties (variabili CSS)
> Una CSS custom property (comunemente chiamata "variabile CSS") si dichiara con la sintassi
> `--nome-variabile: valore;` e si usa con `var(--nome-variabile)`. A differenza delle variabili
> Sass/Less (che vengono "espanse" in fase di compilazione, prima che il CSS raggiunga il
> browser), le custom property **esistono a runtime nel browser stesso** — possono essere lette e
> **riscritte con JavaScript** (`element.style.setProperty('--nome', 'nuovo-valore')`) in
> qualsiasi momento, e ogni elemento che usa `var(--nome)` si aggiorna automaticamente, senza
> bisogno di ricaricare la pagina o rigenerare il CSS. È esattamente il meccanismo che rende
> possibile il cambio di tema istantaneo in RankEX: qualcuno chiama
> `document.documentElement.style.setProperty('--rx-accent', '#60a5fa')` e ogni componente che usa
> `var(--rx-accent)` — ovunque nell'app — cambia colore all'istante, senza che React debba
> ri-renderizzare nulla. Analogia: è come un'etichetta con un nome scritto su un cassetto
> (`--rx-accent`) — puoi cambiare *cosa c'è dentro il cassetto* senza dover riscrivere l'etichetta
> su ogni mobile che la referenzia.

### La differenza cruciale in RankEX: due insiemi di variabili con nomi simili

In `src/index.css` convivono **due sistemi distinti** che è facile confondere leggendo il codice
la prima volta:

1. Il blocco `@theme` (righe 4-27) — sintassi *nativa di Tailwind v4*, con nomi come
   `--color-rx-accent`, `--font-display`, `--shadow-glow-green`, `--radius-rx`. Tailwind legge
   questo blocco e **genera automaticamente classi utility** corrispondenti (es. `--color-rx-accent`
   genera potenzialmente `bg-rx-accent`, `text-rx-accent`, `border-rx-accent`; `--font-display`
   genera `font-display`; `--radius-rx` genera `rounded-rx`).
2. Il blocco `:root` (righe 30-73) — normali CSS custom properties "manuali", con nomi come
   `--rx-accent`, `--rx-accent-2`, `--rx-text`, `--rx-border`. Non hanno nessun legame automatico
   con Tailwind: sono lette dal codice React tramite `style={{ color: 'var(--rx-accent)' }}`, mai
   tramite classi generate.

Sono **due sistemi paralleli**, non uno l'estensione dell'altro. Lo verifichiamo nel dettaglio più
sotto, perché è uno dei punti più importanti (e meno ovvi) di tutto lo styling del progetto.

## Dove compare nel progetto

- [`src/index.css`](../../src/index.css) — import Tailwind, blocco `@theme`, `:root` runtime, layer del background, classi `.rx-*`
- [`src/design/tokens.js`](../../src/design/tokens.js) — specifica di design dichiarata (verificheremo se consumata)
- [`src/config/themes.config.js`](../../src/config/themes.config.js) — 7 temi, ciascuno un oggetto `vars` che sovrascrive le `:root` CSS custom properties
- [`src/context/ThemeContext.jsx`](../../src/context/ThemeContext.jsx) — applica `theme.vars` al DOM via `root.style.setProperty`
- [`src/components/ui/index.jsx`](../../src/components/ui/index.jsx) — uso sistematico di `color-mix()` nei componenti (vedi Lezione 2)
- `vite.config.js` / `package.json` — plugin `@tailwindcss/vite` (righe 3, 23 di `vite.config.js`)

## Analisi del codice

### `@import "tailwindcss"` e il blocco `@theme`

```css
/* src/index.css, righe 1-27 */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600&display=swap');
@import "tailwindcss";

/* ── Tailwind v4 Theme ────────────────────────────────────────── */
@theme {
  /* Fonts */
  --font-display: 'Montserrat', sans-serif;
  --font-body:    'Inter', sans-serif;

  /* Colors — Rank EX palette */
  --color-rx-bg:            #07090e;
  --color-rx-surface:       #0d1520;
  --color-rx-accent:        #0fd65a;
  --color-rx-accent-bright: #1aff6e;
  --color-rx-accent-2:      #00c8ff;

  /* Box shadows */
  --shadow-glow-green:  0 0 20px rgba(15,214,90,0.3);
  --shadow-glow-cyan:   0 0 20px rgba(0,200,255,0.3);
  --shadow-glow-bright: 0 0 40px rgba(15,214,90,0.4);
  --shadow-card-rx:     0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(15,214,90,0.1);

  /* Border radius */
  --radius-rx:    4px;
  --radius-rx-sm: 2px;
  --radius-rx-lg: 8px;
}
```

`@import "tailwindcss"` (riga 2) è l'unica riga necessaria per attivare tutto il motore di
Tailwind v4 — sostituisce le tre direttive `@tailwind base/components/utilities` delle versioni
precedenti. Il blocco `@theme` che segue è dove Tailwind v4 permette di **estendere il proprio
design system** dichiarando variabili con prefissi che Tailwind riconosce come "namespace"
speciali: `--font-*` genera utility di font-family, `--color-*` genera utility di colore
(`bg-`, `text-`, `border-`, ecc.), `--shadow-*` genera utility `shadow-*`, `--radius-*` genera
utility `rounded-*`.

**Ho verificato con una ricerca nell'intero codice sorgente** (`grep` su tutti i file `.jsx`) se
queste utility generate vengono effettivamente usate da qualche parte — cercando pattern come
`bg-rx-`, `text-rx-`, `border-rx-`, `shadow-glow`, `radius-rx`, `rounded-rx`. **Risultato: zero
occorrenze reali.** Le uniche righe intercettate dalla ricerca (in `BrandingPanel.jsx`,
`ResetSentView.jsx`, `BiaGaugeBar.jsx`) erano tutte riferimenti a `var(--rx-accent-bright)` — cioè
la variabile **runtime** del blocco `:root`, non la classe utility Tailwind generata dal blocco
`@theme`. In altre parole: **il blocco `@theme` è dichiarato ma le classi utility che genera non
vengono mai usate in nessun componente del progetto.**

C'è anche una ragione tecnica plausibile per cui è così, anche se il codice non la documenta
esplicitamente con un commento: i valori dentro `@theme` sono **letterali hex fissi**
(`--color-rx-accent: #0fd65a`), non riferimenti alle variabili `:root` (`var(--rx-accent)`). Se
un componente usasse `bg-rx-accent`, quel colore resterebbe **sempre** `#0fd65a`, anche quando
`ThemeContext` cambia il tema attivo (es. tema "Carbon", che riassegna `--rx-accent` ad arancione
`#e8590c`) — perché il cambio di tema agisce solo sulle variabili `:root`, mai sui valori interni
al blocco `@theme`, che sono fissati a build-time nel CSS generato. Con 7 temi dinamici in
`config/themes.config.js` che devono cambiare colore a runtime, l'unico meccanismo che funziona è
`style={{ color: 'var(--rx-accent)' }}` — mai una classe Tailwind statica come `text-rx-accent`.
Questo spiega perché, di fatto, tutto il colore dinamico del progetto passa dal blocco `:root` e
mai dalle utility generate da `@theme`.

Un'unica eccezione degna di nota: `.font-display`/`.font-body` sono **dichiarate due volte** nello
stesso file — una volta implicitamente da Tailwind (perché `--font-display`/`--font-body` nel
blocco `@theme`, righe 7-8, generano automaticamente le utility `font-display`/`font-body`), e
una volta esplicitamente come classe CSS scritta a mano:
```css
/* src/index.css, righe 123-125 */
/* ── Font utilities ─────────────────────────────────────────── */
.font-display { font-family: 'Montserrat', sans-serif; }
.font-body    { font-family: 'Inter', sans-serif; }
```
Le due definizioni producono lo stesso identico risultato (`font-family: 'Montserrat', sans-serif`),
quindi non c'è nessun comportamento rotto — ma è una ridondanza reale: la classe `.font-display`
esisterebbe già automaticamente grazie al blocco `@theme`, e questa dichiarazione manuale la
duplica. Probabilmente un residuo di un CSS scritto prima dell'adozione di Tailwind v4 CSS-first,
mai rimosso dopo l'introduzione del blocco `@theme`.

### Il blocco `:root` — le variabili che l'app usa davvero

```css
/* src/index.css, righe 30-73 (estratto) */
:root {
  --rx-bg:          #07090e;
  --rx-surface:     #0d1520;
  --rx-card-bg: rgba(8,17,12,0.82);
  --rx-nav-bg:  rgba(4,9,6,0.95);

  --rx-accent:        #0fd65a;
  --rx-accent-bright: #1aff6e;
  --rx-accent-dark:   #0a8a3a;
  --rx-accent-glow:   rgba(15,214,90,0.15);

  --rx-accent-2:      #00c8ff;
  --rx-accent-2-glow: rgba(0,200,255,0.15);

  --rx-danger: #f87171;
  --rx-gold:   #ffd700;
  --rx-silver: #c0c0c0;

  --rx-focus: var(--rx-accent);
  /* ... */
}
```

Questo è il sistema di variabili che **conta davvero** — l'ho verificato con la ricerca di
`color-mix(in srgb` nella Lezione 2 e qui: **152 occorrenze in 57 file diversi**, tutte basate su
`var(--rx-*)`. Ogni componente che ha bisogno di un colore lo prende da qui, mai da valori
letterali sparsi (con qualche piccola eccezione per colori semantici fissi come `#f87171` per
errore, che non cambiano tra temi per scelta esplicita — vedi `--rx-danger`, `--rx-gold`,
`--rx-silver`, righe 51-53, commentate nel CSS come "semantici — stato/classifica, non legati al
tema (uguali su tutti i 7 temi)").

Nota `--rx-focus: var(--rx-accent)` (riga 59): è una variabile che **referenzia un'altra
variabile**. Il commento sopra (righe 55-58) spiega perché: `AdminShell` (l'area super_admin)
riassegna `--rx-focus` a un colore rosso admin dedicato *senza* dover toccare `--rx-accent`, che
nell'area admin resta verde per un motivo funzionale preciso (semafori di stato "attivo"/"nel
limite" restano leggibili con lo stesso significato cromatico in tutta l'app). È un esempio reale
di **indirection deliberata**: separare "il colore del focus da tastiera" da "il colore accent del
brand" permette di cambiarne uno senza toccare l'altro, anche se nel caso comune (fuori dall'area
admin) puntano allo stesso valore.

### `ThemeContext` applica le variabili a runtime

```js
// src/context/ThemeContext.jsx, righe 26-32
function applyTheme(theme) {
  const root = document.documentElement

  // CSS variables
  for (const [key, val] of Object.entries(theme.vars)) {
    root.style.setProperty(key, val)
  }
  // ...
```

Questo è il codice che rende concreto l'approfondimento sulle CSS custom property: `theme.vars`
(definito per ciascuno dei 7 temi in `themes.config.js`, es. `{'--rx-accent': '#60a5fa', ...}` per
il tema Midnight) viene applicato con un semplice ciclo `for...of` su `Object.entries`, chiamando
`root.style.setProperty(key, val)` per ognuna. `root` è `document.documentElement`, cioè il tag
`<html>` — le custom property impostate lì sono visibili (per ereditarietà CSS) da ogni elemento
della pagina, perché ogni elemento discende da `<html>`. Non c'è nessun re-render React coinvolto:
è manipolazione diretta del DOM al di fuori del ciclo di vita di React, giustificata dal fatto che
qui l'obiettivo è cambiare *stile*, non struttura o dati — un caso legittimo di "uscire da React"
per un'ottimizzazione (evitare che centinaia di componenti si ri-rendano solo per un cambio di
colore, quando il CSS può farlo da solo).

### `color-mix()` — perché è ovunque nel codice

```jsx
// src/components/ui/index.jsx, riga 56 (Badge)
background: `color-mix(in srgb, ${color} 10%, transparent)`,
```

`color-mix(in srgb, ${color} 10%, transparent)` è una funzione CSS nativa (supportata dai browser
moderni) che **mescola due colori** in una proporzione data — qui, il 10% del colore passato e il
90% di trasparenza, cioè un colore semitrasparente derivato da `color`. Perché è preferita a
scrivere direttamente un valore RGBA fisso: `color` in questo contesto è quasi sempre una CSS
custom property dinamica (`var(--rx-accent)`), non un colore noto in anticipo. Non esiste un modo
di scrivere "il 10% di trasparenza di *qualunque colore risulti da questa variabile CSS*" con la
sola sintassi RGBA — `rgba()` richiede componenti R/G/B numerici espliciti, che non si possono
estrarre da una variabile CSS con sintassi CSS pura. `color-mix()` risolve esattamente questo:
funziona su **qualunque** valore di colore, incluse le variabili, calcolato dal browser al momento
del rendering.

È anche per questo che RankEX ha un caso di studio reale in CLAUDE.md (P1.3, citato anche nel
codice di `StatCard`, righe 348-351 di `index.jsx`): prima dell'adozione sistematica di
`color-mix()`, un pattern come `color + '22'` (concatenare `'22'` in esadecimale a una stringa per
ottenere trasparenza) **produceva un bordo invisibile** quando `color` non era un hex a 6 cifre ma
una CSS var come `'var(--rx-accent)'` — la stringa risultante `'var(--rx-accent)22'` non è un
colore CSS valido, e il browser la scarta silenziosamente senza errori in console. `color-mix()`
non ha questo problema perché opera semanticamente sul colore risolto, non sulla sua
rappresentazione testuale.

### Il layer del background — CSS puro, nessuna immagine esterna

```css
/* src/index.css, righe 86-117 (estratto) */
html {
  background-color: #07090e;
  background-image:
    radial-gradient(ellipse 120% 120% at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.72) 100%),
    radial-gradient(ellipse 45% 60% at -3% 62%, rgba(15, 214, 90, 0.20) 0%, rgba(15, 214, 90, 0.06) 40%, transparent 65%),
    radial-gradient(ellipse 35% 25% at 106% -2%, rgba(0, 200, 255, 0.10) 0%, transparent 55%),
    url("data:image/svg+xml,%3Csvg ...%3E"),
    linear-gradient(rgba(0, 200, 255, 0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 200, 255, 0.028) 1px, transparent 1px);
  background-size: cover, cover, cover, 120px 116px, 40px 40px, 40px 40px;
  background-attachment: fixed;
  background-repeat: no-repeat, no-repeat, no-repeat, repeat, repeat, repeat;
}
```

Sei layer sovrapposti in un solo `background-image` (separati da virgole, dal più in basso — primo
elencato — al più in alto): vignette perimetrale scura, glow verde sul bordo sinistro, traccia
ciano in alto a destra, un pattern di pentagoni ripetuti (codificato come SVG inline via
`data:image/svg+xml,...` — nessun file immagine esterno da scaricare), e due griglie lineari
(orizzontale e verticale) che creano l'effetto "griglia dati". Il vantaggio di farlo interamente in
CSS: zero richieste HTTP aggiuntive per immagini, e — punto cruciale per il theming — `ThemeContext`
può **sostituire interamente questo background** iniettando un secondo blocco `<style>`
(`buildBgImage`, righe 10-24 di `ThemeContext.jsx`) con gli stessi colori del tema attivo, senza
toccare `index.css` né dover generare immagini diverse per ogni tema.

## Diagramma mentale

```
index.css
├── @import "tailwindcss"          → attiva il motore Tailwind v4
├── @theme { ... }                 → --color-rx-*, --font-*, --shadow-*, --radius-rx*
│    genera classi utility Tailwind (bg-rx-accent, font-display, shadow-glow-green...)
│    ⚠ VERIFICATO: nessuna di queste classi è usata in .jsx — sistema dichiarato ma non consumato
│      (eccetto .font-display/.font-body, ridefinite ANCHE a mano, righe 124-125 — duplicazione)
│
├── :root { ... }                  → --rx-accent, --rx-accent-2, --rx-text, --rx-border...
│    letto ovunque via style={{ color: 'var(--rx-accent)' }} + color-mix()
│    152 occorrenze di color-mix() in 57 file — QUESTO è il sistema realmente vivo
│
└── html { background-image: 6 layer CSS-only }
     sovrascritto a runtime da ThemeContext.applyTheme() per i 7 temi

ThemeContext.jsx
  applyTheme(theme)
    root.style.setProperty('--rx-accent', theme.vars['--rx-accent'])   ← riscrive :root a runtime
    inietta <style id="rx-theme-bg"> per il background del tema

design/tokens.js
  SPACE, TYPE, COLOR, GRADIENT, SHADOW, RADIUS, MOTION, Z
  ⚠ VERIFICATO: 0 import in tutto src/ — nemmeno il file più recente lo consuma
  Il file stesso lo dichiara nel proprio commento di intestazione (righe 5-16)
```

## Errori comuni

1. **Provare a usare una classe Tailwind come `bg-rx-accent` pensando che sia "il colore del
   tema".** Come verificato, questa classe (se generata da Tailwind grazie al blocco `@theme`)
   punterebbe sempre a `#0fd65a`, **ignorando completamente il tema attivo** — perché il blocco
   `@theme` non fa mai riferimento alle variabili `:root`. Il modo corretto per un colore che deve
   rispondere al tema è sempre `style={{ background: 'var(--rx-accent)' }}` o, per una variante con
   trasparenza, `color-mix(in srgb, var(--rx-accent) N%, transparent)`.

2. **Modificare `src/design/tokens.js` pensando di cambiare qualcosa a runtime.** Come verificato
   con la ricerca (zero import in tutto `src/`), questo file **non è collegato a nessun componente
   vivo**. Cambiare un valore lì non ha alcun effetto visibile nell'app — il colore o lo spacing
   realmente applicati vanno modificati in `index.css` (`:root`) o `themes.config.js`. Il file
   stesso lo dichiara esplicitamente nel proprio commento di intestazione (righe 5-16): è una
   "specifica di riferimento", non la fonte di verità live.

3. **Aggiungere un nuovo colore direttamente in `themes.config.js` per un solo tema, dimenticando
   gli altri 6.** Ogni oggetto `vars` in `THEMES` (in `themes.config.js`) deve dichiarare lo stesso
   insieme di chiavi per tutti e 7 i temi — se un componente usa `var(--rx-nuovo-colore)` e solo il
   tema di default lo definisce, passando a un altro tema quella variabile CSS "sparisce"
   (`var()` senza fallback e senza definizione ricade sul valore ereditato o iniziale, spesso
   producendo un colore trasparente/nero inatteso).

4. **Scrivere `rgba(0,200,255, 0.1)` invece di `color-mix(in srgb, var(--rx-accent-2) 10%,
   transparent)` per un elemento che deve rispondere al tema.** `rgba()` con valori numerici fissi
   non ha nessun collegamento con le CSS custom property: è un colore statico che non cambierà mai,
   anche se l'utente seleziona un tema diverso — esattamente l'errore che il bug P1.3 documentato
   in CLAUDE.md (concatenazione `color + '22'`) rappresentava in una forma diversa ma con la stessa
   radice: colore hardcoded invece che derivato dalla variabile del tema attivo.

5. **Dimenticare che `ThemeContext.applyTheme` agisce fuori dal ciclo di render React.** Se ti
   aspetti che un cambio di tema causi un nuovo render di ogni componente con nuovi valori di
   `color` calcolati in JavaScript, resterai confuso: il cambio di colore avviene **puramente in
   CSS**, tramite la ricalcolazione automatica di `var(--rx-accent)` da parte del browser — React
   non "sa" che il tema è cambiato, a meno che tu non stia leggendo `useTheme()` per altri scopi
   (es. mostrare quale tema è selezionato nel `ThemePicker`).

## Best Practice

**Verificare prima di fidarsi: caso di studio `design/tokens.js`.** Il file dichiara sé stesso, nel
proprio commento di intestazione, come "non consumato da nessun componente" — un caso raro e
onesto di codice che documenta la propria condizione di codice morto invece di fingere di essere
la fonte di verità. Ho verificato con una ricerca (`grep "design/tokens"` su tutto `src/`) e il
risultato conferma: **zero import**, in nessun file. Questo è un promemoria di metodo importante
per chi mantiene un progetto "vibe coded": la presenza di un file ben scritto, con nomi coerenti e
commenti puliti, **non implica che sia effettivamente in uso**. Prima di fidarti che un file come
`tokens.js` sia la fonte di verità (magari perché "sembra" il posto giusto dove dovrebbe stare
quella configurazione), verifica sempre con una ricerca chi lo importa davvero.

**Stessa verifica applicata al blocco `@theme`.** A differenza di `tokens.js`, il blocco `@theme`
in `index.css` non dichiara esplicitamente di essere inutilizzato — ma la ricerca mostra lo stesso
esito: le classi utility che genera non compaiono in nessun file `.jsx`. È lo stesso principio,
applicato a un livello diverso (CSS invece che JS): un pezzo di configurazione sintatticamente
corretto e ben posizionato (dentro `index.css`, non in un file satellite come `tokens.js`) può
comunque essere di fatto morto, se nessun componente lo consuma. La differenza pratica tra i due
casi: `tokens.js` è innocuo da rimuovere (zero rischio, zero dipendenze); il blocco `@theme`
richiede più cautela, perché — anche se le sue utility non sono usate nei componenti — potrebbe
esserci una dipendenza indiretta non ancora verificata (es. plugin di build, altri file CSS non
letti in questa lezione); prima di rimuoverlo andrebbe fatta la stessa verifica sistematica anche
sugli altri fogli di stile del progetto, non solo su `.jsx`.

## Quiz

1. Cosa manca in questo repository rispetto a un progetto Tailwind v2/v3 tipico?
   A) Il file `index.css`
   B) Un `tailwind.config.js` classico
   C) Il plugin `@tailwindcss/vite`
   D) Le utility class native (`flex`, `px-4`, ecc.)

2. A cosa serve il blocco `@theme` in `index.css`?
   A) È sintassi Tailwind v4 per estendere il design system e generare classi utility custom
   B) È un blocco di commenti ignorato dal browser
   C) Sostituisce interamente `:root`
   D) Serve solo per il dark mode

3. Cosa distingue `--color-rx-accent` (blocco `@theme`) da `--rx-accent` (blocco `:root`)?
   A) Sono la stessa variabile con due nomi
   B) `--color-rx-accent` è un valore hex fisso usato per generare utility Tailwind; `--rx-accent` è la variabile runtime letta da `ThemeContext` e dai componenti
   C) `--rx-accent` è deprecata, sostituita da `--color-rx-accent`
   D) `--color-rx-accent` cambia con il tema, `--rx-accent` no

4. Cosa ha mostrato la ricerca (`grep`) delle classi utility generate da `@theme` (es.
   `bg-rx-accent`, `shadow-glow-green`) nei file `.jsx` del progetto?
   A) Sono usate in tutti i componenti principali
   B) Zero occorrenze reali — solo riferimenti a `var(--rx-accent-bright)`, cioè al sistema `:root`
   C) Sono usate solo nell'area super_admin
   D) Non è stato possibile verificarlo

5. Perché `color-mix(in srgb, var(--rx-accent) 10%, transparent)` è preferito a
   `rgba(15,214,90,0.1)` nei componenti UI?
   A) È più corto da scrivere
   B) `rgba()` non è supportato dai browser moderni
   C) `color-mix()` funziona con qualunque valore, incluse le CSS variable dinamiche del tema; `rgba()` richiede componenti numerici fissi noti in anticipo
   D) Sono identici, è solo una preferenza stilistica

6. Cosa fa `root.style.setProperty(key, val)` dentro `applyTheme` in `ThemeContext.jsx`?
   A) Aggiorna lo stato React e forza un re-render di tutti i componenti
   B) Scrive/aggiorna una CSS custom property direttamente sul tag `<html>`, senza coinvolgere il ciclo di render React
   C) Modifica `tailwind.config.js` a runtime
   D) Richiede una chiamata di rete a Firestore

7. Cosa rivela la presenza di `.font-display { font-family: 'Montserrat', sans-serif; }` scritta a
   mano nel CSS, dato che `--font-display` è già dichiarata nel blocco `@theme`?
   A) È obbligatoria, altrimenti Tailwind non funziona
   B) È una ridondanza: la stessa utility esisterebbe già automaticamente grazie al blocco `@theme`
   C) Serve per il fallback su browser vecchi
   D) `@theme` genera solo classi di colore, mai di font

8. Secondo la verifica fatta in questa lezione, qual è lo stato di `src/design/tokens.js`?
   A) È importato da `ThemeContext.jsx` per applicare i temi
   B) È importato da `components/ui/index.jsx`
   C) Zero import in tutto `src/` — il file stesso lo dichiara nel proprio commento di intestazione
   D) È importato solo in ambiente di test

9. Perché il background di `html` in `index.css` usa un SVG codificato come `data:image/svg+xml,...`
   invece di un file immagine separato?
   A) Per compatibilità con Internet Explorer
   B) Per evitare una richiesta HTTP aggiuntiva e permettere a `ThemeContext` di sostituirlo interamente via CSS iniettato, senza generare immagini per ogni tema
   C) È un requisito di Tailwind v4
   D) I file SVG non sono supportati come `background-image`

10. Perché `--rx-focus: var(--rx-accent)` (una variabile che referenzia un'altra variabile) è utile,
    secondo il commento nel codice?
    A) È un errore di battitura, dovrebbe essere un valore diretto
    B) Permette ad `AdminShell` di riassegnare solo il colore del focus da tastiera senza toccare `--rx-accent`, che nell'area admin deve restare verde per motivi semantici (semafori di stato)
    C) Serve solo per il debug in sviluppo
    D) `var()` non può contenere un altro `var()`, quindi è codice morto

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B** — verificato con una ricerca diretta nella root del repo: nessun `tailwind.config.js`.
   Tailwind v4 sposta la configurazione dentro il CSS (blocco `@theme`). (A) e (C) esistono
   entrambi nel progetto; (D) è falso, le utility native funzionano normalmente, cambia solo dove
   vive la configurazione custom.

2. **A** — è la sintassi nativa di Tailwind v4 per estendere il design system con token custom che
   generano classi utility, come spiegato nei Concetti teorici. (B) è falso, è CSS attivo letto dal
   motore Tailwind; (C) è falso, sono due blocchi paralleli e distinti (vedi domanda 3); (D) non ha
   riscontro nel codice, non c'è logica di dark mode qui.

3. **B** — è la distinzione centrale di questa lezione, verificata con la ricerca sui match di
   `color-mix`/`var()`. (A) è l'errore concettuale più comune da evitare; (C) è falso, entrambe
   esistono e sono usate (anche se con ruoli diversi); (D) è invertito rispetto alla realtà: è
   `--rx-accent` (blocco `:root`) quella che cambia con il tema, non `--color-rx-accent`.

4. **B** — risultato reale della ricerca effettuata in questa lezione: zero classi utility
   `@theme`-derivate trovate nei `.jsx`, solo riferimenti `var(--rx-accent-bright)` (sistema
   `:root`). (A) e (C) sono smentiti direttamente dalla ricerca; (D) è falso, la verifica è stata
   fatta ed è conclusiva.

5. **C** — è il motivo tecnico spiegato nell'analisi: `color-mix()` opera sul colore risolto,
   qualunque sia la sua origine (letterale o variabile CSS), mentre `rgba()` richiede componenti
   R/G/B numerici che non si possono estrarre da una `var()` con sintassi CSS pura. (A) è
   soggettivo e non il motivo reale; (B) è falso, `rgba()` è ampiamente supportato; (D) ignora il
   vincolo tecnico reale (vedi anche il bug P1.3 citato).

6. **B** — `setProperty` scrive direttamente sul DOM (`document.documentElement` = `<html>`),
   fuori dal ciclo di render di React; il cambiamento si propaga via cascata CSS naturale a ogni
   elemento che usa `var(--rx-accent)`. (A) è falso, non c'è nessun `setState` coinvolto in questa
   funzione; (C) e (D) non hanno alcun riscontro nel codice.

7. **B** — è la ridondanza reale identificata nell'analisi: `--font-display` nel blocco `@theme`
   genera già una utility `font-display` equivalente, quindi la dichiarazione manuale duplica un
   comportamento che esisterebbe comunque. (A) è falso, Tailwind funzionerebbe lo stesso; (C) non
   ha alcun fondamento (nessun commento nel codice lo suggerisce, e la sintassi è identica); (D) è
   falso, `@theme` genera anche utility non-colore (font, shadow, radius, come visto nell'analisi).

8. **C** — confermato sia dalla ricerca (`grep "design/tokens"` → zero risultati in tutto `src/`)
   sia dal commento di intestazione del file stesso (righe 5-16), che dichiara esplicitamente
   "nessun import di questo file nel resto di src". (A) e (B) sono affermazioni false, smentite
   dalla ricerca; (D) non ha riscontro, nemmeno nei file di test.

9. **B** — è il ragionamento spiegato nell'analisi del layer di background: zero richieste HTTP
   aggiuntive, e la possibilità per `ThemeContext.buildBgImage` di generare una variante diversa
   per ogni tema iniettando puro CSS, senza dover produrre/gestire immagini SVG separate per
   ciascuno dei 7 temi. (A) è irrilevante al contesto (non ci sono considerazioni su IE nel
   codice); (C) è falso, non è un requisito Tailwind; (D) è falso, gli SVG come `background-image`
   sono supportati normalmente.

10. **B** — è esattamente il commento presente nel codice sorgente (righe 55-58 di `index.css`),
    che spiega la necessità di separare "colore del focus da tastiera" da "colore accent del
    brand" per l'area super_admin. (A) è smentito dal commento esplicito che ne spiega il motivo;
    (C) non ha riscontro; (D) è tecnicamente falso — `var()` può annidare un altro `var()`
    perfettamente, è sintassi CSS valida e supportata.

## Esercizi

1. **Verifica guidata.** Apri le DevTools del browser su RankEX in esecuzione, seleziona l'elemento
   `<html>` nell'Elements/Inspector panel, e cerca nel pannello "Computed" o "Styles" il valore
   corrente di `--rx-accent`. Cambia tema dal `ThemePicker` (se disponibile nell'account con cui
   sei loggato) e osserva il valore aggiornarsi in tempo reale nelle DevTools, senza reload della
   pagina.

2. **Ricerca di conferma.** Ripeti tu stesso, con lo strumento di ricerca testuale del tuo editor,
   la verifica fatta in questa lezione: cerca `bg-rx-` e `text-rx-` in tutta la cartella `src/`.
   Conferma che il risultato è coerente con quanto riportato (zero occorrenze reali come classi
   utility).

3. **Traccia un colore end-to-end.** Scegli un componente a tua scelta che usa `var(--rx-accent-2)`
   (es. `Card` con `variant="cyan"`). Segui la catena completa: dove è dichiarato il valore di
   default in `index.css` `:root` (riga 47), dove viene sovrascritto per ciascun tema in
   `themes.config.js`, e come `ThemeContext.applyTheme` lo scrive sul DOM.

4. **Costruisci un `color-mix` manualmente.** Senza guardare il codice, scrivi a mano l'espressione
   `color-mix()` che produrrebbe uno sfondo al 15% di opacità del colore `var(--rx-danger)`. Poi
   confrontala con il pattern usato in `Badge` (riga 56 di `components/ui/index.jsx`) per
   verificare la sintassi.

5. **Caccia alla ridondanza.** Ora che sai riconoscere il pattern "dichiarato ma non consumato" (sia
   per `tokens.js` sia per il blocco `@theme`), scegli un'altra CSS custom property in `:root` (es.
   `--rx-gold` o `--rx-silver`, righe 52-53) e verifica con una ricerca testuale se è effettivamente
   usata in qualche componente `.jsx`, oppure se è anch'essa dichiarata ma inutilizzata. Riporta il
   risultato onestamente, qualunque esso sia — è esattamente il tipo di verifica che questa lezione
   ti ha insegnato a fare.

## Challenge

Il file `src/design/tokens.js` esiste, è ben scritto, ma — come verificato in questa lezione — non
è importato da nessun componente. Piuttosto che lasciarlo come "specifica aspirazionale" scollegata
dal codice reale (rischio: diverge silenziosamente da `index.css` nel tempo, come il suo stesso
commento di intestazione mette in guardia), scegli **una singola costante** a basso rischio da
questo file — ad esempio `RADIUS.sm` (`'3px'`, riga 135) — e verifica se il valore coincide
esattamente con quello che i componenti usano oggi come letterale hardcoded (cerca `rounded-[3px]`
nei file `.jsx`: lo trovi ad esempio in `DayTabs`, riga 97 di `components/ui/index.jsx`, e in
`Button`, riga 256). Se coincide, questo è un caso reale e concreto in cui `tokens.js` potrebbe
diventare la fonte di verità: non serve importarlo ovunque in un colpo solo (rischio troppo ampio
per un esercizio), ma prova a sostituire **un solo utilizzo** — quello in `DayTabs` — con un
riferimento reale a `SPACE`/`RADIUS` importato da `design/tokens.js`, verificando che il
componente si comporti visivamente in modo identico a prima. È il primo, minimo passo concreto per
trasformare un file dichiarato-ma-morto in codice realmente vivo, invece di proporre un
refactoring immaginario su tutto il design system in un colpo solo.
