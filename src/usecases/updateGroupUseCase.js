import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiornaGruppo = httpsCallable(functions, 'aggiornaGruppo')

export async function updateGroupUseCase(orgId, groupId, data) {
  const { data: result } = await _aggiornaGruppo({ orgId, groupId, data })
  return result
}
