# Lezione 16 — Firestore Security Rules
[← Indice](00-indice.md)

## Obiettivo della lezione

Leggere per intero, riga per riga dove serve, l'unico file che decide davvero chi può leggere e
scrivere cosa in tutto il database di RankEX: [`firestore.rules`](../../firestore.rules) (234
righe). Capire perché queste regole — non il codice React, non `utils/validation.js` — sono la
**vera** barriera di sicurezza dell'app. Imparare a leggere il linguaggio dichiarativo delle
Security Rules: `get()`/`exists()` e il loro costo, il pattern null-safe di `userProfile()`, i
limiti di piano applicati solo in `create`, e il vincolo del linguaggio che impedisce di usare
`if`/`return` multipli dentro una funzione. Lungo il percorso, un confronto diretto tra ciò che
la documentazione del progetto descrive e ciò che le regole — insieme al codice delle Cloud
Functions — fanno davvero, con una discrepanza reale e concreta da analizzare.

## Concetti teorici

> 📎 **Approfondimento: Firestore Security Rules come firewall dichiarativo**
>
> Immagina un locale con due livelli di sicurezza: un sito web che mostra solo alcuni pulsanti
> "Prenota" o "Accedi" a seconda di chi sembri essere, e un buttafuori alla porta che controlla
> il documento di identità di chiunque si presenti, indipendentemente da cosa dica il sito. Il
> sito web è la tua app React: nasconde pulsanti, disabilita form, mostra messaggi — ma è
> tutto codice che gira **nel browser dell'utente**, quindi sotto il suo controllo. Chiunque
> apra gli strumenti sviluppatore del browser può ignorare completamente la UI e parlare
> direttamente con l'SDK di Firestore, con le stesse credenziali di autenticazione valide che
> l'app gli ha già dato. In quel momento, l'unica cosa che decide se quella richiesta va a buon
> fine è il buttafuori — le Security Rules, valutate lato server da Google, non aggirabili da
> nessun codice client. Per questo la validazione in `utils/validation.js` (Lezione 17) è
> **UX**: previene errori onesti, dà feedback immediato, evita un roundtrip di rete inutile —
> ma non è **sicurezza**. Un utente malevolo con un token valido rubato, o anche solo un
> utente legittimo con cattive intenzioni che apre la console del browser, la bypassa
> interamente. Le Security Rules sono l'unico posto dove "non fidarti mai del client" è
> applicato per davvero.

Il linguaggio delle Security Rules è **dichiarativo**, non imperativo: non descrivi *come*
ottenere un risultato, descrivi *quali condizioni* devono essere vere perché un'operazione sia
permessa. La struttura di base è `match /percorso/{variabile} { allow <operazione>: if
<espressione booleana>; }`, dove `<operazione>` è `read` (o, più granulare, `get`/`list`) e
`write` (o `create`/`update`/`delete`). Ogni richiesta a Firestore — che arrivi dall'SDK del
browser o (con l'eccezione importante discussa più sotto) da un altro client — viene valutata
contro queste espressioni prima di essere eseguita.

## Dove compare nel progetto

- [`firestore.rules`](../../firestore.rules) — il file per intero, 234 righe, nella root del
  repository
- `CLAUDE.md`, sezioni "Firestore Rules — pattern corretto" e "Firestore Rules — limiti piano"
  — descrivono a parole gli stessi meccanismi analizzati qui
- [`functions/src/shared/auth.js`](../../functions/src/shared/auth.js) — usato dalle Cloud
  Functions per un controllo di ruolo **equivalente ma separato**, importante per capire dove
  finisce davvero il perimetro di `firestore.rules` (vedi sezione dedicata più sotto)

## Analisi del codice

### 1. Le funzioni helper (righe 5-76)

Tutte le regole del file si appoggiano su un piccolo set di funzioni riusabili, definite in
cima al file. Le leggiamo prima singolarmente, perché ogni regola successiva le richiama per
nome.

```js
function isAuth() {
  return request.auth != null;
}
```

La base di tutto: `request.auth` è popolato da Firestore automaticamente con l'identità
dell'utente autenticato (se presente) su ogni richiesta — non è qualcosa che il client può
falsificare, viene verificato da Firebase Auth lato server prima ancora che la regola venga
valutata.

```js
function userProfile() {
  let p = get(/databases/$(database)/documents/users/$(request.auth.uid));
  return p == null ? {} : p.data;
}
```

Questa è probabilmente la funzione più importante del file, perché quasi ogni altra regola la
richiama (direttamente o indirettamente). `get(path)` in una regola Firestore legge un
documento **arbitrario** — non necessariamente quello a cui la richiesta originale si
riferisce — per usarne i dati come parte della decisione. Qui si legge il profilo dell'utente
che sta facendo la richiesta, per poterne controllare il `role`.

**Il pattern null-safe, spiegato.** In Firestore Security Rules, `get()` su un documento che
non esiste **restituisce `null`** (non lancia un'eccezione — è un comportamento specifico del
linguaggio delle regole, diverso da come si comporterebbe un accesso a un campo mancante in
JS). Se il codice provasse ad accedere direttamente a `get(...).data.role` senza controllare
prima se il documento esiste, e quel documento non esistesse (un caso limite reale: la finestra
temporale tra la creazione dell'account Firebase Auth e la creazione del documento
`/users/{uid}` corrispondente, oppure un utente con un profilo cancellato per errore), l'accesso
a `.data` su un valore `null` farebbe fallire l'intera valutazione della regola con un errore —
equivalente, in pratica, a un "permission denied" anche per controlli che non dovrebbero
esserne minimamente influenzati. Da qui il ternario a riga 13: `p == null ? {} : p.data` — se il
profilo non esiste, si restituisce un oggetto vuoto `{}` invece di propagare l'assenza. Le
regole successive che leggono `userProfile().role` su un oggetto vuoto ottengono semplicemente
`null` (campo mancante), che fallisce i confronti successivi (`null == 'client'` → `false`) in
modo pulito, senza eccezioni.

```js
function isSuperAdmin() {
  return isAuth() && userProfile().role == 'super_admin';
}

function isClientOfOrg(orgId) {
  return isAuth() &&
    userProfile().role == 'client' &&
    userProfile().orgId == orgId;
}

function isOrgMember(orgId) {
  return isAuth() &&
    exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
}
```

`isOrgMember` usa `exists()` invece di `get()` — non serve leggere i *dati* del documento
membro, solo sapere se esiste. `exists()` è più economico concettualmente (anche se conta
comunque come una lettura ai fini del limite di 10 accessi per valutazione, vedi più sotto) e
più esplicito nell'intento rispetto a un `get() != null`.

```js
function memberRole(orgId) {
  let doc = get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
  return doc == null ? null : doc.data.role;
}

function canWrite(orgId) {
  return isSuperAdmin() ||
    (isOrgMember(orgId) && memberRole(orgId) in ['org_admin', 'trainer']);
}

function canRead(orgId) {
  return isSuperAdmin() || isOrgMember(orgId);
}
```

Stesso pattern null-safe di `userProfile()`, applicato qui al documento membro
dell'organizzazione invece che al profilo utente globale. `canWrite`/`canRead` sono i due
predicati più riusati in tutto il resto del file — quasi ogni `match` più sotto li richiama
almeno una volta.

```js
function withinTrainerLimit(orgId) {
  let org   = get(/databases/$(database)/documents/organizations/$(orgId)).data;
  let limit = org.plan == 'enterprise' ? 999999 : org.plan == 'pro' ? 5 : 1;
  return !('memberCount' in org) || org.memberCount < limit;
}

function withinClientLimit(orgId) {
  let org   = get(/databases/$(database)/documents/organizations/$(orgId)).data;
  let limit = org.plan == 'enterprise' ? 999999 : org.plan == 'pro' ? 100 : 10;
  return !('clientCount' in org) || org.clientCount < limit;
}
```

Riga per riga:
- `let limit = org.plan == 'enterprise' ? 999999 : org.plan == 'pro' ? 5 : 1;` — un ternario
  **annidato** che fa le veci di un `if/else if/else`: se `plan` è `'enterprise'`, limite
  praticamente infinito (`999999`); altrimenti, se è `'pro'`, il limite specifico per quel
  piano; altrimenti (`free`, il caso di default), il limite più basso. Coincide esattamente con
  `PLAN_LIMITS` in `src/config/plans.config.js` (fonte di verità lato applicazione — qui è la
  fonte di verità lato *enforcement*, e le due devono restare in sync a mano, stesso tipo di
  rischio già discusso in Lezione 14 per `gamification.js`).
- `return !('memberCount' in org) || org.memberCount < limit;` — il bypass automatico per le
  organizzazioni create prima dell'introduzione del contatore. Il commento del file stesso lo
  spiega alle righe 46-48: *"Se il campo counter non è ancora inizializzato (org esistente), si
  lascia passare (return true) fino alla prima operazione contabile."* Senza questo bypass,
  ogni organizzazione creata prima che `memberCount` esistesse come campo si troverebbe
  bloccata per sempre, perché `org.memberCount` sarebbe `undefined` e qualsiasi confronto
  numerico (`undefined < limit`) fallirebbe sempre in Firestore Rules — un tipico problema di
  **retrocompatibilità dei dati**: quando aggiungi un vincolo su un campo che non esiste ancora
  su tutti i documenti, la regola deve saper distinguere "campo assente" da "campo a zero".

```js
function isOrgAdminForMember(targetUid) {
  let admin = userProfile();
  return isAuth() &&
    admin.role == 'org_admin' &&
    admin.orgId != null &&
    exists(/databases/$(database)/documents/organizations/$(admin.orgId)/members/$(targetUid)) &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['role']) &&
    request.resource.data.role in ['org_admin', 'trainer', 'staff_readonly'];
}
```

Questa funzione governa un caso molto specifico e delicato: un org_admin che cambia il ruolo di
un proprio membro. Due dettagli meritano attenzione:
- `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['role'])` — confronta il
  documento **dopo** la scrittura proposta (`request.resource.data`) con quello **prima**
  (`resource.data`), e richiede che l'unico campo cambiato sia `role`. Se un org_admin provasse
  a cambiare *anche* `orgId` o `clientId` nella stessa scrittura, la regola negherebbe
  l'operazione — anche se il nuovo `role` fosse valido.
- `request.resource.data.role in ['org_admin', 'trainer', 'staff_readonly']` — nota bene cosa
  **manca** da questa lista: `'super_admin'`. È una prevenzione esplicita di escalation di
  privilegi: un org_admin non può promuovere nessuno (nemmeno sé stesso) a super_admin
  attraverso questo meccanismo, per quanto ampi siano i suoi permessi sulla propria
  organizzazione.

```js
function isOwnClient(orgId, clientId) {
  return isAuth() &&
    userProfile().orgId == orgId &&
    userProfile().clientId == clientId &&
    userProfile().role == 'client';
}
```

Il predicato che identifica "l'utente autenticato È il cliente `clientId`" — usato ovunque un
client debba poter leggere/scrivere in modo limitato i propri dati.

### 2. `/users/{uid}` (righe 80-103)

```js
match /users/{uid} {
  allow read: if isAuth() && (request.auth.uid == uid || isSuperAdmin());

  allow create: if isSuperAdmin() ||
    (isAuth() &&
     request.resource.data.orgId != null &&
     isOrgMember(request.resource.data.orgId) &&
     memberRole(request.resource.data.orgId) in ['org_admin', 'trainer']);

  allow update: if isSuperAdmin() ||
    (request.auth.uid == uid &&
     request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['mustChangePassword']) &&
     request.resource.data.mustChangePassword == false) ||
    isOrgAdminForMember(uid);

  allow delete: if isSuperAdmin();
}
```

L'`allow update` è composto da tre rami alternativi (`||`), ognuno dei quali basta da solo per
autorizzare la scrittura:
1. `isSuperAdmin()` — può tutto, sempre.
2. `request.auth.uid == uid && ... .hasOnly(['mustChangePassword']) && ...mustChangePassword ==
   false` — un utente può modificare **solo il proprio** documento, **solo** il campo
   `mustChangePassword`, e **solo** impostandolo a `false`. Non può reimpostarlo a `true` (non
   c'è modo, tramite questa regola, che un utente forzi quel flag verso l'alto per sé o per
   altri), né può, nella stessa scrittura, cambiare `role` o `orgId` — perché `hasOnly` esclude
   esplicitamente qualunque altro campo. Questo è l'unico self-service write permesso su
   `/users/{uid}`, ed è usato da `ChangePasswordScreen.jsx` dopo un cambio password riuscito.
3. `isOrgAdminForMember(uid)` — il caso già discusso sopra.

### 3. `/organizations/{orgId}` (righe 107-129) — il caso più denso del file

```js
match /organizations/{orgId} {
  allow read:   if isSuperAdmin() || isOrgMember(orgId) || isClientOfOrg(orgId);
  allow create, delete: if isSuperAdmin() ||
    (isOrgMember(orgId) && memberRole(orgId) == 'org_admin');
  allow update: if isSuperAdmin() ||
    (isOrgMember(orgId) && memberRole(orgId) == 'org_admin' &&
     !request.resource.data.diff(resource.data).affectedKeys().hasAny(['memberCount', 'clientCount', 'moduleType', 'plan'])) ||
    (isOrgMember(orgId) && memberRole(orgId) == 'org_admin' &&
     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['memberCount']) &&
     request.resource.data.memberCount >= 0 &&
     (!('memberCount' in resource.data) && request.resource.data.memberCount == 1 ||
      request.resource.data.memberCount == resource.data.memberCount + 1 ||
      request.resource.data.memberCount == resource.data.memberCount - 1)) ||
    (isOrgMember(orgId) && memberRole(orgId) in ['org_admin', 'trainer'] &&
     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['clientCount']) &&
     request.resource.data.clientCount >= 0 &&
     (!('clientCount' in resource.data) && request.resource.data.clientCount == 1 ||
      request.resource.data.clientCount == resource.data.clientCount + 1 ||
      request.resource.data.clientCount == resource.data.clientCount - 1));
```

`allow update` è un unico, lungo `||` di tre rami — la traduzione letterale, nel linguaggio
delle regole, di "un org_admin può aggiornare l'organizzazione in **uno di questi tre modi
diversi**, mai un misto":
1. **Aggiornamento "normale"**: qualsiasi campo tranne `memberCount`, `clientCount`,
   `moduleType`, `plan` (`!... .hasAny([...])`) — questi quattro campi sono esclusi da qui
   perché ognuno ha (o dovrebbe avere) una propria regola più stretta altrove nello stesso
   `||`, o perché sono strutturali/di fatturazione e riservati a `isSuperAdmin()` (`moduleType`
   e `plan` non ricompaiono in nessun altro ramo — solo super_admin può cambiarli).
2. **Incremento/decremento di `memberCount`**: l'unico campo toccato dev'essere esattamente
   `memberCount` (`hasOnly(['memberCount'])`), il nuovo valore non può essere negativo, e deve
   essere **esattamente** il valore precedente ±1 (o, se il campo non esisteva ancora,
   esattamente `1` — il caso di inizializzazione per un'org "vecchia" che non aveva ancora il
   contatore). Non è possibile, tramite questa regola, resettare `memberCount` a un valore
   arbitrario o farlo saltare di più di un'unità in una singola scrittura — anche se la
   richiesta arriva da un org_admin legittimo.
3. **Stesso meccanismo per `clientCount`**, con la differenza che qui sono ammessi sia
   `org_admin` che `trainer` (coerente con il fatto che è il trainer, tipicamente, a
   creare/eliminare i clienti).

Questo blocco è la prova concreta, nel codice, dell'affermazione di `CLAUDE.md`: *"memberCount
/ clientCount modificabili solo in ±1 per batch — nessun reset diretto"*. La regola non si fida
del fatto che il codice applicativo (`addMember`/`removeMember` in `firebase/services/org.js`)
usi sempre `increment(1)`/`increment(-1)` correttamente — la vincola anche lato server,
indipendentemente da cosa il client tenti di scrivere.

### 4. `/organizations/{orgId}/members/{uid}` — i limiti di piano SOLO su create (righe 133-140)

```js
match /members/{uid} {
  allow read:   if isSuperAdmin() ||
    (isOrgMember(orgId) && memberRole(orgId) == 'org_admin');
  allow create: if isSuperAdmin() ||
    (isOrgMember(orgId) && memberRole(orgId) == 'org_admin' && withinTrainerLimit(orgId));
  allow update, delete: if isSuperAdmin() ||
    (isOrgMember(orgId) && memberRole(orgId) == 'org_admin');
}
```

Qui si vede in modo diretto il pattern descritto in `CLAUDE.md`: `withinTrainerLimit(orgId)`
compare **solo** nella regola `create` (riga 137). `update` e `delete` (riga 138-139)
richiedono lo stesso ruolo (`org_admin`) ma **non** ricontrollano il limite. La ragione è
logica: un limite di piano ha senso solo per impedire di *aggiungere* nuovi membri oltre la
soglia — non ha senso impedire di *modificare* (es. cambiare nome/email) o *rimuovere* un
membro già esistente perché l'organizzazione "è già oltre il limite" (situazione che può
capitare legittimamente, es. dopo un downgrade di piano). Lo stesso schema esatto si ripete per
`withinClientLimit` nella regola `/clients/{clientId}` subito sotto (riga 147, solo su
`create`).

### 5. `/organizations/{orgId}/clients/{clientId}` e le sue note (righe 144-166)

```js
match /clients/{clientId} {
  allow read:   if canRead(orgId) || isOwnClient(orgId, clientId);
  allow create: if isSuperAdmin() ||
    (isOrgMember(orgId) && memberRole(orgId) in ['org_admin', 'trainer'] && withinClientLimit(orgId));
  allow update: if canWrite(orgId) ||
    (isOwnClient(orgId, clientId) &&
     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['wearable', 'avatarId', 'badgeShowcase']));
  allow delete: if canWrite(orgId);
```

La riga più interessante è `allow update`: un cliente può scrivere sul **proprio** documento,
ma solo se l'unico campo modificato appartiene alla whitelist `['wearable', 'avatarId',
'badgeShowcase']`. Verificando dove queste scritture dirette (client-side, via
`updateDoc`, non tramite Cloud Function) avvengono davvero nel codice:
- `src/features/client/client-view/avatar/AvatarPicker.jsx` (riga 19) — `updateClient(orgId,
  clientId, { avatarId })`: coerente, `avatarId` è nella whitelist.
- `src/firebase/services/badges.js` (`updateBadgeShowcase`, righe 18-21) — scrive
  `badgeShowcase`: coerente.

Da notare: `awardBadge`/`revokeBadge`, nello stesso file `badges.js` (righe 5-15), scrivono
invece sul campo `badges.${badgeId}` (una mappa annidata) — il cui *nome di campo di primo
livello* è `badges`, **non** `badgeShowcase`, e quindi **non** rientra nella whitelist della
regola `isOwnClient`. Verificando `src/hooks/useBadges.js` (righe 19-33), l'assegnazione
automatica dei badge è effettivamente disabilitata quando `readonly === true`, e
`src/features/client/client-view/ClientDashboardPage.jsx` (riga 143) passa sempre
`readonly: true` quando `useBadges` viene chiamato dalla sessione del cliente stesso: la
scrittura su `badges.*` avviene sempre e solo da una sessione trainer/org_admin (che rientra in
`canWrite(orgId)`, senza restrizioni di campo), mai da quella del cliente. La regola e il
codice applicativo, verificati insieme, sono coerenti — ma è un esempio concreto di quanto sia
facile, aggiungendo in futuro un nuovo campo scrivibile lato client, dimenticarsi di
aggiornare **sia** la whitelist nella regola **sia** il gate `readonly` nel hook: le due cose
devono restare allineate a mano, esattamente come i limiti di piano lato regole e lato
`plans.config.js`.

```js
    // ── Notes (thread + commenti del cliente) ──────────
    // Trainer: legge, crea thread root e commenti, elimina qualsiasi nota.
    // Client: solo lettura delle proprie note — non può scrivere né eliminare.

    match /notes/{noteId} {
      allow read: if canRead(orgId) || isOwnClient(orgId, clientId);
      allow create: if canWrite(orgId);
      allow delete: if canWrite(orgId);
      allow update: if false;
    }
  }
```

`allow update: if false;` è la forma più diretta possibile di "mai, per nessuno" (nemmeno
super_admin: non esiste bypass in nessuna condizione) — coerente con il fatto che le note sono
pensate come un log immutabile di eventi, non un testo modificabile dopo la pubblicazione
(coerente anche con l'assenza di un caso d'uso "modifica nota" da nessuna parte nella UI).

**Una discrepanza reale con la documentazione del progetto, verificata su tre file
indipendenti.** Il commento sopra la regola (righe 154-155) dichiara esplicitamente: *"Client:
solo lettura delle proprie note — non può scrivere né eliminare."* — e infatti `allow create`
(riga 160) richiede `canWrite(orgId)`, che esclude il ruolo `client` (`canWrite` è vero solo per
super_admin o membri con ruolo `org_admin`/`trainer` — righe 36-39). Questo **contraddice**
quanto descritto nella sezione "Modelli dati" di `CLAUDE.md` per l'entità Nota: *"Pattern
thread: parentId === null = nota principale; parentId = noteId = commento. Regola: il client
può creare solo commenti (parentId != null) su thread esistenti."* Verificando il resto della
catena di codice, la versione corretta è quella del commento nelle regole, non quella di
`CLAUDE.md`:
- La Cloud Function che gestisce la creazione di una nota,
  [`functions/src/callable/aggiungiNota.js`](../../functions/src/callable/aggiungiNota.js)
  (righe 21-24), contiene un controllo esplicito: `if (profile.role === 'client') { throw new
  HttpsError('permission-denied', 'I client non possono aggiungere note') }`.
- Il componente client-facing,
  [`src/features/client/client-view/ClientDashboardPage.jsx`](../../src/features/client/client-view/ClientDashboardPage.jsx)
  (riga 311), monta `<NotesSection ... readonly />` con `readonly` **sempre** `true` per il
  cliente — che in `NotesSection.jsx` (righe 128-150, 226-246) nasconde interamente i campi di
  input per una nuova nota o un nuovo commento.

Tre livelli indipendenti (regola Firestore, Cloud Function, UI) concordano tutti sullo stesso
comportamento reale (il cliente è sempre in sola lettura sulle note), mentre — quando questa
lezione è stata scritta la prima volta — una singola frase nella sezione "Modelli dati" di
`CLAUDE.md` descriveva un comportamento diverso (probabilmente un'intenzione di design
precedente, poi ristretta per motivi di moderazione, senza che quella riga di documentazione
venisse aggiornata di conseguenza). **Quella riga di `CLAUDE.md` è stata corretta subito dopo**
(commit `4251d23`, stesso giro di manutenzione dei fix delle Lezioni 11/13/14) — apri
`CLAUDE.md` oggi, sezione "Modelli dati" → "Nota", e la trovi già allineata al codice. Questo
non rende l'esempio meno utile: è un esempio concreto, non ipotetico, del motivo per cui —
anche in un corso basato su un documento tecnico curato come `CLAUDE.md`, e anche **dopo** che
un errore di documentazione è stato corretto — la regola d'oro resta la stessa: **verifica
sempre sul codice**, non fermarti al primo documento che descrive "come dovrebbe funzionare",
per quanto quel documento sia oggi accurato.

**Un secondo dettaglio architetturale, più generale, che questo caso rivela.** La scrittura di
una nota **non passa mai** da un `addDoc`/`setDoc` diretto del client SDK — passa sempre da
`addNoteUseCase` (`src/usecases/addNoteUseCase.js`) → `httpsCallable('aggiungiNota')` → Cloud
Function eseguita con **Admin SDK**. L'Admin SDK, per definizione, **bypassa interamente le
Firestore Security Rules** (è il canale con cui Google si fida esplicitamente, riservato
all'ambiente server-side). Questo significa che la regola `allow create: if canWrite(orgId)` su
`/notes/{noteId}` non sta *davvero* impedendo a un client di scrivere una nota tramite l'app —
sta impedendo a un client di scriverla **tramite una chiamata diretta al Firestore SDK dal
browser**, bypassando completamente l'app. Il vero controllo "il client non può scrivere note"
che governa il comportamento dell'app com'è oggi vive nella Cloud Function
(`aggiungiNota.js:22-24`), non nella regola. La regola resta comunque necessaria — è quello che
impedisce a un utente che scopre le devtools e chiama Firestore direttamente, bypassando
l'intera app — ma **non è più l'unica** barriera per i percorsi di scrittura ormai migrati alle
Cloud Functions (Lezione 13). Per i percorsi che *restano* scritture dirette dal client SDK
(come `avatarId`/`badgeShowcase`/`wearable` appena visti, o `updateClient` per BIA/misure —
sempre lato trainer), la regola resta l'unica e completa barriera.

### 6. `/slots/{slotId}` (righe 168-175)

```js
match /slots/{slotId} {
  allow read: if canRead(orgId) ||
    (isClientOfOrg(orgId) &&
     resource.data.clientIds.hasAny([userProfile().clientId]));
  allow write: if canWrite(orgId);
}
```

Qui `allow write` copre in un colpo solo `create`, `update` e `delete` — a differenza delle
regole su `/clients/{clientId}` viste sopra, dove i tre casi avevano condizioni diverse
(limite di piano solo su create). Quando le condizioni sono identiche per tutte le operazioni
di scrittura, il file usa `write` invece di ripetere tre volte la stessa espressione — è una
scelta di stile, non un vincolo del linguaggio. Il ramo di lettura per il cliente usa
`resource.data.clientIds.hasAny([userProfile().clientId])`: un cliente può leggere solo gli
slot a cui è effettivamente assegnato, non l'intero calendario dell'organizzazione.

### 7. `/groups/{groupId}` e le note di gruppo (righe 179-192)

```js
match /groups/{groupId} {
  allow read:  if canRead(orgId);
  allow write: if canWrite(orgId);

  match /notes/{noteId} {
    allow read:   if canRead(orgId);
    allow create: if canWrite(orgId) &&
      request.resource.data.authorId == request.auth.uid;
    allow delete: if canWrite(orgId) &&
      (resource.data.authorId == request.auth.uid ||
       memberRole(orgId) == 'org_admin');
    allow update: if false;
  }
}
```

Due dettagli da notare: `allow create` richiede non solo `canWrite(orgId)` ma anche che
`request.resource.data.authorId == request.auth.uid` — impedisce a un trainer di scrivere una
nota di gruppo **spacciandola per firmata da qualcun altro**, un controllo che non ha
equivalente sulle note del singolo cliente (dove `authorId` viene impostato lato Cloud Function
dal `profile.uid` verificato, righe 32-34 di `aggiungiNota.js`, quindi la garanzia lì è già
data dall'esecuzione server-side, non serve ripeterla nella regola). `allow delete` permette la
cancellazione all'autore stesso **oppure** a un org_admin — un trainer non può cancellare la
nota di gruppo scritta da un altro trainer, ma un org_admin sì (potere di moderazione più
ampio).

### 8. `/recurrences/{recId}`, `/notifications/{notId}`, `/workoutPlans/{planId}` (righe 194-220)

```js
match /recurrences/{recId} {
  allow read:  if canRead(orgId);
  allow write: if canWrite(orgId);
}

match /notifications/{notId} {
  allow read: if canRead(orgId) ||
    (isClientOfOrg(orgId) &&
     userProfile().clientId == resource.data.clientId);
  allow create: if canWrite(orgId);
  allow update, delete: if canWrite(orgId) ||
    (isClientOfOrg(orgId) &&
     resource.data.clientId == userProfile().clientId);
}

match /workoutPlans/{planId} {
  allow read:                    if canRead(orgId) || isClientOfOrg(orgId);
  allow create, update, delete:  if canWrite(orgId);
}
```

Le notifiche sono l'unico caso, in tutto il file, dove il cliente ha permesso di `update`/
`delete` sui **propri** documenti senza restrizione di campo (a differenza della whitelist
vista su `/clients/{clientId}`) — coerente con `useNotifications.js` (Lezione 15), dove il
cliente segna le notifiche come lette (`markAllRead`) ed elimina quelle scadute
(`deleteNotification`) direttamente. `workoutPlans` usa `isClientOfOrg(orgId)` invece di
`isOwnClient(orgId, clientId)` per la lettura — il commento nel checklist di `CLAUDE.md`
spiega perché: *"resource.data.clientId == userProfile().clientId non è valutabile da
Firestore a query-plan time su collection query"* — cioè: quando il client esegue una **query**
sulla collection `workoutPlans` (non un `get` su un documento specifico), Firestore deve poter
determinare se la query è "sicura" ancora prima di sapere quali documenti restituirà, e non può
farlo se la regola dipende da un confronto con `resource.data` (i dati di un documento che, in
fase di query, non è ancora stato letto). La soluzione adottata qui è più permissiva
(qualunque client dell'org può, in teoria, leggere l'intera collection) e lascia al codice
applicativo (`getWorkoutPlanForClient`, che **filtra** già per `clientId` nella query stessa)
il compito di restituire solo i documenti pertinenti — un compromesso pragmatico tra
espressività delle regole e complessità.

### 9. `/audit_logs/{logId}` (righe 227-232)

```js
match /audit_logs/{logId} {
  allow read:   if isSuperAdmin();
  allow create: if isAuth();
  allow update: if false;
  allow delete: if false;
}
```

Append-only per costruzione: chiunque sia autenticato può **creare** una voce di log (ha senso:
ogni utente, di qualunque ruolo, genera eventi da tracciare — login, logout, cambio password),
ma **nessuno**, in nessuna condizione, può modificarla o eliminarla dopo la creazione — nemmeno
super_admin. È l'unico modo, dichiarativamente, di garantire che un log di audit non possa
essere manomesso per coprire un'azione, nemmeno da chi ha in teoria i permessi più ampi
dell'app.

## Diagramma mentale

```
                     Richiesta a Firestore (read o write)
                                  │
                                  ▼
              ┌───────────────────────────────────────┐
              │   Firestore valuta firestore.rules     │
              │   PRIMA di eseguire l'operazione        │
              │   (lato server Google — non bypassabile │
              │    da nessun codice client)              │
              └───────────────────────────────────────┘
                                  │
              ┌───────────────────┴────────────────────┐
              │                                          │
     La richiesta arriva DAL CLIENT SDK          La richiesta arriva
     (browser, con firebase/services/*.js)       DA UNA CLOUD FUNCTION
              │                                  (Admin SDK, usecases/*.js)
              ▼                                          │
     firestore.rules è l'UNICA barriera                  ▼
     (get/exists, canRead/canWrite,               firestore.rules NON viene
      isOwnClient, limiti di piano...)            valutato — l'Admin SDK bypassa
              │                                    le regole per definizione;
              ▼                                    la sicurezza qui la fa il
      permesso o negato                            CODICE della Cloud Function
                                                    (es. aggiungiNota.js:22-24)
```

## Errori comuni

- **Scrivere `if p.data.role == 'x'` senza il controllo null-safe.** Se `p` (il risultato di
  `get()`) fosse `null` perché il documento non esiste ancora, questo accesso diretto farebbe
  fallire l'intera valutazione della regola con un errore, non semplicemente restituire
  `false` — un comportamento molto più difficile da diagnosticare di un "permission denied"
  pulito.
- **Provare a scrivere `if (condizione) { return true } else { return false }` dentro una
  funzione delle regole.** Il linguaggio non lo supporta: una funzione può contenere solo
  dichiarazioni `let` seguite da **un singolo** `return` con un'espressione booleana. Ogni
  `if`/`else` va riscritto come operatore ternario (`condizione ? valoreSeVero :
  valoreSeFalso`), come si vede sistematicamente in tutto `firestore.rules` (`withinTrainerLimit`,
  `memberRole`, `userProfile`).
- **Dimenticare che `get()`/`exists()` dentro le regole hanno un limite hard.** Firestore
  permette al massimo 10 chiamate di accesso a documenti (`get`/`exists`) per la valutazione di
  una singola richiesta (limite più alto, 20, per transazioni/batch — verificato sulla
  documentazione ufficiale Firebase); oltre quel limite, la richiesta viene negata a
  prescindere dalla logica delle condizioni. Alcune chiamate identiche ripetute nella stessa
  valutazione possono essere servite dalla cache interna e non contare doppio, ma è comunque
  un'insidia reale se si annidano troppe funzioni che chiamano `get()` l'una dentro l'altra.
- **Applicare i limiti di piano anche su `update`/`delete`.** Come visto nella regola su
  `/members/{uid}`, i limiti (`withinTrainerLimit`/`withinClientLimit`) compaiono **solo** su
  `create`. Aggiungerli per errore anche a `update` bloccherebbe operazioni legittime (es.
  correggere il nome di un membro) per organizzazioni che si trovano, per qualunque motivo
  (downgrade di piano, dati storici), sopra il limite attuale.
- **Fidarsi ciecamente della documentazione del progetto senza incrociarla col codice.** Il
  caso delle note analizzato in questa lezione — `CLAUDE.md`, all'epoca, descriveva un
  comportamento ("il client può commentare") che tre file di codice indipendenti (regola,
  Cloud Function, UI) contraddicevano concordemente — è la dimostrazione più diretta possibile
  di questo errore, anche se quella riga specifica è stata corretta da allora: il rischio di
  fidarsi ciecamente di un documento resta lo stesso, con qualunque riga oggi accurata.
- **Pensare che `firestore.rules` sia l'unica barriera per OGNI scrittura dell'app.** Come
  visto con `aggiungiNota.js`, le scritture che passano da una Cloud Function (Admin SDK)
  bypassano interamente le regole: per quei percorsi, il controllo di sicurezza applicativo
  (ruolo, ownership, validazione) va verificato **nel codice della Cloud Function**, non nelle
  regole.

## Best Practice

- **Non fidarti mai della UI come misura di sicurezza.** Nascondere un pulsante non impedisce
  una richiesta diretta all'SDK: solo le regole (per gli accessi diretti al client SDK) o il
  codice server-side (per i percorsi mediati da Cloud Functions) lo fanno davvero.
- **Ogni funzione di lettura di un documento "di supporto" (come `userProfile()` o
  `memberRole()`) va scritta null-safe fin dall'inizio**, anche se nel 99% dei casi il
  documento esisterà — il caso limite (documento non ancora creato, cancellato, o mai esistito)
  prima o poi si presenta, e il costo di gestirlo bene è un ternario in più.
- **I vincoli quantitativi (limiti di piano, incrementi di contatori) vanno duplicati sia in
  UI/config (per un buon feedback immediato all'utente) sia nelle regole (per l'enforcement
  reale)** — sapendo che, come per `gamification.js` nella Lezione 14, sono copie mantenute a
  mano e vanno tenute allineate con disciplina, idealmente con un test o uno script di verifica
  automatica.
- **Quando una scrittura passa da una Cloud Function, non lasciare che la regola equivalente
  diventi "decorativa" senza saperlo.** Va comunque scritta con lo stesso rigore (perché resta
  la barriera per eventuali accessi diretti al client SDK, presenti o futuri), ma il controllo
  di sicurezza *effettivo* per quel percorso applicativo specifico va verificato — e
  mantenuto — nel codice della funzione stessa.
- **Testa le regole con l'emulator, non solo a occhio.** `CLAUDE.md` menziona `test:rules con
  Firestore emulator` tra gli strumenti del progetto (vedi `00-indice.md`) — è l'unico modo
  affidabile di verificare che una regola faccia davvero quello che il commento sopra di essa
  dichiara, invece di fidarsi della lettura umana (che, come si è visto, può divergere dal
  comportamento reale se non verificata).

## Quiz

1. Perché le Firestore Security Rules sono considerate l'unica vera barriera di sicurezza dei dati, a differenza della validazione in `utils/validation.js`?
   - A) Perché sono scritte in un linguaggio diverso da JavaScript
   - B) Perché la validazione client-side gira nel browser dell'utente e può essere bypassata chiamando l'SDK Firestore direttamente; le regole sono valutate lato server e non aggirabili
   - C) Perché le regole sono più veloci da eseguire
   - D) Non c'è differenza sostanziale, sono due implementazioni equivalenti

2. Cosa restituisce `get(path)` in una Firestore Security Rule se il documento a quel path non esiste?
   - A) Lancia un'eccezione che blocca la valutazione
   - B) Restituisce `null`
   - C) Restituisce un documento vuoto con `.data == {}`
   - D) Restituisce `undefined`

3. Perché `userProfile()` (righe 11-14 di `firestore.rules`) usa `p == null ? {} : p.data` invece di restituire direttamente `p.data`?
   - A) Per motivi di performance
   - B) Perché se il documento non esiste, `p` è `null`, e accedere a `.data` su `null` farebbe fallire l'intera regola con un errore invece di restituire semplicemente un valore che fallisce i controlli successivi in modo pulito
   - C) Perché Firestore richiede sempre un valore di default per le funzioni
   - D) È ridondante, si potrebbe rimuovere senza conseguenze

4. In quale operazione (`create`/`update`/`delete`) vengono applicati i limiti di piano `withinTrainerLimit`/`withinClientLimit`?
   - A) Solo su `create`
   - B) Su tutte e tre le operazioni
   - C) Solo su `update`
   - D) Solo su `delete`

5. Perché esiste il bypass `!('memberCount' in org) || ...` dentro `withinTrainerLimit`?
   - A) Per motivi di performance della query
   - B) Per retrocompatibilità: le organizzazioni create prima dell'introduzione del contatore `memberCount` non avrebbero altrimenti quel campo, e il confronto numerico fallirebbe sempre bloccandole permanentemente
   - C) Perché il super_admin non ha bisogno di limiti
   - D) È un bug non ancora corretto

6. Quale costrutto NON è supportato dentro il corpo di una funzione delle Firestore Security Rules?
   - A) `let` per dichiarare variabili locali
   - B) L'operatore ternario `condizione ? a : b`
   - C) `if (condizione) { return a } else { return b }`
   - D) Un singolo `return` finale con un'espressione booleana

7. Cosa impedisce concretamente `isOrgAdminForMember` quando limita `request.resource.data.role in ['org_admin', 'trainer', 'staff_readonly']` (escludendo `'super_admin'` dalla lista)?
   - A) Che un org_admin possa cambiare qualsiasi campo di un membro
   - B) Che un org_admin possa promuovere sé stesso o un membro a super_admin tramite questo meccanismo (escalation di privilegi)
   - C) Che un trainer possa leggere i dati di altri trainer
   - D) Che un client possa diventare org_admin

8. Nel caso delle note (`/clients/{clientId}/notes/{noteId}`), cosa rivelava il confronto tra `firestore.rules` (righe 153-165), `functions/src/callable/aggiungiNota.js` (righe 21-24) e `ClientDashboardPage.jsx` (riga 311) — con la versione di `CLAUDE.md` di quando questa lezione è stata scritta?
   - A) Che il client poteva creare commenti, come descritto allora in `CLAUDE.md`
   - B) Che regola, Cloud Function e UI concordavano tutte su un client in sola lettura, mentre una riga della sezione "Modelli dati" di `CLAUDE.md` descriveva un comportamento diverso e non aggiornato (riga poi corretta)
   - C) Che esisteva un bug nella Cloud Function da correggere per allinearla a `CLAUDE.md`
   - D) Che le note erano scritte direttamente dal client SDK, bypassando le Cloud Functions

9. Perché `firestore.rules` non è più l'UNICA barriera di sicurezza per operazioni come la creazione di una nota, che passano da `addNoteUseCase` → Cloud Function?
   - A) Perché le Cloud Functions non hanno accesso a Firestore
   - B) Perché l'Admin SDK usato dalle Cloud Functions bypassa interamente le Security Rules; il controllo di sicurezza per quel percorso applicativo vive nel codice della Cloud Function stessa
   - C) Perché le regole si applicano solo ai documenti letti, non a quelli scritti
   - D) Non è vero, le regole si applicano identicamente sia al client SDK sia all'Admin SDK

10. Perché `/workoutPlans/{planId}` usa `isClientOfOrg(orgId)` per la lettura invece di un controllo più specifico come `resource.data.clientId == userProfile().clientId`?
    - A) Per un refuso mai corretto
    - B) Perché quel confronto con `resource.data` non è valutabile da Firestore al momento di pianificare una query su una collection, quindi si usa un controllo più permissivo a livello di regola e si delega il filtro preciso alla query applicativa
    - C) Perché i workout plan non contengono mai un campo `clientId`
    - D) Perché le regole non supportano l'accesso a `resource.data` in nessun caso

## Risposte e spiegazioni

Prova a rispondere da solo prima di leggere oltre.

1. **B.** È il concetto del riquadro "Approfondimento" di questa lezione: qualunque validazione
   che gira nel browser dell'utente è per definizione sotto il suo controllo e bypassabile
   parlando direttamente con l'SDK. Le regole sono valutate lato server Google, non
   aggirabili da nessun client. A, C, D non colgono la differenza sostanziale (enforcement vs
   UX).
2. **B.** Confermato tramite verifica della documentazione ufficiale Firebase: `get()` su un
   path inesistente restituisce `null`, non lancia un'eccezione — è proprio questo
   comportamento a rendere necessario e sensato il pattern `p == null ? {} : p.data`. A, C, D
   descrivono comportamenti diversi da quello reale.
3. **B.** Vedi la spiegazione dettagliata nella sezione "Le funzioni helper". A è una
   motivazione non pertinente (il costo è identico), C è inventata (nessun tale requisito
   generale esiste nel linguaggio delle regole), D è falso — rimuoverlo causerebbe un errore di
   valutazione ogni volta che l'utente autenticato non ha ancora un documento `/users/{uid}`.
4. **A.** Verificato su `/members/{uid}` (riga 137, solo `create`) e `/clients/{clientId}`
   (riga 147, solo `create`) — `update` e `delete` non richiamano mai
   `withinTrainerLimit`/`withinClientLimit`. B, C, D non corrispondono al codice.
5. **B.** È spiegato letteralmente nel commento del file (righe 46-48) e coincide con quanto
   descritto in `CLAUDE.md`. A e C sono motivazioni plausibili ma non supportate dal commento
   nel codice; D è smentito dal fatto che il comportamento è commentato esplicitamente come
   intenzionale, non lasciato lì per svista.
6. **C.** Le funzioni delle Security Rules supportano solo una sequenza di `let` seguita da un
   singolo `return` con un'espressione — niente blocchi `if/else` con `return` multipli. Ogni
   `if/else` va tradotto in un'espressione ternaria (B è invece pienamente supportato, come si
   vede in `withinTrainerLimit` e `memberRole`). A è supportato (è come si accumulano i
   risultati intermedi, es. `let admin = userProfile()` in `isOrgAdminForMember`). D è
   corretto ma è la forma valida, non quella vietata — la domanda chiede cosa NON è
   supportato.
7. **B.** È l'analisi esplicita della sezione sulle helper functions: escludendo
   `'super_admin'` dalla lista di ruoli assegnabili tramite `isOrgAdminForMember`, si impedisce
   che un org_admin possa auto-promuoversi (o promuovere chiunque altro) a super_admin
   attraverso questo canale, indipendentemente da quanto ampi siano altrimenti i suoi permessi.
   A, C, D descrivono limitazioni non pertinenti a questa specifica regola.
8. **B.** È la discrepanza analizzata in dettaglio in questa lezione, con citazioni precise dei
   tre file — verificata con la versione di `CLAUDE.md` dell'epoca. Quella riga è stata
   corretta subito dopo (vedi la Challenge di questa lezione): oggi `CLAUDE.md` dice la stessa
   cosa di regola/Cloud Function/UI, ma il punto pedagogico della domanda resta la scoperta
   della discrepanza, non il suo stato attuale. A ripete l'affermazione (allora sbagliata) di
   `CLAUDE.md`; C inverte la direzione dell'errore (era `CLAUDE.md` a essere disallineato, non
   la Cloud Function); D è falso, la Cloud Function stessa (Admin SDK) è proprio il canale che
   *scrive* le note.
9. **B.** L'Admin SDK, usato dentro le Cloud Functions, ha per definizione pieno accesso a
   Firestore senza passare dalla valutazione delle Security Rules — è il meccanismo di fiducia
   riservato al codice server-side. A è falso (le Cloud Functions leggono/scrivono Firestore
   costantemente, è il loro scopo principale). C è una descrizione errata delle regole (si
   applicano sia in lettura che in scrittura). D è l'esatto opposto del comportamento reale.
10. **B.** È spiegato nel checklist di `CLAUDE.md` e ripreso nell'analisi di questa lezione:
    una regola valutata "a query-plan time" (prima di sapere quali documenti la query
    restituirà) non può dipendere dai dati di un documento specifico ancora da leggere. A è
    smentito dal commento esplicito nel checklist del progetto che motiva la scelta; C è falso,
    `workoutPlans/{planId}` ha effettivamente un campo `clientId` (usato dal filtro applicativo
    in `getWorkoutPlanForClient`); D è falso in generale — `resource.data` è ampiamente usato
    altrove nel file (es. nelle regole su `/organizations/{orgId}` per i contatori), solo non
    in un contesto di query su collection.

## Esercizi

1. **Facile.** Apri `firestore.rules` e, per ciascuna delle 9 subcollection/collection
   principali (`users`, `organizations`, `members`, `clients`, `notes` del cliente, `slots`,
   `groups`, `notes` di gruppo, `recurrences`, `notifications`, `workoutPlans`, `audit_logs`),
   compila una tabella con tre colonne: chi può leggere, chi può creare, chi può
   aggiornare/eliminare. Usa solo ciò che è scritto nel file, non la tua memoria di questa
   lezione.
2. **Facile-medio.** Trova, leggendo `firestore.rules`, tutte le regole che usano `hasOnly(...)`
   per restringere quali campi possono essere modificati in una singola scrittura. Per
   ciascuna, spiega a parole cosa impedirebbe di fare un utente che provasse a modificare *un
   campo in più* rispetto a quelli permessi nella stessa richiesta.
3. **Medio.** `functions/src/shared/auth.js` contiene la funzione `requireOrgAccess`/
   `requireOrgMemberOrClient` richiamata dalle Cloud Functions (l'hai vista citata in
   `aggiungiNota.js`). Aprila e confronta la sua logica con `canRead`/`canWrite` di
   `firestore.rules`: fanno esattamente lo stesso controllo, in due linguaggi diversi (JS lato
   Cloud Function, linguaggio regole lato Firestore)? Elenca eventuali differenze che trovi.
4. **Medio-difficile.** Scrivi (su carta o in un file scratch, senza applicarla al progetto) la
   regola Firestore che aggiungeresti se RankEX introducesse la possibilità per il cliente di
   modificare il proprio `peso`/`altezza` direttamente dal proprio dashboard (oggi impossibile —
   verificato in Lezione 16 tramite `MisureSection.jsx`, sempre `readonly` lato client).
   Che campo aggiungeresti alla whitelist della regola `isOwnClient` su `/clients/{clientId}`?
   Quali rischi introdurrebbe permettere al cliente di scrivere direttamente `peso`/`altezza`,
   dato che quei valori alimentano il calcolo del BMI e, potenzialmente, la BIA?
5. **Difficile.** Il limite di 10 accessi (`get`/`exists`) per valutazione di regola: costruisci
   uno scenario realistico, partendo dalle funzioni esistenti in `firestore.rules`
   (`userProfile`, `memberRole`, `isOrgMember`, `withinTrainerLimit`...), in cui una singola
   richiesta a Firestore potrebbe avvicinarsi a quel limite. Conta quante chiamate `get`/
   `exists` verrebbero effettivamente eseguite per valutare, per esempio, l'intera catena di
   `||` della regola `update` su `/organizations/{orgId}` (righe 115-129) nel caso peggiore.

## Challenge

### Retrospettiva: la correzione è stata scritta per davvero

Quando questa lezione è stata scritta la prima volta, la Challenge chiedeva di *proporre* la
correzione a `CLAUDE.md` in un file scratch, esplicitamente **senza** toccare il file reale del
progetto. Quella cautela aveva senso in quel momento — ma la discrepanza era reale, e nel giro
di manutenzione successivo (`4251d23`) è stata corretta per davvero. La riga oggi in `CLAUDE.md`,
sezione "Modelli dati" → "Nota", dice:

> **Regola:** il client è sempre in sola lettura sulle note — non può creare né commenti né
> note proprie (`firestore.rules` limita `create`/`delete` a `canWrite(orgId)`, la Cloud
> Function `aggiungiNota` rifiuta esplicitamente `role === 'client'`, e `NotesSection` è
> montata `readonly` in `ClientDashboardPage.jsx`).

Nota come la correzione **citi esplicitamente le tre fonti** (rules, Cloud Function, UI) — lo
stesso tipo di prova a supporto che l'esercizio originale ti chiedeva di raccogliere. Apri
`CLAUDE.md` e verifica tu stesso che questa riga esista davvero, con questo testo, prima di
proseguire.

### Il compito per te: la stessa discrepanza non può ripresentarsi da sola?

Trovare questa discrepanza ha richiesto una persona che leggesse `firestore.rules`,
`aggiungiNota.js` e `ClientDashboardPage.jsx` e li confrontasse a mente con `CLAUDE.md`. Non
c'è niente, oggi, che lo faccia automaticamente — se domani qualcuno modificasse la regola
`create` delle note (es. per introdurre davvero i commenti-cliente, magari una funzionalità
futura legittima), `CLAUDE.md` potrebbe restare disallineato per mesi prima che qualcuno se ne
accorga di nuovo, esattamente come questa volta.

1. Cerca nel progetto una test suite delle Firestore Rules (`vitest.rules.config.js`,
   `npm run test:rules`, `@firebase/rules-unit-testing` — vedi Lezione 22 per il dettaglio di
   come funziona). Esiste già un test che verifichi, con `assertFails`, che un utente con
   `role: 'client'` non possa scrivere in `organizations/{orgId}/clients/{clientId}/notes`?
   Cercalo prima di assumere che non ci sia.
2. Se non esiste, scrivilo (puoi seguire lo stile dei test già presenti nella stessa suite, se
   ce ne sono di simili per altre subcollection). Il test non "aggiorna" `CLAUDE.md`
   automaticamente, ma trasforma un fatto oggi verificabile solo leggendo tre file a mano in
   un'asserzione automatica che fallisce rumorosamente (in CI, se `test:rules` fosse integrato
   in `ci.yml` — verifica anche questo: lo è?) se qualcuno cambia la regola senza volerlo.
3. Rifletti per iscritto: un test sulle *rules* può comunque garantire che `CLAUDE.md` resti
   accurato? Cosa protegge esattamente, e cosa no, rispetto al problema originale di questa
   lezione (un documento che descrive un comportamento diverso da quello reale)?
