# Calendario

## Modello slot
{ trainerId, date, startTime, endTime, clientIds, groupIds,
  status: 'planned'|'completed'|'skipped', attendees, absentees,
  recurrenceId, createdAt }

⚠️ completedClientIds NON esiste — usa attendees/absentees.

## useCalendar
- Fetch automatico al cambio view/data
- handleCloseSlot(slotId, attendeeIds, clientsData) — XP solo agli attendees
- handleSkipSlot — nessun XP, status: 'skipped'

## Sync gruppi
Quando cliente aggiunto/rimosso da gruppo →
calendarGroupUtils.addClientToGroupSlots / removeClientFromGroupSlots
aggiorna automaticamente gli slot futuri.

## Viste
WeekView — default, colonne orarie, linea ora corrente
MonthView — griglia mese, eventi visibili nelle celle
DayView — colonna singola, dettaglio giornaliero
HOUR_H = 60px per ora in WeekView e DayView