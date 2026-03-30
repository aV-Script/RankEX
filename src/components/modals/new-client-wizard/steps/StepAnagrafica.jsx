import { Field, Input } from '../../../ui'

export function StepAnagrafica({ anagrafica, setAnagrafica, errors }) {
  const update = (key) => (e) =>
    setAnagrafica(p => ({ ...p, [key]: e.target.value }))

  return (
    <div className="flex flex-col gap-3">
      <Field label="Nome e cognome" error={errors.name}>
        <Input
          value={anagrafica.name}
          onChange={update('name')}
          placeholder="Mario Rossi"
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Età" error={errors.eta}>
          <Input
            type="number"
            value={anagrafica.eta}
            onChange={update('eta')}
            placeholder="30"
          />
        </Field>
        <Field label="Sesso">
          <div className="flex gap-2">
            {['M', 'F'].map(s => (
              <button
                key={s}
                onClick={() => setAnagrafica(p => ({ ...p, sesso: s }))}
                className="flex-1 py-2.5 rounded-[3px] font-display text-[12px] cursor-pointer border transition-all"
                style={anagrafica.sesso === s
                  ? { background: 'rgba(15,214,90,0.15)', borderColor: '#0fd65a', color: '#fff' }
                  : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                }
              >
                {s}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso (kg)" error={errors.peso}>
          <Input type="number" value={anagrafica.peso} onChange={update('peso')} placeholder="70" />
        </Field>
        <Field label="Altezza (cm)" error={errors.altezza}>
          <Input type="number" value={anagrafica.altezza} onChange={update('altezza')} placeholder="175" />
        </Field>
      </div>
    </div>
  )
}