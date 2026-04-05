import { useState, useEffect } from 'react'
import { onAuthChange }        from '../../firebase/services/auth'
import { getUserProfile }      from '../../firebase/services/users'
import { getOrganization }     from '../../firebase/services/org'
import { getTerminology }      from '../../config/modules.config'

export function useAuth() {
  const [user,        setUser]        = useState(undefined)
  const [profile,     setProfile]     = useState(undefined) // undefined=loading, null=non trovato
  const [org,         setOrg]         = useState(undefined)
  const [terminology, setTerminology] = useState(undefined)

  const refreshProfile = async (uid) => {
    const p = await getUserProfile(uid)
    setProfile(p)

    if (p?.orgId) {
      const o = await getOrganization(p.orgId)
      setOrg(o)
      setTerminology(getTerminology(o?.moduleType, p.terminologyVariant))
    } else {
      setOrg(null)
      setTerminology(getTerminology('personal_training'))
    }
  }

  useEffect(() => {
    return onAuthChange(async (u) => {
      if (!u) {
        setUser(null)
        setProfile(null)
        setOrg(null)
        setTerminology(null)
        return
      }
      setUser(u)
      setProfile(undefined)
      setOrg(undefined)
      await refreshProfile(u.uid)
    })
  }, [])

  return { user, profile, org, terminology, refreshProfile }
}
