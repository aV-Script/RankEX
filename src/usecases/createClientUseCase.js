import { httpsCallable }     from 'firebase/functions'
import { functions }         from '../firebase/config'
import { auditLog, AUDIT_ACTIONS } from '../utils/auditLog'

const _creaCliente = httpsCallable(functions, 'creaCliente')

export async function createClientUseCase(orgId, trainerId, formData) {
  const { data } = await _creaCliente({ orgId, trainerId, formData })
  auditLog(AUDIT_ACTIONS.CLIENT_CREATED, { clientId: data.id, clientName: data.name, orgId })
  return data
}
