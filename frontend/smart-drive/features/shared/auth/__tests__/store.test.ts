import { beforeEach, describe, expect, it } from 'vitest'
import { authHeaders, useAuthStore } from '../store'

beforeEach(() => useAuthStore.getState().clear())

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
