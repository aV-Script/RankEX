import { useState, useMemo } from 'react'
import { SectionLabel, EmptyState, Button, Textarea } from '../../../components/ui'
import { Skeleton }                from '../../../components/common/Skeleton'
import { useRunbook }              from '../../../hooks/useRunbook'
import { RUNBOOK_SUITES, SEVERITY, TOTAL_CASES } from '../../../config/runbook.config'
import { ADMIN_COLOR }             from '../../../config/app.config'

const STATUS_META = {
  pass: { label: 'PASS', color: '#4ade80' },
  fail: { label: 'FAIL', color: '#f87171' },
  skip: { label: 'SKIP', color: 'rgba(255,255,255,0.35)' },
}

/**
 * Runbook manuale — solo super_admin. Casi definiti in config/runbook.config.js
 * (sostituisce docs/test-plan.md, che non veniva mai aggiornato dopo il rilascio
 * di una feature). Ogni giro di verifica viene salvato in Firestore (qa_runs) —
 * a differenza del vecchio test-plan.md, qui "superato" è un dato, non una casella
 * markdown mai spuntata.
 */
export function RunbookPage() {
  const { runs, loading, saving, handleSaveRun } = useRunbook()
  const [mode, setMode] = useState('idle') // 'idle' | 'picking' | 'running'
  const [selectedSuites, setSelectedSuites] = useState(new Set())
  const [results, setResults] = useState({})
  const [expandedRunId, setExpandedRunId] = useState(null)

  const casesInRun = useMemo(
    () => RUNBOOK_SUITES.filter(s => selectedSuites.has(s.id)).flatMap(s => s.cases),
    [selectedSuites]
  )

  const toggleSuite = (id) => setSelectedSuites(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const startRun = () => { setResults({}); setMode('running') }

  const setCaseResult = (caseId, status) =>
    setResults(prev => ({ ...prev, [caseId]: { status, note: prev[caseId]?.note ?? '' } }))

  const setCaseNote = (caseId, note) =>
    setResults(prev => ({ ...prev, [caseId]: { status: prev[caseId]?.status ?? 'skip', note } }))

  const doneCount = casesInRun.filter(c => results[c.id]?.status).length

  const handleSave = async () => {
    const ok = await handleSaveRun([...selectedSuites], results)
    if (ok) {
      setMode('idle')
      setSelectedSuites(new Set())
      setResults({})
    }
  }

  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color={ADMIN_COLOR}>◈ Runbook</SectionLabel>
          <p className="font-body text-[12px] text-white/40 m-0">
            {TOTAL_CASES} casi manuali in {RUNBOOK_SUITES.length} suite — vedi config/runbook.config.js
          </p>
        </div>
        {mode === 'idle' && (
          <Button accentColor={ADMIN_COLOR} onClick={() => setMode('picking')}>+ NUOVO GIRO</Button>
        )}
      </div>

      {mode === 'picking' && (
        <div className="rounded-[4px] p-5 rx-card flex flex-col gap-4">
          <SectionLabel color={ADMIN_COLOR}>Scegli le suite da verificare</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RUNBOOK_SUITES.map(s => (
              <label key={s.id} className="flex items-center gap-2 text-[12px] font-body text-white/70 cursor-pointer">
                <input type="checkbox" checked={selectedSuites.has(s.id)} onChange={() => toggleSuite(s.id)} />
                {s.label} <span className="text-white/30">({s.cases.length})</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setMode('idle'); setSelectedSuites(new Set()) }}
              className="font-display text-[11px] px-3 py-1.5 rounded-[3px] cursor-pointer border-none bg-transparent text-white/40 hover:text-white/70 transition-colors"
            >
              ANNULLA
            </button>
            <Button accentColor={ADMIN_COLOR} disabled={selectedSuites.size === 0} onClick={startRun}>
              INIZIA CHECKLIST ({casesInRun.length} casi)
            </Button>
          </div>
        </div>
      )}

      {mode === 'running' && (
        <div className="flex flex-col gap-5">
          <div className="rounded-[4px] p-4 rx-card flex items-center justify-between sticky top-0 z-10">
            <span className="font-display text-[11px] text-white/50">{doneCount} / {casesInRun.length} casi valutati</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setMode('idle'); setSelectedSuites(new Set()); setResults({}) }}
                className="font-display text-[11px] px-3 py-1.5 rounded-[3px] cursor-pointer border-none bg-transparent text-white/40 hover:text-white/70 transition-colors"
              >
                ANNULLA GIRO
              </button>
              <Button accentColor={ADMIN_COLOR} loading={saving} onClick={handleSave}>SALVA GIRO</Button>
            </div>
          </div>

          {RUNBOOK_SUITES.filter(s => selectedSuites.has(s.id)).map(suite => (
            <div key={suite.id} className="flex flex-col gap-2">
              <SectionLabel color={ADMIN_COLOR} className="mb-0">{suite.label}</SectionLabel>
              {suite.cases.map(c => (
                <CaseRow
                  key={c.id}
                  testCase={c}
                  result={results[c.id]}
                  onSetStatus={(status) => setCaseResult(c.id, status)}
                  onSetNote={(note) => setCaseNote(c.id, note)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {mode === 'idle' && (
        <div className="flex flex-col gap-3">
          <SectionLabel color={ADMIN_COLOR}>Storico giri</SectionLabel>
          {loading ? (
            <Skeleton variant="list" count={3} />
          ) : runs.length === 0 ? (
            <EmptyState color={ADMIN_COLOR} title="Nessun giro registrato" description="Avvia il primo giro di verifica con NUOVO GIRO." />
          ) : (
            runs.map(run => (
              <RunRow
                key={run.id}
                run={run}
                expanded={expandedRunId === run.id}
                onToggle={() => setExpandedRunId(prev => prev === run.id ? null : run.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function CaseRow({ testCase, result, onSetStatus, onSetNote }) {
  const sev = SEVERITY[testCase.severity]
  const status = result?.status
  return (
    <div className="rounded-[4px] p-4 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span title={sev.label}>{sev.emoji}</span>
          <span className="font-display font-bold text-[12px] text-white/50">{testCase.id}</span>
          <span className="font-body text-[13px] text-white/80">{testCase.title}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          {['pass', 'fail', 'skip'].map(s => (
            <button
              key={s}
              onClick={() => onSetStatus(s)}
              className="font-display text-[10px] px-2.5 py-1 rounded-[3px] cursor-pointer border transition-all"
              style={status === s
                ? { color: STATUS_META[s].color, borderColor: `color-mix(in srgb, ${STATUS_META[s].color} 40%, transparent)`, background: `color-mix(in srgb, ${STATUS_META[s].color} 15%, transparent)` }
                : { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>
      {testCase.preconditions && (
        <p className="font-body text-[11px] text-white/40 m-0"><b className="text-white/50">Precondizioni:</b> {testCase.preconditions}</p>
      )}
      <ol className="font-body text-[11px] text-white/50 m-0 pl-4 flex flex-col gap-0.5">
        {testCase.steps.map((step, i) => <li key={i}>{step}</li>)}
      </ol>
      <p className="font-body text-[11px] text-white/40 m-0"><b className="text-white/50">Atteso:</b> {testCase.expected.join(' · ')}</p>
      {status === 'fail' && (
        <Textarea
          placeholder="Cosa è successo? (comportamento effettivo)"
          value={result?.note ?? ''}
          onChange={e => onSetNote(e.target.value)}
          rows={2}
          className="text-[11px]"
        />
      )}
    </div>
  )
}

function RunRow({ run, expanded, onToggle }) {
  const { pass = 0, fail = 0, skip = 0, total = 0 } = run.counts ?? {}
  return (
    <div className="rounded-[4px] p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 flex-wrap bg-transparent border-none cursor-pointer text-left p-0"
      >
        <span className="font-display text-[11px] text-white/60">{formatDate(run.finishedAt)} — {run.runByEmail ?? 'sconosciuto'}</span>
        <span className="font-display text-[10px] flex gap-2">
          <span style={{ color: STATUS_META.pass.color }}>{pass} PASS</span>
          <span style={{ color: STATUS_META.fail.color }}>{fail} FAIL</span>
          <span style={{ color: STATUS_META.skip.color }}>{skip} SKIP</span>
          <span className="text-white/30">/ {total}</span>
        </span>
      </button>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/[.06] flex flex-col gap-1.5">
          {Object.entries(run.results ?? {}).map(([caseId, r]) => (
            <div key={caseId} className="flex items-center gap-2 text-[11px] font-body">
              <span style={{ color: STATUS_META[r.status]?.color ?? '#666' }}>{STATUS_META[r.status]?.label ?? '—'}</span>
              <span className="text-white/50">{caseId}</span>
              {r.note && <span className="text-white/35 italic">— {r.note}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
