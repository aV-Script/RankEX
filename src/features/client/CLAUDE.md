# Area Cliente

## Entry point
`ClientView.jsx` → `useClient` (fetch) → `ClientShell` > pagine

## Navigazione
`activePage: 'dashboard' | 'calendar' | 'profile'`
`view: 'dashboard' | 'card'` — player card a schermo intero

## Pagine
- `ClientDashboardPage` — rank, stats, chart, activity log
- `ClientCalendar` — calendario sessioni read-only
- `ClientProfilePage` — info account + link player card

## Campionamento
`ClientDashboard` (vista trainer) ha `view: 'dashboard' | 'campionamento'`
→ `CampionamentoView` inline con `useCampionamento`