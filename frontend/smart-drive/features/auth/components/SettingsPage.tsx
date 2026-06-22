'use client'

import React from 'react'
import { sdVars as SD } from '@/lib/sd-vars'
import { Panel, Btn } from '@/features/shared/ui/primitives'
import { useAuthStore, useAuthUser } from '@/features/shared/auth'
import { useTheme } from '@/features/shared/theme/useTheme'

/**
 * Área do usuário: perfil real (vindo do auth store), preferência de tema
 * (claro/escuro) e logout. Só inclui configurações que têm efeito real —
 * nada de toggles decorativos.
 */
export function SettingsPage() {
  const user = useAuthUser()
  const clear = useAuthStore((s) => s.clear)
  const { theme, toggleTheme } = useTheme()

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 640,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxSizing: 'border-box',
      }}
    >
      <Panel title="PERFIL" kicker="CONTA" accent={SD.primary}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Row label="NOME" value={user?.name?.trim() || '—'} />
          <Row label="E-MAIL" value={user?.email || '—'} />
          <Row label="ID" value={user?.id || '—'} mono />
        </div>
      </Panel>

      <Panel title="APARÊNCIA" kicker="PREFERÊNCIAS">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div className="sd-label" style={{ fontSize: 10 }}>TEMA</div>
            <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, marginTop: 4 }}>
              {theme === 'dark' ? 'Escuro' : 'Claro'}
            </div>
          </div>
          <Btn tone="outline" size="md" onClick={toggleTheme}>
            {theme === 'dark' ? 'USAR CLARO' : 'USAR ESCURO'}
          </Btn>
        </div>
      </Panel>

      <Panel title="SESSÃO" kicker="CONTA" accent={SD.danger}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim }}>
            Encerrar a sessão neste dispositivo.
          </div>
          <Btn tone="danger" size="md" onClick={clear}>
            SAIR
          </Btn>
        </div>
      </Panel>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="sd-label" style={{ fontSize: 9, color: SD.textDim }}>{label}</div>
      <div
        className={mono ? 'sd-mono' : undefined}
        style={{ fontSize: 13, color: SD.text, wordBreak: 'break-all' }}
      >
        {value}
      </div>
    </div>
  )
}
