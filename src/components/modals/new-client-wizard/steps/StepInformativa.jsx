import { Field, Input, WarningNote } from '../../../ui'
import { TEXT_LIMITS } from '../../../../utils/lipedema'

/**
 * Ultimo step nei moduli con valutazioni (lipedema): attestazione facoltativa
 * dell'informativa consegnata (ADR-015 §1). Chi la registra lo imposta il server.
 * Saltabile: senza, valutazioni e BIA restano bloccate finché non si registra
 * dalla scheda del paziente.
 */
export function StepInformativa({ privacy, setPrivacy, errors, today, birthDate }) {
  return (
    <div className="flex flex-col gap-4">
      {errors.form && (
        <p role="alert" className="font-body text-[12px] m-0" style={{ color: 'var(--rx-danger)' }}>{errors.form}</p>
      )}

      <label htmlFor="wizard-privacy-delivered" className="flex items-center gap-3 cursor-pointer font-body text-[14px] text-white/80">
        <input
          id="wizard-privacy-delivered"
          type="checkbox"
          checked={privacy.delivered}
          onChange={e => setPrivacy(prev => ({ ...prev, delivered: e.target.checked }))}
          style={{ accentColor: 'var(--rx-accent)', width: 18, height: 18 }}
        />
        Ho consegnato l'informativa al paziente
      </label>

      {privacy.delivered ? (
        <>
          <Field label="Versione dell'informativa" htmlFor="wizard-privacy-version" error={errors.informativaVersion}>
            <Input
              id="wizard-privacy-version" placeholder="es. v2.1" maxLength={TEXT_LIMITS.informativaVersion}
              value={privacy.informativaVersion}
              onChange={e => setPrivacy(prev => ({ ...prev, informativaVersion: e.target.value }))}
            />
          </Field>
          <Field label="Data di consegna" htmlFor="wizard-privacy-date" error={errors.deliveredAt}>
            <Input
              id="wizard-privacy-date" type="date" max={today} min={birthDate || undefined}
              value={privacy.deliveredAt}
              onChange={e => setPrivacy(prev => ({ ...prev, deliveredAt: e.target.value }))}
            />
          </Field>
        </>
      ) : (
        <WarningNote title="Informativa">
          Potrai registrarla dalla scheda. Fino ad allora non potrai salvare valutazioni né BIA.
        </WarningNote>
      )}
    </div>
  )
}
