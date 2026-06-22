'use client'

import { useMutation } from '@tanstack/react-query'
import { login as apiLogin, register as apiRegister } from '@/lib/api/auth'
import type { LoginInput, RegisterInput } from '@/lib/api/auth'
import { useAuthStore } from '@/features/shared/auth'

/** Faz login e grava { token, user } no auth store (persistido). */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (input: LoginInput) => apiLogin(input),
    onSuccess: (res) => setAuth({ token: res.accessToken, user: res.user }),
  })
}

/** Registra a conta e já autentica (registro → login encadeado). */
export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      await apiRegister(input)
      return apiLogin({ email: input.email, password: input.password })
    },
    onSuccess: (res) => setAuth({ token: res.accessToken, user: res.user }),
  })
}
