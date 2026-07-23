import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiungiGruppo = httpsCallable(functions, 'aggiungiGruppo')

export async function addGroupUseCase(orgId, name) {
  const { data } = await _aggiungiGruppo({ orgId, name })
  return data.id
}
