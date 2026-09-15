import { useEffect } from 'react'
import { isNativeApp } from '../utils/nativeApp'

/**
 * Pulsante Back Android — comportamento richiesto (vedi CLAUDE.md → mobile-app):
 * 1. torna alla pagina precedente della WebView, se esiste (history nativa del browser);
 * 2. altrimenti NON chiude l'app — la manda in background (convenzione Android
 *    standard, es. Gmail/Chrome), mai un finish()/exitApp() che la uccide.
 *
 * @capacitor/app gestisce già il caso 1 di default quando non registri un listener;
 * il listener qui serve solo a intercettare il caso 2. No-op fuori dalla shell nativa.
 */
export function useNativeBackButton() {
  useEffect(() => {
    if (!isNativeApp()) return

    const { App } = window.Capacitor.Plugins
    if (!App) return

    const listener = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back()
      else App.minimizeApp()
    })

    return () => listener.then((l) => l.remove())
  }, [])
}
