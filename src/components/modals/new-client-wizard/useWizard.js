import { useState, useMemo, useCallback }   from 'react'
import { getWizardSteps, TOTAL_STEPS_MAP } from './wizard.config'
import { getTestsForCategoria, applyFormula, getRankFromMedia } from '../../../constants'
import { calcPercentile, calcStatMedia }   from '../../../utils/percentile'
import { getFirebaseErrorMessage }         from '../../../utils/firebaseErrors'
import { validateEmail, validatePassword, validateAge, validateRequired, validateNumber } from '../../../utils/validation'

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

export function useWizard({ groups, onAdd, onClose, onAddGroup, onToggleClientGroup, isSoccer = false }) {
  const [step,        setStep]        = useState(0)
  const [anagrafica,  setAnagrafica]  = useState({ name: '', eta: '', sesso: 'M', peso: '', altezza: '' })
  const [profileType, setProfileType] = useState('tests_only')
  const [categoria,   setCategoria]   = useState('health')
  const [ruolo,       setRuolo]       = useState('goalkeeper')
  const [tests,       setTests]       = useState({})
  const [account,     setAccount]     = useState({ email: '', password: '' })
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const WIZARD_STEPS = useMemo(() => getWizardSteps(profileType, isSoccer), [profileType, isSoccer])
  const TOTAL_STEPS  = isSoccer ? TOTAL_STEPS_MAP.soccer : TOTAL_STEPS_MAP[profileType]

  const categoryTests = getTestsForCategoria(categoria)
  const currentStep   = WIZARD_STEPS[step]
  const currentTest   = currentStep?.type === 'test'
    ? categoryTests[currentStep.index]
    : null

  const livePercentile = useMemo(() => {
    if (!currentTest) return null
    const finalValue = calcTestFinalValue(currentTest, tests)
    if (finalValue === null) return null
    return calcPercentile(currentTest.stat, finalValue, anagrafica.sesso, parseInt(anagrafica.eta))
  }, [currentTest, tests, anagrafica.sesso, anagrafica.eta])

  const allStats = useMemo(() => {
    const result = {}
    categoryTests.forEach(test => {
      const finalValue = calcTestFinalValue(test, tests)
      result[test.stat] = finalValue !== null
        ? calcPercentile(test.stat, finalValue, anagrafica.sesso, parseInt(anagrafica.eta)) ?? 0
        : 0
    })
    return result
  }, [tests, categoryTests, anagrafica.sesso, anagrafica.eta])

  const media   = calcStatMedia(allStats)
  const rankObj = getRankFromMedia(media)

  const stepTitle = useMemo(() => {
    if (currentStep?.type === 'test' && currentTest) {
      return `Test ${currentStep.index + 1}/5 — ${currentTest.label}`
    }
    return currentStep?.title ?? ''
  }, [currentStep, currentTest])

  const progressPct = Math.round((step / (TOTAL_STEPS - 1)) * 100)

  // ── Validazioni ───────────────────────────────────────────────────────────
  const validateAnagrafica = useCallback(() => {
    const name    = validateRequired(anagrafica.name, 'Nome')
    const eta     = validateAge(anagrafica.eta)
    const peso    = validateNumber(anagrafica.peso,    { min: 20, max: 300, label: 'Peso' })
    const altezza = validateNumber(anagrafica.altezza, { min: 50, max: 250, label: 'Altezza' })
    const e = {}
    if (!name.valid)    e.name    = name.error
    if (!eta.valid)     e.eta     = eta.error
    if (!peso.valid)    e.peso    = peso.error
    if (!altezza.valid) e.altezza = altezza.error
    setErrors(e)
    return Object.keys(e).length === 0
  }, [anagrafica])

  const validateAccount = useCallback(() => {
    const email    = validateEmail(account.email)
    const password = validatePassword(account.password)
    const e = {}
    if (!email.valid)    e.email    = email.error
    if (!password.valid) e.password = password.error
    setErrors(e)
    return Object.keys(e).length === 0
  }, [account])

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
    try {
      await onAdd({
        ...anagrafica,
        eta:         parseInt(anagrafica.eta),
        peso:        parseFloat(anagrafica.peso),
        altezza:     parseFloat(anagrafica.altezza),
        categoria:   isSoccer ? 'soccer' : (profileType === 'bia_only' ? null : categoria),
        ruolo:       isSoccer ? ruolo : undefined,
        profileType: isSoccer ? 'tests_only' : profileType,
        email:       account.email.trim(),
        password:    account.password,
      })
      onClose()
    } catch (err) {
      setErrors({ email: getFirebaseErrorMessage(err, 'Impossibile creare il cliente') })
      setLoading(false)
      setShowConfirm(false)
    }
  }, [anagrafica, profileType, categoria, account, onAdd, onClose])

  return {
    step, anagrafica, profileType, categoria, ruolo, account, errors, isLoading: loading,
    showConfirm, setShowConfirm,
    categoryTests, currentStep, currentTest,
    livePercentile, media, rankObj,
    stepTitle, progressPct,
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
