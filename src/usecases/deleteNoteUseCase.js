import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _eliminaNota = httpsCallable(functions, 'eliminaNota')

export async function deleteNoteUseCase(orgId, clientId, noteId) {
  const { data } = await _eliminaNota({ orgId, clientId, noteId })
  return data
}
