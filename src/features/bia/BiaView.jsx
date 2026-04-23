import { useState, useCallback, useMemo } from 'react'
import { Button, SectionLabel }           from '../../components/ui'
import { ConfirmDialog }                  from '../../components/common/ConfirmDialog'
import { BiaGaugeBar }                    from './bia-view/BiaGaugeBar'
import { BIA_PARAMS, BIA_EMPTY }          from '../../constants/bia'
import { calcBmi }                        from '../../utils/bia'

/**
 * View inline per il campionamento BIA.
 */
export function BiaView({ client, color, onSave, onBack }) {
  const [values,      setValues]      = useState(BIA_EMPTY)
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const bmiComputed = calcBmi(client.peso, client.altezza)

  const KEY_PARAMS = useMemo(() => new Set(['fatMassPercent', 'muscleMassKg', 'waterPercent', 'visceralFat']), [])

  const updateValue = (key) => (e) => {
    setValues(p => ({ ...p, [key]: e.target.value }))
  }

  const validate = useCallback(() => {
    const e = {}
    const required = ['fatMassPercent', 'muscleMassKg', 'waterPercent', 'visceralFat']
    required.forEach(key => {
      const val = Number(values[key])
      if (values[key] === '' || isNaN(val) || val < 0) {
        e[key] = 'Valore richiesto'
      }
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }, [values])

  const handleRequestSave = useCallback(() => {
    if (!validate()) return
    setShowConfirm(true)
  }, [validate])

  const handleConfirmSave = useCallback(async () => {
    setLoading(true)
    try {
      const finalValues = {
        ...values,
        bmi: bmiComputed ?? values.bmi,
      }
      const parsed = {}
      Object.entries(finalValues).forEach(([k, v]) => {
        parsed[k] = v !== '' ? Number(v) : null
      })
      await onSave(parsed)
      onBack()
    } catch {
      setLoading(false)
      setShowConfirm(false)
    }
  }, [values, bmiComputed, onSave, onBack])

  const prevBia = client.lastBia ?? null

  return (
    <div className="min-h-screen text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[.05]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer hover:text-white/60 transition-colors p-0"
        >
          ‹ Dashboard
        </button>
        <span className="font-display font-black text-[16px] text-white">
          Nuova misurazione BIA
        </span>
        <button
          onClick={handleRequestSave}
          className="font-display text-[11px] px-3 py-1.5 rounded-[3px] cursor-pointer border transition-all hover:opacity-80"
          style={{ color, borderColor: color + '55', background: color + '11' }}
        >
          SALVA BIA
        </button>
      </div>

      {/* Contenuto */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="font-body text-[13px] text-white/40 mb-6">
          {client.name} · {client.sesso} · {client.eta} anni
          {bmiComputed && (
            <span className="ml-3 font-display text-[11px]" style={{ color: color + 'aa' }}>
              BMI calcolato: {bmiComputed}
            </span>
          )}
        </p>

        <div className="flex gap-8 items-start">

          {/* Colonna sinistra — input parametri */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {BIA_PARAMS.filter(p => !p.computed).map(param => (
              <div
                key={param.key}
                className="rounded-[4px] p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border:     `1px solid ${
                    values[param.key] !== ''
                      ? color + '33'
                      : 'rgba(255,255,255,0.06)'
                  }`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-display text-[12px] text-white/70 tracking-wider">
                    {param.label}
                  </span>
                  <span className="font-body text-[11px] text-white/25">({param.unit})</span>
                  {KEY_PARAMS.has(param.key) && (
                    <span
                      className="font-display text-[9px] px-1.5 py-0.5 rounded-[2px]"
                      style={{ background: color + '12', color: color + 'aa', border: `1px solid ${color}28` }}
                    >
                      chiave
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={values[param.key]}
                    onChange={updateValue(param.key)}
                    className="input-base flex-1"
                    style={{ maxWidth: 140 }}
                  />
                  {prevBia?.[param.key] != null && (
                    <span className="font-body text-[12px] text-white/25">
                      Prec: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {prevBia[param.key]} {param.unit}
                      </strong>
                    </span>
                  )}
                </div>

                {errors[param.key] && (
                  <p className="font-body text-[11px] text-red-400 mt-1.5 m-0">
                    {errors[param.key]}
                  </p>
                )}

                {/* Preview gauge live */}
                {values[param.key] !== '' && (
                  <div className="mt-3">
                    <BiaGaugeBar
                      param={param}
                      value={Number(values[param.key])}
                      prevValue={prevBia?.[param.key] ?? null}
                      sex={client.sesso}
                      age={client.eta}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* BMI calcolato automaticamente */}
            {bmiComputed && (
              <div
                className="rounded-[3px] px-4 py-3 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="font-display text-[11px] text-white/40 tracking-wider">BMI</span>
                <span className="font-display font-black text-[18px]" style={{ color }}>
                  {bmiComputed} <span className="font-body text-[11px] text-white/30">kg/m²</span>
                </span>
              </div>
            )}
          </div>

          {/* Colonna destra — preview live */}
          <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-6">
            <div
              className="rounded-[4px] p-5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <SectionLabel>Anteprima</SectionLabel>
              <div className="flex flex-col gap-3">
                {BIA_PARAMS.filter(p => !p.computed && values[p.key] !== '').map(param => (
                  <BiaGaugeBar
                    key={param.key}
                    param={param}
                    value={Number(values[param.key])}
                    prevValue={prevBia?.[param.key] ?? null}
                    sex={client.sesso}
                    age={client.eta}
                  />
                ))}
                {BIA_PARAMS.filter(p => !p.computed && values[p.key] !== '').length === 0 && (
                  <p className="font-body text-[12px] text-white/20 text-center py-4">
                    Inserisci i valori per vedere l'anteprima
                  </p>
                )}
              </div>
            </div>

            <div
              className="rounded-[3px] px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="font-body text-[12px] text-white/40">Parametri inseriti</span>
              <span
                className="font-display text-[14px]"
                style={{
                  color: BIA_PARAMS.filter(p => !p.computed && values[p.key] !== '').length ===
                         BIA_PARAMS.filter(p => !p.computed).length
                    ? '#34d399' : '#f59e0b',
                }}
              >
                {BIA_PARAMS.filter(p => !p.computed && values[p.key] !== '').length}/
                {BIA_PARAMS.filter(p => !p.computed).length}
              </span>
            </div>

            <Button onClick={handleRequestSave}>SALVA BIA</Button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Salvare la misurazione BIA?"
          description={`Stai per aggiornare la composizione corporea di ${client.name}.`}
          confirmLabel="SALVA"
          loading={loading}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
