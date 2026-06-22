import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/mocks/server'
import { useAuthStore } from '@/features/shared/auth'
import { LoginScreen } from '../LoginScreen'

function renderLogin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LoginScreen />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useAuthStore.getState().clear()
})
afterEach(() => {
  useAuthStore.getState().clear()
})

describe('LoginScreen', () => {
  it('faz login e grava token + usuário no auth store', async () => {
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string }
        expect(body.email).toBe('joao@ex.com')
        return HttpResponse.json({
          accessToken: 'jwt-123',
          tokenType: 'Bearer',
          user: { id: 'u1', name: 'João', email: 'joao@ex.com' },
        })
      }),
    )

    renderLogin()
    fireEvent.change(screen.getByLabelText('E-MAIL'), { target: { value: 'joao@ex.com' } })
    fireEvent.change(screen.getByLabelText('SENHA'), { target: { value: 'segredo' } })
    fireEvent.click(screen.getByText('ENTRAR'))

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('jwt-123')
    })
    expect(useAuthStore.getState().user?.id).toBe('u1')
  })

  it('mostra mensagem amigável em credenciais inválidas (401)', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ message: 'nope' }, { status: 401 }),
      ),
    )

    renderLogin()
    fireEvent.change(screen.getByLabelText('E-MAIL'), { target: { value: 'x@y.com' } })
    fireEvent.change(screen.getByLabelText('SENHA'), { target: { value: 'errada' } })
    fireEvent.click(screen.getByText('ENTRAR'))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('alterna para registro e cria conta + autentica (registro → login)', async () => {
    let registered = false
    server.use(
      http.post('/api/users', () => {
        registered = true
        return HttpResponse.json({ id: 'u2', email: 'novo@ex.com' }, { status: 201 })
      }),
      http.post('/api/auth/login', () =>
        HttpResponse.json({
          accessToken: 'jwt-novo',
          tokenType: 'Bearer',
          user: { id: 'u2', email: 'novo@ex.com' },
        }),
      ),
    )

    renderLogin()
    fireEvent.click(screen.getByText('NÃO TEM CONTA? CRIAR CONTA'))
    fireEvent.change(screen.getByLabelText('E-MAIL'), { target: { value: 'novo@ex.com' } })
    fireEvent.change(screen.getByLabelText('SENHA'), { target: { value: 'segredo' } })
    fireEvent.click(screen.getByText('CRIAR CONTA'))

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('jwt-novo')
    })
    expect(registered).toBe(true)
  })
})
