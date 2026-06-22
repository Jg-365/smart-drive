import { create } from 'zustand'

/**
 * Estado de autenticação do app. O login real (Pedro) devolve um JWT; este store
 * guarda { token, user } e o cliente HTTP (lib/api/client.ts) manda
 * `Authorization: Bearer <token>`. A sessão é persistida em localStorage para
 * sobreviver a reload (mesmo padrão seguro do useTheme — pode lançar em modo
 * privado, então é tudo try/catch).
 */
export interface AuthUser {
  id: string
  name?: string
  email?: string
}

export interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (auth: { token: string; user: AuthUser }) => void
  clear: () => void
}

const STORAGE_KEY = 'sd-auth'

interface PersistedAuth {
  token: string | null
  user: AuthUser | null
}

/** Lê a sessão persistida com segurança (localStorage pode lançar/estar vazio). */
function readStoredAuth(): PersistedAuth {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, user: null }
    const parsed = JSON.parse(raw) as PersistedAuth
    return {
      token: typeof parsed.token === 'string' ? parsed.token : null,
      user: parsed.user ?? null,
    }
  } catch {
    return { token: null, user: null }
  }
}

/** Persiste/limpa a sessão com segurança; falha silenciosa em modo privado. */
function writeStoredAuth(auth: PersistedAuth | null): void {
  try {
    if (auth?.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage indisponível — mantém só em memória
  }
}

const stored = typeof window !== 'undefined' ? readStoredAuth() : { token: null, user: null }

export const useAuthStore = create<AuthState>()((set) => ({
  token: stored.token,
  user: stored.user,
  setAuth: ({ token, user }) => {
    writeStoredAuth({ token, user })
    set({ token, user })
  },
  clear: () => {
    writeStoredAuth(null)
    set({ token: null, user: null })
  },
}))

/** Selector React: usuário autenticado (null se deslogado). */
export const useAuthUser = () => useAuthStore((s) => s.user)
/** Selector React: true se há sessão (token JWT real). */
export const useIsAuthenticated = () => useAuthStore((s) => s.token != null)

/**
 * Cabeçalhos de autenticação para o cliente HTTP, fora do React. Prioriza o JWT
 * real; na ausência dele, cai para o `x-user-id` de DEV (NEXT_PUBLIC_DEV_USER_ID).
 */
export function authHeaders(devUserId: string): Record<string, string> {
  const { token, user } = useAuthStore.getState()
  if (token) return { Authorization: `Bearer ${token}` }
  const id = user?.id ?? devUserId
  return id ? { 'x-user-id': id } : {}
}
