import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiornaRuoloMembro = httpsCallable(functions, 'aggiornaRuoloMembro')

export async function updateMemberRoleUseCase(orgId, uid, role) {
  const { data } = await _aggiornaRuoloMembro({ orgId, uid, role })
  return data
}
