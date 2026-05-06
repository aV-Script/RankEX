import {
  getAuth,
  GoogleAuthProvider,
  linkWithRedirect,
  reauthenticateWithRedirect,
  getRedirectResult,
} from 'firebase/auth'
import {
  doc, updateDoc, Timestamp, deleteField,
} from 'firebase/firestore'
import app             from '../config'
import { db }          from './db'
import { clientsPath } from '../paths'

const FIT_AGGREGATE  = 'https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate'
const FITNESS_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
]
const PENDING_KEY = 'rankex_wearable_pending'

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

function extractSleepHours(data) {
  return (data?.bucket ?? []).map(b => {
    const points = b.dataset?.[0]?.point ?? []
    const totalMs = points.reduce((sum, p) => {
      if (p.value?.[0]?.intVal === 1) return sum // escludi AWAKE
      const startMs = parseInt(p.startTimeNanos ?? '0') / 1e6
      const endMs   = parseInt(p.endTimeNanos   ?? '0') / 1e6
      return sum + Math.max(0, endMs - startMs)
    }, 0)
    return Math.round((totalMs / 3600000) * 10) / 10
  })
}

function avg(arr) {
  if (!arr?.length) return null
  const nonZero = arr.filter(v => v > 0)
  if (!nonZero.length) return null
  return Math.round((nonZero.reduce((s, v) => s + v, 0) / nonZero.length) * 10) / 10
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

export async function linkGoogleFit(orgId, clientId) {
  const auth = getAuth(app)
  const user = auth.currentUser
  if (!user) throw new Error('Nessun utente autenticato')

  const provider = new GoogleAuthProvider()
  FITNESS_SCOPES.forEach(s => provider.addScope(s))
  provider.setCustomParameters({ prompt: 'consent' })

  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ orgId, clientId }))

  const isGoogleLinked = user.providerData.some(p => p.providerId === 'google.com')
  if (isGoogleLinked) {
    await reauthenticateWithRedirect(user, provider)
  } else {
    await linkWithRedirect(user, provider)
  }
}

export async function resolveGoogleFitRedirect() {
  const pending = sessionStorage.getItem(PENDING_KEY)
  if (!pending) return null

  const auth   = getAuth(app)
  const result = await getRedirectResult(auth)
  if (!result) return null

  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken
  if (!token) return null

  sessionStorage.removeItem(PENDING_KEY)
  const { orgId, clientId } = JSON.parse(pending)

  await updateDoc(doc(db, clientsPath(orgId), clientId), {
    wearable: {
      provider:    'google_fit',
      linkedAt:    Timestamp.now(),
      lastSync:    null,
      accessToken: token,
      lastData:    null,
    },
  })

  return fetchAndSaveWearableData(orgId, clientId, token)
}

export async function unlinkWearable(orgId, clientId) {
  await updateDoc(doc(db, clientsPath(orgId), clientId), { wearable: deleteField() })
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
