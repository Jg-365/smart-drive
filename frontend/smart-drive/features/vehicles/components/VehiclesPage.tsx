'use client';

import React, { useState } from 'react';
import { sdVars as SD } from '@/lib/sd-vars';
import { Icon } from '@/features/shared/ui/icons';
import { Tag, Btn, Panel } from '@/features/shared/ui/primitives';
import { ApiError } from '@/lib/api';
import type { Vehicle } from '@/features/shared/types';
import {
  useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle,
} from '../hooks';
import type { VehicleFormParsed } from '../schema';
import { VehicleForm, FUEL_LABELS, type VehicleFormInitial } from './VehicleForm';

type Mode = { kind: 'idle' } | { kind: 'create' } | { kind: 'edit'; vehicle: Vehicle };

function toInitial(v: Vehicle): VehicleFormInitial {
  return {
    brand: v.brand, model: v.model, year: String(v.year), engine: v.engine,
    fuelType: v.fuelType, tankCapacityLiters: String(v.tankCapacityLiters),
    baseUrbanConsumptionKmL: String(v.baseUrbanConsumptionKmL),
    baseHighwayConsumptionKmL: String(v.baseHighwayConsumptionKmL),
    baseMixedConsumptionKmL: String(v.baseMixedConsumptionKmL),
    weightKg: v.weightKg != null ? String(v.weightKg) : '',
  };
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return 'Veículo não encontrado ou pertence a outro usuário.';
    if (err.status === 400) return 'Dados inválidos — verifique os campos e tente novamente.';
    return `Falha na operação (${err.status}).`;
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}

export function VehiclesPage() {
  const { data: vehicles, isLoading, isError, refetch } = useVehicles();
  const createM = useCreateVehicle();
  const updateM = useUpdateVehicle();
  const deleteM = useDeleteVehicle();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [serverError, setServerError] = useState<string | null>(null);

  const list = vehicles ?? [];
  const selected = list.find((v) => v.id === selectedId) ?? list[0] ?? null;

  const openCreate = () => { setServerError(null); setMode({ kind: 'create' }); };
  const openEdit = (v: Vehicle) => { setServerError(null); setMode({ kind: 'edit', vehicle: v }); };
  const closeForm = () => { setServerError(null); setMode({ kind: 'idle' }); };

  const handleCreate = (data: VehicleFormParsed) => {
    setServerError(null);
    createM.mutate(data, {
      onSuccess: (created) => { setSelectedId(created.id); closeForm(); },
      onError: (err) => setServerError(describeError(err)),
    });
  };

  const handleUpdate = (id: string, data: VehicleFormParsed) => {
    setServerError(null);
    updateM.mutate({ id, input: data }, {
      onSuccess: (updated) => { setSelectedId(updated.id); closeForm(); },
      onError: (err) => setServerError(describeError(err)),
    });
  };

  const handleDelete = (v: Vehicle) => {
    if (!window.confirm(`Excluir ${v.brand} ${v.model}?`)) return;
    deleteM.mutate(v.id, {
      onSuccess: () => { if (selectedId === v.id) setSelectedId(null); },
    });
  };

  return (
    <div style={{
      height: '100%', overflow: 'auto', background: SD.bg, padding: 24,
      display: 'grid', gap: 16, gridTemplateColumns: '320px 1fr', alignContent: 'start',
    }}>
      {/* LEFT: Vehicle list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="sd-display" style={{ fontSize: 18 }}>VEÍCULOS</span>
          {/* Quando a lista está vazia, o CTA único é o do estado vazio (auditoria D-005). */}
          {list.length > 0 && (
            <Btn tone="outline" size="sm" icon={Icon.plus(12)} onClick={openCreate}>NOVO</Btn>
          )}
        </div>

        {isLoading && (
          <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, padding: 14 }}>Carregando veículos…</div>
        )}

        {isError && (
          <div style={{ padding: 14, border: `1px solid ${SD.danger}`, background: SD.dangerSoft }}>
            <div className="sd-mono" style={{ fontSize: 12, color: SD.danger, marginBottom: 8 }}>
              Falha ao carregar veículos.
            </div>
            <Btn tone="outline" size="sm" onClick={() => refetch()}>TENTAR NOVAMENTE</Btn>
          </div>
        )}

        {!isLoading && !isError && list.length === 0 && (
          <div style={{ padding: 18, border: `1px dashed ${SD.border}`, textAlign: 'center' }}>
            <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, marginBottom: 12 }}>
              Nenhum veículo cadastrado.
            </div>
            <Btn tone="primary" size="sm" icon={Icon.plus(12)} onClick={openCreate}>CADASTRAR VEÍCULO</Btn>
          </div>
        )}

        <div data-testid="vehicle-list" style={{ display: 'grid', gap: 8 }}>
          {list.map((v) => {
            const active = selected?.id === v.id;
            return (
              <div
                key={v.id}
                className="sd-btn"
                role="button"
                tabIndex={0}
                onClick={() => { setSelectedId(v.id); if (mode.kind !== 'idle') closeForm(); }}
                style={{
                  padding: 14,
                  border: `1.5px solid ${active ? SD.primary : SD.border}`,
                  background: active ? 'rgba(0,229,255,0.05)' : SD.surface,
                  display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12,
                }}
              >
                <div style={{
                  width: 36, height: 36, background: SD.surface2, border: `1px solid ${SD.border}`,
                  display: 'grid', placeItems: 'center', color: active ? SD.primary : SD.textDim,
                }}>
                  {Icon.car(18)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span className="sd-label" style={{ fontSize: 9, color: SD.textDim }}>{v.brand.toUpperCase()}</span>
                    {active && <Tag tone="cyan">SELECIONADO</Tag>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{v.model}</div>
                  <div className="sd-mono" style={{ fontSize: 10, color: SD.textDim, display: 'flex', gap: 10 }}>
                    <span>{v.year}</span>
                    <span>{v.baseMixedConsumptionKmL} km/L</span>
                    <span>{v.tankCapacityLiters}L</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: detail or form */}
      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        {mode.kind === 'create' && (
          <VehicleForm
            title="NOVO VEÍCULO"
            kicker="CADASTRO"
            submitLabel="CADASTRAR"
            submitting={createM.isPending}
            serverError={serverError}
            onSubmit={handleCreate}
            onCancel={closeForm}
          />
        )}

        {mode.kind === 'edit' && (
          <VehicleForm
            title={`EDITAR · ${mode.vehicle.model}`}
            kicker="EDIÇÃO"
            submitLabel="SALVAR"
            submitting={updateM.isPending}
            serverError={serverError}
            initial={toInitial(mode.vehicle)}
            onSubmit={(data) => handleUpdate(mode.vehicle.id, data)}
            onCancel={closeForm}
          />
        )}

        {mode.kind === 'idle' && selected && (
          <Panel
            title={`${selected.brand} ${selected.model}`}
            kicker={`${selected.year} · ${FUEL_LABELS[selected.fuelType]}`}
            accent={SD.primary}
            tools={
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn tone="outline" size="sm" onClick={() => openEdit(selected)}>EDITAR</Btn>
                <Btn
                  tone="ghost" size="sm"
                  style={{ color: SD.danger, borderColor: 'rgba(255,51,68,0.4)' }}
                  onClick={() => handleDelete(selected)}
                >
                  EXCLUIR
                </Btn>
              </div>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Field label="MARCA" value={selected.brand} />
              <Field label="MODELO" value={selected.model} />
              <Field label="ANO" value={String(selected.year)} />
              <Field label="MOTOR" value={selected.engine} />
              <Field label="COMBUSTÍVEL" value={FUEL_LABELS[selected.fuelType]} />
              <Field label="PESO (kg)" value={selected.weightKg != null ? String(selected.weightKg) : '—'} />
              <Field label="CONSUMO URBANO" value={`${selected.baseUrbanConsumptionKmL} km/L`} accent={SD.primary} />
              <Field label="CONSUMO RODOVIÁRIO" value={`${selected.baseHighwayConsumptionKmL} km/L`} accent={SD.primary} />
              <Field label="CONSUMO MISTO" value={`${selected.baseMixedConsumptionKmL} km/L`} accent={SD.primary} />
              <Field label="TANQUE" value={`${selected.tankCapacityLiters} L`} />
              <Field label="FATOR DE CALIBRAÇÃO" value={String(selected.calibrationFactor)} />
            </div>
          </Panel>
        )}

        {mode.kind === 'idle' && !selected && !isLoading && !isError && (
          <Panel title="DETALHES" accent={SD.primary}>
            <div className="sd-mono" style={{ fontSize: 12, color: SD.textDim, lineHeight: 1.6 }}>
              Selecione um veículo na lista ou cadastre um novo para ver e editar os detalhes.
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="sd-label" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
      <div style={{
        padding: '10px 12px', background: SD.surface2, border: `1px solid ${SD.border}`,
        color: accent || SD.text, fontSize: 13, fontWeight: 500,
      }} className={accent ? 'sd-mono' : ''}>
        {value}
      </div>
    </div>
  );
}
