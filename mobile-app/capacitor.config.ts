import type { CapacitorConfig } from '@capacitor/cli'

/**
 * PUNTO UNICO DI CONFIGURAZIONE — vedi CLAUDE.md sezione "Mobile app".
 *
 * Per cambiare ambiente (es. puntare a rankex-dev per un test interno),
 * modifica SOLO questa costante e rilancia `npx cap sync`.
 */
const WEB_APP_URL = 'https://rankex-app.web.app'

const config: CapacitorConfig = {
  // Bundle ID / Application ID — VALORE PROVVISORIO.
  // TODO: DA DEFINIRE — confermare prima della prima submission: non è cambiabile
  // dopo la pubblicazione su nessuno dei due store senza pubblicare un'app nuova.
  appId: 'com.rankex.app',
  appName: 'RankEX',

  // webDir è richiesto dal CLI ma non viene servito: server.url sovrascrive
  // il contenuto con il sito remoto (vedi www/index.html per il perché esiste comunque).
  webDir: 'www',

  server: {
    url: WEB_APP_URL,
    // Richiesto per cookie/storage sicuri su Android WebView (Firebase Auth ne ha bisogno).
    androidScheme: 'https',
    iosScheme: 'https',
    // NIENTE altri host qui di proposito: qualunque link a un dominio diverso da
    // rankex-app.web.app viene intercettato dal comportamento nativo di default di
    // Capacitor e delegato al sistema (browser esterno, client email, dialer) —
    // è così che "link esterni gestiti correttamente" viene soddisfatto senza
    // codice custom aggiuntivo. Se in futuro si introduce un dominio custom
    // (es. app.rankex.app), aggiungerlo qui E in allowNavigation.
    allowNavigation: ['rankex-app.web.app'],
  },

  ios: {
    contentInset: 'automatic', // safe area / notch / Dynamic Island gestiti dal sistema
    scrollEnabled: true,
    backgroundColor: '#07090e',
  },

  android: {
    backgroundColor: '#07090e',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // la splash nativa (asset) resta finché non la chiudiamo a mano da JS/nativo
      launchAutoHide: false,
      backgroundColor: '#07090e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#1dff6b',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK', // testo/icone chiare su sfondo scuro del brand
      backgroundColor: '#07090e',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
