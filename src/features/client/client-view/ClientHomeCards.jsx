// Card della Home cliente: STRISCIA, PROSSIMA sessione, ULTIME NOTIFICHE.
// Stati vuoto / caricamento / errore distinti; testi con la terminologia del modulo.

import { bySessionGender } from '../../../config/modules.config'
import { formatUpcomingDate } from '../../../utils/calendarUtils'
import { formatNotificationDate } from '../../../utils/notifications'
import { getStreakSummary, pickLatestNotifications } from '../../../utils/clientHome'

const TOUCH_TARGET_MIN = 44
const CARD_MIN_HEIGHT  = 84
const NOTIF_SKELETON_ROWS = 2
const STATUS_LOADING = 'loading'
const STATUS_ERROR   = 'error'

const CARD_CLASS  = 'rx-card rounded-[4px] p-3 min-w-0 text-left'
const TITLE_CLASS = 'font-display text-[10px] font-semibold tracking-[2px] uppercase mb-1.5'
const MUTED_TEXT  = 'rgba(255,255,255,0.45)'

function SkeletonBar({ width, height = 12 }) {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-[2px]"
      style={{ width, height, background: 'rgba(255,255,255,0.08)' }}
    />
  )
}

function RetryRow({ label, onRetry }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-body text-[12px]" style={{ color: 'rgba(248,113,113,0.85)' }}>{label}</span>
      <button
        type="button"
        onClick={onRetry}
        className="font-display uppercase cursor-pointer"
        style={{
          minHeight: TOUCH_TARGET_MIN, padding: '0 4px', fontSize: 11, letterSpacing: '1px',
          background: 'transparent', border: 'none', color: 'var(--rx-accent)',
        }}
      >
        Riprova
      </button>
    </div>
  )
}

// ── STRISCIA ─────────────────────────────────────────────────────────────────

export function StreakCard({ client, terminology, color }) {
  const { streak, multiplierText } = getStreakSummary(client)
  return (
    <section className={CARD_CLASS} style={{ minHeight: CARD_MIN_HEIGHT }} aria-label="Striscia">
      <div className={TITLE_CLASS} style={{ color: MUTED_TEXT }}>Striscia</div>
      <div className="font-display font-black text-white text-[22px] leading-none">{streak}</div>
      <div className="font-body text-[11px] mt-1" style={{ color: MUTED_TEXT }}>
        {terminology.sessions.toLowerCase()} di fila · <span style={{ color }}>{multiplierText}</span>
      </div>
    </section>
  )
}

// ── PROSSIMA ─────────────────────────────────────────────────────────────────

export function NextSessionCard({ sessions, status, onRetry, onOpenCalendar, terminology }) {
  const title = bySessionGender(terminology, 'Prossimo', 'Prossima')
  const next  = sessions[0]

  if (status === STATUS_ERROR) {
    return (
      <section className={CARD_CLASS} style={{ minHeight: CARD_MIN_HEIGHT }}>
        <div className={TITLE_CLASS} style={{ color: MUTED_TEXT }}>{title}</div>
        <RetryRow label="Impossibile caricare" onRetry={onRetry} />
      </section>
    )
  }

  if (status === STATUS_LOADING) {
    return (
      <section className={CARD_CLASS} style={{ minHeight: CARD_MIN_HEIGHT }} aria-busy="true">
        <div className={TITLE_CLASS} style={{ color: MUTED_TEXT }}>{title}</div>
        <div className="flex flex-col gap-2">
          <SkeletonBar width="80%" height={14} />
          <SkeletonBar width="55%" />
        </div>
      </section>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpenCalendar}
      className={`${CARD_CLASS} cursor-pointer w-full`}
      style={{ minHeight: CARD_MIN_HEIGHT }}
    >
      <div className={TITLE_CLASS} style={{ color: MUTED_TEXT }}>{title}</div>
      {next ? (
        <div className="font-display text-[13px] font-semibold text-white/85 break-words leading-snug">
          {formatUpcomingDate(next.date)}
          {next.startTime && ` · ${next.startTime}${next.endTime ? ` – ${next.endTime}` : ''}`}
        </div>
      ) : (
        <div className="font-body text-[12px] break-words" style={{ color: MUTED_TEXT }}>
          {bySessionGender(terminology, 'Nessun', 'Nessuna')} {terminology.session.toLowerCase()} in programma
        </div>
      )}
    </button>
  )
}

// ── ULTIME NOTIFICHE ─────────────────────────────────────────────────────────

export function LatestNotificationsCard({ notifications, status, onRetry, onOpenAll, color }) {
  const latest = pickLatestNotifications(notifications)

  return (
    <section className={`${CARD_CLASS} w-full`} aria-label="Ultime notifiche">
      <div className="flex items-center justify-between gap-2">
        <div className={TITLE_CLASS} style={{ color: MUTED_TEXT, marginBottom: 0 }}>Ultime notifiche</div>
        {status !== STATUS_LOADING && status !== STATUS_ERROR && latest.length > 0 && (
          <button
            type="button"
            onClick={onOpenAll}
            aria-label="Vedi tutte le notifiche"
            className="font-display uppercase cursor-pointer shrink-0"
            style={{
              minHeight: TOUCH_TARGET_MIN, padding: '0 6px', fontSize: 11, letterSpacing: '1px',
              background: 'transparent', border: 'none', color: 'var(--rx-accent)',
            }}
          >
            Vedi tutte
          </button>
        )}
      </div>

      {status === STATUS_ERROR && <RetryRow label="Impossibile caricare" onRetry={onRetry} />}

      {status === STATUS_LOADING && (
        <div className="flex flex-col gap-3 py-1" aria-busy="true">
          {Array.from({ length: NOTIF_SKELETON_ROWS }, (_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <SkeletonBar width="90%" />
              <SkeletonBar width="30%" height={9} />
            </div>
          ))}
        </div>
      )}

      {status !== STATUS_LOADING && status !== STATUS_ERROR && latest.length === 0 && (
        <p className="font-body text-[12px] m-0 py-2" style={{ color: MUTED_TEXT }}>Nessuna notifica</p>
      )}

      {latest.length > 0 && status !== STATUS_LOADING && status !== STATUS_ERROR && (
        <ul className="flex flex-col gap-2.5 list-none m-0 p-0">
          {latest.map(notification => (
            <li key={notification.id} className="flex items-start gap-2 min-w-0">
              {notification.read ? (
                <span className="shrink-0" style={{ width: 8, height: 8, marginTop: 5 }} aria-hidden="true" />
              ) : (
                <span
                  className="shrink-0 rounded-full"
                  style={{ width: 8, height: 8, marginTop: 5, background: color }}
                  role="img"
                  aria-label="Non letta"
                />
              )}
              <div className="min-w-0 flex-1">
                <div
                  className="font-body text-[13px] leading-snug break-words"
                  style={{ color: notification.read ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.88)' }}
                >
                  {notification.message}
                </div>
                <div className="font-display uppercase mt-0.5" style={{ fontSize: 9, letterSpacing: '1px', color: MUTED_TEXT }}>
                  {formatNotificationDate(notification.date)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
