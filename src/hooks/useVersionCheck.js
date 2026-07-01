import { useState, useEffect, useRef } from 'react'

const POLL_MS = 5 * 60 * 1000  // ogni 5 minuti

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const current = useRef(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const { v } = await res.json()
        if (current.current === null) {
          current.current = v
        } else if (v !== current.current) {
          setHasUpdate(true)
        }
      } catch {
        // ignora errori di rete
      }
    }

    check()
    const id = setInterval(check, POLL_MS)
    return () => clearInterval(id)
  }, [])

  return hasUpdate
}
