'use client'

import React, { useState } from 'react'
import { sdVars as SD } from '@/lib/sd-vars'
import { Btn } from '@/features/shared/ui/primitives'
import { ApiError } from '@/lib/api'
import { useLogin, useRegister } from '../hooks'

type Mode = 'login' | 'register'

/** Mensagem amigável a partir do erro da API (sem vazar detalhes técnicos). */
function friendlyError(err: unknown, mode: Mode): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'E-mail ou senha inválidos.'
    if (err.status === 409) return 'Este e-mail já está cadastrado.'
    const body = err.body as { message?: string | string[] } | null
    const msg = body?.message
    if (Array.isArray(msg)) return msg[0]
    if (typeof msg === 'string') return msg
  }
  return mode === 'login'
    ? 'Não foi possível entrar. Tente novamente.'
    : 'Não foi possível criar a conta. Tente novamente.'
}

/**
 * Tela de autenticação (porta de entrada do app). Login e registro no mesmo
 * formulário, mobile-first e centrada. Em sucesso, o auth store recebe o token e
 * o AuthGate (app/page.tsx) troca para o app. Sem dados fixos: tudo vem do form.
 */
export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const loginM = useLogin()
  const registerM = useRegister()
  const pending = loginM.isPending || registerM.isPending
  const error = loginM.error ?? registerM.error

  function submit() {
    if (pending) return
    const e = email.trim().toLowerCase()
    if (!e || !password) return
    if (mode === 'login') {
      loginM.mutate({ email: e, password })
    } else {
      registerM.mutate({ name: name.trim() || undefined, email: e, password })
    }
  }

  return (
    <div
      className="sd-root"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: SD.bg,
        padding: 20,
        boxSizing: 'border-box',
      }}
    >
      <form
        onSubmit={(ev) => {
          ev.preventDefault()
          submit()
        }}
        style={{
          width: '100%',
          maxWidth: 380,
          background: SD.surface,
          border: `1.5px solid ${SD.border}`,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div className="sd-display" style={{ fontSize: 26, letterSpacing: '-0.02em', color: SD.text }}>
            SMART<span style={{ color: SD.primary }}>DRIVE</span>
          </div>
          <div className="sd-label" style={{ fontSize: 9, color: SD.textDim, marginTop: 6 }}>
            {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
          </div>
        </div>

        {mode === 'register' && (
          <Field
            label="NOME (OPCIONAL)"
            value={name}
            onChange={setName}
            autoComplete="name"
          />
        )}
        <Field
          label="E-MAIL"
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
          inputMode="email"
        />
        <Field
          label="SENHA"
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {mode === 'register' && (
          <div className="sd-mono" style={{ fontSize: 10, color: SD.textMute }}>
            Mínimo de 6 caracteres.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="sd-mono"
            style={{
              fontSize: 11,
              padding: '8px 10px',
              color: SD.danger,
              background: SD.dangerSoft,
              border: `1px solid ${SD.danger}`,
            }}
          >
            {friendlyError(error, mode)}
          </div>
        )}

        <Btn
          tone="primary"
          size="lg"
          full
          onClick={submit}
          disabled={pending || !email.trim() || !password}
        >
          {pending ? 'AGUARDE…' : mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
        </Btn>

        <button
          type="button"
          className="sd-btn sd-label"
          onClick={() => {
            setMode((m) => (m === 'login' ? 'register' : 'login'))
            loginM.reset()
            registerM.reset()
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: SD.textDim,
            fontSize: 10,
            letterSpacing: '0.10em',
            padding: 4,
          }}
        >
          {mode === 'login'
            ? 'NÃO TEM CONTA? CRIAR CONTA'
            : 'JÁ TEM CONTA? ENTRAR'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label style={{ display: 'block' }}>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
      <input
        aria-label={label}
        value={value}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 12px',
          background: SD.surface2,
          border: `1px solid ${SD.border}`,
          color: SD.text,
          fontSize: 14,
          fontFamily: SD.fontMono,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </label>
  )
}
