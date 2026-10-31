import { useState, useCallback } from 'react'
import { Button, Field, Input, Modal, SectionLabel, WarningNote } from '../../components/ui'
import { validatePrivacyNoticeInput, todayLocalDate, TEXT_LIMITS } from '../../utils/lipedema'
import { formatDate } from './assessmentFormat'

export const PRIVACY_BANNER_ID = 'privacy-notice-banner'

/**
 * Banner in cima a Valutazioni e BIA quando manca l'informativa (ADR-015 §1).
 * `id` serve ai bottoni disabilitati (aria-describedby).
 */
export function PrivacyNoticeBanner({ readonly, terminology, onRegister }) {
  return (
    <WarningNote
      id={PRIVACY_BANNER_ID}
      title="Informativa"
      action={!readonly && (
        <Button size="sm" variant="ghost" accentColor="var(--rx-warning)" onClick={onRegister}>REGISTRA INFORMATIVA</Button>
      )}
    >
      Informativa non registrata: le valutazioni e la BIA non si possono salvare finché non è registrata.
      {readonly && <> Deve registrarla un {terminology.trainer}.</>}
    </WarningNote>
  )
}

/** Card "Informativa" nella tab Paziente */
export function PrivacyNoticeCard({ privacyNotice, readonly, onRegister }) {
  return (
    <div className="rx-card rounded-[4px] p-5 flex flex-col gap-3">
      <SectionLabel className="!mb-0">◈ Informativa</SectionLabel>
      {privacyNotice ? (
        <p className="font-body text-[13px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
          Consegnata il {formatDate(privacyNotice.deliveredAt)} · versione {privacyNotice.informativaVersion}
          {privacyNotice.recordedByName ? ` · registrata da ${privacyNotice.recordedByName}` : ''}
        </p>
      ) : (
        <p className="font-body text-[13px] m-0" style={{ color: 'var(--rx-warning)' }}>Non registrata</p>
      )}
      {!readonly && (
        <div>
          <Button size="sm" variant="ghost" onClick={onRegister}>
            {privacyNotice ? 'AGGIORNA VERSIONE' : 'REGISTRA INFORMATIVA'}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Registrazione dell'informativa consegnata: versione e data obbligatorie,
 * "consegnata da" è sempre chi registra (lo imposta il server).
 */
export function PrivacyNoticeModal({ client, examinerName, onSubmit, onClose }) {
  const today    = todayLocalDate()
  const isUpdate = Boolean(client.privacyNotice)
  const [values,   setValues]   = useState({ informativaVersion: '', deliveredAt: today })
  const [errors,   setErrors]   = useState({})
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const { errors: found, value } = validatePrivacyNoticeInput(values, { today, birthDate: client.dataNascita ?? null })
    setErrors(found)
    if (!value) return
    setIsSaving(true)
    try {
      await onSubmit(value)
      onClose()
    } catch {
      // Errore già mostrato come toast: il modal resta aperto con i dati
      setIsSaving(false)
    }
  }, [values, today, client.dataNascita, onSubmit, onClose])

  return (
    <Modal title={isUpdate ? 'Aggiorna informativa' : 'Registra informativa'} onClose={onClose} disableOverlayClose={isSaving}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Versione dell'informativa" htmlFor="privacy-version" error={errors.informativaVersion}>
          <Input
            id="privacy-version" placeholder="es. v2.1" maxLength={TEXT_LIMITS.informativaVersion} autoFocus
            value={values.informativaVersion}
            onChange={e => setValues(prev => ({ ...prev, informativaVersion: e.target.value }))}
          />
        </Field>
        <Field label="Data di consegna" htmlFor="privacy-date" error={errors.deliveredAt}>
          <Input
            id="privacy-date" type="date" max={today} min={client.dataNascita || undefined}
            value={values.deliveredAt}
            onChange={e => setValues(prev => ({ ...prev, deliveredAt: e.target.value }))}
          />
        </Field>
        <div>
          <div className="text-white/40 text-[11px] font-display tracking-[3px] mb-1.5">CONSEGNATA DA</div>
          <div className="font-body text-[13px] text-white/80">{examinerName}</div>
        </div>
        {isUpdate && (
          <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>
            La versione precedente resta tracciata nel registro di sistema.
          </p>
        )}
        <div className="flex gap-3">
          <Button type="button" variant="neutral" size="sm" className="flex-1" onClick={onClose} disabled={isSaving}>INDIETRO</Button>
          <Button type="submit" size="sm" className="flex-1" loading={isSaving}>REGISTRA</Button>
        </div>
      </form>
    </Modal>
  )
}
