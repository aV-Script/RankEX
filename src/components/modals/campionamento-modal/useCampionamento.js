import { useState, useMemo, useCallback } from 'react'
import { getStatsConfig, applyFormula }   from '../../../constants'
import { calcPercentileEx, calcStatMedia } from '../../../utils/percentile'
import { getRankFromMedia }               from '../../../constants'
import { calcAge }                        from '../../../utils/validation'

// Risolve l'input grezzo di un test (con o senza formula) al valore numerico finale.
// Restituisce null se i campi sono incompleti/non validi.
function resolveTestInput(test, testValues) {
  if (test.variables && test.formulaType) {
    const varsValues = {}
    for (const v of test.variables) {
      const val = Number(testValues[v.key])
      if (testValues[v.key] === '' || isNaN(val)) return null
      varsValues[v.key] = val
    }
    return applyFormula(test, varsValues)
  }
  const raw = testValues[test.stat]
  const val = raw === '' || raw === undefined ? null : Number(raw)
  if (val === null || isNaN(val)) return null
  return val
}

// Calcola { value, outOfRange } per un test dato i valori correnti.
function calcTestResult(test, testValues, sesso, eta) {
  const finalValue = resolveTestInput(test, testValues)
  if (finalValue === null) return { value: null, outOfRange: false }
  return calcPercentileEx(test.stat, finalValue, sesso, eta, test.key)
}

export function useCampionamento({ client, onSave, onBack }) {
  const config    = getStatsConfig(client.categoria)
  const clientAge = calcAge(client.dataNascita)

  const EMPTY = Object.fromEntries(
    config.flatMap(t =>
      t.variables
        ? t.variables.map(v => [v.key, ''])
        : [[t.stat, '']]
    )
  )

  const [testValues,   setTestValues]   = useState(EMPTY)
  const [errors,       setErrors]       = useState({})
  const [loading,      setLoading]      = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  // Risultati completi per ogni test: { [stat]: { value, outOfRange } }
  const liveResults = useMemo(() => {
    const result = {}
    config.forEach(test => {
      result[test.stat] = calcTestResult(test, testValues, client.sesso, clientAge)
    })
    return result
  }, [testValues, client.sesso, clientAge, config])

  // Valori numerici (backward-compat con tutto il resto della UI)
  const liveStats = useMemo(() =>
    Object.fromEntries(Object.entries(liveResults).map(([k, r]) => [k, r.value]))
  , [liveResults])

  // Flags età fuori fascia normativa per ogni test
  const ageWarnings = useMemo(() =>
    Object.fromEntries(Object.entries(liveResults).map(([k, r]) => [k, r.outOfRange]))
  , [liveResults])

  const statsForPreview = useMemo(() => {
    const result = {}
    config.forEach(t => {
      result[t.stat] = liveStats[t.stat] ?? client.stats?.[t.stat] ?? 0
    })
    return result
  }, [liveStats, client.stats, config])

  const newMedia    = calcStatMedia(statsForPreview)
  const newRankObj  = getRankFromMedia(newMedia)
  const oldMedia    = calcStatMedia(client.stats ?? {})
  const oldRankObj  = getRankFromMedia(oldMedia)
  const filledCount = config.filter(t => liveStats[t.stat] !== null).length

  const validate = useCallback(() => {
    const e = {}
    config.forEach(test => {
      if (test.variables) {
        test.variables.forEach(v => {
          const val = Number(testValues[v.key])
          if (isNaN(val) || val < 0) e[v.key] = 'Valore non valido'
        })
      } else {
        const val = Number(testValues[test.stat])
        if (isNaN(val) || val < 0) e[test.stat] = 'Valore non valido'
      }
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }, [config, testValues])

  const handleRequestSave = useCallback(() => {
    if (!validate()) return
    setShowConfirm(true)
  }, [validate])

  const handleConfirmSave = useCallback(async () => {
    setLoading(true)
    try {
      const newStats = {}
      config.forEach(test => {
        newStats[test.stat] = calcTestResult(test, testValues, client.sesso, clientAge).value ?? 0
      })
      await onSave(newStats, { ...testValues })
      onBack()
    } catch {
      setLoading(false)
      setShowConfirm(false)
    }
  }, [config, testValues, client.sesso, clientAge, onSave, onBack])

  const updateValue = useCallback((key, value) => {
    setTestValues(p => ({ ...p, [key]: value }))
  }, [])

  return {
    config,
    testValues,
    errors,
    loading,
    showConfirm,
    liveStats,
    ageWarnings,
    statsForPreview,
    newMedia,
    newRankObj,
    oldMedia,
    oldRankObj,
    filledCount,
    updateValue,
    handleRequestSave,
    handleConfirmSave,
    setShowConfirm,
  }
}
