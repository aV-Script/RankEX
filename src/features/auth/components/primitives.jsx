export function FormField({ label, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5"
      >
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  )
}

export function ErrorBox({ children }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-xl px-4 py-2.5 bg-red-500/10 border border-red-400/20"
    >
      <p className="text-red-400 font-body text-[13px] m-0">{children}</p>
    </div>
  )
}

export function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`rounded-xl py-3.5 text-white font-display text-[13px] font-bold tracking-wider border-0 mt-1 transition-opacity
        ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
    >
      {loading ? 'ATTENDI...' : children}
    </button>
  )
}