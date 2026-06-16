import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FuelType, type Vehicle } from '@/features/shared/types'
import { server } from '@/mocks/server'
import { VehiclesPage } from '../VehiclesPage'

// Store local e determinístico por teste, substituindo os handlers globais via server.use().
let db: Map<string, Vehicle>
let idSeq: number

function makeVehicle(partial: Partial<Vehicle>): Vehicle {
  return {
    id: `v-${++idSeq}`, ownerId: 'owner-001', calibrationFactor: 1,
    createdAt: '2024-01-15T10:00:00.000Z',
    brand: 'Marca', model: 'Modelo', year: 2022, engine: '1.0', fuelType: FuelType.FLEX,
    tankCapacityLiters: 40, baseUrbanConsumptionKmL: 12, baseHighwayConsumptionKmL: 15,
    baseMixedConsumptionKmL: 13, weightKg: 1000, ...partial,
  }
}

function useVehicleApi(seed: Vehicle[] = []) {
  db = new Map(seed.map((v) => [v.id, v]))
  server.use(
    http.get('/api/vehicles', () => HttpResponse.json([...db.values()])),
    http.post('/api/vehicles', async ({ request }) => {
      const body = (await request.json()) as Partial<Vehicle>
      const v = makeVehicle(body)
      db.set(v.id, v)
      return HttpResponse.json(v, { status: 201 })
    }),
    http.patch('/api/vehicles/:id', async ({ params, request }) => {
      const existing = db.get(params.id as string)
      if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      const body = (await request.json()) as Partial<Vehicle>
      const updated = { ...existing, ...body }
      db.set(updated.id, updated)
      return HttpResponse.json(updated)
    }),
    http.delete('/api/vehicles/:id', ({ params }) => {
      db.delete(params.id as string)
      return new HttpResponse(null, { status: 204 })
    }),
  )
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <VehiclesPage />
    </QueryClientProvider>,
  )
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('MARCA'), { target: { value: 'Honda' } })
  fireEvent.change(screen.getByLabelText('MODELO'), { target: { value: 'Civic' } })
  fireEvent.change(screen.getByLabelText('ANO'), { target: { value: '2023' } })
  fireEvent.change(screen.getByLabelText('MOTOR'), { target: { value: '2.0' } })
  fireEvent.change(screen.getByLabelText('COMBUSTÍVEL'), { target: { value: FuelType.GASOLINE } })
  fireEvent.change(screen.getByLabelText('CONSUMO URBANO (km/L)'), { target: { value: '11' } })
  fireEvent.change(screen.getByLabelText('CONSUMO RODOVIÁRIO (km/L)'), { target: { value: '15' } })
  fireEvent.change(screen.getByLabelText('CONSUMO MISTO (km/L)'), { target: { value: '13' } })
  fireEvent.change(screen.getByLabelText('TANQUE (L)'), { target: { value: '50' } })
}

async function findInList(text: string) {
  return within(await screen.findByTestId('vehicle-list')).findByText(text)
}

beforeEach(() => { idSeq = 0 })
afterEach(() => vi.restoreAllMocks())

describe('VehiclesPage (JOA-RF-01/02)', () => {
  it('lista os veículos do usuário (aparecem após carregar)', async () => {
    useVehicleApi([
      makeVehicle({ id: 'v-a', brand: 'Chevrolet', model: 'Onix' }),
      makeVehicle({ id: 'v-b', brand: 'Fiat', model: 'Argo' }),
    ])
    renderPage()
    expect(await findInList('Onix')).toBeInTheDocument()
    expect(await findInList('Argo')).toBeInTheDocument()
  })

  it('estado vazio quando não há veículos', async () => {
    useVehicleApi([])
    renderPage()
    expect(await screen.findByText('Nenhum veículo cadastrado.')).toBeInTheDocument()
  })

  it('SPEC: veículo criado aparece imediatamente na listagem (UI atualiza)', async () => {
    useVehicleApi([])
    renderPage()
    fireEvent.click(await screen.findByText('CADASTRAR VEÍCULO'))
    fillValidForm()
    fireEvent.click(screen.getByText('CADASTRAR'))
    expect(await findInList('Civic')).toBeInTheDocument()
  })

  it('SPEC: edição atualiza o veículo e a UI após salvar', async () => {
    useVehicleApi([makeVehicle({ id: 'v-a', brand: 'Chevrolet', model: 'Onix', baseMixedConsumptionKmL: 13 })])
    renderPage()
    fireEvent.click(await findInList('Onix'))
    fireEvent.click(screen.getByText('EDITAR'))
    fireEvent.change(screen.getByLabelText('MODELO'), { target: { value: 'Onix Plus' } })
    fireEvent.click(screen.getByText('SALVAR'))
    expect(await findInList('Onix Plus')).toBeInTheDocument()
  })

  it('SPEC: campos inválidos no cadastro exibem erro e não salvam', async () => {
    useVehicleApi([])
    renderPage()
    fireEvent.click(await screen.findByText('CADASTRAR VEÍCULO'))
    fireEvent.click(screen.getByText('CADASTRAR'))
    expect(screen.getByText('Marca é obrigatório')).toBeInTheDocument()
    // continua no formulário (botão de submit ainda visível)
    expect(screen.getByText('CADASTRAR')).toBeInTheDocument()
  })

  it('exclui veículo após confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    useVehicleApi([
      makeVehicle({ id: 'v-a', brand: 'Chevrolet', model: 'Onix' }),
      makeVehicle({ id: 'v-b', brand: 'Fiat', model: 'Argo' }),
    ])
    renderPage()
    fireEvent.click(await findInList('Onix'))
    fireEvent.click(screen.getByText('EXCLUIR'))
    await waitFor(() =>
      expect(within(screen.getByTestId('vehicle-list')).queryByText('Onix')).not.toBeInTheDocument(),
    )
    expect(within(screen.getByTestId('vehicle-list')).getByText('Argo')).toBeInTheDocument()
  })

  it('SPEC: erro 404 ao editar (veículo de outro usuário) é exibido', async () => {
    useVehicleApi([makeVehicle({ id: 'v-a', brand: 'Chevrolet', model: 'Onix' })])
    server.use(
      http.patch('/api/vehicles/:id', () => HttpResponse.json({ error: 'Not found' }, { status: 404 })),
    )
    renderPage()
    fireEvent.click(await findInList('Onix'))
    fireEvent.click(screen.getByText('EDITAR'))
    fireEvent.change(screen.getByLabelText('MODELO'), { target: { value: 'Onix X' } })
    fireEvent.click(screen.getByText('SALVAR'))
    expect(await screen.findByText(/pertence a outro usuário/)).toBeInTheDocument()
  })

  it('mostra erro de carregamento e permite tentar de novo', async () => {
    server.use(http.get('/api/vehicles', () => HttpResponse.json({ error: 'boom' }, { status: 500 })))
    renderPage()
    expect(await screen.findByText('Falha ao carregar veículos.')).toBeInTheDocument()
    expect(screen.getByText('TENTAR NOVAMENTE')).toBeInTheDocument()
  })
})
