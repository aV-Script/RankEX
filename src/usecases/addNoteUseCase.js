import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiungiNota = httpsCallable(functions, 'aggiungiNota')

/**
 * Aggiunge una nota o un commento lato BE.
 * Restituisce la nota creata completa (con id e createdAt dal BE).
 */
export async function addNoteUseCase(orgId, clientId, text, parentId = null) {
  const { data } = await _aggiungiNota({ orgId, clientId, text, parentId })
  return data
}
