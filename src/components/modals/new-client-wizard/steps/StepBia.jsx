import { BIA_PARAMS, BIA_EMPTY }   from '../../../../constants/bia'
import { getBiaParamStatus }        from '../../../../utils/bia'
import { calcBmi }                  from '../../../../utils/bia'
import { Field }                    from '../../../ui'
import { calcAge }                  from '../../../../utils/validation'

export function StepBia({ biaValues, setBiaValues, errors, anagrafica }) {
  const bmiComputed = calcBmi(
    parseFloat(anagrafica.peso),
    parseFloat(anagrafica.altezza)
  )

  const update = (key) => (e) =>
    setBiaValues(p => ({ ...p, [key]: e.target.value }))

  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-[13px] text-white/40 m-0">
        Inserisci i valori della prima misurazione BIA.
        Puoi saltare i parametri non disponibili.
      </p>

      {bmiComputed && (
        <div
          className="rounded-[3px] px-4 py-2.5 flex items-center justify-between"
          style={{ background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.2)' }}
        >
          <span className="font-display text-[11px] tracking-wider" style={{ color: '#00c8ff' }}>
            BMI
          </span>
          <span className="font-display font-black text-[14px]" style={{ color: '#00c8ff' }}>
            {bmiComputed} <span className="font-body text-[11px] text-white/30">kg/m²</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BIA_PARAMS.filter(p => !p.computed).map(param => {
          const val    = biaValues[param.key]
          const status = val !== '' ? getBiaParamStatus(
            param.key,
            Number(val),
            anagrafica.sesso,
            calcAge(anagrafica.dataNascita)
          ) : null
          return (
            <Field
              key={param.key}
              label={`${param.label} (${param.unit})`}
              error={errors[param.key]}
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="—"
                  value={val}
                  onChange={update(param.key)}
                  className="input-base flex-1"
                />
                {status && (
                  <span
                    className="font-display text-[10px] shrink-0 px-2 py-1 rounded-[2px]"
                    style={{ background: status.color + '22', color: status.color }}
                  >
                    {status.label}
                  </span>
                )}
              </div>
            </Field>
          )
        })}
      </div>
    </div>
  )
}
