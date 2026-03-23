import { useState, useEffect } from 'react'
import { onAuthChange }   from '../../firebase/services/auth'
import { getUserProfile } from '../../firebase/services/users'

export function useAuth() {
  const [user,    setUser]    = useState(undefined)
  const [profile, setProfile] = useState(undefined) // undefined=loading, null=non trovato

  const refreshProfile = async (uid) => {
    const p = await getUserProfile(uid)
    setProfile(p)
  }

  useEffect(() => {
    return onAuthChange(async (u) => {
      if (!u) { setUser(null); setProfile(null); return }
      setUser(u)
      setProfile(undefined) // reset a loading prima del fetch
      await refreshProfile(u.uid)
    })
  }, [])

  return { user, profile, refreshProfile }
}
