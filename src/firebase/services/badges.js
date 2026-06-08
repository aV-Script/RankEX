import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db }          from './db'
import { clientsPath } from '../paths'

export async function awardBadge(orgId, clientId, badgeId, awardedBy = 'system', note = null) {
  const ref   = doc(db, clientsPath(orgId), clientId)
  const entry = { awardedAt: Date.now(), awardedBy }
  if (note) entry.note = note
  await updateDoc(ref, { [`badges.${badgeId}`]: entry })
}

export async function revokeBadge(orgId, clientId, badgeId) {
  const ref = doc(db, clientsPath(orgId), clientId)
  await updateDoc(ref, { [`badges.${badgeId}`]: deleteField() })
}

// Salva i badge scelti per il profilo (array di max 5 ID)
export async function updateBadgeShowcase(orgId, clientId, badgeIds) {
  const ref = doc(db, clientsPath(orgId), clientId)
  await updateDoc(ref, { badgeShowcase: badgeIds.slice(0, 5) })
}
