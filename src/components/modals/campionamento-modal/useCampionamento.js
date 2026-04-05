import { useState, useMemo, useCallback } from 'react'
import { getStatsConfig, applyFormula }   from '../../../constants'
import { calcPercentile, calcStatMedia }  from '../../../utils/percentile'
import { getRankFromMedia }               from '../../../constants'

function calcTestPercentile(test, testValues, sesso, eta) {
  if (test.variables && test.formulaType) {
    const varsValues = {}
    for (const v of test.variables) {
      const val = Number(testValues[v.key])
      if (testValues[v.key] === '' || isNaN(val)) return null
      varsValues[v.key] = val
    }
    const finalValue = applyFormula(test, varsValues)
    if (finalValue === null) return null
    return calcPercentile(test.stat, finalValue, sesso, eta, test.key)
  }

  const raw = testValues[test.stat]
  const val = raw === '' || raw === undefined ? null : Number(raw)
  if (val === null || isNaN(val)) return null
  return calcPercentile(test.stat, val, sesso, eta, test.key)
}

export function useCampionamento({ client, onSave, onBack }) {
  const config = getStatsConfig(client.categoria)

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

  const liveStats = useMemo(() => {
    const result = {}
    config.forEach(test => {
      result[test.stat] = calcTestPercentile(test, testValues, client.sesso, client.eta)
    })
    return result
  }, [testValues, client.sesso, client.eta, config])

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

  // Click su "Salva" — valida e mostra conferma
  const handleRequestSave = useCallback(() => {
    if (!validate()) return
    setShowConfirm(true)
  }, [validate])

  // Click su "Conferma" nel dialog
  const handleConfirmSave = useCallback(async () => {
    setLoading(true)
    try {
      const newStats = {}
      config.forEach(test => {
        newStats[test.stat] = calcTestPercentile(test, testValues, client.sesso, client.eta) ?? 0
      })
      await onSave(newStats, { ...testValues })
      onBack()
    } catch {
      setLoading(false)
      setShowConfirm(false)
    }
  }, [config, testValues, client.sesso, client.eta, onSave, onBack])

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