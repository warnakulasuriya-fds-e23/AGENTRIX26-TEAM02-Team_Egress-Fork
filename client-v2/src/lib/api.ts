/**
 * Thin fetch wrapper around the API gateway (Kong). Base URL is baked in at
 * build time via VITE_API_URL (see docker-compose.yml / .env).
 */
const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => undefined)
    throw new ApiError(`Request to ${path} failed with ${res.status}`, res.status, body)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, undefined, token),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, token),
}

export interface ChatRequest {
  message: string
  conversation_id?: string | null
  user_id?: string | null
}

/** Mirrors ai-service's ItineraryItem schema (app/schemas/ai.py). */
export interface AgentItineraryItem {
  type: 'hotel' | 'activity' | 'transport' | 'meal'
  time?: string | null
  title: string
  location?: string | null
  notes?: string | null
  image_url?: string | null
  website?: string | null
}

/** Mirrors ai-service's ItineraryDay schema. */
export interface AgentItineraryDay {
  date?: string | null
  location?: string | null
  items: AgentItineraryItem[]
}

/** Mirrors ai-service's Itinerary schema — the real, agent-generated trip plan. */
export interface AgentItinerary {
  destination?: string | null
  start_date?: string | null
  end_date?: string | null
  days: AgentItineraryDay[]
}

export interface ChatResponse {
  conversation_id: string
  reply: string
  plan_changed: boolean
  itinerary?: AgentItinerary | null
}

/** Real "Ask AI" call — routed through Kong to the ai-service's LangGraph agent. */
export const chatWithAgent = (payload: ChatRequest) => api.post<ChatResponse>('/ai/chat', payload)

// --- Users (user-service, via Kong) -----------------------------------------

export interface UserOut {
  user_id: string
  full_name: string
  email: string
  role: 'Admin' | 'User'
  created_at: string
}

/** Upserts the signed-in Clerk user into user-service; sets role from ADMIN_EMAILS. */
export const syncUser = (token: string) => api.post<{ status: string; role: string }>('/users/sync', undefined, token)

export const getMe = (token: string) => api.get<UserOut>('/users/me', token)

export const listUsers = (token: string) => api.get<UserOut[]>('/users', token)

// --- Admin stats (ai-service, via Kong) -------------------------------------

export interface VectorDbStats {
  total_points: number
  collections: Array<{ key: string; name: string; description: string; points_count: number }>
}

export interface AiUsageStats {
  total_runs: number
  distinct_ai_users: number
  anonymous_runs: number
  runs_by_status: Record<string, number>
}

export interface TokenStats {
  available: boolean
  reason?: string
  window_days?: number
  llm_call_count?: number
  total_prompt_tokens?: number
  total_completion_tokens?: number
  total_tokens?: number
  estimated_cost_usd?: number
  by_model?: Record<
    string,
    { runs: number; prompt_tokens: number; completion_tokens: number; estimated_cost_usd: number }
  >
}

export const getVectorDbStats = (token: string) => api.get<VectorDbStats>('/ai/admin/vector-db', token)
export const getAiUsageStats = (token: string) => api.get<AiUsageStats>('/ai/admin/ai-usage', token)
export const getTokenStats = (token: string) => api.get<TokenStats>('/ai/admin/tokens', token)
