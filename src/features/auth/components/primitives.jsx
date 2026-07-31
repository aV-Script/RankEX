export function ErrorBox({ children }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-[3px] px-4 py-2.5 bg-red-500/10 border border-red-400/20"
    >
      <p className="text-red-400 font-body text-[13px] m-0">{children}</p>
    </div>
  )
}
