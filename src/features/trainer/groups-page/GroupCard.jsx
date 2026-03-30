/**
 * Card singolo gruppo nella lista.
 * Mostra nome, numero clienti e avatar dei primi 3 clienti.
 */
export function GroupCard({ group, clients, onClick }) {
  const groupClients = clients.filter(c => group.clientIds.includes(c.id)).slice(0, 3)
  const remaining    = Math.max(0, group.clientIds.length - 3)

  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-[4px] p-4 cursor-pointer transition-all duration-200 group border"
      style={{ background: 'rgba(13,21,32,0.9)', borderColor: 'rgba(15,214,90,0.12)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background    = 'rgba(15,214,90,0.05)'
        e.currentTarget.style.borderColor   = 'rgba(15,214,90,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background    = 'rgba(13,21,32,0.9)'
        e.currentTarget.style.borderColor   = 'rgba(15,214,90,0.12)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-display font-black text-[15px] text-white truncate">
            {group.name}
          </div>
          <div className="font-body text-[12px] text-white/30 mt-0.5">
            {group.clientIds.length} {group.clientIds.length === 1 ? 'cliente' : 'clienti'}
          </div>
        </div>

        {/* Avatar clienti */}
        {groupClients.length > 0 && (
          <div className="flex items-center shrink-0 ml-3">
            <div className="flex -space-x-2">
              {groupClients.map(c => (
                <div
                  key={c.id}
                  className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#080c12]"
                  style={{ background: 'rgba(15,214,90,0.15)' }}
                >
                  <span className="font-display text-[10px]" style={{ color: '#0fd65a' }}>
                    {c.name?.[0]?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            {remaining > 0 && (
              <span className="font-display text-[10px] text-white/30 ml-2">
                +{remaining}
              </span>
            )}
          </div>
        )}

        <span className="text-white/20 text-[16px] group-hover:text-white/50 transition-colors ml-3">
          ›
        </span>
      </div>
    </button>
  )
}