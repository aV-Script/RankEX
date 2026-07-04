import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _eliminaGruppo = httpsCallable(functions, 'eliminaGruppo')

export async function deleteGroupUseCase(orgId, groupId) {
  const { data } = await _eliminaGruppo({ orgId, groupId })
  return data
}
