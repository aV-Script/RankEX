import { initializeApp }                          from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

// App Check — blocca richieste Firebase non provenienti da client legittimi.
// In dev: debug token automatico. La prima esecuzione stampa il token in console:
//         registrarlo in Firebase Console → App Check → Gestisci token di debug.
// In prod: reCAPTCHA v3 — VITE_RECAPTCHA_SITE_KEY obbligatoria nel build prod.
// Se la chiave non è presente, App Check non viene inizializzato (dev senza setup).
const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
if (recaptchaKey) {
  if (import.meta.env.DEV) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaKey),
    isTokenAutoRefreshEnabled: true,
  })
}

export default app
