export function ClientShell({ children }) {
  return (
    <div className="min-h-screen text-white">
      <a href="#main-content" className="skip-to-content">Vai al contenuto</a>
      <main id="main-content" aria-label="Contenuto principale">
        {children}
      </main>
    </div>
  )
}
