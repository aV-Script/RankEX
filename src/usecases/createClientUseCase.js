import { httpsCallable }     from 'firebase/functions'
import { functions }         from '../firebase/config'
import { auditLog, AUDIT_ACTIONS } from '../utils/auditLog'

const _creaCliente = httpsCallable(functions, 'creaCliente')

export async function createClientUseCase(orgId, trainerId, formData) {
  const { data } = await _creaCliente({ orgId, trainerId, formData })
  // Senza account (moduli senza login, es. lipedema) solo identificativi: nome + org
  // = diagnosi in un log letto da super_admin (ADR-015 §2). Stesso criterio sul dato
  // del reset password (ADR-010).
  auditLog(AUDIT_ACTIONS.CLIENT_CREATED, data.clientAuthUid
    ? { clientId: data.id, clientName: data.name, orgId }
    : { clientId: data.id, orgId })
  return data
}
