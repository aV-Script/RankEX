import { useEffect } from 'react'
import { isNativeApp } from '../utils/nativeApp'
import { closeTopModal, hasOpenModal } from './useModalStack'

/**
 * Pulsante Back Android — comportamento richiesto (vedi CLAUDE.md → mobile-app):
 * 0. se un Modal/ConfirmDialog è aperto, lo chiude — mai naviga/minimizza con un
 *    dialog aperto sopra la pagina (STORY-026, audit UX superfici mobile-native:
 *    Modal/ConfirmDialog sono puro stato React, senza history.pushState, quindi
 *    senza questo controllo il back button porterebbe via la pagina sottostante
 *    insieme al dialog aperto, o minimizzerebbe l'app lasciandolo orfano);
 * 1. altrimenti torna alla pagina precedente della WebView, se esiste;
 * 2. altrimenti NON chiude l'app — la manda in background (convenzione Android
 *    standard, es. Gmail/Chrome), mai un finish()/exitApp() che la uccide.
 *
 * Copertura nota: solo i dialog che passano da `Modal` (components/ui) o
 * `ConfirmDialog` (components/common) sono nello stack. Alcuni dialog "bespoke"
 * più vecchi (es. CloseSessionModal.jsx, RecurrenceModal.jsx, SlotPopup.jsx) non
 * sono ancora stati migrati al primitivo condiviso e restano fuori — vedi
 * `docs/BACKLOG.md` → STORY-026 per lo scope esatto.
 *
 * @capacitor/app gestisce già il caso 1 di default quando non registri un listener;
 * il listener qui serve a intercettare i casi 0 e 2. No-op fuori dalla shell nativa.
 */
export function useNativeBackButton() {
  useEffect(() => {
    if (!isNativeApp()) return

    const { App } = window.Capacitor.Plugins
    if (!App) return

    const listener = App.addListener('backButton', ({ canGoBack }) => {
      if (hasOpenModal()) { closeTopModal(); return }
      if (canGoBack) window.history.back()
      else App.minimizeApp()
    })

    return () => listener.then((l) => l.remove())
  }, [])
}
