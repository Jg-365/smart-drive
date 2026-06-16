'use client'

import React, { useState } from 'react'
import { sdVars as SD } from '@/lib/sd-vars'
import { Btn, Panel } from '@/features/shared/ui/primitives'
import { FuelType } from '@/features/shared/types'
import {
  validateVehicleForm,
  type VehicleFormParsed,
  type VehicleFormErrors,
} from '../schema'

export interface VehicleFormInitial {
  brand?: string
  model?: string
  year?: string
  engine?: string
  fuelType?: string
  tankCapacityLiters?: string
  baseUrbanConsumptionKmL?: string
  baseHighwayConsumptionKmL?: string
  baseMixedConsumptionKmL?: string
  weightKg?: string
}

interface VehicleFormProps {
  /** Valores iniciais (modo edição). Ausente = formulário em branco (criação). */
  initial?: VehicleFormInitial
  title: string
  kicker: string
  submitLabel: string
  submitting?: boolean
  /** Erro vindo do servidor (ex: 400/404), exibido acima dos botões. */
  serverError?: string | null
  onSubmit: (data: VehicleFormParsed) => void
  onCancel: () => void
}

export const FUEL_LABELS: Record<FuelType, string> = {
  [FuelType.GASOLINE]: 'Gasolina',
  [FuelType.ETHANOL]: 'Etanol',
  [FuelType.FLEX]: 'Flex',
  [FuelType.DIESEL]: 'Diesel',
  [FuelType.ELECTRIC]: 'Elétrico',
  [FuelType.HYBRID]: 'Híbrido',
}

const EMPTY: Required<VehicleFormInitial> = {
  brand: '', model: '', year: '', engine: '', fuelType: '',
  tankCapacityLiters: '', baseUrbanConsumptionKmL: '',
  baseHighwayConsumptionKmL: '', baseMixedConsumptionKmL: '', weightKg: '',
}

export function VehicleForm({
  initial, title, kicker, submitLabel, submitting = false, serverError, onSubmit, onCancel,
}: VehicleFormProps) {
  const [values, setValues] = useState<Required<VehicleFormInitial>>({ ...EMPTY, ...initial })
  const [errors, setErrors] = useState<VehicleFormErrors>({})

  const set = (key: keyof VehicleFormInitial) => (v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }))

  const handleSubmit = () => {
    if (submitting) return
    const result = validateVehicleForm(values)
    if (!result.success || !result.data) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    onSubmit(result.data)
  }

  return (
    <Panel title={title} kicker={kicker} accent={SD.primary}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <TextField label="MARCA" value={values.brand} onChange={set('brand')} error={errors.brand} />
        <TextField label="MODELO" value={values.model} onChange={set('model')} error={errors.model} />
        <TextField label="ANO" value={values.year} onChange={set('year')} error={errors.year} inputMode="numeric" />
        <TextField label="MOTOR" value={values.engine} onChange={set('engine')} error={errors.engine} />
        <SelectField
          label="COMBUSTÍVEL"
          value={values.fuelType}
          onChange={set('fuelType')}
          error={errors.fuelType}
          options={Object.values(FuelType).map((f) => ({ value: f, label: FUEL_LABELS[f] }))}
        />
        <TextField label="PESO (kg) · OPCIONAL" value={values.weightKg} onChange={set('weightKg')} error={errors.weightKg} inputMode="numeric" />
        <TextField label="CONSUMO URBANO (km/L)" value={values.baseUrbanConsumptionKmL} onChange={set('baseUrbanConsumptionKmL')} error={errors.baseUrbanConsumptionKmL} inputMode="decimal" />
        <TextField label="CONSUMO RODOVIÁRIO (km/L)" value={values.baseHighwayConsumptionKmL} onChange={set('baseHighwayConsumptionKmL')} error={errors.baseHighwayConsumptionKmL} inputMode="decimal" />
        <TextField label="CONSUMO MISTO (km/L)" value={values.baseMixedConsumptionKmL} onChange={set('baseMixedConsumptionKmL')} error={errors.baseMixedConsumptionKmL} inputMode="decimal" />
        <TextField label="TANQUE (L)" value={values.tankCapacityLiters} onChange={set('tankCapacityLiters')} error={errors.tankCapacityLiters} inputMode="decimal" />
      </div>

      {serverError && (
        <div role="alert" className="sd-mono" style={{
          marginTop: 16, padding: '10px 12px', fontSize: 12,
          color: SD.danger, background: SD.dangerSoft, border: `1px solid ${SD.danger}`,
        }}>
          {serverError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
        <Btn tone="ghost" size="md" onClick={onCancel}>CANCELAR</Btn>
        <Btn
          tone="primary"
          size="md"
          onClick={handleSubmit}
          style={submitting ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
        >
          {submitting ? 'SALVANDO…' : submitLabel}
        </Btn>
      </div>
    </Panel>
  )
}

function TextField({
  label, value, onChange, error, inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label style={{ display: 'block' }}>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
      <input
        aria-label={label}
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', background: SD.surface2,
          border: `1px solid ${error ? SD.danger : SD.border}`, color: SD.text,
          fontSize: 13, fontFamily: SD.fontMono, outline: 'none',
        }}
      />
      {error && <div role="alert" style={{ color: SD.danger, fontSize: 10, marginTop: 4 }}>{error}</div>}
    </label>
  )
}

function SelectField({
  label, value, onChange, error, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  options: { value: string; label: string }[]
}) {
  return (
    <label style={{ display: 'block' }}>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', background: SD.surface2,
          border: `1px solid ${error ? SD.danger : SD.border}`, color: value ? SD.text : SD.textMute,
          fontSize: 13, fontFamily: SD.fontMono, outline: 'none',
        }}
      >
        <option value="">Selecione…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <div role="alert" style={{ color: SD.danger, fontSize: 10, marginTop: 4 }}>{error}</div>}
    </label>
  )
}
