/**
 * Tab della barra di navigazione mobile.
 * Indicatore attivo: linea verde/ciano sotto la tab.
 */
export function TabItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
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
        className="font-display text-[10px] tracking-[1px]"
        style={{ color: active ? '#0fd65a' : 'rgba(200,212,224,0.3)' }}
      >
        {item.label.toUpperCase()}
      </span>
    </button>
  )
}
