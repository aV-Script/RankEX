import { useState, useMemo, useCallback }   from 'react'
import { getWizardSteps }                  from './wizard.config'
import { getTestsForCategoria, applyFormula, getRankFromMedia } from '../../../constants'
import { calcPercentileEx, calcStatMedia }  from '../../../utils/percentile'
import { getFirebaseErrorMessage, isEmailTakenError } from '../../../utils/firebaseErrors'
import { validateEmail, validatePassword, validateBirthDate, validateRequired, validateNumber, calcAge } from '../../../utils/validation'
import { getCategoriaFromEta }             from '../../../config/modules.config'

/**
 * Calcola il valore finale di un test (con o senza formula composita).
 * @returns {number|null} — null se i campi richiesti non sono ancora compilati
 */
function calcTestFinalValue(test, tests) {
  if (test.variables && test.formulaType) {
    const varsValues = {}
    for (const v of test.variables) {
      const val = Number(tests[v.key])
      if (tests[v.key] === '' || isNaN(val)) return null
      varsValues[v.key] = val
    }
    return applyFormula(test, varsValues)
  }
  const val = Number(tests[test.key])
  return tests[test.key] === '' || isNaN(val) ? null : val
}

/**
 * @param {object} params
 * @param {object} params.capabilities — getModule(moduleType): decide step, campi e payload
 * @param {string} [params.clientLabel] — terminology.client, per i messaggi d'errore
 */
export function useWizard({ onAdd, onClose, capabilities, clientLabel = 'Cliente' }) {
  const { isSoccer, hasClientLogin, hasRank, hasPercentileTests, hasProfileTypes } = capabilities
  const [step,        setStep]        = useState(0)
  const [anagrafica,  setAnagrafica]  = useState({ name: '', dataNascita: '', sesso: 'M', peso: '', altezza: '' })
  const [profileType, setProfileType] = useState('tests_only')
  const [categoria,   setCategoria]   = useState('health')
  const [ruolo,       setRuolo]       = useState('goalkeeper')
  const [tests,       setTests]       = useState({})
  const [account,     setAccount]     = useState({ email: '', password: '' })
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const WIZARD_STEPS = useMemo(() => getWizardSteps(capabilities, profileType), [capabilities, profileType])
  const TOTAL_STEPS  = WIZARD_STEPS.length

  const categoriaEffettiva = getCategoriaEffettiva(capabilities, categoria, anagrafica.dataNascita)

  const categoryTests = useMemo(
    () => (hasPercentileTests && categoriaEffettiva ? getTestsForCategoria(categoriaEffettiva) : []),
    [hasPercentileTests, categoriaEffettiva],
  )
  const currentStep   = WIZARD_STEPS[step]
  const currentTest   = currentStep?.type === 'test'
    ? categoryTests[currentStep.index]
    : null

  const livePercentile = useMemo(() => {
    if (!currentTest) return null
    const finalValue = calcTestFinalValue(currentTest, tests)
    if (finalValue === null) return null
    return calcPercentileEx(currentTest.stat, finalValue, anagrafica.sesso, calcAge(anagrafica.dataNascita), currentTest.key).value
  }, [currentTest, tests, anagrafica.sesso, anagrafica.dataNascita])

  const allStats = useMemo(() => {
    const result = {}
    categoryTests.forEach(test => {
      const finalValue = calcTestFinalValue(test, tests)
      result[test.stat] = finalValue !== null
        ? calcPercentileEx(test.stat, finalValue, anagrafica.sesso, calcAge(anagrafica.dataNascita), test.key).value ?? 0
        : 0
    })
    return result
  }, [tests, categoryTests, anagrafica.sesso, anagrafica.dataNascita])

  const media   = calcStatMedia(allStats)
  // Nessuna anteprima rank nei moduli senza rank (STORY-031/032)
  const rankObj = hasRank ? getRankFromMedia(media) : null

  const stepTitle = useMemo(() => {
    if (currentStep?.type === 'test' && currentTest) {
      return `Test ${currentStep.index + 1}/5 — ${currentTest.label}`
    }
    return currentStep?.title ?? ''
  }, [currentStep, currentTest])

  const progressPct = Math.round((step / (TOTAL_STEPS - 1)) * 100)

  // ── Validazioni ───────────────────────────────────────────────────────────
  const validateAnagrafica = useCallback(() => {
    const name         = validateRequired(anagrafica.name, 'Nome')
    const dataNascita  = validateBirthDate(anagrafica.dataNascita)
    const peso         = validateNumber(anagrafica.peso,    { min: 20, max: 300, label: 'Peso' })
    const altezza      = validateNumber(anagrafica.altezza, { min: 50, max: 250, label: 'Altezza' })
    const e = {}
    if (!name.valid)        e.name        = name.error
    if (!dataNascita.valid) e.dataNascita = dataNascita.error
    if (!peso.valid)        e.peso        = peso.error
    if (!altezza.valid)     e.altezza     = altezza.error
    setErrors(e)
    return Object.keys(e).length === 0
  }, [anagrafica])

  const validateAccount = useCallback(() => {
    const e = {}
    if (hasClientLogin) {
      const email    = validateEmail(account.email)
      const password = validatePassword(account.password)
      if (!email.valid)    e.email    = email.error
      if (!password.valid) e.password = password.error
    } else if (account.email.trim()) {
      // Senza account l'email è facoltativa: si valida solo il formato, se presente
      const email = validateEmail(account.email)
      if (!email.valid) e.email = email.error
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }, [account, hasClientLogin])

  // ── Navigazione ───────────────────────────────────────────────────────────
  const next = useCallback(() => {
    if (currentStep?.type === 'anagrafica' && !validateAnagrafica()) return
    setErrors({})
    setStep(s => s + 1)
  }, [currentStep, validateAnagrafica])

  const prev = useCallback(() => {
    setErrors({})
    setStep(s => s - 1)
  }, [])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleRequestSubmit = useCallback(() => {
    if (!validateAccount()) return
    setShowConfirm(true)
  }, [validateAccount])

  const handleConfirmSubmit = useCallback(async () => {
    setLoading(true)
    const base = {
      ...anagrafica,
      dataNascita: anagrafica.dataNascita,
      peso:        parseFloat(anagrafica.peso),
      altezza:     parseFloat(anagrafica.altezza),
      email:       account.email.trim(),
    }
    // Senza login: niente password, categoria, ruolo o profilo — li fissa il server
    // (ADR-010), che rifiuta la password se arriva.
    const formData = hasClientLogin
      ? {
          ...base,
          categoria:   isSoccer ? getCategoriaFromEta(calcAge(anagrafica.dataNascita)) : (profileType === 'bia_only' ? null : categoria),
          ruolo:       isSoccer ? ruolo : undefined,
          profileType: hasProfileTypes ? profileType : 'tests_only',
          password:    account.password,
        }
      : base

    try {
      await onAdd(formData)
      onClose()
    } catch (err) {
      const message = getFirebaseErrorMessage(err, `${clientLabel}: creazione non riuscita`)
      // creaCliente/creaMembroTeam rispondono functions/already-exists: il vecchio
      // controllo su auth/* non scattava più e l'errore finiva in fondo al form
      const isEmailError = isEmailTakenError(err)
      setErrors(isEmailError ? { email: message } : { form: message })
      setLoading(false)
      setShowConfirm(false)
    }
  }, [anagrafica, profileType, categoria, ruolo, isSoccer, hasClientLogin, hasProfileTypes, account, clientLabel, onAdd, onClose])

  return {
    step, anagrafica, profileType, categoria: categoriaEffettiva, ruolo, account, errors, isLoading: loading,
    showConfirm, setShowConfirm,
    categoryTests, currentStep, currentTest,
    livePercentile, media, rankObj,
    stepTitle, progressPct,
    totalSteps: TOTAL_STEPS,
    isLastStep: step === TOTAL_STEPS - 1,
    setAnagrafica, setCategoria, setRuolo, setAccount,
    setProfileType: (type) => {
      setProfileType(type)
      if (type === 'bia_only') setTests({})
    },
    next, prev,
    handleRequestSubmit,
    handleConfirmSubmit,
  }
}

/**
 * Categoria test del cliente: soccer la ricava dall'età (fascia), PT usa quella
 * scelta nel wizard, i moduli senza categorie (lipedema) non ne hanno.
 * @returns {string|null}
 */
function getCategoriaEffettiva(capabilities, categoria, dataNascita) {
  if (capabilities.isSoccer)      return getCategoriaFromEta(calcAge(dataNascita)) ?? 'soccer'
  if (capabilities.hasCategories) return categoria
  return null
}
