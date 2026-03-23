import { Field, Input } from '../../../ui'

/**
 * Step test — riusato per tutti e 5 i test della categoria.
 * Gestisce sia test semplici (singolo input) che test con variabili multiple.
 */
export function StepTest({ test, tests, setTests, errors, livePercentile }) {
  if (!test) return null

  const updateTest = (key) => (e) =>
    setTests(p => ({ ...p, [key]: e.target.value }))

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-display text-[10px] text-white/30 tracking-[2px] m-0 mb-1">
          {test.test}
        </p>
        {test.desc && (
          <p className="font-body text-[13px] text-white/50 m-0">{test.desc}</p>
        )}
      </div>

      {/* Test con variabili multiple — es. Y Balance */}
      {test.variables ? (
        <div className="flex flex-col gap-2">
          {test.variables.map(v => (
            <Field
              key={`${test.key}_${v.key}`}
              label={`${v.label} (${v.unit})`}
              error={errors[v.key]}
            >
              <Input
                type="number"
                step="0.1"
                value={tests[v.key] ?? ''}
                onChange={updateTest(v.key)}
                placeholder={`Valore in ${v.unit}`}
              />
            </Field>
          ))}
        </div>
      ) : (
        /* Test con singolo input */
        <Field label={`${test.label} (${test.unit})`} error={errors[test.key]}>
          <Input
            type="number"
            step="0.1"
            value={tests[test.key] ?? ''}
            onChange={updateTest(test.key)}
            placeholder={`Inserisci valore in ${test.unit}`}
            autoFocus
          />
        </Field>
      )}

      {/* Percentile live */}
      {livePercentile !== null && (
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex justify-between mb-1.5">
            <span className="font-display text-[10px] text-white/30 tracking-[2px]">PERCENTILE</span>
            <span className="font-display text-[13px] font-black" style={{ color: '#60a5fa' }}>
              {livePercentile}°
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${livePercentile}%`, background: '#60a5fa' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}