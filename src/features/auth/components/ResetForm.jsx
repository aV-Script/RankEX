import { FormField, ErrorBox, SubmitButton } from './primitives'

export function ResetForm({ form }) {
  const { email, error, loading, setEmail, handleReset, goTo } = form

  return (
    <>
      <div className="mb-8">
        <h2 className="font-display font-black text-[26px] text-white m-0">
          Recupera password
        </h2>
        <p className="font-body text-white/40 text-[14px] mt-1.5 m-0">
          Inserisci la tua email e ti invieremo un link per reimpostare la password.
        </p>
      </div>

      <form onSubmit={handleReset} className="flex flex-col gap-3.5" noValidate>
        <FormField label="Email" htmlFor="reset-email">
          <input
            id="reset-email"
            type="email"
            className="input-base w-full"
            placeholder="trainer@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
        </FormField>

        {error && <ErrorBox>{error}</ErrorBox>}

        <SubmitButton loading={loading}>INVIA LINK</SubmitButton>
      </form>

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => goTo('login')}
          className="bg-transparent border-none font-body text-[13px] text-white/30 cursor-pointer hover:text-white/50 transition-colors p-0"
        >
          Torna al login
        </button>
      </div>
    </>
  )
}