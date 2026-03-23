/**
 * Icona della sidebar desktop con tooltip al hover.
 * Usa data-active per gestire gli stili condizionali via CSS
 * invece di onMouseEnter/onMouseLeave — il virtual DOM rimane in controllo.
 */
export function SidebarIcon({ item, active, onClick }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        data-active={active}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className="
          w-10 h-10 rounded-xl flex items-center justify-center
          cursor-pointer transition-all border
          text-white/35 border-transparent
          hover:bg-white/[.07] hover:border-white/10 hover:text-white/75
          data-[active=true]:bg-blue-500/[.18] data-[active=true]:border-blue-500/40 data-[active=true]:text-blue-400
        "
      >
        {item.icon}
      </button>

      {/* Tooltip */}
      <div
        role="tooltip"
        className="
          absolute left-[52px] top-1/2 -translate-y-1/2
          pointer-events-none opacity-0 group-hover:opacity-100
          transition-opacity duration-150 z-50
          bg-[rgba(15,31,61,0.97)] border border-white/10
          rounded-lg px-2.5 py-1.5 whitespace-nowrap
        "
      >
        <span className="font-display text-[11px] text-white/80 tracking-[1px]">
          {item.label.toUpperCase()}
        </span>
        {/* Freccia */}
        <div className="
          absolute left-[-5px] top-1/2 -translate-y-1/2
          w-2 h-2 bg-[rgba(15,31,61,0.97)]
          border-l border-b border-white/10
          rotate-45
        "/>
      </div>
    </div>
  )
}