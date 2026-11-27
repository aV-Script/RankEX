import { describe, it, expect, vi, afterEach } from 'vitest'
import { TOAST_DURATION_MS, getToastDurationMs, scheduleToastRemoval } from '../../config/app.config'

describe('durata toast per variante', () => {
  afterEach(() => vi.useRealTimers())

  it('le conferme durano 4 s', () => {
    expect(TOAST_DURATION_MS).toBe(4000)
    expect(getToastDurationMs('success')).toBe(4000)
    expect(getToastDurationMs('info')).toBe(4000)
    expect(getToastDurationMs('warning')).toBe(4000)
  })

  it('le conferme spariscono dopo 4 s, non prima', () => {
    vi.useFakeTimers()
    const remove = vi.fn()
    scheduleToastRemoval('success', remove)
    vi.advanceTimersByTime(3999)
    expect(remove).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it('gli errori non programmano nessuna rimozione e restano finché chiusi', () => {
    vi.useFakeTimers()
    const remove = vi.fn()
    const setTimeoutFn = vi.fn()
    expect(scheduleToastRemoval('error', remove, setTimeoutFn)).toBeNull()
    expect(setTimeoutFn).not.toHaveBeenCalled()
    scheduleToastRemoval('error', remove)
    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(remove).not.toHaveBeenCalled()
  })
})
