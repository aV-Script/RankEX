import {
  doc, updateDoc, Timestamp, deleteField,
} from 'firebase/firestore'
import { db }          from './db'
import { clientsPath } from '../paths'

const FIT_AGGREGATE  = 'https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate'

// ── Google Fit REST helpers ───────────────────────────────────────────────────

async function fitAggregate(accessToken, dataTypeName, daysBack) {
  const endMs   = Date.now()
  const startMs = endMs - daysBack * 86_400_000

  const res = await fetch(FIT_AGGREGATE, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aggregateBy:     [{ dataTypeName }],
      bucketByTime:    { durationMillis: 86_400_000 },
      startTimeMillis: startMs,
      endTimeMillis:   endMs,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err  = new Error(body.error?.message ?? 'Google Fit API error')
    err.status = res.status
    throw err
  }

  return res.json()
}

function extractIntValues(data) {
  return (data.bucket ?? []).map(b => {
    const points = b.dataset?.[0]?.point ?? []
    return points.reduce((sum, p) => sum + (p.value?.[0]?.intVal ?? 0), 0)
  })
}

function extractFloatValues(data) {
  return (data.bucket ?? []).map(b => {
    const points = b.dataset?.[0]?.point ?? []
    return Math.round(points.reduce((sum, p) => sum + (p.value?.[0]?.fpVal ?? 0), 0))
  })
}


function avgInt(arr) {
  if (!arr?.length) return null
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length)
}

// ── API pubblica ──────────────────────────────────────────────────────────────

export async function enableWearable(orgId, clientId) {
  await updateDoc(doc(db, clientsPath(orgId), clientId), { wearableEnabled: true })
}

export async function disableWearable(orgId, clientId) {
  await updateDoc(doc(db, clientsPath(orgId), clientId), {
    wearableEnabled: false,
    wearable:        deleteField(),
  })
}

export async function fetchAndSaveWearableData(orgId, clientId, accessToken) {
  const DAYS = 30
  const [stepsData, activeMinsData, caloriesData] = await Promise.all([
    fitAggregate(accessToken, 'com.google.step_count.delta',  DAYS),
    fitAggregate(accessToken, 'com.google.active_minutes',    DAYS),
    fitAggregate(accessToken, 'com.google.calories.expended', DAYS).catch(() => null),
  ])

  const steps30d      = extractIntValues(stepsData)
  const activeMins30d = extractIntValues(activeMinsData)
  const calories30d   = caloriesData ? extractFloatValues(caloriesData) : []

  const steps7d      = steps30d.slice(-7)
  const activeMins7d = activeMins30d.slice(-7)
  const calories7d   = calories30d.slice(-7)

  const lastData = {
    steps30d,
    stepsAvg30d:      avgInt(steps30d),
    stepsAvg7d:       avgInt(steps7d),
    activeMins30d,
    activeMinsAvg30d: avgInt(activeMins30d),
    activeMinsAvg7d:  avgInt(activeMins7d),
    calories30d,
    caloriesAvg30d:   calories30d.length ? avgInt(calories30d) : null,
    caloriesAvg7d:    calories7d.length  ? avgInt(calories7d)  : null,
    syncedAt:         Timestamp.now(),
  }

  await updateDoc(doc(db, clientsPath(orgId), clientId), {
    'wearable.lastData': lastData,
    'wearable.lastSync': Timestamp.now(),
  })

  return lastData
}
