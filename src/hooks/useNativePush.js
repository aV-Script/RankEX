import { useEffect } from 'react'
import { isNativeApp } from '../utils/nativeApp'
import { addFcmToken } from '../firebase/services/clients'

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
    // va rimosso qui. Un token stantio dopo un logout reale viene comunque
    // auto-pulito dal trigger server-side alla prima push fallita (vedi
    // functions/src/triggers/onNotificationCreated.js) — nessun cleanup
    // aggiuntivo necessario per restare entro lo scope di questa feature.
    return () => PushNotifications.removeAllListeners()
  }, [orgId, clientId])
}
