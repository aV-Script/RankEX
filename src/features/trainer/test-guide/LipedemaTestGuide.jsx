import { useState } from 'react'
import { LIPEDEMA_GUIDE } from '../../../config/lipedemaGuide.config'
import { LIPEDEMA_TEST_ORDER } from '../../../config/lipedemaTests.config'
import { TWO_MINUTE_WALK } from '../../../utils/lipedema'

const [FIRST_TEST_ID] = LIPEDEMA_TEST_ORDER
const PROTOCOL_VERSION = TWO_MINUTE_WALK.protocolVersion
const WARNING_COLOR = '#fbbf24'
const HEADING_CLASS = 'font-display font-extrabold text-[11px] tracking-[1.6px] m-0'

/** Guida dei 5 test del modulo Lipedema: un test alla volta, testi dai protocolli */
export function LipedemaTestGuide() {
  const [selectedId, setSelectedId] = useState(FIRST_TEST_ID)
  const guide = LIPEDEMA_GUIDE[selectedId]

  return (
    <div className="text-white max-w-[1440px] mx-auto px-4 lg:px-7 py-6 pb-24 lg:pb-10 flex flex-col lg:flex-row gap-5 items-start">
      <aside aria-label="Test del protocollo" className="hidden lg:flex flex-col gap-2.5 w-[300px] shrink-0">
        <PageTitle />
        {LIPEDEMA_TEST_ORDER.map(testId => (
          <button
            key={testId}
            type="button"
            aria-pressed={testId === selectedId}
            onClick={() => setSelectedId(testId)}
            className="text-left rounded-[4px] px-3.5 py-3 flex flex-col gap-1 cursor-pointer text-white"
            style={getTestButtonStyle(testId === selectedId)}
          >
            <span className="font-display font-extrabold text-[13px]">{LIPEDEMA_GUIDE[testId].title}</span>
            <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>{LIPEDEMA_GUIDE[testId].what}</span>
          </button>
        ))}
      </aside>

      <div className="lg:hidden w-full flex flex-col gap-3">
        <PageTitle />
        <nav aria-label="Test del protocollo" className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {LIPEDEMA_TEST_ORDER.map(testId => (
            <button
              key={testId}
              type="button"
              aria-pressed={testId === selectedId}
              onClick={() => setSelectedId(testId)}
              className="shrink-0 min-h-[44px] px-3 rounded-[4px] font-display text-[11px] font-extrabold tracking-[1.3px] text-white cursor-pointer"
              style={getTestButtonStyle(testId === selectedId)}
            >
              {LIPEDEMA_GUIDE[testId].tabLabel}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="font-display font-black text-[18px] lg:text-[20px] tracking-[1px] m-0">{guide.title}</h2>
          <span className="font-body text-[13px]" style={{ color: 'var(--rx-text-muted)' }}>{guide.subtitle}</span>
        </header>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 lg:gap-3">
          {guide.facts.map(fact => (
            <div key={fact.label} className="rx-card rounded-[4px] p-2.5 lg:p-3.5 flex flex-col gap-1">
              <span className="font-display font-bold text-[10px] tracking-[1.3px]" style={{ color: 'var(--rx-text-muted)' }}>{fact.label}</span>
              <span className="font-body text-[13px] lg:text-[14px] font-semibold">{fact.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <section className="rx-card rounded-[4px] p-4 flex flex-col gap-2.5">
            <h3 className={HEADING_CLASS} style={{ color: 'var(--rx-accent-2)' }}>PROCEDURA</h3>
            <ol className="m-0 pl-5 flex flex-col gap-2 font-body text-[14px] leading-normal list-decimal">
              {guide.procedure.map(step => <li key={step}>{step}</li>)}
            </ol>
          </section>

          <section className="rx-card rounded-[4px] p-4 flex flex-col gap-2.5">
            <h3 className={HEADING_CLASS} style={{ color: 'var(--rx-accent-2)' }}>ISTRUZIONE VERBALE</h3>
            <p className="font-body text-[14px] leading-relaxed m-0">«{guide.verbal}»</p>
            {guide.verbalNote && (
              <p className="font-body text-[13px] m-0" style={{ color: 'var(--rx-text-muted)' }}>{guide.verbalNote}</p>
            )}
            <h3 className={`${HEADING_CLASS} pt-1.5`} style={{ color: WARNING_COLOR }}>QUANDO INTERROMPERE</h3>
            <p className="font-body text-[13px] leading-normal m-0" style={{ color: 'var(--rx-text-muted)' }}>{guide.stop}</p>
          </section>
        </div>

        {guide.checklist && (
          <section className="rx-card rounded-[4px] p-4 flex flex-col gap-2.5">
            <h3 className={HEADING_CLASS} style={{ color: 'var(--rx-accent-2)' }}>CHECKLIST OPERATORE</h3>
            <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 font-body text-[13px]">
              {guide.checklist.map(item => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" style={{ color: 'var(--rx-text-muted)' }}>☐</span>{item}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function PageTitle() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-display font-black text-[18px] lg:text-[22px] tracking-[1.5px] m-0">GUIDA TEST</h1>
      <span className="font-body text-[12px]" style={{ color: 'var(--rx-text-muted)' }}>
        Batteria CORE · protocollo {PROTOCOL_VERSION}
      </span>
    </div>
  )
}

// ── Funzioni helper pure ──────────────────────────────────────────────────────

function getTestButtonStyle(isSelected) {
  return {
    border: `1px solid ${isSelected ? 'var(--rx-accent)' : 'var(--rx-border)'}`,
    background: isSelected ? 'color-mix(in srgb, var(--rx-accent) 12%, transparent)' : 'var(--rx-card-bg)',
  }
}
