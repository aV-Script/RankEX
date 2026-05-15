export function TabItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      className="flex-1 flex flex-col items-center gap-1 py-2.5 cursor-pointer relative border-none bg-transparent"
      style={{ transition: 'opacity 100ms' }}
    >
      <span
        style={{
          color:      active ? '#0fd65a' : 'rgba(200,212,224,0.3)',
          transform:  active ? 'scale(1.12)' : 'scale(1)',
          transition: 'color 150ms, transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
          display:    'flex',
          filter:     active ? 'drop-shadow(0 0 6px rgba(15,214,90,0.5))' : 'none',
        }}
      >
        {item.icon}
      </span>
      <span
        className="font-display text-[10px] tracking-[1px]"
        style={{
          color:      active ? '#0fd65a' : 'rgba(200,212,224,0.3)',
          transition: 'color 150ms',
        }}
      >
        {item.label.toUpperCase()}
      </span>
    </button>
  )
}
