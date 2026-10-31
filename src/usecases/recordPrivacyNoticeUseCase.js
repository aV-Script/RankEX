import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _registraInformativaPaziente = httpsCallable(functions, 'registraInformativaPaziente')

/**
 * Registra l'informativa consegnata al paziente. Chi registra e quando li
 * imposta il server.
 * @returns {Promise<object>} client.privacyNotice salvato
 */
export async function recordPrivacyNoticeUseCase(orgId, clientId, { informativaVersion, deliveredAt }) {
  const { data } = await _registraInformativaPaziente({ orgId, clientId, informativaVersion, deliveredAt })
  return data.privacyNotice
}
