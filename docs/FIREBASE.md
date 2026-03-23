# FitQuest — Firebase

## Servizi utilizzati

- **Authentication** — email/password
- **Firestore** — database NoSQL realtime
- **Security Rules** — `firestore.rules`

## Modelli dati

### `clients/{clientId}`
```js
{
  name, eta, sesso, peso, altezza,
  trainerId,        // uid del trainer
  email,
  clientAuthUid,    // uid Firebase Auth del cliente
  categoria,        // 'health' | 'active' | 'athlete'
  level, xp, xpNext,
  rank, rankColor,
  media,            // media percentili (0-100)
  stats: {},        // { stat_key: percentile }
  campionamenti: [], // [{ date, stats, tests, media }] max 50
  log: [],           // [{ date, action, xp }] max 20
  sessionsPerWeek,
}
```

### `slots/{slotId}`
```js
{
  trainerId, date, startTime, endTime,
  clientIds: [],    // partecipanti pianificati
  groupIds: [],
  status: 'planned' | 'completed' | 'skipped',
  attendees: [],    // presenti — ricevono XP
  absentees: [],    // assenti
  recurrenceId: null,
  createdAt,
}
```
> `completedClientIds` non esiste più — usa `attendees`.

### `groups/{groupId}`
```js
{ name, trainerId, clientIds: [] }
```

### `notifications/{notifId}`
```js
{ clientId, message, date, type, read, readAt, createdAt }
```

### `users/{uid}`
```js
{ role: 'trainer' | 'client', clientId, trainerId, mustChangePassword }
```

### `recurrences/{recurrenceId}`
Generato da `handleAddRecurrence` in `useCalendar`.

## Security Rules — logica

Ogni utente può accedere solo ai propri dati:

| Risorsa | Trainer | Cliente |
|---------|---------|---------|
| `clients/{id}` | CRUD se `trainerId == uid` | Read se `clientAuthUid == uid` |
| `slots/{id}` | CRUD se `trainerId == uid` | Read se `uid` in `clientIds` |
| `groups/{id}` | CRUD se `trainerId == uid` | — |
| `notifications/{id}` | Create per propri clienti | Read/Update/Delete se è il destinatario |
| `users/{uid}` | Read/Write proprio doc + Create doc cliente | Read/Write proprio doc |

La funzione helper `myClientId()` fa un `get()` cross-collection su `users/{uid}` per risolvere l'uid Auth nel `clientId` Firestore. Questo permette al cliente di leggere i propri slot e notifiche.

## Indici

Gli indici Firestore sono definiti in `firestore.indexes.json`. Query composte principali:
- `slots` — `trainerId` + `date` (range)
- `notifications` — `clientId` + `read` + `createdAt`

## Aggiungere un servizio

1. Crea `src/firebase/services/nomeServizio.js`
2. Esporta funzioni pure che accettano parametri e restituiscono dati
3. Non includere logica di business nei servizi
4. Non usare `onSnapshot` direttamente — usa hook con cleanup
