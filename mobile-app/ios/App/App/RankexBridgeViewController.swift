import UIKit
import WebKit
import Network
import Capacitor

/// Sostituisce CAPBridgeViewController come root view controller (vedi Main.storyboard).
/// Aggiunge solo due cose che Capacitor non fornisce out-of-the-box:
///  1. una schermata nativa di errore/offline con "Riprova" (requisito esplicito —
///     vedi CLAUDE.md → mobile-app → "GESTIONE CONNESSIONE");
///  2. un bridge per window.print() (RankEX lo usa per l'export PDF — ClientReportPrint.jsx
///     / GroupReportPrint.jsx — che WKWebView non implementa nativamente).
///
/// Diventiamo navigationDelegate del WKWebView al posto del Bridge interno di Capacitor:
/// sicuro in questa configurazione perché l'app carica sempre un URL remoto https
/// (server.url in capacitor.config.ts) — non lo schema locale capacitor://, che è
/// l'unico caso in cui il Bridge avrebbe logica di navigazione propria da preservare.
class RankexBridgeViewController: CAPBridgeViewController, WKNavigationDelegate, WKScriptMessageHandler {

    // Deve restare identico a capacitor.config.ts → server.url: usato solo dal
    // pulsante "Riprova" della schermata di errore nativa.
    private let webAppURL = URL(string: "https://rankex-app.web.app")!

    private var errorOverlay: UIView?
    private let pathMonitor = NWPathMonitor()
    private var isOnline = true

    override func capacitorDidLoad() {
        super.capacitorDidLoad()

        guard let webView = bridge?.webView else { return }
        webView.navigationDelegate = self

        let printScript = WKUserScript(
            source: "window.print = function () { window.webkit.messageHandlers.rankexPrint.postMessage(null); };",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        webView.configuration.userContentController.addUserScript(printScript)
        webView.configuration.userContentController.add(self, name: "rankexPrint")

        startNetworkMonitoring()
    }

    // MARK: - Connessione (NWPathMonitor — indipendente dal ciclo di vita della WebView,
    // così la schermata offline compare anche se la connessione cade DOPO il caricamento)

    private func startNetworkMonitoring() {
        pathMonitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isOnline = path.status == .satisfied
                if path.status != .satisfied {
                    self?.showErrorOverlay(message: "Nessuna connessione a Internet.")
                }
            }
        }
        pathMonitor.start(queue: DispatchQueue(label: "com.rankex.app.network"))
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showErrorOverlay(message: errorMessage())
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showErrorOverlay(message: errorMessage())
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        dismissErrorOverlay()
    }

    private func errorMessage() -> String {
        isOnline
            ? "Non è stato possibile caricare RankEX. Riprova più tardi."
            : "Nessuna connessione a Internet."
    }

    // MARK: - Overlay nativo (UIKit puro, nessuna pagina HTML — resta utilizzabile
    // anche a connessione completamente assente)

    private func showErrorOverlay(message: String) {
        if let existing = errorOverlay {
            (existing.subviews.compactMap { $0 as? UILabel }.first)?.text = message
            return
        }

        let overlay = UIView(frame: view.bounds)
        overlay.backgroundColor = UIColor(red: 0x07/255, green: 0x09/255, blue: 0x0e/255, alpha: 1)
        overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        let label = UILabel()
        label.text = message
        label.textColor = .white
        label.textAlignment = .center
        label.numberOfLines = 0
        label.font = .systemFont(ofSize: 16)
        label.translatesAutoresizingMaskIntoConstraints = false

        let retry = UIButton(type: .system)
        retry.setTitle("RIPROVA", for: .normal)
        retry.setTitleColor(.black, for: .normal)
        retry.titleLabel?.font = .boldSystemFont(ofSize: 14)
        retry.backgroundColor = UIColor(red: 0x1d/255, green: 0xff/255, blue: 0x6b/255, alpha: 1)
        retry.layer.cornerRadius = 4
        retry.translatesAutoresizingMaskIntoConstraints = false
        retry.contentEdgeInsets = UIEdgeInsets(top: 12, left: 28, bottom: 12, right: 28)
        retry.addTarget(self, action: #selector(retryTapped), for: .touchUpInside)

        overlay.addSubview(label)
        overlay.addSubview(retry)
        view.addSubview(overlay)

        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: overlay.centerYAnchor, constant: -30),
            label.leadingAnchor.constraint(greaterThanOrEqualTo: overlay.leadingAnchor, constant: 32),
            label.trailingAnchor.constraint(lessThanOrEqualTo: overlay.trailingAnchor, constant: -32),
            retry.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 24),
            retry.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
        ])

        errorOverlay = overlay
    }

    private func dismissErrorOverlay() {
        errorOverlay?.removeFromSuperview()
        errorOverlay = nil
    }

    @objc private func retryTapped() {
        dismissErrorOverlay()
        bridge?.webView?.load(URLRequest(url: webAppURL))
    }

    // MARK: - WKScriptMessageHandler — bridge per window.print()

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "rankexPrint", let webView = bridge?.webView else { return }
        let printInfo = UIPrintInfo(dictionary: nil)
        printInfo.outputType = .general
        printInfo.jobName = "RankEX"

        let printController = UIPrintInteractionController.shared
        printController.printInfo = printInfo
        printController.printFormatter = webView.viewPrintFormatter()
        printController.present(animated: true, completionHandler: nil)
    }
}
