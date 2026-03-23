import { useAuth }  from '../auth/useAuth'
import { logout }   from '../../firebase/services/auth'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="px-6 py-8 max-w-lg">
      <p className="hidden lg:block font-display text-[10px] text-white/30 tracking-[3px] mb-6">
        PROFILO TRAINER
      </p>

      <div className="rounded-2xl p-5 mb-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f622, #8b5cf622)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <span className="font-display font-black text-[22px]"
              style={{ background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {user?.email?.[0]?.toUpperCase() ?? 'T'}
            </span>
          </div>
          <div>
            <div className="font-display font-black text-[16px] text-white">Trainer</div>
            <div className="font-body text-[13px] text-white/40 mt-0.5">{user?.email ?? '—'}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="font-display text-[10px] text-white/30 tracking-[2px] mb-1">ACCOUNT</div>
          <div className="font-body text-[13px] text-white/60">{user?.email}</div>
        </div>
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer transition-all text-left border-none bg-transparent"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="font-body text-[13px] text-red-400">Logout</span>
        </button>
      </div>
    </div>
  )
}