import { Field, Input } from '../../../ui'
import { CATEGORIE }    from '../../../../constants'

export function StepAccount({ account, setAccount, errors, anagrafica, categoria, rankObj, media }) {
  const categoriaLabel = CATEGORIE.find(c => c.id === categoria)?.label ?? categoria

  return (
    <div className="flex flex-col gap-4">

      {/* Riepilogo rank */}
      <div
        className="rounded-xl p-4 flex items-center gap-4"
        style={{ background: rankObj.color + '11', border: `1px solid ${rankObj.color}33` }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: rankObj.color + '22' }}
        >
          <span className="font-display font-black text-[18px]" style={{ color: rankObj.color }}>
            {rankObj.label}
          </span>
        </div>
        <div>
          <div className="font-display font-black text-[15px] text-white">{anagrafica.name}</div>
          <div className="font-body text-[12px] text-white/40">
            {categoriaLabel} · Media {media}/100
          </div>
        </div>
      </div>

      <Field label="Email" error={errors.email}>
        <Input
          type="email"
          value={account.email}
          onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
          placeholder="cliente@email.com"
          autoFocus
        />
      </Field>

      <Field label="Password temporanea" error={errors.password}>
        <Input
          type="password"
          value={account.password}
          onChange={e => setAccount(p => ({ ...p, password: e.target.value }))}
          placeholder="Minimo 8 caratteri + 1 numero"
        />
      </Field>

      <p className="font-body text-[11px] text-white/25 m-0">
        Il cliente potrà cambiarla al primo accesso.
      </p>
    </div>
  )
}