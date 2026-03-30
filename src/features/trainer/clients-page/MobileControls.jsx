import { Input } from '../../../components/ui'

const SORT_OPTIONS = [
  ['name',  'Nome A→Z'],
  ['rank',  'Rank migliore'],
  ['level', 'Livello più alto'],
]

export function MobileControls({
  query,  onQueryChange,
  sortBy, onSortByChange,
  onNewClient,
}) {
  return (
    <div className="lg:hidden mb-5">

      {/* Search */}
      <Input
        placeholder="Cerca..."
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        className="w-full mb-3"
      />

      {/* Filtri + bottone */}
      <div className="flex items-center gap-2">

        {/* Chips scrollabili */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
          {SORT_OPTIONS.map(([val, label]) => (
            <button
              key={val}
              onClick={() => onSortByChange(val)}
              className="shrink-0 rounded-[3px] px-3 py-1.5 font-display text-[10px] tracking-wide cursor-pointer border transition-all whitespace-nowrap"
              style={sortBy === val
                ? { background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }
                : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bottone nuovo */}
        <GradientBtn onClick={onNewClient}>
          NUOVO CLIENTE
        </GradientBtn>

      </div>
    </div>
  )
}

function GradientBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-[10px] rounded-[3px] font-display tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85 shrink-0"
      style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', color: '#080c12' }}
    >
      {children}
    </button>
  )
}