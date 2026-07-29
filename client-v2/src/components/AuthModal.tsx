import { SignIn, SignUp } from '@clerk/clerk-react'
import { c } from '@/lib/theme'
import { useApp } from '@/state/store'

/**
 * Log in / sign up via Clerk, including "Continue with Google".
 *
 * Clerk's <SignIn>/<SignUp> render their own fully-styled card (padding,
 * shadow, rounded corners) — we only supply the backdrop, the close button,
 * and the login/signup tab switcher around it. Overriding Clerk's own card
 * padding/shadow via `appearance` broke its internal layout, so we don't.
 */
export function AuthModal() {
  const { authOpen, authMode, setAuthMode, closeAuth, login } = useApp()
  const isLogin = authMode === 'login'

  if (!authOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isLogin ? 'Log in' : 'Create an account'}
      onClick={closeAuth}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(13,13,17,.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '5vh 24px',
        animation: 'csFadeIn .2s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'csRise .3s ease both',
        }}
      >
        <button
          type="button"
          onClick={closeAuth}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: -16,
            right: -16,
            zIndex: 1,
            width: 34,
            height: 34,
            border: 'none',
            borderRadius: 999,
            background: '#fff',
            boxShadow: '0 6px 18px -6px rgba(13,13,17,.4)',
            color: c.body,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <div
          style={{
            display: 'flex',
            padding: 4,
            borderRadius: 999,
            background: 'rgba(255,255,255,.9)',
            boxShadow: '0 6px 18px -8px rgba(13,13,17,.3)',
            gap: 2,
            marginBottom: 14,
          }}
        >
          {(['login', 'signup'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setAuthMode(mode)}
              style={{
                minWidth: 96,
                padding: '9px 0',
                border: 'none',
                borderRadius: 999,
                fontSize: 13.5,
                fontWeight: 500,
                cursor: 'pointer',
                background: authMode === mode ? c.primary : 'transparent',
                color: authMode === mode ? '#fff' : c.textMuted,
              }}
            >
              {mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {isLogin ? (
          <SignIn routing="virtual" fallbackRedirectUrl="/" />
        ) : (
          <SignUp routing="virtual" fallbackRedirectUrl="/" />
        )}
      </div>
    </div>
  )
}
