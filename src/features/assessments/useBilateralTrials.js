import { useState, useMemo, useCallback } from 'react'
import { computeBilateralResult, BILATERAL_SIDE_STATUS } from '../../utils/lipedema'
import {
  getSubmittedTrialRows, toPreviewTrials, createTrialRow, nextTrialKey, isEmptyTrialRow, proposeNextSide,
} from './bilateralFormModel'

const TRIAL_EXTRA_FIELD_RE = /^trials\.(\d+)\.(pain|note)$/

/**
 * Righe con "dolore e nota" aperto. Separato da useBilateralTrials perché serve
 * prima di useAssessmentForm: il form apre la riga che contiene il primo errore.
 */
export function useTrialExtras(initialTrials) {
  const [openExtras, setOpenExtras] = useState(() => new Set(initialTrials.filter(row => row.pain || row.note).map(row => row.key)))

  const handleToggleExtras = useCallback((key) => {
    setOpenExtras(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const revealTrialField = useCallback((field, currentForm) => {
    const match = TRIAL_EXTRA_FIELD_RE.exec(field)
    if (!match) return
    const submitted = getSubmittedTrialRows(currentForm)[Number(match[1])]
    if (submitted) setOpenExtras(prev => new Set(prev).add(submitted.row.key))
  }, [])

  return { openExtras, handleToggleExtras, revealTrialField }
}

/**
 * Stato e azioni delle prove di un test bilaterale: anteprima dalla logica del
 * CORE, una prova non valida resta salvata e accoda la sua ripetizione (al massimo
 * `maxInvalidPerSide` per lato, poi serve lo stop), cambio unità con avviso.
 * @param {object} options.formState — useAssessmentForm(...)
 * @param {object} options.spec      — es. HANDGRIP
 * @param {Function} [options.onRowPatch] — (riga, riga aggiornata) → riga da salvare; regole di riga del test (stabile)
 */
export function useBilateralTrials({ formState, spec, onRowPatch }) {
  const { form, setForm, setValue, input } = formState
  const [hasUnitWarning, setHasUnitWarning] = useState(false)
  const maxTrials = spec.sides.length * (spec.validTrialsPerSide + spec.maxInvalidPerSide)

  const preview = useMemo(() => computeBilateralResult(toPreviewTrials(input, spec), spec), [input, spec])
  const inputIndexByKey = useMemo(
    () => new Map(getSubmittedTrialRows(form).map(({ row, inputIndex }) => [row.key, inputIndex])),
    [form],
  )
  const bestKeyBySide = useMemo(
    () => findBestKeys(form.trials, input, preview, inputIndexByKey, spec),
    [form.trials, input, preview, inputIndexByKey, spec],
  )

  // Cambiare unità non converte i valori già scritti: si avvisa di ricontrollarli
  const handleUnitChange = useCallback((unit) => {
    if (unit !== form.nativeUnit && form.trials.some(row => row.nativeValue.trim() !== '')) setHasUnitWarning(true)
    setValue('nativeUnit', unit)
  }, [form.nativeUnit, form.trials, setValue])

  const updateRow = useCallback((key, patch) => {
    setForm(prev => ({
      ...prev,
      trials: prev.trials.map(row => {
        if (row.key !== key) return row
        const next = { ...row, ...patch }
        return onRowPatch ? onRowPatch(row, next) : next
      }),
    }))
  }, [setForm, onRowPatch])

  // Non valida → si accoda la ripetizione dello stesso lato (una sola per prova,
  // finché ammessa); di nuovo valida → la ripetizione ancora vuota sparisce
  const handleToggleValid = useCallback((key, valid) => {
    setForm(prev => {
      const target = prev.trials.find(row => row.key === key)
      if (!target || target.valid === valid) return prev
      let trials = prev.trials.map(row => {
        if (row.key !== key) return row
        const next = { ...row, valid, invalidReason: valid ? '' : row.invalidReason }
        return onRowPatch ? onRowPatch(row, next) : next
      })
      if (!valid) {
        const invalidCount = trials.filter(row => row.side === target.side && !row.valid).length
        const hasRepeat    = trials.some(row => row.repeatOf === key)
        if (invalidCount <= spec.maxInvalidPerSide && !hasRepeat) {
          trials = [...trials, createTrialRow(nextTrialKey(trials), target.side, key)]
        }
      } else {
        const repeat = trials.find(row => row.repeatOf === key)
        if (repeat && isEmptyTrialRow(repeat)) trials = trials.filter(row => row.key !== repeat.key)
      }
      return { ...prev, trials }
    })
  }, [setForm, spec, onRowPatch])

  const handleRemoveRow = useCallback((key) => {
    setForm(prev => ({ ...prev, trials: prev.trials.filter(row => row.key !== key) }))
  }, [setForm])

  // Correzione: prove aggiunte sul lato proposto (meno valide, poi alternanza)
  const handleAddRow = useCallback(() => {
    setForm(prev => (prev.trials.length >= maxTrials ? prev : {
      ...prev, trials: [...prev.trials, createTrialRow(nextTrialKey(prev.trials), proposeNextSide(prev.trials, spec))],
    }))
  }, [setForm, maxTrials, spec])

  // Invio sul valore → prova successiva (inserimento rapido delle prove)
  const handleValueKeyDown = useCallback((event, key) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const index = form.trials.findIndex(row => row.key === key)
    const next  = form.trials[index + 1]
    if (!next) return
    const element = document.querySelector(`[data-trial-value="${next.key}"]`)
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    element?.focus({ preventScroll: true })
  }, [form.trials])

  const incompleteSides = spec.sides.filter(side => preview.sideStatus[side] !== BILATERAL_SIDE_STATUS.COMPLETE)
  const cappedSides     = spec.sides.filter(side => isInvalidCapReached(form.trials, side, spec))
  // L'invito allo stop compare una volta per lato, sulla prima riga valida
  const capNoticeKeys   = new Set(cappedSides.map(side => form.trials.find(row => row.side === side && row.valid)?.key))

  return {
    preview, inputIndexByKey, bestKeyBySide, maxTrials, incompleteSides, cappedSides, capNoticeKeys, hasUnitWarning,
    handleUnitChange, updateRow, handleToggleValid, handleRemoveRow, handleAddRow, handleValueKeyDown,
  }
}

// ── Funzioni helper pure ──────────────────────────────────────────────────────

/** Riga che dà il best di ciascun lato completo (la prima, a pari valore) */
function findBestKeys(rows, input, preview, inputIndexByKey, spec) {
  const previewTrials = toPreviewTrials(input, spec)
  return Object.fromEntries(spec.sides.map(side => {
    const best = preview.bestBySide[side]
    if (best === null) return [side, null]
    const row = rows.find(item => {
      const index = inputIndexByKey.get(item.key)
      const trial = index === undefined ? null : previewTrials[index]
      return trial && trial.side === side && trial.valid && trial.value === best
    })
    return [side, row?.key ?? null]
  }))
}

/** Lato con già il massimo di prove non valide: non se ne segnano altre, serve lo stop */
function isInvalidCapReached(trials, side, spec) {
  return trials.filter(row => row.side === side && !row.valid).length >= spec.maxInvalidPerSide
}
