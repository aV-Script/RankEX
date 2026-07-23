import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _creaMembroTeam = httpsCallable(functions, 'creaMembroTeam')

export async function createMemberUseCase(orgId, role, name, email, password) {
  const { data } = await _creaMembroTeam({ orgId, role, name, email, password })
  return data
}
