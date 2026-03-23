import { Input } from '../../../components/ui'

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
  query, setQuery,
  filterCategoria, setFilterCategoria,
  filterGroup, setFilterGroup,
  sortBy, setSortBy,
  categorie,
  groups,
  onNewClient,
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
          onChange={e => setQuery(e.target.value)}
          className="w-full"
        />
      </FilterSection>

      {categorie.length > 1 && (
        <FilterSection label="CATEGORIA">
          {categorie.map(cat => (
            <FilterBtn
              key={cat}
              active={filterCategoria === cat}
              onClick={() => setFilterCategoria(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </FilterBtn>
          ))}
        </FilterSection>
      )}

      {groups.length > 0 && (
        <FilterSection label="GRUPPO">
          <FilterBtn active={filterGroup === null} onClick={() => setFilterGroup(null)}>
            Tutti
          </FilterBtn>
          {groups.map(g => (
            <FilterBtn
              key={g.id}
              active={filterGroup === g.id}
              onClick={() => setFilterGroup(g.id)}
            >
              {g.name}
              <span className="ml-1 opacity-40 text-[10px]">({g.clientIds.length})</span>
            </FilterBtn>
          ))}
        </FilterSection>
      )}

      <FilterSection label="ORDINA PER">
        {SORT_OPTIONS.map(([val, label]) => (
          <FilterBtn key={val} active={sortBy === val} onClick={() => setSortBy(val)}>
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
      className="text-left px-3 py-2 rounded-xl font-body text-[12px] cursor-pointer border transition-all"
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
      className="w-full py-2.5 text-[11px] rounded-xl font-display tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85"
      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}
    >
      {children}
    </button>
  )
}