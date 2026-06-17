import { create } from 'zustand'

/**
 * Estado de autenticação do app. Hoje o backend usa um guard placeholder
 * (TempUserGuard, header `x-user-id`) até o JWT real do Pedro (PED-RF-02). Este
 * store já modela o token para que, quando o login real existir, baste preencher
 * `token` — o cliente HTTP (lib/api/client.ts) passa a mandar `Authorization:
 * Bearer <token>` no lugar do `x-user-id`. Ver docs/bloqueios-equipe-001.xml.
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

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  setAuth: ({ token, user }) => set({ token, user }),
  clear: () => set({ token: null, user: null }),
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
