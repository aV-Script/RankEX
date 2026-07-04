import { onCall }        from 'firebase-functions/v2/https'
import { getFirestore }  from 'firebase-admin/firestore'
import { requireOrgAccess }        from '../shared/auth.js'
import { buildCampionamentoUpdate } from '../shared/gamification.js'
import { TESTS_META }              from '../shared/testsMeta.js'
import { calcPercentileEx, calcAge } from '../shared/percentile.js'
import { applyFormula }            from '../shared/formulas.js'

const REGION = 'europe-west1'

function resolveTestInput(test, testValues) {
  if (test.variables && test.formulaType) {
    const varsValues = {}
    for (const v of test.variables) {
      const raw = testValues[v.key]
      if (raw === undefined || raw === '' || raw === null) return null
      const val = Number(raw)
      if (isNaN(val)) return null
      varsValues[v.key] = val
    }
    return applyFormula(test, varsValues)
  }
  const raw = testValues[test.stat]
  if (raw === undefined || raw === '' || raw === null) return null
  const val = Number(raw)
  return isNaN(val) ? null : val
}

export const salvaCampionamento = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, testValues = {} } = request.data
  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)
  const snap = await clientRef.get()
  if (!snap.exists) throw new Error('Cliente non trovato')

  const client    = { id: clientId, ...snap.data() }
  const clientAge = calcAge(client.dataNascita) ?? client.eta ?? 25
  const sex       = client.sesso ?? 'M'
  const categoria = client.categoria ?? ''

  // Calcolo server-side dei percentili dai valori grezzi
  const newStats = {}
  for (const test of TESTS_META.filter(t => t.categories.includes(categoria))) {
    const finalValue = resolveTestInput(test, testValues)
    if (finalValue !== null) {
      const { value } = calcPercentileEx(test.stat, finalValue, sex, clientAge, test.key)
      if (value !== null) newStats[test.stat] = value
    }
  }

  const { update } = buildCampionamentoUpdate(client, newStats, testValues)

  const batch = db.batch()
  batch.update(clientRef, update)

  if (client.clientAuthUid) {
    const isFirst     = !client.campionamenti?.length
    const rankChanged = !isFirst && update.rank !== client.rank
    const xpGain      = update.log?.[0]?.xp ?? 0
    const message = isFirst
      ? 'Primo campionamento registrato!'
      : rankChanged
        ? `Campionamento registrato — rank aggiornato: ${client.rank} → ${update.rank}`
        : `Campionamento registrato (+${xpGain} XP)`

    batch.set(db.collection(`organizations/${orgId}/notifications`).doc(), {
      clientId,
      message,
      date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      type:      rankChanged ? 'rank' : 'xp',
      read:      false,
      createdAt: new Date().toISOString(),
    })
  }

  await batch.commit()
  return { ok: true, rank: update.rank, xpGain: update.log?.[0]?.xp ?? 0 }
})
