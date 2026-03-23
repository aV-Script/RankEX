/**
 * Tab della barra di navigazione mobile.
 * L'indicatore attivo è una linea gradiente sotto la tab — stile Twitter/X.
 */
export function TabItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      data-active={active}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      className="
        flex-1 flex flex-col items-center gap-1 py-2.5
        cursor-pointer transition-all relative border-none
        bg-transparent
      "
    >
      {/* Indicatore attivo */}
      {active && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full"
          style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
        />
      )}

      <span className="data-[active=true]:text-blue-400 text-white/30 transition-colors"
        data-active={active}>
        {item.icon}
      </span>

      <span
        data-active={active}
        className="font-display text-[9px] tracking-[0.5px] data-[active=true]:text-blue-400 text-white/30 transition-colors"
      >
        {item.label.toUpperCase()}
      </span>
    </button>
  )
}