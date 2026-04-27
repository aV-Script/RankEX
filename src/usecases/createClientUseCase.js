import { createClientAccount, finalizeClientAccount, rollbackClientAccount } from '../firebase/services/auth'
import { addClient }                from '../firebase/services/clients'
import { createUserProfile }        from '../firebase/services/users'
import { buildNewClient }           from '../utils/gamification'
import { NEW_CLIENT_DEFAULTS }      from '../constants'
import { auditLog, AUDIT_ACTIONS }  from '../utils/auditLog'

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
  let authCreated = false
  try {
    const clientUid = await createClientAccount(email, password)
    authCreated = true
    const data  = buildNewClient(trainerId, rest, NEW_CLIENT_DEFAULTS)
    const ref   = await addClient(orgId, { ...data, email, clientAuthUid: clientUid })
    await createUserProfile(clientUid, {
      role:               'client',
      orgId,
      clientId:           ref.id,
      trainerId,
      mustChangePassword: true,
    })
    await finalizeClientAccount()
    auditLog(AUDIT_ACTIONS.CLIENT_CREATED, { clientId: ref.id, clientName: data.name, orgId })
    return { id: ref.id, ...data, email, clientAuthUid: clientUid }
  } catch (err) {
    if (authCreated) await rollbackClientAccount()
    else await finalizeClientAccount()
    throw err
  }
}
