import { useEffect } from 'react'
import { isNativeApp } from '../utils/nativeApp'
import { addFcmToken, removeFcmToken } from '../firebase/services/clients'

/**
 * Registra il device per le push notification SOLO quando l'app gira dentro
 * la shell nativa (mobile-app/, Capacitor) — no-op nel browser normale.
 *
 * Le notifiche che RankEX già genera in Firestore (organizations/{orgId}/notifications,
 * vedi CLAUDE.md → "Notifica") arrivano oggi solo in-app. Il trigger server-side
 * functions/src/triggers/onNotificationCreated.js legge questo stesso token per
 * spedirle anche come push reale — questo hook è il lato client di quel collegamento.
 *
 * Usa direttamente il bridge globale window.Capacitor.Plugins (nessuna dipendenza
 * npm da @capacitor/* nel bundle web — vedi utils/nativeApp.js).
 */
export function useNativePush(orgId, clientId) {
  useEffect(() => {
    if (!isNativeApp() || !orgId || !clientId) return

    const { PushNotifications, FCM } = window.Capacitor.Plugins
    if (!PushNotifications || !FCM) return

    // Il 'registration' di @capacitor/push-notifications dà il token APNs grezzo
    // su iOS (non usabile da Firebase Admin Messaging) e il token FCM su Android.
    // @capacitor-community/fcm unifica: FCM.getToken() fa lo scambio APNs→FCM
    // internamente su iOS e restituisce sempre un token FCM valido su entrambi.
    const onRegistration = () => {
      FCM.getToken()
        .then(({ token }) => addFcmToken(orgId, clientId, token))
        .catch(() => {}) // best-effort: nessun blocco UI se il token non arriva
    }
    const onRegistrationError = () => {} // silenzioso: la feature resta best-effort

    PushNotifications.addListener('registration', onRegistration)
    PushNotifications.addListener('registrationError', onRegistrationError)

    PushNotifications.checkPermissions().then((res) => {
      const request = res.receive === 'granted'
        ? Promise.resolve(res)
        : PushNotifications.requestPermissions()
      request.then((perm) => {
        if (perm.receive === 'granted') PushNotifications.register()
      })
    })

    // Smontaggio componente (cambio tab) ≠ logout: il token resta valido, non
    // va rimosso qui — solo al logout vero (vedi unregisterNativePush sotto,
    // chiamata PRIMA di firebase/services/auth.js → logout(), non nel cleanup
    // di questo effect: dopo signOut() le firestore.rules non permetterebbero
    // più la scrittura su isOwnClient).
    return () => PushNotifications.removeAllListeners()
  }, [orgId, clientId])
}

/**
 * Rimuove il token push del device corrente — da chiamare PRIMA di
 * firebase/services/auth.js → logout(), mai dopo: a sessione chiusa
 * firestore.rules nega la scrittura (isOwnClient richiede un utente
 * autenticato). Senza questo, su un device condiviso tra più client
 * (es. tablet della palestra) il token resta associato al client che ha
 * fatto logout finché FCM non lo segnala come stantio da solo — nel
 * frattempo le sue notifiche push arriverebbero al client che usa il
 * device dopo di lui.
 */
export async function unregisterNativePush(orgId, clientId) {
  if (!isNativeApp() || !orgId || !clientId) return
  const { FCM } = window.Capacitor.Plugins ?? {}
  if (!FCM) return
  try {
    const { token } = await FCM.getToken()
    if (token) await removeFcmToken(orgId, clientId, token)
  } catch {
    // best-effort — un fallimento qui non deve bloccare il logout
  }
}
