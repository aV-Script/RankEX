import { useState } from 'react'
import { getTestsForCategoria, CATEGORIE, ALL_TESTS } from '../../constants'
import { useTrainerState }  from '../../context/TrainerContext'
import { getModule, SOCCER_AGE_GROUPS } from '../../config/modules.config'

const CATEGORY_COLORS = { health: '#34d399', active: '#00c8ff', athlete: '#0066cc' }
const SOCCER_COLOR    = '#00c8ff'

const FASCIA_COLORS = {
  soccer_youth:  '#fbbf24',
  soccer_junior: '#a78bfa',
  soccer:        '#00c8ff',
}

export function TestGuidePage() {
  const { moduleType } = useTrainerState()
  const isSoccer       = getModule(moduleType).isSoccer

  const [selectedCat,  setSelectedCat]  = useState('health')
  const [selectedTest, setSelectedTest] = useState(getTestsForCategoria('health')[0].key)
  const [menuOpen,     setMenuOpen]     = useState(false)

  // Soccer: selettore fascia + test per fascia
  const [soccerFascia, setSoccerFascia] = useState('soccer')
  const soccerTests = isSoccer ? ALL_TESTS.filter(t => t.categories.includes(soccerFascia)) : null
  const [soccerSelectedTest, setSoccerSelectedTest] = useState(() =>
    ALL_TESTS.find(t => t.categories.includes('soccer'))?.key ?? null
  )

  if (isSoccer) {
    const currentTest  = soccerTests?.find(t => t.key === soccerSelectedTest) ?? soccerTests?.[0]
    const guide        = currentTest?.guide
    const fasciaColor  = FASCIA_COLORS[soccerFascia] ?? SOCCER_COLOR

    return (
      <div className="text-white">
          <div className="flex min-h-[calc(100vh-57px)]">
          {/* Sidebar desktop */}
          <aside className="hidden lg:flex w-60 xl:w-72 shrink-0 border-r border-white/[.05] flex-col sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
            {/* Tab fascia */}
            <div className="flex shrink-0 border-b border-white/[.05]">
              {SOCCER_AGE_GROUPS.map(g => {
                const fc     = FASCIA_COLORS[g.value] ?? SOCCER_COLOR
                const active = soccerFascia === g.value
                return (
                  <button
                    key={g.value}
                    onClick={() => { setSoccerFascia(g.value); setSoccerSelectedTest(ALL_TESTS.find(t => t.categories.includes(g.value))?.key ?? null) }}
                    className="relative flex-1 flex items-center justify-center py-3 font-display text-[9px] tracking-widest cursor-pointer border-none bg-transparent transition-colors"
                    style={{ color: active ? fc : 'rgba(255,255,255,0.3)' }}
                  >
                    {active && (
                      <div
                        aria-hidden="true"
                        className="absolute bottom-0 left-1 right-1 h-[2px] rounded-t-sm"
                        style={{ background: `linear-gradient(90deg,${fc},${fc}88)`, boxShadow: `0 0 6px ${fc}44` }}
                      />
                    )}
                    {g.label.toUpperCase()}
                  </button>
                )
              })}
            </div>
            <div className="p-4 flex flex-col gap-1">
              {soccerTests.map(t => {
                const active = currentTest?.key === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setSoccerSelectedTest(t.key)}
                    className="text-left px-3 py-2.5 rounded-[3px] font-body text-[13px] cursor-pointer border-none bg-transparent transition-colors"
                    style={{ color: active ? '#fff' : 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                  >
                    <span className="flex items-center gap-2">
                      {active && <span className="w-1 h-1 rounded-full shrink-0" style={{ background: fasciaColor }} />}
                      {!active && <span className="w-1 h-1 rounded-full shrink-0 opacity-0" />}
                      {t.label.charAt(0) + t.label.slice(1).toLowerCase()}
                    </span>
                    <span className="block font-display text-[10px] mt-0.5 pl-3" style={{ color: active ? fasciaColor + 'aa' : 'rgba(255,255,255,0.2)' }}>{t.test}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Mobile */}
          <div className="lg:hidden w-full">
            <div className="px-4 py-4 border-b border-white/[.05]">
              {/* Selettore fascia mobile */}
              <div className="flex gap-2 mb-3">
                {SOCCER_AGE_GROUPS.map(g => {
                  const fc = FASCIA_COLORS[g.value] ?? SOCCER_COLOR
                  return (
                    <button
                      key={g.value}
                      onClick={() => { setSoccerFascia(g.value); setSoccerSelectedTest(ALL_TESTS.find(t => t.categories.includes(g.value))?.key ?? null); setMenuOpen(false) }}
                      className="flex-1 py-1.5 rounded-[3px] font-display text-[10px] tracking-wide cursor-pointer border transition-all"
                      style={soccerFascia === g.value
                        ? { background: fc + '22', borderColor: fc + '66', color: fc }
                        : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
                      }
                    >
                      {g.label}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-[3px] cursor-pointer border transition-all"
                style={{ background: 'var(--rx-card-bg)', borderColor: fasciaColor + '33' }}
              >
                <div className="text-left">
                  <span className="font-display text-[10px] tracking-[2px] block" style={{ color: fasciaColor }}>
                    {SOCCER_AGE_GROUPS.find(g => g.value === soccerFascia)?.label?.toUpperCase() ?? 'SOCCER'}
                  </span>
                  <span className="font-body text-[14px] text-white mt-0.5 block">
                    {currentTest?.label}
                  </span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOpen && (
                <div className="rounded-[3px] overflow-hidden mt-2"
                  style={{ background: 'var(--rx-surface)', border: `1px solid ${fasciaColor}33` }}>
                  {soccerTests.map(t => (
                    <button
                      key={t.key}
                      onClick={() => { setSoccerSelectedTest(t.key); setMenuOpen(false) }}
                      className="w-full text-left px-4 py-3 flex items-center justify-between cursor-pointer transition-all border-none"
                      style={{
                        background:   currentTest?.key === t.key ? fasciaColor + '18' : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <span className="font-body text-[14px]"
                        style={{ color: currentTest?.key === t.key ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                        {t.label.charAt(0) + t.label.slice(1).toLowerCase()}
                      </span>
                      {currentTest?.key === t.key && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke={fasciaColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {guide && (
              <div className="px-4 py-6 max-w-3xl mx-auto">
                <GuideContent test={currentTest} guide={guide} color={fasciaColor} />
              </div>
            )}
          </div>

          {/* Desktop content */}
          {guide && (
            <main className="hidden lg:block flex-1 px-4 lg:px-6 py-8 max-w-3xl overflow-y-auto">
              <GuideContent test={currentTest} guide={guide} color={fasciaColor} />
            </main>
          )}
        </div>
      </div>
    )
  }

  // ── Personal Training ──────────────────────────────────────────────────────

  const tests       = getTestsForCategoria(selectedCat)
  const currentTest = tests.find(t => t.key === selectedTest)
  const guide       = currentTest?.guide
  const catColor    = CATEGORY_COLORS[selectedCat]
  const catDef      = CATEGORIE.find(c => c.id === selectedCat)

  const handleSelectCat = (catId) => {
    setSelectedCat(catId)
    setSelectedTest(getTestsForCategoria(catId)[0].key)
    setMenuOpen(false)
  }

  const handleSelectTest = (key) => {
    setSelectedTest(key)
    setMenuOpen(false)
  }

  return (
    <div className="text-white">

      <div className="flex min-h-[calc(100vh-57px)]">

        {/* Sidebar desktop */}
        <aside className="hidden lg:flex w-60 xl:w-72 shrink-0 border-r border-white/[.05] flex-col sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">

          {/* Tab categorie */}
          <div className="flex shrink-0 border-b border-white/[.05]">
            {CATEGORIE.map(cat => {
              const active = selectedCat === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCat(cat.id)}
                  className="relative flex-1 flex items-center justify-center py-3 font-display text-[9px] tracking-widest cursor-pointer border-none bg-transparent transition-colors"
                  style={{ color: active ? cat.color : 'rgba(255,255,255,0.3)' }}
                >
                  {active && (
                    <div
                      aria-hidden="true"
                      className="absolute bottom-0 left-1 right-1 h-[2px] rounded-t-sm"
                      style={{ background: `linear-gradient(90deg,${cat.color},${cat.color}88)`, boxShadow: `0 0 6px ${cat.color}44` }}
                    />
                  )}
                  {cat.label.toUpperCase()}
                </button>
              )
            })}
          </div>

          {/* Lista test */}
          <div className="p-4 flex flex-col gap-1">
            {tests.map(t => {
              const active = selectedTest === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setSelectedTest(t.key)}
                  className="text-left px-3 py-2.5 rounded-[3px] font-body text-[13px] cursor-pointer border-none bg-transparent transition-colors"
                  style={{ color: active ? '#fff' : 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                >
                  <span className="flex items-center gap-2">
                    {active && <span className="w-1 h-1 rounded-full shrink-0" style={{ background: catColor }} />}
                    {!active && <span className="w-1 h-1 rounded-full shrink-0 opacity-0" />}
                    {t.label.charAt(0) + t.label.slice(1).toLowerCase()}
                  </span>
                  <span className="block font-display text-[10px] mt-0.5 pl-3" style={{ color: active ? catColor + 'aa' : 'rgba(255,255,255,0.2)' }}>{t.test}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Mobile */}
        <div className="lg:hidden w-full">

          <div className="px-4 py-4 border-b border-white/[.05] flex flex-col gap-3">

            {/* Categorie scroll */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIE.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCat(cat.id)}
                  className="shrink-0 px-3 py-2 rounded-[3px] font-display text-[10px] tracking-widest cursor-pointer border transition-all"
                  style={selectedCat === cat.id
                    ? { background: cat.color + '22', borderColor: cat.color + '55', color: cat.color }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Dropdown test */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-[3px] cursor-pointer border transition-all"
              style={{ background: 'var(--rx-card-bg)', borderColor: 'color-mix(in srgb, var(--rx-green) 15%, transparent)' }}
            >
              <div className="text-left">
                <span className="font-display text-[10px] tracking-[2px] block" style={{ color: catColor }}>
                  {catDef?.label.toUpperCase()}
                </span>
                <span className="font-body text-[14px] text-white mt-0.5 block">
                  {currentTest?.label}
                </span>
              </div>

              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen && (
              <div className="rounded-[3px] overflow-hidden"
                style={{ background: 'var(--rx-surface)', border: '1px solid color-mix(in srgb, var(--rx-green) 15%, transparent)' }}>
                {tests.map(t => (
                  <button
                    key={t.key}
                    onClick={() => handleSelectTest(t.key)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between cursor-pointer transition-all border-none"
                    style={{
                      background: selectedTest === t.key ? catColor + '18' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div>
                      <span className="font-body text-[14px]"
                        style={{ color: selectedTest === t.key ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                        {t.label.charAt(0) + t.label.slice(1).toLowerCase()}
                      </span>
                      <span className="block font-display text-[10px] opacity-40 mt-0.5">{t.test}</span>
                    </div>

                    {selectedTest === t.key && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke={catColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {guide && (
            <div className="px-4 py-6 max-w-3xl mx-auto">
              <GuideContent test={currentTest} guide={guide} color={catColor} />
            </div>
          )}
        </div>

        {/* Desktop content */}
        {guide && (
          <main className="hidden lg:block flex-1 px-4 lg:px-6 py-8 max-w-3xl overflow-y-auto">
            <GuideContent test={currentTest} guide={guide} color={catColor} />
          </main>
        )}
      </div>
    </div>
  )
}

function GuideContent({ test, guide, color }) {
  return (
    <>
      <div className="mb-10">
        <h2 className="font-display font-black text-[28px] lg:text-[32px] leading-tight m-0">
          {test.test}
        </h2>

        <div className="flex gap-2 mt-3 flex-wrap">
          <Pill label="Statistica" value={test.stat.charAt(0).toUpperCase() + test.stat.slice(1)} color={color} />
          <Pill label="Unità" value={test.unit} color={color} />
          <Pill label="Durata" value={guide.duration} color={color} />
        </div>
      </div>

      <GuideSection title="Attrezzatura necessaria">
        <ul className="flex flex-col gap-2">
          {guide.equipment.map((item, i) => (
            <li key={i} className="flex gap-2.5 items-start rounded-[3px] px-3 py-2.5"
              style={{ background: 'var(--rx-card-bg)', border: `1px solid ${color}14` }}>
              <span className="mt-0.5 text-[12px] shrink-0" style={{ color }}>{i + 1}</span>
              <span className="text-[13px] text-white/60">{item}</span>
            </li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection title="Riscaldamento">
        <ol className="flex flex-col gap-2">
          {guide.warmup.map((step, i) => (
            <li key={i} className="flex gap-2.5 items-start rounded-[3px] px-3 py-2.5"
              style={{ background: 'var(--rx-card-bg)', border: `1px solid ${color}14` }}>
              <span className="mt-0.5 text-[12px] shrink-0" style={{ color }}>{i + 1}</span>
              <span className="text-[13px] text-white/60">{step}</span>
            </li>
          ))}
        </ol>
      </GuideSection>

      <GuideSection title="Protocollo di esecuzione">
        <ol className="flex flex-col gap-2">
          {guide.protocol.map((step, i) => (
            <li key={i} className="flex gap-2.5 items-start rounded-[3px] px-3 py-2.5"
              style={{ background: 'var(--rx-card-bg)', border: `1px solid ${color}14` }}>
              <span className="mt-0.5 text-[12px] shrink-0" style={{ color }}>{i + 1}</span>
              <span className="text-[13px] text-white/60">{step}</span>
            </li>
          ))}
        </ol>
      </GuideSection>

      <GuideSection title="Note operative">
        <ul className="flex flex-col gap-2">
          {guide.notes.map((note, i) => (
            <li key={i} className="flex gap-2.5 items-start rounded-[3px] px-3 py-2.5"
              style={{ background: 'var(--rx-card-bg)', border: `1px solid ${color}14` }}>
              <span className="mt-0.5 text-[12px] shrink-0" style={{ color }}>{i + 1}</span>
              <span className="text-[13px] text-white/60">{note}</span>
            </li>
          ))}
        </ul>
      </GuideSection>
    </>
  )
}

function GuideSection({ title, children }) {
  return (
    <div className="mb-10">
      <div className="text-[10px] tracking-[3px] uppercase mb-4 text-white/30">
        {title}
      </div>
      {children}
    </div>
  )
}

function Pill({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 leading-none"
      style={{ background: 'var(--rx-card-bg)', border: '1px solid color-mix(in srgb, var(--rx-green) 12%, transparent)' }}>
      <span className="text-[11px] text-white/30">{label}:</span>
      <span className="text-[11px]" style={{ color }}>{value}</span>
    </div>
  )
}