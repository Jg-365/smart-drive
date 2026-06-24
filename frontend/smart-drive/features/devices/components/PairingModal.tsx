'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Btn } from '@/features/shared/ui/primitives';

const SETUP_AP_SSID = 'SmartDrive-Setup';

export function PairingModal({ onClose }: { onClose: () => void }) {
  const steps = [
    'Ligue o SmartDrive. Na primeira vez (ou após resetar), ele cria uma rede Wi-Fi própria.',
    `No celular, abra o Wi-Fi e conecte-se à rede "${SETUP_AP_SSID}" (rede aberta, sem senha).`,
    'A tela de configuração abre sozinha. Se não abrir, acesse http://192.168.4.1 no navegador.',
    'Escolha a rede do local (ou o seu roteador/hotspot), digite a senha e toque em Conectar.',
    'O SmartDrive reinicia, conecta à rede e começa a transmitir. O status fica ONLINE aqui.',
  ];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Parear dispositivo"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50,
        display: 'grid', placeItems: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 100%)', maxHeight: '90vh', overflow: 'auto',
          background: SD.surface, border: `1.5px solid ${SD.primary}`, padding: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="sd-display" style={{ fontSize: 16 }}>PAREAR DISPOSITIVO</span>
          <Btn tone="ghost" size="sm" onClick={onClose} aria-label="Fechar">FECHAR</Btn>
        </div>
        <div style={{ fontSize: 12, color: SD.textDim, lineHeight: 1.5, marginBottom: 16 }}>
          A configuração de Wi-Fi é feita no próprio SmartDrive. Siga os passos no celular:
        </div>

        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10, alignItems: 'start' }}>
              <span className="sd-mono" style={{
                width: 24, height: 24, display: 'grid', placeItems: 'center',
                background: SD.surface2, border: `1px solid ${SD.primary}`, color: SD.primary,
                fontSize: 12, fontWeight: 700,
              }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: SD.text, lineHeight: 1.5, paddingTop: 2 }}>{s}</span>
            </li>
          ))}
        </ol>

        <div style={{
          marginTop: 16, padding: 12, background: SD.surface2, border: `1px solid ${SD.border}`,
          fontSize: 12, color: SD.textDim, lineHeight: 1.5,
        }}>
          <span className="sd-label" style={{ fontSize: 9, color: SD.primary }}>REDE DE CONFIGURAÇÃO</span>
          <div className="sd-mono" style={{ fontSize: 13, color: SD.text, marginTop: 4 }}>{SETUP_AP_SSID}</div>
        </div>
      </div>
    </div>
  );
}
