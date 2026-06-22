import type { AuthUser } from '@/features/shared/auth'
import { api } from './client'

// Endpoints reais de autenticação do backend (Pedro):
//   POST /api/auth/login  { email, password } → { accessToken, tokenType, user }
//   POST /api/users       { name?, email, password } → AuthUser (registro)
//   GET  /api/users/me    (Bearer) → AuthUser
const AUTH_PATH = '/api/auth'
const USERS_PATH = '/api/users'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name?: string
  email: string
  password: string
}

/** Resposta do login: o token vai para o auth store como `token`. */
export interface LoginResponse {
  accessToken: string
  tokenType: string
  user: AuthUser
}

/** Autentica e devolve o token + usuário (401 em credenciais inválidas). */
export function login(input: LoginInput): Promise<LoginResponse> {
  return api.post<LoginResponse>(`${AUTH_PATH}/login`, input)
}

/** Cria a conta (409 se o e-mail já existir). Não autentica — chame login depois. */
export function register(input: RegisterInput): Promise<AuthUser> {
  return api.post<AuthUser>(USERS_PATH, input)
}

/** Usuário autenticado atual (valida o token no servidor). */
export function fetchMe(options?: { signal?: AbortSignal }): Promise<AuthUser> {
  return api.get<AuthUser>(`${USERS_PATH}/me`, { signal: options?.signal })
}
