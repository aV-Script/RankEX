import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }  from 'firebase-admin/firestore'
import { requireOrgAccess }        from '../shared/auth.js'
import { requireId, optionalString } from '../shared/validate.js'
import { buildCampionamentoUpdate } from '../shared/gamification.js'
import { TESTS_META }              from '../shared/testsMeta.js'
import { calcPercentileEx, calcAge } from '../shared/percentile.js'
import { applyFormula }            from '../shared/formulas.js'
import { resolveCategoria }        from '../shared/soccer.js'

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
  const { orgId, clientId, testValues = {}, logAction } = request.data
  await requireOrgAccess(request, orgId)
  requireId(clientId, 'clientId')
  if (!testValues || typeof testValues !== 'object' || Array.isArray(testValues)) {
    throw new HttpsError('invalid-argument', 'testValues non valido')
  }
  const safeLogAction = optionalString(logAction, 'logAction', 500)

  const db = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)
  const goalsQuery = db
    .collection(`organizations/${orgId}/clients/${clientId}/goals`)
    .where('status', '==', 'active')

  // Transazione: legge campionamenti/xp/log e obiettivi attivi e li riscrive.
  // Con lettura e scrittura separate un salvataggio concorrente (altro trainer,
  // chiusura sessione) veniva sovrascritto e perdeva XP o voci di log.
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(clientRef)
    if (!snap.exists) throw new HttpsError('not-found', 'Cliente non trovato')

    const client    = { id: clientId, ...snap.data() }
    const clientAge = calcAge(client.dataNascita) ?? client.eta ?? 25
    const sex       = client.sesso ?? 'M'
    // Fascia soccer ricalcolata dall'età attuale: prima restava quella della
    // creazione e un Pulcino di 10 anni veniva valutato con test e tabelle 7-9
    const categoria = resolveCategoria(client) ?? ''

    // Calcolo server-side dei percentili dai valori grezzi
    const newStats = {}
    for (const test of TESTS_META.filter(t => t.categories.includes(categoria))) {
      const finalValue = resolveTestInput(test, testValues)
      if (finalValue !== null) {
        const { value } = calcPercentileEx(test.stat, finalValue, sex, clientAge, test.key)
        if (value !== null) newStats[test.stat] = value
      }
    }

    // Senza nessun test valido si registrerebbe un campionamento vuoto (media 0,
    // rank F) — lo stesso effetto del vecchio campionamento fantasma.
    if (!Object.keys(newStats).length) {
      throw new HttpsError('invalid-argument', 'Nessun valore di test valido per la categoria del cliente')
    }

    // Letture prima di ogni scrittura (vincolo delle transazioni)
    const goalsSnap = await tx.get(goalsQuery)

    const { update } = buildCampionamentoUpdate(client, newStats, testValues, safeLogAction)
    if (categoria && categoria !== client.categoria) update.categoria = categoria

    tx.update(clientRef, update)

    // ── Obiettivi: controlla se questo campionamento ne raggiunge qualcuno ─────
    // Un obiettivo è su un test specifico (testKey), non solo su una stat — con
    // stat condivise tra più test (es. 'resistenza' su 5 test) va verificato che
    // il test dell'obiettivo sia effettivamente tra quelli di questa categoria,
    // non solo che la sua stat compaia in newStats.
    for (const goalDoc of goalsSnap.docs) {
      const goal     = goalDoc.data()
      const testMeta = TESTS_META.find(t => t.key === goal.testKey)
      if (!testMeta || !testMeta.categories.includes(categoria)) continue

      const achievedValue = newStats[testMeta.stat]
      if (achievedValue === undefined || achievedValue < goal.targetPercentile) continue

      tx.update(goalDoc.ref, {
        status:             'achieved',
        achievedAt:         new Date().toISOString(),
        achievedPercentile: achievedValue,
      })

      if (client.clientAuthUid) {
        tx.set(db.collection(`organizations/${orgId}/notifications`).doc(), {
          clientId,
          message:   `Obiettivo raggiunto: ${goal.testLabel} — ${achievedValue}° percentile!`,
          date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
          type:      'goal',
          read:      false,
          createdAt: new Date().toISOString(),
        })
      }
    }

    if (client.clientAuthUid) {
      const isFirst     = !client.campionamenti?.length
      const rankChanged = !isFirst && update.rank !== client.rank
      const xpGain      = update.log?.[0]?.xp ?? 0
      const message = isFirst
        ? 'Primo campionamento registrato!'
        : rankChanged
          ? `Campionamento registrato — rank aggiornato: ${client.rank} → ${update.rank}`
          : `Campionamento registrato (+${xpGain} XP)`

      tx.set(db.collection(`organizations/${orgId}/notifications`).doc(), {
        clientId,
        message,
        date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
        type:      rankChanged ? 'rank' : 'xp',
        read:      false,
        createdAt: new Date().toISOString(),
      })
    }

    return { ok: true, rank: update.rank, xpGain: update.log?.[0]?.xp ?? 0 }
  })
})
