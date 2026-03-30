/**
 * Icona della sidebar desktop con tooltip al hover.
 * Stili attivi/hover via inline style con palette Rank EX ufficiale.
 */
export function SidebarIcon({ item, active, onClick }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        data-active={active}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
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
