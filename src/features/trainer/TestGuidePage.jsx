import { useState } from 'react'
import { getTestsForCategoria, CATEGORIE } from '../../constants'

const CATEGORY_COLORS = { health: '#34d399', active: '#60a5fa', athlete: '#f59e0b' }

export function TestGuidePage() {
  const [selectedCat,  setSelectedCat]  = useState('health')
  const [selectedTest, setSelectedTest] = useState(getTestsForCategoria('health')[0].key)
  const [menuOpen,     setMenuOpen]     = useState(false)
  
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

      {/* Header desktop */}
      <div className="hidden lg:flex items-center px-4 lg:px-6 py-4 border-b border-white/[.05]">
        <h1 className="font-display font-black text-[20px] m-0">Guida Test</h1>
      </div>

      <div className="flex min-h-[calc(100vh-57px)]">

        {/* Sidebar desktop */}
        <aside className="hidden lg:flex w-60 xl:w-72 shrink-0 border-r border-white/[.05] flex-col sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">

          {/* Categorie */}
          <div className="flex border-b border-white/[.05]">
            {CATEGORIE.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleSelectCat(cat.id)}
                className="flex-1 py-3 font-display text-[10px] tracking-widest cursor-pointer border-none transition-all"
                style={{
                  background: selectedCat === cat.id ? cat.color + '18' : 'transparent',
                  color: selectedCat === cat.id ? cat.color : 'rgba(255,255,255,0.3)',
                  borderBottom: selectedCat === cat.id ? `2px solid ${cat.color}` : '2px solid transparent',
                }}
              >
                {cat.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Lista test */}
          <div className="p-4 flex flex-col gap-2">
            {tests.map(t => (
              <button
                key={t.key}
                onClick={() => setSelectedTest(t.key)}
                className="text-left px-3 py-2.5 rounded-xl font-body text-[13px] cursor-pointer border transition-all"
                style={selectedTest === t.key
                  ? { background: catColor + '18', borderColor: catColor + '44', color: '#fff' }
                  : { background: 'transparent', borderColor: 'transparent', color: 'rgba(255,255,255,0.4)' }
                }
              >
                {t.label}
                <span className="block font-display text-[10px] opacity-50 mt-0.5">{t.test}</span>
              </button>
            ))}
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
                  className="shrink-0 px-3 py-2 rounded-xl font-display text-[10px] tracking-widest cursor-pointer border transition-all"
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
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer border transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
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
              <div className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(15,31,61,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                        {t.label}
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
        <p className="font-display text-[10px] tracking-[3px] mb-2" style={{ color }}>
          GUIDA ESECUZIONE TEST
        </p>

        <h2 className="font-display font-black text-[28px] lg:text-[32px] leading-tight m-0">
          {test.test}
        </h2>

        <div className="flex gap-2 mt-3 flex-wrap">
          <Pill label="Statistica" value={test.stat} color={color} />
          <Pill label="Unità" value={test.unit} color={color} />
          <Pill label="Durata" value={guide.duration} color={color} />
        </div>
      </div>

      <GuideSection title="Attrezzatura necessaria">
        <ul className="flex flex-col gap-3">
          {guide.equipment.map((item, i) => (
            <li key={i} className="flex gap-2.5 items-start">
              <span className="w-1.5 h-1.5 rounded-full mt-[6px]" style={{ background: color }} />
              <span className="text-[14px] text-white/70">{item}</span>
            </li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection title="Riscaldamento">
        <ol className="flex flex-col gap-3">
          {guide.warmup.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="text-[11px] text-white/25 mt-[2px] w-4">{i + 1}</span>
              <span className="text-[14px] text-white/70">{step}</span>
            </li>
          ))}
        </ol>
      </GuideSection>

      <GuideSection title="Protocollo di esecuzione">
        <ol className="flex flex-col gap-4">
          {guide.protocol.map((step, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="font-display font-black text-[13px] w-7 h-7 rounded-lg flex items-center justify-center mt-[2px]"
                style={{ background: color + '22', color }}>
                {i + 1}
              </span>
              <span className="text-[14px] text-white/80">{step}</span>
            </li>
          ))}
        </ol>
      </GuideSection>

      <GuideSection title="Note operative">
        <ul className="flex flex-col gap-3">
          {guide.notes.map((note, i) => (
            <li key={i} className="flex gap-2.5 items-start rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="mt-0.5 text-[12px]" style={{ color }}>{i+1}</span>
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
    <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 leading-none"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="text-[11px] text-white/30">{label}:</span>
      <span className="text-[11px]" style={{ color }}>{value}</span>
    </div>
  )
}