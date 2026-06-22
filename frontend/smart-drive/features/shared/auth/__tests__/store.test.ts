import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { authHeaders, useAuthStore } from '../store'

const STORAGE_KEY = 'sd-auth'

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clear()
})
afterEach(() => localStorage.clear())

describe('authHeaders', () => {
  it('sem token e sem devUserId → sem header de auth', () => {
    expect(authHeaders('')).toEqual({})
  })

  it('sem token, com devUserId → x-user-id (placeholder TempUserGuard)', () => {
    expect(authHeaders('user-dev-001')).toEqual({ 'x-user-id': 'user-dev-001' })
  })

  it('com token JWT → Authorization Bearer (tem prioridade sobre o devUserId)', () => {
    useAuthStore.getState().setAuth({ token: 'jwt-abc', user: { id: 'u1' } })
    expect(authHeaders('user-dev-001')).toEqual({ Authorization: 'Bearer jwt-abc' })
  })

  it('sem token, com user no store → usa o id do user', () => {
    useAuthStore.setState({ token: null, user: { id: 'u-from-store' } })
    expect(authHeaders('fallback')).toEqual({ 'x-user-id': 'u-from-store' })
  })
})

describe('persistência da sessão', () => {
  it('setAuth grava token + usuário no localStorage', () => {
    useAuthStore.getState().setAuth({ token: 't1', user: { id: 'u1', email: 'a@b.com' } })

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(persisted.token).toBe('t1')
    expect(persisted.user.id).toBe('u1')
  })

  it('clear remove a sessão do localStorage', () => {
    useAuthStore.getState().setAuth({ token: 't1', user: { id: 'u1' } })
    useAuthStore.getState().clear()

    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
