import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import {
  ApiError,
  getAiUsageStats,
  getTokenStats,
  getVectorDbStats,
  listUsers,
  type AiUsageStats,
  type TokenStats,
  type UserOut,
  type VectorDbStats,
} from '@/lib/api'
import { c } from '@/lib/theme'

type LoadState = 'loading' | 'unauthenticated' | 'forbidden' | 'error' | 'ready'

export function AdminDashboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()

  const [state, setState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [users, setUsers] = useState<UserOut[]>([])
  const [vectorDb, setVectorDb] = useState<VectorDbStats | null>(null)
  const [aiUsage, setAiUsage] = useState<AiUsageStats | null>(null)
  const [tokens, setTokens] = useState<TokenStats | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState('unauthenticated')
      return
    }

    let cancelled = false

    getToken()
      .then(async (token) => {
        if (!token) throw new Error('No session token')

        const [usersRes, vectorRes, aiRes, tokenRes] = await Promise.all([
          listUsers(token),
          getVectorDbStats(token),
          getAiUsageStats(token),
          getTokenStats(token),
        ])

        if (cancelled) return
        setUsers(usersRes)
        setVectorDb(vectorRes)
        setAiUsage(aiRes)
        setTokens(tokenRes)
        setState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 403) {
          setState('forbidden')
        } else if (err instanceof ApiError && err.status === 401) {
          setState('unauthenticated')
        } else {
          setErrorMessage(err instanceof Error ? err.message : String(err))
          setState('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken])

  if (state === 'loading') return <CenteredNote text="Loading…" />
  if (state === 'unauthenticated') {
    return <CenteredNote text="Sign in on the main site first, then reload this page." />
  }
  if (state === 'forbidden') {
    return (
      <CenteredNote
        text={`${user?.primaryEmailAddress?.emailAddress ?? 'This account'} isn't an admin. Add it to ADMIN_EMAILS in .env and sign in again.`}
      />
    )
  }
  if (state === 'error') return <CenteredNote text={`Couldn't load admin data: ${errorMessage}`} />

  const adminCount = users.filter((u) => u.role === 'Admin').length
  const aiAdoptionPct = users.length
    ? Math.round(((aiUsage?.distinct_ai_users ?? 0) / users.length) * 100)
    : 0

  return (
    <div style={{ minHeight: '100vh', background: c.page, padding: '32px var(--page-pad) 80px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: c.ink, marginBottom: 4 }}>
          Admin dashboard
        </h1>
        <p style={{ fontSize: 14, color: c.textMuted, marginBottom: 28 }}>
          Signed in as {user?.primaryEmailAddress?.emailAddress}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
          <StatCard label="Registered users" value={users.length} />
          <StatCard label="Admins" value={adminCount} />
          <StatCard
            label="Users who've used AI"
            value={`${aiUsage?.distinct_ai_users ?? 0} (${aiAdoptionPct}%)`}
          />
          <StatCard
            label="Est. AI cost (30d)"
            value={tokens?.available ? `$${(tokens.estimated_cost_usd ?? 0).toFixed(2)}` : 'N/A'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 16 }}>
          <Panel title="Vector DB inventory (Qdrant, live)">
            {vectorDb && vectorDb.collections.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {vectorDb.collections.map((col) => (
                  <BarRow
                    key={col.key}
                    label={col.name}
                    sublabel={col.description}
                    value={col.points_count}
                    max={Math.max(...vectorDb.collections.map((c2) => c2.points_count), 1)}
                  />
                ))}
                <div style={{ fontSize: 12.5, color: c.textMuted, marginTop: 6 }}>
                  {vectorDb.total_points.toLocaleString()} total points across{' '}
                  {vectorDb.collections.length} collections
                </div>
              </div>
            ) : (
              <EmptyNote text="No vectors ingested yet." />
            )}
          </Panel>

          <Panel title="AI adoption">
            <Row label="Total chat runs" value={aiUsage?.total_runs ?? 0} />
            <Row label="Distinct users who used AI" value={aiUsage?.distinct_ai_users ?? 0} />
            <Row label="Registered users who haven't" value={Math.max(users.length - (aiUsage?.distinct_ai_users ?? 0), 0)} />
            <Row label="Anonymous runs (not signed in)" value={aiUsage?.anonymous_runs ?? 0} />
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${c.line}` }}>
              {Object.entries(aiUsage?.runs_by_status ?? {}).map(([status, count]) => (
                <Row key={status} label={`  · ${status}`} value={count} muted />
              ))}
            </div>
          </Panel>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Panel title="Token usage & cost (LangSmith, last 30 days)">
            {tokens?.available ? (
              <>
                <Row label="LLM calls" value={tokens.llm_call_count ?? 0} />
                <Row label="Prompt tokens" value={(tokens.total_prompt_tokens ?? 0).toLocaleString()} />
                <Row
                  label="Completion tokens"
                  value={(tokens.total_completion_tokens ?? 0).toLocaleString()}
                />
                <Row
                  label="Estimated cost"
                  value={`$${(tokens.estimated_cost_usd ?? 0).toFixed(4)}`}
                />
                {tokens.by_model && Object.keys(tokens.by_model).length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${c.line}` }}>
                    {Object.entries(tokens.by_model).map(([model, stats]) => (
                      <Row
                        key={model}
                        label={`  · ${model}`}
                        value={`${stats.runs} calls · $${stats.estimated_cost_usd.toFixed(4)}`}
                        muted
                      />
                    ))}
                  </div>
                )}
                <p style={{ marginTop: 10, fontSize: 11.5, color: c.textFaint }}>
                  List-price estimate, not the provider's actual invoice.
                </p>
              </>
            ) : (
              <EmptyNote text={tokens?.reason ?? 'LangSmith data unavailable.'} />
            )}
          </Panel>

          <Panel title="Registered users">
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {users.length === 0 ? (
                <EmptyNote text="No synced users yet." />
              ) : (
                users.map((u) => (
                  <div
                    key={u.user_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '7px 0',
                      borderBottom: `1px solid ${c.lineFaint}`,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: c.ink }}>{u.full_name || u.email}</span>
                    <span
                      style={{
                        color: u.role === 'Admin' ? c.primary : c.textMuted,
                        fontWeight: u.role === 'Admin' ? 600 : 400,
                      }}
                    >
                      {u.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <Panel title="Not yet tracked — needs new instrumentation">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.8, color: c.body }}>
            <li>
              <strong>Page visitors / active sessions.</strong> No request or session logging exists
              anywhere in the stack yet. Needs either a lightweight events table + a frontend beacon
              on page load, or a proper product-analytics tool (PostHog, Plausible) rather than
              building it bespoke.
            </li>
            <li>
              <strong>Per-user cost breakdown.</strong> LangSmith gives a project-wide token total,
              not per-user, unless chat runs are tagged with the user id as trace metadata.
            </li>
            <li>
              <strong>Non-LLM infra cost</strong> (Qdrant, Postgres, Neo4j hosting) isn't in the cost
              estimate above — it's LLM tokens only.
            </li>
          </ul>
        </Panel>

        <Panel title="Limitations of this dashboard">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.8, color: c.body }}>
            <li>
              Admin auth here decodes the Clerk session token without verifying its signature
              (matches the existing pattern in user-service) — fine for this prototype, not for a
              real deployment. Verify against Clerk's JWKS before shipping this for real.
            </li>
            <li>Costs are estimates from a hand-maintained pricing table — update it when providers reprice.</li>
            <li>"AI used" only counts signed-in users who called chat after this was wired up — earlier usage before that isn't attributable.</li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}

function CenteredNote({ text }: { text: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <p style={{ maxWidth: 420, fontSize: 15, color: c.body }}>{text}</p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${c.line}`,
        borderRadius: 16,
        padding: '18px 20px',
      }}
    >
      <div style={{ fontSize: 12.5, color: c.textMuted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: c.ink }}>{value}</div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${c.line}`,
        borderRadius: 16,
        padding: 20,
        marginBottom: 0,
      }}
    >
      <div style={{ fontSize: 14.5, fontWeight: 600, color: c.ink, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({
  label,
  value,
  muted,
}: {
  label: string
  value: string | number
  muted?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '5px 0',
        fontSize: 13.5,
        color: muted ? c.textMuted : c.body,
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 500, color: muted ? c.textMuted : c.ink }}>{value}</span>
    </div>
  )
}

function BarRow({
  label,
  sublabel,
  value,
  max,
}: {
  label: string
  sublabel: string
  value: number
  max: number
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
        <span style={{ color: c.ink, fontWeight: 500 }}>{label}</span>
        <span style={{ color: c.textMuted }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: c.muted, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: c.primary, borderRadius: 999 }} />
      </div>
      <div style={{ fontSize: 11, color: c.textFaint, marginTop: 2 }}>{sublabel}</div>
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <p style={{ fontSize: 13, color: c.textMuted }}>{text}</p>
}
