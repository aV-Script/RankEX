/**
 * Rilevamento shell nativa (Capacitor) — vedi mobile-app/ e CLAUDE.md → "Mobile app
 * (contenitore nativo)". La stessa build web deployata su rankex-app.web.app viene
 * caricata sia dal browser normale sia dalla WebView dell'app nativa: questo helper
 * distingue i due casi runtime, senza alcuna dipendenza da npm su @capacitor/core
 * (evita di appesantire il bundle web per il 100% degli utenti browser).
 *
 * `window.Capacitor` esiste SOLO quando la pagina è caricata dentro la WebView
 * nativa (iniettato dal bridge Capacitor) — su un browser normale è undefined.
 */
export function isNativeApp() {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()
}
