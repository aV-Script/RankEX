export function GroupCard({ group, clients, onClick }) {
  const groupClients = clients.filter(c => group.clientIds.includes(c.id)).slice(0, 3)
  const remaining    = Math.max(0, group.clientIds.length - 3)

  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-[4px] p-4 cursor-pointer transition-all duration-200 group border"
      style={{ background: 'rgba(13,21,32,0.9)', borderColor: 'rgba(15,214,90,0.12)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = 'rgba(15,214,90,0.05)'
        e.currentTarget.style.borderColor = 'rgba(15,214,90,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = 'rgba(13,21,32,0.9)'
        e.currentTarget.style.borderColor = 'rgba(15,214,90,0.12)'
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-display font-black text-[15px] text-white truncate leading-tight">
            {group.name}
          </div>
          <div className="font-display text-[12px] text-white/30 mt-0.5">
            {group.clientIds.length} {group.clientIds.length === 1 ? 'cliente' : 'clienti'}
          </div>

          {/* Avatars iniziali membri */}
          {groupClients.length > 0 && (
            <div className="flex items-center mt-2.5 gap-1">
              {groupClients.map(c => (
                <div
                  key={c.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-display font-black"
                  style={{ background: 'rgba(15,214,90,0.12)', border: '1px solid rgba(15,214,90,0.2)', color: '#0fd65a' }}
                  title={c.name}
                >
                  {c.name?.charAt(0).toUpperCase()}
                </div>
              ))}
              {remaining > 0 && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-display"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
                >
                  +{remaining}
                </div>
              )}
            </div>
          )}
        </div>

        <svg className="shrink-0 text-white/20 group-hover:text-white/50 transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </button>
  )
}