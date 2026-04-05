import { createClientAccount } from '../firebase/services/auth'
import { addClient }           from '../firebase/services/clients'
import { createUserProfile }   from '../firebase/services/users'
import { buildNewClient }      from '../utils/gamification'
import { NEW_CLIENT_DEFAULTS } from '../constants'

/**
 * Crea un nuovo cliente: account Auth, documento clients, profilo users.
 *
 * @param {string} orgId
 * @param {string} trainerId — uid del trainer che sta creando il cliente
 * @param {object} formData  — { email, password, ...anagrafica }
 * @returns {{ id: string, ...clientData }} — cliente completo con id Firestore
 */
export async function createClientUseCase(orgId, trainerId, formData) {
  const { email, password, ...rest } = formData
  const clientUid = await createClientAccount(email, password)
  const data      = buildNewClient(trainerId, rest, NEW_CLIENT_DEFAULTS)
  const ref       = await addClient(orgId, { ...data, email, clientAuthUid: clientUid })
  await createUserProfile(clientUid, {
    role:               'client',
    orgId,
    clientId:           ref.id,
    trainerId,
    mustChangePassword: true,
  })
  return { id: ref.id, ...data, email, clientAuthUid: clientUid }
}
