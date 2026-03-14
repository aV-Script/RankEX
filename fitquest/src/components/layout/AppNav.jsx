/**
 * AppNav — navbar a tre zone riusabile in tutta l'app.
 *
 * Layout: [left — flex-1] [FITQUEST centrato] [right — flex-1 justify-end]
 * I due flex-1 si bilanciano garantendo il logo sempre centrato
 * indipendentemente dalla larghezza degli elementi laterali.
 *
 * Props:
 *   left     — ReactNode (es. bottone back, label dashboard)
 *   right    — ReactNode (es. bottone logout, icona notifiche)
 *   color    — colore accent per il gradiente del logo (default blue→violet)
 *   sticky   — applica sticky top-0 z-20 con backdrop blur (default false)
 */
export function AppNav({ left, right, color, sticky = false }) {
  const logoStyle = color
    ? { background: `linear-gradient(90deg, #60a5fa, ${color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
    : undefined

  const logoClass = color
    ? 'font-display font-black text-[18px] shrink-0'
    : 'font-display font-black text-[18px] shrink-0 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent'

  return (
    <nav
      className={`px-6 lg:px-10 py-4 border-b border-white/[.05] flex items-center ${sticky ? 'sticky top-0 z-20' : ''}`}
      style={sticky ? { background: 'rgba(7,11,20,0.9)', backdropFilter: 'blur(10px)' } : undefined}
    >
      <div className="flex-1">
        {left}
      </div>

      <span className={logoClass} style={logoStyle}>
        FITQUEST
      </span>

      <div className="flex-1 flex justify-end items-center gap-2">
        {right}
      </div>
    </nav>
  )
}
