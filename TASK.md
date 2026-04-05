
P0 — Bloccante (rotto)
#	Area	Issue	File coinvolti
1	Client	Login client fallisce con Missing or insufficient permissions	firestore.rules
2	Super Admin	Select form CreateOrgForm: testo bianco illeggibile	CreateOrgForm.jsx, CSS globale
P1 — Alta (funzionalità core assente)
#	Area	Issue	File coinvolti
3	Soccer	NewClientView: mostra Categoria invece di Ruolo; non imposta categoria:'soccer' né blocca profileType	NewClientView.jsx
4	Soccer	ClientsPage: colonna e filtro per Ruolo invece di Categoria	ClientsPage.jsx, FiltersSidebar.jsx, ClientCard.jsx
5	Soccer	TestGuidePage: mostra tutti i test PT invece dei 5 soccer	TestGuidePage.jsx
6	Tutti	RecurrencesPage: ricorrenze cancelled/ended visibili — filtrarle	useRecurrences.js, RecurrencesPage.jsx
7	Org Admin	Gestione team mancante per org_admin: lista membri, aggiunta, rimozione, cambio ruolo	MembersPage.jsx (nuova pagina o estensione)
P2 — Media (UX degradata)
#	Area	Issue	File coinvolti
8	Calendario	Bottoni "Nuova Sessione" e "Nuova Ricorrenza" visivamente diversi	TrainerCalendar.jsx
9	Super Admin	OrgDetailView: manca rimozione/modifica membro	OrgDetailView.jsx, org.js
10	Super Admin	CreateOrgForm: campo ownerId non compilato	CreateOrgForm.jsx
11	Tutti	Profilo: manca modifica email e password	ProfilePage.jsx, AdminProfilePage.jsx
12	Tutti	Paginazione mancante: OrgsPage, OrgDetailView, RecurrencesPage	hook usePagination.js già presente
13	Auth	BrandingPanel login da rivedere	BrandingPanel.jsx
P3 — Bassa / richiede decisione di prodotto
#	Area	Issue	Note
14	Piani	free/pro/enterprise: nessuna logica — definire tier, limiti, impatti prima di codificare	Decisione di prodotto
15	Super Admin	AdminDashboard troppo minimale	Nice-to-have
16	Ricorrenze	RecurrenceDetailView presentazione migliorabile	Refactor UI
Proposta di ordine di lavoro: P0 (1→2) → P1 partendo da 3+4+5 insieme (sono tutti legati al modulo soccer e si fanno in un'unica sessione) → 6+7 → poi P2.