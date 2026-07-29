import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { trackVisit } from '@/lib/api'

const STORAGE_KEY = 'ct_visitor_id'

function getVisitorId(): string {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

/** Fires one page-visit beacon per mount (see routes/tracking.py). Silent no-op on failure. */
export function VisitorBeacon() {
  const { userId } = useAuth()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackVisit(getVisitorId(), window.location.pathname, userId).catch(() => {
      // Analytics beacon — never surface this to the user.
    })
  }, [userId])

  return null
}
