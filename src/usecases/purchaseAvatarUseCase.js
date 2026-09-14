import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _acquistaAvatar = httpsCallable(functions, 'acquistaAvatar')

/** Acquista un avatar nel negozio (spike EPIC-005 — vedi docs/DECISIONS.md ADR-002). */
export async function purchaseAvatarUseCase(orgId, clientId, avatarId) {
  const { data } = await _acquistaAvatar({ orgId, clientId, avatarId })
  return data
}
