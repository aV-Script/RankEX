# FitQuest — Sistema di Gamification

## Costanti

```js
MONTHLY_XP_TARGET        = 500    // XP obiettivo mensile
BONUS_XP_FULL_MONTH      = 200    // bonus se si completano tutte le sessioni
WEEKS_PER_MONTH          = 4.33
XP_PER_LEVEL_MULTIPLIER  = 1.3    // ogni livello richiede il 30% in più
XP_PER_CAMPIONAMENTO     = 50     // XP per ogni campionamento completato
LOG_MAX_ENTRIES          = 20     // max entry nel log attività
```

## XP per sessione

`calcSessionConfig(sessionsPerWeek)` → `{ sessionsPerWeek, monthlySessions, xpPerSession }`

```
monthlySessions = round(sessionsPerWeek × 4.33)
xpPerSession    = round(500 / monthlySessions)
```

Esempi:
| Sessioni/sett. | Sessioni/mese | XP/sessione |
|:--------------:|:-------------:|:-----------:|
| 1 | 4 | 125 |
| 2 | 9 | 56 |
| 3 | 13 | 38 |
| 5 | 22 | 23 |
| 7 | 30 | 17 |

## Level up

`calcLevelProgression(xp, xpNext, level)` processa tutti i level-up in un loop:

```js
while (xp >= xpNext) {
  xp    -= xpNext
  xpNext = round(xpNext × 1.3)
  level += 1
}
```

Il valore iniziale di `xpNext` è `700` (definito in `NEW_CLIENT_DEFAULTS`).

## Rank

Il rank è calcolato dalla `media` dei percentili delle statistiche.

```js
getRankFromMedia(media) // → { label, color }
```

| Media | Rank | Colore |
|:-----:|:----:|:------:|
| ≥ 95 | EX | #ffd700 |
| ≥ 90 | SS+ | #ff6b6b |
| ≥ 85 | SS | #ff8e53 |
| ≥ 80 | S+ | #ff6fd8 |
| ≥ 75 | S | #c77dff |
| ≥ 70 | A+ | #a78bfa |
| ≥ 65 | A | #60a5fa |
| ≥ 60 | B+ | #38bdf8 |
| ≥ 55 | B | #34d399 |
| ≥ 50 | C+ | #6ee7b7 |
| ≥ 45 | C | #a3e635 |
| ≥ 40 | D+ | #facc15 |
| ≥ 35 | D | #fb923c |
| ≥ 30 | E+ | #f87171 |
| ≥ 25 | E | #f43f5e |
| ≥ 20 | F+ | #9ca3af |
| ≥ 0 | F | #6b7280 |

## Percentili e statistiche

`calcPercentile(stat, value, sex, age)` calcola il percentile del cliente rispetto alla popolazione di riferimento tramite interpolazione lineare sulle tabelle in `utils/tables.js`.

`calcStatMedia(stats)` = media aritmetica arrotondata di tutti i percentili nel profilo.

### Categorie test

Ogni categoria ha 5 test. Il percentile di ogni test diventa la statistica corrispondente nel profilo.

| Categoria | Test |
|-----------|------|
| `health` | sit_and_reach, flamingo_test, ymca_step_test, dinamometro_hand_grip, sit_to_stand |
| `active` | y_balance, dinamometro_hand_grip, ymca_step_test, standing_long_jump, sprint_10m |
| `athlete` | drop_jump_rsi, t_test_agility, yo_yo_ir1, sprint_20m, cmj |

## Funzioni principali

### `buildXPUpdate(client, xpToAdd, note)`
Aggiunge XP al cliente, calcola eventuali level-up, aggiunge entry al log.
```js
const { update } = buildXPUpdate(client, 38, 'Sessione completata')
await updateDoc(clientRef, update)
```

### `buildCampionamentoUpdate(client, newStats, testValues)`
Aggiorna rank, media, campionamenti, log e XP dopo un campionamento.
```js
const { update, campionamento } = buildCampionamentoUpdate(client, stats, testValues)
await updateDoc(clientRef, update)
```

### `buildNewClient(trainerId, formData, defaults)`
Costruisce il documento iniziale di un nuovo cliente con primo campionamento.

## Flusso chiusura sessione

1. Trainer apre `CloseSessionModal` e seleziona i presenti
2. `handleCloseSlot(slotId, attendeeIds, clientsData)` in `useCalendar`:
   - Aggiorna `slot.status = 'completed'`, `attendees`, `absentees`
   - Per ogni presente: chiama `buildXPUpdate` + `updateDoc(clientRef, update)`
3. UI riceve aggiornamenti tramite `onSnapshot`
