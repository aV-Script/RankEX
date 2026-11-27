import { HttpsError } from 'firebase-functions/v2/https'
import { resolveModuleCapabilities } from './modules.js'

/**
 * Legge `organizations/{orgId}` lato server e ne restituisce modulo, variante di
 * terminologia e capability (ADR-008, ADR-021). Mai da un parametro del client, mai
 * da `users/{uid}` (copia denormalizzata che diventa stale se super_admin cambia il
 * modulo). Da chiamare dopo requireOrgAccess/requireOrgAdmin, che validano già orgId.
 *
 * Letta fuori dalla transazione: da/verso lipedema il modulo non può cambiare
 * finché l'org ha clienti (firestore.rules → isAllowedModuleChange), e PT ↔
 * soccer non cambia nessuna capability letta qui.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} orgId
 * @returns {Promise<{ moduleType: string|null|undefined, terminologyVariant: string|undefined, capabilities: object }>}
 */
export async function getOrgModule(db, orgId) {
  const snap = await db.collection('organizations').doc(orgId).get()
  if (!snap.exists) throw new HttpsError('not-found', 'Organizzazione non trovata')

  const { moduleType, terminologyVariant } = snap.data()
  const capabilities = resolveModuleCapabilities(moduleType)
  if (!capabilities) {
    throw new HttpsError('failed-precondition', `Modulo dell'organizzazione non riconosciuto: ${moduleType}`)
  }
  return { moduleType, terminologyVariant, capabilities }
}

/**
 * Solo le capability del modulo di un'org (vedi getOrgModule).
 * @returns {Promise<object>} capability del modulo
 */
export async function getOrgCapabilities(db, orgId) {
  return (await getOrgModule(db, orgId)).capabilities
}

/**
 * Rifiuta l'operazione se il modulo dell'org non ha la capability richiesta.
 * @param {object} capabilities — da getOrgCapabilities
 * @param {string} capability   — es. 'hasGamification'
 */
export function requireCapability(capabilities, capability) {
  if (!capabilities[capability]) {
    throw new HttpsError('failed-precondition', "Operazione non disponibile per il modulo dell'organizzazione")
  }
}
