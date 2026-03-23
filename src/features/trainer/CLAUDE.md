# Area Trainer

## Entry point
`TrainerView.jsx` → `TrainerProvider` > `TrainerLayout`

## Navigazione
`useTrainerNav` gestisce `page` e `selectedClient`.
Selezionare un cliente mostra `ClientDashboard` al posto della pagina corrente.

## Aggiungere una pagina
1. `trainer.config.js` — aggiungi `{ id: ComponentePage }`
2. `trainer-shell/constants.jsx` — aggiungi voce `NAV_ITEMS`

## ClientsPage
Stato: `view: 'list' | 'new'`
- Lista → `useClientFilters` + `usePagination`
- Nuovo cliente → `NewClientView` (wizard inline)

## GroupsPage
Stato: `view: 'list' | 'detail'`
- Lista → griglia `GroupCard`
- Dettaglio → `GroupDetailView` con sync slot calendario

## TrainerCalendar
Vista default: settimana.
Popup al click slot → `SlotPopup` → azioni (chiudi/salta/elimina).
Chiudi sessione → `CloseSessionModal` → seleziona presenti → XP.