import { Input }        from '../../../components/ui'
import { PLAYER_ROLES } from '../../../config/modules.config'

const SORT_OPTIONS = [
  ['name',  'Nome A→Z'],
  ['rank',  'Rank migliore'],
  ['level', 'Livello più alto'],
]

/**
 * Sidebar desktop con filtri e ordinamento.
 * Riceve tutto dallo hook useClientFilters — non gestisce stato proprio.
 */
export function FiltersSidebar({
  query,          onQueryChange,
  filterCategoria, onCategoriaChange,
  filterGroup,    onGroupChange,
  sortBy,         onSortByChange,
  categorie,
  groups,
  onNewClient,
  isSoccer = false,
}) {
  return (
    <aside className="
      hidden lg:flex flex-col w-64 xl:w-72 shrink-0
      border-r border-white/[.05] p-6 gap-5
      sticky top-0 h-screen overflow-y-auto
    ">
      <GradientBtn onClick={onNewClient}>NUOVO CLIENTE</GradientBtn>

      <FilterSection label="RICERCA">
        <Input
          placeholder="Nome cliente..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className="w-full"
        />
      </FilterSection>

      {categorie.length > 1 && (
        <FilterSection label={isSoccer ? 'RUOLO' : 'CATEGORIA'}>
          {categorie.map(val => {
            const label = isSoccer && val !== 'tutti'
              ? (PLAYER_ROLES.find(r => r.value === val)?.label ?? val)
              : val.charAt(0).toUpperCase() + val.slice(1)
            return (
              <FilterBtn
                key={val}
                active={filterCategoria === val}
                onClick={() => onCategoriaChange(val)}
              >
                {label}
              </FilterBtn>
            )
          })}
        </FilterSection>
      )}

      {groups.length > 0 && (
        <FilterSection label="GRUPPO">
          <FilterBtn active={filterGroup === null} onClick={() => onGroupChange(null)}>
            Tutti
          </FilterBtn>
          {groups.map(g => (
            <FilterBtn
              key={g.id}
              active={filterGroup === g.id}
              onClick={() => onGroupChange(g.id)}
            >
              {g.name}
              <span className="ml-1 opacity-40 text-[10px]">({g.clientIds.length})</span>
            </FilterBtn>
          ))}
        </FilterSection>
      )}

      <FilterSection label="ORDINA PER">
        {SORT_OPTIONS.map(([val, label]) => (
          <FilterBtn key={val} active={sortBy === val} onClick={() => onSortByChange(val)}>
            {label}
          </FilterBtn>
        ))}
      </FilterSection>
    </aside>
  )
}

function FilterSection({ label, children }) {
  return (
    <div>
      <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-2">{label}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="text-left px-3 py-2 rounded-[3px] font-body text-[12px] cursor-pointer border transition-all"
      style={active
        ? { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#fff' }
        : { background: 'transparent', borderColor: 'transparent', color: 'rgba(255,255,255,0.4)' }
      }
    >
      {children}
    </button>
  )
}

function GradientBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2.5 text-[11px] rounded-[3px] font-display tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85"
      style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', color: '#080c12' }}
    >
      {children}
    </button>
  )
}