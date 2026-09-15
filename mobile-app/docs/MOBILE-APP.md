# RankEX Mobile — Documento Tecnico

Contenitore nativo (Capacitor) che mostra `https://rankex-app.web.app` fullscreen
su Android e iOS. **Non è una riscrittura dell'app** — carica sempre il sito online,
mai una copia locale (vedi "Configurazione").

---

## Architettura

```
mobile-app/
├── capacitor.config.ts      ← WEB_APP_URL, unico punto di configurazione
├── www/                     ← bootstrap minimo, mai mostrato (vedi sotto)
├── android/                 ← progetto Android Studio (Gradle)
│   └── app/src/main/java/.../MainActivity.java
│       → back button, overlay offline/errore nativo, bridge window.print()
├── ios/                     ← progetto Xcode (CocoaPods)
│   └── App/App/RankexBridgeViewController.swift
│       → stessa logica di MainActivity.java, equivalente iOS
└── resources/                ← icona/splash sorgente (PLACEHOLDER, vedi sotto)
```

**Perché Capacitor e non React Native/Flutter/nativo puro:** genera progetti
nativi reali (pieno controllo su firma, permessi, versioning per gli store),
usa la WebView di sistema (JS/localStorage/cookie/IndexedDB nativi — Firebase
Auth funziona senza configurazione aggiuntiva, dato che il login RankEX è
email/password, non OAuth Google che le WebView bloccano attivamente), e ha
plugin ufficiali per ogni voce della checklist funzionale senza dover scrivere
un intero framework solo per incapsulare una WebView.

**Pattern client↔server delle push:** il client registra il proprio token FCM
sul suo stesso documento Firestore (`fcmTokens`, self-update a basso rischio,
stesso livello di `wearable`/`avatarId`/`badgeShowcase`); un trigger Cloud
Functions (`functions/src/triggers/onNotificationCreated.js`, il primo trigger
non-callable del progetto) spedisce la push reale ogni volta che una notifica
in-app viene creata. Dettagli completi in `CLAUDE.md` → sezione "Mobile app".

---

## Setup ambiente

```
Node 20+ (già richiesto dal repo principale)
Android: Android Studio (Gradle/SDK/JDK inclusi) + un JDK 17 o 21
         — Gradle 8.2.1 (bundlato) NON supporta JDK 25+; se hai solo JDK 25
           di sistema, punta org.gradle.java.home al JBR di Android Studio
           (già fatto in android/gradle.properties su questa macchina)
iOS:     Xcode 15+ su macOS + CocoaPods (`sudo gem install cocoapods`)
         — NON disponibile su Windows: questo repo è stato preparato e
           verificato solo lato Android in questo ambiente (vedi "Test")
```

```bash
cd mobile-app
npm install
npx cap sync          # dopo ogni modifica a capacitor.config.ts o ai plugin
```

---

## Configurazione

**Unico punto da modificare per cambiare ambiente/URL:**
`capacitor.config.ts` → costante `WEB_APP_URL`.

Attenzione: la stessa URL è **duplicata per necessità tecnica** in altri due
punti (usati solo come fallback nativo quando il caricamento fallisce, non
per il caricamento normale — quello passa sempre da `server.url`):
- `android/app/src/main/java/com/rankex/app/MainActivity.java` → costante `WEB_APP_URL`
- `ios/App/App/RankexBridgeViewController.swift` → costante `webAppURL`

Se cambi `capacitor.config.ts`, aggiorna anche questi due o il pulsante
"Riprova" delle schermate di errore ricaricherà l'URL vecchio.

`appId` (`com.rankex.app`) è **provvisorio** — TODO: DA DEFINIRE. Non è
cambiabile dopo la prima pubblicazione su nessuno dei due store senza
pubblicare l'app come prodotto nuovo (perdendo utenti/recensioni).

---

## Icone e splash

`resources/icon.png` (1024×1024) e `resources/splash.png` (2732×2732) sono
**placeholder generati automaticamente** (screenshot Playwright di
`resources/icon-source.html`/`splash-source.html`, stessa palette brand del
resto dell'app: `#07090e` base, verde `#1dff6b`, ciano `#2ecfff`) — servono a
verificare che la pipeline di generazione funzioni, **non sono l'artwork
finale**. TODO: DA DEFINIRE — sostituire con il logo ufficiale RankEX (che ad
oggi non esiste come file immagine nel repo: `BrandingPanel.jsx` usa solo testo
con gradiente CSS, nessun asset).

Per rigenerare dopo aver sostituito `icon.png`/`splash.png`:
```bash
cd mobile-app
npx capacitor-assets generate
```
Rigenera tutte le dimensioni per entrambe le piattaforme (foglie
`android/app/src/main/res/mipmap-*`, `ios/App/App/Assets.xcassets/`).

---

## Build Android

```bash
cd mobile-app/android

# Debug (verificata in questo ambiente — BUILD SUCCESSFUL)
./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk

# Release — richiede prima la firma (vedi sotto)
./gradlew bundleRelease
# → app/build/outputs/bundle/release/app-release.aab  ← questo si carica su Play Console
```

### Firma release

**MAI committare il keystore o le sue credenziali in git** (`.gitignore` del
progetto le esclude già). Generazione (una volta sola, poi conservare il file
`.keystore` e le password in un password manager — la perdita rende
impossibile aggiornare l'app pubblicata):

```bash
keytool -genkeypair -v -keystore rankex-release.keystore \
  -alias rankex -keyalg RSA -keysize 2048 -validity 10000
```

Poi in `android/app/build.gradle`, dentro `android { ... }`, aggiungere:
```gradle
signingConfigs {
    release {
        storeFile file("../../rankex-release.keystore")
        storePassword System.getenv("RANKEX_KEYSTORE_PASSWORD")
        keyAlias "rankex"
        keyPassword System.getenv("RANKEX_KEY_PASSWORD")
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```
(Non ancora fatto in questo repo — TODO: DA DEFINIRE prima della prima release,
serve una password scelta da te, non generabile qui.)

---

## Build iOS

**Non eseguibile in questo ambiente** (Windows, niente Xcode). Su macOS:

```bash
cd mobile-app/ios/App
pod install                      # legge il Podfile già generato (8 plugin, incl. Firebase Messaging via @capacitor-community/fcm)
open App.xcworkspace             # MAI App.xcodeproj direttamente dopo pod install
```

In Xcode:
1. Seleziona il target `App` → Signing & Capabilities → il tuo Team Apple Developer
2. Aggiungi la capability **Push Notifications** (serve un Apple Developer
   Program attivo, $99/anno) — genera l'entitlements file automaticamente
3. Product → Archive (solo su device/schema "Any iOS Device", non simulatore)
4. Window → Organizer → Distribute App → App Store Connect → Upload
5. Da App Store Connect → TestFlight, aggiungi tester interni/esterni

Verifica prima di archiviare che `RankexBridgeViewController.swift` compili
(sostituisce `CAPBridgeViewController` in `Main.storyboard` — vedi
"Known issues" se Xcode segnala il custom class non trovato).

---

## Push notifications — setup Firebase

RankEX usa già Firebase (progetti `rankex-dev` / `fitquest-60a09`). Le push
riusano lo stesso progetto — nessun progetto Firebase nuovo:

1. Firebase Console → progetto → **Aggiungi app** → Android, package
   `com.rankex.app` → scarica `google-services.json` →
   `mobile-app/android/app/google-services.json` (gitignored, va scaricato
   per ogni ambiente/macchina)
2. Stessa cosa per iOS, bundle `com.rankex.app` → scarica
   `GoogleService-Info.plist` → `mobile-app/ios/App/App/GoogleService-Info.plist`
3. Solo iOS: Project Settings → Cloud Messaging → **Apple app configuration**
   → carica una APNs Auth Key (.p8, generata da Apple Developer → Certificates,
   Identifiers & Profiles → Keys) — TODO: DA DEFINIRE, serve l'account Apple
   Developer del punto precedente
4. `npx cap sync` per ricopiare i file di config nei progetti nativi

Senza questi file l'app **compila e funziona comunque** (build.gradle
verifica `google-services.json` con un try/catch e disattiva silenziosamente
solo le push se manca) — quindi non blocca il resto del lavoro.

---

## Store compliance — rischi di rifiuto

### 🔴 Apple App Store — rischio ALTO: Guideline 4.2 (Minimum Functionality)
Apple rigetta esplicitamente le app che sono "semplicemente siti web
incapsulati" senza valore nativo aggiunto. Mitigazioni già implementate in
questo progetto (non filler — tutte legate a funzionalità reali dell'app):
- **Push notifications native** (vedi sopra) — collegate al sistema di
  notifiche in-app già esistente di RankEX (assenze, achievement, badge)
- **Bridge nativo per l'export PDF** (`window.print()` — altrimenti un
  no-op silenzioso su entrambe le piattaforme, vedi "Known issues" sotto)
- **Gestione offline/errore nativa** con retry, non solo pass-through del
  browser

Anche con queste mitigazioni la review Apple resta soggettiva — non è una
garanzia di accettazione, ma riduce concretamente il rischio rispetto a una
WebView nuda.

### 🟡 Google Play — rischio MEDIO
Più tollerante sui wrapper WebView, ma:
- La "minimum functionality"/spam policy esiste anche qui, rischio minore
- **Data Safety form obbligatorio** (vedi sezione Privacy sotto)
- Play richiede di targettare un'API level recente (già `targetSdk 34` nel
  template — va aggiornato a ogni nuova release Android prima della submission,
  controllare i requisiti Play aggiornati al momento della pubblicazione)

### 🟠 Rischio tecnico verificato — export PDF
`ClientReportPrint.jsx`/`GroupReportPrint.jsx` esportano via `window.print()`.
Né Android WebView né iOS WKWebView implementano un dialogo di stampa di
default per questa API — **richiede un bridge nativo**, già implementato in
questo progetto (`PrintBridge` in `MainActivity.java`, `WKScriptMessageHandler`
in `RankexBridgeViewController.swift`) ma **non testato su device reale**
(solo verificato che compila lato Android — vedi "Test").

### Rischio NON presente (verificato sul codice)
Login Google OAuth in WebView (bloccato attivamente da Google,
`disallowed_useragent`): RankEX oggi usa solo email/password
(`LoginForm.jsx`/`useLoginForm.js`) — nessun rischio finché resta così.

---

## Privacy — checklist

**Dati raccolti da RankEX** (verificato sul codice, non inventato):
- Autenticazione: Firebase Auth, email + password (nessun social login)
- Dati anagrafici cliente: nome, età, sesso, peso, altezza, email
- Dati sportivi: test atletici, categorie, storico campionamenti, XP/rank
- Dati sanitari: BIA (composizione corporea) — solo modulo `personal_training`
- Firebase Analytics: `measurementId` presente in `firebase/config.js` ma
  **`getAnalytics()` non è mai chiamato nel codice** → nessun dato di
  analytics raccolto oggi, verificato via grep
- Nessun servizio di terze parti oltre Firebase (Auth/Firestore/Functions/Hosting)
- Wearable/Google Fit: feature disattivata (vedi CLAUDE.md), nessun dato raccolto

### Google Play — Data Safety
```
Dati raccolti:            nome, email, dati fisici (peso/altezza/età),
                           dati sanitari (BIA, solo se profilo lo prevede)
Finalità:                  funzionalità dell'app (tracking performance)
Condivisi con terze parti: NO (solo Firebase, infrastruttura, non "terze parti"
                           nel senso della policy — verificare la definizione
                           Play aggiornata al momento della compilazione)
Crittografia in transito:  SÌ (HTTPS/Firestore)
Cancellazione dati:        processo manuale (richiesta → verifica identità →
                           super_admin/org_admin esegue con eliminaCliente/
                           rimuoviMembroTeam) — vedi docs/DECISIONS.md → ADR-004.
                           SLA e canale di richiesta esatto: DA DEFINIRE (non
                           tecnico). NOTA: eliminaCliente aveva un bug (orfane
                           le subcollection notes/goals) fixato in questa
                           sessione (BUG-001) ma non ancora deployato — non
                           spuntare questa voce del form come "risolto" finché
                           il fix non è verificato e in produzione.
```

### Apple App Privacy (Nutrition Label)
```
Dati collegati all'utente: Contatti (email), Informazioni identificative
                            (nome), Dati sanitari e fitness (peso/altezza/BIA/
                            performance atletiche)
Usati per tracciarti:      NO
Usati per il funzionamento dell'app: SÌ
```

### Privacy Policy — bozza pronta, pubblicazione TODO: DA DEFINIRE
Bozza tecnica completa in `docs/PRIVACY-POLICY-DRAFT.md` (Sprint #6, EPIC-008) — ogni
dato dichiarato è verificato sul codice, non ipotizzato. Resta da fare, non delegabile
a questo processo: revisione legale, compilazione delle sezioni `[DA DEFINIRE]`
(titolare del trattamento, DPO, retention, eventuale DPA per organizzazione — RankEX è
B2B multi-tenant, quindi il modello Titolare/Responsabile riguarda ogni org cliente,
non solo RankEX stessa), pubblicazione a un URL stabile linkato da login/store listing.

---

## Test

**Eseguiti in questo ambiente (Windows, nessun device/emulatore — RAM
insufficiente per avviare l'AVD disponibile al momento del lavoro):**

| Test | Risultato |
|---|---|
| `npx cap add android` / `ios` | ✅ entrambe le piattaforme generate |
| `./gradlew assembleDebug` | ✅ BUILD SUCCESSFUL (compila MainActivity.java, plugin, risorse) |
| Generazione icone/splash (`capacitor-assets`) | ✅ 87 file Android + 10 iOS generati |
| Lint + build web principale (`npm run build`) | ✅ nessuna regressione |
| Unit test (`vitest run`) | ✅ 211/211 |
| Firestore rules test (`npm run test:rules`) | ✅ 45/45, incl. nuovo caso `fcmTokens` |
| Build iOS (Xcode/pod install) | ❌ non eseguibile — niente macOS in questo ambiente |
| Avvio reale su emulatore/device (Android o iOS) | ❌ non eseguito — vedi nota sotto |

**Nessun test manuale a schermo è stato eseguito** (apertura app, login,
back button dal vivo, tastiera, safe area reali, ecc.) — richiede un device o
un emulatore avviato, che in questo ambiente non è stato possibile far partire
(RAM del sistema insufficiente al momento). **Prima di considerare l'app
pronta per un test reale, esegui almeno:**

```bash
cd mobile-app
npx cap run android      # richiede un emulatore avviato o un device via USB
```
e la checklist manuale completa (apertura, login/logout, back button, offline,
tastiera, safe area, link interni/esterni, rotazione) su almeno un device
Android fisico e — quando disponibile un Mac — un device iOS fisico (il
simulatore iOS non testa notch/Dynamic Island in modo realistico quanto un
device fisico, e le push non funzionano affatto sul simulatore).

---

## Known issues / TODO

- **`appId` provvisorio** (`com.rankex.app`) — confermare prima della prima submission
- **Icone/splash placeholder** — sostituire con artwork ufficiale (non esiste
  ancora come file immagine nel repo RankEX)
- **Firma release Android** — plumbing pronto in `build.gradle` (Sprint #7,
  condizionale sull'esistenza del keystore), ma il keystore reale e le env var
  `RANKEX_KEYSTORE_PASSWORD`/`RANKEX_KEY_PASSWORD` restano da generare/scegliere (serve
  una password scelta da te, vedi "Firma release" più sopra)
- **iOS non compilato/verificato** in questo ambiente — verificare su macOS
  prima di procedere ad Archive/TestFlight, in particolare che
  `RankexBridgeViewController` sia risolta correttamente da Xcode come
  custom class di `Main.storyboard` (il file .pbxproj è stato modificato a
  mano, non da Xcode — se Xcode si lamenta di riferimenti file mancanti,
  aprire il progetto e verificare che compaia nel Project Navigator)
- **Push notifications non testate end-to-end** — richiede
  `google-services.json`/`GoogleService-Info.plist` reali + APNs key (iOS) +
  un device fisico
- **Privacy Policy** da scrivere e pubblicare (TODO: DA DEFINIRE, decisione
  aziendale/legale, non tecnica)
- **Bridge `window.print()`** implementato ma non testato su device reale — bottone
  "STAMPA / SALVA PDF" ora protetto da doppio tap (`usePrintTrigger()` in
  `reportPrintKit.jsx`, Sprint #9/STORY-025), ma resta da verificare dal vivo che il
  bridge nativo stesso si comporti bene con tap ravvicinati, non solo che il bottone
  web si disabiliti
- **Schermata offline** — bottone RIPROVA ora in stile outline/tinta coerente col
  design system invece del fill pieno nero-su-verde precedente (Sprint #9/STORY-025).
  Fix Android verificato con `assembleDebug` (BUILD SUCCESSFUL); fix iOS scritto ma
  **non compilato** — stesso limite generale del progetto iOS in questo ambiente
