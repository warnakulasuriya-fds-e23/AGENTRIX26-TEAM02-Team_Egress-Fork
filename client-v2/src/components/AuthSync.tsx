import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { syncUser } from '@/lib/api'

/**
 * Upserts the signed-in Clerk user into user-service on sign-in, which is
 * also where role gets set from the ADMIN_EMAILS allowlist. Nothing in the UI
 * depends on this having run except the admin dashboard's role check.
 */
export function AuthSync() {
  const { isSignedIn, getToken } = useAuth()
  const synced = useRef(false)

  useEffect(() => {
    if (!isSignedIn || synced.current) return
    synced.current = true
    getToken()
      .then((token) => {
        if (!token) throw new Error('No session token')
        return syncUser(token)
      })
      .catch((err) => {
        synced.current = false
        console.error('User sync failed', err)
      })
  }, [isSignedIn, getToken])

  return null
}
