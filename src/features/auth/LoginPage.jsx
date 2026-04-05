import { useLoginForm }   from './useLoginForm'
import { BrandingPanel }  from './components/BrandingPanel'
import { LoginForm }      from './components/LoginForm'
import { ResetForm }      from './components/ResetForm'
import { ResetSentView }  from './components/ResetSentView'

export default function LoginPage() {
  const form = useLoginForm()

  return (
    <div className="min-h-screen flex" style={{ background: '#080c12' }}>
      <BrandingPanel />
      <div className="hidden lg:block w-px"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(15,214,90,0.12) 30%, rgba(15,214,90,0.12) 70%, transparent)' }}
      />
      <div
        className="flex-1 lg:max-w-[480px] flex flex-col items-center justify-center px-8 py-12"
        style={{ background: '#080c12' }}
      >
        <MobileLogo />
        <div className="w-full max-w-[360px]">
          {form.view === 'login'      && <LoginForm     form={form} />}
          {form.view === 'reset'      && <ResetForm     form={form} />}
          {form.view === 'reset_sent' && <ResetSentView form={form} />}
        </div>
      </div>
    </div>
  )
}

function MobileLogo() {
  return (
    <div className="lg:hidden text-center mb-10">
      <div className="rx-glow-text font-display font-black text-[28px]">
        Rank EX
      </div>
      <div className="text-white/30 font-body text-[12px] mt-1 tracking-[3px]">
        PERFORMANCE PLATFORM
      </div>
    </div>
  )
}