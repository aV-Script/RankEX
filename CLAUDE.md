# RankEX — Aggiornamento Palette

## Obiettivo
Aggiorna tutti i file del progetto per rispecchiare
esattamente i colori del logo RankEX ufficiale.

Leggi CLAUDE.md prima di iniziare.

---

## FASE 1 — Aggiorna src/config/theme.js

Sostituisci completamente il file con questa palette:
```js
/**
 * RankEX Design System — Palette ufficiale
 * Estratta dal logo RankEX Youth Soccer Project.
 *
 * Verde  → R e gemme verdi del logo
 * Ciano  → fulmine elettrico
 * Blu    → freccia della X
 * Metallo → struttura pentagonale
 */
export const theme = {
  colors: {
    // ── Sfondi ──────────────────────────────────────────────
    background:   '#080c12',   // background profondo del logo
    surface:      '#0d1520',   // pannelli metallici
    surfaceAlt:   '#111820',   // texture esagonale
    surfaceHover: '#161e2e',   // hover state

    // ── Bordi ───────────────────────────────────────────────
    border:       'rgba(10,215,90,0.15)',   // verde sottile
    borderHover:  'rgba(10,215,90,0.35)',
    borderActive: 'rgba(10,215,90,0.6)',
    borderMetal:  'rgba(138,155,176,0.15)', // metallico

    // ── Testo ───────────────────────────────────────────────
    text:          '#ffffff',
    textSecondary: '#c8d4e0',
    textMuted:     'rgba(200,212,224,0.4)',
    textDisabled:  'rgba(200,212,224,0.2)',

    // ── Verde (dalla R del logo) ─────────────────────────────
    green:       '#0fd65a',   // verde corpo
    greenBright: '#1aff6e',   // verde bordi luminosi
    greenDark:   '#0a8a3a',   // verde ombra
    greenGlow:   'rgba(15,214,90,0.15)',

    // ── Ciano/Blu (dal fulmine) ──────────────────────────────
    cyan:        '#00c8ff',   // ciano elettrico
    cyanBright:  '#4db8ff',   // alone del fulmine
    blue:        '#0066cc',   // blu profondo
    blueGlow:    'rgba(0,200,255,0.15)',

    // ── Metallico (dalla struttura) ──────────────────────────
    metalLight:  '#8a9bb0',
    metalMid:    '#4a5568',
    metalDark:   '#1e2a38',

    // ── Gradienti principali ─────────────────────────────────
    gradientPrimary:
      'linear-gradient(135deg, #1aff6e 0%, #0fd65a 30%, #00c8ff 70%, #4db8ff 100%)',
    gradientGreen:
      'linear-gradient(135deg, #0a8a3a 0%, #0fd65a 50%, #1aff6e 100%)',
    gradientCyan:
      'linear-gradient(135deg, #0066cc 0%, #00c8ff 50%, #4db8ff 100%)',
    gradientMetal:
      'linear-gradient(135deg, #1e2a38 0%, #4a5568 50%, #8a9bb0 100%)',
    gradientSubtle:
      'linear-gradient(135deg, rgba(15,214,90,0.08) 0%, rgba(0,200,255,0.08) 100%)',

    // ── Glow ────────────────────────────────────────────────
    glowGreen: 'rgba(15,214,90,0.25)',
    glowCyan:  'rgba(0,200,255,0.25)',
    glowMetal: 'rgba(138,155,176,0.1)',

    // ── Stato ───────────────────────────────────────────────
    success: '#0fd65a',   // verde logo
    warning: '#f59e0b',
    error:   '#f87171',
    info:    '#00c8ff',   // ciano logo

    // ── Decorativo ──────────────────────────────────────────
    hexGrid:    'rgba(0,200,255,0.04)',  // reticolo esagonale
    dataLine:   'rgba(15,214,90,0.08)',
  },

  shadows: {
    cardGreen:  '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(15,214,90,0.1)',
    cardCyan:   '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,200,255,0.1)',
    cardMetal:  '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(138,155,176,0.1)',
    glowGreen:  '0 0 20px rgba(15,214,90,0.3), 0 0 40px rgba(15,214,90,0.15)',
    glowCyan:   '0 0 20px rgba(0,200,255,0.3), 0 0 40px rgba(0,200,255,0.15)',
    glowBright: '0 0 60px rgba(15,214,90,0.4), 0 0 20px rgba(0,200,255,0.3)',
    text:       '0 0 10px rgba(15,214,90,0.5)',
  },

  shape: {
    xs:     '2px',
    sm:     '3px',
    md:     '4px',
    lg:     '6px',
    xl:     '8px',
    card:   '4px',
    button: '3px',
    badge:  '2px',
  },
}
```

---

## FASE 2 — Aggiorna src/index.css

Sostituisci completamente con:
```css
@import "tailwindcss";

/* ── Font ──────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600&display=swap');

/* ── CSS Variables ─────────────────────────────────────────── */
:root {
  /* Sfondi */
  --rx-bg:          #080c12;
  --rx-surface:     #0d1520;
  --rx-surface-alt: #111820;

  /* Verde logo */
  --rx-green:        #0fd65a;
  --rx-green-bright: #1aff6e;
  --rx-green-dark:   #0a8a3a;
  --rx-green-glow:   rgba(15,214,90,0.15);

  /* Ciano/Blu logo */
  --rx-cyan:       #00c8ff;
  --rx-cyan-glow:  rgba(0,200,255,0.15);
  --rx-blue:       #0066cc;

  /* Metallico */
  --rx-metal:      #8a9bb0;
  --rx-metal-dark: #1e2a38;

  /* Testo */
  --rx-text:       #ffffff;
  --rx-text-muted: rgba(200,212,224,0.4);
  --rx-border:     rgba(15,214,90,0.12);

  /* Gradienti */
  --rx-gradient:
    linear-gradient(135deg, #1aff6e 0%, #0fd65a 30%, #00c8ff 70%, #4db8ff 100%);
  --rx-gradient-green:
    linear-gradient(135deg, #0a8a3a, #0fd65a, #1aff6e);
  --rx-gradient-cyan:
    linear-gradient(135deg, #0066cc, #00c8ff, #4db8ff);
}

/* ── Base ──────────────────────────────────────────────────── */
* { box-sizing: border-box; }

html, body, #root {
  min-height:               100vh;
  background:               var(--rx-bg);
  color:                    var(--rx-text);
  font-family:              'Inter', sans-serif;
  -webkit-font-smoothing:   antialiased;
}

/* ── Scrollbar ─────────────────────────────────────────────── */
::-webkit-scrollbar       { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background:    rgba(15,214,90,0.2);
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(15,214,90,0.4);
}

/* ── Input ─────────────────────────────────────────────────── */
.input-base {
  background:    rgba(15,214,90,0.04);
  border:        1px solid rgba(15,214,90,0.15);
  border-radius: 3px;
  padding:       10px 14px;
  color:         #ffffff;
  font-family:   'Inter', sans-serif;
  font-size:     14px;
  outline:       none;
  transition:    border-color 200ms, box-shadow 200ms;
  width:         100%;
}
.input-base:focus {
  border-color: rgba(15,214,90,0.5);
  box-shadow:   0 0 0 2px rgba(15,214,90,0.08);
}
.input-base::placeholder { color: rgba(255,255,255,0.2); }

/* ── Reticolo esagonale (sfondo decorativo) ────────────────── */
.rx-hex-bg {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='64'%3E%3Cpath d='M28 2 L54 17 L54 47 L28 62 L2 47 L2 17 Z' fill='none' stroke='rgba(0,200,255,0.06)' stroke-width='1'/%3E%3C/svg%3E");
  background-size: 56px 64px;
}

/* ── Grid linee dati ───────────────────────────────────────── */
.rx-grid-bg {
  background-image:
    linear-gradient(rgba(15,214,90,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15,214,90,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ── Glow utilities ────────────────────────────────────────── */
.rx-glow-green {
  box-shadow: 0 0 20px rgba(15,214,90,0.25),
              0 0 40px rgba(15,214,90,0.1);
}
.rx-glow-cyan {
  box-shadow: 0 0 20px rgba(0,200,255,0.25),
              0 0 40px rgba(0,200,255,0.1);
}

/* Testo gradiente logo */
.rx-glow-text {
  background:              var(--rx-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip:         text;
}

/* Solo verde */
.rx-text-green {
  background:              var(--rx-gradient-green);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip:         text;
}

/* Solo ciano */
.rx-text-cyan {
  background:              var(--rx-gradient-cyan);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip:         text;
}

/* ── Animazioni ────────────────────────────────────────────── */
@keyframes rx-pulse-green {
  0%, 100% { box-shadow: 0 0 10px rgba(15,214,90,0.2); }
  50%       { box-shadow: 0 0 25px rgba(15,214,90,0.5); }
}

@keyframes rx-pulse-cyan {
  0%, 100% { box-shadow: 0 0 10px rgba(0,200,255,0.2); }
  50%       { box-shadow: 0 0 25px rgba(0,200,255,0.5); }
}

@keyframes rx-lightning {
  0%, 90%, 100% { opacity: 0; }
  92%, 96%      { opacity: 1; }
}

@keyframes rx-fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes rx-scanline {
  0%   { transform: translateY(-100%); opacity: 0.5; }
  100% { transform: translateY(100vh); opacity: 0; }
}

.rx-animate-in      { animation: rx-fadeIn 250ms ease forwards; }
.rx-pulse-green     { animation: rx-pulse-green 2s ease infinite; }
.rx-pulse-cyan      { animation: rx-pulse-cyan 2s ease infinite; }

/* ── Bordo metallico angolare ──────────────────────────────── */
.rx-card {
  background:    rgba(13,21,32,0.9);
  border:        1px solid rgba(15,214,90,0.12);
  border-radius: 4px;
  box-shadow:    0 4px 24px rgba(0,0,0,0.5),
                 inset 0 1px 0 rgba(138,155,176,0.05);
}

.rx-card:hover {
  border-color: rgba(15,214,90,0.25);
  box-shadow:   0 4px 24px rgba(0,0,0,0.5),
                0 0 20px rgba(15,214,90,0.08);
}

/* ── Bottone primario ──────────────────────────────────────── */
.rx-btn-primary {
  background:    var(--rx-gradient);
  border:        none;
  border-radius: 3px;
  color:         #ffffff;
  font-family:   'Montserrat', sans-serif;
  font-weight:   700;
  letter-spacing: 0.1em;
  transition:    opacity 200ms, box-shadow 200ms;
}
.rx-btn-primary:hover {
  opacity:    0.9;
  box-shadow: 0 0 20px rgba(15,214,90,0.3);
}

/* ── Badge rank ────────────────────────────────────────────── */
.rx-badge {
  font-family:   'Montserrat', sans-serif;
  font-weight:   700;
  font-size:     10px;
  letter-spacing: 0.15em;
  border-radius: 2px;
  padding:       2px 8px;
}
```

---

## FASE 3 — Aggiorna tailwind.config.js
```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      colors: {
        rx: {
          bg:           '#080c12',
          surface:      '#0d1520',
          green:        '#0fd65a',
          'green-bright': '#1aff6e',
          cyan:         '#00c8ff',
          blue:         '#0066cc',
          metal:        '#8a9bb0',
          'metal-dark': '#1e2a38',
        },
      },
      boxShadow: {
        'glow-green':  '0 0 20px rgba(15,214,90,0.3)',
        'glow-cyan':   '0 0 20px rgba(0,200,255,0.3)',
        'glow-bright': '0 0 40px rgba(15,214,90,0.4)',
        'card-rx':     '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(15,214,90,0.1)',
      },
      borderRadius: {
        'rx': '4px',
        'rx-sm': '2px',
        'rx-lg': '8px',
      },
    },
  },
  plugins: [],
}
```

---

## FASE 4 — Aggiorna src/components/ui/index.jsx

Sostituisci gli stili dei componenti base:

### Card
```jsx
export function Card({ className = '', children, glow = 'green' }) {
  return (
    <div
      className={`p-5 rx-card ${className}`}
      style={glow === 'cyan'
        ? { borderColor: 'rgba(0,200,255,0.12)' }
        : {}
      }
    >
      {children}
    </div>
  )
}
```

### SectionLabel
```jsx
export function SectionLabel({ children, className = '' }) {
  return (
    <div
      className={`font-display text-[10px] tracking-[3px] uppercase mb-3.5 ${className}`}
      style={{ color: '#0fd65a' }}
    >
      {children}
    </div>
  )
}
```

### Button
```jsx
const VARIANT_STYLES = {
  primary: {
    background:   'linear-gradient(135deg, #1aff6e 0%, #0fd65a 30%, #00c8ff 70%, #4db8ff 100%)',
    border:       'none',
    color:        '#080c12',
    fontWeight:   700,
  },
  danger: {
    background:   'linear-gradient(135deg, #f59e0b, #ef4444)',
    border:       'none',
    color:        '#ffffff',
  },
  ghost: {
    background:   'transparent',
    border:       '1px solid rgba(15,214,90,0.3)',
    color:        '#0fd65a',
  },
}

export function Button({ variant = 'primary', loading, disabled, className = '', children, ...props }) {
  return (
    <button
      disabled={loading || disabled}
      className={`
        px-4 font-display text-[13px] font-bold tracking-wider
        cursor-pointer transition-all duration-200
        ${loading || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-85'}
        ${className}
      `}
      style={{
        ...VARIANT_STYLES[variant],
        borderRadius: '3px',
        padding:      '12px 16px',
      }}
      {...props}
    >
      {loading ? 'ATTENDERE...' : children}
    </button>
  )
}
```

### Modal
```jsx
export function Modal({ title, onClose, disableOverlayClose, size = 'default', children }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start lg:items-center justify-center overflow-y-auto py-4 px-4"
      style={{ background: 'rgba(8,12,18,0.9)' }}
      onClick={disableOverlayClose ? undefined : onClose}
    >
      <div
        className={`rx-card p-6 lg:p-8 ${MODAL_WIDTHS[size]} max-w-[96vw] my-auto`}
        style={{
          background:   '#0d1520',
          borderColor:  'rgba(15,214,90,0.2)',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(15,214,90,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-white text-base m-0 tracking-wider">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-white/30 text-xl cursor-pointer leading-none hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

### Divider
```jsx
export function Divider({ color }) {
  return (
    <div className="px-6 my-1">
      <div
        className="w-full h-px"
        style={{
          background: color
            ? `linear-gradient(90deg, transparent, ${color}55, transparent)`
            : 'linear-gradient(90deg, transparent, rgba(15,214,90,0.2), transparent)',
        }}
      />
    </div>
  )
}
```

---

## FASE 5 — Aggiorna trainer-shell/constants.jsx

### Logo RX con gradiente logo
```jsx
export const LogoMark = () => (
  <span className="rx-glow-text font-display font-black text-[14px] leading-none tracking-wider">
    RX
  </span>
)

export const LogoFull = () => (
  <div>
    <span className="rx-glow-text font-display font-black text-[18px] leading-none">
      RankEX
    </span>
  </div>
)
```

### SidebarIcon aggiornato
```jsx
function SidebarIcon({ item, active, onClick }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        data-active={active}
        aria-label={item.label}
        className="w-10 h-10 flex items-center justify-center cursor-pointer transition-all"
        style={active ? {
          background:   'rgba(15,214,90,0.1)',
          border:       '1px solid rgba(15,214,90,0.35)',
          borderRadius: '4px',
          color:        '#0fd65a',
          boxShadow:    '0 0 12px rgba(15,214,90,0.15)',
        } : {
          background:   'transparent',
          border:       '1px solid transparent',
          borderRadius: '4px',
          color:        'rgba(200,212,224,0.3)',
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.borderColor = 'rgba(15,214,90,0.2)'
            e.currentTarget.style.color       = 'rgba(15,214,90,0.8)'
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.color       = 'rgba(200,212,224,0.3)'
          }
        }}
      >
        {item.icon}
      </button>

      {/* Tooltip */}
      <div className="
        absolute left-[52px] top-1/2 -translate-y-1/2
        pointer-events-none opacity-0 group-hover:opacity-100
        transition-opacity duration-150 z-50
        px-2.5 py-1.5 whitespace-nowrap
      "
        style={{
          background:   'rgba(8,12,18,0.97)',
          border:       '1px solid rgba(15,214,90,0.2)',
          borderRadius: '3px',
          boxShadow:    '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <span className="font-display text-[10px] tracking-[2px]"
          style={{ color: '#0fd65a' }}>
          {item.label.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
```

### TabItem mobile aggiornato
```jsx
function TabItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1 py-2.5 cursor-pointer transition-all relative border-none bg-transparent"
    >
      {active && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-8"
          style={{
            background:   'linear-gradient(90deg, #0fd65a, #00c8ff)',
            borderRadius: '1px',
            boxShadow:    '0 0 8px rgba(15,214,90,0.5)',
          }}
        />
      )}
      <span style={{ color: active ? '#0fd65a' : 'rgba(200,212,224,0.3)' }}>
        {item.icon}
      </span>
      <span
        className="font-display text-[9px] tracking-[0.5px]"
        style={{ color: active ? '#0fd65a' : 'rgba(200,212,224,0.3)' }}
      >
        {item.label.toUpperCase()}
      </span>
    </button>
  )
}
```

---

## FASE 6 — Aggiorna BrandingPanel login
```jsx
export function BrandingPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 rx-hex-bg"
      style={{ background: '#080c12' }}
    >
      {/* Logo */}
      <div>
        <div className="rx-glow-text font-display font-black leading-none"
          style={{ fontSize: 52 }}>
          RankEX
        </div>
        <div
          className="font-display text-[12px] tracking-[4px] mt-3"
          style={{ color: 'rgba(200,212,224,0.4)' }}
        >
          YOUTH SOCCER PROJECT
        </div>

        {/* Linea decorativa */}
        <div className="mt-4 h-px w-24"
          style={{ background: 'linear-gradient(90deg, #0fd65a, transparent)' }}
        />
      </div>

      {/* Pillole feature */}
      <div className="flex flex-col gap-5">
        {[
          { icon: '⚡', label: 'PERFORMANCE TRACKING',  desc: 'Monitora le prestazioni atletiche' },
          { icon: '🏆', label: 'SISTEMA RANK',          desc: 'Da F a EX — scala la classifica' },
          { icon: '📊', label: 'ANALISI DATI',          desc: 'Percentili e statistiche avanzate' },
          { icon: '📅', label: 'GESTIONE ALLENAMENTI',  desc: 'Calendario e presenze' },
        ].map(item => (
          <div key={item.label} className="flex items-start gap-3">
            <span className="text-[20px] shrink-0 mt-0.5">{item.icon}</span>
            <div>
              <div
                className="font-display text-[11px] font-bold tracking-[2px]"
                style={{ color: '#0fd65a' }}
              >
                {item.label}
              </div>
              <div
                className="font-body text-[12px] mt-0.5"
                style={{ color: 'rgba(200,212,224,0.4)' }}
              >
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="font-body text-[11px]"
        style={{ color: 'rgba(200,212,224,0.2)' }}
      >
        © RankEX Youth Soccer Project
      </div>
    </div>
  )
}
```

---

## FASE 7 — Aggiorna ConfirmDialog e DeleteDialog
```jsx
// Pattern comune per tutti i dialog
style={{
  background:   '#0d1520',
  border:       '1px solid rgba(15,214,90,0.15)',
  borderRadius: '4px',
  boxShadow:    '0 20px 60px rgba(0,0,0,0.8)',
}}

// Bottone conferma standard
style={{
  background:   'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)',
  borderRadius: '3px',
  color:        '#080c12',
  fontWeight:   700,
}}

// Bottone conferma distruttivo (elimina)
style={{
  background:   'linear-gradient(135deg, #f59e0b, #ef4444)',
  borderRadius: '3px',
  color:        '#ffffff',
}}
```

---

## FASE 8 — Verifica finale

### 8A — Build
```bash
npm run build
npm run preview
```

### 8B — Cerca residui colori FitQuest
```bash
grep -rn "#8b5cf6\|#7c3aed\|#60a5fa\|violet\|purple\|indigo" \
  src --include="*.jsx" --include="*.js" --include="*.css"
```

### 8C — Cerca Rajdhani
```bash
grep -rn "Rajdhani\|rajdhani" \
  src public index.html \
  --include="*.jsx" --include="*.js" --include="*.css" --include="*.html"
```

### 8D — Checklist visiva
Verifica manualmente ogni schermata:
- [ ] Login — logo RankEX, sfondo esagonale, verde/ciano
- [ ] Sidebar — icone verdi, glow al hover
- [ ] Tab bar mobile — indicatore verde con glow
- [ ] Lista allievi — card con bordo verde sottile
- [ ] Modal — sfondo scuro, bordo verde
- [ ] Bottoni — gradiente verde→ciano
- [ ] Input — bordo verde, focus verde
- [ ] Separatori — gradiente verde
- [ ] Section labels — testo verde
- [ ] PlayerCard — stile carta calciatore hi-tech
```

---

## Come usarlo in Claude Code
```
Leggi CLAUDE.md del progetto RankEX.
Poi esegui RANKEX_PALETTE.md fase per fase.

Inizia dalla FASE 1 — aggiorna theme.js.
Dopo ogni fase esegui npm run build per verificare.
Non procedere alla fase successiva se ci sono errori.

Nota: i colori primari di RankEX sono:
- Verde logo:  #0fd65a / #1aff6e
- Ciano logo:  #00c8ff
- Sfondo:      #080c12
- Bordi:       rgba(15,214,90,0.12)

Tutto il viola/indigo di FitQuest va sostituito con
il verde/ciano di RankEX.