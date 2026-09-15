package com.rankex.app;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.TextView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

/**
 * WEB_APP_URL è configurato in un unico punto reale: capacitor.config.ts (server.url).
 * La costante qui sotto è usata SOLO dal pulsante "Riprova" della schermata di errore,
 * per rilanciare il caricamento senza dover ricreare l'Activity — deve restare identica
 * al valore in capacitor.config.ts.
 */
public class MainActivity extends BridgeActivity {

  private static final String WEB_APP_URL = "https://rankex-app.web.app";

  private android.view.View errorOverlay;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    WebView webView = this.bridge.getWebView();

    // Bridge nativo→JS usato SOLO per implementare window.print() (RankEX lo
    // usa per l'export PDF — ClientReportPrint.jsx / GroupReportPrint.jsx —
    // che su Android WebView è altrimenti un no-op silenzioso: la WebView non
    // implementa la Print API del browser). Nessun'altra funzione esposta.
    webView.addJavascriptInterface(new PrintBridge(), "AndroidPrintBridge");

    webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
      @Override
      public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        // Il sito carica correttamente: rimuovi un eventuale overlay di errore residuo.
        dismissErrorOverlay();
        view.evaluateJavascript(
          "window.print = function () { window.AndroidPrintBridge.print(); };",
          null
        );
      }

      @Override
      public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        super.onReceivedError(view, request, error);
        if (request.isForMainFrame()) showErrorOverlay();
      }

      @Override
      public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
        super.onReceivedHttpError(view, request, errorResponse);
        if (request.isForMainFrame() && errorResponse.getStatusCode() >= 400) showErrorOverlay();
      }
    });
  }

  private boolean isOnline() {
    ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
    if (cm == null) return false;
    NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
    return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
  }

  private void showErrorOverlay() {
    runOnUiThread(() -> {
      if (errorOverlay != null) return; // già mostrato, non duplicare

      android.view.View overlay = getLayoutInflater().inflate(R.layout.view_connection_error, null);

      TextView message = overlay.findViewById(R.id.connection_error_message);
      message.setText(
        isOnline()
          ? "Non è stato possibile caricare RankEX. Riprova più tardi."
          : "Nessuna connessione a Internet."
      );

      Button retry = overlay.findViewById(R.id.connection_error_retry);
      retry.setOnClickListener(v -> {
        dismissErrorOverlay();
        bridge.getWebView().loadUrl(WEB_APP_URL);
      });

      ViewGroup root = findViewById(android.R.id.content);
      root.addView(overlay, new ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
      ));
      errorOverlay = overlay;
    });
  }

  private void dismissErrorOverlay() {
    if (errorOverlay == null) return;
    ViewGroup parent = (ViewGroup) errorOverlay.getParent();
    if (parent != null) parent.removeView(errorOverlay);
    errorOverlay = null;
  }

  /**
   * Superficie nativa esposta alla pagina — SOLO window.print(). Nessuna API
   * sensibile (storage, auth, filesystem) è raggiungibile da qui: vedi
   * CLAUDE.md → Sicurezza → "nessuna API sensibile esposta inutilmente".
   */
  public class PrintBridge {
    @JavascriptInterface
    public void print() {
      runOnUiThread(() -> {
        WebView webView = bridge.getWebView();
        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        if (printManager == null) return;
        String jobName = "RankEX";
        printManager.print(
          jobName,
          webView.createPrintDocumentAdapter(jobName),
          new PrintAttributes.Builder().build()
        );
      });
    }
  }
}
