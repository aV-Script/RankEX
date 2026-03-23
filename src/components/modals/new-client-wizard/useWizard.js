import { useState, useMemo, useCallback } from 'react'
import { WIZARD_STEPS, TOTAL_STEPS }      from './wizard.config'
import { getTestsForCategoria, applyFormula, getRankFromMedia } from '../../../constants'
import { calcPercentile, calcStatMedia }  from '../../../utils/percentile'
import { getFirebaseErrorMessage }        from '../../../utils/firebaseErrors'
import { validateEmail, validatePassword, validateAge, validateRequired, validateNumber } from '../../../utils/validation'

export function useWizard({ trainerId, groups, onAdd, onClose, onAddGroup, onToggleClientGroup }) {
  const [step,       setStep]       = useState(0)
  const [anagrafica, setAnagrafica] = useState({ name: '', eta: '', sesso: 'M', peso: '', altezza: '' })
  const [categoria,  setCategoria]  = useState('health')
  const [tests,      setTests]      = useState({})
  const [settings,   setSettings]   = useState({ sessionsPerWeek: 3, groupId: null, newGroupName: '' })
  const [account,    setAccount]    = useState({ email: '', password: '' })
  const [errors,     setErrors]     = useState({})
  const [loading,    setLoading]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const categoryTests = getTestsForCategoria(categoria)
  const currentStep   = WIZARD_STEPS[step]
  const currentTest   = currentStep?.type === 'test'
    ? categoryTests[currentStep.index]
    : null

  const livePercentile = useMemo(() => {
    if (!currentTest) return null
    let finalValue
    if (currentTest.variables && currentTest.formulaType) {
      const varsValues = {}
      for (const v of currentTest.variables) {
        const val = Number(tests[v.key])
        if (tests[v.key] === '' || isNaN(val)) return null
        varsValues[v.key] = val
      }
      finalValue = applyFormula(currentTest, varsValues)
    } else {
      const val = Number(tests[currentTest.key])
      if (tests[currentTest.key] === '' || isNaN(val)) return null
      finalValue = val
    }
    return calcPercentile(currentTest.stat, finalValue, anagrafica.sesso, parseInt(anagrafica.eta))
  }, [currentTest, tests, anagrafica.sesso, anagrafica.eta])

  const allStats = useMemo(() => {
    const result = {}
    categoryTests.forEach(test => {
      let finalValue
      if (test.variables && test.formulaType) {
        const varsValues = {}
        let incomplete = false
        for (const v of test.variables) {
          const val = Number(tests[v.key])
          if (tests[v.key] === '' || isNaN(val)) { incomplete = true; break }
          varsValues[v.key] = val
        }
        finalValue = incomplete ? null : applyFormula(test, varsValues)
      } else {
        const val = Number(tests[test.key])
        finalValue = tests[test.key] === '' || isNaN(val) ? null : val
      }
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

  const validateTest = useCallback(() => {
    if (!currentTest) return true
    if (currentTest.variables) {
      const e = {}
      currentTest.variables.forEach(v => {
        if (tests[v.key] === '' || isNaN(Number(tests[v.key])))
          e[v.key] = 'Inserisci un valore valido'
      })
      setErrors(e)
      return Object.keys(e).length === 0
    }
    const val = Number(tests[currentTest.key])
    if (tests[currentTest.key] === '' || isNaN(val)) {
      setErrors({ [currentTest.key]: 'Inserisci un valore valido' })
      return false
    }
    setErrors({})
    return true
  }, [currentTest, tests])

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
    if (currentStep?.type === 'test') {
      if (!validateTest()) return
      if (currentTest?.variables && currentTest?.formulaType) {
        const varsValues = {}
        currentTest.variables.forEach(v => {
          varsValues[v.key] = Number(tests[v.key])
        })
        const finalVal = applyFormula(currentTest, varsValues)
        if (finalVal !== null) {
          setTests(p => ({ ...p, [currentTest.key]: finalVal }))
        }
      }
    }
    setErrors({})
    setStep(s => s + 1)
  }, [currentStep, currentTest, tests, validateAnagrafica, validateTest])

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
      const newClient = await onAdd({
        ...anagrafica,
        eta:             parseInt(anagrafica.eta),
        peso:            parseFloat(anagrafica.peso),
        altezza:         parseFloat(anagrafica.altezza),
        categoria,
        testValues:      { ...tests },
        stats:           allStats,
        email:           account.email.trim(),
        password:        account.password,
        sessionsPerWeek: parseInt(settings.sessionsPerWeek) || 3,
      })

      // ── Gestione gruppo — usa handler passati dall'esterno ────────────────
      if (newClient?.id) {
        if (settings.newGroupName.trim()) {
          const g = await onAddGroup(settings.newGroupName.trim())
          if (g?.id) await onToggleClientGroup(g.id, newClient.id)
        } else if (settings.groupId) {
          await onToggleClientGroup(settings.groupId, newClient.id)
        }
      }

      onClose()
    } catch (err) {
      setErrors({ email: getFirebaseErrorMessage(err, 'Impossibile creare il cliente') })
      setLoading(false)
      setShowConfirm(false)
    }
  }, [anagrafica, categoria, tests, allStats, account, settings, onAdd, onClose, onAddGroup, onToggleClientGroup])

  return {
    step, anagrafica, categoria, tests, settings, account, errors, loading,
    showConfirm, setShowConfirm,
    categoryTests, currentStep, currentTest,
    livePercentile, allStats, media, rankObj,
    stepTitle, progressPct,
    isLastStep: step === TOTAL_STEPS - 1,
    groups,
    setAnagrafica, setCategoria, setTests, setSettings, setAccount,
    next, prev,
    handleRequestSubmit,
    handleConfirmSubmit,
  }
}