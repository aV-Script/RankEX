import { onDocumentCreated }        from 'firebase-functions/v2/firestore'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging }             from 'firebase-admin/messaging'

const REGION = 'europe-west1'

/**
 * Ponte tra le notifiche in-app già esistenti (organizations/{orgId}/notifications,
 * vedi CLAUDE.md → "Notifica") e le push reali sull'app mobile (mobile-app/).
 *
 * Il client scrive il proprio token in clients/{clientId}.fcmTokens (array — vedi
 * firebase/services/clients.js → addFcmToken, chiamato da hooks/useNativePush.js
 * SOLO dentro la shell nativa). Questo trigger legge quel token ogni volta che
 * trainer/org_admin creano una nuova notifica (assenza, achievement obiettivo,
 * badge, ecc.) e la spedisce via FCM. Nessuna logica business qui: la notifica
 * in-app resta la fonte di verità, questo è solo un side-effect di consegna.
 *
 * Primo trigger non-callable del progetto — cartella triggers/ era vuota finora
 * (vedi CLAUDE.md → "Backend — Cloud Functions callable").
 */
export const onNotificationCreated = onDocumentCreated(
  { document: 'organizations/{orgId}/notifications/{notificationId}', region: REGION },
  async (event) => {
    const notification = event.data?.data()
    if (!notification?.clientId) return

    const { orgId, notificationId } = event.params
    const db = getFirestore()
    const clientRef = db.doc(`organizations/${orgId}/clients/${notification.clientId}`)
    const clientSnap = await clientRef.get()
    const tokens = clientSnap.data()?.fcmTokens

    if (!Array.isArray(tokens) || tokens.length === 0) return // nessun device registrato

    // Best-effort: la notifica in-app resta la fonte di verità (già scritta prima
    // che questo trigger parta), quindi un errore qui va solo loggato per debug
    // operativo — non deve propagare come funzione fallita.
    try {
      const response = await getMessaging().sendEachForMulticast({
        tokens,
        notification: {
          title: 'RankEX',
          body: notification.message ?? 'Hai una nuova notifica',
        },
        data: {
          type: notification.type ?? '',
          notificationId,
        },
      })

      // Self-healing: un token non più valido (app disinstallata, permesso revocato)
      // non deve restare per sempre in fcmTokens — lo rimuoviamo alla prima consegna fallita.
      const staleTokens = response.responses
        .map((r, i) => (!r.success && isStaleTokenError(r.error) ? tokens[i] : null))
        .filter(Boolean)

      if (staleTokens.length > 0) {
        await clientRef.update({ fcmTokens: FieldValue.arrayRemove(...staleTokens) })
      }
    } catch (err) {
      console.error('onNotificationCreated: invio push fallito', { orgId, notificationId, err })
    }
  }
)

function isStaleTokenError(error) {
  return (
    error?.code === 'messaging/registration-token-not-registered' ||
    error?.code === 'messaging/invalid-registration-token'
  )
}
