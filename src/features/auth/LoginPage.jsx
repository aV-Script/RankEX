import { useLoginForm }   from './useLoginForm'
import { BrandingPanel }  from './components/BrandingPanel'
import { LoginForm }      from './components/LoginForm'
import { ResetForm }      from './components/ResetForm'
import { ResetSentView }  from './components/ResetSentView'

export default function LoginPage() {
  const form = useLoginForm()

  return (
    <div className="min-h-screen flex" style={{ background: '#070b14' }}>
      <BrandingPanel />
      <div className="hidden lg:block w-px"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)' }}
      />
      <div
        className="flex-1 lg:max-w-[480px] flex flex-col items-center justify-center px-8 py-12"
        style={{ background: 'radial-gradient(ellipse at 80% 10%, #0f1f3d 0%, #070b14 60%)' }}
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
      <div className="font-display font-black text-[28px] bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
        FITQUEST
      </div>
      <div className="text-white/30 font-body text-[12px] mt-1 tracking-[3px]">
        PERSONAL TRAINER PORTAL
      </div>
    </div>
  )
}