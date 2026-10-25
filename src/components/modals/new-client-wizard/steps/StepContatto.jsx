import { Field, Input } from '../../../ui'

/**
 * Ultimo step per i moduli senza login del cliente (ADR-010): nessun account né
 * password, email facoltativa come semplice recapito.
 */
export function StepContatto({ account, setAccount, errors, anagrafica }) {
  return (
    <div className="flex flex-col gap-4">

      <div
        className="rounded-[4px] p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="font-display font-black text-[15px] text-white">{anagrafica.name}</div>
        <div className="font-body text-[12px] text-white/60 mt-1">
          Nessun account di accesso all'app: l'email è solo un recapito.
        </div>
      </div>

      {errors.form && (
        <p role="alert" className="font-body text-[12px] m-0" style={{ color: '#f87171' }}>{errors.form}</p>
      )}

      <Field label="Email (facoltativa)" htmlFor="wizard-email" error={errors.email}>
        <Input
          id="wizard-email"
          type="email"
          value={account.email}
          onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
          placeholder="nome@email.com"
          autoFocus
        />
      </Field>
    </div>
  )
}
