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
      className="rounded-[3px] px-4 py-2.5 bg-red-500/10 border border-red-400/20"
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
      className={`rounded-[3px] py-3.5 text-white font-display text-[13px] font-bold tracking-wider border-0 mt-1 transition-opacity
        ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
      style={{ background: 'rgba(15,214,90,0.07)', border: '1px solid rgba(15,214,90,0.35)', color: '#0fd65a' }}
    >
      {loading ? 'ATTENDI...' : children}
    </button>
  )
}