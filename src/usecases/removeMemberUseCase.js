import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _rimuoviMembroTeam = httpsCallable(functions, 'rimuoviMembroTeam')

export async function removeMemberUseCase(orgId, uid) {
  const { data } = await _rimuoviMembroTeam({ orgId, uid })
  return data
}
