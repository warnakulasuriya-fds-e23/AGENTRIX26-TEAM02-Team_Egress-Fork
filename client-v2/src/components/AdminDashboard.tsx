import { useCallback, useEffect, useState } from 'react'
import { useAuth, useUser, UserButton } from '@clerk/clerk-react'
import {
  ApiError,
  getAgentActivity,
  getAiUsageStats,
  getFeedbackStats,
  getQueriesByMonth,
  getTokenStats,
  getVectorDbStats,
  getVisitorStats,
  listUsers,
  type AgentActivityRun,
  type AiUsageStats,
  type FeedbackStats,
  type QueriesByMonth,
  type TokenStats,
  type UserOut,
  type VectorDbStats,
  type VisitorStats,
} from '@/lib/api'
import { Icon, type IconName } from '@/components/ui/Icon'
import { c } from '@/lib/theme'

type LoadState = 'loading' | 'unauthenticated' | 'forbidden' | 'error' | 'ready'

type SectionId =
  | 'overview'
  | 'agents'
  | 'visitors'
  | 'archives'
  | 'live-chat'
  | 'feedback'
  | 'widget'
  | 'data-sync'
  | 'settings'
  | 'marketing'

interface NavItem {
  id: SectionId
  label: string
  icon: IconName
  /** Real feature backed by real data. Unimplemented ones render an honest stub. */
  implemented: boolean
  stubReason?: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'AutoMode', implemented: true },
  { id: 'agents', label: 'Agents', icon: 'Explore', implemented: true },
  { id: 'visitors', label: 'Visitors', icon: 'Diversity', implemented: true },
  {
    id: 'archives',
    label: 'Archives',
    icon: 'Luggage',
    implemented: false,
    stubReason: 'No archival/export feature exists yet.',
  },
  {
    id: 'live-chat',
    label: 'Live Chat',
    icon: 'Mood',
    implemented: false,
    stubReason:
      "This product is AI-only right now — there's no human-agent handoff, realtime chat transport, or staff-side reply UI. Building this for real needs those first, not just a dashboard page.",
  },
  { id: 'feedback', label: 'Feedbacks', icon: 'Shield', implemented: true },
  {
    id: 'widget',
    label: 'Widget Config',
    icon: 'Settings',
    implemented: false,
    stubReason: "This app isn't embedded as a widget on third-party sites, so there's nothing to configure here.",
  },
  {
    id: 'data-sync',
    label: 'Data Sync',
    icon: 'LocationOn',
    implemented: false,
    stubReason: 'Content ingestion already runs via /api/ai/data (OSM/weather providers) — no separate sync UI yet.',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    implemented: false,
    stubReason: 'Model/tier config exists at the API level (llm_config routes) but has no admin UI yet.',
  },
  { id: 'marketing', label: 'Marketing (SEO/AEO)', icon: 'Search', implemented: true },
]

interface DashboardData {
  users: UserOut[]
  vectorDb: VectorDbStats
  aiUsage: AiUsageStats
  tokens: TokenStats
  visitors: VisitorStats
  activity: AgentActivityRun[]
  feedback: FeedbackStats
  queriesByMonth: QueriesByMonth
}

export function AdminDashboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()

  const [state, setState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [section, setSection] = useState<SectionId>('overview')

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setState('unauthenticated')
      return
    }
    try {
      const token = await getToken()
      if (!token) throw new Error('No session token')

      const [users, vectorDb, aiUsage, tokens, visitors, activityRes, feedback, queriesByMonth] =
        await Promise.all([
          listUsers(token),
          getVectorDbStats(token),
          getAiUsageStats(token),
          getTokenStats(token),
          getVisitorStats(token),
          getAgentActivity(token),
          getFeedbackStats(token),
          getQueriesByMonth(token),
        ])

      setData({
        users,
        vectorDb,
        aiUsage,
        tokens,
        visitors,
        activity: activityRes.runs,
        feedback,
        queriesByMonth,
      })
      setLastUpdated(new Date())
      setState('ready')
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setState('forbidden')
      else if (err instanceof ApiError && err.status === 401) setState('unauthenticated')
      else {
        setErrorMessage(err instanceof Error ? err.message : String(err))
        setState('error')
      }
    }
  }, [isSignedIn, getToken])

  useEffect(() => {
    if (!isLoaded) return
    load()
  }, [isLoaded, load])

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
  if (!data) return null

  const activeNav = NAV_ITEMS.find((n) => n.id === section)!

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.page }}>
      <Sidebar section={section} onSelect={setSection} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar title={activeNav.label} lastUpdated={lastUpdated} onRefresh={load} />

        <div style={{ flex: 1, padding: '24px 28px 60px', overflowY: 'auto' }}>
          {!activeNav.implemented ? (
            <StubPanel label={activeNav.label} reason={activeNav.stubReason ?? ''} />
          ) : section === 'overview' ? (
            <OverviewSection data={data} />
          ) : section === 'agents' ? (
            <AgentsSection activity={data.activity} />
          ) : section === 'visitors' ? (
            <VisitorsSection visitors={data.visitors} users={data.users} />
          ) : section === 'feedback' ? (
            <FeedbackSection feedback={data.feedback} />
          ) : section === 'marketing' ? (
            <MarketingSection />
          ) : null}
        </div>
      </div>
    </div>
  )
}

// --- Shell -------------------------------------------------------------

function Sidebar({
  section,
  onSelect,
}: {
  section: SectionId
  onSelect: (s: SectionId) => void
}) {
  const { user } = useUser()
  return (
    <aside
      style={{
        width: 232,
        flex: 'none',
        background: '#fff',
        borderRight: `1px solid ${c.line}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 20px' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 10,
            background: c.primary,
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            flex: 'none',
          }}
        >
          c
        </span>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: c.ink }}>Admin Dashboard</div>
          <div style={{ fontSize: 11.5, color: c.textMuted }}>ceylontrips</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.id === section
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                border: 'none',
                borderRadius: 10,
                background: active ? c.primaryTint : 'transparent',
                color: active ? c.primary : item.implemented ? c.body : c.textFaint,
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
              {!item.implemented && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    color: c.textFaint,
                    border: `1px solid ${c.lineStrong}`,
                    borderRadius: 999,
                    padding: '1px 6px',
                  }}
                >
                  N/A
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 8px',
          marginTop: 8,
          borderTop: `1px solid ${c.line}`,
        }}
      >
        <UserButton afterSignOutUrl="/" />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: c.ink,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.fullName || user?.primaryEmailAddress?.emailAddress}
          </div>
          <div style={{ fontSize: 11, color: c.textMuted }}>Admin</div>
        </div>
      </div>
    </aside>
  )
}

function Topbar({
  title,
  lastUpdated,
  onRefresh,
}: {
  title: string
  lastUpdated: Date | null
  onRefresh: () => void
}) {
  const [refreshing, setRefreshing] = useState(false)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 28px',
        borderBottom: `1px solid ${c.line}`,
        background: '#fff',
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600, color: c.ink, margin: 0 }}>{title}</h1>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12.5, color: c.textMuted }}>
          {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : ''}
        </span>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true)
            Promise.resolve(onRefresh()).finally(() => setRefreshing(false))
          }}
          data-hover="outline"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 32,
            padding: '0 12px',
            border: `1px solid ${c.lineStrong}`,
            borderRadius: 8,
            background: '#fff',
            color: c.body,
            fontSize: 12.5,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}

// --- Overview ------------------------------------------------------------

function OverviewSection({ data }: { data: DashboardData }) {
  const maxMonth = Math.max(...data.queriesByMonth.months.map((m) => m.count), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        <StatCard label="Total visitors" sub="All visits" value={data.visitors.total_visits} />
        <StatCard
          label="Registered visitors"
          sub="Signed in"
          value={data.visitors.registered_visitors}
        />
        <StatCard label="Active now" sub="Last 15 min" value={data.visitors.active_now} />
        <StatCard label="Total AI runs" sub="Chat + plan" value={data.aiUsage.total_runs} />
        <StatCard
          label="Est. AI cost (30d)"
          sub={data.tokens.available ? `${data.tokens.llm_call_count} calls` : 'N/A'}
          value={data.tokens.available ? `$${(data.tokens.estimated_cost_usd ?? 0).toFixed(2)}` : 'N/A'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <Panel title="User queries" subtitle="Monthly query volume, from agent_runs">
          {data.queriesByMonth.months.length === 0 ? (
            <EmptyNote text="No queries yet." />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, padding: '0 4px' }}>
              {data.queriesByMonth.months.map((m) => (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 34,
                      height: Math.max(4, (m.count / maxMonth) * 140),
                      borderRadius: '6px 6px 0 0',
                      background: c.primary,
                    }}
                    title={`${m.month}: ${m.count}`}
                  />
                  <span style={{ fontSize: 10.5, color: c.textMuted }}>{m.month.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent agent activity" subtitle="Real-time from agent_runs">
          {data.activity.length === 0 ? (
            <EmptyNote text="No runs yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 190, overflowY: 'auto' }}>
              {data.activity.slice(0, 6).map((run) => (
                <ActivityRow key={run.id} run={run} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Panel title="Feedback analyze" subtitle="Positive or negative">
          <FeedbackBars byRating={data.feedback.by_rating} />
        </Panel>
        <Panel title="Feedback by category" subtitle="Feedback distribution across categories">
          {Object.keys(data.feedback.by_category).length === 0 ? (
            <EmptyNote text="No feedback yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(data.feedback.by_category).map(([cat, count]) => (
                <Row key={cat} label={cat} value={count} />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

// --- Agents ----------------------------------------------------------------

function AgentsSection({ activity }: { activity: AgentActivityRun[] }) {
  return (
    <Panel title="Agent activity log" subtitle="Every orchestration run, most recent first — real data from agent_runs">
      {activity.length === 0 ? (
        <EmptyNote text="No runs yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activity.map((run) => (
            <ActivityRow key={run.id} run={run} />
          ))}
        </div>
      )}
    </Panel>
  )
}

function ActivityRow({ run }: { run: AgentActivityRun }) {
  const statusColor =
    run.status === 'completed' ? c.greenInk : run.status === 'failed' ? c.primary : c.amberInk
  const statusBg =
    run.status === 'completed' ? c.greenTint : run.status === 'failed' ? c.primaryTint : c.amberTint
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        border: `1px solid ${c.line}`,
        borderRadius: 10,
        fontSize: 13,
      }}
    >
      <span
        style={{
          padding: '3px 9px',
          borderRadius: 5,
          background: statusBg,
          color: statusColor,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          flex: 'none',
        }}
      >
        {run.status}
      </span>
      <span style={{ color: c.ink, fontWeight: 500 }}>{run.run_type}</span>
      <span style={{ color: c.textMuted, fontSize: 12 }}>
        {run.user_id ? `user ${run.user_id.slice(0, 12)}…` : 'anonymous'}
      </span>
      <span style={{ marginLeft: 'auto', color: c.textFaint, fontSize: 11.5, flex: 'none' }}>
        {new Date(run.created_at).toLocaleString()}
      </span>
    </div>
  )
}

// --- Visitors ----------------------------------------------------------------

function VisitorsSection({ visitors, users }: { visitors: VisitorStats; users: UserOut[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        <StatCard label="Total visits" sub="All page loads" value={visitors.total_visits} />
        <StatCard label="Unique visitors" sub="By browser" value={visitors.unique_visitors} />
        <StatCard label="Registered" sub="Signed in" value={visitors.registered_visitors} />
        <StatCard label="Active now" sub="Last 15 min" value={visitors.active_now} />
        <StatCard label="Active last 24h" sub="Unique" value={visitors.unique_last_24h} />
      </div>
      <Panel
        title="How this is measured"
        subtitle="Read before trusting these numbers for anything important"
      >
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.8, color: c.body }}>
          <li>
            "Unique visitor" = a random id stored in the browser's localStorage on first visit — it
            resets if the user clears storage or switches browsers/devices, so it undercounts real
            unique people.
          </li>
          <li>"Active now" is a 15-minute heartbeat window from page-load beacons, not a live websocket presence signal.</li>
          <li>{users.length} accounts are registered in total (see the Overview panel for the breakdown by role).</li>
        </ul>
      </Panel>
    </div>
  )
}

// --- Feedback ----------------------------------------------------------------

function FeedbackSection({ feedback }: { feedback: FeedbackStats }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Panel title="Feedback analyze" subtitle="Positive or negative">
          <FeedbackBars byRating={feedback.by_rating} />
        </Panel>
        <Panel title="Feedback by category" subtitle="Feedback distribution across categories">
          {Object.keys(feedback.by_category).length === 0 ? (
            <EmptyNote text="No feedback yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(feedback.by_category).map(([cat, count]) => (
                <Row key={cat} label={cat} value={count} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Recent feedback" subtitle="Most recent first">
        {feedback.recent.length === 0 ? (
          <EmptyNote text="No feedback submitted yet — thumbs up/down on an AI reply on the main site to test this." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {feedback.recent.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  border: `1px solid ${c.line}`,
                  borderRadius: 10,
                  fontSize: 13,
                }}
              >
                <Icon
                  name={item.rating === 'up' ? 'ThumbUp' : 'ThumbDown'}
                  size={14}
                  color={item.rating === 'up' ? c.greenInk : c.primary}
                />
                <span style={{ color: c.textMuted, fontSize: 12 }}>{item.category ?? 'uncategorized'}</span>
                {item.comment && <span style={{ color: c.body }}>{item.comment}</span>}
                <span style={{ marginLeft: 'auto', color: c.textFaint, fontSize: 11.5, flex: 'none' }}>
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

function FeedbackBars({ byRating }: { byRating: Record<string, number> }) {
  const up = byRating.up ?? 0
  const down = byRating.down ?? 0
  const total = up + down
  if (total === 0) return <EmptyNote text="No feedback yet." />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <BarRow label="Positive" icon="ThumbUp" value={up} max={total} color={c.greenInk} />
      <BarRow label="Negative" icon="ThumbDown" value={down} max={total} color={c.primary} />
    </div>
  )
}

// --- Marketing (SEO/AEO) -----------------------------------------------------

type CheckStatus = 'pass' | 'warn' | 'fail' | 'checking'

interface CheckResult {
  label: string
  status: CheckStatus
  detail: string
}

/**
 * Live audit, not a mock report: reads the actual rendered <head> and fetches
 * the actual deployed /robots.txt, /sitemap.xml, /llms.txt. If these ever go
 * stale or get removed, this panel will honestly show them as failing.
 */
function MarketingSection() {
  const [checks, setChecks] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const results: CheckResult[] = []

      const title = document.title
      results.push({
        label: 'Title tag',
        status: title.length > 10 && title.length <= 70 ? 'pass' : 'warn',
        detail: title ? `"${title}" (${title.length} chars)` : 'Missing',
      })

      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
      results.push({
        label: 'Meta description',
        status: description.length > 50 && description.length <= 160 ? 'pass' : description ? 'warn' : 'fail',
        detail: description ? `${description.length} chars` : 'Missing',
      })

      const ogTags = ['og:title', 'og:description', 'og:type', 'og:image'].map(
        (p) => !!document.querySelector(`meta[property="${p}"]`),
      )
      results.push({
        label: 'Open Graph tags',
        status: ogTags.every(Boolean) ? 'pass' : ogTags.some(Boolean) ? 'warn' : 'fail',
        detail: `${ogTags.filter(Boolean).length}/4 present (title, description, type, image)`,
      })

      const jsonLd = document.querySelector('script[type="application/ld+json"]')
      results.push({
        label: 'Structured data (JSON-LD)',
        status: jsonLd ? 'pass' : 'fail',
        detail: jsonLd ? 'Organization/WebSite schema present' : 'Missing — helps both SEO rich results and AEO entity understanding',
      })

      const canonical = document.querySelector('link[rel="canonical"]')
      results.push({
        label: 'Canonical URL',
        status: canonical ? 'pass' : 'warn',
        detail: canonical ? canonical.getAttribute('href') || '' : 'Not set — fine on localhost, required at deploy',
      })

      for (const [path, label] of [
        ['/robots.txt', 'robots.txt'],
        ['/sitemap.xml', 'sitemap.xml'],
        ['/llms.txt', 'llms.txt (AEO)'],
      ] as const) {
        try {
          const res = await fetch(path, { method: 'GET' })
          results.push({
            label,
            status: res.ok ? 'pass' : 'fail',
            detail: res.ok ? `HTTP ${res.status}` : `HTTP ${res.status} — not served`,
          })
        } catch {
          results.push({ label, status: 'fail', detail: 'Request failed' })
        }
      }

      if (!cancelled) {
        setChecks(results)
        setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: c.primaryTint,
          border: `1px solid ${c.primary}33`,
          borderRadius: 16,
          padding: 18,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: c.primaryHover, marginBottom: 6 }}>
          Biggest lever, not covered by any checklist item below
        </div>
        <p style={{ fontSize: 13.5, color: c.body, lineHeight: 1.6, margin: 0 }}>
          This is a pure client-side React SPA — the server sends an empty{' '}
          <code>&lt;div id="root"&gt;&lt;/div&gt;</code> and content only appears after JS runs.
          Google's crawler mostly copes with that (with delay), but most AI answer engines that
          cite sources (Perplexity, ChatGPT browsing, many others) don't execute JavaScript at
          all — they may see nothing but the title and meta description. The highest-impact AEO
          fix here is server-side rendering or prerendering static HTML for at least the
          marketing/home content, not just the tags below.
        </p>
      </div>

      <Panel title="Live technical SEO/AEO checklist" subtitle="Checked against the currently deployed build, not a static claim">
        {loading ? (
          <EmptyNote text="Checking…" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {checks.map((chk) => (
              <CheckRow key={chk.label} result={chk} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="What else belongs in a real marketing setup" subtitle="Not built — needs external tools/integrations, not just this dashboard">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.85, color: c.body }}>
          <li>
            <strong>Search Console / Bing Webmaster Tools</strong> — actual indexing status, search
            queries, and click-through data. Nothing here can show real search traffic without
            connecting to those.
          </li>
          <li>
            <strong>Analytics</strong> (GA4 or privacy-friendly alternative like Plausible) — traffic
            sources, referrers, conversion funnels. The Visitors panel only has our own beacon, not
            channel attribution.
          </li>
          <li>
            <strong>FAQ / HowTo structured data</strong> on real content pages (e.g. "best time to
            visit Ella") — both a rich-result SEO win and one of the clearest AEO signals, since
            answer engines lean on FAQ schema heavily.
          </li>
          <li>
            <strong>llms.txt kept current</strong> — added at <code>/llms.txt</code>, but it's a
            hand-written snapshot; update it when the product's scope changes.
          </li>
          <li>
            <strong>Page speed / Core Web Vitals</strong> — affects both SEO ranking and whether
            crawlers bother rendering JS-heavy pages at all.
          </li>
        </ul>
      </Panel>
    </div>
  )
}

function CheckRow({ result }: { result: CheckResult }) {
  const colors: Record<CheckStatus, { bg: string; color: string; label: string }> = {
    pass: { bg: c.greenTint, color: c.greenInk, label: 'Pass' },
    warn: { bg: c.amberTint, color: c.amberInk, label: 'Warn' },
    fail: { bg: c.primaryTint, color: c.primary, label: 'Fail' },
    checking: { bg: c.muted, color: c.textMuted, label: '…' },
  }
  const style = colors[result.status]
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        border: `1px solid ${c.line}`,
        borderRadius: 10,
        fontSize: 13,
      }}
    >
      <span
        style={{
          padding: '3px 9px',
          borderRadius: 5,
          background: style.bg,
          color: style.color,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          flex: 'none',
          width: 44,
          textAlign: 'center',
        }}
      >
        {style.label}
      </span>
      <span style={{ color: c.ink, fontWeight: 500, flex: 'none' }}>{result.label}</span>
      <span style={{ color: c.textMuted, marginLeft: 'auto', textAlign: 'right' }}>{result.detail}</span>
    </div>
  )
}

// --- Shared bits -------------------------------------------------------------

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

function StubPanel({ label, reason }: { label: string; reason: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px dashed ${c.lineStrong}`,
        borderRadius: 16,
        padding: 32,
        textAlign: 'center',
        maxWidth: 560,
        margin: '40px auto',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: c.ink, marginBottom: 8 }}>
        {label} isn't built yet
      </div>
      <p style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.6 }}>{reason}</p>
    </div>
  )
}

function StatCard({ label, sub, value }: { label: string; sub: string; value: string | number }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${c.line}`,
        borderRadius: 16,
        padding: '16px 18px',
      }}
    >
      <div style={{ fontSize: 12.5, color: c.textMuted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: c.ink }}>{value}</div>
      <div style={{ fontSize: 11.5, color: c.textFaint, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${c.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: c.ink }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 14 }}>{subtitle}</div>}
      <div style={{ marginTop: subtitle ? 0 : 14 }}>{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5 }}>
      <span style={{ color: c.body }}>{label}</span>
      <span style={{ fontWeight: 500, color: c.ink }}>{value}</span>
    </div>
  )
}

function BarRow({
  label,
  icon,
  value,
  max,
  color,
}: {
  label: string
  icon: IconName
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 4 }}>
        <Icon name={icon} size={13} color={color} />
        <span style={{ color: c.ink, fontWeight: 500 }}>{label}</span>
        <span style={{ marginLeft: 'auto', color: c.textMuted }}>
          {value} ({pct}%)
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: c.muted, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
      </div>
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <p style={{ fontSize: 13, color: c.textMuted }}>{text}</p>
}
