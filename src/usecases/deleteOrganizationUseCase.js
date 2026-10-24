import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _eliminaOrganizzazione = httpsCallable(functions, 'eliminaOrganizzazione')

export async function deleteOrganizationUseCase(orgId, confirmName) {
  const { data } = await _eliminaOrganizzazione({ orgId, confirmName })
  return data
}
