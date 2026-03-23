import { FormField, ErrorBox, SubmitButton } from './primitives'

export function LoginForm({ form }) {
  const { email, password, error, loading, setEmail, setPassword, handleLogin, goTo } = form

  return (
    <>
      <div className="mb-8">
        <h2 className="font-display font-black text-[26px] text-white m-0">Bentornato</h2>
        <p className="font-body text-white/40 text-[14px] mt-1.5 m-0">
          Accedi alla tua dashboard
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3.5" noValidate>
        <FormField label="Email" htmlFor="login-email">
          <input
            id="login-email"
            type="email"
            className="input-base w-full"
            placeholder="trainer@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
        </FormField>

        <FormField label="Password" htmlFor="login-password">
          <input
            id="login-password"
            type="password"
            className="input-base w-full"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </FormField>

        {error && <ErrorBox>{error}</ErrorBox>}

        <SubmitButton loading={loading}>ACCEDI</SubmitButton>
      </form>

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => goTo('reset')}
          className="bg-transparent border-none font-body text-[13px] text-white/30 cursor-pointer hover:text-white/50 transition-colors p-0"
        >
          Password dimenticata?
        </button>
      </div>
    </>
  )
}