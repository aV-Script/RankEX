import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  validateAssessmentInput, validateVoidReason, nowLocalDateTime, isSameAssessmentData, isPrivacyNoticeMissingError,
} from '../../utils/lipedema'
import { fieldId } from './formModelUtils'

/**
 * Stato e azioni comuni ai form delle valutazioni (2MWT, 30s-STS, Handgrip):
 * validazione condivisa col server, errori mostrati dopo il primo SALVA con
 * focus sul primo campo, conferma prima del salvataggio, correzione (motivo
 * obbligatorio, niente salvataggio se identica), conferma d'uscita col form
 * modificato. Niente update ottimistico: il risultato lo decide il server.
 *
 * @param {object}   options.initialForm
 * @param {Function} options.buildInput      — form → input della callable (stabile)
 * @param {Function} options.getFieldOrder   — form → campi nell'ordine a schermo (stabile)
 * @param {Function} [options.onRevealField] — (campo, form) apre la sezione che contiene il campo da mettere a fuoco (stabile)
 * @param {string|null} options.birthDate
 * @param {object|null} options.supersedes   — valutazione da correggere
 */
export function useAssessmentForm({
  initialForm, buildInput, getFieldOrder, onRevealField, birthDate, supersedes,
  onSave, onBack, onPrivacyNoticeMissing, onDirtyChange,
}) {
  const [form,             setForm]             = useState(initialForm)
  const [hasTriedSave,     setHasTriedSave]     = useState(false)
  const [showConfirm,      setShowConfirm]      = useState(false)
  const [showDiscard,      setShowDiscard]      = useState(false)
  const [isSaving,         setIsSaving]         = useState(false)
  const [correctionReason, setCorrectionReason] = useState('')
  const initialRef = useRef(initialForm)

  const nowLocal = nowLocalDateTime()
  const input    = useMemo(() => buildInput(form), [buildInput, form])
  const { errors, value: validValue } = useMemo(
    () => validateAssessmentInput(input, { nowLocal, birthDate }),
    [input, nowLocal, birthDate],
  )
  const visibleErrors = hasTriedSave ? errors : {}
  const isDirty       = JSON.stringify(form) !== JSON.stringify(initialRef.current)
  const reasonCheck   = validateVoidReason(correctionReason)
  const isUnchangedCorrection = Boolean(supersedes) && Boolean(validValue) && isSameAssessmentData(validValue, supersedes)

  useEffect(() => { onDirtyChange?.(isDirty) }, [isDirty, onDirtyChange])
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange])

  const setField = useCallback((key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const setValue = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const setClinical = useCallback((key) => (e) => {
    const value = e.target.value
    setForm(prev => ({ ...prev, clinical: { ...prev.clinical, [key]: value } }))
  }, [])

  const handleRequestSave = useCallback(() => {
    setHasTriedSave(true)
    const firstError = getFieldOrder(form).find(field => errors[field]) ?? Object.keys(errors)[0]
    if (firstError) {
      onRevealField?.(firstError, form)
      // Dopo il render (la sezione potrebbe essersi appena aperta)
      requestAnimationFrame(() => {
        const element = document.getElementById(fieldId(firstError))
        element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        element?.focus({ preventScroll: true })
      })
      return
    }
    if (isUnchangedCorrection) return
    setShowConfirm(true)
  }, [errors, form, getFieldOrder, onRevealField, isUnchangedCorrection])

  const handleConfirmSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await onSave([input], supersedes ? { supersedes: supersedes.id, voidReason: reasonCheck.value } : undefined)
      onBack()
    } catch (err) {
      // Errore già mostrato da useAssessments: il form resta com'è
      if (isPrivacyNoticeMissingError(err)) onPrivacyNoticeMissing()
      setIsSaving(false)
      setShowConfirm(false)
    }
  }, [onSave, onBack, onPrivacyNoticeMissing, input, supersedes, reasonCheck.value])

  const handleBack = useCallback(() => {
    if (isDirty) setShowDiscard(true)
    else onBack()
  }, [isDirty, onBack])

  return {
    form, setForm, setField, setValue, setClinical,
    input, errors, visibleErrors, validValue, nowLocal, hasTriedSave,
    showConfirm, setShowConfirm, showDiscard, setShowDiscard, isSaving,
    correctionReason, setCorrectionReason, reasonCheck, isUnchangedCorrection,
    handleRequestSave, handleConfirmSave, handleBack,
  }
}
